import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import DashboardPage from './pages/Dashboard/DashboardPage';
import UsersPage from './pages/Users/UsersPage';
import OrganizationsPage from './pages/Organizations/OrganizationsPage';
import SettingsPage from './pages/Settings/SettingsPage';
import PlansPage from './pages/Plans/PlansPage';
import LogsPage from './pages/Logs/LogsPage';
import ServersPage from './pages/Servers/ServersPage';
import LoginPage from './pages/Login/LoginPage';
import NotFoundPage from './pages/NotFound/NotFoundPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Admin login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes with sidebar layout */}
          <Route element={<ProtectedRoute />}>
             <Route element={<AdminLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/organizations" element={<OrganizationsPage />} />
                <Route path="/plans" element={<PlansPage />} />
                <Route path="/logs" element={<LogsPage />} />
                <Route path="/servers" element={<ServersPage />} />
                <Route path="/settings" element={<SettingsPage />} />
             </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
