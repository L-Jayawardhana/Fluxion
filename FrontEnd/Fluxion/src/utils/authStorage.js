/**
 * authStorage.js — Single source of truth for auth token persistence.
 *
 * Having one canonical place means any future change to storage keys,
 * strategy (e.g. cookies), or fallback logic only needs to happen here.
 * Both api.js (Axios interceptors) and useAuth.jsx (AuthContext) import
 * from this module — they will never drift out of sync.
 */

/** Read the active auth token from whichever storage holds it. */
export function getStoredToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

/** Remove all auth-related keys from both storages. */
export function clearStoredAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('expiresAt');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('expiresAt');
}
