import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Unit tests for the notificationService module.
 */

vi.mock('../../src/services/api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

import api from '../../src/services/api';
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../src/services/notificationService';

describe('notificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── getNotifications ──────────────────────────────────────────────
  describe('getNotifications', () => {
    it('should call GET /notification with default params', async () => {
      api.get.mockResolvedValue({ data: { items: [], total: 0 } });

      const result = await getNotifications();

      expect(api.get).toHaveBeenCalledWith('/notification', {
        params: { page: 1, pageSize: 20 },
      });
      expect(result).toEqual({ items: [], total: 0 });
    });

    it('should pass custom page and pageSize', async () => {
      api.get.mockResolvedValue({ data: { items: [] } });

      await getNotifications(2, 10);

      expect(api.get).toHaveBeenCalledWith('/notification', {
        params: { page: 2, pageSize: 10 },
      });
    });

    it('should include unreadOnly param when not null', async () => {
      api.get.mockResolvedValue({ data: { items: [] } });

      await getNotifications(1, 20, true);

      expect(api.get).toHaveBeenCalledWith('/notification', {
        params: { page: 1, pageSize: 20, unreadOnly: true },
      });
    });

    it('should NOT include unreadOnly param when null', async () => {
      api.get.mockResolvedValue({ data: { items: [] } });

      await getNotifications(1, 20, null);

      const callParams = api.get.mock.calls[0][1].params;
      expect(callParams).not.toHaveProperty('unreadOnly');
    });
  });

  // ── getUnreadCount ────────────────────────────────────────────────
  it('should call GET /notification/unread-count', async () => {
    api.get.mockResolvedValue({ data: { unreadCount: 5 } });

    const result = await getUnreadCount();

    expect(api.get).toHaveBeenCalledWith('/notification/unread-count');
    expect(result).toEqual({ unreadCount: 5 });
  });

  // ── markNotificationAsRead ────────────────────────────────────────
  it('should call PATCH /notification/:id/read', async () => {
    api.patch.mockResolvedValue({ data: { message: 'done' } });

    const result = await markNotificationAsRead(42);

    expect(api.patch).toHaveBeenCalledWith('/notification/42/read');
    expect(result).toEqual({ message: 'done' });
  });

  // ── markAllNotificationsAsRead ────────────────────────────────────
  it('should call PATCH /notification/read-all', async () => {
    api.patch.mockResolvedValue({ data: { message: '3 marked' } });

    const result = await markAllNotificationsAsRead();

    expect(api.patch).toHaveBeenCalledWith('/notification/read-all');
    expect(result).toEqual({ message: '3 marked' });
  });
});
