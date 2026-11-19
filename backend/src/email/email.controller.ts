import {
  Controller,
  Post,
  Body,
} from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email-test')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  async sendTestEmail(
    @Body('email') email: string,
  ) {
    await this.emailService.sendEmail(
      email,
      'LearnLoop AI - Email Test',
      '<h1>Resend is working!</h1><p>Your email integration is successful.</p>',
    );

    return {
      message: 'Test email sent successfully',
    };
  }
}