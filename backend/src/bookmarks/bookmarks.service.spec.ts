import { ConflictException, NotFoundException } from '@nestjs/common';

import { BookmarksService } from './bookmarks.service';
import {
  asRepository,
  createMockRepository,
  MockRepository,
} from '../../test/utils/mock-repository';

describe('BookmarksService', () => {
  let bookmarks: MockRepository;
  let users: MockRepository;
  let courses: MockRepository;
  let service: BookmarksService;

  beforeEach(() => {
    bookmarks = createMockRepository();
    users = createMockRepository();
    courses = createMockRepository();

    service = new BookmarksService(
      asRepository(bookmarks),
      asRepository(users),
      asRepository(courses),
    );

    users.findOne.mockResolvedValue({ id: 7 });
    courses.findOne.mockResolvedValue({ id: 3 });
    bookmarks.findOne.mockResolvedValue(null);
  });

  it('bookmarks a course', async () => {
    await service.addBookmark(7, 3);

    expect(bookmarks.save).toHaveBeenCalledWith({
      student: { id: 7 },
      course: { id: 3 },
    });
  });

  it('rejects bookmarking the same course twice', async () => {
    bookmarks.findOne.mockResolvedValue({ id: 1 });

    await expect(service.addBookmark(7, 3)).rejects.toThrow(ConflictException);
  });

  it('rejects bookmarking a course that does not exist', async () => {
    courses.findOne.mockResolvedValue(null);

    await expect(service.addBookmark(7, 404)).rejects.toThrow(
      NotFoundException,
    );
  });

  it("only removes the student's own bookmark", async () => {
    await expect(service.removeBookmark(1, 7)).rejects.toThrow(
      NotFoundException,
    );

    expect(bookmarks.findOne).toHaveBeenCalledWith({
      where: { id: 1, student: { id: 7 } },
    });
    expect(bookmarks.remove).not.toHaveBeenCalled();
  });

  it('removes an owned bookmark', async () => {
    const bookmark = { id: 1 };
    bookmarks.findOne.mockResolvedValue(bookmark);

    await service.removeBookmark(1, 7);

    expect(bookmarks.remove).toHaveBeenCalledWith(bookmark);
  });
});
