import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Resend } from 'resend';

type MailProvider = 'smtp' | 'resend';

/**
 * Sends email through either SMTP (e.g. Gmail) or Resend.
 *
 * MAIL_PROVIDER=smtp   -> MAIL_HOST, MAIL_PORT, MAIL_SECURE, MAIL_USER, MAIL_PASSWORD
 * MAIL_PROVIDER=resend -> RESEND_API_KEY
 * Both use MAIL_FROM as the sender.
 */
@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private readonly provider: MailProvider;
  private readonly fromEmail: string;
  private readonly devFallback: boolean;
  private transporter?: nodemailer.Transporter;
  private resend?: Resend;

  constructor(private readonly configService: ConfigService) {
    this.provider =
      this.configService.get<string>('MAIL_PROVIDER', 'smtp') === 'resend'
        ? 'resend'
        : 'smtp';

    this.devFallback =
      this.configService.get<string>('MAIL_DEV_FALLBACK') === 'true';

    if (this.provider === 'resend') {
      const apiKey = this.configService.get<string>('RESEND_API_KEY');
      if (!apiKey) {
        throw new Error('RESEND_API_KEY is missing from environment variables');
      }
      this.resend = new Resend(apiKey);
      this.fromEmail =
        this.configService.get<string>('MAIL_FROM') ??
        'LearnLoop AI <onboarding@resend.dev>';
      return;
    }

    const host = this.configService.get<string>('MAIL_HOST', 'smtp.gmail.com');
    const port = Number(this.configService.get<string>('MAIL_PORT', '465'));
    const secure =
      this.configService.get<string>('MAIL_SECURE', String(port === 465)) ===
      'true';
    const user = this.configService.get<string>('MAIL_USER');
    // Gmail shows app passwords with spaces; strip them just in case.
    const pass = this.configService
      .get<string>('MAIL_PASSWORD')
      ?.replace(/\s+/g, '');

    if (!user || !pass) {
      throw new Error(
        'SMTP email is not configured: set MAIL_USER and MAIL_PASSWORD',
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      // Fail fast instead of hanging for minutes when the SMTP port is
      // blocked (e.g. Render's free tier blocks outbound SMTP).
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
    this.fromEmail =
      this.configService.get<string>('MAIL_FROM') ?? `LearnLoop AI <${user}>`;
  }

  async onModuleInit(): Promise<void> {
    if (!this.transporter) {
      this.logger.log('Email provider: Resend');
      return;
    }
    // Check the SMTP login at startup so misconfiguration shows up early,
    // without blocking the app from booting.
    try {
      await this.transporter.verify();
      this.logger.log('Email provider: SMTP (connection verified)');
    } catch (error) {
      this.logger.error(
        `SMTP connection check failed: ${this.describeError(error)}`,
      );
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      if (this.transporter) {
        const info = await this.transporter.sendMail({
          from: this.fromEmail,
          to,
          subject,
          html,
        });
        this.logger.log(`Email sent to ${to}. Message ID: ${info.messageId}`);
        return;
      }

      const { data, error } = await this.resend!.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html,
      });
      if (error) {
        throw new Error(`Resend API error: ${error.message}`);
      }
      this.logger.log(`Email sent to ${to}. Resend ID: ${data?.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to}: ${this.describeError(error)}`,
      );

      if (this.devFallback) {
        this.logDevFallback(to, subject, html);
        return;
      }

      throw new InternalServerErrorException(
        'Unable to send email. Please try again later.',
      );
    }
  }

  isConfigured(): boolean {
    return Boolean(this.transporter ?? this.resend);
  }

  private describeError(error: unknown): string {
    if (error instanceof Error) {
      const { code, response } = error as Error & {
        code?: string;
        response?: string;
      };
      return [code, response ?? error.message].filter(Boolean).join(' - ');
    }
    return String(error);
  }

  /**
   * Development-only: when MAIL_DEV_FALLBACK=true, print the email (and any
   * links in it) to the console instead of failing the request.
   */
  private logDevFallback(to: string, subject: string, html: string): void {
    const links = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    this.logger.warn(
      `[MAIL_DEV_FALLBACK] Email not delivered. To: ${to} | Subject: ${subject}` +
        (links.length ? `\n  Links:\n  ${links.join('\n  ')}` : ''),
    );
  }
}
