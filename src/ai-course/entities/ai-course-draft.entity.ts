
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';


import type { GeneratedCourseOutline } from '../interfaces/generated-course-outline.interface';
export enum AiCourseDraftStatus {
  DRAFT = 'draft',
  CONVERTED = 'converted',
}

@Entity('ai_course_drafts')
@Index(['adminId', 'status'])
export class AiCourseDraft {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  adminId: number;

  @Column({ length: 150 })
  topic: string;

  @Column({ type: 'text' })
  instructions: string;

@Column({ type: 'varchar', length: 100, nullable: true })
targetAudience: string | null;

@Column({ type: 'varchar', length: 50, nullable: true })
difficulty: string | null;

  @Column({ type: 'int', nullable: true })
  numberOfChapters: number | null;

  @Column({ type: 'int', nullable: true })
  lessonsPerChapter: number | null;

  @Column({ type: 'json' })
  outline: GeneratedCourseOutline;

  @Column({
    type: 'enum',
    enum: AiCourseDraftStatus,
    default: AiCourseDraftStatus.DRAFT,
  })
  status: AiCourseDraftStatus;

  @Column({ type: 'int', nullable: true })
  courseId: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
