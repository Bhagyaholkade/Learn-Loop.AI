
import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { SignupDto } from '../auth/dto/signup.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // ------------------------------------------
  // SIGNUP
  // ------------------------------------------

  async signup(signupDto: SignupDto) {
    const { name, email, password } = signupDto;

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException(
        'Email is already registered',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      name,
      email,
      password: hashedPassword,
      isEmailVerified: false,
    });

    const savedUser = await this.userRepository.save(user);

    return {
      message: 'User registered successfully. Please verify your email.',
      user: {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        isEmailVerified: savedUser.isEmailVerified,
        createdAt: savedUser.createdAt,
      },
    };
  }

  // ------------------------------------------
  // FIND USER
  // ------------------------------------------

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async findByEmailWithPassword(
    email: string,
  ): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  // ------------------------------------------
  // EMAIL VERIFICATION
  // ------------------------------------------

  async saveEmailVerificationToken(
    userId: number,
    hashedToken: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.userRepository.update(userId, {
      emailVerificationToken: hashedToken,
      emailVerificationExpiresAt: expiresAt,
    });
  }

  async findByEmailVerificationToken(
    hashedToken: string,
  ): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.emailVerificationToken')
      .addSelect('user.emailVerificationExpiresAt')
      .where('user.emailVerificationToken = :hashedToken', {
        hashedToken,
      })
      .getOne();
  }

  async verifyEmail(userId: number): Promise<void> {
    await this.userRepository.update(userId, {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiresAt: null,
    });
  }

  // ------------------------------------------
  // PASSWORD RESET
  // ------------------------------------------

  async savePasswordResetToken(
    userId: number,
    hashedToken: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.userRepository.update(userId, {
      passwordResetToken: hashedToken,
      passwordResetExpiresAt: expiresAt,
    });
  }

  async findByPasswordResetToken(
    hashedToken: string,
  ): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordResetToken')
      .addSelect('user.passwordResetExpiresAt')
      .where('user.passwordResetToken = :hashedToken', {
        hashedToken,
      })
      .getOne();
  }

  async updatePassword(
    userId: number,
    hashedPassword: string,
  ): Promise<void> {
    await this.userRepository.update(userId, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    });
  }

  // ------------------------------------------
  // CLEAR PASSWORD RESET TOKEN
  // ------------------------------------------

  async clearPasswordResetToken(
    userId: number,
  ): Promise<void> {
    await this.userRepository.update(userId, {
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    });
  }
}
