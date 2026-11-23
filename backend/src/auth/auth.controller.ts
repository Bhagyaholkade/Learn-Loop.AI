
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';

import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service';

import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendRegistrationOtpDto } from './dto/send-registration-otp.dto';
import { VerifyRegistrationOtpDto } from './dto/verify-registration-otp.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  // ------------------------------------------
  // SEND REGISTRATION OTP
  // POST /api/v1/auth/send-registration-otp
  // ------------------------------------------

  // Sends an email: max 5 per 10 minutes per IP.
  @Throttle({ default: { limit: 5, ttl: 600000 } })
  @Post('send-registration-otp')
  sendRegistrationOtp(
    @Body() dto: SendRegistrationOtpDto,
  ) {
    return this.authService.sendRegistrationOtp(dto);
  }

  // ------------------------------------------
  // VERIFY REGISTRATION OTP
  // POST /api/v1/auth/verify-registration-otp
  // ------------------------------------------

  @Throttle({ default: { limit: 10, ttl: 600000 } })
  @Post('verify-registration-otp')
  verifyRegistrationOtp(
    @Body() dto: VerifyRegistrationOtpDto,
  ) {
    return this.authService.verifyRegistrationOtp(dto);
  }

  // ------------------------------------------
  // SIGNUP
  // POST /api/v1/auth/signup
  // ------------------------------------------

  @Throttle({ default: { limit: 10, ttl: 600000 } })
  @Post('signup')
  signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  // ------------------------------------------
  // LEGACY EMAIL VERIFICATION
  // GET /api/v1/auth/verify-email?token=...
  // ------------------------------------------

  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  // ------------------------------------------
  // LOGIN
  // POST /api/v1/auth/login
  // ------------------------------------------

  // Slows down password guessing: max 10 attempts per minute per IP.
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // ------------------------------------------
  // FORGOT PASSWORD
  // POST /api/v1/auth/forgot-password
  // ------------------------------------------

  // Sends an email: max 5 per 10 minutes per IP.
  @Throttle({ default: { limit: 5, ttl: 600000 } })
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  // ------------------------------------------
  // RESET PASSWORD
  // POST /api/v1/auth/reset-password
  // ------------------------------------------

  @Throttle({ default: { limit: 10, ttl: 600000 } })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
