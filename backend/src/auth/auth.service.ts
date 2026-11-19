
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import {
  createHash,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from 'crypto';

import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';

import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendRegistrationOtpDto } from './dto/send-registration-otp.dto';
import { VerifyRegistrationOtpDto } from './dto/verify-registration-otp.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  private readonly OTP_EXPIRY_MS = 5 * 60 * 1000;
  private readonly OTP_RESEND_COOLDOWN_MS = 60 * 1000;
  private readonly MAX_OTP_ATTEMPTS = 5;
  private readonly REGISTRATION_TOKEN_EXPIRY_MS = 10 * 60 * 1000;

  // ------------------------------------------
  // TOKEN HELPERS
  // ------------------------------------------

  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  private hashToken(token: string): string {
    return createHash('sha256')
      .update(token)
      .digest('hex');
  }

  private generateOtp(): string {
    return randomInt(0, 1_000_000)
      .toString()
      .padStart(6, '0');
  }

  private safeHashCompare(
    firstHash: string,
    secondHash: string,
  ): boolean {
    const first = Buffer.from(firstHash, 'hex');
    const second = Buffer.from(secondHash, 'hex');

    return (
      first.length === second.length &&
      first.length === 32 &&
      timingSafeEqual(first, second)
    );
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  // ------------------------------------------
  // SEND REGISTRATION OTP
  // POST /auth/send-registration-otp
  // ------------------------------------------

  async sendRegistrationOtp(dto: SendRegistrationOtpDto) {
    const email = this.normalizeEmail(dto.email);

    const existingUser =
      await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException(
        'An account with this email already exists.',
      );
    }

    const existingOtp =
      await this.usersService.findRegistrationOtpByEmail(
        email,
      );

    // Resend cooldown
    if (
      existingOtp &&
      Date.now() - existingOtp.otpSentAt.getTime() <
        this.OTP_RESEND_COOLDOWN_MS
    ) {
      const remainingSeconds = Math.ceil(
        (
          this.OTP_RESEND_COOLDOWN_MS -
          (Date.now() - existingOtp.otpSentAt.getTime())
        ) / 1000,
      );

    throw new HttpException(
      `Please wait ${remainingSeconds} seconds before requesting another OTP.`,
      HttpStatus.TOO_MANY_REQUESTS,
    );
    }

    const otp = this.generateOtp();
    const otpHash = this.hashToken(otp);

    const expiresAt = new Date(
      Date.now() + this.OTP_EXPIRY_MS,
    );

    await this.usersService.saveRegistrationOtp(
      email,
      otpHash,
      expiresAt,
    );

    try {
      await this.emailService.sendEmail(
        email,
        'Your LearnLoop AI verification code',
        `
          <div style="font-family: Arial, sans-serif; padding: 24px;">
            <h2>Verify your email address</h2>

            <p>Welcome to LearnLoop AI!</p>

            <p>Use the following OTP to verify your email address:</p>

            <div style="
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #ff642d;
              padding: 20px;
              background: #fff4ed;
              display: inline-block;
              border-radius: 8px;
            ">
              ${otp}
            </div>

            <p>This OTP expires in 5 minutes.</p>

            <p>If you did not request this code, please ignore this email.</p>
          </div>
        `,
      );
    } catch {
      await this.usersService.deleteRegistrationOtp(email);

      throw new BadRequestException(
        'Unable to send verification email. Please try again.',
      );
    }

    return {
      message: 'Verification OTP sent successfully.',
      expiresIn: 300,
      resendAfter: 60,
    };
  }

  // ------------------------------------------
  // VERIFY REGISTRATION OTP
  // POST /auth/verify-registration-otp
  // ------------------------------------------

  async verifyRegistrationOtp(
    dto: VerifyRegistrationOtpDto,
  ) {
    const email = this.normalizeEmail(dto.email);

    const record =
      await this.usersService.findRegistrationOtpByEmail(
        email,
      );

    if (!record) {
      throw new BadRequestException(
        'No registration OTP found. Please request a new OTP.',
      );
    }

    if (record.verifiedAt) {
      throw new BadRequestException(
        'This email has already been verified for registration.',
      );
    }

    if (record.attempts >= this.MAX_OTP_ATTEMPTS) {
      throw new HttpException(
        'Maximum OTP attempts exceeded. Please request a new OTP.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (record.otpExpiresAt.getTime() <= Date.now()) {
      throw new BadRequestException(
        'OTP has expired. Please request a new OTP.',
      );
    }

    const submittedOtpHash = this.hashToken(dto.otp);

    if (
      !this.safeHashCompare(
        record.otpHash,
        submittedOtpHash,
      )
    ) {
      await this.usersService.incrementRegistrationOtpAttempts(
        record.id,
      );

      throw new BadRequestException(
        'Invalid OTP. Please check your code and try again.',
      );
    }

    // Generate a separate registration token.
    const registrationToken = this.generateToken();

    const registrationTokenHash =
      this.hashToken(registrationToken);

    const tokenExpiresAt = new Date(
      Date.now() + this.REGISTRATION_TOKEN_EXPIRY_MS,
    );

    await this.usersService.markRegistrationOtpVerified(
      record.id,
      registrationTokenHash,
      tokenExpiresAt,
    );

    return {
      message: 'Email verified successfully.',
      registrationToken,
      expiresIn: 600,
    };
  }

  // ------------------------------------------
  // SIGNUP
  // POST /auth/signup
  // ------------------------------------------

  async signup(signupDto: SignupDto) {
    const email = this.normalizeEmail(signupDto.email);

    const record =
      await this.usersService.findRegistrationOtpByEmail(
        email,
      );

    if (!record || !record.verifiedAt) {
      throw new UnauthorizedException(
        'Please verify your email before creating an account.',
      );
    }

    if (
      !record.registrationTokenHash ||
      !record.registrationTokenExpiresAt ||
      record.registrationTokenExpiresAt.getTime() <= Date.now()
    ) {
      throw new UnauthorizedException(
        'Registration verification has expired. Please verify your email again.',
      );
    }

    const submittedTokenHash = this.hashToken(
      signupDto.registrationToken,
    );

    if (
      !this.safeHashCompare(
        record.registrationTokenHash,
        submittedTokenHash,
      )
    ) {
      throw new UnauthorizedException(
        'Invalid registration verification token.',
      );
    }

    // Check that the email has not already been registered.
    const existingUser =
      await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException(
        'Email is already registered.',
      );
    }

    const result = await this.usersService.signup({
      ...signupDto,
      email,
    });

    // Remove temporary registration data after successful signup.
    await this.usersService.deleteRegistrationOtp(email);

    return result;
  }

  // ------------------------------------------
  // LEGACY EMAIL VERIFICATION
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
    const email = this.normalizeEmail(loginDto.email);
    const { password } = loginDto;

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

    if (!user) {
      return {
        message:
          'If an account exists with this email, a password reset link will be sent.',
      };
    }

    const token = this.generateToken();
    const hashedToken = this.hashToken(token);

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
          <a href="${resetLink}">
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
