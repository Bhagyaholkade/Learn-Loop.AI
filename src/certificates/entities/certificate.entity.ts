
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { Course } from '../../courses/entities/course.entity';

@Entity('certificates')
@Unique('UQ_certificate_student_course', ['student', 'course'])
export class Certificate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
  })
  certificateNumber: string;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  student: User;

  @ManyToOne(() => Course, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  course: Course;

  @CreateDateColumn()
  issuedAt: Date;
}
