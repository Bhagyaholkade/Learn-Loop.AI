
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  ArrayMinSize,
  ArrayMaxSize,
  Min,
} from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @IsString({ each: true })
  options: string[];

  @IsInt()
  @Min(0)
  correctOptionIndex: number;

  @IsInt()
  @Min(1)
  marks: number;

  @IsInt()
  @Min(1)
  order: number;
}
