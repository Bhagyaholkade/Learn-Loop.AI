import { ConflictException, NotFoundException } from '@nestjs/common';

import { EnrollmentsService } from './enrollments.service';
import {
  asRepository,
  createMockRepository,
  MockRepository,
} from '../../test/utils/mock-repository';

describe('EnrollmentsService', () => {
  let enrollments: MockRepository;
  let users: MockRepository;
  let courses: MockRepository;
  let service: EnrollmentsService;

  beforeEach(() => {
    enrollments = createMockRepository();
    users = createMockRepository();
    courses = createMockRepository();

    service = new EnrollmentsService(
      asRepository(enrollments),
      asRepository(users),
      asRepository(courses),
    );

    users.findOne.mockResolvedValue({ id: 7 });
    courses.findOne.mockResolvedValue({ id: 3 });
    enrollments.findOne.mockResolvedValue(null);
  });

  it('enrolls a student in a course', async () => {
    await service.enroll(7, 3);

    expect(enrollments.save).toHaveBeenCalledWith({
      student: { id: 7 },
      course: { id: 3 },
    });
  });

  it('rejects enrolling twice in the same course', async () => {
    enrollments.findOne.mockResolvedValue({ id: 1 });

    await expect(service.enroll(7, 3)).rejects.toThrow(ConflictException);
    expect(enrollments.save).not.toHaveBeenCalled();
  });

  it('rejects enrolling in a missing course', async () => {
    courses.findOne.mockResolvedValue(null);

    await expect(service.enroll(7, 404)).rejects.toThrow(NotFoundException);
  });

  it("does not return another student's enrollment", async () => {
    await expect(service.findOneForUser(1, 7)).rejects.toThrow(
      NotFoundException,
    );

    expect(enrollments.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1, student: { id: 7 } } }),
    );
  });
});
