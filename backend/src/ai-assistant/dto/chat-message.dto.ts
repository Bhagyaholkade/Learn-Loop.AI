
import {
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { Type } from 'class-transformer';

export class ChatMessageDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  lessonId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  message: string;
}
