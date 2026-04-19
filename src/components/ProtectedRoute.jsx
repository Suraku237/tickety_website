import { Navigate } from 'react-router-dom';
import { isLoggedIn } from '../services/session.service';

// =============================================================
// PROTECTED ROUTE
// Responsibilities:
//   - Wrap any route that requires authentication
//   - Redirect to /login if no valid session exists
// OOP Principle: Single Responsibility, Encapsulation
// =============================================================
export default function ProtectedRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}// ===