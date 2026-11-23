import api from './axios';

export interface ChapterLessonSummary {
  id: number;
  title: string;
  order: number;
}

export interface Chapter {
  id: number;
  title: string;
  description: string | null;
  learningObjectives: string[] | null;
  order: number;
  lessons?: ChapterLessonSummary[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ChapterPayload {
  title: string;
  description?: string;
  learningObjectives?: string[];
  order?: number;
  courseId: number;
}

export const getChaptersByCourse = async (
  courseId: number,
): Promise<Chapter[]> => {
  const response = await api.get<Chapter[]>(`/chapters/course/${courseId}`);
  return Array.isArray(response.data) ? response.data : [];
};

export const createChapter = async (
  payload: ChapterPayload,
): Promise<Chapter> => {
  const response = await api.post<Chapter>('/chapters', payload);
  return response.data;
};

export const updateChapter = async (
  chapterId: number,
  payload: Partial<Omit<ChapterPayload, 'courseId'>>,
): Promise<Chapter> => {
  const response = await api.patch<Chapter>(`/chapters/${chapterId}`, payload);
  return response.data;
};

export const deleteChapter = async (chapterId: number): Promise<void> => {
  await api.delete(`/chapters/${chapterId}`);
};
