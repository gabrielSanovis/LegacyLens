import { Injectable, Logger } from '@nestjs/common';
import { StateGraph, END, START } from '@langchain/langgraph';
import { BaseMessage, HumanMessage } from '@langchain/core/messages';
import { GraphRagService } from './graph-rag.service';
import { ComprehensionState } from './types';
import { DynamicTool } from '@langchain/core/tools';
import { ChatOpenAI } from '@langchain/openai';
import { SettingsService } from '../api/v1/settings/settings.service';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    private readonly graphRagService: GraphRagService,
    private readonly settingsService: SettingsService,
  ) {}

  private async getLlm() {
    const settings = await this.settingsService.getSettings();
    const apiKey = settings?.apiKey || process.env.OPENAI_API_KEY;
    const isOpenRouter = settings?.llmProvider === 'openrouter';
    return new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: isOpenRouter ? 'openai/gpt-4o-mini' : 'gpt-4o-mini',
      configuration: {
        baseURL: isOpenRouter ? 'https://openrouter.ai/api/v1' : undefined,
      },
    });
  }

  private setupTools(): DynamicTool[] {
    const searchSimilar = new DynamicTool({
      name: 'search_similar',
      description: 'Search for code chunks using a natural language query.',
      func: async (input: string) => {
        return this.graphRagService.retrieveContext(input);
      },
    });

    return [searchSimilar];
  }

  private async plannerNode(state: ComprehensionState) {
    const llm = await this.getLlm();
    const userQuery = state.messages[0].content as string;

    const prompt = `You are a planner. Given the user request: "${userQuery}", output a single task string to gather information.`;
    const response = await llm.invoke([new HumanMessage(prompt)]);

    return {
      tasks: [response.content as string],
      current_task: response.content as string,
    };
  }

  private async executorNode(state: ComprehensionState) {
    const llm = await this.getLlm();
    const tools = this.setupTools();
    const llmWithTools = llm.bindTools(tools);

    const prompt = `You are the executor. Your task is: "${state.current_task}". 
    You have tools to search code. Call search_similar if needed, and write the documentation.`;

    const response = await llmWithTools.invoke([new HumanMessage(prompt)]);

    // Simplification for the graph: if it returns tool_calls, we mock executing them for now,
    // or just assume we run a basic retrieval if no tool agent loop is implemented yet.
    // In a full LangGraph, we'd have a tools node. For now, we execute the tool directly if called.
    let doc = response.content as string;
    let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';

    if (response.tool_calls && response.tool_calls.length > 0) {
      const toolCall = response.tool_calls[0];
      if (toolCall.name === 'search_similar') {
        const context = await this.graphRagService.retrieveContext(
          (toolCall.args.input as string) || state.current_task,
        );
        const finalPrompt = `Context found:\n${context}\n\nWrite the documentation for: ${state.current_task}`;
        const finalResponse = await llm.invoke([new HumanMessage(finalPrompt)]);
        doc = finalResponse.content as string;
        confidence = context.length > 100 ? 'HIGH' : 'MEDIUM';
      }
    } else if (doc.length > 50) {
      confidence = 'MEDIUM';
    }

    return {
      generated_docs: [...(state.generated_docs || []), doc],
      confidence_score: confidence,
    };
  }

  private buildGraph() {
    const graphState = {
      messages: {
        value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
        default: () => [],
      },
      tasks: { value: (x: string[], y: string[]) => y, default: () => [] },
      current_task: { value: (x: string, y: string) => y, default: () => '' },
      generated_docs: {
        value: (x: string[], y: string[]) => x.concat(y),
        default: () => [],
      },
      confidence_score: {
        value: (x: string, y: string) => y,
        default: () => 'LOW',
      },
    };

    const workflow = new StateGraph<ComprehensionState>({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      channels: graphState as any,
    })
      .addNode('planner', async (state) => this.plannerNode(state))
      .addNode('executor', async (state) => this.executorNode(state))
      .addEdge(START, 'planner')
      .addEdge('planner', 'executor')
      .addEdge('executor', END);

    return workflow.compile();
  }

  async run(query: string): Promise<{ docs: string[]; confidence: string }> {
    try {
      const app = this.buildGraph();
      const initialState = {
        messages: [new HumanMessage(query)],
        tasks: [],
        current_task: '',
        generated_docs: [],
        confidence_score: 'LOW',
      };

      const finalState = (await app.invoke(
        initialState,
      )) as unknown as ComprehensionState;
      return {
        docs: finalState.generated_docs,
        confidence: finalState.confidence_score,
      };
    } catch (err) {
      this.logger.error('Error running LangGraph agent', err);
      throw err;
    }
  }
}
