
import {
  IsArray,
  IsInt,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SubmittedAnswerDto {
  @IsInt()
  @Min(1)
  questionId: number;

  @IsInt()
  @Min(0)
  selectedOptionIndex: number;
}

export class SubmitQuizDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubmittedAnswerDto)
  answers: SubmittedAnswerDto[];
}
