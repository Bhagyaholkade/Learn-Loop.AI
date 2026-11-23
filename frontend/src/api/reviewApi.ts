import api from './axios';

export interface CourseReview {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: number;
    name: string;
  };
}

export interface CourseRating {
  courseId: number;
  totalReviews: number;
  averageRating: number;
}

export interface CreateReviewPayload {
  courseId: number;
  rating: number;
  comment?: string;
}

export const getCourseReviews = async (
  courseId: number,
): Promise<CourseReview[]> => {
  const response = await api.get<CourseReview[]>(
    `/reviews/course/${courseId}`,
  );
  return Array.isArray(response.data) ? response.data : [];
};

export const getCourseRating = async (
  courseId: number,
): Promise<CourseRating> => {
  const response = await api.get<CourseRating>(
    `/reviews/course/${courseId}/rating`,
  );
  return response.data;
};

export const createReview = async (
  payload: CreateReviewPayload,
): Promise<CourseReview> => {
  const response = await api.post<CourseReview>('/reviews', payload);
  return response.data;
};
