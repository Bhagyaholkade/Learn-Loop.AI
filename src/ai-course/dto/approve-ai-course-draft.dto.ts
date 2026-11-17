import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ApproveAiCourseDraftDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  instructor: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  category: string;
}