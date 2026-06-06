import { useNotifications } from '../context/NotificationContext';
import '../styles/toast.css';

// =============================================================
// TOAST CONTAINER
// Renders up to 3 stacked toasts in the bottom-right corner.
// Each toast auto-dismisses after 4s or on click.
// =============================================================

const TYPE_META = {
  queue_created:        { icon: '🎟', color: '#22C55E' },
  queue_deleted:        { icon: '🗑', color: '#DC0F0F' },
  queue_empty:          { icon: '✅', color: '#22C55E' },
  ticket_issued:        { icon: '🎫', color: '#3B82F6' },
  ticket_printed:       { icon: '🖨', color: '#F59E0B' },
  ticket_served:        { icon: '✓',  color: '#22C55E' },
  ticket_carried_over:  { icon: '📅', color: '#8B5CF6' },
  team_joined:          { icon: '👥', color: '#3B82F6' },
  member_removed:       { icon: '👤', color: '#DC0F0F' },
  invite_generated:     { icon: '🔗', color: '#F59E0B' },
  closing_warning:      { icon: '⏰', color: '#F59E0B' },
  // local-only toasts
  success:              { icon: '✓',  color: '#22C55E' },
  error:                { icon: '⚠',  color: '#DC0F0F' },
  info:                 { icon: 'ℹ',  color: '#3B82F6' },
  new_queue_available:  { icon: '🔔', color: '#F59E0B' },
};

export default function ToastContainer() {
  const { toasts, dismissToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => {
        const meta  = TYPE_META[toast.type] || TYPE_META.info;
        return (
          <div
            key={toast.id}
            className="toast-item"
            style={{ '--toast-color': meta.color }}
            onClick={() => dismissToast(toast.id)}
          >
            <div className="toast-accent" />
            <span className="toast-icon">{meta.icon}</span>
            <div className="toast-body">
              <p className="toast-title">{toast.title}</p>
              {toast.body && <p className="toast-desc">{toast.body}</p>}
            </div>
            <button className="toast-close" onClick={e => { e.stopPropagation(); dismissToast(toast.id); }}>
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}