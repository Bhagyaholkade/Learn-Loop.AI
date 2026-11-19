
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Enrollment } from './entities/enrollment.entity';
import { User } from '../users/entities/user.entity';
import { Course } from '../courses/entities/course.entity';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  async enroll(
    userId: number,
    courseId: number,
  ): Promise<Enrollment> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const existing = await this.enrollmentRepository.findOne({
      where: {
        student: { id: userId },
        course: { id: courseId },
      },
    });

    if (existing) {
      throw new ConflictException(
        'You are already enrolled in this course',
      );
    }

    const enrollment = this.enrollmentRepository.create({
      student: user,
      course,
    });

    return this.enrollmentRepository.save(enrollment);
  }

  // Admin: retrieve all enrollments with safe student fields.
  async findAllEnrollments(): Promise<Enrollment[]> {
    return this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .leftJoin('enrollment.student', 'student')
      .addSelect([
        'student.id',
        'student.name',
        'student.email',
      ])
      .leftJoinAndSelect('enrollment.course', 'course')
      .orderBy('enrollment.enrolledAt', 'DESC')
      .getMany();
  }

  async findMyEnrollments(
    userId: number,
  ): Promise<Enrollment[]> {
    return this.enrollmentRepository.find({
      where: { student: { id: userId } },
      relations: { course: true },
      order: { enrolledAt: 'DESC' },
    });
  }

  async findOneForUser(
    enrollmentId: number,
    userId: number,
  ): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: {
        id: enrollmentId,
        student: { id: userId },
      },
      relations: { course: true },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    return enrollment;
  }
}
