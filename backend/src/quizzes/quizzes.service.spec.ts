import { ForbiddenException } from '@nestjs/common';

import { QuizzesService } from './quizzes.service';
import { QuizType } from './entities/quiz.entity';
import {
  asRepository,
  createMockRepository,
  MockRepository,
} from '../../test/utils/mock-repository';

describe('QuizzesService (student flow)', () => {
  let quizzes: MockRepository;
  let attempts: MockRepository;
  let enrollments: MockRepository;
  let certificatesService: {
    getLessonCompletion: jest.Mock;
    tryAutoIssue: jest.Mock;
  };
  let service: QuizzesService;

  /** A published one-question quiz worth 10 marks; passing mark 6. */
  function givenQuiz(quizType: QuizType) {
    quizzes.findOne.mockResolvedValue({
      id: 10,
      title: 'Final Exam',
      quizType,
      isPublished: true,
      passingMarks: 6,
      totalMarks: 10,
      course: { id: 3 },
      questions: [
        {
          id: 1,
          questionText: 'Q1',
          options: ['a', 'b'],
          correctOptionIndex: 1,
          marks: 10,
          order: 1,
          explanation: null,
        },
      ],
    });
  }

  function givenLessonsCompleted(done: boolean) {
    certificatesService.getLessonCompletion.mockResolvedValue({
      totalLessons: 4,
      completedLessons: done ? 4 : 2,
      lessonsCompleted: done,
    });
  }

  const correctAnswer = { answers: [{ questionId: 1, selectedOptionIndex: 1 }] };
  const wrongAnswer = { answers: [{ questionId: 1, selectedOptionIndex: 0 }] };

  beforeEach(() => {
    quizzes = createMockRepository();
    attempts = createMockRepository();
    enrollments = createMockRepository();
    certificatesService = {
      getLessonCompletion: jest.fn(),
      tryAutoIssue: jest.fn().mockResolvedValue(null),
    };

    service = new QuizzesService(
      asRepository(quizzes),
      asRepository(createMockRepository()), // courses
      asRepository(createMockRepository()), // lessons
      asRepository(createMockRepository()), // questions
      asRepository(attempts),
      asRepository(enrollments),
      certificatesService as never,
    );

    enrollments.findOne.mockResolvedValue({ id: 1 });
  });

  describe('final quiz lock', () => {
    it('blocks the final quiz until all lessons are completed', async () => {
      givenQuiz(QuizType.FINAL);
      givenLessonsCompleted(false);

      await expect(service.getStudentQuizQuestions(10, 7)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(
        service.submitAttempt(10, 7, correctAnswer),
      ).rejects.toThrow(ForbiddenException);
      expect(attempts.save).not.toHaveBeenCalled();
    });

    it('opens the final quiz once all lessons are completed', async () => {
      givenQuiz(QuizType.FINAL);
      givenLessonsCompleted(true);

      await expect(
        service.getStudentQuizQuestions(10, 7),
      ).resolves.toMatchObject({ id: 10 });
    });

    it('never locks chapter quizzes', async () => {
      givenQuiz(QuizType.CHAPTER);
      givenLessonsCompleted(false);

      await expect(
        service.getStudentQuizQuestions(10, 7),
      ).resolves.toMatchObject({ id: 10 });
      expect(certificatesService.getLessonCompletion).not.toHaveBeenCalled();
    });
  });

  describe('automatic certificate', () => {
    it('issues the certificate when the final quiz is passed', async () => {
      givenQuiz(QuizType.FINAL);
      givenLessonsCompleted(true);
      certificatesService.tryAutoIssue.mockResolvedValue({
        id: 1,
        certificateNumber: 'LL-3-ABC',
      });

      const result = await service.submitAttempt(10, 7, correctAnswer);

      expect(result.isPassed).toBe(true);
      expect(certificatesService.tryAutoIssue).toHaveBeenCalledWith(7, 3);
      expect(result.certificate).toEqual({
        id: 1,
        certificateNumber: 'LL-3-ABC',
      });
    });

    it('does not issue a certificate when the final quiz is failed', async () => {
      givenQuiz(QuizType.FINAL);
      givenLessonsCompleted(true);

      const result = await service.submitAttempt(10, 7, wrongAnswer);

      expect(result.isPassed).toBe(false);
      expect(result.certificate).toBeNull();
      expect(certificatesService.tryAutoIssue).not.toHaveBeenCalled();
    });

    it('does not issue a certificate for passing a chapter quiz', async () => {
      givenQuiz(QuizType.CHAPTER);

      const result = await service.submitAttempt(10, 7, correctAnswer);

      expect(result.isPassed).toBe(true);
      expect(certificatesService.tryAutoIssue).not.toHaveBeenCalled();
    });
  });
});
