import { createContext, useContext, useState, useEffect, useCallback } from 'react';

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

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const stored = getStoredToken();
        if (stored && isTokenValid(stored)) {
            const payload = decodeToken(stored);
            return {
                userId: payload.sub,
                email: payload.email,
                role: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
                orgId: payload.OrgId,
            };
        }
        return null;
    });
    const [token, setToken] = useState(() => {
        const stored = getStoredToken();
        if (stored && isTokenValid(stored)) return stored;
        if (stored) clearStoredAuth();
        return null;
    });
    const [loading, setLoading] = useState(false);

    // Sync user when token changes (after login/logout/expiry — not on mount)
    useEffect(() => {
        if (token && isTokenValid(token)) {
            const payload = decodeToken(token);
            if (payload) {
                setUser({
                    userId: payload.sub,
                    email: payload.email,
                    role: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
                    orgId: payload.OrgId,
                });
                return;
            }
        }
        // token is null, invalid, or expired
        if (token) {
            clearStoredAuth();
        }
        setToken((prev) => prev ? null : prev);
        setUser((prev) => prev ? null : prev);
    }, [token]);

    // Listen for storage changes from other tabs (localStorage only — sessionStorage doesn't fire cross-tab)
    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === 'token') {
                const newToken = e.newValue;
                if (newToken && isTokenValid(newToken)) {
                    setToken(newToken);
                } else {
                    setToken(null);
                    setUser(null);
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
                setUser(null);
            }
        }, 60_000);
        return () => clearInterval(interval);
    }, [token]);

    const login = useCallback((tokenValue, userData, rememberMe = false, expiresAt = null) => {
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
        setUser(userData);
    }, []);

    const logout = useCallback(() => {
        clearStoredAuth();
        setToken(null);
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated: !!token && !!user }}>
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
