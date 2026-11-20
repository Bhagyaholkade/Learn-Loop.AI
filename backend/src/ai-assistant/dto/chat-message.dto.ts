
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { Type } from 'class-transformer';
import { AiConversationMode } from '../entities/ai-conversation.entity';

export class ChatMessageDto {
  /**
   * Required for LESSON mode.
   * Not required for GENERAL mode.
   * Mode-specific validation is handled in AiAssistantService.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  lessonId?: number;

  /**
   * User's message sent to the AI assistant.
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  message: string;

  /**
   * Optional conversation ID.
   * If provided, the backend verifies ownership,
   * mode, and lesson association.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  conversationId?: number;

  /**
   * Conversation mode.
   * Defaults to LESSON for backward compatibility.
   */
  @IsOptional()
  @IsEnum(AiConversationMode, {
    message: 'Mode must be either LESSON or GENERAL',
  })
  mode: AiConversationMode = AiConversationMode.LESSON;
}
