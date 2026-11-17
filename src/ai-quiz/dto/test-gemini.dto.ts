import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class TestGeminiDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  prompt: string;
}