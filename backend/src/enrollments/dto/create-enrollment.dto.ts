
import {
  IsInt,
  IsNotEmpty,
  Min,
} from 'class-validator';

export class CreateEnrollmentDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  courseId: number;
}
