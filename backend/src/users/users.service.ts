import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { RegistrationOtp } from './entities/registration-otp.entity';
import { SignupDto } from '../auth/dto/signup.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(RegistrationOtp)
    private readonly registrationOtpRepository: Repository<RegistrationOtp>,
  ) {}

  // ------------------------------------------
  // SIGNUP
  // ------------------------------------------

  async signup(signupDto: SignupDto) {
    const { name, email, password } = signupDto;

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException(
        'Email is already registered',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      isEmailVerified: true,
    });

    const savedUser = await this.userRepository.save(user);

    return {
      message: 'Account created successfully. You can now log in.',
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
      where: {
        email: email.trim().toLowerCase(),
      },
    });
  }

  async findByEmailWithPassword(
    email: string,
  ): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', {
        email: email.trim().toLowerCase(),
      })
      .getOne();
  }

  // ------------------------------------------
  // EMAIL VERIFICATION (EXISTING)
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
  // REGISTRATION OTP
  // ------------------------------------------

  async saveRegistrationOtp(
    email: string,
    otpHash: string,
    expiresAt: Date,
  ): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();

    let record = await this.registrationOtpRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!record) {
      record = this.registrationOtpRepository.create({
        email: normalizedEmail,
        otpHash,
        otpExpiresAt: expiresAt,
        otpSentAt: new Date(),
        attempts: 0,
        registrationTokenHash: null,
        registrationTokenExpiresAt: null,
        verifiedAt: null,
      });
    } else {
      record.otpHash = otpHash;
      record.otpExpiresAt = expiresAt;
      record.otpSentAt = new Date();
      record.attempts = 0;
      record.registrationTokenHash = null;
      record.registrationTokenExpiresAt = null;
      record.verifiedAt = null;
    }

    await this.registrationOtpRepository.save(record);
  }

  async findRegistrationOtpByEmail(
    email: string,
  ): Promise<RegistrationOtp | null> {
    return this.registrationOtpRepository
      .createQueryBuilder('otp')
      .addSelect('otp.otpHash')
      .addSelect('otp.registrationTokenHash')
      .where('otp.email = :email', {
        email: email.trim().toLowerCase(),
      })
      .getOne();
  }

  async incrementRegistrationOtpAttempts(
    id: number,
  ): Promise<void> {
    await this.registrationOtpRepository.increment(
      { id },
      'attempts',
      1,
    );
  }

  async markRegistrationOtpVerified(
    id: number,
    registrationTokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.registrationOtpRepository.update(id, {
      verifiedAt: new Date(),
      registrationTokenHash,
      registrationTokenExpiresAt: expiresAt,
    });
  }

  async deleteRegistrationOtp(
    email: string,
  ): Promise<void> {
    await this.registrationOtpRepository.delete({
      email: email.trim().toLowerCase(),
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


  // ------------------------------------------
  // USER PROFILE
  // ------------------------------------------

  async getProfile(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateProfile(
    userId: number,
    name: string,
  ) {
    if (!name || !name.trim()) {
      throw new BadRequestException(
        'Name cannot be empty',
      );
    }

    if (name.trim().length > 100) {
      throw new BadRequestException(
        'Name cannot exceed 100 characters',
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.name = name.trim();

    const updatedUser =
      await this.userRepository.save(user);

    return {
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isEmailVerified: updatedUser.isEmailVerified,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    };
  }

}
