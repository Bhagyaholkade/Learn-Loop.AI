import api from './axios';

export interface AdminQuizAttempt {
  id: number;

  student: {
    id: number;
    name: string;
    email: string;
  };

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

export const getAllQuizAttempts = async (): Promise<
  AdminQuizAttempt[]
> => {
  const response = await api.get<AdminQuizAttempt[]>(
    '/quizzes/admin/attempts',
  );

  return response.data;
};