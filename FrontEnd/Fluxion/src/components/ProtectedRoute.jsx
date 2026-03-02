import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute() {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) return <div className="loading">Loading...</div>;
    return isAuthenticated
        ? <Outlet />
        : <Navigate to="/login" state={{ from: location }} replace />;
}
