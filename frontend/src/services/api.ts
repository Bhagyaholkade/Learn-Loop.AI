
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
  registrationToken: string;
}

export interface SendRegistrationOtpResponse {
  message: string;
  expiresIn?: number;
  resendAfter?: number;
}

export interface VerifyRegistrationOtpResponse {
  message: string;
  registrationToken: string;
  expiresIn?: number;
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

export interface AuthMessageResponse {
  message: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
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

// ==================== AUTH STORAGE HELPERS ====================

function getAuthStorage(): Storage | null {
  if (localStorage.getItem('accessToken')) {
    return localStorage;
  }

  if (sessionStorage.getItem('accessToken')) {
    return sessionStorage;
  }

  return null;
}

function clearAuthStorage(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');

  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('user');
}

// ==================== AUTH API ====================

export async function login(
  credentials: LoginRequest,
  rememberMe: boolean = false,
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

  // Clear previous authentication data.
  clearAuthStorage();

  // Store authentication based on Remember Me selection.
  const storage: Storage = rememberMe
    ? localStorage
    : sessionStorage;

  storage.setItem('accessToken', accessToken);

  if (user) {
    storage.setItem('user', JSON.stringify(user));
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
      registrationToken: data.registrationToken,
    },
  );

  return response.data;
}

export async function sendRegistrationOtp(data: {
  email: string;
}): Promise<SendRegistrationOtpResponse> {
  const response = await api.post<SendRegistrationOtpResponse>(
    '/auth/send-registration-otp',
    { email: data.email.trim().toLowerCase() },
  );

  return response.data;
}

export async function verifyRegistrationOtp(data: {
  email: string;
  otp: string;
}): Promise<VerifyRegistrationOtpResponse> {
  const response = await api.post<VerifyRegistrationOtpResponse>(
    '/auth/verify-registration-otp',
    { email: data.email.trim().toLowerCase(), otp: data.otp },
  );

  return response.data;
}

// ==================== LOGOUT ====================

export function logout(): void {
  clearAuthStorage();
}

// ==================== CURRENT USER ====================

export function getCurrentUser(): AuthUser | null {
  const storage = getAuthStorage();

  if (!storage) {
    return null;
  }

  const user = storage.getItem('user');

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user) as AuthUser;
  } catch {
    storage.removeItem('user');
    return null;
  }
}

// ==================== AUTHENTICATION STATUS ====================

export function isAuthenticated(): boolean {
  return getAuthStorage() !== null;
}

// ==================== EMAIL VERIFICATION ====================

export async function verifyEmail(
  token: string,
): Promise<AuthMessageResponse> {
  const response = await api.get<AuthMessageResponse>(
    '/auth/verify-email',
    {
      params: { token },
    },
  );

  return response.data;
}

// ==================== FORGOT PASSWORD ====================

export async function forgotPassword(
  data: ForgotPasswordRequest,
): Promise<AuthMessageResponse> {
  const response = await api.post<AuthMessageResponse>(
    '/auth/forgot-password',
    data,
  );

  return response.data;
}

// ==================== RESET PASSWORD ====================

export async function resetPassword(
  data: ResetPasswordRequest,
): Promise<AuthMessageResponse> {
  const response = await api.post<AuthMessageResponse>(
    '/auth/reset-password',
    data,
  );

  return response.data;
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

  for (const key of ['data', 'enrollments', 'items']) {
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
