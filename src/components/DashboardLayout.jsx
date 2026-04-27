import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import '../styles/dashboard.css';

// =============================================================
// DASH LAYOUT
// Responsibilities:
//   - Render the persistent sidebar + page shell for all
//     dashboard pages
//   - Highlight the active nav item based on current route
// OOP Principle: Abstraction, Single Responsibility, Reusability
//   (mirrors AuthPage abstract base from Flutter)
// =============================================================

const NAV_ITEMS = [
  { icon: '🏠',  label: 'Dashboard',      path: '/dashboard' },
  { icon: '🎟',  label: 'Queue & Tickets', path: '/queues'    },
  { icon: '🖥',  label: 'Counter',         path: '/counter'   },
  { icon: '👥',  label: 'Team',            path: '/team'      },
  { icon: '📊',  label: 'Analytics',       path: '/analytics' },
  { icon: '⚙️', label: 'Settings',         path: '/settings'  },
];

export default function DashLayout({ children, title, subtitle }) {
  const navigate           = useNavigate();
  const location           = useLocation();
  const { user, logout }   = useSession();

  const getInitials = (name = '') => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (name[0] || '?').toUpperCase();
  };

  const roleLabel =
    user?.admin_role === 'boss'    ? '👑 Owner'   :
    user?.admin_role === 'manager' ? '🎛 Manager' : '🪟 Agent';

  return (
    <div className="dash-root">
      <div className="dash-glow-tl" />

      {/* ── SIDEBAR ── */}
      <aside className="dash-sidebar">
        <div className="db-brand" onClick={() => navigate('/dashboard')}>
          <span>🎟</span>
          <span className="db-brand-name">TICKETY</span>
        </div>

        <nav className="db-nav">
          {NAV_ITEMS.map(item => (
            <div key={item.path}
              className={`db-nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}>
              <span className="db-nav-icon">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>

        <div className="db-sidebar-footer">
          {user && (
            <div className="db-user-row">
              <div className="db-avatar">{getInitials(user.username)}</div>
              <div className="db-user-info">
                <p className="db-user-name">{user.username}</p>
                <p className="db-user-role">{roleLabel}</p>
              </div>
            </div>
          )}
          <button className="db-logout" onClick={logout}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="dash-main">
        {(title || subtitle) && (
          <header className="page-header">
            <div>
              {subtitle && <p className="page-subtitle">{subtitle}</p>}
              {title   && <h1 className="page-title">{title}</h1>}
            </div>
            {user?.service_name && (
              <div className="dash-service-badge">🏢 {user.service_name}</div>
            )}
          </header>
        )}
        {children}
      </main>
    </div>
  );
}