import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Unit tests for maintenanceLogService module.
 * Covers: log page, comments, cost report, financial insights.
 */

vi.mock('../../src/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import api from '../../src/services/api';
import {
  getMaintenanceLogPage,
  addComment,
  getMaintenanceCostReport,
  getFinancialInsightsReport,
} from '../../src/services/maintenanceLogService';

describe('maintenanceLogService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── getMaintenanceLogPage ─────────────────────────────────────
  describe('getMaintenanceLogPage', () => {
    it('should call GET /maintenance/assets/:id/log-page with pagination', async () => {
      api.get.mockResolvedValue({ data: { items: [], total: 0 } });
      const result = await getMaintenanceLogPage(5, { pageNumber: 2, pageSize: 10 });
      expect(api.get).toHaveBeenCalledWith('/maintenance/assets/5/log-page', {
        params: { pageNumber: 2, pageSize: 10 },
      });
      expect(result).toEqual({ items: [], total: 0 });
    });

    it('should clean empty params', async () => {
      api.get.mockResolvedValue({ data: {} });
      await getMaintenanceLogPage(5, { pageNumber: undefined, pageSize: null });
      const callParams = api.get.mock.calls[0][1].params;
      expect(callParams).toEqual({});
    });

    it('should throw structured error on failure', async () => {
      api.get.mockRejectedValue({
        response: { status: 500, data: { message: 'Server error' } },
      });
      await expect(getMaintenanceLogPage(5)).rejects.toThrow('Server error');
    });
  });

  // ── addComment ────────────────────────────────────────────────
  describe('addComment', () => {
    it('should call POST /maintenance/tickets/:id/comments', async () => {
      api.post.mockResolvedValue({ data: { logId: 99 } });
      const result = await addComment(10, { content: 'Fixed issue', isVisibleToEmployee: true });
      expect(api.post).toHaveBeenCalledWith('/maintenance/tickets/10/comments', {
        content: 'Fixed issue',
        isVisibleToEmployee: true,
      });
      expect(result).toEqual({ logId: 99 });
    });

    it('should throw on failure', async () => {
      api.post.mockRejectedValue({
        response: { status: 404, data: { message: 'Ticket not found' } },
      });
      await expect(addComment(999, { content: 'x' })).rejects.toThrow('Ticket not found');
    });
  });

  // ── getMaintenanceCostReport ──────────────────────────────────
  describe('getMaintenanceCostReport', () => {
    it('should call GET /maintenance/reports/cost with params', async () => {
      api.get.mockResolvedValue({ data: { items: [] } });
      await getMaintenanceCostReport({ startDate: '2026-01-01', endDate: '2026-12-31', pageNumber: 1, pageSize: 20 });
      expect(api.get).toHaveBeenCalledWith('/maintenance/reports/cost', {
        params: { startDate: '2026-01-01', endDate: '2026-12-31', pageNumber: 1, pageSize: 20 },
      });
    });

    it('should clean empty date params', async () => {
      api.get.mockResolvedValue({ data: {} });
      await getMaintenanceCostReport({ startDate: '', endDate: null });
      const callParams = api.get.mock.calls[0][1].params;
      expect(callParams).toEqual({});
    });
  });

  // ── getFinancialInsightsReport ────────────────────────────────
  describe('getFinancialInsightsReport', () => {
    it('should call GET /maintenance/financial-insights with params', async () => {
      api.get.mockResolvedValue({ data: { totalCost: 5000 } });
      const result = await getFinancialInsightsReport({ orgId: 1, startDate: '2026-01-01' });
      expect(api.get).toHaveBeenCalledWith('/maintenance/financial-insights', {
        params: { orgId: 1, startDate: '2026-01-01' },
      });
      expect(result).toEqual({ totalCost: 5000 });
    });

    it('should work with no params', async () => {
      api.get.mockResolvedValue({ data: {} });
      await getFinancialInsightsReport();
      expect(api.get).toHaveBeenCalledWith('/maintenance/financial-insights', { params: {} });
    });
  });
});
