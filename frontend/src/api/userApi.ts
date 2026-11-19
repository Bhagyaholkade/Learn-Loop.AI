
import api from './axios';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  name: string;
}

// GET /api/v1/users/me
export async function getMyProfile(): Promise<UserProfile> {
  const response = await api.get<UserProfile>('/users/me');
  return response.data;
}

// PATCH /api/v1/users/me
export async function updateMyProfile(
  data: UpdateProfileRequest,
): Promise<UserProfile> {
  const response = await api.patch<UserProfile>(
    '/users/me',
    data,
  );

  return response.data;
}
