import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5226/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 responses
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('admin_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const getOrganizations = async () => {
  const response = await api.get('/organization');
  return response.data;
};

export const getUsers = async (orgId = null) => {
  const params = orgId ? { orgId } : {};
  const response = await api.get('/user', { params });
  return response.data;
};

export const updateOrganization = async (id, data) => {
  await api.put(`/organization/${id}`, data);
};

export const deleteOrganization = async (id) => {
  await api.delete(`/organization/${id}`);
};

export const updateUser = async (id, data) => {
  await api.put(`/user/${id}`, data);
};

export const deleteUser = async (id) => {
  await api.delete(`/user/${id}`);
};

export default api;
