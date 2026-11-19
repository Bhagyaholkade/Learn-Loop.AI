
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Course } from '../../courses/entities/course.entity';
import { Lesson } from '../../lessons/entities/lesson.entity';
import { Question } from './question.entity';
import { QuizAttempt } from './quiz-attempt.entity';
import { Chapter } from '../../chapters/entities/chapter.entity';

export enum QuizType {
  CHAPTER = 'CHAPTER',
  FINAL = 'FINAL',
}
export enum QuizReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
}
@Entity('quizzes')
export class Quiz {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int', default: 30 })
  durationMinutes: number;

  @Column({ type: 'int', default: 0 })
  totalMarks: number;

  @Column({ type: 'int', default: 40 })
  passingMarks: number;

  @Column({ type: 'boolean', default: false })
  isPublished: boolean;

  // CHAPTER or FINAL assessment
  @Column({
    type: 'enum',
    enum: QuizType,
    default: QuizType.FINAL,
  })
  quizType: QuizType;

  // Chapter quizzes can be associated with a lesson.
  // Final assessments do not require a lesson.
  @ManyToOne(() => Lesson, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  lesson: Lesson | null;

  // Indicates whether this quiz was generated using AI.
  @Column({ type: 'boolean', default: false })
  isAiGenerated: boolean;

  @ManyToOne(() => Course, {
    onDelete: 'CASCADE',
  })
  course: Course;

@Column({
  type: 'enum',
  enum: QuizReviewStatus,
  default: QuizReviewStatus.PENDING,
})
reviewStatus: QuizReviewStatus;

  @OneToMany(() => Question, (question) => question.quiz)
  questions: Question[];

  @OneToMany(() => QuizAttempt, (attempt) => attempt.quiz)
  attempts: QuizAttempt[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

// Chapter association for chapter-wise quizzes
@ManyToOne(() => Chapter, {
  nullable: true,
  onDelete: 'CASCADE',
})
chapter: Chapter | null;

}
