import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Unit tests for the Fluxion api.js service module.
 * Covers: department, organization, user, asset CRUD functions.
 */

vi.mock('axios', () => {
  const interceptors = {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  };
  const instance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors,
  };
  return {
    default: {
      create: vi.fn(() => instance),
    },
  };
});

import axios from 'axios';
import api, {
  getDepartments,
  getOrganizations,
  updateOrganization,
  getUsers,
  updateUser,
  createDepartment,
  updateDepartment,
  toggleDepartment,
  createAsset,
  getAssets,
  getAssetById,
  retireAsset,
  transferAsset,
} from '../../src/services/api';

describe('api.js service functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Department ────────────────────────────────────────────────
  describe('department endpoints', () => {
    it('getDepartments calls GET /department with orgId', async () => {
      api.get.mockResolvedValue({ data: [{ departmentId: 1 }] });
      const result = await getDepartments(2);
      expect(api.get).toHaveBeenCalledWith('/department', { params: { orgId: 2 } });
      expect(result).toEqual([{ departmentId: 1 }]);
    });

    it('createDepartment calls POST /department', async () => {
      api.post.mockResolvedValue({ data: { departmentId: 99 } });
      const result = await createDepartment({ departmentName: 'IT', orgId: 1 });
      expect(api.post).toHaveBeenCalledWith('/department', { departmentName: 'IT', orgId: 1 });
      expect(result).toEqual({ departmentId: 99 });
    });

    it('updateDepartment calls PUT /department/:id with merged data', async () => {
      api.put.mockResolvedValue({ data: { message: 'ok' } });
      await updateDepartment(5, 1, { departmentName: 'HR' });
      expect(api.put).toHaveBeenCalledWith('/department/5', {
        departmentId: 5,
        orgId: 1,
        departmentName: 'HR',
      });
    });

    it('toggleDepartment calls PATCH /department/:id/toggle', async () => {
      api.patch.mockResolvedValue({ data: {} });
      await toggleDepartment(5, 1, false);
      expect(api.patch).toHaveBeenCalledWith('/department/5/toggle', {
        departmentId: 5,
        orgId: 1,
        isActive: false,
      });
    });
  });

  // ── Organization ──────────────────────────────────────────────
  describe('organization endpoints', () => {
    it('getOrganizations calls GET /organization', async () => {
      api.get.mockResolvedValue({ data: [{ orgId: 1 }] });
      const result = await getOrganizations();
      expect(api.get).toHaveBeenCalledWith('/organization');
      expect(result).toEqual([{ orgId: 1 }]);
    });

    it('updateOrganization calls PUT /organization/:id', async () => {
      api.put.mockResolvedValue({ data: { orgName: 'Updated' } });
      const result = await updateOrganization(5, { orgName: 'Updated' });
      expect(api.put).toHaveBeenCalledWith('/organization/5', { orgName: 'Updated' });
      expect(result).toEqual({ orgName: 'Updated' });
    });
  });

  // ── User ──────────────────────────────────────────────────────
  describe('user endpoints', () => {
    it('getUsers calls GET /user with orgId', async () => {
      api.get.mockResolvedValue({ data: [{ userId: 1 }] });
      const result = await getUsers(3);
      expect(api.get).toHaveBeenCalledWith('/user', { params: { orgId: 3 } });
      expect(result).toEqual([{ userId: 1 }]);
    });

    it('updateUser calls PUT /user/:id', async () => {
      api.put.mockResolvedValue({ data: {} });
      await updateUser(10, { fullName: 'New Name' });
      expect(api.put).toHaveBeenCalledWith('/user/10', { fullName: 'New Name' });
    });
  });

  // ── Asset ─────────────────────────────────────────────────────
  describe('asset endpoints', () => {
    it('createAsset calls POST /asset', async () => {
      api.post.mockResolvedValue({ data: { assetId: 1 } });
      const result = await createAsset({ assetName: 'Laptop', orgId: 1 });
      expect(api.post).toHaveBeenCalledWith('/asset', { assetName: 'Laptop', orgId: 1 });
      expect(result).toEqual({ assetId: 1 });
    });

    it('getAssets calls GET /asset with orgId only', async () => {
      api.get.mockResolvedValue({ data: [] });
      await getAssets(1);
      expect(api.get).toHaveBeenCalledWith('/asset', { params: { orgId: 1 } });
    });

    it('getAssets passes departmentId and assetType when provided', async () => {
      api.get.mockResolvedValue({ data: [] });
      await getAssets(1, { departmentId: 5, assetType: 'hardware' });
      expect(api.get).toHaveBeenCalledWith('/asset', {
        params: { orgId: 1, departmentId: 5, assetType: 'hardware' },
      });
    });

    it('getAssetById calls GET /asset/:id with orgId', async () => {
      api.get.mockResolvedValue({ data: { assetId: 10 } });
      const result = await getAssetById(10, 1);
      expect(api.get).toHaveBeenCalledWith('/asset/10', { params: { orgId: 1 } });
      expect(result).toEqual({ assetId: 10 });
    });

    it('retireAsset calls PUT /asset/:id/retire', async () => {
      api.put.mockResolvedValue({ data: { message: 'retired' } });
      await retireAsset(10, 1, 5);
      expect(api.put).toHaveBeenCalledWith('/asset/10/retire', { orgId: 1, retiredBy: 5 });
    });

    it('transferAsset calls PUT /asset/:id/transfer', async () => {
      api.put.mockResolvedValue({ data: { message: 'transferred' } });
      await transferAsset(10, 1, 3, 5);
      expect(api.put).toHaveBeenCalledWith('/asset/10/transfer', {
        orgId: 1,
        newDepartmentId: 3,
        transferredBy: 5,
      });
    });
  });
});
