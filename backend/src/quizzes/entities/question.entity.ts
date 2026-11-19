
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Quiz } from './quiz.entity';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  questionText: string;

  @Column({ type: 'json' })
  options: string[];

  // Zero-based index: 0, 1, 2 or 3
  @Column({ type: 'int' })
  correctOptionIndex: number;

  @Column({ type: 'int', default: 1 })
  marks: number;

  @Column({ type: 'int', default: 1 })
  order: number;

  @Column({ type: 'text', nullable: true })
  explanation: string | null;

  @ManyToOne(() => Quiz, (quiz) => quiz.questions, {
    onDelete: 'CASCADE',
  })
  quiz: Quiz;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
