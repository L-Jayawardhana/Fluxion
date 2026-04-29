import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Unit tests for the authService module.
 * These test the service layer functions that wrap Axios API calls.
 */

// Mock the api module
vi.mock('../../src/services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

import api from '../../src/services/api';
import { authService, GOOGLE_CLIENT_ID } from '../../src/services/authService';

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GOOGLE_CLIENT_ID ──────────────────────────────────────────────
  it('should export GOOGLE_CLIENT_ID as a non-empty string', () => {
    expect(GOOGLE_CLIENT_ID).toBeDefined();
    expect(typeof GOOGLE_CLIENT_ID).toBe('string');
    expect(GOOGLE_CLIENT_ID.length).toBeGreaterThan(0);
  });

  // ── login ─────────────────────────────────────────────────────────
  describe('login', () => {
    it('should call POST /Auth/login with correct payload', async () => {
      api.post.mockResolvedValue({ data: { token: 'abc' } });

      await authService.login('test@fluxion.dev', 'Pass123!', true);

      expect(api.post).toHaveBeenCalledWith('/Auth/login', {
        email: 'test@fluxion.dev',
        password: 'Pass123!',
        rememberMe: true,
      });
    });

    it('should default rememberMe to false', async () => {
      api.post.mockResolvedValue({ data: {} });

      await authService.login('test@fluxion.dev', 'Pass123!');

      expect(api.post).toHaveBeenCalledWith('/Auth/login', {
        email: 'test@fluxion.dev',
        password: 'Pass123!',
        rememberMe: false,
      });
    });
  });

  // ── register ──────────────────────────────────────────────────────
  describe('register', () => {
    it('should call POST /Auth/register with correct payload', async () => {
      api.post.mockResolvedValue({ data: { userId: 1 } });

      await authService.register('John', 'john@test.com', 'Pass123!', 5);

      expect(api.post).toHaveBeenCalledWith('/Auth/register', {
        fullName: 'John',
        email: 'john@test.com',
        password: 'Pass123!',
        orgId: 5,
      });
    });

    it('should default orgId to null', async () => {
      api.post.mockResolvedValue({ data: {} });

      await authService.register('John', 'john@test.com', 'Pass123!');

      expect(api.post).toHaveBeenCalledWith('/Auth/register', {
        fullName: 'John',
        email: 'john@test.com',
        password: 'Pass123!',
        orgId: null,
      });
    });
  });

  // ── googleLogin ───────────────────────────────────────────────────
  it('should call POST /Auth/google with idToken', async () => {
    api.post.mockResolvedValue({ data: {} });

    await authService.googleLogin('google-token-abc');

    expect(api.post).toHaveBeenCalledWith('/Auth/google', { idToken: 'google-token-abc' });
  });

  // ── sendVerificationCode ──────────────────────────────────────────
  it('should call POST /Auth/send-verification-code with email', async () => {
    api.post.mockResolvedValue({ data: {} });

    await authService.sendVerificationCode('test@fluxion.dev');

    expect(api.post).toHaveBeenCalledWith('/Auth/send-verification-code', { email: 'test@fluxion.dev' });
  });

  // ── verifyCode ─────────────────────────────────────────────────────
  it('should call POST /Auth/verify-code with email and code', async () => {
    api.post.mockResolvedValue({ data: {} });

    await authService.verifyCode('test@fluxion.dev', '123456');

    expect(api.post).toHaveBeenCalledWith('/Auth/verify-code', { email: 'test@fluxion.dev', code: '123456' });
  });

  // ── forgotPassword ────────────────────────────────────────────────
  it('should call POST /Auth/forgot-password with email', async () => {
    api.post.mockResolvedValue({ data: {} });

    await authService.forgotPassword('test@fluxion.dev');

    expect(api.post).toHaveBeenCalledWith('/Auth/forgot-password', { email: 'test@fluxion.dev' });
  });

  // ── resetPassword ─────────────────────────────────────────────────
  it('should call POST /Auth/reset-password with email, code, newPassword', async () => {
    api.post.mockResolvedValue({ data: {} });

    await authService.resetPassword('test@fluxion.dev', '123456', 'NewPass1!');

    expect(api.post).toHaveBeenCalledWith('/Auth/reset-password', {
      email: 'test@fluxion.dev',
      code: '123456',
      newPassword: 'NewPass1!',
    });
  });

  // ── changePassword ────────────────────────────────────────────────
  it('should call POST /Auth/change-password with both passwords', async () => {
    api.post.mockResolvedValue({ data: {} });

    await authService.changePassword('OldPass1!', 'NewPass1!');

    expect(api.post).toHaveBeenCalledWith('/Auth/change-password', {
      currentPassword: 'OldPass1!',
      newPassword: 'NewPass1!',
    });
  });

  // ── createOrganization ────────────────────────────────────────────
  it('should call POST /Organization with org data', async () => {
    api.post.mockResolvedValue({ data: { orgId: 1 } });

    await authService.createOrganization('Acme', 'acme', 'UTC', 1);

    // Service always passes a config object as 3rd arg ({} when no token supplied)
    expect(api.post).toHaveBeenCalledWith('/Organization', {
      orgName: 'Acme',
      slug: 'acme',
      timezone: 'UTC',
      ownerId: 1,
    }, {});
  });

  // ── uploadOrgLogo ─────────────────────────────────────────────────
  it('should call POST /Organization/:id/logo-base64 with logo data', async () => {
    api.post.mockResolvedValue({ data: { logoUrl: '/uploads/logo.png' } });

    await authService.uploadOrgLogo(5, { base64: 'data:image/png;base64,abc' });

    // Service always passes a config object as 3rd arg ({} when no token supplied)
    expect(api.post).toHaveBeenCalledWith('/Organization/5/logo-base64', {
      base64: 'data:image/png;base64,abc',
    }, {});
  });
});
