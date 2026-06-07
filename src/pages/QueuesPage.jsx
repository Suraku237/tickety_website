import { useState, useEffect, useCallback } from 'react';
import DashLayout    from '../components/DashboardLayout';
import { useSession } from '../hooks/useSession';
import { useNotifications } from '../context/NotificationContext';
import {
  getQueues, createQueue, deleteQueue,
  getTickets, deleteTicket, setTicketPriority, swapTickets,
} from '../services/api.service';
import { QRCodeCanvas } from 'qrcode.react';
import '../styles/queues.css';

// =============================================================
// QUEUES & TICKETS PAGE
// Updated:
//   - Issue Ticket button per queue (boss + manager only)
//   - Printed badge on ticket codes
//   - Toast notifications on all actions
// =============================================================

const REFRESH_MS = 8000;   // #1 silent auto-refresh cadence
const PRIORITIES = ['normal', 'high', 'urgent'];
const PRIORITY_META = {
  normal: { label: 'Normal', color: '#888',    bg: 'rgba(136,136,136,0.12)' },
  high:   { label: 'High',   color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  urgent: { label: 'Urgent', color: '#DC0F0F', bg: 'rgba(220,15,15,0.12)'   },
};
const QUEUE_COLORS = ['#DC0F0F','#3B82F6','#F59E0B','#22C55E','#8B5CF6','#06B6D4','#EC4899'];

// Issue ticket via fetch directly (not in api.service to keep it lean)
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';
async function issueTicket({ queueId, priority }) {
  try {
    const res  = await fetch(`${BASE_URL}/queues/${queueId}/issue`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'X-App-Source': 'web' },
      body:    JSON.stringify({ priority }),
    });
    return await res.json();
  } catch {
    return { success: false, message: 'Connection error.' };
  }
}

