
import {
  IsInt,
  IsOptional,
  IsString,
  IsNotEmpty,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class GenerateCourseOutlineDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  topic: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  instructions: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  targetAudience?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  difficulty?: string;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(20)
  numberOfChapters?: number;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(15)
  lessonsPerChapter?: number;
}
