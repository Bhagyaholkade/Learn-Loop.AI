
import {
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
  IsOptional,
  IsUrl,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';

export class CreateLessonDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsInt()
  @Min(1)
  courseId: number;

  // Optional for existing manual lesson creation
  @IsOptional()
  @IsInt()
  @Min(1)
  chapterId?: number;

  @IsInt()
  @Min(1)
  order: number;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  videoUrl?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  pdfUrl?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  objectives?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  resources?: string[];
}
