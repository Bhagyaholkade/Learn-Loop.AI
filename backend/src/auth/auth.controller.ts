
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';

import { AuthService } from './auth.service';

import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  // ------------------------------------------
  // SIGNUP
  // POST /api/v1/auth/signup
  // ------------------------------------------

  @Post('signup')
  signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  // ------------------------------------------
  // VERIFY EMAIL
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

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // ------------------------------------------
  // FORGOT PASSWORD
  // POST /api/v1/auth/forgot-password
  // ------------------------------------------

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  // ------------------------------------------
  // RESET PASSWORD
  // POST /api/v1/auth/reset-password
  // ------------------------------------------

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
