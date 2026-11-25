import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEmail()
  @MaxLength(150)
  email: string;

  // Temporary password the admin shares with the student.
  // Same rules as self-signup.
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
