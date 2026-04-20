import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import SpeedLoader from './SpeedLoader';

export default function ProtectedRoute() {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) return <SpeedLoader label="Authenticating…" />;
    return isAuthenticated
        ? <Outlet />
        : <Navigate to="/login" state={{ from: location }} replace />;
}
