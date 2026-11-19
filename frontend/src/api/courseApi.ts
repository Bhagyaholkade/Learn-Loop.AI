
import api from './axios';

export interface Course {
  id: number;
  title: string;
  description: string;
  instructor: string;
  category: string;
  status: 'draft' | 'published' | 'archived';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCourseData {
  title: string;
  description: string;
  instructor: string;
  category: string;
  status: 'draft' | 'published' | 'archived';
}

export interface CourseQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

export interface CoursesResponse {
  data: Course[];
  total: number;
  page: number;
  limit: number;
}

function normalizeCoursesResponse(
  response: unknown,
  page: number,
  limit: number,
): CoursesResponse {
  if (Array.isArray(response)) {
    return {
      data: response as Course[],
      total: response.length,
      page,
      limit,
    };
  }

  if (typeof response === 'object' && response !== null) {
    const result = response as Record<string, unknown>;

    const courses = Array.isArray(result.data)
      ? result.data
      : Array.isArray(result.items)
        ? result.items
        : null;

    if (courses) {
      const meta =
        typeof result.meta === 'object' && result.meta !== null
          ? (result.meta as Record<string, unknown>)
          : {};

      const totalValue =
        result.total ??
        meta.totalItems ??
        meta.total;

      return {
        data: courses as Course[],
        total:
          typeof totalValue === 'number'
            ? totalValue
            : courses.length,
        page:
          typeof result.page === 'number' ? result.page : page,
        limit:
          typeof result.limit === 'number' ? result.limit : limit,
      };
    }
  }

  throw new Error('Unexpected courses API response.');
}

export async function getCourses(
  params: CourseQueryParams = {},
): Promise<CoursesResponse> {
  const queryParams = {
    page: 1,
    limit: 10,
    search: '',
    category: '',
    sortBy: 'createdAt',
    order: 'DESC' as const,
    ...params,
  };

  const response = await api.get<unknown>('/courses', {
    params: queryParams,
  });

  return normalizeCoursesResponse(
    response.data,
    queryParams.page,
    queryParams.limit,
  );
}

export async function createCourse(
  data: CreateCourseData,
): Promise<Course> {
  const response = await api.post<Course>('/courses', data);
  return response.data;
}

export async function updateCourse(
  id: number,
  data: Partial<CreateCourseData>,
): Promise<Course> {
  const response = await api.patch<Course>(`/courses/${id}`, data);
  return response.data;
}

export async function deleteCourse(id: number): Promise<void> {
  await api.delete(`/courses/${id}`);
}

export interface CourseLesson {
  id: number;
  title: string;
  content: string;
  aiContent: unknown | null;
  order: number;
  videoUrl?: string | null;
  pdfUrl?: string | null;
  objectives?: string[];
  resources?: unknown[];
}

export interface CourseChapter {
  id: number;
  title: string;
  description: string;
  learningObjectives: string[];
  order: number;
  lessons: CourseLesson[];
}

export interface CourseWithCurriculum extends Course {
  chapters: CourseChapter[];
}

export async function getCourseById(
  id: number,
): Promise<CourseWithCurriculum> {
  const response = await api.get<CourseWithCurriculum>(
    `/courses/${id}`,
  );

  return response.data;
}
