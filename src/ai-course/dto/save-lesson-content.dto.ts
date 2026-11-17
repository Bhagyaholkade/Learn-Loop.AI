
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

class LessonExampleDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  explanation: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  language?: string;
}

class LessonExerciseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsIn(['easy', 'medium', 'hard'])
  difficulty: 'easy' | 'medium' | 'hard';

  @IsOptional()
  @IsString()
  expectedOutcome?: string;
}

class LessonKnowledgeCheckDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @IsString({ each: true })
  options: string[];

  @IsString()
  @IsNotEmpty()
  correctAnswer: string;

  @IsString()
  @IsNotEmpty()
  explanation: string;
}

export class SaveLessonContentDto {
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  learningObjectives: string[];

  @IsString()
  @IsNotEmpty()
  theory: string;

  @IsArray()
  @ArrayMinSize(3)
  @ValidateNested({ each: true })
  @Type(() => LessonExampleDto)
  practicalExamples: LessonExampleDto[];

  @IsArray()
  @ArrayMinSize(3)
  @ValidateNested({ each: true })
  @Type(() => LessonExerciseDto)
  exercises: LessonExerciseDto[];

  @IsArray()
  @ArrayMinSize(5)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  keyTakeaways: string[];

  @IsArray()
  @ArrayMinSize(5)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => LessonKnowledgeCheckDto)
  knowledgeCheck: LessonKnowledgeCheckDto[];
}
