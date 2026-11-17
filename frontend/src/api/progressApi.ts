
import api from './axios';

export interface ProgressRecord {
  id: number;
  isCompleted: boolean;
  lesson: {
    id: number;
    title?: string;
    course?: {
      id: number;
      title?: string;
    };
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseProgressSummary {
  courseId: number;
  courseTitle: string;
  totalLessons: number;
  completedLessons: number;
  completionPercentage: number;
}

export const getMyProgress = async (): Promise<ProgressRecord[]> => {
  const response = await api.get<ProgressRecord[]>('/progress/my');
  return response.data;
};

export const markLessonCompleted = async (
  lessonId: number,
): Promise<ProgressRecord> => {
  const response = await api.post<ProgressRecord>('/progress/complete', {
    lessonId,
  });

  return response.data;
};

export const getCourseProgressSummary = async (): Promise<
  CourseProgressSummary[]
> => {
  const response = await api.get<CourseProgressSummary[]>('/progress/summary');
  return response.data;
};
