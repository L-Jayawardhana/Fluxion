import axios from 'axios';

// Environment-based API URL configuration
const getApiBaseUrl = () => {
  // For containerized environments, use port 8080
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Check if we're in a browser accessing containerized apps
    return 'http://localhost:8080/api';
  }
  // For production, this would be your actual API domain
  return 'http://localhost:5226/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
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
