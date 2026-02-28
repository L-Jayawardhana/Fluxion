import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

function parseToken(token) {
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
            userId: payload.sub,
            email: payload.email,
            role: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
            orgId: payload.OrgId,
        };
    } catch {
        return null;
    }
}

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [user, setUser] = useState(() => parseToken(localStorage.getItem('token')));
    const loading = false;

    const login = useCallback((tokenValue, userData) => {
        localStorage.setItem('token', tokenValue);
        setToken(tokenValue);
        setUser(userData ?? parseToken(tokenValue));
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated: !!token }}>
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
