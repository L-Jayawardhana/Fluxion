import api from './api';

const cleanParams = (params = {}) => {
  const cleaned = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') cleaned[key] = value;
  });
  return cleaned;
};

const toStructuredError = (error) => {
  const status = error?.response?.status ?? 0;
  const data = error?.response?.data;
  const message =
    data?.errorMessage ||
    data?.message ||
    error?.message ||
    'Request failed';
  const err = new Error(message);
  err.status = status;
  err.data = data;
  return err;
};

export const getMaintenanceLogPage = async (assetId, { pageNumber, pageSize } = {}) => {
  try {
    const params = cleanParams({ pageNumber, pageSize });
    const res = await api.get(`/maintenance/assets/${assetId}/log-page`, { params });
    return res.data;
  } catch (error) {
    throw toStructuredError(error);
  }
};

export const addComment = async (ticketId, { content, isVisibleToEmployee }) => {
  try {
    const res = await api.post(`/maintenance/tickets/${ticketId}/comments`, {
      content,
      isVisibleToEmployee,
    });
    return res.data;
  } catch (error) {
    throw toStructuredError(error);
  }
};

export const getMaintenanceCostReport = async ({ startDate, endDate, pageNumber, pageSize } = {}) => {
  try {
    const params = cleanParams({ startDate, endDate, pageNumber, pageSize });
    const res = await api.get('/maintenance/reports/cost', { params });
    return res.data;
  } catch (error) {
    throw toStructuredError(error);
  }
};
