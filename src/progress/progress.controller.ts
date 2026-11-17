
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
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: UserRole;
  };
}

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(
    private readonly progressService: ProgressService,
  ) {}

  // Mark a lesson as completed
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

  // Get logged-in student's progress
  @Get('my')
  getMyProgress(@Req() req: AuthenticatedRequest) {
    return this.progressService.getMyProgress(req.user.id);
  }

  // Get logged-in student's course-wise progress
  @Get('summary')
  getCourseProgressSummary(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.progressService.getCourseProgressSummary(
      req.user.id,
    );
  }

  // Admin-only: Get all students' course progress
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getAllStudentsProgress() {
    return this.progressService.getAllStudentsProgress();
  }
}
