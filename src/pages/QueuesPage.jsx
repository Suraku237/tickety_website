import { useState, useEffect, useCallback } from 'react';
import DashLayout     from '../components/DashboardLayout';
import { useSession } from '../hooks/useSession';
import {
  getQueues, createQueue, deleteQueue,
  getTickets, deleteTicket, setTicketPriority, swapTickets,
} from '../services/api.service';
import '../styles/queues.css';

// =============================================================
// QUEUES & TICKETS PAGE
// Left panel  → queue cards (name, code, stats, QR, delete)
// Right panel → filters + ticket table only
// =============================================================

const PRIORITIES = ['normal', 'high', 'urgent'];
const PRIORITY_META = {
  normal: { label: 'Normal', color: '#888',    bg: 'rgba(136,136,136,0.12)' },
  high:   { label: 'High',   color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  urgent: { label: 'Urgent', color: '#DC0F0F', bg: 'rgba(220,15,15,0.12)'   },
};
const QUEUE_COLORS = ['#DC0F0F','#3B82F6','#F59E0B','#22C55E','#8B5CF6','#06B6D4','#EC4899'];

export default function QueuesPage() {
  const { user } = useSession();

  const [queues,       setQueues]       = useState([]);
  const [tickets,      setTickets]      = useState([]);
  const [activeQueue,  setActiveQueue]  = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [ticketsLoad,  setTicketsLoad]  = useState(false);
  const [error,        setError]        = useState('');

  // Create form
  const [showCreate,   setShowCreate]   = useState(false);
  const [newName,      setNewName]      = useState('');
  const [newCode,      setNewCode]      = useState('');
  const [creating,     setCreating]     = useState(false);

  // QR modal — holds the full queue object
  const [showQR,       setShowQR]       = useState(null);

  // Delete confirm — holds queue_id
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  // Ticket actions
  const [ticketMenu,   setTicketMenu]   = useState(null);
  const [swapTarget,   setSwapTarget]   = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPrio,   setFilterPrio]   = useState('all');

  // ── LOAD QUEUES ──────────────────────────────────────────
  const loadQueues = useCallback(async () => {
    if (!user?.service_id) return;
    setLoading(true); setError('');
    const data = await getQueues({ serviceId: user.service_id });
    if (data.success) {
      setQueues(data.queues || []);
      if (data.queues?.length && !activeQueue) {
        setActiveQueue(data.queues[0].queue_id);
      }
    } else {
      setError(data.message || 'Failed to load queues.');
    }
    setLoading(false);
  }, [user?.service_id]);

  useEffect(() => { loadQueues(); }, [loadQueues]);

  // ── LOAD TICKETS when queue selected ────────────────────
  useEffect(() => {
    if (!activeQueue) { setTickets([]); return; }
    loadTickets(activeQueue);
  }, [activeQueue]);

  const loadTickets = async (queueId) => {
    setTicketsLoad(true);
    const data = await getTickets({ queueId, status: 'all', priority: 'all' });
    if (data.success) setTickets(data.tickets || []);
    setTicketsLoad(false);
  };

  // ── CREATE QUEUE ─────────────────────────────────────────
  const handleCreateQueue = async () => {
    if (!newName.trim() || !newCode.trim()) return;
    setCreating(true);
    const color = QUEUE_COLORS[queues.length % QUEUE_COLORS.length];
    const data  = await createQueue({
      serviceId: user.service_id,
      name:      newName.trim(),
      code:      newCode.trim().toUpperCase(),
      color,
    });
    if (data.success) {
      setQueues(prev => [...prev, data.queue]);
      setActiveQueue(data.queue.queue_id);
      setNewName(''); setNewCode(''); setShowCreate(false);
    } else {
      setError(data.message || 'Failed to create queue.');
    }
    setCreating(false);
  };

  // ── DELETE QUEUE ──────────────────────────────────────────
  const handleDeleteQueue = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const data = await deleteQueue({ queueId: deleteTarget });
    if (data.success) {
      const remaining = queues.filter(q => q.queue_id !== deleteTarget);
      setQueues(remaining);
      setActiveQueue(remaining[0]?.queue_id ?? null);
      setTickets([]);
    } else {
      setError(data.message || 'Failed to delete queue.');
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  // ── DELETE TICKET ─────────────────────────────────────────
  const handleDeleteTicket = async (ticketId) => {
    const data = await deleteTicket({ ticketId });
    if (data.success) {
      setTickets(prev => prev.filter(t => t.ticket_id !== ticketId));
      setTicketMenu(null);
      loadQueues();
    } else {
      setError(data.message || 'Failed to delete ticket.');
    }
  };

  // ── SET PRIORITY ──────────────────────────────────────────
  const handleSetPriority = async (ticketId, priority) => {
    const data = await setTicketPriority({ ticketId, priority });
    if (data.success) {
      setTickets(prev => prev.map(t =>
        t.ticket_id === ticketId ? { ...t, priority } : t
      ));
    } else {
      setError(data.message || 'Failed to update priority.');
    }
    setTicketMenu(null);
  };

  // ── SWAP TICKETS ──────────────────────────────────────────
  const handleSwap = async (ticketId) => {
    if (!swapTarget || swapTarget === ticketId) {
      setSwapTarget(ticketId); setTicketMenu(null); return;
    }
    const data = await swapTickets({ ticketIdA: swapTarget, ticketIdB: ticketId });
    if (data.success) await loadTickets(activeQueue);
    else setError(data.message || 'Swap failed.');
    setSwapTarget(null); setTicketMenu(null);
  };

  // ── FILTERED TICKETS ──────────────────────────────────────
  const visibleTickets = tickets.filter(t => {
    const statusOk = filterStatus === 'all' || t.status   === filterStatus;
    const prioOk   = filterPrio   === 'all' || t.priority === filterPrio;
    return statusOk && prioOk;
  });

  const activeQ = queues.find(q => q.queue_id === activeQueue);

  return (
    <DashLayout title="Queue & Tickets" subtitle="MANAGE">

      {error && (
        <div className="qp-page-error" onClick={() => setError('')}>
          ⚠ {error} <span style={{ opacity:.6, fontSize:'11px' }}>· click to dismiss</span>
        </div>
      )}

      <div className="qp-root">

        {/* ════════════════════════════════════════════════
            LEFT — Queue cards
            Each card: name, code, stats, QR, delete
        ════════════════════════════════════════════════ */}
        <aside className="qp-sidebar">

          {/* Header + New button */}
          <div className="qp-sidebar-head">
            <span className="qp-sidebar-title">QUEUES</span>
            <button className="qp-add-btn" onClick={() => setShowCreate(v => !v)}>
              {showCreate ? '✕' : '+ New'}
            </button>
          </div>

          {/* Create form */}
          {showCreate && (
            <div className="qp-create-form">
              <p className="qp-create-label">NEW QUEUE</p>
              <input className="qp-input" placeholder="Queue name"
                value={newName} onChange={e => setNewName(e.target.value)} />
              <input className="qp-input" placeholder="Short code (e.g. GEN-01)"
                value={newCode} onChange={e => setNewCode(e.target.value)} />
              <div className="qp-create-row">
                <button className="qp-btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="qp-btn-primary" onClick={handleCreateQueue} disabled={creating}>
                  {creating ? '…' : 'Create'}
                </button>
              </div>
            </div>
          )}

          {/* Queue list */}
          {loading ? (
            <div className="qp-list-loading">Loading queues…</div>
          ) : queues.length === 0 ? (
            <div className="qp-list-empty">No queues yet.<br/>Create your first queue above.</div>
          ) : (
            <div className="qp-queue-list">
              {queues.map(q => (
                <div key={q.queue_id}
                  className={`qp-queue-card ${activeQueue === q.queue_id ? 'active' : ''}`}
                  onClick={() => setActiveQueue(q.queue_id)}>

                  {/* Colour bar */}
                  <div className="qp-queue-card-bar" style={{ background: q.color }} />

                  <div className="qp-queue-card-body">

                    {/* Name + code */}
                    <div className="qp-queue-card-top">
                      <p className="qp-queue-card-name">{q.name}</p>
                      <span className="qp-queue-card-code">{q.code}</span>
                    </div>

                    {/* Stats */}
                    <div className="qp-queue-card-stats">
                      <div className="qp-queue-card-stat">
                        <span className="qp-qcs-val" style={{ color: '#22C55E' }}>{q.active}</span>
                        <span className="qp-qcs-label">Active</span>
                      </div>
                      <div className="qp-queue-card-divider" />
                      <div className="qp-queue-card-stat">
                        <span className="qp-qcs-val" style={{ color: '#F59E0B' }}>{q.pending}</span>
                        <span className="qp-qcs-label">Pending</span>
                      </div>
                      <div className="qp-queue-card-divider" />
                      <div className="qp-queue-card-stat">
                        <span className="qp-qcs-val" style={{ color: q.color }}>{q.active + q.pending}</span>
                        <span className="qp-qcs-label">Total</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="qp-queue-progress-track">
                      <div className="qp-queue-progress-fill"
                        style={{
                          width: `${(q.active / Math.max(q.active + q.pending, 1)) * 100}%`,
                          background: q.color,
                        }} />
                    </div>
                    <p className="qp-queue-progress-label">
                      {q.active + q.pending === 0
                        ? 'No tickets'
                        : `${q.active} of ${q.active + q.pending} being served`}
                    </p>

                    {/* Card action buttons — stop propagation so
                        clicking them doesn't also select the queue */}
                    <div className="qp-queue-card-actions" onClick={e => e.stopPropagation()}>
                      <button className="qp-card-btn qp-card-btn--qr"
                        onClick={() => setShowQR(q)}>
                        📱 QR Code
                      </button>
                      <button className="qp-card-btn qp-card-btn--delete"
                        onClick={() => setDeleteTarget(q.queue_id)}>
                        🗑 Delete
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* ════════════════════════════════════════════════
            RIGHT — Filters + ticket table only
        ════════════════════════════════════════════════ */}
        <div className="qp-main">
          {!activeQ ? (
            <div className="qp-empty-state">
              <span>🎟</span>
              <p>Select or create a queue to see its tickets.</p>
            </div>
          ) : (
            <>
              {/* Queue title bar */}
              <div className="qp-panel-header">
                <div className="qp-panel-title-row">
                  <div className="qp-q-dot" style={{ background: activeQ.color }} />
                  <div>
                    <h2 className="qp-queue-name">{activeQ.name}</h2>
                    <p className="qp-queue-meta">
                      Code: <strong>{activeQ.code}</strong>
                      &nbsp;·&nbsp;
                      <span style={{ color: '#22C55E' }}>{activeQ.active} active</span>
                      &nbsp;·&nbsp;
                      <span style={{ color: '#F59E0B' }}>{activeQ.pending} pending</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="qp-filters">
                <div className="qp-filter-group">
                  <span className="qp-filter-label">STATUS</span>
                  {['all','active','pending','suspended','carried_over'].map(s => (
                    <button key={s}
                      className={`qp-filter-btn ${filterStatus === s ? 'active' : ''}`}
                      onClick={() => setFilterStatus(s)}>
                      {s === 'carried_over' ? 'Carried Over' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="qp-filter-group">
                  <span className="qp-filter-label">PRIORITY</span>
                  {['all',...PRIORITIES].map(p => (
                    <button key={p}
                      className={`qp-filter-btn ${filterPrio === p ? 'active' : ''}`}
                      onClick={() => setFilterPrio(p)}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
                {swapTarget && (
                  <div className="qp-swap-hint">
                    🔄 Click another ticket to swap
                    <button className="qp-btn-ghost"
                      style={{ padding:'4px 12px', fontSize:'12px' }}
                      onClick={() => setSwapTarget(null)}>Cancel</button>
                  </div>
                )}
              </div>

              {/* Ticket table */}
              {ticketsLoad ? (
                <div className="qp-tickets-loading">Loading tickets…</div>
              ) : (
                <div className="qp-table-wrap">
                  <table className="qp-table">
                    <thead>
                      <tr>
                        <th>#</th><th>Code</th><th>Status</th>
                        <th>Priority</th><th>Counter</th><th>Issued</th><th>Est. Serve</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleTickets.length === 0 ? (
                        <tr><td colSpan={8} className="qp-empty">
                          {tickets.length === 0
                            ? 'No tickets in this queue yet.'
                            : 'No tickets match the filters.'}
                        </td></tr>
                      ) : visibleTickets.map((t, i) => {
                        const pm = PRIORITY_META[t.priority] || PRIORITY_META.normal;
                        return (
                          <tr key={t.ticket_id}
                            className={`qp-tr
                              ${swapTarget === t.ticket_id ? 'swapping' : ''}
                              ${swapTarget && swapTarget !== t.ticket_id ? 'swap-target' : ''}`}
                            onClick={() => swapTarget && swapTarget !== t.ticket_id && handleSwap(t.ticket_id)}>
                            <td className="qp-td-num">{i + 1}</td>
                            <td><span className="qp-ticket-code">{t.code}</span></td>
                            <td>
                              <span className={`qp-status-badge qp-status--${t.status}`}>
                                {t.status === 'carried_over' ? 'carried over' : t.status}
                              </span>
                            </td>
                            <td>
                              <span className="qp-prio-badge"
                                style={{ color: pm.color, background: pm.bg }}>
                                {pm.label}
                              </span>
                            </td>
                            <td className="qp-td-muted">{t.counter || '—'}</td>
                            <td className="qp-td-muted">
                              {t.issued_at
                                ? new Date(t.issued_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
                                : '—'}
                            </td>
                            <td className="qp-td-muted">
                              {t.estimated_serve_at
                                ? new Date(t.estimated_serve_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
                                : '—'}
                            </td>
                            <td>
                              <div className="qp-actions-cell">
                                <button className="qp-icon-btn" title="Swap position"
                                  onClick={e => { e.stopPropagation(); handleSwap(t.ticket_id); }}>
                                  🔄
                                </button>
                                <div className="qp-menu-wrap">
                                  <button className="qp-icon-btn"
                                    onClick={e => { e.stopPropagation(); setTicketMenu(ticketMenu === t.ticket_id ? null : t.ticket_id); }}>
                                    ⋯
                                  </button>
                                  {ticketMenu === t.ticket_id && (
                                    <div className="qp-dropdown">
                                      <p className="qp-dropdown-title">SET PRIORITY</p>
                                      {PRIORITIES.map(p => (
                                        <button key={p} className="qp-dropdown-item"
                                          onClick={() => handleSetPriority(t.ticket_id, p)}>
                                          <span style={{ color: PRIORITY_META[p].color }}>●</span>
                                          {PRIORITY_META[p].label}
                                          {t.priority === p && ' ✓'}
                                        </button>
                                      ))}
                                      <div className="qp-dropdown-divider" />
                                      <button className="qp-dropdown-item danger"
                                        onClick={() => handleDeleteTicket(t.ticket_id)}>
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
              )}
            </>
          )}
        </div>
      </div>

      {/* ── QR MODAL ── */}
      {showQR && (
        <div className="qp-modal-overlay" onClick={() => setShowQR(null)}>
          <div className="qp-modal" onClick={e => e.stopPropagation()}>
            <button className="qp-modal-close" onClick={() => setShowQR(null)}>✕</button>
            <p className="qp-modal-title">QUEUE QR CODE</p>
            <div className="qp-qr-box">
              <div className="qp-qr-url-box">
                <p className="qp-qr-url-label">CUSTOMER SCAN LINK</p>
                <p className="qp-qr-url">{showQR.join_url}</p>
              </div>
            </div>
            <p className="qp-modal-code">{showQR.code}</p>
            <p className="qp-modal-hint">
              Customers open this link to join the queue and receive a digital ticket.
            </p>
            <button className="qp-btn-primary"
              style={{ width:'100%', justifyContent:'center' }}
              onClick={() => { navigator.clipboard.writeText(showQR.join_url).catch(()=>{}); }}>
              Copy Link
            </button>
          </div>
        </div>
      )}

      {/* ── DELETE QUEUE CONFIRM ── */}
      {deleteTarget && (
        <div className="qp-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="qp-modal qp-modal--confirm" onClick={e => e.stopPropagation()}>
            <p className="qp-confirm-icon">🗑</p>
            <h2 className="qp-confirm-title">Delete Queue?</h2>
            <p className="qp-confirm-sub">
              This will permanently delete the queue and all its tickets.
              This action cannot be undone.
            </p>
            <div className="qp-confirm-actions">
              <button className="qp-btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="qp-btn-danger" disabled={deleting} onClick={handleDeleteQueue}>
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashLayout>
  );
}