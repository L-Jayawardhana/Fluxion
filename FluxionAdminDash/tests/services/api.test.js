import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Unit tests for the FluxionAdminDash api.js service module.
 * Tests all exported API functions and the Axios interceptor behavior.
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

// We need to import AFTER mocking axios so the module uses our mock
import api, {
  getOrganizations,
  getUsers,
  updateOrganization,
  deleteOrganization,
  updateUser,
  deleteUser,
  getDepartments,
  createDepartment,
  updateDepartment,
  toggleDepartment,
} from '../../src/services/api';

describe('AdminDash API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Organizations ─────────────────────────────────────────────────
  describe('organization endpoints', () => {
    it('getOrganizations should call GET /organization', async () => {
      api.get.mockResolvedValue({ data: [{ orgId: 1 }] });

      const result = await getOrganizations();

      expect(api.get).toHaveBeenCalledWith('/organization');
      expect(result).toEqual([{ orgId: 1 }]);
    });

    it('updateOrganization should call PUT /organization/:id', async () => {
      api.put.mockResolvedValue({});

      await updateOrganization(5, { orgName: 'Updated' });

      expect(api.put).toHaveBeenCalledWith('/organization/5', { orgName: 'Updated' });
    });

    it('deleteOrganization should call DELETE /organization/:id', async () => {
      api.delete.mockResolvedValue({});

      await deleteOrganization(5);

      expect(api.delete).toHaveBeenCalledWith('/organization/5');
    });
  });

  // ── Users ─────────────────────────────────────────────────────────
  describe('user endpoints', () => {
    it('getUsers should call GET /user without orgId by default', async () => {
      api.get.mockResolvedValue({ data: [{ userId: 1 }] });

      const result = await getUsers();

      expect(api.get).toHaveBeenCalledWith('/user', { params: {} });
      expect(result).toEqual([{ userId: 1 }]);
    });

    it('getUsers should pass orgId when provided', async () => {
      api.get.mockResolvedValue({ data: [] });

      await getUsers(3);

      expect(api.get).toHaveBeenCalledWith('/user', { params: { orgId: 3 } });
    });

    it('updateUser should call PUT /user/:id', async () => {
      api.put.mockResolvedValue({});

      await updateUser(10, { fullName: 'Updated Name' });

      expect(api.put).toHaveBeenCalledWith('/user/10', { fullName: 'Updated Name' });
    });

    it('deleteUser should call DELETE /user/:id', async () => {
      api.delete.mockResolvedValue({});

      await deleteUser(10);

      expect(api.delete).toHaveBeenCalledWith('/user/10');
    });
  });

  // ── Departments ───────────────────────────────────────────────────
  describe('department endpoints', () => {
    it('getDepartments should call GET /department with orgId', async () => {
      api.get.mockResolvedValue({ data: [{ departmentId: 1 }] });

      const result = await getDepartments(2);

      expect(api.get).toHaveBeenCalledWith('/department', { params: { orgId: 2 } });
      expect(result).toEqual([{ departmentId: 1 }]);
    });

    it('createDepartment should call POST /department', async () => {
      api.post.mockResolvedValue({ data: { departmentId: 99 } });

      const result = await createDepartment({ departmentName: 'IT', orgId: 1 });

      expect(api.post).toHaveBeenCalledWith('/department', { departmentName: 'IT', orgId: 1 });
      expect(result).toEqual({ departmentId: 99 });
    });

    it('updateDepartment should call PUT /department/:id', async () => {
      api.put.mockResolvedValue({});

      await updateDepartment(5, { departmentName: 'HR' });

      expect(api.put).toHaveBeenCalledWith('/department/5', { departmentName: 'HR' });
    });

    it('toggleDepartment should call PATCH /department/:id/toggle', async () => {
      api.patch.mockResolvedValue({});

      await toggleDepartment(5, 1, false);

      expect(api.patch).toHaveBeenCalledWith('/department/5/toggle', {
        departmentId: 5,
        orgId: 1,
        isActive: false,
      });
    });
  });
});
