import axios from 'axios';

// VITE_API_URL is injected at build time via .env files or Vercel environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  console.error('VITE_API_URL is not set! API calls will fail.');
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Read token from whichever storage has it
function getStoredToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// Clear token from both storages
function clearStoredAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('expiresAt');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('expiresAt');
}

// Attach JWT token to every request if it exists and is not expired
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        clearStoredAuth();
        return Promise.reject(new Error('Token expired'));
      }
      config.headers.Authorization = `Bearer ${token}`;
    } catch {
      clearStoredAuth();
    }
  }
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredAuth();
    }
    return Promise.reject(error);
  }
);

export default api;
