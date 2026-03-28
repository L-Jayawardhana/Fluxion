import { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import SplashScreen from './components/SplashScreen';
import SpeedLoader from './components/SpeedLoader';
import RouteTransitionLoader from './components/RouteTransitionLoader';

/* Lazy-loaded pages — shows SpeedLoader while chunks download */
const LandingPage = lazy(() => import('./pages/Landing/LandingPage'));
const LoginPage = lazy(() => import('./pages/Login/LoginPage'));
const RegisterPage = lazy(() => import('./pages/Register/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPassword/ForgotPasswordPage'));
const AcceptInvitePage = lazy(() => import('./pages/AcceptInvite/AcceptInvitePage'));
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage'));
const DepartmentsPage = lazy(() => import('./pages/Departments/DepartmentsPage'));
const AddDepartmentPage = lazy(() => import('./pages/Departments/AddDepartmentPage'));
const RegisterAssetPage = lazy(() => import('./pages/Assets/RegisterAssetPage'));
const AllAssetsPage = lazy(() => import('./pages/Assets/AllAssetsPage'));
const AssignedAssetsPage = lazy(() => import('./pages/Assets/AssignedAssetsPage'));
const AdminAssetAssignmentsPage = lazy(() => import('./pages/Assets/AdminAssetAssignmentsPage'));
const WelcomePage = lazy(() => import('./pages/Welcome/WelcomePage'));
const NotFoundPage = lazy(() => import('./pages/NotFound/NotFoundPage'));
const InviteUserPage = lazy(() => import('./pages/Users/InviteUserPage'));
const UsersPage = lazy(() => import('./pages/Users/UsersPage'));
const RaiseTicketPage = lazy(() => import('./pages/Maintenance/RaiseTicketPage'));
const AllTicketsPage = lazy(() => import('./pages/Maintenance/AllTicketsPage'));
/* ── Technician portal ── */
const TechnicianDashboardPage   = lazy(() => import('./pages/Technician/TechnicianDashboardPage'));
const TechnicianTicketsPage     = lazy(() => import('./pages/Technician/TechnicianTicketsPage'));
const TechnicianTicketDetailPage= lazy(() => import('./pages/Technician/TechnicianTicketDetailPage'));
const TechnicianPerformancePage = lazy(() => import('./pages/Technician/TechnicianPerformancePage'));

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
      {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}
      <BrowserRouter>
        <RouteTransitionLoader />
        <Suspense fallback={<SpeedLoader label="Loading page…" />}>
          <Routes>
            {/* Landing page */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth routes (standalone — they have their own layout) */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/accept-invite" element={<AcceptInvitePage />} />

            {/* Temporary test route */}
            <Route path="/test-welcome" element={<WelcomePage />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/welcome" element={<WelcomePage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/invite-users" element={<InviteUserPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/departments" element={<DepartmentsPage />} />
                <Route path="/add-department" element={<AddDepartmentPage />} />
                <Route path="/register-asset" element={<RegisterAssetPage />} />
                <Route path="/assets" element={<AllAssetsPage />} />
                <Route path="/assigned-assets" element={<AssignedAssetsPage />} />
                <Route path="/assignments" element={<AdminAssetAssignmentsPage />} />
                <Route path="/raise-ticket" element={<RaiseTicketPage />} />
                <Route path="/tickets" element={<AllTicketsPage />} />
                {/* Technician portal */}
                <Route path="/technician/dashboard"    element={<TechnicianDashboardPage />} />
                <Route path="/technician/tickets"       element={<TechnicianTicketsPage />} />
                <Route path="/technician/tickets/:id"   element={<TechnicianTicketDetailPage />} />
                <Route path="/technician/performance"   element={<TechnicianPerformancePage />} />
                {/* Add more protected routes here */}
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
