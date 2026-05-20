import { BaseMessage } from '@langchain/core/messages';

export interface ComprehensionState {
  messages: BaseMessage[];
  tasks: string[];
  current_task: string;
  generated_docs: string[];
  confidence_score: 'HIGH' | 'MEDIUM' | 'LOW';
}
