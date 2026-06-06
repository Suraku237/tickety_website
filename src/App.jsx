import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage       from './pages/LandingPage';
import LoginPage         from './pages/LoginPage';
import RegistrationPage  from './pages/RegistrationPage';
import VerificationPage  from './pages/VerificationPage';
import ServiceSetupPage  from './pages/ServiceSetupPage';
import DashboardPage     from './pages/DashboardPage';
import QueueManagerPage  from './pages/QueueManagerPage';
import NotFoundPage      from './pages/NotFoundPage';
import ProtectedRoute    from './components/ProtectedRoute';
import GuestRoute        from './components/Guestroute';
import { AppProvider }   from './contexts/AppContext';

// =============================================================
// APP  — Route definitions
// AppProvider wraps the protected zone so queues are available
// across DashboardPage and QueueManagerPage without re-fetching.
// OOP Principle: Single Responsibility (routing only)
// =============================================================
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"  element={<LandingPage />} />

        {/* Guest-only */}
        <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegistrationPage /></GuestRoute>} />

        {/* Email verification */}
        <Route path="/verify" element={<VerificationPage />} />

        {/* Setup service — after email verified */}
        <Route path="/setup-service" element={
          <ProtectedRoute requireSession={false}>
            <ServiceSetupPage />
          </ProtectedRoute>
        } />

        {/* Protected zone — AppProvider supplies queue state */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <AppProvider>
              <DashboardPage />
            </AppProvider>
          </ProtectedRoute>
        } />

        <Route path="/queues" element={
          <ProtectedRoute>
            <AppProvider>
              <QueueManagerPage />
            </AppProvider>
          </ProtectedRoute>
        } />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
