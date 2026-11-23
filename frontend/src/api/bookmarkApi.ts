import api from './axios';
import type { Course } from './courseApi';

export interface Bookmark {
  id: number;
  createdAt: string;
  course: Course;
}

export const getMyBookmarks = async (): Promise<Bookmark[]> => {
  const response = await api.get<Bookmark[]>('/bookmarks/my');
  return Array.isArray(response.data) ? response.data : [];
};

export const addBookmark = async (courseId: number): Promise<Bookmark> => {
  const response = await api.post<Bookmark>('/bookmarks', { courseId });
  return response.data;
};

export const removeBookmark = async (bookmarkId: number): Promise<void> => {
  await api.delete(`/bookmarks/${bookmarkId}`);
};
