
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { Request } from 'express';

import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(
    private readonly progressService: ProgressService,
  ) {}

  @Post('complete')
  markCompleted(
    @Req() req: AuthenticatedRequest,
    @Body('lessonId', ParseIntPipe) lessonId: number,
  ) {
    return this.progressService.markCompleted(
      req.user.id,
      lessonId,
    );
  }

  @Get('my')
  getMyProgress(@Req() req: AuthenticatedRequest) {
    return this.progressService.getMyProgress(req.user.id);
  }
 
@Get('summary')
getCourseProgressSummary(@Req() req: AuthenticatedRequest) {
  return this.progressService.getCourseProgressSummary(
    req.user.id,
  );
}

}
