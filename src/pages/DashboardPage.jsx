import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { AppContext } from '../contexts/AppContext';
import '../styles/dashboard.css';

export default function DashboardPage() {
  const { user, logout } = useSession();
  const navigate = useNavigate();
  const { queues, tickets } = useContext(AppContext);

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

  // Real stats from live data
  const today = new Date().toDateString();
  const ticketsToday  = tickets.filter(t => new Date(t.created_at).toDateString() === today);
  const activeTickets = tickets.filter(t => t.status === 'active');
  const activeQueues  = queues.length;

  // Average wait — use estimated_minutes if available
  const withWait = tickets.filter(t => t.estimated_minutes > 0);
  const avgWait  = withWait.length
    ? Math.round(withWait.reduce((s, t) => s + t.estimated_minutes, 0) / withWait.length)
    : null;

  const stats = [
    { label: 'Active Queues',  value: activeQueues,                      icon: '📋', color: '#DC0F0F' },
    { label: 'Tickets Today',  value: ticketsToday.length,               icon: '🎟',  color: '#3B82F6' },
    { label: 'Active Tickets', value: activeTickets.length,              icon: '✅',  color: '#22C55E' },
    { label: 'Avg. Wait Time', value: avgWait ? `${avgWait}m` : '—',    icon: '⏱',  color: '#F59E0B' },
  ];

  // Recent tickets — last 10, sorted newest first
  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10);

  // Services that have at least one ticket
  const servicesWithTickets = [...new Map(
    tickets.map(t => [t.service_name || t.service_id, t])
  ).values()];

  const statusColor = (s) =>
    s === 'active'    ? '#22C55E'
    : s === 'suspended' ? '#F59E0B'
    : '#DC0F0F';

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
          <div className="db-nav-item active"><span>🏠</span> Dashboard</div>
          <div className="db-nav-item" onClick={() => navigate('/queues')} style={{ cursor: 'pointer' }}>
            <span>📋</span> Queue Manager
          </div>
          {['Tickets', 'Team', 'Analytics', 'Settings'].map(item => (
            <div key={item} className="db-nav-item disabled">
              <span className="db-nav-soon">SOON</span>{item}
            </div>
          ))}
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

        {/* Stats */}
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

        {/* Recent Tickets */}
        <h2 className="dash-section-title">RECENT TICKETS</h2>
        {recentTickets.length === 0 ? (
          <div className="dash-empty-block">
            <span>🎟</span>
            <p>No tickets yet. Customers will appear here once they join a queue.</p>
          </div>
        ) : (
          <div className="dash-ticket-list">
            {recentTickets.map((t, i) => (
              <div key={t.id ?? i} className="dash-ticket-row">
                <div className="dtr-left">
                  <span className="dtr-num">{t.ticket_number ?? `#${i + 1}`}</span>
                  <div className="dtr-info">
                    <span className="dtr-name">{t.customer_identifier ?? t.customer ?? '—'}</span>
                    <span className="dtr-queue">{t.queue_name ?? t.service_name ?? '—'}</span>
                  </div>
                </div>
                <div className="dtr-right">
                  <span className="dtr-status" style={{ color: statusColor(t.status), background: statusColor(t.status) + '18' }}>
                    {(t.status ?? 'active').toUpperCase()}
                  </span>
                  <span className="dtr-time">
                    {t.created_at ? new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Services with tickets */}
        {servicesWithTickets.length > 0 && (
          <>
            <h2 className="dash-section-title" style={{ marginTop: '32px' }}>ACTIVE SERVICES</h2>
            <div className="dash-modules">
              {servicesWithTickets.map((t, i) => (
                <div key={i} className="module-card">
                  <div className="mc-top">
                    <span className="mc-icon">🏢</span>
                    <span className="mc-tag" style={{ background: '#22C55E18', color: '#22C55E' }}>LIVE</span>
                  </div>
                  <p className="mc-title">{t.service_name ?? `Service ${t.service_id}`}</p>
                  <p className="mc-desc">
                    {tickets.filter(tk => (tk.service_name || tk.service_id) === (t.service_name || t.service_id)).length} ticket(s) issued
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        <p className="dash-footer">TICKETY v1.0.0 — Smart Queue Management System</p>
      </main>
    </div>
  );
}