import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Unit tests for warrantyService module.
 * Covers: warranty report fetching and notification.
 */

vi.mock('../../src/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import api from '../../src/services/api';
import { getWarrantyExpiryReport, notifyWarrantyExpiry } from '../../src/services/warrantyService';

describe('warrantyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── getWarrantyExpiryReport ───────────────────────────────────
  describe('getWarrantyExpiryReport', () => {
    it('should call GET /Asset/reports/warranty with default params', async () => {
      api.get.mockResolvedValue({ data: { items: [], total: 0 } });
      const result = await getWarrantyExpiryReport();
      expect(api.get).toHaveBeenCalledWith('/Asset/reports/warranty', {
        params: { daysAhead: 90, pageNumber: 1, pageSize: 20 },
      });
      expect(result).toEqual({ items: [], total: 0 });
    });

    it('should pass custom params', async () => {
      api.get.mockResolvedValue({ data: { items: [] } });
      await getWarrantyExpiryReport({ daysAhead: 30, pageNumber: 2, pageSize: 10 });
      expect(api.get).toHaveBeenCalledWith('/Asset/reports/warranty', {
        params: { daysAhead: 30, pageNumber: 2, pageSize: 10 },
      });
    });

    it('should throw structured error on failure', async () => {
      api.get.mockRejectedValue({
        response: { status: 403, data: { message: 'Forbidden' } },
      });
      await expect(getWarrantyExpiryReport()).rejects.toThrow('Forbidden');
    });
  });

  // ── notifyWarrantyExpiry ──────────────────────────────────────
  describe('notifyWarrantyExpiry', () => {
    it('should call POST /Asset/:id/reports/warranty/notify', async () => {
      api.post.mockResolvedValue({ data: { succeeded: true } });
      const result = await notifyWarrantyExpiry(42);
      expect(api.post).toHaveBeenCalledWith('/Asset/42/reports/warranty/notify');
      expect(result).toEqual({ succeeded: true });
    });

    it('should throw structured error on 404', async () => {
      api.post.mockRejectedValue({
        response: { status: 404, data: { message: 'Asset not found' } },
      });
      await expect(notifyWarrantyExpiry(999)).rejects.toThrow('Asset not found');
    });
  });
});
