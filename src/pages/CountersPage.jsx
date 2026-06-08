import { useState, useEffect, useCallback, useRef } from 'react';
import DashLayout    from '../components/DashboardLayout';
import { useSession } from '../hooks/useSession';
import {
  getQueues,
  getCounterTickets,
  terminateTicket,
  suspendTicket,
  reactivateTicket,
  callNext,
} from '../services/api.service';
import '../styles/counters.css';

// =============================================================
// COUNTER PAGE — with queue selector setup screen
//
// Flow:
//   1. Setup screen — agent picks queue(s) + enters counter name
//   2. Ticket list — filtered to selected queues, counter name
//      stamped on every ticket that gets called
// =============================================================

const PRIORITY_META = {
  normal: { label: 'Normal', color: '#888',    bg: 'rgba(136,136,136,0.12)' },
  high:   { label: 'High',   color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  urgent: { label: 'Urgent', color: '#DC0F0F', bg: 'rgba(220,15,15,0.12)'   },
};

export default function CounterPage() {
  const { user } = useSession();

  // #4 — remember the counter setup so navigating away or refreshing keeps
  // the agent on the manage view. Only "Change setup" clears it.
  const SETUP_KEY = `tickety_counter_setup_${user?.service_id ?? 'x'}`;
  const _saved = (() => {
    try { return JSON.parse(sessionStorage.getItem(SETUP_KEY) || 'null'); }
    catch { return null; }
  })();

  // ── SETUP STATE ─────────────────────────────────────────
  const [setupDone,     setSetupDone]     = useState(Boolean(_saved?.setupDone));
  const [allQueues,     setAllQueues]     = useState([]);
  const [selectedQueues,setSelectedQueues]= useState(_saved?.selectedQueues ?? []);   // array of queue_ids (int)
  const [counterName,   setCounterName]   = useState(_saved?.counterName ?? '');
  const [queuesLoading, setQueuesLoading] = useState(true);
  const [setupError,    setSetupError]    = useState('');

  // ── TICKET STATE ─────────────────────────────────────────
  const [serving,       setServing]       = useState(null);
  const [waiting,       setWaiting]       = useState([]);
  const [suspended,     setSuspended]     = useState([]);
  const [warning,       setWarning]       = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error,         setError]         = useState('');
  const [confirmId,     setConfirmId]     = useState(null);
  const [confirmAct,    setConfirmAct]    = useState(null);
  const [showWarning,   setShowWarning]   = useState(false);

  // ── LOAD ALL QUEUES for setup screen ────────────────────
  useEffect(() => {
    if (!user?.service_id) return;
    (async () => {
      setQueuesLoading(true);
      const data = await getQueues({ serviceId: user.service_id });
      if (data.success) setAllQueues(data.queues || []);
      setQueuesLoading(false);
    })();
  }, [user?.service_id]);

  // ── TOGGLE QUEUE SELECTION ───────────────────────────────
  const toggleQueue = (queueId) => {
    setSelectedQueues(prev =>
      prev.includes(queueId)
        ? prev.filter(id => id !== queueId)
        : [...prev, queueId]
    );
  };

  const handleStartSession = () => {
    if (selectedQueues.length === 0) {
      setSetupError('Please select at least one queue.'); return;
    }
    if (!counterName.trim()) {
      setSetupError('Please enter your counter name or number.'); return;
    }
    setSetupError('');
    setSetupDone(true);
    try {
      sessionStorage.setItem(SETUP_KEY, JSON.stringify({
        setupDone: true,
        selectedQueues,
        counterName: counterName.trim(),
      }));
    } catch { /* ignore */ }
  };

  // ── LOAD TICKETS ─────────────────────────────────────────
  // A monotonically increasing token guards against a stale in-flight
  // request (e.g. a background poll fired just before "call next") landing
  // last and clobbering fresh state — which made a just-called ticket
  // briefly vanish. Only the most recently started load applies its result.
  const loadSeqRef = useRef(0);
  const load = useCallback(async (silent = false) => {
    if (!user?.service_id || !setupDone) return;
    const seq = ++loadSeqRef.current;
    if (!silent) { setLoading(true); setError(''); }
    const data = await getCounterTickets({
      serviceId:   user.service_id,
      queueIds:    selectedQueues.join(','),
      counterName: counterName.trim(),
    });
    if (seq !== loadSeqRef.current) return;   // a newer load started; discard
    if (data.success) {
      setServing(data.serving || null);
      setWaiting(data.waiting || []);
      setSuspended(data.suspended || []);
      if (data.closing_warning?.warning) {
        setWarning(data.closing_warning);
        // Only auto-open the warning modal on an explicit load, not on
        // every silent poll — otherwise it would re-open after dismiss.
        if (!silent) setShowWarning(true);
      }
    } else if (!silent) {
      setError(data.message || 'Failed to load tickets.');
    }
    if (!silent) setLoading(false);
  }, [user?.service_id, setupDone, selectedQueues, counterName]);

  useEffect(() => { if (setupDone) load(); }, [setupDone, load]);

  // ── #1 SILENT AUTO-REFRESH (live serving board) ──────────
  // Fast cadence since this is the agent's live view. Pauses while
  // a confirm dialog is open, an action is running, or the tab is
  // hidden; refreshes at once when the tab regains focus.
  useEffect(() => {
    if (!setupDone) return;
    const tick = () => {
      if (document.hidden || confirmId || actionLoading) return;
      load(true);
    };
    const id = setInterval(tick, 5000);
    const onVisible = () => { if (!document.hidden && !confirmId && !actionLoading) tick(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
  }, [setupDone, confirmId, actionLoading, load]);

  // ── APPLY RESPONSE ───────────────────────────────────────
  const applyResponse = (data) => {
    if (!data.success) { setError(data.message || 'Action failed.'); return; }
    load();
    if (data.closing_warning?.warning) {
      setWarning(data.closing_warning);
      setShowWarning(true);
    }
  };

  // ── TICKET ACTIONS ───────────────────────────────────────
  const handleTerminate = async (id) => {
    setActionLoading(id);
    applyResponse(await terminateTicket({ ticketId: id, counterName: counterName.trim() }));
    setActionLoading(null); setConfirmId(null);
  };

  const handleSuspend = async (id) => {
    setActionLoading(id);
    applyResponse(await suspendTicket({ ticketId: id }));
    setActionLoading(null); setConfirmId(null);
  };

  const handleReactivate = async (id) => {
    setActionLoading(id);
    applyResponse(await reactivateTicket({ ticketId: id }));
    setActionLoading(null);
  };

  const handleCallNext = async () => {
    setActionLoading('next');
    applyResponse(await callNext({
      serviceId:   user.service_id,
      queueIds:    selectedQueues,
      counterName: counterName.trim(),
    }));
    setActionLoading(null);
  };

  const upNext  = waiting[0]    ?? null;
  const inQueue = waiting.slice(1);

  // ── SELECTED QUEUE NAMES for display ─────────────────────
  const selectedQueueNames = allQueues
    .filter(q => selectedQueues.includes(q.queue_id))
    .map(q => q.name)
    .join(', ');

  // ============================================================
  // SETUP SCREEN
  // ============================================================
  if (!setupDone) {
    return (
      <DashLayout title="Counter Setup" subtitle="CONFIGURE">
        <div className="cs-root">
          <div className="cs-card">

            <div className="cs-header">
              <div className="cs-header-icon">🖥</div>
              <h2 className="cs-title">Start your counter session</h2>
              <p className="cs-sub">
                Select the queue(s) you will be serving today and enter
                your counter name or number. Only tickets from the selected
                queues will appear in your view.
              </p>
            </div>

            {setupError && (
              <div className="cs-error">⚠ {setupError}</div>
            )}

            {/* Counter name */}
            <div className="cs-field">
              <label className="cs-label">YOUR COUNTER NAME / NUMBER</label>
              <input
                className="cs-input"
                placeholder="Counter A?, Guichet 3?, Window 2?"
                value={counterName}
                onChange={e => setCounterName(e.target.value)}
              />
            </div>

            {/* Queue selector */}
            <div className="cs-field">
              <label className="cs-label">SELECT QUEUE(S) TO SERVE</label>
              {queuesLoading ? (
                <p className="cs-loading">Loading queues…</p>
              ) : allQueues.length === 0 ? (
                <p className="cs-empty">No queues available. Ask your manager to create queues first.</p>
              ) : (
                <div className="cs-queue-grid">
                  {allQueues.map(q => {
                    const selected = selectedQueues.includes(q.queue_id);
                    return (
                      <div key={q.queue_id}
                        className={`cs-queue-card ${selected ? 'selected' : ''}`}
                        onClick={() => toggleQueue(q.queue_id)}>
                        {/* Colour dot */}
                        <div className="cs-queue-dot" style={{ background: q.color }} />
                        <div className="cs-queue-info">
                          <p className="cs-queue-name">{q.name}</p>
                          <p className="cs-queue-code">{q.code}</p>
                        </div>
                        <div className="cs-queue-stats">
                          <span className="cs-queue-stat" style={{ color: '#F59E0B' }}>
                            {q.pending} waiting
                          </span>
                        </div>
                        {/* Checkmark */}
                        <div className={`cs-queue-check ${selected ? 'visible' : ''}`}>✓</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Summary */}
            {selectedQueues.length > 0 && counterName.trim() && (
              <div className="cs-summary">
                <span className="cs-summary-icon">✅</span>
                <p>
                  <strong>{counterName.trim()}</strong> will serve:{' '}
                  <strong>{selectedQueueNames}</strong>
                </p>
              </div>
            )}

            <button
              className="cs-start-btn"
              disabled={selectedQueues.length === 0 || !counterName.trim()}
              onClick={handleStartSession}>
              Start Session →
            </button>

          </div>
        </div>
      </DashLayout>
    );
  }

  // ============================================================
  // TICKET LIST SCREEN
  // ============================================================
  return (
    <DashLayout title="Counter" subtitle="MANAGE">

      {/* Session info bar */}
      <div className="cp-session-bar">
        <div className="cp-session-info">
          <span className="cp-session-counter">🖥 {counterName}</span>
          <span className="cp-session-divider">·</span>
          <span className="cp-session-queues">Serving: {selectedQueueNames}</span>
        </div>
        <button className="cp-session-change" onClick={() => {
          setSetupDone(false);
          setServing(null); setWaiting([]); setSuspended([]);
          try { sessionStorage.removeItem(SETUP_KEY); } catch { /* ignore */ }
        }}>
          Change setup
        </button>
      </div>

      {/* Closing time warning popup */}
      {showWarning && warning && (
        <div className="cp-overlay" onClick={() => setShowWarning(false)}>
          <div className="cp-modal" onClick={e => e.stopPropagation()}>
            <p className="cp-modal-icon">⏰</p>
            <h2 className="cp-modal-title">Closing Time</h2>
            <p className="cp-modal-sub">
              <strong>{warning.affected_count}</strong> ticket
              {warning.affected_count !== 1 ? 's' : ''} exceed today's
              closing time ({warning.closing_time}) and will be carried over.
            </p>
            <div className="cp-modal-actions">
              <button className="cp-btn-ghost" onClick={() => setShowWarning(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="cp-error-banner" onClick={() => setError('')}>⚠ {error}</div>
      )}

      {/* Stats */}
      <div className="cp-stats">
        {[
          { label: 'Now Serving', val: serving ? serving.code : '—', col: '#22C55E' },
          { label: 'Up Next',     val: upNext  ? upNext.code  : '—', col: '#3B82F6' },
          { label: 'In Queue',    val: inQueue.length,                col: '#F59E0B' },
          { label: 'Suspended',   val: suspended.length,              col: '#888'    },
        ].map(s => (
          <div key={s.label} className="cp-stat">
            <span className="cp-stat-val" style={{ color: s.col }}>{s.val}</span>
            <span className="cp-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* NOW SERVING */}
      <section className="cp-section">
        <p className="cp-section-label">NOW SERVING</p>
        {loading && !serving ? (
          <div className="cp-loading">Loading…</div>
        ) : serving ? (
          <div className="cp-hero-card">
            <div className="cp-hero-glow" />
            <div className="cp-hero-left">
              <div className="cp-hero-live"><span className="cp-live-dot" />LIVE</div>
              <p className="cp-hero-code">{serving.code}</p>
              <p className="cp-hero-queue">{serving.queue_name || '—'}</p>
              <div className="cp-hero-meta">
                <span className="cp-prio-badge"
                  style={{ color: PRIORITY_META[serving.priority]?.color, background: PRIORITY_META[serving.priority]?.bg }}>
                  {PRIORITY_META[serving.priority]?.label}
                </span>
                {serving.counter && (
                  <span className="cp-meta-chip">🖥 {serving.counter}</span>
                )}
                {serving.issued_at && (
                  <span className="cp-meta-chip">
                    🕐 {new Date(serving.issued_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                  </span>
                )}
                {serving.estimated_serve_at && (
                  <span className="cp-meta-chip">
                    📅 Est. {new Date(serving.estimated_serve_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                  </span>
                )}
              </div>
            </div>
            <div className="cp-hero-actions">
              <button className="cp-btn-suspend-hero"
                disabled={actionLoading === serving.ticket_id}
                onClick={() => { setConfirmId(serving.ticket_id); setConfirmAct('suspend'); }}>
                ⏸ Suspend
              </button>
              <button className="cp-btn-terminate-hero"
                disabled={actionLoading === serving.ticket_id}
                onClick={() => { setConfirmId(serving.ticket_id); setConfirmAct('terminate'); }}>
                {actionLoading === serving.ticket_id ? '…' : '✓ Done — Call Next'}
              </button>
            </div>
          </div>
        ) : (
          <div className="cp-hero-empty">
            <span>🖥</span>
            <p>No ticket currently being served.</p>
            {upNext && (
              <button className="cp-btn-terminate-hero"
                disabled={actionLoading === 'next'}
                onClick={handleCallNext}>
                {actionLoading === 'next' ? '…' : `Call ${upNext.code}`}
              </button>
            )}
          </div>
        )}
      </section>

      {/* UP NEXT */}
      {upNext && (
        <section className="cp-section">
          <p className="cp-section-label">UP NEXT</p>
          <div className="cp-next-card">
            <div className="cp-next-position">1</div>
            <div className="cp-next-info">
              <p className="cp-next-code">{upNext.code}</p>
              <p className="cp-next-queue">{upNext.queue_name || '—'}</p>
            </div>
            <div className="cp-next-badges">
              <span className="cp-prio-badge"
                style={{ color: PRIORITY_META[upNext.priority]?.color, background: PRIORITY_META[upNext.priority]?.bg }}>
                {PRIORITY_META[upNext.priority]?.label}
              </span>
              {upNext.estimated_serve_at && (
                <span className="cp-meta-chip">
                  Est. {new Date(upNext.estimated_serve_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                </span>
              )}
            </div>
            <button className="cp-btn-call-now"
              disabled={actionLoading === 'next'}
              onClick={handleCallNext}>
              {actionLoading === 'next' ? '…' : 'Call Now'}
            </button>
          </div>
        </section>
      )}

      {/* QUEUE ORDER */}
      {inQueue.length > 0 && (
        <section className="cp-section">
          <p className="cp-section-label">QUEUE ORDER — {inQueue.length} waiting</p>
          <div className="cp-queue-order">
            {inQueue.map((t, i) => {
              const pm     = PRIORITY_META[t.priority] || PRIORITY_META.normal;
              const isLast = i === inQueue.length - 1;
              return (
                <div key={t.ticket_id} className="cp-order-row">
                  <div className="cp-order-timeline">
                    <div className="cp-order-num">{i + 2}</div>
                    {!isLast && <div className="cp-order-connector" />}
                  </div>
                  <div className={`cp-order-card ${t.priority === 'urgent' ? 'cp-order-card--urgent' : ''}`}>
                    <div className="cp-order-card-left">
                      <span className="cp-order-code">{t.code}</span>
                      <span className="cp-order-queue">{t.queue_name || '—'}</span>
                    </div>
                    <div className="cp-order-card-right">
                      <span className="cp-prio-badge" style={{ color: pm.color, background: pm.bg }}>
                        {pm.label}
                      </span>
                      {t.estimated_serve_at && (
                        <span className="cp-meta-chip">
                          Est. {new Date(t.estimated_serve_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                        </span>
                      )}
                      {t.issued_at && (
                        <span className="cp-meta-chip">
                          🕐 {new Date(t.issued_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                        </span>
                      )}
                      <button className="cp-row-suspend-btn" title="Suspend"
                        disabled={actionLoading === t.ticket_id}
                        onClick={() => { setConfirmId(t.ticket_id); setConfirmAct('suspend'); }}>
                        {actionLoading === t.ticket_id ? '…' : '⏸'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SUSPENDED */}
      {suspended.length > 0 && (
        <section className="cp-section">
          <p className="cp-section-label">SUSPENDED — {suspended.length} paused</p>
          <div className="cp-suspended-list">
            {suspended.map(t => {
              const pm = PRIORITY_META[t.priority] || PRIORITY_META.normal;
              return (
                <div key={t.ticket_id} className="cp-suspended-card">
                  <div className="cp-sus-left">
                    <span className="cp-suspended-code">{t.code}</span>
                    <span className="cp-sus-queue">{t.queue_name || '—'}</span>
                    <span className="cp-prio-badge" style={{ color: pm.color, background: pm.bg }}>
                      {pm.label}
                    </span>
                  </div>
                  <button className="cp-btn-reactivate"
                    disabled={actionLoading === t.ticket_id}
                    onClick={() => handleReactivate(t.ticket_id)}>
                    {actionLoading === t.ticket_id ? '…' : '▶ Reactivate'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {!serving && waiting.length === 0 && suspended.length === 0 && !loading && (
        <div className="cp-all-clear">
          <span>✅</span>
          <p>No tickets in the selected queues right now.</p>
        </div>
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
                ? 'This ticket will be marked served and the next customer will be called.'
                : "The ticket will be paused and can be reactivated from the Suspended section."}
            </p>
            <div className="cp-modal-actions">
              <button className="cp-btn-ghost" onClick={() => setConfirmId(null)}>Cancel</button>
              <button
                className={confirmAct === 'terminate' ? 'cp-btn-terminate-hero' : 'cp-btn-suspend-hero'}
                style={{ flex: 1 }}
                disabled={actionLoading === confirmId}
                onClick={() => confirmAct === 'terminate'
                  ? handleTerminate(confirmId)
                  : handleSuspend(confirmId)}>
                {actionLoading === confirmId ? '…'
                  : confirmAct === 'terminate' ? 'Yes, done' : 'Yes, suspend'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashLayout>
  );
}