
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { Quiz } from './quiz.entity';

export interface SubmittedAnswer {
  questionId: number;
  selectedOptionIndex: number;
}

@Entity('quiz_attempts')
export class QuizAttempt {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  student: User;

  @ManyToOne(() => Quiz, {
    onDelete: 'CASCADE',
  })
  quiz: Quiz;

  @Column({ type: 'json' })
  answers: SubmittedAnswer[];

  @Column({ type: 'int', default: 0 })
  obtainedMarks: number;

  @Column({ type: 'int', default: 0 })
  totalMarks: number;

  @Column({ type: 'boolean', default: false })
  isPassed: boolean;

  @Column({ type: 'datetime', nullable: true })
  submittedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
