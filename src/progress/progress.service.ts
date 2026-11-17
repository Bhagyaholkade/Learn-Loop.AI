
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

  // Mark a lesson as completed
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
        throw new ConflictException(
          'Lesson is already completed',
        );
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

  // Get logged-in student's progress records
  async getMyProgress(
    studentId: number,
  ): Promise<Progress[]> {
    return this.progressRepository.find({
      where: {
        student: { id: studentId },
      },
      relations: {
        lesson: true,
      },
      order: {
        updatedAt: 'DESC',
      },
    });
  }

  // Get logged-in student's course-wise progress
  async getCourseProgressSummary(studentId: number) {
    const enrollments = await this.enrollmentRepository.find({
      where: {
        student: { id: studentId },
      },
      relations: {
        course: true,
      },
    });

    const summaries = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = enrollment.course;

        const totalLessons = await this.lessonRepository.count({
          where: {
            course: { id: course.id },
          },
        });

        const completedLessons =
          await this.progressRepository.count({
            where: {
              student: { id: studentId },
              lesson: {
                course: { id: course.id },
              },
              isCompleted: true,
            },
          });

        return {
          courseId: course.id,
          courseTitle: course.title,
          totalLessons,
          completedLessons,
          completionPercentage:
            totalLessons > 0
              ? Math.round(
                  (completedLessons / totalLessons) * 100,
                )
              : 0,
        };
      }),
    );

    return summaries;
  }

  // Admin: Get progress of all enrolled students
  async getAllStudentsProgress() {
    const enrollments = await this.enrollmentRepository.find({
      relations: {
        student: true,
        course: true,
      },
      order: {
        enrolledAt: 'DESC',
      },
    });

    const data = await Promise.all(
      enrollments.map(async (enrollment) => {
        const student = enrollment.student;
        const course = enrollment.course;

        const totalLessons = await this.lessonRepository.count({
          where: {
            course: { id: course.id },
          },
        });

        const completedLessons =
          await this.progressRepository.count({
            where: {
              student: { id: student.id },
              lesson: {
                course: { id: course.id },
              },
              isCompleted: true,
            },
          });

        const completionPercentage =
          totalLessons > 0
            ? Math.round(
                (completedLessons / totalLessons) * 100,
              )
            : 0;

        let status:
          | 'Not Started'
          | 'In Progress'
          | 'Completed';

        if (completedLessons === 0) {
          status = 'Not Started';
        } else if (
          totalLessons > 0 &&
          completedLessons >= totalLessons
        ) {
          status = 'Completed';
        } else {
          status = 'In Progress';
        }

        return {
          student: {
            id: student.id,
            name: student.name,
            email: student.email,
          },

          course: {
            id: course.id,
            title: course.title,
          },

          enrolledAt: enrollment.enrolledAt,
          totalLessons,
          completedLessons,
          completionPercentage,
          status,
        };
      }),
    );

    return {
      totalEnrollments: data.length,
      data,
    };
  }
}
