import { IsObject } from 'class-validator';
import type { GeneratedCourseOutline } from '../interfaces/generated-course-outline.interface';

export class UpdateAiCourseDraftDto {
  @IsObject()
  outline: GeneratedCourseOutline;
}