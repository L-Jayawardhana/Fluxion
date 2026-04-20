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

      // Only redirect if not already on a public/auth page
      const publicPaths = ['/login', '/register', '/accept-invite', '/'];
      const isPublicPage = publicPaths.some((p) => window.location.pathname === p || window.location.pathname.startsWith(p + '?'));
      if (!isPublicPage) {
        // Show a brief toast/alert before navigating
        const toast = document.createElement('div');
        toast.textContent = 'Your session has expired. Please sign in again.';
        Object.assign(toast.style, {
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1a1a2e',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '14px',
          zIndex: '99999',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.1)',
        });
        document.body.appendChild(toast);
        setTimeout(() => {
          toast.remove();
          window.location.href = '/login';
        }, 2500);
      }
    }
    return Promise.reject(error);
  }
);

// ── Department ────────────────────────────────────────────

export const getDepartments = async (orgId) => {
  const response = await api.get('/department', { params: { orgId } });
  return response.data;
};

export const getOrganizations = async () => {
  const response = await api.get('/organization');
  return response.data;
};

export const updateOrganization = async (orgId, data) => {
  const response = await api.put(`/organization/${orgId}`, data);
  return response.data;
};

export const getUsers = async (orgId) => {
  const response = await api.get('/user', { params: { orgId } });
  return response.data;
};

export const updateUser = async (userId, data) => {
  const response = await api.put(`/user/${userId}`, data);
  return response.data;
};

export const createDepartment = async (data) => {
  const response = await api.post('/department', data);
  return response.data;
};

export const updateDepartment = async (departmentId, orgId, data) => {
  const response = await api.put(`/department/${departmentId}`, {
    departmentId,
    orgId,
    ...data
  });
  return response.data;
};

export const toggleDepartment = async (departmentId, orgId, isActive) => {
  const response = await api.patch(`/department/${departmentId}/toggle`, {
    departmentId,
    orgId,
    isActive
  });
  return response.data;
};

// ── Asset ─────────────────────────────────────────────────

export const createAsset = async (data) => {
  const response = await api.post('/asset', data);
  return response.data;
};

export const getAssets = async (orgId, { departmentId, assetType } = {}) => {
  const params = { orgId };
  if (departmentId) params.departmentId = departmentId;
  if (assetType) params.assetType = assetType;
  const response = await api.get('/asset', { params });
  return response.data;
};

export const getAssetById = async (id, orgId) => {
  const response = await api.get(`/asset/${id}`, { params: { orgId } });
  return response.data;
};

export const retireAsset = async (id, orgId, retiredBy) => {
  const response = await api.put(`/asset/${id}/retire`, { orgId, retiredBy });
  return response.data;
};

export const transferAsset = async (id, orgId, newDepartmentId, transferredBy) => {
  const response = await api.put(`/asset/${id}/transfer`, { orgId, newDepartmentId, transferredBy });
  return response.data;
};

export default api;
