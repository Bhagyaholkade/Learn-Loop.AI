
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Chapter } from './entities/chapter.entity';
import { Course } from '../courses/entities/course.entity';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';

@Injectable()
export class ChaptersService {
  constructor(
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,

    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  // Create a chapter
  async create(createChapterDto: CreateChapterDto) {
    const course = await this.courseRepository.findOne({
      where: { id: createChapterDto.courseId },
    });

    if (!course) {
      throw new NotFoundException(
        `Course with ID ${createChapterDto.courseId} not found`,
      );
    }

    const chapter = this.chapterRepository.create({
      title: createChapterDto.title,
      description: createChapterDto.description ?? null,
      learningObjectives:
        createChapterDto.learningObjectives ?? null,
      order: createChapterDto.order ?? 1,
      course,
    });

    return this.chapterRepository.save(chapter);
  }

  // Get all chapters belonging to a course
  async findByCourse(courseId: number) {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(
        `Course with ID ${courseId} not found`,
      );
    }

    return this.chapterRepository.find({
      where: { course: { id: courseId } },
      relations: {
        lessons: true,
      },
      order: {
        order: 'ASC',
        lessons: {
          order: 'ASC',
        },
      },
    });
  }

  // Get one chapter with its lessons
  async findOne(id: number) {
    const chapter = await this.chapterRepository.findOne({
      where: { id },
      relations: {
        course: true,
        lessons: true,
      },
      order: {
        lessons: {
          order: 'ASC',
        },
      },
    });

    if (!chapter) {
      throw new NotFoundException(
        `Chapter with ID ${id} not found`,
      );
    }

    return chapter;
  }

  // Update chapter
  async update(id: number, updateChapterDto: UpdateChapterDto) {
    const chapter = await this.chapterRepository.findOne({
      where: { id },
    });

    if (!chapter) {
      throw new NotFoundException(
        `Chapter with ID ${id} not found`,
      );
    }

    const { courseId: _courseId, ...updates } = updateChapterDto;

    Object.assign(chapter, updates);

    return this.chapterRepository.save(chapter);
  }

  // Delete chapter
  async remove(id: number) {
    const chapter = await this.chapterRepository.findOne({
      where: { id },
    });

    if (!chapter) {
      throw new NotFoundException(
        `Chapter with ID ${id} not found`,
      );
    }

    await this.chapterRepository.remove(chapter);

    return {
      success: true,
      message: 'Chapter deleted successfully',
    };
  }
}
