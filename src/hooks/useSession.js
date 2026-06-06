// =============================================================
// USE SESSION  (Updated Hook)
// Now delegates to SessionContext for reactivity (Fix 2).
// All components importing useSession automatically re-render
// when updateSession() is called (e.g. after username change).
// =============================================================
export { useSession } from '../context/SessionContext';