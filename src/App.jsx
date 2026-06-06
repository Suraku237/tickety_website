import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage      from './pages/LandingPage';
import LoginPage        from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import ServiceSetupPage from './pages/ServiceSetupPage';
import InvitePage       from './pages/InvitePage';
import VerifyPage       from './pages/VerifyPage';
import DashboardPage    from './pages/DashboardPage';
import QueuesPage       from './pages/QueuesPage';
import CounterPage      from './pages/CountersPage';
import TeamPage         from './pages/TeamPage';
import AnalyticsPage    from './pages/AnalyticsPage';
import SettingsPage     from './pages/SettingsPage';
import NotFoundPage     from './pages/NotFoundPage';
import ProtectedRoute   from './components/ProtectedRoute';
import RoleRoute        from './components/RoleRoute';
import './styles/dynamic_additions.css';

// =============================================================
// APP — Route definitions
// Fix 1: added /verify route (was missing — caused redirect crash)
// =============================================================
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"              element={<LandingPage />}      />
        <Route path="/login"         element={<LoginPage />}         />
        <Route path="/register"      element={<RegistrationPage />}  />
        <Route path="/verify"        element={<VerifyPage />}        />
        <Route path="/setup-service" element={<ServiceSetupPage />}  />
        <Route path="/invite/:token" element={<InvitePage />}        />

        {/* Boss-only */}
        <Route path="/dashboard" element={
          <ProtectedRoute><RoleRoute allowed={['boss']}><DashboardPage /></RoleRoute></ProtectedRoute>
        } />
        <Route path="/team" element={
          <ProtectedRoute><RoleRoute allowed={['boss']}><TeamPage /></RoleRoute></ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute><RoleRoute allowed={['boss']}><AnalyticsPage /></RoleRoute></ProtectedRoute>
        } />

        {/* Boss + Manager */}
        <Route path="/queues" element={
          <ProtectedRoute><RoleRoute allowed={['boss','manager']}><QueuesPage /></RoleRoute></ProtectedRoute>
        } />

        {/* Boss + Agent */}
        <Route path="/counter" element={
          <ProtectedRoute><RoleRoute allowed={['boss','agent']}><CounterPage /></RoleRoute></ProtectedRoute>
        } />

        {/* All roles */}
        <Route path="/settings" element={
          <ProtectedRoute><SettingsPage /></ProtectedRoute>
        } />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}