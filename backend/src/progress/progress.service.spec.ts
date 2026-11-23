import { ConflictException, NotFoundException } from '@nestjs/common';

import { ProgressService } from './progress.service';
import {
  asRepository,
  createMockRepository,
  MockRepository,
} from '../../test/utils/mock-repository';

describe('ProgressService', () => {
  let progress: MockRepository;
  let users: MockRepository;
  let lessons: MockRepository;
  let enrollments: MockRepository;
  let certificatesService: { tryAutoIssue: jest.Mock };
  let service: ProgressService;

  const lesson = { id: 20, course: { id: 3 } };

  beforeEach(() => {
    progress = createMockRepository();
    users = createMockRepository();
    lessons = createMockRepository();
    enrollments = createMockRepository();
    certificatesService = { tryAutoIssue: jest.fn().mockResolvedValue(null) };

    service = new ProgressService(
      asRepository(progress),
      asRepository(users),
      asRepository(lessons),
      asRepository(enrollments),
      certificatesService as never,
    );

    users.findOne.mockResolvedValue({ id: 7 });
    lessons.findOne.mockResolvedValue(lesson);
    progress.findOne.mockResolvedValue(null);
  });

  describe('markCompleted', () => {
    it('creates a completed progress record', async () => {
      await service.markCompleted(7, 20);

      expect(progress.save).toHaveBeenCalledWith({
        student: { id: 7 },
        lesson,
        isCompleted: true,
      });
    });

    it('checks for an earned certificate after completing a lesson', async () => {
      await service.markCompleted(7, 20);

      expect(certificatesService.tryAutoIssue).toHaveBeenCalledWith(7, 3);
    });

    it('completes an existing unfinished record instead of duplicating it', async () => {
      const existing = { id: 5, isCompleted: false };
      progress.findOne.mockResolvedValue(existing);

      await service.markCompleted(7, 20);

      expect(progress.create).not.toHaveBeenCalled();
      expect(progress.save).toHaveBeenCalledWith({ id: 5, isCompleted: true });
    });

    it('rejects completing a lesson twice', async () => {
      progress.findOne.mockResolvedValue({ id: 5, isCompleted: true });

      await expect(service.markCompleted(7, 20)).rejects.toThrow(
        ConflictException,
      );
    });

    it('rejects a missing lesson', async () => {
      lessons.findOne.mockResolvedValue(null);

      await expect(service.markCompleted(7, 404)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getCourseProgressSummary', () => {
    it('computes a rounded completion percentage per enrolled course', async () => {
      enrollments.find.mockResolvedValue([
        { course: { id: 1, title: 'AI Basics' } },
        { course: { id: 2, title: 'Empty Course' } },
      ]);
      // total lessons per course, then completed lessons per course
      lessons.count.mockImplementation(({ where }) =>
        Promise.resolve(where.course.id === 1 ? 3 : 0),
      );
      progress.count.mockImplementation(({ where }) =>
        Promise.resolve(where.lesson.course.id === 1 ? 2 : 0),
      );

      await expect(service.getCourseProgressSummary(7)).resolves.toEqual([
        {
          courseId: 1,
          courseTitle: 'AI Basics',
          totalLessons: 3,
          completedLessons: 2,
          completionPercentage: 67,
        },
        {
          courseId: 2,
          courseTitle: 'Empty Course',
          totalLessons: 0,
          completedLessons: 0,
          completionPercentage: 0,
        },
      ]);
    });
  });
});
