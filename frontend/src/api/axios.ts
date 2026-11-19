import axios from 'axios';

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:3002/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/**
 * The token lives in localStorage ("Remember me") or sessionStorage
 * (normal login), so always check both.
 */
export function getAccessToken(): string | null {
  return (
    localStorage.getItem('accessToken') ??
    sessionStorage.getItem('accessToken')
  );
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;