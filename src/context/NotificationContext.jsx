import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { restoreSession } from '../services/session.service';

// =============================================================
// NOTIFICATION CONTEXT
// Responsibilities:
//   - Poll backend every 30s for new notifications
//   - Expose unread count, full list, and toast queue
//   - Provide push() for local toasts triggered by UI actions
//   - Provide markAllRead(), markRead()
// OOP Principle: Singleton, Observer Pattern, Encapsulation
// =============================================================

const POLL_INTERVAL = 30_000; // 30 seconds
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

const NotificationContext = createContext({
  notifications:  [],
  unreadCount:    0,
  toasts:         [],
  pushToast:      () => {},
  markAllRead:    () => {},
  markRead:       () => {},
  refresh:        () => {},
});

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [toasts,        setToasts]        = useState([]);
  const prevUnreadRef = useRef(0);
  const toastIdRef    = useRef(0);

  const user = restoreSession();

  // ── FETCH FROM BACKEND ───────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user?.service_id) return;
    try {
      const res  = await fetch(
        `${BASE_URL}/notifications?service_id=${user.service_id}&limit=50`,
        { headers: { 'Content-Type': 'application/json', 'X-App-Source': 'web' } }
      );
      const data = await res.json();
      if (!data.success) return;

      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);

      // Auto-toast any NEW unread notifications since last poll
      const prevUnread = prevUnreadRef.current;
      const newCount   = data.unread_count || 0;
      if (newCount > prevUnread) {
        const newNotifs = (data.notifications || [])
          .filter(n => !n.read)
          .slice(0, newCount - prevUnread);
        newNotifs.forEach(n => _addToast({
          type:  n.type,
          title: n.title,
          body:  n.body,
          meta:  n.meta,
        }));
      }
      prevUnreadRef.current = newCount;
    } catch {
      // silent — no network spam
    }
  }, [user?.service_id]);

  // ── POLLING ──────────────────────────────────────────────
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // ── TOAST MANAGEMENT ─────────────────────────────────────
  const _addToast = useCallback((toast) => {
    const id = ++toastIdRef.current;
    setToasts(prev => {
      // Max 3 toasts at a time — drop oldest if needed
      const next = [...prev.slice(-2), { ...toast, id }];
      return next;
    });
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  // Public: push a local toast immediately (called from UI actions)
  const pushToast = useCallback((toast) => {
    _addToast(toast);
  }, [_addToast]);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── MARK READ ────────────────────────────────────────────
  const markRead = useCallback(async (notificationId) => {
    if (!user?.service_id) return;
    try {
      await fetch(`${BASE_URL}/notifications/${notificationId}/read`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-App-Source': 'web' },
      });
      setNotifications(prev =>
        prev.map(n => n.notification_id === String(notificationId)
          ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  }, [user?.service_id]);

  const markAllRead = useCallback(async () => {
    if (!user?.service_id) return;
    try {
      await fetch(
        `${BASE_URL}/notifications/read-all?service_id=${user.service_id}`,
        { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'X-App-Source': 'web' } }
      );
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      prevUnreadRef.current = 0;
    } catch { /* silent */ }
  }, [user?.service_id]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      toasts,
      pushToast,
      dismissToast,
      markAllRead,
      markRead,
      refresh: fetchNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}