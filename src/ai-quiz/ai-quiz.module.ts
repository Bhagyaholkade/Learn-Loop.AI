import { Module } from '@nestjs/common';

import { GeminiService } from './gemini.service';
import { AiQuizService } from './ai-quiz.service';
import { AiQuizController } from './ai-quiz.controller';

@Module({
  controllers: [AiQuizController],
  providers: [GeminiService, AiQuizService],
  exports: [GeminiService, AiQuizService],
})
export class AiQuizModule {}