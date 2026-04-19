import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../src/context/AuthContext';

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

  // ── Initial state ─────────────────────────────────────────────
  it('should initialize as unauthenticated when localStorage is empty', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it('should restore user from localStorage on mount', () => {
    localStorage.setItem('admin_user', JSON.stringify({ email: 'admin@test.com' }));
    localStorage.setItem('admin_token', 'jwt-token-123');

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user.email).toBe('admin@test.com');
    expect(result.current.token).toBe('jwt-token-123');
  });

  // ── login ─────────────────────────────────────────────────────
  it('should update state and localStorage on login', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login({ email: 'admin@test.com' }, 'token-abc');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user.email).toBe('admin@test.com');
    expect(result.current.token).toBe('token-abc');
    expect(localStorage.getItem('admin_token')).toBe('token-abc');
    expect(JSON.parse(localStorage.getItem('admin_user'))).toEqual({ email: 'admin@test.com' });
  });

  // ── logout ────────────────────────────────────────────────────
  it('should clear state and localStorage on logout', () => {
    localStorage.setItem('admin_user', JSON.stringify({ email: 'admin@test.com' }));
    localStorage.setItem('admin_token', 'jwt-token-123');

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem('admin_token')).toBeNull();
    expect(localStorage.getItem('admin_user')).toBeNull();
  });

  // ── isAuthenticated logic ─────────────────────────────────────
  it('isAuthenticated should be false if only user exists but no token', () => {
    localStorage.setItem('admin_user', JSON.stringify({ email: 'admin@test.com' }));

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('isAuthenticated should be false if only token exists but no user', () => {
    localStorage.setItem('admin_token', 'some-token');

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
  });
});
