
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';

import { Certificate } from './entities/certificate.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Lesson } from '../lessons/entities/lesson.entity';
import { Progress } from '../progress/entities/progress.entity';
import { Quiz } from '../quizzes/entities/quiz.entity';
import { QuizAttempt } from '../quizzes/entities/quiz-attempt.entity';

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Certificate)
    private readonly certificateRepository: Repository<Certificate>,

    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,

    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,

    @InjectRepository(Progress)
    private readonly progressRepository: Repository<Progress>,

    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,

    @InjectRepository(QuizAttempt)
    private readonly attemptRepository: Repository<QuizAttempt>,
  ) {}

  // Check whether a student is eligible for a course certificate
  async checkEligibility(studentId: number, courseId: number) {
    const enrollment = await this.enrollmentRepository.findOne({
      where: {
        student: { id: studentId },
        course: { id: courseId },
      },
    });

    if (!enrollment) {
      throw new NotFoundException(
        'You are not enrolled in this course',
      );
    }

    // Get total lessons in the course
    const totalLessons = await this.lessonRepository.count({
      where: {
        course: { id: courseId },
      },
    });

    // Get completed lessons
    const completedLessons = await this.progressRepository.count({
      where: {
        student: { id: studentId },
        lesson: {
          course: { id: courseId },
        },
        isCompleted: true,
      },
    });

    // Get all published quizzes
    const publishedQuizzes = await this.quizRepository.find({
      where: {
        course: { id: courseId },
        isPublished: true,
      },
    });

    // Get quizzes passed by the student
    const passedQuizIds = new Set<number>();

    if (publishedQuizzes.length > 0) {
      const passedAttempts = await this.attemptRepository.find({
        where: {
          student: { id: studentId },
          isPassed: true,
          quiz: {
            course: { id: courseId },
            isPublished: true,
          },
        },
        relations: {
          quiz: true,
        },
      });

      passedAttempts.forEach((attempt) => {
        passedQuizIds.add(attempt.quiz.id);
      });
    }

    const totalQuizzes = publishedQuizzes.length;

    const passedQuizzes = publishedQuizzes.filter((quiz) =>
      passedQuizIds.has(quiz.id),
    ).length;

    // Check lesson completion
    const lessonsCompleted =
      totalLessons > 0 && completedLessons === totalLessons;

    // Check quiz completion
    const quizzesPassed =
      totalQuizzes > 0 && passedQuizzes === totalQuizzes;

    const eligible = lessonsCompleted && quizzesPassed;

    return {
      courseId,
      totalLessons,
      completedLessons,
      lessonsCompleted,
      totalQuizzes,
      passedQuizzes,
      quizzesPassed,
      eligible,
      message: eligible
        ? 'You are eligible for a certificate!'
        : 'Complete all lessons and pass all published quizzes to unlock your certificate.',
    };
  }

  // Generate and issue a certificate
  async issueCertificate(studentId: number, courseId: number) {
    // Check eligibility before issuing
    const eligibility = await this.checkEligibility(
      studentId,
      courseId,
    );

    if (!eligibility.eligible) {
      throw new BadRequestException(
        'You are not eligible for this certificate yet.',
      );
    }

    // Prevent duplicate certificates
    const existingCertificate =
      await this.certificateRepository.findOne({
        where: {
          student: { id: studentId },
          course: { id: courseId },
        },
        relations: {
          student: true,
          course: true,
        },
      });

    if (existingCertificate) {
      return {
        message: 'You have already received this certificate.',
        certificate: existingCertificate,
      };
    }

    // Generate a unique certificate number
    const certificateNumber = `LL-${courseId}-${randomUUID()
      .replace(/-/g, '')
      .slice(0, 12)
      .toUpperCase()}`;

    // Create certificate record
    const certificate = this.certificateRepository.create({
      certificateNumber,
      student: { id: studentId } as any,
      course: { id: courseId } as any,
    });

    const savedCertificate =
      await this.certificateRepository.save(certificate);

    // Return certificate with course and student details
    const result = await this.certificateRepository.findOne({
      where: {
        id: savedCertificate.id,
      },
      relations: {
        student: true,
        course: true,
      },
    });

    return {
      message: 'Certificate issued successfully!',
      certificate: result,
    };
  }

  // Get all certificates belonging to the logged-in student
  async getMyCertificates(studentId: number) {
    const certificates = await this.certificateRepository.find({
      where: {
        student: { id: studentId },
      },
      relations: {
        course: true,
      },
      order: {
        issuedAt: 'DESC',
      },
    });

    return {
      totalCertificates: certificates.length,
      certificates,
    };
  }

  // Get a specific student's certificate for a course
  async getCourseCertificate(
    studentId: number,
    courseId: number,
  ) {
    const certificate = await this.certificateRepository.findOne({
      where: {
        student: { id: studentId },
        course: { id: courseId },
      },
      relations: {
        course: true,
        student: true,
      },
    });

    if (!certificate) {
      throw new NotFoundException(
        'Certificate not found for this course',
      );
    }

    return certificate;
  }
}
