import { useState, useEffect, useCallback } from 'react';
import DashLayout    from '../components/DashboardLayout';
import { useSession } from '../hooks/useSession';
import {
  getTeam, removeAdmin, generateInvite,
} from '../services/api.service';
import '../styles/team.css';

// =============================================================
// TEAM PAGE — dynamic
// =============================================================

const ROLE_META = {
  boss:    { label: 'Owner',   icon: '👑', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  manager: { label: 'Manager', icon: '🎛', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  agent:   { label: 'Agent',   icon: '🪟', color: '#22C55E', bg: 'rgba(34,197,94,0.12)'  },
};

export default function TeamPage() {
  const { user } = useSession();

  const [team,         setTeam]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [filterRole,   setFilterRole]   = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  // Invite state
  const [showInvite,   setShowInvite]   = useState(false);
  const [inviteRole,   setInviteRole]   = useState('agent');
  const [inviteLink,   setInviteLink]   = useState('');
  const [inviteLoading,setInviteLoading]= useState(false);
  const [copied,       setCopied]       = useState(false);

  // ── LOAD TEAM ───────────────────────────────────────────
  const load = useCallback(async () => {
    if (!user?.service_id) return;
    setLoading(true); setError('');
    const data = await getTeam({ serviceId: user.service_id });
    if (data.success) {
      setTeam(data.team || []);
    } else {
      setError(data.message || 'Failed to load team.');
    }
    setLoading(false);
  }, [user?.service_id]);

  useEffect(() => { load(); }, [load]);

  // ── REMOVE ADMIN ────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const data = await removeAdmin({ adminId: deleteTarget.admin_id });
    if (data.success) {
      setTeam(prev => prev.filter(m => m.admin_id !== deleteTarget.admin_id));
      setDeleteTarget(null);
    } else {
      setError(data.message || 'Failed to remove admin.');
    }
    setDeleting(false);
  };

  // ── GENERATE INVITE ─────────────────────────────────────
  const handleGenerateInvite = async () => {
    setInviteLoading(true); setInviteLink(''); setError('');
    const data = await generateInvite({
      serviceId: user.service_id,
      adminRole: inviteRole,
    });
    if (data.success) {
      setInviteLink(data.invite_url || data.invite?.invite_url || '');
    } else {
      setError(data.message || 'Failed to generate invite.');
    }
    setInviteLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const visible = team.filter(m => filterRole === 'all' || m.admin_role === filterRole);
  const counts  = {
    boss:    team.filter(m => m.admin_role === 'boss').length,
    manager: team.filter(m => m.admin_role === 'manager').length,
    agent:   team.filter(m => m.admin_role === 'agent').length,
  };

  const getInitials = (name = '') => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (name[0] || '?').toUpperCase();
  };

  return (
    <DashLayout title="Team" subtitle="MANAGE">

      {error && (
        <div className="tp-error-banner" onClick={() => setError('')}>
          ⚠ {error}
        </div>
      )}

      {/* STATS */}
      <div className="tp-stats">
        {[
          { label: 'Total',    val: team.length,    col: '#3B82F6' },
          { label: 'Owners',   val: counts.boss,    col: '#F59E0B' },
          { label: 'Managers', val: counts.manager, col: '#3B82F6' },
          { label: 'Agents',   val: counts.agent,   col: '#22C55E' },
        ].map(s => (
          <div key={s.label} className="tp-stat">
            <span className="tp-stat-val" style={{ color: s.col }}>
              {loading ? '…' : s.val}
            </span>
            <span className="tp-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* TOOLBAR */}
      <div className="tp-toolbar">
        <div className="tp-filters">
          {['all','boss','manager','agent'].map(r => (
            <button key={r}
              className={`tp-filter-btn ${filterRole === r ? 'active' : ''}`}
              onClick={() => setFilterRole(r)}>
              {r === 'all' ? 'All' : ROLE_META[r].label + 's'}
            </button>
          ))}
        </div>
        {user?.admin_role === 'boss' && (
          <button className="tp-invite-btn" onClick={() => { setShowInvite(true); setInviteLink(''); }}>
            + Generate invite link
          </button>
        )}
      </div>

      {/* TEAM TABLE */}
      {loading ? (
        <div className="tp-loading">Loading team…</div>
      ) : (
        <div className="tp-table-wrap">
          <table className="tp-table">
            <thead>
              <tr>
                <th>Member</th><th>Email</th><th>Role</th><th>Joined</th><th></th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={5} className="tp-empty">
                  {team.length === 0 ? 'No team members yet.' : 'No members match this filter.'}
                </td></tr>
              ) : visible.map(m => {
                const rm = ROLE_META[m.admin_role] || ROLE_META.agent;
                return (
                  <tr key={m.admin_id} className="tp-tr">
                    <td>
                      <div className="tp-member-cell">
                        <div className="tp-avatar" style={{ background: rm.bg, color: rm.color }}>
                          {getInitials(m.username)}
                        </div>
                        <span className="tp-member-name">{m.username}</span>
                      </div>
                    </td>
                    <td className="tp-td-muted">{m.email}</td>
                    <td>
                      <span className="tp-role-badge" style={{ color: rm.color, background: rm.bg }}>
                        {rm.icon} {rm.label}
                      </span>
                    </td>
                    <td className="tp-td-muted">
                      {m.joined_at ? new Date(m.joined_at).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      {m.admin_role !== 'boss' && user?.admin_role === 'boss' && (
                        <button className="tp-delete-btn"
                          onClick={() => setDeleteTarget(m)}>🗑</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* INVITE MODAL */}
      {showInvite && (
        <div className="tp-overlay" onClick={() => { setShowInvite(false); setInviteLink(''); }}>
          <div className="tp-modal" onClick={e => e.stopPropagation()}>
            <button className="tp-modal-close"
              onClick={() => { setShowInvite(false); setInviteLink(''); }}>✕</button>
            <p className="tp-modal-label">GENERATE INVITE LINK</p>
            <h2 className="tp-modal-title">Invite a team member</h2>
            <p className="tp-modal-sub">
              The person who registers via this link will automatically get the selected role.
              Link expires in 48 hours and is single-use.
            </p>
            <p className="tp-modal-label" style={{ marginTop: 8 }}>DEFAULT ROLE</p>
            <div className="tp-role-picker">
              {['manager','agent'].map(r => {
                const rm = ROLE_META[r];
                return (
                  <div key={r}
                    className={`tp-role-option ${inviteRole === r ? 'active' : ''}`}
                    onClick={() => setInviteRole(r)}>
                    <span className="tp-role-option-icon">{rm.icon}</span>
                    <div>
                      <p className="tp-role-option-title">{rm.label}</p>
                      <p className="tp-role-option-sub">
                        {r === 'manager' ? 'Can manage queues and tickets' : 'Can operate a counter'}
                      </p>
                    </div>
                    {inviteRole === r && <span className="tp-role-check">✓</span>}
                  </div>
                );
              })}
            </div>
            <button className="tp-invite-generate-btn"
              disabled={inviteLoading}
              onClick={handleGenerateInvite}>
              {inviteLoading ? 'Generating…' : 'Generate Link'}
            </button>
            {inviteLink && (
              <div className="tp-link-box">
                <p className="tp-link-text">{inviteLink}</p>
                <button className="tp-copy-btn" onClick={handleCopy}>
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleteTarget && (
        <div className="tp-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="tp-modal tp-modal--sm" onClick={e => e.stopPropagation()}>
            <p className="tp-modal-icon">🗑</p>
            <h2 className="tp-modal-title">Remove {deleteTarget.username}?</h2>
            <p className="tp-modal-sub">
              This will revoke their access to the service.
            </p>
            <div className="tp-modal-actions">
              <button className="tp-btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="tp-btn-danger" disabled={deleting} onClick={handleDelete}>
                {deleting ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashLayout>
  );
}