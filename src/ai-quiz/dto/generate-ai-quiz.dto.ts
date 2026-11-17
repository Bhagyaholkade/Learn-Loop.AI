
import {
  IsInt,
  IsOptional,
  IsString,
  IsNotEmpty,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class GenerateAiQuizDto {
  @IsInt()
  @Min(1)
  courseId: number;

  @IsInt()
  @Min(1)
  lessonId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

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

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  additionalInstructions?: string;
}
