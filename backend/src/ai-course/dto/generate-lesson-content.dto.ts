
import {
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class GenerateLessonContentDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  additionalInstructions?: string;
}
