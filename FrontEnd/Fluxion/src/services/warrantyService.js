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

/**
 * GET /api/Asset/reports/warranty
 * @param {object} params - { daysAhead?, pageNumber?, pageSize? }
 * @returns {Promise<Result<WarrantyExpiryReportDto>>}
 */
export const getWarrantyExpiryReport = async ({ daysAhead = 90, pageNumber = 1, pageSize = 20 } = {}) => {
  try {
    const params = cleanParams({ daysAhead, pageNumber, pageSize });
    const res = await api.get('/Asset/reports/warranty', { params });
    return res.data;
  } catch (error) {
    throw toStructuredError(error);
  }
};

/**
 * POST /api/Asset/{id}/reports/warranty/notify
 * @param {number} assetId
 * @returns {Promise<Result<string>>}
 */
export const notifyWarrantyExpiry = async (assetId) => {
  try {
    const res = await api.post(`/Asset/${assetId}/reports/warranty/notify`);
    return res.data;
  } catch (error) {
    throw toStructuredError(error);
  }
};
