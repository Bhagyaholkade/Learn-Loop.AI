
import api from './axios';

export interface EnrollmentStudent {
  id: number;
  name: string;
  email: string;
}

export interface EnrollmentCourse {
  id: number;
  title: string;
  description?: string;
  instructor?: string;
  category?: string;
  status?: string;
}

export interface Enrollment {
  id: number;
  student: EnrollmentStudent;
  course: EnrollmentCourse;
  enrolledAt: string;
}

export const getAllEnrollments = async (): Promise<Enrollment[]> => {
  const response = await api.get<Enrollment[]>('/enrollments');
  return response.data;
};