export default function QueuesPage() {
  const { user }       = useSession();
  const { pushToast }  = useNotifications();
  const canIssue       = ['boss','manager'].includes(user?.admin_role);

  const [queues,       setQueues]       = useState([]);
  const [tickets,      setTickets]      = useState([]);
  const [activeQueue,  setActiveQueue]  = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [ticketsLoad,  setTicketsLoad]  = useState(false);
  const [error,        setError]        = useState('');

  // Create form
  const [showCreate,   setShowCreate]   = useState(false);
  const [newName,      setNewName]      = useState('');
  const [creating,     setCreating]     = useState(false);

  // QR modal
  const [showQR,       setShowQR]       = useState(null);

  // Delete queue confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  // Ticket actions
  const [ticketMenu,   setTicketMenu]   = useState(null);
  const [swapTarget,   setSwapTarget]   = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPrio,   setFilterPrio]   = useState('all');

  // Issue ticket
  const [issuing,      setIssuing]      = useState(false);
  // Print popup: shows the code + a 5s window to set priority
  const [ticketCodePopup, setTicketCodePopup] = useState(null); // { code, queueName, ticketId, queueId, priority }
  const [popupSecs,    setPopupSecs]    = useState(5);

  // ── LOAD QUEUES ──────────────────────────────────────────
  const loadQueues = useCallback(async (silent = false) => {
    if (!user?.service_id) return;
    if (!silent) { setLoading(true); setError(''); }
    const data = await getQueues({ serviceId: user.service_id });
    if (data.success) {
      setQueues(data.queues || []);
      if (data.queues?.length && !activeQueue) {
        setActiveQueue(data.queues[0].queue_id);
      }
    } else if (!silent) {
      setError(data.message || 'Failed to load queues.');
    }
    if (!silent) setLoading(false);
  }, [user?.service_id]);

  useEffect(() => { loadQueues(); }, [loadQueues]);

  useEffect(() => {
    if (!activeQueue) { setTickets([]); return; }
    loadTickets(activeQueue);
  }, [activeQueue]);

  const loadTickets = async (queueId, silent = false) => {
    if (!silent) setTicketsLoad(true);
    const data = await getTickets({ queueId, status: 'all', priority: 'all' });
    if (data.success) setTickets(data.tickets || []);
    if (!silent) setTicketsLoad(false);
  };

  // ── #1 SILENT AUTO-REFRESH ───────────────────────────────
  // Refreshes queue stats + the open queue's tickets in the
  // background. Pauses while a modal/menu/swap is in progress so
  // it never disrupts what the user is doing, and when the tab is
  // hidden. Also refreshes immediately when the tab regains focus.
  const interacting = Boolean(
    showCreate || showQR || deleteTarget ||
    ticketMenu || swapTarget || ticketCodePopup
  );
  useEffect(() => {
    const tick = () => {
      if (document.hidden || interacting) return;
      loadQueues(true);
      if (activeQueue) loadTickets(activeQueue, true);
    };
    const id = setInterval(tick, REFRESH_MS);
    const onVisible = () => { if (!document.hidden && !interacting) tick(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
  }, [interacting, activeQueue, loadQueues]);

  // 5-second countdown for the printed-ticket popup; auto-closes at 0.
  useEffect(() => {
    if (!ticketCodePopup) return;
    setPopupSecs(5);
    const id = setInterval(() => {
      setPopupSecs(prev => {
        if (prev <= 1) { clearInterval(id); setTicketCodePopup(null); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [ticketCodePopup]);

  // ── CREATE QUEUE ─────────────────────────────────────────
  const handleCreateQueue = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const color = QUEUE_COLORS[queues.length % QUEUE_COLORS.length];
    const data  = await createQueue({
      serviceId: user.service_id,
      name:      newName.trim(),
      color,
    });
    if (data.success) {
      setQueues(prev => [...prev, data.queue]);
      setActiveQueue(data.queue.queue_id);
      setNewName(''); setShowCreate(false);
      pushToast({ type: 'queue_created', title: `Queue created: ${data.queue.name}`, body: 'A join link & QR are ready.' });
    } else {
      setError(data.message || 'Failed to create queue.');
    }
    setCreating(false);
  };

  // ── DELETE QUEUE ──────────────────────────────────────────
  const handleDeleteQueue = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const q    = queues.find(q => q.queue_id === deleteTarget);
    const data = await deleteQueue({ queueId: deleteTarget });
    if (data.success) {
      const remaining = queues.filter(q => q.queue_id !== deleteTarget);
      setQueues(remaining);
      setActiveQueue(remaining[0]?.queue_id ?? null);
      setTickets([]);
      if (q) pushToast({ type: 'queue_deleted', title: `Queue deleted: ${q.name}` });
    } else {
      setError(data.message || 'Failed to delete queue.');
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  // ── ISSUE TICKET (manual/printed) ─────────────────────────
  // Issues immediately as normal priority, then shows a 5-second
  // popup so the manager can bump the priority (or leave it normal).
  const handleIssueDirect = async (queue) => {
    setIssuing(true);
    const data = await issueTicket({ queueId: queue.queue_id, priority: 'normal' });
    setIssuing(false);
    if (data.success) {
      setTicketCodePopup({
        code:      data.ticket.code,
        queueName: queue.name,
        ticketId:  data.ticket.ticket_id,
        queueId:   queue.queue_id,
        priority:  'normal',
      });
      loadQueues(true);
      if (activeQueue === queue.queue_id) loadTickets(activeQueue, true);
      pushToast({
        type:  'ticket_printed',
        title: `Printed ticket: ${data.ticket.code}`,
        body:  'Write this code on the physical ticket.',
      });
    } else {
      setError(data.message || 'Failed to issue ticket.');
    }
  };

  // Set priority from inside the 5s popup (then close it).
  const handlePopupPriority = async (p) => {
    const popup = ticketCodePopup;
    if (!popup) return;
    setTicketCodePopup(null);
    if (p !== popup.priority) {
      await setTicketPriority({ ticketId: popup.ticketId, priority: p });
      if (activeQueue === popup.queueId) loadTickets(activeQueue, true);
      pushToast({ type: 'info', title: `Priority set to ${p}` });
    }
  };

  // ── DELETE TICKET ─────────────────────────────────────────
  const handleDeleteTicket = async (ticketId) => {
    const data = await deleteTicket({ ticketId });
    if (data.success) {
      setTickets(prev => prev.filter(t => t.ticket_id !== ticketId));
      setTicketMenu(null);
      loadQueues();
      pushToast({ type: 'info', title: 'Ticket deleted' });
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
      pushToast({ type: 'info', title: `Priority set to ${priority}` });
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
    if (data.success) {
      await loadTickets(activeQueue);
      pushToast({ type: 'info', title: 'Tickets swapped' });
    } else {
      setError(data.message || 'Swap failed.');
    }
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

        {/* ════ LEFT — Queue cards ════ */}
        <aside className="qp-sidebar">
          <div className="qp-sidebar-head">
            <span className="qp-sidebar-title">QUEUES</span>
            <button className="qp-add-btn" onClick={() => setShowCreate(v => !v)}>
              {showCreate ? '✕' : '+ New'}
            </button>
          </div>

          {showCreate && (
            <div className="qp-create-form">
              <p className="qp-create-label">NEW QUEUE</p>
              <input className="qp-input" placeholder="Queue name"
                value={newName} onChange={e => setNewName(e.target.value)} />
              <div className="qp-create-row">
                <button className="qp-btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="qp-btn-primary" onClick={handleCreateQueue} disabled={creating}>
                  {creating ? '…' : 'Create'}
                </button>
              </div>
            </div>
          )}

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
                  <div className="qp-queue-card-bar" style={{ background: q.color }} />
                  <div className="qp-queue-card-body">
                    <div className="qp-queue-card-top">
                      <p className="qp-queue-card-name">{q.name}</p>
                      <span className="qp-queue-card-code">{q.code}</span>
                    </div>
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
                    <div className="qp-queue-card-actions" onClick={e => e.stopPropagation()}>
                      {canIssue && (
                        <button className="qp-card-btn qp-card-btn--issue"
                          disabled={issuing}
                          onClick={() => handleIssueDirect(q)}>
                          🖨 Issue Ticket
                        </button>
                      )}
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

        {/* ════ RIGHT — Ticket table ════ */}
        <div className="qp-main">
          {!activeQ ? (
            <div className="qp-empty-state">
              <span>🎟</span>
              <p>Select or create a queue to see its tickets.</p>
            </div>
          ) : (
            <>
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
                            <td>
                              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                                <span className="qp-ticket-code">{t.code}</span>
                                {t.printed && (
                                  <span className="qp-printed-badge">🖨 printed</span>
                                )}
                              </div>
                            </td>
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
              <div style={{ background:'#fff', padding:'16px', borderRadius:'12px',
                            display:'flex', justifyContent:'center', marginBottom:'14px' }}>
                <QRCodeCanvas value={showQR.join_url} size={200} includeMargin level="M" />
              </div>
              <div className="qp-qr-url-box">
                <p className="qp-qr-url-label">SCAN, OR ENTER THIS LINK MANUALLY</p>
                <p className="qp-qr-url">{showQR.join_url}</p>
              </div>
            </div>
            <p className="qp-modal-code">{showQR.code}</p>
            <p className="qp-modal-hint">Customers scan this link to join and receive a digital ticket.</p>
            <button className="qp-btn-primary" style={{ width:'100%', justifyContent:'center' }}
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
            <p className="qp-confirm-sub">This will permanently delete the queue and all its tickets.</p>
            <div className="qp-confirm-actions">
              <button className="qp-btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="qp-btn-danger" disabled={deleting} onClick={handleDeleteQueue}>
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRINTED TICKET POPUP — 5s window to set priority ── */}
      {ticketCodePopup && (
        <div className="qp-modal-overlay" onClick={() => setTicketCodePopup(null)}>
          <div className="qp-modal qp-modal--confirm" onClick={e => e.stopPropagation()}
            style={{ borderColor:'rgba(245,158,11,0.4)' }}>
            <p className="qp-confirm-icon">🖨</p>
            <h2 className="qp-confirm-title" style={{ color:'#F59E0B' }}>Ticket Issued</h2>
            <p style={{ fontSize:'13px', color:'var(--muted)' }}>Write this code on the physical ticket:</p>
            <div style={{
              background:'var(--card2)', border:'2px solid #F59E0B',
              borderRadius:'12px', padding:'18px 32px', margin:'8px 0',
            }}>
              <p style={{
                fontFamily:"'Bebas Neue', sans-serif", fontSize:'52px',
                letterSpacing:'6px', color:'#F59E0B', lineHeight:1, textAlign:'center',
              }}>
                {ticketCodePopup.code}
              </p>
              <p style={{ textAlign:'center', color:'var(--muted)', fontSize:'12px', marginTop:'6px' }}>
                {ticketCodePopup.queueName}
              </p>
            </div>

            <p className="qp-create-label" style={{ alignSelf:'center', marginTop:'4px' }}>
              SET PRIORITY
            </p>
            <div style={{ display:'flex', gap:'8px', width:'100%', margin:'8px 0 4px' }}>
              {['normal','high','urgent'].map(p => (
                <button key={p}
                  className={`qp-filter-btn ${ticketCodePopup.priority === p ? 'active' : ''}`}
                  style={{ flex:1 }}
                  onClick={() => handlePopupPriority(p)}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            <p style={{ fontSize:'11px', color:'var(--muted)', opacity:.6, marginTop:'4px' }}>
              Closes in {popupSecs}s · stays Normal if you don't choose
            </p>
            <button className="qp-btn-primary" style={{ width:'100%', justifyContent:'center', marginTop:'6px' }}
              onClick={() => setTicketCodePopup(null)}>
              Done
            </button>
          </div>
        </div>
      )}
    </DashLayout>
  );
}