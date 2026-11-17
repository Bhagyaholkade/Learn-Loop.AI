import api from './axios';

export type ProgressStatus = 'Not Started' | 'In Progress' | 'Completed';

export interface StudentCourseProgress {
  student: {
    id: number;
    name: string;
    email: string;
  };
  course: {
    id: number;
    title: string;
  };
  enrolledAt: string;
  totalLessons: number;
  completedLessons: number;
  completionPercentage: number;
  status: ProgressStatus;
}

export interface AdminProgressResponse {
  totalEnrollments: number;
  data: StudentCourseProgress[];
}

export const getAllStudentsProgress =
  async (): Promise<AdminProgressResponse> => {
    const response = await api.get<AdminProgressResponse>(
      '/progress/admin/all',
    );

    return response.data;
  };