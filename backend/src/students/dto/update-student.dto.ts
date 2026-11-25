import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateStudentDto } from './create-student.dto';

// Admins can edit a student's name and email, not their password.
export class UpdateStudentDto extends PartialType(
  OmitType(CreateStudentDto, ['password'] as const),
) {}
