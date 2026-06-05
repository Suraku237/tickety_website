import { Navigate } from 'react-router-dom';
import { isLoggedIn } from '../services/session.service';

// =============================================================
// GUEST ROUTE
// Responsibilities:
//   - Wrap routes that should only be accessible when NOT logged in
//   - Redirect authenticated users to /dashboard
// OOP Principle: Single Responsibility, Encapsulation
// =============================================================
export default function GuestRoute({ children }) {
  if (isLoggedIn()) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}