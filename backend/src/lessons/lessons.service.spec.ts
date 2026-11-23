import { BadRequestException, NotFoundException } from '@nestjs/common';

import { LessonsService } from './lessons.service';
import {
  asRepository,
  createMockRepository,
  MockRepository,
} from '../../test/utils/mock-repository';

describe('LessonsService', () => {
  let lessons: MockRepository;
  let courses: MockRepository;
  let chapters: MockRepository;
  let service: LessonsService;

  beforeEach(() => {
    lessons = createMockRepository();
    courses = createMockRepository();
    chapters = createMockRepository();
    service = new LessonsService(
      asRepository(lessons),
      asRepository(courses),
      asRepository(chapters),
    );
    courses.findOne.mockResolvedValue({ id: 3 });
  });

  it('creates a lesson in the given chapter', async () => {
    chapters.findOne.mockResolvedValue({ id: 8 });

    await service.create({ title: 'Lesson 1', courseId: 3, chapterId: 8, order: 1 });

    expect(chapters.findOne).toHaveBeenCalledWith({
      where: { id: 8, course: { id: 3 } },
    });
    expect(lessons.save).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Lesson 1', chapter: { id: 8 } }),
    );
  });

  it("rejects a chapter that belongs to a different course", async () => {
    chapters.findOne.mockResolvedValue(null);

    await expect(
      service.create({ title: 'Lesson 1', courseId: 3, chapterId: 99, order: 1 }),
    ).rejects.toThrow(BadRequestException);
    expect(lessons.save).not.toHaveBeenCalled();
  });

  it('rejects a lesson for a missing course', async () => {
    courses.findOne.mockResolvedValue(null);

    await expect(
      service.create({ title: 'Lesson 1', courseId: 404, order: 1 }),
    ).rejects.toThrow(NotFoundException);
  });
});
