import { useNavigate } from 'react-router-dom';
import DashLayout    from '../components/DashboardLayout';
import { useSession } from '../hooks/useSession';
import '../styles/dashboard.css';

// =============================================================
// DASHBOARD PAGE  — Home / overview
// OOP Principle: Single Responsibility, Encapsulation
// =============================================================

const MODULES = [
  {
    icon: '🎟', title: 'Queue & Tickets', path: '/queues',
    desc: 'Create queues, issue tickets, set priorities and manage the full flow',
    tags: ['Queues', 'Tickets', 'Priorities', 'Swap'],
    featured: true,
  },
  {
    icon: '🖥', title: 'Counter', path: '/counter',
    desc: 'View tickets at your counter, terminate or suspend them',
    tags: ['Terminate', 'Suspend'],
  },
  {
    icon: '👥', title: 'Team', path: '/team',
    desc: 'Manage admins, generate invite links and assign roles',
    tags: ['Managers', 'Agents'],
  },
  {
    icon: '📊', title: 'Analytics', path: '/analytics',
    desc: 'Average tickets per day, priority rankings and wait times',
    tags: ['Reports', 'Stats'],
  },
  {
    icon: '⚙️', title: 'Settings', path: '/settings',
    desc: 'Profile, theme preferences and account actions',
    tags: ['Profile', 'Theme'],
  },
];

export default function DashboardPage() {
  const navigate         = useNavigate();
  const { user, logout } = useSession();

  if (!user) return null;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getInitials = (name = '') => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (name[0] || '?').toUpperCase();
  };

  const stats = [
    { label: 'Active Queues',  value: '0', icon: '🎟', color: '#DC0F0F' },
    { label: 'Tickets Today',  value: '0', icon: '🪙',  color: '#3B82F6' },
    { label: 'Team Members',   value: '1', icon: '👥',  color: '#22C55E' },
    { label: 'Avg. Wait Time', value: '—', icon: '⏱',  color: '#F59E0B' },
  ];

  return (
    <DashLayout>
      {/* ── TOPBAR ── */}
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

      {/* ── WELCOME BANNER ── */}
      <div className="dash-welcome-banner">
        <div className="dwb-left">
          <p className="dwb-tag">✅ ACCOUNT VERIFIED</p>
          <h2 className="dwb-title">
            {user.service_name
              ? `${user.service_name} is ready.`
              : 'Your admin account is active.'}
          </h2>
          <p className="dwb-sub">
            Welcome to your TICKETY dashboard. Navigate the modules below to
            manage your queues, team and analytics. You are set up as{' '}
            <strong>Owner / Boss</strong> — full control is yours.
          </p>
        </div>
        <div className="dwb-icon">🚀</div>
      </div>

      {/* ── STATS ── */}
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

      {/* ── MODULES ── */}
      <h2 className="dash-section-title">MODULES</h2>
      <div className="dash-modules">
        {MODULES.map(m => (
          <div key={m.title}
            className={`module-card ${m.featured ? 'module-card--featured' : ''}`}
            onClick={() => navigate(m.path)}
            style={{ cursor: 'pointer' }}>
            <div className="mc-top">
              <span className="mc-icon">{m.icon}</span>
              <svg className="mc-arrow" width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
            <p className="mc-title">{m.title}</p>
            <p className="mc-desc">{m.desc}</p>
            <div className="mc-tags">
              {m.tags.map(t => <span key={t} className="mc-pill">{t}</span>)}
            </div>
          </div>
        ))}
      </div>

      <p className="dash-footer">TICKETY v1.0.0 — Smart Queue Management System</p>
    </DashLayout>
  );
}