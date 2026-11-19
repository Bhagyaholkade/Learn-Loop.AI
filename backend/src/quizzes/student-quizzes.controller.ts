
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

import { QuizzesService } from './quizzes.service';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

interface AuthenticatedRequest {
  user: {
    id: number;
    email: string;
    role: UserRole;
  };
}

@ApiTags('Student Quizzes')
@ApiBearerAuth('bearer')
@Controller('student/quizzes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
export class StudentQuizzesController {
  constructor(
    private readonly quizzesService: QuizzesService,
  ) {}

  // 1. Get published quizzes
  @Get()
  getPublishedQuizzes(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.quizzesService.findPublishedForStudent(
      req.user.id,
    );
  }

  // 2. Get quiz questions
  @Get(':quizId/questions')
  getQuestions(
    @Param('quizId', ParseIntPipe) quizId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.quizzesService.getStudentQuizQuestions(
      quizId,
      req.user.id,
    );
  }

  // 3. Submit quiz
  @Post(':quizId/submit')
  submitQuiz(
    @Param('quizId', ParseIntPipe) quizId: number,
    @Body() dto: SubmitQuizDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.quizzesService.submitAttempt(
      quizId,
      req.user.id,
      dto,
    );
  }

  // 4. Get my quiz attempts
  @Get('attempts')
  getMyAttempts(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.quizzesService.getMyAttempts(
      req.user.id,
    );
  }

  // 5. Get detailed result of a previous quiz attempt
@Get('attempts/:attemptId')
getMyAttemptResult(
  @Param('attemptId', ParseIntPipe) attemptId: number,
  @Req() req: AuthenticatedRequest,
) {
  return this.quizzesService.getMyAttemptResult(
    req.user.id,
    attemptId,
  );
}

}
