
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Review } from './entities/review.entity';
import { User } from '../users/entities/user.entity';
import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,

    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
  ) {}

  async createReview(
    studentId: number,
    courseId: number,
    rating: number,
    comment?: string,
  ): Promise<Review> {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException(
        'Rating must be an integer between 1 and 5',
      );
    }

    const student = await this.userRepository.findOne({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const enrollment = await this.enrollmentRepository.findOne({
      where: {
        student: { id: studentId },
        course: { id: courseId },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException(
        'You must enroll in this course before reviewing it',
      );
    }

    const existing = await this.reviewRepository.findOne({
      where: {
        student: { id: studentId },
        course: { id: courseId },
      },
    });

    if (existing) {
      throw new ConflictException(
        'You have already reviewed this course',
      );
    }

    const review = this.reviewRepository.create({
      student,
      course,
      rating,
      comment: comment?.trim() || null,
    });

    return this.reviewRepository.save(review);
  }

  async findCourseReviews(courseId: number): Promise<Review[]> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // This endpoint is public: only expose the reviewer's id and name,
    // never their email or account fields.
    return this.reviewRepository.find({
      where: { course: { id: courseId } },
      relations: { student: true },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        updatedAt: true,
        student: { id: true, name: true },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async getCourseRating(courseId: number) {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select('COUNT(review.id)', 'totalReviews')
      .addSelect('COALESCE(AVG(review.rating), 0)', 'averageRating')
      .where('review.courseId = :courseId', { courseId })
      .getRawOne();

    return {
      courseId,
      totalReviews: Number(result.totalReviews),
      averageRating: Math.round(Number(result.averageRating) * 10) / 10,
    };
  }
}
