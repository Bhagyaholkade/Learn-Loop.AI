import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User, UserRole } from '../users/entities/user.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

/** What the admin pages see for a student. Never includes the password. */
export interface StudentView {
  id: number;
  name: string;
  email: string;
  isEmailVerified: boolean;
  createdAt: Date;
}

const MAX_PAGE_SIZE = 100;

/**
 * Students are user accounts with role "student". Admins manage them here;
 * accounts created this way can log in straight away with the temporary
 * password the admin set.
 */
@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(
    page = 1,
    limit = 10,
    search?: string,
    sortBy: 'name' | 'createdAt' = 'createdAt',
    order: 'ASC' | 'DESC' = 'DESC',
  ) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);

    const query = this.userRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.STUDENT });

    const term = search?.trim();
    if (term) {
      query.andWhere(
        '(user.name LIKE :search OR user.email LIKE :search)',
        { search: `%${term}%` },
      );
    }

    const [users, total] = await query
      .orderBy(`user.${sortBy}`, order)
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit)
      .getManyAndCount();

    return {
      data: users.map(toView),
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async create(data: CreateStudentDto): Promise<StudentView> {
    const email = normalizeEmail(data.email);
    await this.assertEmailAvailable(email);

    const user = this.userRepository.create({
      name: data.name.trim(),
      email,
      password: await bcrypt.hash(data.password, 10),
      role: UserRole.STUDENT,
      // The admin vouches for this address, so skip the OTP step.
      isEmailVerified: true,
    });

    return toView(await this.userRepository.save(user));
  }

  async findOne(id: number): Promise<StudentView> {
    return toView(await this.findStudentOrFail(id));
  }

  async update(id: number, data: UpdateStudentDto): Promise<StudentView> {
    const student = await this.findStudentOrFail(id);

    if (data.email !== undefined) {
      const email = normalizeEmail(data.email);
      if (email !== student.email) {
        await this.assertEmailAvailable(email);
        student.email = email;
      }
    }

    if (data.name !== undefined) {
      student.name = data.name.trim();
    }

    return toView(await this.userRepository.save(student));
  }

  /** Deletes the account; enrollments, progress etc. go with it (FK cascade). */
  async remove(id: number): Promise<void> {
    const student = await this.findStudentOrFail(id);
    await this.userRepository.remove(student);
  }

  // Only ever touches role=student, so these routes can't edit or delete admins.
  private async findStudentOrFail(id: number): Promise<User> {
    const student = await this.userRepository.findOne({
      where: { id, role: UserRole.STUDENT },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    return student;
  }

  // Checks every user, not just students: emails are unique across accounts.
  private async assertEmailAvailable(email: string): Promise<void> {
    const taken = await this.userRepository.count({ where: { email } });
    if (taken > 0) {
      throw new ConflictException('An account with this email already exists.');
    }
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toView(user: User): StudentView {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
  };
}
