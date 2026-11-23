import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { randomUUID } from 'crypto';

import { Certificate } from './entities/certificate.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Lesson } from '../lessons/entities/lesson.entity';
import { Progress } from '../progress/entities/progress.entity';
import { Quiz, QuizType } from '../quizzes/entities/quiz.entity';
import { QuizAttempt } from '../quizzes/entities/quiz-attempt.entity';

/**
 * What the student should do next to earn the course certificate.
 * - COMPLETE_LESSONS: some lessons are not completed yet
 * - NO_FINAL_QUIZ:    all lessons done, but the course has no published final quiz
 * - TAKE_FINAL_QUIZ:  all lessons done, final quiz not passed yet
 * - CERTIFIED:        certificate already issued
 */
export type CertificateNextStep =
  'COMPLETE_LESSONS' | 'NO_FINAL_QUIZ' | 'TAKE_FINAL_QUIZ' | 'CERTIFIED';

/**
 * Certificate rules:
 * 1. Complete every lesson in the course.
 * 2. Pass every published FINAL quiz of the course (chapter quizzes are
 *    practice and do not count).
 * 3. A course without a published FINAL quiz does not award a certificate.
 *
 * Certificates are issued automatically by tryAutoIssue() when the rules
 * are met (after passing the final quiz or completing the last lesson).
 */
@Injectable()
export class CertificatesService {
  private readonly logger = new Logger(CertificatesService.name);

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

  // Lesson completion for a student in a course (used to lock the final quiz).
  async getLessonCompletion(studentId: number, courseId: number) {
    const [totalLessons, completedLessons] = await Promise.all([
      this.lessonRepository.count({
        where: { course: { id: courseId } },
      }),
      this.progressRepository.count({
        where: {
          student: { id: studentId },
          lesson: { course: { id: courseId } },
          isCompleted: true,
        },
      }),
    ]);

    return {
      totalLessons,
      completedLessons,
      lessonsCompleted: totalLessons > 0 && completedLessons >= totalLessons,
    };
  }

