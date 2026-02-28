import axios from 'axios';

// VITE_API_URL is injected at build time via .env files or Dockerfile build args:
//   npm run dev  → .env.development → http://localhost:5226/api
//   npm run build (Docker) → .env.production → /api  (relative, proxied by nginx)
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5226/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
