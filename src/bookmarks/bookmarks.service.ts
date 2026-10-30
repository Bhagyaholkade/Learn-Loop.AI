import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Bookmark } from './entities/bookmark.entity';
import { User } from '../users/entities/user.entity';
import { Course } from '../courses/entities/course.entity';

@Injectable()
export class BookmarksService {
  constructor(
    @InjectRepository(Bookmark)
    private readonly bookmarkRepository: Repository<Bookmark>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  // Add a course to bookmarks
  async addBookmark(
    studentId: number,
    courseId: number,
  ): Promise<Bookmark> {
    const student = await this.userRepository.findOne({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const existing = await this.bookmarkRepository.findOne({
      where: {
        student: { id: studentId },
        course: { id: courseId },
      },
    });

    if (existing) {
      throw new ConflictException('Course is already bookmarked');
    }

    const bookmark = this.bookmarkRepository.create({
      student,
      course,
    });

    return this.bookmarkRepository.save(bookmark);
  }

  // Get the current student's bookmarks
  async getMyBookmarks(studentId: number): Promise<Bookmark[]> {
    return this.bookmarkRepository.find({
      where: { student: { id: studentId } },
      relations: { course: true },
      order: { createdAt: 'DESC' },
    });
  }

  // Remove a bookmark belonging to the current student
  async removeBookmark(
    bookmarkId: number,
    studentId: number,
  ): Promise<void> {
    const bookmark = await this.bookmarkRepository.findOne({
      where: {
        id: bookmarkId,
        student: { id: studentId },
      },
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    await this.bookmarkRepository.remove(bookmark);
  }
}