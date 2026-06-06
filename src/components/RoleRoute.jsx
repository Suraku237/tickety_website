import { Navigate } from 'react-router-dom';
import { restoreSession } from '../services/session.service';

// =============================================================
// ROLE ROUTE
// Responsibilities:
//   - Restrict access to pages based on admin_role
//   - Redirect to the role's home page if access is denied
// OOP Principle: Single Responsibility, Encapsulation
//
// ROLE HOME PAGES:
//   boss    → /dashboard
//   manager → /queues
//   agent   → /counter
// =============================================================

const ROLE_HOME = {
  boss:    '/dashboard',
  manager: '/queues',
  agent:   '/counter',
};

export default function RoleRoute({ children, allowed = [] }) {
  const user = restoreSession();
  const role = user?.admin_role;

  if (!role || !allowed.includes(role)) {
    // Redirect to the user's actual home page
    const home = ROLE_HOME[role] ?? '/dashboard';
    return <Navigate to={home} replace />;
  }

  return children;
}