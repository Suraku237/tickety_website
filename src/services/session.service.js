// =============================================================
// SESSION SERVICE
// Responsibilities:
//   - Persist authenticated user data to sessionStorage
//   - Restore session on page reload
//   - Clear session on logout
// OOP Principle: Singleton, Encapsulation, Single Responsibility
//   (mirrors SessionService singleton in the Flutter app)
// =============================================================

const STORAGE_KEY = 'tickety_user';

// ----------------------------------------------------------
// SAVE
// Called after successful login or service creation (Step 3)
// ----------------------------------------------------------
export function saveSession(userData) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
}// ===

// ----------------------------------------------------------
// RESTORE
// Returns the stored user object or null if not logged in
// ----------------------------------------------------------
export function restoreSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ----------------------------------------------------------
// IS LOGGED IN
// Quick boolean check used by ProtectedRoute
// ----------------------------------------------------------
export function isLoggedIn() {
  return restoreSession() !== null;
}

// ----------------------------------------------------------
// CLEAR
// Called on logout
// ----------------------------------------------------------
export function clearSession() {
  sessionStorage.removeItem(STORAGE_KEY);
}