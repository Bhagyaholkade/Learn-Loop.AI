import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { ReviewsService } from './reviews.service';
import {
  asRepository,
  createMockRepository,
  MockRepository,
} from '../../test/utils/mock-repository';

describe('ReviewsService', () => {
  let reviews: MockRepository;
  let users: MockRepository;
  let courses: MockRepository;
  let enrollments: MockRepository;
  let service: ReviewsService;

  const student = { id: 7, name: 'Asha' };
  const course = { id: 3, title: 'AI Basics' };

  beforeEach(() => {
    reviews = createMockRepository();
    users = createMockRepository();
    courses = createMockRepository();
    enrollments = createMockRepository();

    service = new ReviewsService(
      asRepository(reviews),
      asRepository(users),
      asRepository(courses),
      asRepository(enrollments),
    );

    users.findOne.mockResolvedValue(student);
    courses.findOne.mockResolvedValue(course);
    enrollments.findOne.mockResolvedValue({ id: 1 });
    reviews.findOne.mockResolvedValue(null);
  });

  describe('createReview', () => {
    it.each([0, 6, 3.5])('rejects rating %p', async (rating) => {
      await expect(
        service.createReview(student.id, course.id, rating),
      ).rejects.toThrow(BadRequestException);
      expect(reviews.save).not.toHaveBeenCalled();
    });

    it('requires the student to be enrolled', async () => {
      enrollments.findOne.mockResolvedValue(null);

      await expect(
        service.createReview(student.id, course.id, 5),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows only one review per student per course', async () => {
      reviews.findOne.mockResolvedValue({ id: 99 });

      await expect(
        service.createReview(student.id, course.id, 4),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects a review for a missing course', async () => {
      courses.findOne.mockResolvedValue(null);

      await expect(
        service.createReview(student.id, 404, 4),
      ).rejects.toThrow(NotFoundException);
    });

    it('saves a trimmed comment, and null for a blank one', async () => {
      await service.createReview(student.id, course.id, 5, '  Great course!  ');
      expect(reviews.create).toHaveBeenLastCalledWith(
        expect.objectContaining({ rating: 5, comment: 'Great course!' }),
      );

      await service.createReview(student.id, course.id, 4, '   ');
      expect(reviews.create).toHaveBeenLastCalledWith(
        expect.objectContaining({ comment: null }),
      );
    });
  });

  describe('findCourseReviews', () => {
    it('only exposes the reviewer id and name (public endpoint)', async () => {
      reviews.find.mockResolvedValue([]);

      await service.findCourseReviews(course.id);

      const options = reviews.find.mock.calls[0][0];
      expect(options.select.student).toEqual({ id: true, name: true });
    });
  });

  describe('getCourseRating', () => {
    it('rounds the average to one decimal place', async () => {
      reviews.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest
          .fn()
          .mockResolvedValue({ totalReviews: '3', averageRating: '4.3333' }),
      });

      await expect(service.getCourseRating(course.id)).resolves.toEqual({
        courseId: course.id,
        totalReviews: 3,
        averageRating: 4.3,
      });
    });
  });
});
