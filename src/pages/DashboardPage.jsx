import { useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import '../styles/dashboard.css';

// =============================================================
// DASHBOARD PAGE
// OOP Principle: Single Responsibility, Encapsulation
// All session logic delegated to useSession hook
// =============================================================
export default function DashboardPage() {
  const { user, logout } = useSession();
  const navigate = useNavigate();

  if (!user) return null;

  const getInitials = (name = '') => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (name[0] || '?').toUpperCase();
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const stats = [
    { label: 'Active Queues',  value: '0', icon: '📋', color: '#DC0F0F' },
    { label: 'Tickets Today',  value: '0', icon: '🎟',  color: '#3B82F6' },
    { label: 'Team Members',   value: '1', icon: '👥',  color: '#22C55E' },
    { label: 'Avg. Wait Time', value: '—', icon: '⏱',  color: '#F59E0B' },
  ];

  // 'path' is set for modules that are ready; absent = coming soon
  const modules = [
    { icon: '📋', title: 'Queue Manager',  desc: 'Create and manage service queues',   path: '/queue-management' },
    { icon: '🎟', title: 'Tickets',         desc: 'Monitor and call active tickets'    },
    { icon: '👥', title: 'Team',            desc: 'Invite managers and agents'         },
    { icon: '🖥', title: 'Counter Display', desc: 'Live board for counter screens'     },
    { icon: '📊', title: 'Analytics',       desc: 'Queue performance & reports'        },
    { icon: '⚙️', title: 'Settings',        desc: 'Service config & preferences'       },
  ];

  // Sidebar nav items — 'path' marks live items
  const navItems = [
    { icon: '🏠', label: 'Dashboard',     path: '/dashboard'         },
    { icon: '📋', label: 'Queue Manager', path: '/queue-management'  },
    { icon: '🎟', label: 'Tickets'                                   },
    { icon: '👥', label: 'Team'                                      },
    { icon: '📊', label: 'Analytics'                                 },
    { icon: '⚙️', label: 'Settings'                                  },
  ];

  return (
    <div className="dash-root">
      <div className="dash-glow-tl" />

      {/* ── SIDEBAR ── */}
      <aside className="dash-sidebar">
        <div className="db-brand">
          <span>🎟</span>
          <span className="db-brand-name">TICKETY</span>
        </div>

        <nav className="db-nav">
          {navItems.map(item => {
            const isActive  = window.location.pathname === item.path;
            const isEnabled = !!item.path;

            return (
              <div
                key={item.label}
                className={`db-nav-item ${isActive ? 'active' : ''} ${!isEnabled ? 'disabled' : ''}`}
                onClick={() => isEnabled && navigate(item.path)}
                style={{ cursor: isEnabled ? 'pointer' : 'default' }}
              >
                {!isEnabled && <span className="db-nav-soon">SOON</span>}
                <span>{item.icon}</span>
                {item.label}
              </div>
            );
          })}
        </nav>

        <div className="db-sidebar-footer">
          <div className="db-user-row">
            <div className="db-avatar">{getInitials(user.username)}</div>
            <div className="db-user-info">
              <p className="db-user-name">{user.username}</p>
              <p className="db-user-role">👑 Owner</p>
            </div>
          </div>
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
        <header className="dash-topbar">
          <div>
            <p className="dash-greeting">{getGreeting()},</p>
            <h1 className="dash-username">{user.username}</h1>
          </div>
          <div className="dash-topbar-right">
            {user.service_name && (
              <div className="dash-service-badge">🏢 {user.service_name}</div>
            )}
            <div className="dash-status-badge">
              <span className="dash-status-dot" />
              System Online
            </div>
          </div>
        </header>

        <div className="dash-welcome-banner">
          <div className="dwb-left">
            <p className="dwb-tag">✅ ACCOUNT VERIFIED</p>
            <h2 className="dwb-title">
              {user.service_name
                ? `${user.service_name} is ready to launch.`
                : 'Your admin account is active.'}
            </h2>
            <p className="dwb-sub">
              This is your crash-test dashboard. Full features are coming soon.
              You're set up as <strong>Owner / Boss</strong> of this service.
            </p>
          </div>
          <div className="dwb-icon">🚀</div>
        </div>

        <div className="dash-stats">
          {stats.map(s => (
            <div key={s.label} className="stat-card">
              <div className="sc-icon" style={{ background: s.color + '18', color: s.color }}>
                {s.icon}
              </div>
              <div className="sc-val">{s.value}</div>
              <div className="sc-label">{s.label}</div>
            </div>
          ))}
        </div>

        <h2 className="dash-section-title">MODULES</h2>
        <div className="dash-modules">
          {modules.map(m => {
            const isLive = !!m.path;
            return (
              <div
                key={m.title}
                className={`module-card ${isLive ? 'mc-live' : ''}`}
                onClick={() => isLive && navigate(m.path)}
                style={{ cursor: isLive ? 'pointer' : 'default' }}
              >
                <div className="mc-top">
                  <span className="mc-icon">{m.icon}</span>
                  {isLive
                    ? <span className="mc-tag mc-tag-live">OPEN →</span>
                    : <span className="mc-tag">SOON</span>
                  }
                </div>
                <p className="mc-title">{m.title}</p>
                <p className="mc-desc">{m.desc}</p>
              </div>
            );
          })}
        </div>

        <p className="dash-footer">TICKETY v1.0.0 — Smart Queue Management System</p>
      </main>
    </div>
  );
}
