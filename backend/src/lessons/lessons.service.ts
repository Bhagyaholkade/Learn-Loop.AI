
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Lesson } from './entities/lesson.entity';
import { Course } from '../courses/entities/course.entity';
import { Chapter } from '../chapters/entities/chapter.entity';

import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,

    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,

    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
  ) {}

  // CREATE LESSON
  async create(data: CreateLessonDto): Promise<Lesson> {
    const course = await this.courseRepository.findOne({
      where: { id: data.courseId },
    });

    if (!course) {
      throw new NotFoundException(
        `Course with ID ${data.courseId} not found`,
      );
    }

    let chapter: Chapter | null = null;

    if (data.chapterId !== undefined) {
      chapter = await this.chapterRepository.findOne({
        where: {
          id: data.chapterId,
          course: { id: data.courseId },
        },
      });

      if (!chapter) {
        throw new BadRequestException(
          'Chapter does not exist or does not belong to the selected course',
        );
      }
    }

    const lesson = this.lessonRepository.create({
      title: data.title,
      content: data.content ?? null,
      order: data.order ?? 1,
      videoUrl: data.videoUrl ?? null,
      pdfUrl: data.pdfUrl ?? null,
      objectives: data.objectives ?? null,
      resources: data.resources ?? null,
      course,
      chapter,
    });

    return this.lessonRepository.save(lesson);
  }

  // GET ALL LESSONS
  async findAll(courseId?: number): Promise<Lesson[]> {
    return this.lessonRepository.find({
      where: courseId
        ? { course: { id: courseId } }
        : {},
      relations: {
        course: true,
        chapter: true,
      },
      order: {
        order: 'ASC',
        createdAt: 'ASC',
      },
    });
  }

  // GET LESSON BY ID
  async findOne(id: number): Promise<Lesson> {
    const lesson = await this.lessonRepository.findOne({
      where: { id },
      relations: {
        course: true,
        chapter: true,
      },
    });

    if (!lesson) {
      throw new NotFoundException(
        `Lesson with ID ${id} not found`,
      );
    }

    return lesson;
  }

  // UPDATE LESSON
  async update(
    id: number,
    data: UpdateLessonDto,
  ): Promise<Lesson> {
    const lesson = await this.findOne(id);

    if (data.chapterId !== undefined) {
      const chapter = await this.chapterRepository.findOne({
        where: {
          id: data.chapterId,
          course: { id: lesson.course.id },
        },
      });

      if (!chapter) {
        throw new BadRequestException(
          'Chapter does not exist or does not belong to this lesson course',
        );
      }

      lesson.chapter = chapter;
    }

    const { chapterId, courseId, ...updates } = data;

    Object.assign(lesson, updates);

    return this.lessonRepository.save(lesson);
  }

  // DELETE LESSON
  async remove(id: number): Promise<void> {
    const lesson = await this.findOne(id);

    await this.lessonRepository.remove(lesson);
  }
}
