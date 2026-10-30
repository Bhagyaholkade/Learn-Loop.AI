
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsEnum,
  IsOptional,
} from 'class-validator';

import { CourseStatus } from '../entities/course.entity';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  instructor: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  category: string;

  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;
}
