
export interface GeneratedQuestion {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  marks: number;
  explanation: string;
}

export interface GeneratedQuizResponse {
  questions: GeneratedQuestion[];
}
