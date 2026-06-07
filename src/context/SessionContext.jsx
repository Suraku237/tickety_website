import { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  restoreSession,
  saveSession as persistSession,
  clearSession,
} from '../services/session.service';

// =============================================================
// SESSION CONTEXT
// Fix 2: makes session reactive — any component calling
// updateSession() will cause all consumers (sidebar username,
// page header, etc.) to re-render with the new values.
//
// replaces the static useSession hook.
// OOP Principle: Singleton, Observer, Encapsulation
// =============================================================

const SessionContext = createContext({
  user:          null,
  updateSession: () => {},
  logout:        () => {},
});

export function SessionProvider({ children }) {
  const [user, setUser] = useState(() => restoreSession());

  const updateSession = useCallback((patch) => {
    setUser(prev => {
      const next = { ...prev, ...patch };
      persistSession(next);
      return next;
    });
  }, []);

  // logout needs navigate — but SessionProvider wraps BrowserRouter's children
  // so we can't call useNavigate here. We expose a logout factory instead.
  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    // Navigation handled by caller (SettingsPage / DashLayout)
    window.location.href = '/login';
  }, []);

  return (
    <SessionContext.Provider value={{ user, updateSession, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}