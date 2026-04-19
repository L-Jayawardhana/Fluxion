import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Unit tests for maintenanceService module.
 * Covers: ticket creation, listing, assignment, technician filtering.
 */

vi.mock('../../src/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

import api from '../../src/services/api';
import {
  createMaintenanceTicket,
  getMaintenanceTickets,
  assignTicket,
  getTechnicians,
} from '../../src/services/maintenanceService';

describe('maintenanceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── createMaintenanceTicket ───────────────────────────────────
  it('should call POST /maintenance-tickets with ticket data', async () => {
    api.post.mockResolvedValue({ data: { ticketId: 1 } });
    const ticketData = { title: 'Broken screen', assetId: 5, orgId: 1, priority: 'high' };
    const result = await createMaintenanceTicket(ticketData);
    expect(api.post).toHaveBeenCalledWith('/maintenance-tickets', ticketData);
    expect(result).toEqual({ ticketId: 1 });
  });

  // ── getMaintenanceTickets ─────────────────────────────────────
  describe('getMaintenanceTickets', () => {
    it('should call GET /maintenance-tickets with cleaned filters', async () => {
      api.get.mockResolvedValue({ data: { items: [], total: 0 } });
      await getMaintenanceTickets({ status: 'open', priority: null, page: '', orgId: 1 });
      const callParams = api.get.mock.calls[0][1].params;
      expect(callParams).toEqual({ status: 'open', orgId: 1 });
      expect(callParams).not.toHaveProperty('priority');
      expect(callParams).not.toHaveProperty('page');
    });

    it('should handle null filters', async () => {
      api.get.mockResolvedValue({ data: { items: [] } });
      await getMaintenanceTickets(null);
      expect(api.get).toHaveBeenCalledWith('/maintenance-tickets', { params: {} });
    });

    it('should handle undefined filters', async () => {
      api.get.mockResolvedValue({ data: { items: [] } });
      await getMaintenanceTickets();
      expect(api.get).toHaveBeenCalledWith('/maintenance-tickets', { params: {} });
    });
  });

  // ── assignTicket ──────────────────────────────────────────────
  it('should call PATCH /maintenance-tickets/:id/assign with technicianId', async () => {
    api.patch.mockResolvedValue({ data: { message: 'assigned' } });
    const result = await assignTicket(10, 5);
    expect(api.patch).toHaveBeenCalledWith('/maintenance-tickets/10/assign', { technicianId: 5 });
    expect(result).toEqual({ message: 'assigned' });
  });

  // ── getTechnicians ────────────────────────────────────────────
  describe('getTechnicians', () => {
    it('should call GET /user and filter for technician role', async () => {
      api.get.mockResolvedValue({
        data: [
          { userId: 1, role: 'technician', fullName: 'Tech A' },
          { userId: 2, role: 'admin', fullName: 'Admin B' },
          { userId: 3, role: 'technician', fullName: 'Tech C' },
        ],
      });
      const result = await getTechnicians(1);
      expect(api.get).toHaveBeenCalledWith('/user', { params: { orgId: 1 } });
      expect(result).toHaveLength(2);
      expect(result.every(u => u.role === 'technician')).toBe(true);
    });

    it('should return empty array when no technicians exist', async () => {
      api.get.mockResolvedValue({ data: [{ userId: 1, role: 'admin' }] });
      const result = await getTechnicians(1);
      expect(result).toHaveLength(0);
    });
  });
});
