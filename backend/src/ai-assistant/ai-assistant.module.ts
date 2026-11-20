
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AiQuizModule } from '../ai-quiz/ai-quiz.module';
import { LessonsModule } from '../lessons/lessons.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';

import { AiConversation } from './entities/ai-conversation.entity';
import { AiMessage } from './entities/ai-message.entity';

import { AiAssistantController } from './ai-assistant.controller';
import { AiAssistantService } from './ai-assistant.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiConversation,
      AiMessage,
    ]),
    AiQuizModule,
    LessonsModule,
    EnrollmentsModule,
  ],
  controllers: [AiAssistantController],
  providers: [AiAssistantService],
  exports: [AiAssistantService],
})
export class AiAssistantModule {}
