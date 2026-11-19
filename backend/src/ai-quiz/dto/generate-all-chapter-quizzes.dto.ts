
import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class GenerateAllChapterQuizzesDto {
  @IsInt()
  @Min(1)
  courseId: number;

  @IsInt()
  @Min(1)
  @Max(50)
  numberOfQuestions: number;

  @IsInt()
  @Min(1)
  @Max(10)
  marksPerQuestion: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(300)
  durationMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  passingMarks?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  additionalInstructions?: string;
}
