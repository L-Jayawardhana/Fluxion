import api from './api';

export const getPlan = async (orgId) => {
  const response = await api.get(`/Organization/${orgId}/plan`);
  return response.data;
};

export const updatePlan = async (orgId, planName, token = null) => {
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  const response = await api.put(`/Organization/${orgId}/plan`, { planName }, config);
  return response.data;
};
