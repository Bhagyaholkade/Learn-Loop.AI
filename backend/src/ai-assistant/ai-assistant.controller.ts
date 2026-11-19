
import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatMessageDto } from './dto/chat-message.dto';
import { AiAssistantService } from './ai-assistant.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

@ApiTags('AI Learning Assistant')
@ApiBearerAuth('bearer')
@Controller('ai-assistant')
@UseGuards(JwtAuthGuard)
export class AiAssistantController {
  constructor(
    private readonly aiAssistantService: AiAssistantService,
  ) {}

  @Post('chat')
  async chat(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ChatMessageDto,
  ) {
    return this.aiAssistantService.chat(
      req.user.id,
      dto.lessonId,
      dto.message,
    );
  }
}
