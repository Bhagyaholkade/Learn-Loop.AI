
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Progress } from './entities/progress.entity';
import { User } from '../users/entities/user.entity';
import { Lesson } from '../lessons/entities/lesson.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(Progress)
    private readonly progressRepository: Repository<Progress>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,

    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,

  ) {}

  async markCompleted(
    studentId: number,
    lessonId: number,
  ): Promise<Progress> {
    const student = await this.userRepository.findOne({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const existing = await this.progressRepository.findOne({
      where: {
        student: { id: studentId },
        lesson: { id: lessonId },
      },
    });

    if (existing) {
      if (existing.isCompleted) {
        throw new ConflictException('Lesson is already completed');
      }

      existing.isCompleted = true;
      return this.progressRepository.save(existing);
    }

    const progress = this.progressRepository.create({
      student,
      lesson,
      isCompleted: true,
    });

    return this.progressRepository.save(progress);
  }

  async getMyProgress(studentId: number): Promise<Progress[]> {
    return this.progressRepository.find({
      where: { student: { id: studentId } },
      relations: { lesson: true },
      order: { updatedAt: 'DESC' },
    });
  }

  

async getCourseProgressSummary(studentId: number) {
  const enrollments = await this.enrollmentRepository.find({
    where: { student: { id: studentId } },
    relations: { course: true },
  });

  const summaries = [];

  for (const enrollment of enrollments) {
    const course = enrollment.course;

    const totalLessons = await this.lessonRepository.count({
      where: { course: { id: course.id } },
    });

    const completedLessons = await this.progressRepository.count({
      where: {
        student: { id: studentId },
        lesson: {
          course: { id: course.id },
        },
        isCompleted: true,
      },
    });

    summaries.push({
      courseId: course.id,
      courseTitle: course.title,
      totalLessons,
      completedLessons,
      completionPercentage:
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0,
    });
  }

  return summaries;
}

}
