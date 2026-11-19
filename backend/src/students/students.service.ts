
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Or, Repository } from 'typeorm';

import { Student } from './entities/student.entity/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';


@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  // GET: Retrieve students with pagination
  

async findAll(
  page = 1,
  limit = 10,
  search?: string,
  sortBy: 'name' | 'createdAt' = 'createdAt',
  order: 'ASC' | 'DESC' = 'DESC',
) {
  const query = this.studentRepository.createQueryBuilder('student');

  if (search) {
    query.where(
      '(student.name LIKE :search OR student.email LIKE :search)',
      { search: `%${search}%` },
    );
  }

  const [data, total] = await query
    .orderBy(`student.${sortBy}`, order)
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}


  // POST: Create a student
  async create(data: CreateStudentDto): Promise<Student> {
    const existingStudent = await this.studentRepository.findOne({
      where: { email: data.email },
    });

    if (existingStudent) {
      throw new ConflictException('Email already exists');
    }

    const student = this.studentRepository.create(data);

    return this.studentRepository.save(student);
  }

  // GET: Retrieve one student by ID
  async findOne(id: number): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { id },
    });

    if (!student) {
      throw new NotFoundException(
        `Student with ID ${id} not found`,
      );
    }

    return student;
  }

  // PATCH: Update a student
async update(
  id: number,
  data: UpdateStudentDto,
): Promise<Student> {
  const student = await this.findOne(id);

  if (data.email && data.email !== student.email) {
    const existingStudent = await this.studentRepository.findOne({
      where: { email: data.email },
    });

    if (existingStudent) {
      throw new ConflictException('Email already exists');
    }
  }

  Object.assign(student, data);

  return this.studentRepository.save(student);
}

  // DELETE: Remove a student
  async remove(id: number): Promise<void> {
    const student = await this.studentRepository.findOne({
      where: { id },
    });

    if (!student) {
      throw new NotFoundException(
        `Student with ID ${id} not found`,
      );
    }

    await this.studentRepository.remove(student);
  }

  
}
