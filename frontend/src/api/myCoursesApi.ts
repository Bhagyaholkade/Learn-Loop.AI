import api from './axios';
import type { Enrollment } from './enrollmentApi';

export const getMyCourses = async (): Promise<Enrollment[]> => {
  const response = await api.get<Enrollment[]>('/enrollments/my');
  return response.data;
};