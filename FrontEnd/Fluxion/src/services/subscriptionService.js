import api from './api';

export const getPlan = async (orgId) => {
  const response = await api.get(`/Organization/${orgId}/plan`);
  return response.data;
};

export const updatePlan = async (orgId, planName) => {
  const response = await api.put(`/Organization/${orgId}/plan`, { planName });
  return response.data;
};
