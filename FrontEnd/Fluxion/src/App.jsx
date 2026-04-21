import { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute, { RoleRoute } from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import SplashScreen from './components/SplashScreen';
import SpeedLoader from './components/SpeedLoader';
import RouteTransitionLoader from './components/RouteTransitionLoader';

/* ── Role groups ──────────────────────────────────────────── */
const ADMIN_ROLES       = ['owner', 'admin', 'systemadmin', 'manager'];
const TECHNICIAN_ROLES  = ['technician'];
const USER_ROLES        = ['user'];
const ALL_STAFF         = [...ADMIN_ROLES, ...TECHNICIAN_ROLES, ...USER_ROLES];

/* ── Lazy-loaded pages ───────────────────────────────────── */
const LandingPage             = lazy(() => import('./pages/Landing/LandingPage'));
const LoginPage               = lazy(() => import('./pages/Login/LoginPage'));
const RegisterPage            = lazy(() => import('./pages/Register/RegisterPage'));
const ForgotPasswordPage      = lazy(() => import('./pages/ForgotPassword/ForgotPasswordPage'));
const AcceptInvitePage        = lazy(() => import('./pages/AcceptInvite/AcceptInvitePage'));
const WelcomePage             = lazy(() => import('./pages/Welcome/WelcomePage'));
const NotFoundPage            = lazy(() => import('./pages/NotFound/NotFoundPage'));
const UnauthorizedPage        = lazy(() => import('./pages/Unauthorized/UnauthorizedPage'));

/* Admin/Manager pages */
const DashboardPage           = lazy(() => import('./pages/Dashboard/DashboardPage'));
const DepartmentsPage         = lazy(() => import('./pages/Departments/DepartmentsPage'));
const AddDepartmentPage       = lazy(() => import('./pages/Departments/AddDepartmentPage'));
const RegisterAssetPage       = lazy(() => import('./pages/Assets/RegisterAssetPage'));
const AllAssetsPage           = lazy(() => import('./pages/Assets/AllAssetsPage'));
const AdminAssetAssignmentsPage = lazy(() => import('./pages/Assets/AdminAssetAssignmentsPage'));
const InviteUserPage          = lazy(() => import('./pages/Users/InviteUserPage'));
const UsersPage               = lazy(() => import('./pages/Users/UsersPage'));
const RolesPage               = lazy(() => import('./pages/Users/RolesPage'));
const WarrantyExpiryPage      = lazy(() => import('./pages/Reports/WarrantyExpiryPage'));
const MaintenanceCostPage     = lazy(() => import('./pages/Reports/MaintenanceCostPage'));
const SettingsPage            = lazy(() => import('./pages/Settings/SettingsPage'));

/* Shared pages (all authenticated roles) */
const AllTicketsPage          = lazy(() => import('./pages/Maintenance/AllTicketsPage'));
const RaiseTicketPage         = lazy(() => import('./pages/Maintenance/RaiseTicketPage'));
const MaintenanceLogPage      = lazy(() => import('./pages/Maintenance/MaintenanceLogPage'));
const NotificationsPage       = lazy(() => import('./pages/Notifications/NotificationsPage'));
const SupportPage             = lazy(() => import('./pages/Support/SupportPage'));

/* User-only pages */
const AssignedAssetsPage      = lazy(() => import('./pages/Assets/AssignedAssetsPage'));

/* Technician portal */
const TechnicianDashboardPage   = lazy(() => import('./pages/Technician/TechnicianDashboardPage'));
const TechnicianTicketsPage     = lazy(() => import('./pages/Technician/TechnicianTicketsPage'));
const TechnicianTicketDetailPage= lazy(() => import('./pages/Technician/TechnicianTicketDetailPage'));
const TechnicianPerformancePage = lazy(() => import('./pages/Technician/TechnicianPerformancePage'));

/* ── Splash Wrapper (only show on public entry points) ───────── */
function SplashWrapper({ splashDone, onComplete }) {
  const location = useLocation();
  const publicPaths = ['/', '/login', '/register', '/forgot-password'];
  
  // Only show splash if on a public path AND not already shown this session
  if (splashDone || !publicPaths.includes(location.pathname)) return null;
  
  return <SplashScreen onComplete={onComplete} />;
}

/* ── Transition Wrapper (only show on public pages) ────────── */
function TransitionWrapper() {
  const location = useLocation();
  const publicPaths = ['/', '/login', '/register', '/forgot-password'];
  
  if (!publicPaths.includes(location.pathname)) return null;
  
  return <RouteTransitionLoader />;
}

/* ████████████████████████████████████████████████████████ */
function App() {
  const [splashDone, setSplashDone] = useState(
    () => sessionStorage.getItem('splashShown') === 'true'
  );

  const handleSplashComplete = () => {
    sessionStorage.setItem('splashShown', 'true');
    setSplashDone(true);
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <SplashWrapper splashDone={splashDone} onComplete={handleSplashComplete} />
        <TransitionWrapper />
        <Suspense fallback={<SpeedLoader label="Loading page…" />}>
          <Routes>
            {/* Public */}
            <Route path="/"                element={<LandingPage />} />
            <Route path="/login"           element={<LoginPage />} />
            <Route path="/register"        element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/accept-invite"   element={<AcceptInvitePage />} />
            <Route path="/unauthorized"    element={<UnauthorizedPage />} />

            {/* Protected (must be logged in) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>

                {/* ── Universal pages (all roles) ─────────────────── */}
                <Route path="/welcome"       element={<WelcomePage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/support"       element={<SupportPage />} />
                <Route path="/raise-ticket"  element={<RaiseTicketPage />} />
                <Route path="/tickets"       element={<AllTicketsPage />} />
                <Route path="/maintenance-logs"         element={<MaintenanceLogPage />} />
                <Route path="/maintenance-logs/:assetId" element={<MaintenanceLogPage />} />

                {/* ── Admin / Manager / Owner only ────────────────── */}
                <Route element={<RoleRoute allow={ADMIN_ROLES} />}>
                  <Route path="/dashboard"              element={<DashboardPage />} />
                  <Route path="/departments"            element={<DepartmentsPage />} />
                  <Route path="/add-department"         element={<AddDepartmentPage />} />
                  <Route path="/register-asset"         element={<RegisterAssetPage />} />
                  <Route path="/assets"                 element={<AllAssetsPage />} />
                  <Route path="/assignments"            element={<AdminAssetAssignmentsPage />} />
                  <Route path="/invite-users"           element={<InviteUserPage />} />
                  <Route path="/users"                  element={<UsersPage />} />
                  <Route path="/roles"                  element={<RolesPage />} />
                  <Route path="/report-warranty"        element={<WarrantyExpiryPage />} />
                  <Route path="/report-maintenance-cost" element={<MaintenanceCostPage />} />
                  <Route path="/settings"               element={<SettingsPage />} />
                </Route>

                {/* ── Technician only ──────────────────────────────── */}
                <Route element={<RoleRoute allow={TECHNICIAN_ROLES} />}>
                  <Route path="/technician/dashboard"   element={<TechnicianDashboardPage />} />
                  <Route path="/technician/tickets"     element={<TechnicianTicketsPage />} />
                  <Route path="/technician/tickets/:id" element={<TechnicianTicketDetailPage />} />
                  <Route path="/technician/performance" element={<TechnicianPerformancePage />} />
                </Route>

                {/* ── Regular user only ────────────────────────────── */}
                <Route element={<RoleRoute allow={USER_ROLES} />}>
                  <Route path="/assigned-assets" element={<AssignedAssetsPage />} />
                </Route>

              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
