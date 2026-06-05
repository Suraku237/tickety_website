import { useState, useRef, useContext } from 'react';
import { useNavigate }  from 'react-router-dom';
import { useSession }   from '../hooks/useSession';
import { AppContext }   from '../contexts/AppContext';
import QrModal          from '../components/QrModal';
import '../styles/dashboard.css';
import '../styles/queuemanager.css';

// =============================================================
// QUEUE MANAGER PAGE
// OOP Principle: Single Responsibility, Encapsulation
//
// Fixed: queues were stored in local useState only — they were
//   never saved to the backend and disappeared on refresh.
//   Now uses AppContext (createQueue, updateQueue, deleteQueue,
//   loadQueues) so all operations go through the backend API.
// =============================================================

const QUEUE_TYPES = [
  { id: 'general',  label: 'General',  icon: '📋', color: '#3B82F6' },
  { id: 'priority', label: 'Priority', icon: '⚡', color: '#F59E0B' },
  { id: 'vip',      label: 'VIP',      icon: '👑', color: '#DC0F0F' },
  { id: 'medical',  label: 'Medical',  icon: '🏥', color: '#22C55E' },
];

export default function QueueManagerPage() {
  const navigate = useNavigate();
  const { user, logout } = useSession();

  // Fixed: use AppContext instead of local useState for queues
  const {
    queues,
    loading,
    error:   contextError,
    createQueue,
    updateQueue,
    deleteQueue,
  } = useContext(AppContext);

  const [showCreate, setShowCreate] = useState(false);
  const [qrTarget,   setQrTarget]   = useState(null);
  const [formName,   setFormName]   = useState('');
  const [formType,   setFormType]   = useState('general');
  const [formError,  setFormError]  = useState('');
  const inputRef = useRef(null);

  if (!user) return null;

  const getInitials = (name = '') => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (name[0] || '?').toUpperCase();
  };

  // ── Create queue ─────────────────────────────────────────
  // Fixed: now calls AppContext.createQueue() → backend API
  const handleCreate = async (e) => {
    e.preventDefault();
    const name = formName.trim();
    if (!name) { setFormError('Queue name is required.'); return; }
    if (name.length < 3) { setFormError('Name must be at least 3 characters.'); return; }
    if (queues.some(q => q.name.toLowerCase() === name.toLowerCase())) {
      setFormError('A queue with this name already exists.');
      return;
    }

    const result = await createQueue({
      name,
      description: '',
      category:    formType,
    });

    if (result?.success) {
      setFormName('');
      setFormType('general');
      setFormError('');
      setShowCreate(false);
    } else {
      setFormError(result?.message || 'Failed to create queue.');
    }
  };

  // ── Toggle active/pause ──────────────────────────────────
  // Fixed: now calls AppContext.updateQueue() → backend API
  const toggleQueue = async (queue) => {
    await updateQueue(queue.service_id, { isActive: !queue.is_active });
  };

  // ── Delete queue ─────────────────────────────────────────
  // Fixed: now calls AppContext.deleteQueue() → backend API
  const handleDelete = async (queue) => {
    await deleteQueue(queue.service_id);
  };

  const typeOf = (id) => QUEUE_TYPES.find(t => t.id === id) || QUEUE_TYPES[0];

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
          <div className="db-nav-item" onClick={() => navigate('/dashboard')}>
            <span>🏠</span> Dashboard
          </div>
          <div className="db-nav-item active">
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

        {/* Top bar */}
        <header className="dash-topbar">
          <div>
            <p className="dash-greeting">Queue Manager</p>
            <h1 className="dash-username">{user.service_name || 'My Service'}</h1>
          </div>
          <div className="dash-topbar-right">
            <div className="dash-status-badge">
              <span className="dash-status-dot" />
              {queues.filter(q => q.is_active).length} Active
            </div>
            <button
              className="qm-btn-new"
              onClick={() => { setShowCreate(true); setTimeout(() => inputRef.current?.focus(), 50); }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5"  y1="12" x2="19" y2="12"/>
              </svg>
              New Queue
            </button>
          </div>
        </header>

        {/* Context-level error banner */}
        {contextError && (
          <div className="auth-error" style={{ marginBottom: '16px' }}>
            <span className="auth-error-icon">⚠</span>{contextError}
          </div>
        )}

        {/* ── CREATE FORM ── */}
        {showCreate && (
          <div className="qm-create-panel">
            <div className="qm-create-header">
              <p className="qm-panel-title">📋 CREATE NEW QUEUE</p>
              <button className="qm-close" onClick={() => { setShowCreate(false); setFormError(''); }}>✕</button>
            </div>

            {formError && (
              <div className="auth-error" style={{ marginBottom: '14px' }}>
                <span className="auth-error-icon">⚠</span>{formError}
              </div>
            )}

            <form className="qm-create-form" onSubmit={handleCreate}>
              <div className="qm-field">
                <label className="qm-label">QUEUE NAME</label>
                <input
                  ref={inputRef}
                  className="qm-input"
                  type="text"
                  placeholder="e.g. Window A — General"
                  value={formName}
                  onChange={e => { setFormName(e.target.value); setFormError(''); }}
                  maxLength={60}
                />
              </div>

              <div className="qm-field">
                <label className="qm-label">QUEUE TYPE</label>
                <div className="qm-type-grid">
                  {QUEUE_TYPES.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      className={`qm-type-btn ${formType === t.id ? 'selected' : ''}`}
                      style={{ '--type-color': t.color }}
                      onClick={() => setFormType(t.id)}
                    >
                      <span>{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="qm-create-actions">
                <button type="button" className="qm-btn-cancel"
                  onClick={() => { setShowCreate(false); setFormError(''); }}>
                  Cancel
                </button>
                <button type="submit" className="auth-submit qm-btn-submit" disabled={loading}>
                  {loading ? <span className="auth-spinner" /> : 'CREATE QUEUE'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── LOADING STATE ── */}
        {loading && queues.length === 0 && (
          <div className="qm-empty">
            <span className="auth-spinner" />
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {!loading && queues.length === 0 && !showCreate && (
          <div className="qm-empty">
            <div className="qm-empty-icon">📋</div>
            <h2 className="qm-empty-title">No queues yet</h2>
            <p className="qm-empty-sub">
              Create your first queue and generate a QR code so customers
              can join from the TICKETY mobile app.
            </p>
            <button
              className="qm-btn-new"
              onClick={() => { setShowCreate(true); setTimeout(() => inputRef.current?.focus(), 50); }}
            >
              + Create First Queue
            </button>
          </div>
        )}

        {/* ── QUEUE LIST ── */}
        {queues.length > 0 && (
          <>
            <div className="qm-stats-row">
              <div className="qm-stat">
                <span className="qm-stat-val">{queues.length}</span>
                <span className="qm-stat-lbl">Total Queues</span>
              </div>
              <div className="qm-stat">
                <span className="qm-stat-val">{queues.filter(q => q.is_active).length}</span>
                <span className="qm-stat-lbl">Active</span>
              </div>
            </div>

            <h2 className="dash-section-title">YOUR QUEUES</h2>
            <div className="qm-list">
              {queues.map(queue => {
                // Fixed: backend uses 'category' as the type field
                const t = typeOf(queue.category?.toLowerCase());
                return (
                  <div key={queue.service_id} className={`qm-card ${queue.is_active ? 'active' : 'paused'}`}>
                    <div className="qmc-left">
                      <div className="qmc-type-dot" style={{ background: t.color }} />
                      <div className="qmc-info">
                        <div className="qmc-name-row">
                          <span className="qmc-name">{queue.name}</span>
                          <span className="qmc-type-badge" style={{ color: t.color, background: t.color + '18' }}>
                            {t.icon} {t.label}
                          </span>
                        </div>
                        <p className="qmc-meta">
                          {queue.is_active ? '● Active' : '⏸ Paused'} ·
                          Created {new Date(queue.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="qmc-actions">
                      {/* QR Code */}
                      <button
                        className="qmc-btn qmc-btn-qr"
                        onClick={() => setQrTarget(queue)}
                        title="Show QR Code"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2">
                          <rect x="3"  y="3"  width="7" height="7"/>
                          <rect x="14" y="3"  width="7" height="7"/>
                          <rect x="3"  y="14" width="7" height="7"/>
                          <rect x="14" y="14" width="3" height="3"/>
                          <rect x="18" y="18" width="3" height="3"/>
                          <rect x="14" y="18" width="3" height="3"/>
                          <rect x="18" y="14" width="3" height="3"/>
                        </svg>
                        QR Code
                      </button>

                      {/* Toggle active/pause */}
                      <button
                        className={`qmc-btn ${queue.is_active ? 'qmc-btn-pause' : 'qmc-btn-resume'}`}
                        onClick={() => toggleQueue(queue)}
                        title={queue.is_active ? 'Pause queue' : 'Resume queue'}
                        disabled={loading}
                      >
                        {queue.is_active ? '⏸ Pause' : '▶ Resume'}
                      </button>

                      {/* Delete */}
                      <button
                        className="qmc-btn qmc-btn-delete"
                        onClick={() => handleDelete(queue)}
                        title="Delete queue"
                        disabled={loading}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <p className="dash-footer">TICKETY v1.0.0 — Smart Queue Management System</p>
      </main>

      {/* ── QR MODAL ── */}
      {qrTarget && (
        <QrModal
          queue={qrTarget}
          onClose={() => setQrTarget(null)}
        />
      )}
    </div>
  );
}
