
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

import { QuizzesService } from './quizzes.service';

import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Quizzes')
@ApiBearerAuth('bearer')
@Controller('quizzes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class QuizzesController {
  constructor(
    private readonly quizzesService: QuizzesService,
  ) {}

  // 1. Create a quiz
  @Post()
  create(@Body() dto: CreateQuizDto) {
    return this.quizzesService.create(dto);
  }

  // 2. Get all quizzes
  @Get()
  findAll() {
    return this.quizzesService.findAll();
  }

    // Get all student quiz attempts (Admin)
  @Get('admin/attempts')
  getAllAttempts() {
    return this.quizzesService.getAllAttempts();
  }

  // 3. Get quiz by ID
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.quizzesService.findOne(id);
  }

  // 4. Update a quiz
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuizDto,
  ) {
    return this.quizzesService.update(id, dto);
  }

  // 5. Delete a quiz
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.quizzesService.remove(id);
  }

  // 6. Publish a quiz
  @Patch(':id/publish')
  publish(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.quizzesService.publish(id);
  }

  // 7. Unpublish a quiz
  @Patch(':id/unpublish')
  unpublish(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.quizzesService.unpublish(id);
  }

  // 8. Add a question
  @Post(':quizId/questions')
  addQuestion(
    @Param('quizId', ParseIntPipe) quizId: number,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.quizzesService.addQuestion(
      quizId,
      dto,
    );
  }

  // 9. Get questions
  @Get(':quizId/questions')
  findQuestions(
    @Param('quizId', ParseIntPipe) quizId: number,
  ) {
    return this.quizzesService.findQuestions(quizId);
  }

  // 10. Update a question
  @Put(':quizId/questions/:questionId')
  updateQuestion(
    @Param('quizId', ParseIntPipe) quizId: number,
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.quizzesService.updateQuestion(
      quizId,
      questionId,
      dto,
    );
  }



  // 11. Delete a question
  @Delete(':quizId/questions/:questionId')
  removeQuestion(
    @Param('quizId', ParseIntPipe) quizId: number,
    @Param('questionId', ParseIntPipe) questionId: number,
  ) {
    return this.quizzesService.removeQuestion(
      quizId,
      questionId,
    );
  }

    // Approve an AI-generated quiz
@Patch(':id/approve')
approveAiQuiz(
  @Param('id', ParseIntPipe) id: number,
) {
  return this.quizzesService.approveAiQuiz(id);
}

}
