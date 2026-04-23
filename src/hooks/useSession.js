import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { restoreSession, clearSession } from '../services/session.service';

// =============================================================
// USE SESSION  (Custom Hook)
// Responsibilities:
//   - Give any component clean access to the current session
//   - Provide a logout helper that clears session + redirects
// OOP Principle: Encapsulation, Single Responsibility
// =============================================================
export function useSession() {
  const navigate = useNavigate();

  // useState lazy initializer — runs once on mount so React
  // properly tracks the value and triggers re-renders
  const [user] = useState(() => restoreSession());

  const logout = () => {
    clearSession();
    navigate('/login');
  };

  return { user, logout };
}
