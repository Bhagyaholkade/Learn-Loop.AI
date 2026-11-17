
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Course } from '../../courses/entities/course.entity';
import { Chapter } from '../../chapters/entities/chapter.entity';

import {
  LessonAiContent,
} from '../interfaces/lesson-ai-content.interface';

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  // Existing lesson description/content
  @Column({ type: 'text', nullable: true })
  content: string | null;

  // Detailed AI-generated lesson content
  @Column({ type: 'json', nullable: true })
  aiContent: LessonAiContent | null;

  @Column({ type: 'int', default: 1 })
  order: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  videoUrl: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  pdfUrl: string | null;

  @Column({ type: 'json', nullable: true })
  objectives: string[] | null;

  @Column({ type: 'json', nullable: true })
  resources: string[] | null;

  // Course relationship
  @ManyToOne(() => Course, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  course: Course;

  // Chapter relationship
  @ManyToOne(() => Chapter, (chapter) => chapter.lessons, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  chapter: Chapter | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
