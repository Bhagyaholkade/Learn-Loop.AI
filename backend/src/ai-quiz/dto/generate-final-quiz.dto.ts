import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class GenerateFinalQuizDto {
  @IsInt()
  @Min(1)
  courseId: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

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
