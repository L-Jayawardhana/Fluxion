import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import DashboardPage from './pages/Dashboard/DashboardPage';
import UsersPage from './pages/Users/UsersPage';
import OrganizationsPage from './pages/Organizations/OrganizationsPage';
import SettingsPage from './pages/Settings/SettingsPage';
import LoginPage from './pages/Login/LoginPage';
import NotFoundPage from './pages/NotFound/NotFoundPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Admin routes with sidebar layout */}
        <Route element={<AdminLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/organizations" element={<OrganizationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
