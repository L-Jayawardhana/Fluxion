import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser({
                    userId: payload.sub,
                    email: payload.email,
                    role: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
                    orgId: payload.OrgId,
                });
            } catch {
                localStorage.removeItem('token');
                setToken(null);
            }
        }
        setLoading(false);
    }, [token]);

    const login = (tokenValue, userData) => {
        localStorage.setItem('token', tokenValue);
        setToken(tokenValue);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
