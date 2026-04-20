import api from './api';

// ── Notifications ─────────────────────────────────────────────

export const getNotifications = async (page = 1, pageSize = 20, unreadOnly = null) => {
  const params = { page, pageSize };
  if (unreadOnly !== null) params.unreadOnly = unreadOnly;
  const res = await api.get('/notification', { params });
  return res.data;
};

export const getUnreadCount = async () => {
  const res = await api.get('/notification/unread-count');
  return res.data;
};

export const markNotificationAsRead = async (id) => {
  const res = await api.patch(`/notification/${id}/read`);
  return res.data;
};

export const markAllNotificationsAsRead = async () => {
  const res = await api.patch('/notification/read-all');
  return res.data;
};
