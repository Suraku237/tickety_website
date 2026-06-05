import { Navigate, useLocation } from 'react-router-dom';
import { isLoggedIn } from '../services/session.service';

// =============================================================
// PROTECTED ROUTE
// Responsibilities:
//   - requireSession=true  (default): full login check — used for /dashboard
//   - requireSession=false: only blocks direct URL access with no state
//     (used for /setup-service which requires email from navigation state)
// OOP Principle: Single Responsibility, Encapsulation
// =============================================================
export default function ProtectedRoute({ children, requireSession = true }) {
  const location = useLocation();

  if (requireSession) {
    // Standard auth guard: redirect to /login if not logged in
    if (!isLoggedIn()) {
      return <Navigate to="/login" replace />;
    }
  } else {
    // State guard: block direct URL access (no email passed from previous step)
    if (!location.state?.email) {
      return <Navigate to="/register" replace />;
    }
  }

  return children;
}