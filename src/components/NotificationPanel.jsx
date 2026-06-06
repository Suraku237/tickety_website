import { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import '../styles/notifications.css';

// =============================================================
// NOTIFICATION PANEL
// Bell icon with unread badge → click opens slide-in panel.
// Shows full notification history, mark all read button.
// =============================================================

const TYPE_META = {
  queue_created:       { icon: '🎟', color: '#22C55E' },
  queue_deleted:       { icon: '🗑', color: '#DC0F0F' },
  queue_empty:         { icon: '✅', color: '#22C55E' },
  ticket_issued:       { icon: '🎫', color: '#3B82F6' },
  ticket_printed:      { icon: '🖨', color: '#F59E0B' },
  ticket_served:       { icon: '✓',  color: '#22C55E' },
  ticket_carried_over: { icon: '📅', color: '#8B5CF6' },
  team_joined:         { icon: '👥', color: '#3B82F6' },
  member_removed:      { icon: '👤', color: '#DC0F0F' },
  invite_generated:    { icon: '🔗', color: '#F59E0B' },
  closing_warning:     { icon: '⏰', color: '#F59E0B' },
};

function timeAgo(isoString) {
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
  if (diff < 60)          return 'just now';
  if (diff < 3600)        return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)       return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleMarkAll = () => {
    markAllRead();
  };

  const handleClickNotif = (n) => {
    if (!n.read) markRead(n.notification_id);
  };

  return (
    <>
      {/* BELL BUTTON */}
      <button className="notif-bell" onClick={handleOpen} aria-label="Notifications">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {/* OVERLAY */}
      {open && (
        <div className="notif-overlay" onClick={handleClose} />
      )}

      {/* PANEL */}
      <div className={`notif-panel ${open ? 'open' : ''}`}>
        <div className="notif-panel-header">
          <div>
            <h2 className="notif-panel-title">Notifications</h2>
            {unreadCount > 0 && (
              <span className="notif-unread-label">{unreadCount} unread</span>
            )}
          </div>
          <div className="notif-panel-actions">
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={handleMarkAll}>
                Mark all read
              </button>
            )}
            <button className="notif-close-btn" onClick={handleClose}>✕</button>
          </div>
        </div>

        <div className="notif-list">
          {notifications.length === 0 ? (
            <div className="notif-empty">
              <span>🔔</span>
              <p>No notifications yet.</p>
            </div>
          ) : (
            notifications.map(n => {
              const meta = TYPE_META[n.type] || { icon: 'ℹ', color: '#3B82F6' };
              return (
                <div
                  key={n.notification_id}
                  className={`notif-item ${n.read ? '' : 'unread'}`}
                  onClick={() => handleClickNotif(n)}
                >
                  <div className="notif-item-icon"
                    style={{ background: meta.color + '18', color: meta.color }}>
                    {meta.icon}
                  </div>
                  <div className="notif-item-body">
                    <p className="notif-item-title">{n.title}</p>
                    {n.body && <p className="notif-item-desc">{n.body}</p>}
                    <p className="notif-item-time">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read && <span className="notif-dot" />}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}