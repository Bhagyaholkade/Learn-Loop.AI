import api from './axios';

export interface AdminQuizQuestion {
  id: number;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  marks: number;
  order: number;
}

export interface CreateQuestionData {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  marks: number;
  order: number;
}

export const getAdminQuizQuestions = async (
  quizId: number,
): Promise<AdminQuizQuestion[]> => {
  const response = await api.get<AdminQuizQuestion[]>(
    `/quizzes/${quizId}/questions`,
  );

  return response.data;
};

export const addQuizQuestion = async (
  quizId: number,
  data: CreateQuestionData,
): Promise<AdminQuizQuestion> => {
  const response = await api.post<AdminQuizQuestion>(
    `/quizzes/${quizId}/questions`,
    data,
  );

  return response.data;
};

export const updateQuizQuestion = async (
  quizId: number,
  questionId: number,
  data: Partial<CreateQuestionData>,
): Promise<AdminQuizQuestion> => {
  const response = await api.put<AdminQuizQuestion>(
    `/quizzes/${quizId}/questions/${questionId}`,
    data,
  );

  return response.data;
};

export const deleteQuizQuestion = async (
  quizId: number,
  questionId: number,
): Promise<void> => {
  await api.delete(`/quizzes/${quizId}/questions/${questionId}`);
};