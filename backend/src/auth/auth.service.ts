
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import {
  createHash,
  randomBytes,
} from 'crypto';

import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';

import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  // Generate a cryptographically secure token
  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  // Store only the SHA-256 hash in the database
  private hashToken(token: string): string {
    return createHash('sha256')
      .update(token)
      .digest('hex');
  }

  // ------------------------------------------
  // SIGNUP
  // ------------------------------------------

  async signup(signupDto: SignupDto) {
    const result = await this.usersService.signup(signupDto);

    const userId = result.user.id;
    const email = result.user.email;
    const name = result.user.name;

    const token = this.generateToken();
    const hashedToken = this.hashToken(token);

    // Verification link expires in 30 minutes
    const expiresAt = new Date(
      Date.now() + 30 * 60 * 1000,
    );

    await this.usersService.saveEmailVerificationToken(
      userId,
      hashedToken,
      expiresAt,
    );

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL');

    if (!frontendUrl) {
      throw new Error('FRONTEND_URL is not configured');
    }

    const verificationLink =
      `${frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;

    await this.emailService.sendEmail(
      email,
      'Verify your LearnLoop AI account',
      `
        <div style="font-family: Arial, sans-serif; padding: 24px;">
          <h2>Welcome to LearnLoop AI, ${name}!</h2>
          <p>Please verify your email address to activate your account.</p>
          <a
            href="${verificationLink}"
            style="
              display: inline-block;
              padding: 12px 24px;
              background: #2563eb;
              color: white;
              text-decoration: none;
              border-radius: 6px;
            "
          >
            Verify Email
          </a>
          <p>This link expires in 30 minutes.</p>
          <p>If you did not create this account, you can ignore this email.</p>
        </div>
      `,
    );

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
      user: result.user,
    };
  }

  // ------------------------------------------
  // VERIFY EMAIL
  // ------------------------------------------

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException(
        'Verification token is required',
      );
    }

    const hashedToken = this.hashToken(token);

    const user =
      await this.usersService.findByEmailVerificationToken(
        hashedToken,
      );

    if (!user) {
      throw new BadRequestException(
        'Invalid or expired verification link',
      );
    }

    if (
      !user.emailVerificationExpiresAt ||
      user.emailVerificationExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException(
        'Verification link has expired',
      );
    }

    if (user.isEmailVerified) {
      throw new BadRequestException(
        'Email is already verified',
      );
    }

    await this.usersService.verifyEmail(user.id);

    return {
      message: 'Email verified successfully. You can now log in.',
    };
  }

  // ------------------------------------------
  // LOGIN
  // ------------------------------------------

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user =
      await this.usersService.findByEmailWithPassword(email);

    if (!user) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken =
      await this.jwtService.signAsync(payload);

    return {
      message: 'Login successful',
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  // ------------------------------------------
  // FORGOT PASSWORD
  // ------------------------------------------

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(
      dto.email,
    );

    // Do not reveal whether an email exists
    if (!user) {
      return {
        message:
          'If an account exists with this email, a password reset link will be sent.',
      };
    }

    const token = this.generateToken();
    const hashedToken = this.hashToken(token);

    // Reset link expires in 15 minutes
    const expiresAt = new Date(
      Date.now() + 15 * 60 * 1000,
    );

    await this.usersService.savePasswordResetToken(
      user.id,
      hashedToken,
      expiresAt,
    );

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL');

    if (!frontendUrl) {
      throw new Error('FRONTEND_URL is not configured');
    }

    const resetLink =
      `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;

    await this.emailService.sendEmail(
      user.email,
      'Reset your LearnLoop AI password',
      `
        <div style="font-family: Arial, sans-serif; padding: 24px;">
          <h2>Password Reset Request</h2>
          <p>Hello ${user.name},</p>
          <p>We received a request to reset your password.</p>
          <a
            href="${resetLink}"
            style="
              display: inline-block;
              padding: 12px 24px;
              background: #2563eb;
              color: white;
              text-decoration: none;
              border-radius: 6px;
            "
          >
            Reset Password
          </a>
          <p>This link expires in 15 minutes.</p>
          <p>If you did not request this, you can ignore this email.</p>
        </div>
      `,
    );

    return {
      message:
        'If an account exists with this email, a password reset link will be sent.',
    };
  }

  // ------------------------------------------
  // RESET PASSWORD
  // ------------------------------------------

  async resetPassword(dto: ResetPasswordDto) {
    const hashedToken = this.hashToken(dto.token);

    const user =
      await this.usersService.findByPasswordResetToken(
        hashedToken,
      );

    if (!user) {
      throw new BadRequestException(
        'Invalid or expired password reset link',
      );
    }

    if (
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt.getTime() < Date.now()
    ) {
      await this.usersService.clearPasswordResetToken(
        user.id,
      );

      throw new BadRequestException(
        'Password reset link has expired',
      );
    }

    const hashedPassword = await bcrypt.hash(
      dto.newPassword,
      10,
    );

    await this.usersService.updatePassword(
      user.id,
      hashedPassword,
    );

    return {
      message:
        'Password reset successfully. Please log in with your new password.',
    };
  }
}
