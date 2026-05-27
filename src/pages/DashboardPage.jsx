import { useState, useEffect } from 'react';
import { useNavigate }  from 'react-router-dom';
import DashLayout       from '../components/DashboardLayout';
import { useSession }   from '../hooks/useSession';
import { getQueues, getScheduleStatus } from '../services/api.service';
import '../styles/dashboard.css';

// =============================================================
// DASHBOARD PAGE — dynamic
// Loads: queue stats, schedule open/closed status,
//        closing time warning popup
// =============================================================

const MODULES = [
  { icon: '🎟', title: 'Queue & Tickets', path: '/queues',    desc: 'Create queues, issue tickets, set priorities and manage the full flow',    tags: ['Queues','Tickets','Priorities','Swap'], featured: true },
  { icon: '🖥', title: 'Counter',          path: '/counter',   desc: 'View tickets at your counter, terminate or suspend them',                    tags: ['Terminate','Suspend'] },
  { icon: '👥', title: 'Team',             path: '/team',      desc: 'Manage admins, generate invite links and assign roles',                      tags: ['Managers','Agents'] },
  { icon: '📊', title: 'Analytics',        path: '/analytics', desc: 'Average tickets per day, priority rankings and wait times',                  tags: ['Reports','Stats'] },
  { icon: '⚙️',title: 'Settings',          path: '/settings',  desc: 'Profile, theme preferences, schedule and account actions',                   tags: ['Profile','Schedule'] },
];

export default function DashboardPage() {
  const navigate         = useNavigate();
  const { user, logout } = useSession();

  const [stats,        setStats]        = useState({ queues: 0, tickets: 0, team: 1, avgWait: '—' });
  const [schedStatus,  setSchedStatus]  = useState(null);
  const [showWarning,  setShowWarning]  = useState(false);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    if (user?.service_id) loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [queuesData, schedData] = await Promise.all([
        getQueues({ serviceId: user.service_id }),
        getScheduleStatus({ serviceId: user.service_id }),
      ]);

      if (queuesData.success) {
        const queues       = queuesData.queues || [];
        const totalActive  = queues.reduce((a, q) => a + (q.active  || 0), 0);
        const totalPending = queues.reduce((a, q) => a + (q.pending || 0), 0);
        setStats(prev => ({
          ...prev,
          queues:  queues.length,
          tickets: totalActive + totalPending,
        }));
      }

      if (schedData.success) {
        setSchedStatus(schedData);
        // Show closing warning popup if backend flags it
        if (schedData.closing_warning?.warning) {
          setShowWarning(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

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

  const displayStats = [
    { label: 'Active Queues',  value: loading ? '…' : stats.queues,  icon: '🎟', color: '#DC0F0F' },
    { label: 'Tickets Today',  value: loading ? '…' : stats.tickets, icon: '🪙',  color: '#3B82F6' },
    { label: 'Team Members',   value: loading ? '…' : stats.team,    icon: '👥',  color: '#22C55E' },
    { label: 'Avg. Wait Time', value: loading ? '…' : stats.avgWait, icon: '⏱',  color: '#F59E0B' },
  ];

  return (
    <DashLayout>

      {/* ── CLOSING TIME WARNING POPUP ── */}
      {showWarning && schedStatus?.closing_warning && (
        <div className="dash-warning-overlay" onClick={() => setShowWarning(false)}>
          <div className="dash-warning-modal" onClick={e => e.stopPropagation()}>
            <div className="dwm-icon">⏰</div>
            <h2 className="dwm-title">Closing Time Approaching</h2>
            <p className="dwm-time">{schedStatus.closing_time}</p>
            <p className="dwm-body">
              <strong>{schedStatus.closing_warning.affected_count}</strong> ticket
              {schedStatus.closing_warning.affected_count !== 1 ? 's' : ''} in the queue
              exceed{schedStatus.closing_warning.affected_count === 1 ? 's' : ''} today's
              closing time and will be carried over to the next working day.
            </p>
            <p className="dwm-sub">
              Carried-over customers keep their position and will be served first tomorrow.
            </p>
            <button className="dwm-btn" onClick={() => setShowWarning(false)}>
              Got it
            </button>
          </div>
        </div>
      )}

      {/* TOP BAR */}
      <header className="dash-topbar">
        <div>
          <p className="dash-greeting">{getGreeting()},</p>
          <h1 className="dash-username">{user.username}</h1>
        </div>
        <div className="dash-topbar-right">
          {user.service_name && (
            <div className="dash-service-badge">🏢 {user.service_name}</div>
          )}
          {/* Open/Closed status badge */}
          {schedStatus ? (
            <div className={`dash-status-badge ${schedStatus.is_open ? '' : 'dash-status-badge--closed'}`}>
              <span className={`dash-status-dot ${schedStatus.is_open ? '' : 'dash-status-dot--closed'}`} />
              {schedStatus.is_open
                ? `Open · closes ${schedStatus.closing_time}`
                : 'Closed'}
            </div>
          ) : (
            <div className="dash-status-badge">
              <span className="dash-status-dot" />
              System Online
            </div>
          )}
        </div>
      </header>

      {/* WELCOME BANNER */}
      <div className="dash-welcome-banner">
        <div className="dwb-left">
          <p className="dwb-tag">✅ ACCOUNT VERIFIED</p>
          <h2 className="dwb-title">
            {user.service_name ? `${user.service_name} is ready.` : 'Your admin account is active.'}
          </h2>
          <p className="dwb-sub">
            Welcome to your TICKETY dashboard. You are set up as{' '}
            <strong>Owner / Boss</strong> — full control is yours.
          </p>
        </div>
        <div className="dwb-icon">🚀</div>
      </div>

      {/* STATS */}
      <div className="dash-stats">
        {displayStats.map(s => (
          <div key={s.label} className="stat-card">
            <div className="sc-icon" style={{ background: s.color + '18', color: s.color }}>
              {s.icon}
            </div>
            <div className="sc-val">{s.value}</div>
            <div className="sc-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* MODULES */}
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