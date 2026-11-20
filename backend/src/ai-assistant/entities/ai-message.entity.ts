
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';

import { AiConversation } from './ai-conversation.entity';

export enum AiMessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

@Entity('ai_messages')
@Index(['conversation', 'createdAt'])
export class AiMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => AiConversation, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  conversation: AiConversation;

  @Column({
    type: 'enum',
    enum: AiMessageRole,
  })
  role: AiMessageRole;

  @Column({ type: 'longtext' })
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}
