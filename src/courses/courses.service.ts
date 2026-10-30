
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './entities/course.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  // Create a course
  async create(data: Partial<Course>): Promise<Course> {
    const course = this.courseRepository.create(data);
    return this.courseRepository.save(course);
  }

  // Retrieve all courses
  async findAll(query: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}) {
  const {
    page = 1,
    limit = 10,
    search,
    category,
    sortBy = 'createdAt',
    order = 'DESC',
  } = query;

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 10));

  const allowedSortFields = [
    'id',
    'title',
    'category',
    'createdAt',
  ];

  const safeSortBy = allowedSortFields.includes(sortBy)
    ? sortBy
    : 'createdAt';

  const queryBuilder = this.courseRepository
    .createQueryBuilder('course');

  if (search?.trim()) {
    queryBuilder.andWhere(
      '(course.title LIKE :search OR course.description LIKE :search OR course.instructor LIKE :search)',
      { search: `%${search.trim()}%` },
    );
  }

  if (category?.trim()) {
    queryBuilder.andWhere('course.category = :category', {
      category: category.trim(),
    });
  }

  queryBuilder
    .orderBy(`course.${safeSortBy}`, order === 'ASC' ? 'ASC' : 'DESC')
    .skip((safePage - 1) * safeLimit)
    .take(safeLimit);

  const [courses, total] = await queryBuilder.getManyAndCount();

  return {
    data: courses,
    meta: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

  // Retrieve one course by ID
  async findOne(id: number): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException(
        `Course with ID ${id} not found`,
      );
    }

    return course;
  }

  // Update a course
  async update(
    id: number,
    data: Partial<Course>,
  ): Promise<Course> {
    const course = await this.findOne(id);

    Object.assign(course, data);

    return this.courseRepository.save(course);
  }

  // Delete a course
  async remove(id: number): Promise<void> {
    const course = await this.findOne(id);

    await this.courseRepository.remove(course);
  }
}
