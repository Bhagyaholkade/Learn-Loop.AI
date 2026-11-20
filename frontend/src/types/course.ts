
export type CourseStatus = 'draft' | 'published' | 'archived';

export interface Course {
  id: number;
  title: string;
  description: string;
  instructor: string;
  category: string;
  status: CourseStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CoursesResponse {
  data: Course[];
  total?: number;
  page?: number;
  limit?: number;
}
