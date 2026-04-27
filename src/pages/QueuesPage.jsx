import { useState } from 'react';
import DashLayout from '../components/DashboardLayout';
import '../styles/queues.css';

// =============================================================
// QUEUES & TICKETS PAGE
// Features:
//   - View all queues with ticket counts
//   - Create queue (generates QR + code)
//   - Delete queue
//   - View all tickets (active + pending) with filters
//   - Per-ticket: swap position, set priority, delete
// OOP Principle: Encapsulation, Single Responsibility
// =============================================================

const MOCK_QUEUES = [
  { id: 'Q1', name: 'General Service',    code: 'GEN-01',  active: 3, pending: 8, color: '#DC0F0F' },
  { id: 'Q2', name: 'VIP Service',        code: 'VIP-01',  active: 1, pending: 2, color: '#3B82F6' },
  { id: 'Q3', name: 'Technical Support',  code: 'TECH-01', active: 0, pending: 5, color: '#F59E0B' },
];

const MOCK_TICKETS = {
  Q1: [
    { id: 'T001', code: 'GEN-047', status: 'active',  priority: 'normal', counter: 'A',   issuedAt: '09:14' },
    { id: 'T002', code: 'GEN-048', status: 'active',  priority: 'high',   counter: 'B',   issuedAt: '09:17' },
    { id: 'T003', code: 'GEN-049', status: 'active',  priority: 'normal', counter: 'A',   issuedAt: '09:20' },
    { id: 'T004', code: 'GEN-050', status: 'pending', priority: 'urgent', counter: '—',   issuedAt: '09:22' },
    { id: 'T005', code: 'GEN-051', status: 'pending', priority: 'normal', counter: '—',   issuedAt: '09:25' },
    { id: 'T006', code: 'GEN-052', status: 'pending', priority: 'high',   counter: '—',   issuedAt: '09:28' },
  ],
  Q2: [
    { id: 'T010', code: 'VIP-012', status: 'active',  priority: 'urgent', counter: 'VIP', issuedAt: '09:05' },
    { id: 'T011', code: 'VIP-013', status: 'pending', priority: 'high',   counter: '—',   issuedAt: '09:30' },
  ],
  Q3: [
    { id: 'T020', code: 'TECH-003', status: 'pending', priority: 'normal', counter: '—', issuedAt: '09:10' },
    { id: 'T021', code: 'TECH-004', status: 'pending', priority: 'high',   counter: '—', issuedAt: '09:15' },
    { id: 'T022', code: 'TECH-005', status: 'pending', priority: 'normal', counter: '—', issuedAt: '09:18' },
    { id: 'T023', code: 'TECH-006', status: 'pending', priority: 'urgent', counter: '—', issuedAt: '09:21' },
    { id: 'T024', code: 'TECH-007', status: 'pending', priority: 'normal', counter: '—', issuedAt: '09:24' },
  ],
};

