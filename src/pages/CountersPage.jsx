import { useState } from 'react';
import DashLayout from '../components/DashboardLayout';
import '../styles/counters.css';

// =============================================================
// COUNTER PAGE
// Layout hierarchy:
//   1. STATS ROW    — live numbers at a glance
//   2. NOW SERVING  — hero card, visually dominant
//   3. UP NEXT      — highlighted next-in-line card
//   4. QUEUE ORDER  — numbered list, shows wait order clearly
//   5. SUSPENDED    — separate section at bottom
// OOP Principle: Encapsulation, Single Responsibility
// =============================================================

const INITIAL_TICKETS = [
  { id: 'T001', code: 'GEN-047', queue: 'General Service',   priority: 'normal', status: 'serving',   waitMins: 3,  issuedAt: '09:14', position: 0  },
  { id: 'T002', code: 'GEN-048', queue: 'General Service',   priority: 'high',   status: 'waiting',   waitMins: 8,  issuedAt: '09:17', position: 1  },
  { id: 'T003', code: 'VIP-012', queue: 'VIP Service',       priority: 'urgent', status: 'waiting',   waitMins: 12, issuedAt: '09:05', position: 2  },
  { id: 'T004', code: 'GEN-049', queue: 'General Service',   priority: 'normal', status: 'waiting',   waitMins: 18, issuedAt: '09:20', position: 3  },
  { id: 'T005', code: 'TECH-003',queue: 'Technical Support', priority: 'high',   status: 'waiting',   waitMins: 25, issuedAt: '09:10', position: 4  },
  { id: 'T006', code: 'GEN-050', queue: 'General Service',   priority: 'normal', status: 'waiting',   waitMins: 30, issuedAt: '09:22', position: 5  },
  { id: 'T007', code: 'GEN-051', queue: 'General Service',   priority: 'normal', status: 'waiting',   waitMins: 36, issuedAt: '09:25', position: 6  },
  { id: 'T008', code: 'VIP-013', queue: 'VIP Service',       priority: 'urgent', status: 'suspended', waitMins: 22, issuedAt: '09:02', position: null },
  { id: 'T009', code: 'TECH-004',queue: 'Technical Support', priority: 'normal', status: 'suspended', waitMins: 45, issuedAt: '08:55', position: null },
];

