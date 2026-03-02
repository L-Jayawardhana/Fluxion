import { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // Initial state from localStorage or empty
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('admin_user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const [token, setToken] = useState(() => localStorage.getItem('admin_token'));
    const [loading, setLoading] = useState(false); // Can implement initial load check if needed

    // Update axios headers if token changes (if we move axios interceptor logic here or use useEffect)
    // For now we rely on api.js interceptor reading from localStorage directly or we can optimize it.

    const login = (userData, authToken) => {
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('admin_user', JSON.stringify(userData));
        localStorage.setItem('admin_token', authToken);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_token');
    };

    const isAuthenticated = !!user && !!token;

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
