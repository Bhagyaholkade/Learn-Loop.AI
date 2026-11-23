import { NotFoundException } from '@nestjs/common';

import { ChaptersService } from './chapters.service';
import {
  asRepository,
  createMockRepository,
  MockRepository,
} from '../../test/utils/mock-repository';

describe('ChaptersService', () => {
  let chapters: MockRepository;
  let courses: MockRepository;
  let service: ChaptersService;

  beforeEach(() => {
    chapters = createMockRepository();
    courses = createMockRepository();
    service = new ChaptersService(asRepository(chapters), asRepository(courses));
  });

  it('creates a chapter with defaults for optional fields', async () => {
    courses.findOne.mockResolvedValue({ id: 3 });

    await service.create({ title: 'Intro', courseId: 3 });

    expect(chapters.save).toHaveBeenCalledWith({
      title: 'Intro',
      description: null,
      learningObjectives: null,
      order: 1,
      course: { id: 3 },
    });
  });

  it('rejects a chapter for a missing course', async () => {
    courses.findOne.mockResolvedValue(null);

    await expect(
      service.create({ title: 'Intro', courseId: 404 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('never moves a chapter to another course on update', async () => {
    chapters.findOne.mockResolvedValue({ id: 1, title: 'Old', course: { id: 3 } });

    await service.update(1, { title: 'New', courseId: 99 });

    expect(chapters.save).toHaveBeenCalledWith({
      id: 1,
      title: 'New',
      course: { id: 3 },
    });
  });
});