const PRIORITIES = ['normal', 'high', 'urgent'];
const PRIORITY_META = {
  normal: { label: 'Normal', color: '#666',    bg: 'rgba(102,102,102,0.12)' },
  high:   { label: 'High',   color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  urgent: { label: 'Urgent', color: '#DC0F0F', bg: 'rgba(220,15,15,0.12)'   },
};

export default function QueuesPage() {
  const [queues,       setQueues]       = useState(MOCK_QUEUES);
  const [tickets,      setTickets]      = useState(MOCK_TICKETS);
  const [activeQueue,  setActiveQueue]  = useState('Q1');
  const [showCreate,   setShowCreate]   = useState(false);
  const [newName,      setNewName]      = useState('');
  const [newCode,      setNewCode]      = useState('');
  const [showQR,       setShowQR]       = useState(null);
  const [ticketMenu,   setTicketMenu]   = useState(null);
  const [swapTarget,   setSwapTarget]   = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPrio,   setFilterPrio]   = useState('all');

  const currentTickets = (tickets[activeQueue] || []).filter(t => {
    const statusOk = filterStatus === 'all' || t.status === filterStatus;
    const prioOk   = filterPrio   === 'all' || t.priority === filterPrio;
    return statusOk && prioOk;
  });

  const handleCreateQueue = () => {
    if (!newName.trim()) return;
    const id    = 'Q' + Date.now();
    const code  = newCode.trim() || newName.trim().slice(0, 4).toUpperCase() + '-01';
    const colors = ['#22C55E', '#8B5CF6', '#EC4899', '#06B6D4'];
    setQueues(q => [...q, { id, name: newName.trim(), code, active: 0, pending: 0, color: colors[queues.length % colors.length] }]);
    setTickets(t => ({ ...t, [id]: [] }));
    setNewName(''); setNewCode(''); setShowCreate(false);
    setActiveQueue(id);
  };

  const handleDeleteQueue = (qid) => {
    const remaining = queues.filter(x => x.id !== qid);
    setQueues(remaining);
    setTickets(t => { const n = { ...t }; delete n[qid]; return n; });
    setActiveQueue(remaining[0]?.id ?? null);
  };

  const handleDeleteTicket = (tid) => {
    setTickets(prev => ({ ...prev, [activeQueue]: prev[activeQueue].filter(t => t.id !== tid) }));
    setTicketMenu(null);
  };

  const handleSetPriority = (tid, prio) => {
    setTickets(prev => ({
      ...prev,
      [activeQueue]: prev[activeQueue].map(t => t.id === tid ? { ...t, priority: prio } : t),
    }));
    setTicketMenu(null);
  };

  const handleSwap = (tid) => {
    if (!swapTarget || swapTarget === tid) { setSwapTarget(tid); setTicketMenu(null); return; }
    setTickets(prev => {
      const list = [...prev[activeQueue]];
      const ai   = list.findIndex(t => t.id === swapTarget);
      const bi   = list.findIndex(t => t.id === tid);
      [list[ai], list[bi]] = [list[bi], list[ai]];
      return { ...prev, [activeQueue]: list };
    });
    setSwapTarget(null); setTicketMenu(null);
  };

  const activeQ = queues.find(q => q.id === activeQueue);

  return (
    <DashLayout title="Queue & Tickets" subtitle="MANAGE">
      <div className="qp-root">

        {/* ── LEFT: QUEUE LIST ── */}
        <aside className="qp-sidebar">
          <div className="qp-sidebar-head">
            <span className="qp-sidebar-title">QUEUES</span>
            <button className="qp-add-btn" onClick={() => setShowCreate(v => !v)}>+ New</button>
          </div>

          {showCreate && (
            <div className="qp-create-form">
              <p className="qp-create-label">NEW QUEUE</p>
              <input className="qp-input" placeholder="Queue name"
                value={newName} onChange={e => setNewName(e.target.value)} />
              <input className="qp-input" placeholder="Short code (e.g. GEN-02)"
                value={newCode} onChange={e => setNewCode(e.target.value)} />
              <div className="qp-create-row">
                <button className="qp-btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="qp-btn-primary" onClick={handleCreateQueue}>Create</button>
              </div>
            </div>
          )}

          <div className="qp-queue-list">
            {queues.map(q => (
              <div key={q.id}
                className={`qp-queue-item ${activeQueue === q.id ? 'active' : ''}`}
                onClick={() => setActiveQueue(q.id)}>
                <div className="qqi-dot" style={{ background: q.color }} />
                <div className="qqi-info">
                  <p className="qqi-name">{q.name}</p>
                  <p className="qqi-code">{q.code}</p>
                </div>
                <div className="qqi-counts">
                  <span className="qqi-active">{q.active}</span>
                  <span className="qqi-pending">{q.pending}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ── RIGHT: TICKET PANEL ── */}
        <div className="qp-main">
          {activeQ ? (
            <>
              {/* Queue header */}
              <div className="qp-queue-header">
                <div className="qp-queue-title-row">
                  <div className="qp-q-dot" style={{ background: activeQ.color }} />
                  <div>
                    <h2 className="qp-queue-name">{activeQ.name}</h2>
                    <p className="qp-queue-meta">Code: <strong>{activeQ.code}</strong></p>
                  </div>
                </div>
                <div className="qp-queue-actions">
                  <button className="qp-btn-ghost" onClick={() => setShowQR(activeQ.id)}>
                    📱 QR Code
                  </button>
                  <button className="qp-btn-danger" onClick={() => handleDeleteQueue(activeQ.id)}>
                    🗑 Delete Queue
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="qp-stats-row">
                {[
                  { label: 'Active',  val: activeQ.active,                       col: '#22C55E' },
                  { label: 'Pending', val: activeQ.pending,                      col: '#F59E0B' },
                  { label: 'Total',   val: activeQ.active + activeQ.pending,     col: '#3B82F6' },
                ].map(s => (
                  <div key={s.label} className="qp-stat">
                    <span className="qp-stat-val" style={{ color: s.col }}>{s.val}</span>
                    <span className="qp-stat-label">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div className="qp-filters">
                <div className="qp-filter-group">
                  {['all', 'active', 'pending'].map(s => (
                    <button key={s}
                      className={`qp-filter-btn ${filterStatus === s ? 'active' : ''}`}
                      onClick={() => setFilterStatus(s)}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="qp-filter-group">
                  {['all', ...PRIORITIES].map(p => (
                    <button key={p}
                      className={`qp-filter-btn ${filterPrio === p ? 'active' : ''}`}
                      onClick={() => setFilterPrio(p)}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
                {swapTarget && (
                  <div className="qp-swap-hint">
                    🔄 Now click a second ticket to swap
                    <button className="qp-btn-ghost" style={{ padding: '4px 12px' }}
                      onClick={() => setSwapTarget(null)}>Cancel</button>
                  </div>
                )}
              </div>

              {/* Table */}
              <div className="qp-table-wrap">
                <table className="qp-table">
                  <thead>
                    <tr>
                      <th>#</th><th>Code</th><th>Status</th>
                      <th>Priority</th><th>Counter</th><th>Issued</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTickets.length === 0
                      ? <tr><td colSpan={7} className="qp-empty">No tickets match the filters</td></tr>
                      : currentTickets.map((t, i) => {
                        const pm = PRIORITY_META[t.priority];
                        return (
                          <tr key={t.id}
                            className={`qp-tr ${swapTarget === t.id ? 'swapping' : ''} ${swapTarget && swapTarget !== t.id ? 'swap-target' : ''}`}
                            onClick={() => swapTarget && swapTarget !== t.id && handleSwap(t.id)}>
                            <td className="qp-td-num">{i + 1}</td>
                            <td><span className="qp-ticket-code">{t.code}</span></td>
                            <td><span className={`qp-status-badge qp-status--${t.status}`}>{t.status}</span></td>
                            <td><span className="qp-prio-badge" style={{ color: pm.color, background: pm.bg }}>{pm.label}</span></td>
                            <td className="qp-td-muted">{t.counter}</td>
                            <td className="qp-td-muted">{t.issuedAt}</td>
                            <td>
                              <div className="qp-actions-cell">
                                <button className="qp-icon-btn" title="Swap"
                                  onClick={e => { e.stopPropagation(); handleSwap(t.id); }}>🔄</button>
                                <div className="qp-menu-wrap">
                                  <button className="qp-icon-btn"
                                    onClick={e => { e.stopPropagation(); setTicketMenu(ticketMenu === t.id ? null : t.id); }}>
                                    ⋯
                                  </button>
                                  {ticketMenu === t.id && (
                                    <div className="qp-dropdown">
                                      <p className="qp-dropdown-title">SET PRIORITY</p>
                                      {PRIORITIES.map(p => (
                                        <button key={p} className="qp-dropdown-item"
                                          onClick={() => handleSetPriority(t.id, p)}>
                                          <span style={{ color: PRIORITY_META[p].color }}>●</span>
                                          {PRIORITY_META[p].label}
                                          {t.priority === p && ' ✓'}
                                        </button>
                                      ))}
                                      <div className="qp-dropdown-divider" />
                                      <button className="qp-dropdown-item danger"
                                        onClick={() => handleDeleteTicket(t.id)}>
                                        🗑 Delete ticket
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="qp-empty-state">
              <span>🎟</span><p>No queues yet. Create your first queue.</p>
            </div>
          )}
        </div>
      </div>

      {/* QR MODAL */}
      {showQR && (
        <div className="qp-modal-overlay" onClick={() => setShowQR(null)}>
          <div className="qp-modal" onClick={e => e.stopPropagation()}>
            <button className="qp-modal-close" onClick={() => setShowQR(null)}>✕</button>
            <p className="qp-modal-title">QUEUE QR CODE</p>
            <div className="qp-qr-box">
              <div className="qp-qr-grid">
                {[...Array(49)].map((_, i) => (
                  <div key={i} className="qp-qr-cell"
                    style={{ background: Math.random() > 0.5 ? '#0A0A0A' : 'transparent' }} />
                ))}
              </div>
            </div>
            <p className="qp-modal-code">{queues.find(q => q.id === showQR)?.code}</p>
            <p className="qp-modal-hint">Customers scan this QR or enter the code to join the queue</p>
            <button className="qp-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Download QR
            </button>
          </div>
        </div>
      )}
    </DashLayout>
  );
}