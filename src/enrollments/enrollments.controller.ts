
import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

@ApiTags('Enrollments')
@ApiBearerAuth('bearer')
@Controller('enrollments')
@UseGuards(JwtAuthGuard)
export class EnrollmentsController {
  constructor(
    private readonly enrollmentsService: EnrollmentsService,
  ) {}

  // Admin: retrieve all enrollments.
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all enrollments (Admin only)',
  })
  findAllEnrollments() {
    return this.enrollmentsService.findAllEnrollments();
  }

  // Enroll the logged-in user in a course.
  @Post()
  @ApiOperation({ summary: 'Enroll in a course' })
  enroll(
    @Req() req: AuthenticatedRequest,
    @Body() data: CreateEnrollmentDto,
  ) {
    return this.enrollmentsService.enroll(
      req.user.id,
      data.courseId,
    );
  }

  // Get the logged-in user's enrollments.
  @Get('my')
  @ApiOperation({ summary: 'Get my enrollments' })
  findMyEnrollments(@Req() req: AuthenticatedRequest) {
    return this.enrollmentsService.findMyEnrollments(
      req.user.id,
    );
  }

  // Get one enrollment belonging to the logged-in user.
  @Get(':id')
  @ApiOperation({
    summary: 'Get one of my enrollments',
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.enrollmentsService.findOneForUser(
      id,
      req.user.id,
    );
  }
}
