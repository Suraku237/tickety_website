import { restoreSession, clearSession } from '../services/session.service';
import { useNavigate } from 'react-router-dom';

// =============================================================
// USE SESSION  (Custom Hook)
// Responsibilities:
//   - Give any component clean access to the current session
//   - Provide a logout helper that clears session + redirects
// OOP Principle: Encapsulation, Single Responsibility
// =============================================================
export function useSession() {
  const navigate = useNavigate();
  const user     = restoreSession();

  const logout = () => {
    clearSession();
    navigate('/login');
  };

  return { user, logout };
}// ===