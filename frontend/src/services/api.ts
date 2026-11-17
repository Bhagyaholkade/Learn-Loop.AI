
import api from '../api/axios';

// ==================== AUTH TYPES ====================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  user?: AuthUser;
  message?: string;
}

export interface SignupResponse {
  message: string;
  user: AuthUser;
}

// ==================== STUDENT TYPES ====================

export interface Student {
  id: number;
  name: string;
  email: string;
  createdAt?: string;
}

export interface StudentsResponse {
  data: Student[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StudentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'name' | 'createdAt';
  order?: 'ASC' | 'DESC';
}

// ==================== ENROLLMENT TYPES ====================

export interface EnrolledCourse {
  id: number;
  title: string;
  description?: string;
  instructor?: string;
  category?: string;
  status?: string;
}

export interface Enrollment {
  id: number;
  course: EnrolledCourse;
  enrolledAt?: string;
}

// ==================== AUTH API ====================

export async function login(
  credentials: LoginRequest,
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>(
    '/auth/login',
    credentials,
  );

  const { accessToken, user } = response.data;

  if (!accessToken) {
    throw new Error(
      'Login response did not contain an access token.',
    );
  }

  localStorage.setItem('accessToken', accessToken);

  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  return response.data;
}

export async function signup(
  data: SignupRequest,
): Promise<SignupResponse> {
  const response = await api.post<SignupResponse>(
    '/auth/signup',
    {
      name: data.name.trim(),
      email: data.email.trim(),
      password: data.password,
    },
  );

  return response.data;
}

export function logout(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
}

export function getCurrentUser(): AuthUser | null {
  const user = localStorage.getItem('user');

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user) as AuthUser;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
}

export function isAuthenticated(): boolean {
  return Boolean(localStorage.getItem('accessToken'));
}

// ==================== STUDENTS API ====================

export async function getStudents(
  params: StudentQueryParams = {},
): Promise<StudentsResponse> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;

  const response = await api.get<
    Student[] | StudentsResponse
  >('/students', {
    params: {
      page,
      limit,
      sortBy: 'createdAt',
      order: 'DESC',
      ...params,
    },
  });

  if (Array.isArray(response.data)) {
    return {
      data: response.data,
      total: response.data.length,
      page,
      limit,
      totalPages: Math.ceil(
        response.data.length / limit,
      ),
    };
  }

  return response.data;
}

export async function getStudentById(
  id: number,
): Promise<Student> {
  const response = await api.get<Student>(
    `/students/${id}`,
  );

  return response.data;
}

export async function createStudent(
  data: Omit<Student, 'id' | 'createdAt'>,
): Promise<Student> {
  const response = await api.post<Student>(
    '/students',
    data,
  );

  return response.data;
}

export async function updateStudent(
  id: number,
  data: Partial<Omit<Student, 'id'>>,
): Promise<Student> {
  const response = await api.patch<Student>(
    `/students/${id}`,
    data,
  );

  return response.data;
}

export async function deleteStudent(
  id: number,
): Promise<void> {
  await api.delete(`/students/${id}`);
}

// ==================== ENROLLMENTS API ====================

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractEnrollments(
  result: unknown,
): Enrollment[] | null {
  if (Array.isArray(result)) {
    return result as Enrollment[];
  }

  if (!isRecord(result)) {
    return null;
  }

  for (const key of [
    'data',
    'enrollments',
    'items',
  ]) {
    const value = result[key];

    if (Array.isArray(value)) {
      return value as Enrollment[];
    }
  }

  return null;
}

export async function getMyEnrollments(): Promise<Enrollment[]> {
  const response = await api.get<unknown>(
    '/enrollments/my',
  );

  const enrollments = extractEnrollments(response.data);

  if (enrollments === null) {
    console.error(
      'Unexpected enrollments API response:',
      response.data,
    );

    throw new Error(
      'The enrollments API returned an unexpected response.',
    );
  }

  return enrollments;
}

export async function enrollInCourse(
  courseId: number,
): Promise<Enrollment> {
  const response = await api.post<Enrollment>(
    '/enrollments',
    { courseId },
  );

  return response.data;
}

// ==================== API ERROR HELPER ====================

export function getApiErrorMessage(
  error: unknown,
): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const response = (
      error as {
        response?: {
          status?: number;
          data?: {
            message?: string | string[];
            error?: string;
          };
        };
      }
    ).response;

    const message = response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(', ');
    }

    if (typeof message === 'string') {
      return message;
    }

    if (response?.data?.error) {
      return response.data.error;
    }

    if (response?.status === 401) {
      return 'Your session is invalid or has expired. Please log in again.';
    }

    if (response?.status === 403) {
      return 'You do not have permission to perform this action.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}
