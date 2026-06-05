import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage      from './pages/LandingPage';
import LoginPage        from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import VerificationPage from './pages/VerificationPage';
import ServiceSetupPage from './pages/ServiceSetupPage';
import DashboardPage    from './pages/DashboardPage';
import NotFoundPage     from './pages/NotFoundPage';
import ProtectedRoute   from './components/ProtectedRoute';
import GuestRoute       from './components/GuestRoute';

// =============================================================
// APP  — Route definitions
// OOP Principle: Single Responsibility (routing only)
// =============================================================
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"  element={<LandingPage />} />

        {/* Guest-only — logged-in users get redirected to /dashboard */}
        <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegistrationPage /></GuestRoute>} />

        {/* Email verification — reached after registration */}
        <Route path="/verify" element={<VerificationPage />} />

        {/* Setup service — only reachable after email is verified */}
        <Route path="/setup-service" element={
          <ProtectedRoute requireSession={false}>
            <ServiceSetupPage />
          </ProtectedRoute>
        } />

        {/* Protected — redirect to /login if no session */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}