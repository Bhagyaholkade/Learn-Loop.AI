
import {
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

import { GeminiService } from './gemini.service';
import { AiQuizService } from './ai-quiz.service';

import { TestGeminiDto } from './dto/test-gemini.dto';
import { GenerateAiQuizDto } from './dto/generate-ai-quiz.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('AI Quiz')
@ApiBearerAuth('bearer')
@Controller('ai-quiz')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AiQuizController {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly aiQuizService: AiQuizService,
  ) {}

  // 1. Test Gemini connection (Admin only)
  @Post('test')
  async testGemini(@Body() dto: TestGeminiDto) {
    const response = await this.geminiService.generateText(
      dto.prompt,
    );

    return {
      success: true,
      message: 'Gemini AI is connected successfully!',
      data: response,
    };
  }

  // 2. Generate an AI chapter-wise quiz
  @Post('generate')
  async generateChapterQuiz(
    @Body() dto: GenerateAiQuizDto,
  ) {
    return this.aiQuizService.generateChapterQuiz(dto);
  }
}
