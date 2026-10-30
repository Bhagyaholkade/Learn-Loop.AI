
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson } from './entities/lesson.entity';
import { Course } from '../courses/entities/course.entity';

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  async create(data: {
    title: string;
    content?: string;
    order?: number;
    courseId: number;
  }): Promise<Lesson> {
    const course = await this.courseRepository.findOne({
      where: { id: data.courseId },
    });

    if (!course) {
      throw new NotFoundException(
        `Course with ID ${data.courseId} not found`,
      );
    }

    const lesson = this.lessonRepository.create({
      title: data.title,
      content: data.content ?? null,
      order: data.order ?? 1,
      course,
    });

    return this.lessonRepository.save(lesson);
  }

  async findAll(courseId?: number): Promise<Lesson[]> {
    return this.lessonRepository.find({
      where: courseId ? { course: { id: courseId } } : {},
      relations: { course: true },
      order: { order: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Lesson> {
    const lesson = await this.lessonRepository.findOne({
      where: { id },
      relations: { course: true },
    });

    if (!lesson) {
      throw new NotFoundException(
        `Lesson with ID ${id} not found`,
      );
    }

    return lesson;
  }

  async update(
    id: number,
    data: {
      title?: string;
      content?: string | null;
      order?: number;
    },
  ): Promise<Lesson> {
    const lesson = await this.findOne(id);
    Object.assign(lesson, data);
    return this.lessonRepository.save(lesson);
  }

  async remove(id: number): Promise<void> {
    const lesson = await this.findOne(id);
    await this.lessonRepository.remove(lesson);
  }
}
