import api from './api';

// ── Dashboard ─────────────────────────────────────────────────
export const getTechnicianDashboardStats = async () => {
  const res = await api.get('/technician/dashboard/stats');
  return res.data;
};

export const getTechnicianPerformance = async () => {
  const res = await api.get('/technician/dashboard/performance');
  return res.data;
};

// ── Tickets ───────────────────────────────────────────────────
export const getTechnicianTickets = async (filters = {}) => {
  const params = {};
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') params[k] = v;
  });
  const res = await api.get('/technician/tickets', { params });
  return res.data;
};

export const getTechnicianTicketDetail = async (id) => {
  const res = await api.get(`/technician/tickets/${id}`);
  return res.data;
};

// ── Ticket Actions ────────────────────────────────────────────
export const updateTicketStatus = async (id, status) => {
  const res = await api.patch(`/technician/tickets/${id}/status`, { status });
  return res.data;
};

export const logRepair = async (id, repairDescription, cost) => {
  const res = await api.put(`/technician/tickets/${id}/repair`, { repairDescription, cost });
  return res.data;
};

export const addComment = async (id, content) => {
  const res = await api.post(`/technician/tickets/${id}/comments`, { content });
  return res.data;
};

// ── Asset ─────────────────────────────────────────────────────
export const updateAssetCondition = async (assetId, condition) => {
  const res = await api.patch(`/technician/assets/${assetId}/condition`, { condition });
  return res.data;
};