  // Check whether a student is eligible for a course certificate
  async checkEligibility(studentId: number, courseId: number) {
    const enrollment = await this.enrollmentRepository.findOne({
      where: {
        student: { id: studentId },
        course: { id: courseId },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('You are not enrolled in this course');
    }

    const { totalLessons, completedLessons, lessonsCompleted } =
      await this.getLessonCompletion(studentId, courseId);

    // Only published FINAL quizzes count towards the certificate.
    const finalQuizzes = await this.quizRepository.find({
      where: {
        course: { id: courseId },
        isPublished: true,
        quizType: QuizType.FINAL,
      },
      order: { id: 'ASC' },
    });

    const passedQuizIds = new Set<number>();

    if (finalQuizzes.length > 0) {
      const passedAttempts = await this.attemptRepository.find({
        where: {
          student: { id: studentId },
          isPassed: true,
          quiz: {
            course: { id: courseId },
            isPublished: true,
            quizType: QuizType.FINAL,
          },
        },
        relations: { quiz: true },
      });

      passedAttempts.forEach((attempt) => passedQuizIds.add(attempt.quiz.id));
    }

    const totalQuizzes = finalQuizzes.length;
    const passedQuizzes = finalQuizzes.filter((quiz) =>
      passedQuizIds.has(quiz.id),
    ).length;
    const hasFinalQuiz = totalQuizzes > 0;
    const quizzesPassed = hasFinalQuiz && passedQuizzes === totalQuizzes;
    const eligible = lessonsCompleted && quizzesPassed;

    // The next final quiz the student still needs to pass.
    const nextQuiz = finalQuizzes.find((quiz) => !passedQuizIds.has(quiz.id));

    const existingCertificate = await this.certificateRepository.findOne({
      where: {
        student: { id: studentId },
        course: { id: courseId },
      },
    });

    let nextStep: CertificateNextStep;
    let message: string;

    if (existingCertificate) {
      nextStep = 'CERTIFIED';
      message = 'You have earned the certificate for this course!';
    } else if (!lessonsCompleted) {
      nextStep = 'COMPLETE_LESSONS';
      message = `Complete all lessons (${completedLessons}/${totalLessons}) to unlock the final quiz.`;
    } else if (!hasFinalQuiz) {
      nextStep = 'NO_FINAL_QUIZ';
      message =
        'You completed all lessons! This course does not have a final quiz yet, so a certificate is not available.';
    } else {
      nextStep = 'TAKE_FINAL_QUIZ';
      message =
        'You completed all lessons! Pass the final quiz to earn your certificate.';
    }

    return {
      courseId,
      totalLessons,
      completedLessons,
      lessonsCompleted,
      totalQuizzes,
      passedQuizzes,
      quizzesPassed,
      hasFinalQuiz,
      finalQuiz: nextQuiz ? { id: nextQuiz.id, title: nextQuiz.title } : null,
      eligible,
      nextStep,
      certificate: existingCertificate
        ? {
            id: existingCertificate.id,
            certificateNumber: existingCertificate.certificateNumber,
          }
        : null,
      message,
    };
  }

  /**
   * Issues the certificate if the student now meets the rules.
   * Safe to call any time: returns null when not eligible (or not enrolled)
   * and returns the existing certificate instead of creating a duplicate.
   */
  async tryAutoIssue(
    studentId: number,
    courseId: number,
  ): Promise<Certificate | null> {
    try {
      const eligibility = await this.checkEligibility(studentId, courseId);

      if (!eligibility.eligible) {
        return null;
      }

      const { certificate } = await this.issueCertificate(studentId, courseId);

      return certificate;
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null;
      }

      // Never fail the caller (quiz submit / lesson completion) because of
      // a certificate problem; the student can still get it later.
      this.logger.error(
        `Automatic certificate issue failed for student ${studentId}, course ${courseId}`,
        error instanceof Error ? error.stack : String(error),
      );
      return null;
    }
  }

  // Generate and issue a certificate
  async issueCertificate(studentId: number, courseId: number) {
    const eligibility = await this.checkEligibility(studentId, courseId);

    if (!eligibility.eligible) {
      throw new BadRequestException(
        'You are not eligible for this certificate yet.',
      );
    }

    const existingCertificate = await this.findStudentCertificate(
      studentId,
      courseId,
    );

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

    const certificate = this.certificateRepository.create({
      certificateNumber,
      student: { id: studentId },
      course: { id: courseId },
    });

    try {
      await this.certificateRepository.save(certificate);
    } catch (error) {
      // Two requests raced (e.g. double submit): the unique
      // (student, course) index rejected the second insert.
      if (error instanceof QueryFailedError) {
        const existing = await this.findStudentCertificate(studentId, courseId);

        if (existing) {
          return {
            message: 'You have already received this certificate.',
            certificate: existing,
          };
        }
      }

      throw error;
    }

    return {
      message: 'Certificate issued successfully!',
      certificate: (await this.findStudentCertificate(
        studentId,
        courseId,
      )) as Certificate,
    };
  }

  private findStudentCertificate(studentId: number, courseId: number) {
    return this.certificateRepository.findOne({
      where: {
        student: { id: studentId },
        course: { id: courseId },
      },
      relations: {
        student: true,
        course: true,
      },
    });
  }

  // Get all certificates belonging to the logged-in student
  async getMyCertificates(studentId: number) {
    // Issue any certificate the student already qualifies for (e.g. they
    // met the rules before automatic issuing existed).
    const enrollments = await this.enrollmentRepository.find({
      where: { student: { id: studentId } },
      relations: { course: true },
    });

    for (const enrollment of enrollments) {
      if (enrollment.course) {
        await this.tryAutoIssue(studentId, enrollment.course.id);
      }
    }

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
  async getCourseCertificate(studentId: number, courseId: number) {
    const certificate = await this.findStudentCertificate(studentId, courseId);

    if (!certificate) {
      throw new NotFoundException('Certificate not found for this course');
    }

    return certificate;
  }
}