const PRIORITY_META = {
  normal: { label: 'Normal', color: '#888',    bg: 'rgba(136,136,136,0.12)' },
  high:   { label: 'High',   color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  urgent: { label: 'Urgent', color: '#DC0F0F', bg: 'rgba(220,15,15,0.12)'   },
};

export default function CounterPage() {
  const [tickets,    setTickets]    = useState(INITIAL_TICKETS);
  const [confirmId,  setConfirmId]  = useState(null);
  const [confirmAct, setConfirmAct] = useState(null);

  const serving   = tickets.find(t => t.status === 'serving') ?? null;
  const waiting   = tickets.filter(t => t.status === 'waiting').sort((a, b) => a.position - b.position);
  const upNext    = waiting[0] ?? null;
  const inQueue   = waiting.slice(1);
  const suspended = tickets.filter(t => t.status === 'suspended');

  const reIndex = (list) =>
    list.map((t, i) => t.status === 'waiting' ? { ...t, position: i } : t);

  const handleTerminate = (id) => {
    setTickets(prev => {
      const without  = prev.filter(t => t.id !== id);
      const firstWait = without.find(t => t.status === 'waiting');
      const promoted  = without.map(t =>
        t.id === firstWait?.id ? { ...t, status: 'serving', position: 0 } : t
      );
      return reIndex(promoted);
    });
    setConfirmId(null);
  };

  const handleSuspend = (id) => {
    setTickets(prev => {
      const updated = prev.map(t =>
        t.id === id ? { ...t, status: 'suspended', position: null } : t
      );
      return reIndex(updated);
    });
    setConfirmId(null);
  };

  const handleReactivate = (id) => {
    setTickets(prev => {
      const maxPos = Math.max(...prev.filter(t => t.status === 'waiting').map(t => t.position), -1);
      return prev.map(t => t.id === id ? { ...t, status: 'waiting', position: maxPos + 1 } : t);
    });
  };

  const handleCallNext = () => {
    if (!upNext) return;
    setTickets(prev => reIndex(
      prev.map(t => {
        if (t.status === 'serving') return null;
        if (t.id === upNext.id)    return { ...t, status: 'serving', position: 0 };
        return t;
      }).filter(Boolean)
    ));
  };

  const stats = [
    { label: 'Now Serving', val: serving ? serving.code : '—', col: '#22C55E' },
    { label: 'Up Next',     val: upNext  ? upNext.code  : '—', col: '#3B82F6' },
    { label: 'In Queue',    val: inQueue.length,                col: '#F59E0B' },
    { label: 'Suspended',   val: suspended.length,              col: '#888'    },
  ];

  return (
    <DashLayout title="Counter" subtitle="MANAGE">

      {/* STATS */}
      <div className="cp-stats">
        {stats.map(s => (
          <div key={s.label} className="cp-stat">
            <span className="cp-stat-val" style={{ color: s.col }}>{s.val}</span>
            <span className="cp-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── NOW SERVING HERO ── */}
      <section className="cp-section">
        <p className="cp-section-label">NOW SERVING</p>
        {serving ? (
          <div className="cp-hero-card">
            <div className="cp-hero-glow" />
            <div className="cp-hero-left">
              <div className="cp-hero-live">
                <span className="cp-live-dot" />
                LIVE
              </div>
              <p className="cp-hero-code">{serving.code}</p>
              <p className="cp-hero-queue">{serving.queue}</p>
              <div className="cp-hero-meta">
                <span className="cp-prio-badge"
                  style={{ color: PRIORITY_META[serving.priority].color, background: PRIORITY_META[serving.priority].bg }}>
                  {PRIORITY_META[serving.priority].label}
                </span>
                <span className="cp-meta-chip">⏱ {serving.waitMins}m in service</span>
                <span className="cp-meta-chip">🕐 {serving.issuedAt}</span>
              </div>
            </div>
            <div className="cp-hero-actions">
              <button className="cp-btn-suspend-hero"
                onClick={() => { setConfirmId(serving.id); setConfirmAct('suspend'); }}>
                ⏸ Suspend
              </button>
              <button className="cp-btn-terminate-hero"
                onClick={() => { setConfirmId(serving.id); setConfirmAct('terminate'); }}>
                ✓ Done — Call Next
              </button>
            </div>
          </div>
        ) : (
          <div className="cp-hero-empty">
            <span>🖥</span>
            <p>No ticket currently being served.</p>
            {upNext && (
              <button className="cp-btn-terminate-hero" onClick={handleCallNext}>
                Call {upNext.code}
              </button>
            )}
          </div>
        )}
      </section>

      {/* ── UP NEXT ── */}
      {upNext && (
        <section className="cp-section">
          <p className="cp-section-label">UP NEXT</p>
          <div className="cp-next-card">
            <div className="cp-next-position">1</div>
            <div className="cp-next-info">
              <p className="cp-next-code">{upNext.code}</p>
              <p className="cp-next-queue">{upNext.queue}</p>
            </div>
            <div className="cp-next-badges">
              <span className="cp-prio-badge"
                style={{ color: PRIORITY_META[upNext.priority].color, background: PRIORITY_META[upNext.priority].bg }}>
                {PRIORITY_META[upNext.priority].label}
              </span>
              <span className="cp-meta-chip">~{upNext.waitMins}m wait</span>
            </div>
            <button className="cp-btn-call-now" onClick={handleCallNext}>
              Call Now
            </button>
          </div>
        </section>
      )}

      {/* ── QUEUE ORDER ── */}
      {inQueue.length > 0 && (
        <section className="cp-section">
          <p className="cp-section-label">QUEUE ORDER — {inQueue.length} waiting</p>
          <div className="cp-queue-order">
            {inQueue.map((t, i) => {
              const pm = PRIORITY_META[t.priority];
              const isLast = i === inQueue.length - 1;
              return (
                <div key={t.id} className="cp-order-row">
                  {/* Timeline column */}
                  <div className="cp-order-timeline">
                    <div className="cp-order-num">{i + 2}</div>
                    {!isLast && <div className="cp-order-connector" />}
                  </div>

                  {/* Card */}
                  <div className={`cp-order-card ${pm.label === 'Urgent' ? 'cp-order-card--urgent' : ''}`}>
                    <div className="cp-order-card-left">
                      <span className="cp-order-code">{t.code}</span>
                      <span className="cp-order-queue">{t.queue}</span>
                    </div>
                    <div className="cp-order-card-right">
                      <span className="cp-prio-badge"
                        style={{ color: pm.color, background: pm.bg }}>
                        {pm.label}
                      </span>
                      <span className="cp-meta-chip">~{t.waitMins}m</span>
                      <span className="cp-meta-chip">🕐 {t.issuedAt}</span>
                      <button className="cp-row-suspend-btn"
                        title="Suspend this ticket"
                        onClick={() => { setConfirmId(t.id); setConfirmAct('suspend'); }}>
                        ⏸
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── SUSPENDED ── */}
      {suspended.length > 0 && (
        <section className="cp-section">
          <p className="cp-section-label">SUSPENDED — {suspended.length} paused</p>
          <div className="cp-suspended-list">
            {suspended.map(t => {
              const pm = PRIORITY_META[t.priority];
              return (
                <div key={t.id} className="cp-suspended-card">
                  <div className="cp-sus-left">
                    <span className="cp-suspended-code">{t.code}</span>
                    <span className="cp-sus-queue">{t.queue}</span>
                    <span className="cp-prio-badge"
                      style={{ color: pm.color, background: pm.bg }}>
                      {pm.label}
                    </span>
                  </div>
                  <button className="cp-btn-reactivate" onClick={() => handleReactivate(t.id)}>
                    ▶ Reactivate
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* CONFIRM MODAL */}
      {confirmId && (
        <div className="cp-overlay" onClick={() => setConfirmId(null)}>
          <div className="cp-modal" onClick={e => e.stopPropagation()}>
            <p className="cp-modal-icon">{confirmAct === 'terminate' ? '✓' : '⏸'}</p>
            <h2 className="cp-modal-title">
              {confirmAct === 'terminate' ? 'Mark as Done?' : 'Suspend Ticket?'}
            </h2>
            <p className="cp-modal-sub">
              {confirmAct === 'terminate'
                ? 'This ticket will be marked served and the next customer will be called automatically.'
                : "The ticket will be paused and can be reactivated from the Suspended section."}
            </p>
            <div className="cp-modal-actions">
              <button className="cp-btn-ghost" onClick={() => setConfirmId(null)}>Cancel</button>
              <button
                className={confirmAct === 'terminate' ? 'cp-btn-terminate-hero' : 'cp-btn-suspend-hero'}
                style={{ flex: 1 }}
                onClick={() => confirmAct === 'terminate'
                  ? handleTerminate(confirmId)
                  : handleSuspend(confirmId)}>
                {confirmAct === 'terminate' ? 'Yes, done' : 'Yes, suspend'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashLayout>
  );
}