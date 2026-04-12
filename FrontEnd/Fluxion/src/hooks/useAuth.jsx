import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const AuthContext = createContext(null);

/** Decode a JWT payload, returning null on any error */
function decodeToken(token) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch {
        return null;
    }
}

/** Check whether a JWT string is still valid */
function isTokenValid(token) {
    if (!token) return false;
    const payload = decodeToken(token);
    if (!payload) return false;
    if (payload.exp && Date.now() >= payload.exp * 1000) return false;
    return true;
}

/** Read token from whichever storage has it */
function getStoredToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

/** Clear token from both storages */
function clearStoredAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('expiresAt');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('expiresAt');
}

/** Build a user object from a valid token, or return null */
function userFromToken(token) {
    if (!token || !isTokenValid(token)) return null;
    const payload = decodeToken(token);
    if (!payload) return null;

    const role =
        payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
        payload.role ||
        payload.Role ||
        null;

    const orgIdRaw =
        payload.OrgId ??
        payload.orgId ??
        payload['http://schemas.fluxion/claims/orgId'] ??
        null;

    const orgId = orgIdRaw === null || orgIdRaw === '' ? null : Number(orgIdRaw);

    return {
        userId: payload.sub || payload.nameid || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
        email: payload.email,
        role,
        orgId: Number.isFinite(orgId) ? orgId : null,
    };
}

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => {
        const stored = getStoredToken();
        if (stored && isTokenValid(stored)) return stored;
        if (stored) clearStoredAuth();
        return null;
    });

    // Derive user from token — no effect needed, no cascading setState
    const user = useMemo(() => userFromToken(token), [token]);

    // Listen for storage changes from other tabs (localStorage only — sessionStorage doesn't fire cross-tab)
    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === 'token') {
                const newToken = e.newValue;
                if (newToken && isTokenValid(newToken)) {
                    setToken(newToken);
                } else {
                    setToken(null);
                }
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    // Periodically check if the current token has expired (every 60s)
    useEffect(() => {
        if (!token) return;
        const interval = setInterval(() => {
            if (!isTokenValid(token)) {
                clearStoredAuth();
                setToken(null);
            }
        }, 60_000);
        return () => clearInterval(interval);
    }, [token]);

    const login = useCallback((tokenValue, _userData, rememberMe = false, expiresAt = null) => {
        // Clear both storages first to avoid stale tokens
        clearStoredAuth();

        // Remember me → localStorage (survives browser close)
        // No remember me → sessionStorage (cleared when browser closes)
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('token', tokenValue);
        if (expiresAt) {
            storage.setItem('expiresAt', expiresAt.toString());
        }
        setToken(tokenValue);
    }, []);

    const logout = useCallback(() => {
        clearStoredAuth();
        setToken(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, loading: false, login, logout, isAuthenticated: !!token && !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
