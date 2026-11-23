
import api from './axios';

// TYPES

export interface QuizCourse {
  id: number;
  title: string;
}

export interface Quiz {
  id: number;
  title: string;
  description: string | null;
  durationMinutes: number;
  totalMarks: number;
  passingMarks?: number;
  quizType?: 'CHAPTER' | 'FINAL';
  /** Final quizzes stay locked until every lesson in the course is done. */
  isLocked?: boolean;
  lockedReason?: string | null;
  course: QuizCourse;
}

export interface QuizQuestion {
  id: number;
  questionText: string;
  options: string[];
  marks: number;
  order: number;
}

export interface QuizDetails extends Quiz {
  questions: QuizQuestion[];
}

export interface StudentAnswer {
  questionId: number;
  selectedOptionIndex: number;
}

export interface SubmitQuizPayload {
  answers: StudentAnswer[];
}

export interface QuestionReview {
  questionId: number;
  questionText: string;
  options: string[];
  selectedOptionIndex: number | null;
  selectedAnswer: string | null;
  correctOptionIndex: number;
  correctAnswer: string;
  marks: number;
  obtainedMarks: number;
  isCorrect: boolean;
}

export interface QuizResult {
  message: string;
  attemptId: number;
  quizId: number;
  quizTitle: string;
  course?: string;
  obtainedMarks: number;
  totalMarks: number;
  passingMarks: number;
  percentage: number;
  isPassed: boolean;
  submittedAt: string;
  quizType?: 'CHAPTER' | 'FINAL';
  courseId?: number;
  /** Set when passing this (final) quiz issued the course certificate. */
  certificate?: { id: number; certificateNumber: string } | null;
  questionReview?: QuestionReview[];
}

export interface QuizAttempt {
  id: number;
  quiz: {
    id: number;
    title: string;
    course: string;
  };
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  isPassed: boolean;
  submittedAt: string;
}

// STUDENT QUIZ APIs

export const getPublishedQuizzes = async (): Promise<Quiz[]> => {
  const response = await api.get<Quiz[]>('/student/quizzes');
  return response.data;
};

export const getQuizQuestions = async (
  quizId: number,
): Promise<QuizDetails> => {
  const response = await api.get<QuizDetails>(
    `/student/quizzes/${quizId}/questions`,
  );
  return response.data;
};

export const submitQuiz = async (
  quizId: number,
  payload: SubmitQuizPayload,
): Promise<QuizResult> => {
  const response = await api.post<QuizResult>(
    `/student/quizzes/${quizId}/submit`,
    payload,
  );
  return response.data;
};

export const getMyQuizAttempts = async (): Promise<QuizAttempt[]> => {
  const response = await api.get<QuizAttempt[]>(
    '/student/quizzes/attempts',
  );
  return response.data;
};

// Get detailed result of a previous quiz attempt
export const getQuizAttemptResult = async (
  attemptId: number,
): Promise<QuizResult> => {
  const response = await api.get<QuizResult>(
    `/student/quizzes/attempts/${attemptId}`,
  );
  return response.data;
};
