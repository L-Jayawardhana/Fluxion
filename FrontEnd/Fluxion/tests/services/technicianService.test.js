import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Unit tests for the technicianService module.
 * Covers: dashboard stats, performance, tickets, ticket actions, asset management.
 */

vi.mock('../../src/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  },
}));

import api from '../../src/services/api';
import {
  getTechnicianDashboardStats,
  getTechnicianPerformance,
  getTechnicianTickets,
  getTechnicianTicketDetail,
  updateTicketStatus,
  logRepair,
  addComment,
  updateAssetCondition,
  getTechnicianAssets,
} from '../../src/services/technicianService';

describe('technicianService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Dashboard ─────────────────────────────────────────────────
  describe('dashboard', () => {
    it('getTechnicianDashboardStats calls GET /technician/dashboard/stats', async () => {
      api.get.mockResolvedValue({ data: { totalAssigned: 5 } });
      const result = await getTechnicianDashboardStats();
      expect(api.get).toHaveBeenCalledWith('/technician/dashboard/stats');
      expect(result).toEqual({ totalAssigned: 5 });
    });

    it('getTechnicianPerformance calls GET /technician/dashboard/performance', async () => {
      api.get.mockResolvedValue({ data: { resolved: 10 } });
      const result = await getTechnicianPerformance();
      expect(api.get).toHaveBeenCalledWith('/technician/dashboard/performance');
      expect(result).toEqual({ resolved: 10 });
    });
  });

  // ── Tickets ───────────────────────────────────────────────────
  describe('tickets', () => {
    it('getTechnicianTickets calls GET /technician/tickets with clean params', async () => {
      api.get.mockResolvedValue({ data: { items: [] } });
      await getTechnicianTickets({ status: 'open', priority: null, keyword: '' });
      const callParams = api.get.mock.calls[0][1].params;
      expect(callParams).toEqual({ status: 'open' });
      expect(callParams).not.toHaveProperty('priority');
      expect(callParams).not.toHaveProperty('keyword');
    });

    it('getTechnicianTickets with empty filters passes no params', async () => {
      api.get.mockResolvedValue({ data: { items: [] } });
      await getTechnicianTickets();
      expect(api.get).toHaveBeenCalledWith('/technician/tickets', { params: {} });
    });

    it('getTechnicianTicketDetail calls GET /technician/tickets/:id', async () => {
      api.get.mockResolvedValue({ data: { ticketId: 42 } });
      const result = await getTechnicianTicketDetail(42);
      expect(api.get).toHaveBeenCalledWith('/technician/tickets/42');
      expect(result).toEqual({ ticketId: 42 });
    });
  });

  // ── Ticket Actions ────────────────────────────────────────────
  describe('ticket actions', () => {
    it('updateTicketStatus calls PATCH /technician/tickets/:id/status', async () => {
      api.patch.mockResolvedValue({ data: { message: 'ok' } });
      await updateTicketStatus(10, 'in_progress');
      expect(api.patch).toHaveBeenCalledWith('/technician/tickets/10/status', { status: 'in_progress' });
    });

    it('logRepair calls PUT /technician/tickets/:id/repair', async () => {
      api.put.mockResolvedValue({ data: { message: 'saved' } });
      await logRepair(10, 'Replaced fan', 120, 50);
      expect(api.put).toHaveBeenCalledWith('/technician/tickets/10/repair', {
        repairDescription: 'Replaced fan',
        cost: 120,
        externalPartsCost: 50,
      });
    });

    it('addComment calls POST /technician/tickets/:id/comments', async () => {
      api.post.mockResolvedValue({ data: { message: 'added' } });
      await addComment(10, 'Working on it');
      expect(api.post).toHaveBeenCalledWith('/technician/tickets/10/comments', { content: 'Working on it' });
    });
  });

  // ── Asset ─────────────────────────────────────────────────────
  describe('asset', () => {
    it('updateAssetCondition calls PATCH with condition', async () => {
      api.patch.mockResolvedValue({ data: { message: 'updated' } });
      await updateAssetCondition(5, 'good');
      expect(api.patch).toHaveBeenCalledWith('/technician/assets/5/condition', { condition: 'good' });
    });

    it('getTechnicianAssets calls GET /technician/assets', async () => {
      api.get.mockResolvedValue({ data: [{ assetId: 1 }] });
      const result = await getTechnicianAssets();
      expect(api.get).toHaveBeenCalledWith('/technician/assets');
      expect(result).toEqual([{ assetId: 1 }]);
    });
  });
});
