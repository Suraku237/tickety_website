import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage      from './pages/LandingPage';
import LoginPage        from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import ServiceSetupPage from './pages/ServiceSetupPage';
import DashboardPage    from './pages/DashboardPage';
import NotFoundPage     from './pages/NotFoundPage';
import ProtectedRoute   from './components/ProtectedRoute';
import QueueManagerPage from './pages/QueueManagerPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"              element={<LandingPage />}     />
        <Route path="/login"         element={<LoginPage />}        />
        <Route path="/register"      element={<RegistrationPage />} />
        <Route path="/setup-service" element={<ServiceSetupPage />} />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />

        <Route path="/queue-management" element={
          <ProtectedRoute>
            <QueueManagerPage />
          </ProtectedRoute>
        } />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}