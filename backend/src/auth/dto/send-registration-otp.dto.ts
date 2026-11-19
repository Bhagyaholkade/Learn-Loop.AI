
import {
  IsEmail,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';

export class SendRegistrationOtpDto {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(150)
  email: string;
}
