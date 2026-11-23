
import { Throttle } from '@nestjs/throttler';
import {
  Body,
  Controller,
  Post,
  Get,
  Delete,
  Req,
  Res,
  Param,
  Query,
  ParseIntPipe,
  ParseEnumPipe,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

import type { Request, Response } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { ChatMessageDto } from './dto/chat-message.dto';
import { AiAssistantService } from './ai-assistant.service';
import { AiConversationMode } from './entities/ai-conversation.entity';

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

  /**
   * Send a message or continue an existing conversation.
   *
   * LESSON mode:
   * - Requires lessonId.
   * - Validates lesson enrollment.
   * - Uses lesson-specific context.
   *
   * GENERAL mode:
   * - Does not require lessonId.
   * - Does not require enrollment.
   * - Supports general technical and educational questions.
   */
  @Post('chat')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Chat with LearnLoop AI',
    description:
      'Send a message or continue an existing conversation in LESSON or GENERAL mode.',
  })
  @ApiResponse({
    status: 201,
    description: 'AI response generated successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or conversation mode.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  async chat(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ChatMessageDto,
  ) {
    return this.aiAssistantService.chat(
      req.user.id,
      dto,
    );
  }

  /**
   * Stream an AI response using Server-Sent Events.
   *
   * Events:
   * - start: Conversation information.
   * - chunk: Progressive AI response text.
   * - done: Generation completed.
   * - error: Generation failed.
   */
  @Post('chat/stream')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Stream AI chat response',
    description:
      'Generate a progressive AI response using Server-Sent Events (SSE).',
  })
  @ApiConsumes('application/json')
  @ApiBody({
    type: ChatMessageDto,
  })
  @ApiResponse({
    status: 200,
    description: 'AI response streamed successfully.',
    content: {
      'text/event-stream': {
        schema: {
          type: 'string',
          example:
            'event: chunk\ndata: {"text":"Hello"}\n\n',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  async streamChat(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ChatMessageDto,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader(
      'Content-Type',
      'text/event-stream; charset=utf-8',
    );

    res.setHeader(
      'Cache-Control',
      'no-cache, no-transform',
    );

    res.setHeader(
      'Connection',
      'keep-alive',
    );

    res.setHeader(
      'X-Accel-Buffering',
      'no',
    );

    res.flushHeaders();

    let clientDisconnected = false;

    const handleClose = () => {
      clientDisconnected = true;
    };

    res.on('close', handleClose);

    const sendEvent = (
      event: string,
      data: Record<string, unknown>,
    ) => {
      if (clientDisconnected || res.writableEnded) {
        return;
      }

      res.write(
        `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
      );
    };

    try {
      const stream = this.aiAssistantService.streamChat(
        req.user.id,
        dto,
      );

      for await (const event of stream) {
        if (clientDisconnected || res.writableEnded) {
          break;
        }

        switch (event.type) {
          case 'start':
            sendEvent('start', {
              conversationId: event.conversationId,
              mode: event.mode,
              lessonId: event.lessonId,
              lessonTitle: event.lessonTitle,
            });
            break;

          case 'chunk':
            sendEvent('chunk', {
              text: event.text,
            });
            break;

          case 'done':
            sendEvent('done', {
              conversationId: event.conversationId,
            });
            break;
        }
      }
    } catch (error: unknown) {
      if (!clientDisconnected && !res.writableEnded) {
        const status =
          error instanceof HttpException
            ? error.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
          error instanceof HttpException
            ? error.message
            : 'AI response generation failed. Please try again.';

        sendEvent('error', {
          status,
          message,
        });
      }
    } finally {
      res.off('close', handleClose);

      if (!res.writableEnded) {
        res.end();
      }
    }
  }

  /**
   * Get conversations belonging to the authenticated student.
   *
   * Optional mode filter:
   * - LESSON
   * - GENERAL
   *
   * If mode is omitted, returns all conversations.
   */
  @Get('conversations')
  @ApiOperation({
    summary: 'Get my AI conversations',
    description:
      'Retrieve all conversations or filter by LESSON or GENERAL mode.',
  })
  @ApiQuery({
    name: 'mode',
    required: false,
    enum: AiConversationMode,
    description: 'Filter conversations by mode.',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversations retrieved successfully.',
  })
  async getConversations(
    @Req() req: AuthenticatedRequest,
    @Query(
      'mode',
      new ParseEnumPipe(AiConversationMode, {
        optional: true,
      }),
    )
    mode?: AiConversationMode,
  ) {
    return this.aiAssistantService.getConversations(
      req.user.id,
      mode,
    );
  }

  /**
   * Get a specific conversation with its messages.
   */
  @Get('conversations/:id')
  @ApiOperation({
    summary: 'Get conversation details',
    description:
      'Retrieve a conversation and its complete message history.',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversation retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Conversation not found.',
  })
  async getConversation(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.aiAssistantService.getConversation(
      req.user.id,
      id,
    );
  }

  /**
   * Delete a conversation belonging to the authenticated student.
   *
   * Associated messages are deleted through the database cascade.
   */
  @Delete('conversations/:id')
  @ApiOperation({
    summary: 'Delete an AI conversation',
    description:
      'Delete a conversation and its associated messages.',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversation deleted successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Conversation not found.',
  })
  async deleteConversation(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.aiAssistantService.deleteConversation(
      req.user.id,
      id,
    );
  }
}
