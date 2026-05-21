import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infra/database/prisma.service';
import { AgentService } from '../../../comprehension/agent.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly agentService: AgentService,
  ) {}

  async createConversation(projectId: string, userId: string) {
    return this.prisma.conversation.create({
      data: { projectId, userId },
    });
  }

  async listConversations(projectId: string, userId: string) {
    return this.prisma.conversation.findMany({
      where: { projectId, userId },
      orderBy: { createdAt: 'desc' },
      include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } },
    });
  }

  async getMessages(conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(conversationId: string, content: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const userMessage = await this.persistUserMessage(conversationId, content);

    const agentResult = await this.runAgent(content);

    const assistantMessage = await this.persistAssistantMessage(
      conversationId,
      agentResult,
    );

    return { userMessage, assistantMessage };
  }

  private async persistUserMessage(conversationId: string, content: string) {
    return this.prisma.message.create({
      data: { conversationId, role: 'user', content },
    });
  }

  private async runAgent(content: string) {
    try {
      return await this.agentService.run(content);
    } catch (err) {
      this.logger.error('Agent execution failed', err);
      return { docs: ['Erro ao processar a consulta.'], confidence: 'LOW' };
    }
  }

  private async persistAssistantMessage(
    conversationId: string,
    agentResult: { docs: string[]; confidence: string },
  ) {
    const responseContent = agentResult.docs.join('\n\n');
    return this.prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: responseContent,
        confidence: agentResult.confidence,
      },
    });
  }
}
