export interface LessonExample {
  title: string;
  explanation: string;
  code?: string;
  language?: string;
}

export interface LessonExercise {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  expectedOutcome?: string;
}

export interface LessonKnowledgeCheck {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface LessonAiContent {
  learningObjectives: string[];
  theory: string;
  practicalExamples: LessonExample[];
  exercises: LessonExercise[];
  keyTakeaways: string[];
  knowledgeCheck: LessonKnowledgeCheck[];
}