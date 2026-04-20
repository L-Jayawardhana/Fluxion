import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import SpeedLoader from './SpeedLoader';

/** Checks only that the user is authenticated. */
export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <SpeedLoader label="Authenticating…" />;
  return isAuthenticated
    ? <Outlet />
    : <Navigate to="/login" state={{ from: location }} replace />;
}

/**
 * RoleRoute — wraps a set of routes and redirects to /unauthorized
 * if the logged-in user's role is not in the allowed list.
 *
 * Usage:
 *   <Route element={<RoleRoute allow={['owner','admin','manager']} />}>
 *     <Route path="/departments" element={<DepartmentsPage />} />
 *   </Route>
 */
export function RoleRoute({ allow = [] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <SpeedLoader label="Checking access…" />;

  const role = user?.role?.toLowerCase() || '';
  const allowed = allow.map(r => r.toLowerCase());

  return allowed.includes(role)
    ? <Outlet />
    : <Navigate to="/unauthorized" state={{ from: location }} replace />;
}
