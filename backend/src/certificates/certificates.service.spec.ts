import { BadRequestException, NotFoundException } from '@nestjs/common';

import { CertificatesService } from './certificates.service';
import { QuizType } from '../quizzes/entities/quiz.entity';
import {
  asRepository,
  createMockRepository,
  MockRepository,
} from '../../test/utils/mock-repository';

describe('CertificatesService', () => {
  let certificates: MockRepository;
  let enrollments: MockRepository;
  let lessons: MockRepository;
  let progress: MockRepository;
  let quizzes: MockRepository;
  let attempts: MockRepository;
  let service: CertificatesService;

  /** Certificates "stored" by the mock repository. */
  let stored: { id: number; certificateNumber: string }[];

  /** Sets up a course with the given lesson and FINAL-quiz state. */
  function givenCourse(opts: {
    totalLessons: number;
    completedLessons: number;
    finalQuizIds: number[];
    passedQuizIds: number[];
  }) {
    enrollments.findOne.mockResolvedValue({ id: 1 });
    lessons.count.mockResolvedValue(opts.totalLessons);
    progress.count.mockResolvedValue(opts.completedLessons);
    quizzes.find.mockResolvedValue(
      opts.finalQuizIds.map((id) => ({ id, title: `Final ${id}` })),
    );
    attempts.find.mockResolvedValue(
      opts.passedQuizIds.map((id) => ({ quiz: { id } })),
    );
  }

  beforeEach(() => {
    certificates = createMockRepository();
    enrollments = createMockRepository();
    lessons = createMockRepository();
    progress = createMockRepository();
    quizzes = createMockRepository();
    attempts = createMockRepository();

    stored = [];
    certificates.findOne.mockImplementation(() =>
      Promise.resolve(stored[0] ?? null),
    );
    certificates.save.mockImplementation((entity) => {
      const saved = { id: stored.length + 1, ...entity };
      stored.push(saved);
      return Promise.resolve(saved);
    });

    service = new CertificatesService(
      asRepository(certificates),
      asRepository(enrollments),
      asRepository(lessons),
      asRepository(progress),
      asRepository(quizzes),
      asRepository(attempts),
    );
  });

  describe('checkEligibility', () => {
    it('requires enrollment', async () => {
      enrollments.findOne.mockResolvedValue(null);

      await expect(service.checkEligibility(7, 3)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('only counts published FINAL quizzes', async () => {
      givenCourse({
        totalLessons: 1,
        completedLessons: 1,
        finalQuizIds: [10],
        passedQuizIds: [10],
      });

      await service.checkEligibility(7, 3);

      expect(quizzes.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            course: { id: 3 },
            isPublished: true,
            quizType: QuizType.FINAL,
          },
        }),
      );
    });

    it('is eligible when every lesson is done and the final quiz is passed', async () => {
      givenCourse({
        totalLessons: 4,
        completedLessons: 4,
        finalQuizIds: [10],
        passedQuizIds: [10],
      });

      const result = await service.checkEligibility(7, 3);

      expect(result.eligible).toBe(true);
    });

    it('asks to complete lessons first', async () => {
      givenCourse({
        totalLessons: 4,
        completedLessons: 3,
        finalQuizIds: [10],
        passedQuizIds: [10],
      });

      const result = await service.checkEligibility(7, 3);

      expect(result.eligible).toBe(false);
      expect(result.nextStep).toBe('COMPLETE_LESSONS');
    });

    it('points to the final quiz once all lessons are done', async () => {
      givenCourse({
        totalLessons: 2,
        completedLessons: 2,
        finalQuizIds: [10],
        passedQuizIds: [],
      });

      const result = await service.checkEligibility(7, 3);

      expect(result.eligible).toBe(false);
      expect(result.nextStep).toBe('TAKE_FINAL_QUIZ');
      expect(result.finalQuiz).toEqual({ id: 10, title: 'Final 10' });
    });

    it('awards no certificate for a course without a final quiz', async () => {
      givenCourse({
        totalLessons: 2,
        completedLessons: 2,
        finalQuizIds: [],
        passedQuizIds: [],
      });

      const result = await service.checkEligibility(7, 3);

      expect(result.eligible).toBe(false);
      expect(result.nextStep).toBe('NO_FINAL_QUIZ');
    });

    it('reports CERTIFIED once a certificate exists', async () => {
      givenCourse({
        totalLessons: 1,
        completedLessons: 1,
        finalQuizIds: [10],
        passedQuizIds: [10],
      });
      stored.push({ id: 1, certificateNumber: 'LL-3-ABC' });

      const result = await service.checkEligibility(7, 3);

      expect(result.nextStep).toBe('CERTIFIED');
      expect(result.certificate).toEqual({
        id: 1,
        certificateNumber: 'LL-3-ABC',
      });
    });
  });

  describe('issueCertificate', () => {
    it('refuses when the student is not eligible', async () => {
      givenCourse({
        totalLessons: 2,
        completedLessons: 1,
        finalQuizIds: [10],
        passedQuizIds: [],
      });

      await expect(service.issueCertificate(7, 3)).rejects.toThrow(
        BadRequestException,
      );
      expect(certificates.save).not.toHaveBeenCalled();
    });

    it('issues a certificate with an LL-<course>-<12 chars> number', async () => {
      givenCourse({
        totalLessons: 1,
        completedLessons: 1,
        finalQuizIds: [10],
        passedQuizIds: [10],
      });

      await service.issueCertificate(7, 3);

      expect(stored).toHaveLength(1);
      expect(stored[0].certificateNumber).toMatch(/^LL-3-[0-9A-F]{12}$/);
    });
  });

  describe('tryAutoIssue', () => {
    it('issues the certificate as soon as the rules are met', async () => {
      givenCourse({
        totalLessons: 2,
        completedLessons: 2,
        finalQuizIds: [10],
        passedQuizIds: [10],
      });

      const certificate = await service.tryAutoIssue(7, 3);

      expect(certificate).not.toBeNull();
      expect(stored).toHaveLength(1);
    });

    it('never issues a second certificate', async () => {
      givenCourse({
        totalLessons: 1,
        completedLessons: 1,
        finalQuizIds: [10],
        passedQuizIds: [10],
      });

      await service.tryAutoIssue(7, 3);
      await service.tryAutoIssue(7, 3);

      expect(certificates.save).toHaveBeenCalledTimes(1);
    });

    it('returns null when not eligible', async () => {
      givenCourse({
        totalLessons: 2,
        completedLessons: 2,
        finalQuizIds: [10],
        passedQuizIds: [],
      });

      await expect(service.tryAutoIssue(7, 3)).resolves.toBeNull();
      expect(certificates.save).not.toHaveBeenCalled();
    });

    it('returns null instead of throwing when not enrolled', async () => {
      enrollments.findOne.mockResolvedValue(null);

      await expect(service.tryAutoIssue(7, 3)).resolves.toBeNull();
    });
  });
});
