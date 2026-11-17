
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  MaxLength,
  IsEnum,
} from 'class-validator';

import { QuizType } from '../entities/quiz.entity';

export class CreateQuizDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  courseId: number;

  // CHAPTER or FINAL
  @IsEnum(QuizType)
  @IsOptional()
  quizType?: QuizType;

  // Required for chapter quizzes; null for final assessments.
  @IsInt()
  @Min(1)
  @IsOptional()
  lessonId?: number;

  @IsInt()
  @Min(1)
  durationMinutes: number;

  @IsInt()
  @Min(0)
  totalMarks: number;

  @IsInt()
  @Min(0)
  passingMarks: number;
}
