
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { Lesson } from '../../lessons/entities/lesson.entity';

export enum AiConversationMode {
  LESSON = 'LESSON',
  GENERAL = 'GENERAL',
}

@Entity('ai_conversations')
@Index(['student', 'lesson'])
@Index('IDX_ai_conversations_student_mode', ['student', 'mode'])
export class AiConversation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  title: string | null;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  student: User;

  @Column({
    type: 'varchar',
    length: 20,
    default: AiConversationMode.LESSON,
  })
  mode: AiConversationMode;

  @ManyToOne(() => Lesson, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  lesson: Lesson | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
