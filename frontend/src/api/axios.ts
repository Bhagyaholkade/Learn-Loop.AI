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

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('accessToken') ??
    sessionStorage.getItem('accessToken');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// When a logged-in request comes back 401, the token has expired or is
// invalid: clear the stored session and send the user to the login page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const hadToken = Boolean(error?.config?.headers?.Authorization);
    const url: string = error?.config?.url ?? '';
    const isAuthRequest = url.includes('/auth/');

    if (status === 401 && hadToken && !isAuthRequest) {
      for (const storage of [localStorage, sessionStorage]) {
        storage.removeItem('accessToken');
        storage.removeItem('user');
      }

      if (!window.location.pathname.startsWith('/login')) {
        window.location.replace('/login?expired=1');
      }
    }

    return Promise.reject(error);
  },
);

export default api;