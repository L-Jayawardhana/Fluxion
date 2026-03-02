import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import SplashScreen from './components/SplashScreen';
import LandingPage from './pages/Landing/LandingPage';
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPassword/ForgotPasswordPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import WelcomePage from './pages/Welcome/WelcomePage';
import NotFoundPage from './pages/NotFound/NotFoundPage';

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
        <Routes>
          {/* Landing page */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth routes (standalone — they have their own layout) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Temporary test route */}
          <Route path="/test-welcome" element={<WelcomePage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/welcome" element={<WelcomePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              {/* Add more protected routes here */}
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
