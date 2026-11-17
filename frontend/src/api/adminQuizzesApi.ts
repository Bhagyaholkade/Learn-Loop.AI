
import api from './axios';

export type QuizType = 'CHAPTER' | 'FINAL';
export type QuizReviewStatus = 'PENDING' | 'APPROVED';

export interface AdminQuizCourse {
  id: number;
  title: string;
}

export interface AdminQuizLesson {
  id: number;
  title: string;
}

export interface AdminQuiz {
  id: number;
  title: string;
  description: string | null;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  isPublished: boolean;
  quizType: QuizType;
  lesson: AdminQuizLesson | null;
  course: AdminQuizCourse;
  isAiGenerated: boolean;
  reviewStatus: QuizReviewStatus;
  createdAt?: string;
}

export interface CreateQuizData {
  title: string;
  description?: string;
  courseId: number;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  quizType?: QuizType;
  lessonId?: number;
}

export interface GenerateAiQuizData {
  courseId: number;
  lessonId: number;
  title: string;
  numberOfQuestions: number;
  marksPerQuestion: number;
  durationMinutes?: number;
  passingMarks?: number;
  additionalInstructions?: string;
}

export interface GenerateAiQuizResponse {
  success: boolean;
  message: string;
  data: {
    quizId: number;
    title: string;
    courseId: number;
    lessonId: number;
    quizType: QuizType;
    isAiGenerated: boolean;
    isPublished: boolean;
    numberOfQuestions: number;
    totalMarks: number;
    passingMarks: number;
    durationMinutes: number;
  };
}

// Get all admin quizzes
export const getAllAdminQuizzes = async (): Promise<AdminQuiz[]> => {
  const response = await api.get<AdminQuiz[]>('/quizzes');
  return response.data;
};

// Create a manual quiz
export const createQuiz = async (
  data: CreateQuizData,
): Promise<AdminQuiz> => {
  const response = await api.post<AdminQuiz>('/quizzes', data);
  return response.data;
};

// Generate an AI chapter-wise quiz
export const generateAiQuiz = async (
  data: GenerateAiQuizData,
): Promise<GenerateAiQuizResponse> => {
  const response = await api.post<GenerateAiQuizResponse>(
    '/ai-quiz/generate',
    data,
  );
  return response.data;
};

// Approve an AI-generated quiz
export const approveQuiz = async (
  quizId: number,
): Promise<AdminQuiz> => {
  const response = await api.patch<AdminQuiz>(
    `/quizzes/${quizId}/approve`,
  );
  return response.data;
};

// Publish a quiz
export const publishQuiz = async (quizId: number) => {
  const response = await api.patch(`/quizzes/${quizId}/publish`);
  return response.data;
};

// Unpublish a quiz
export const unpublishQuiz = async (quizId: number) => {
  const response = await api.patch(`/quizzes/${quizId}/unpublish`);
  return response.data;
};
