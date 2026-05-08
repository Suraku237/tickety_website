import { useState } from 'react';
import DashLayout from '../components/DashboardLayout';
import '../styles/team.css';

// =============================================================
// TEAM PAGE
// Features:
//   - View all admins and their roles
//   - Generate invite link with a pre-set default role
//   - Delete an admin (except boss)
// OOP Principle: Encapsulation, Single Responsibility
// =============================================================

const MOCK_TEAM = [
  { id: 'U1', name: 'Jean-Marc Dupont', email: 'jm@clinic.cm', role: 'boss',    joinedAt: '2025-01-10', initials: 'JD' },
  { id: 'U2', name: 'Carine Tchamba',   email: 'ct@clinic.cm', role: 'manager', joinedAt: '2025-02-14', initials: 'CT' },
  { id: 'U3', name: 'Paul Essomba',     email: 'pe@clinic.cm', role: 'agent',   joinedAt: '2025-03-02', initials: 'PE' },
  { id: 'U4', name: 'Alice Mbida',      email: 'am@clinic.cm', role: 'agent',   joinedAt: '2025-03-18', initials: 'AM' },
  { id: 'U5', name: 'Boris Nkeng',      email: 'bn@clinic.cm', role: 'manager', joinedAt: '2025-04-01', initials: 'BN' },
];

const ROLE_META = {
  boss:    { label: 'Owner',   icon: '👑', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  manager: { label: 'Manager', icon: '🎛', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  agent:   { label: 'Agent',   icon: '🪟', color: '#22C55E', bg: 'rgba(34,197,94,0.12)'  },
};

export default function TeamPage() {
  const [team,         setTeam]         = useState(MOCK_TEAM);
  const [showInvite,   setShowInvite]   = useState(false);
  const [inviteRole,   setInviteRole]   = useState('agent');
  const [inviteLink,   setInviteLink]   = useState('');
  const [copied,       setCopied]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filterRole,   setFilterRole]   = useState('all');

  const visible = team.filter(m => filterRole === 'all' || m.role === filterRole);
  const counts  = { boss: team.filter(m => m.role==='boss').length, manager: team.filter(m => m.role==='manager').length, agent: team.filter(m => m.role==='agent').length };

  const handleGenerateLink = () => {
    const token = Math.random().toString(36).slice(2, 10).toUpperCase();
    setInviteLink(`https://tickety.app/invite/${token}?role=${inviteRole}`);
  };
  const handleCopy = () => { navigator.clipboard.writeText(inviteLink).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  const handleDelete = id => { setTeam(p => p.filter(m => m.id !== id)); setDeleteTarget(null); };

  return (
    <DashLayout title="Team" subtitle="MANAGE">

      <div className="tp-stats">
        {[
          { label: 'Total',    val: team.length,    col: '#3B82F6' },
          { label: 'Owners',   val: counts.boss,    col: '#F59E0B' },
          { label: 'Managers', val: counts.manager, col: '#3B82F6' },
          { label: 'Agents',   val: counts.agent,   col: '#22C55E' },
        ].map(s => (
          <div key={s.label} className="tp-stat">
            <span className="tp-stat-val" style={{ color: s.col }}>{s.val}</span>
            <span className="tp-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="tp-toolbar">
        <div className="tp-filters">
          {['all','boss','manager','agent'].map(r => (
            <button key={r} className={`tp-filter-btn ${filterRole===r?'active':''}`}
              onClick={() => setFilterRole(r)}>
              {r==='all' ? 'All' : ROLE_META[r].label+'s'}
            </button>
          ))}
        </div>
        <button className="tp-invite-btn" onClick={() => setShowInvite(true)}>+ Generate invite link</button>
      </div>

      <div className="tp-table-wrap">
        <table className="tp-table">
          <thead><tr><th>Member</th><th>Email</th><th>Role</th><th>Joined</th><th></th></tr></thead>
          <tbody>
            {visible.map(m => {
              const rm = ROLE_META[m.role];
              return (
                <tr key={m.id} className="tp-tr">
                  <td>
                    <div className="tp-member-cell">
                      <div className="tp-avatar" style={{ background: rm.bg, color: rm.color }}>{m.initials}</div>
                      <span className="tp-member-name">{m.name}</span>
                    </div>
                  </td>
                  <td className="tp-td-muted">{m.email}</td>
                  <td><span className="tp-role-badge" style={{ color: rm.color, background: rm.bg }}>{rm.icon} {rm.label}</span></td>
                  <td className="tp-td-muted">{m.joinedAt}</td>
                  <td>{m.role !== 'boss' && <button className="tp-delete-btn" onClick={() => setDeleteTarget(m)}>🗑</button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* INVITE MODAL */}
      {showInvite && (
        <div className="tp-overlay" onClick={() => { setShowInvite(false); setInviteLink(''); }}>
          <div className="tp-modal" onClick={e => e.stopPropagation()}>
            <button className="tp-modal-close" onClick={() => { setShowInvite(false); setInviteLink(''); }}>✕</button>
            <p className="tp-modal-label">GENERATE INVITE LINK</p>
            <h2 className="tp-modal-title">Invite a team member</h2>
            <p className="tp-modal-sub">The person who registers via this link will automatically get the selected role.</p>
            <p className="tp-modal-label" style={{ marginTop: 8 }}>DEFAULT ROLE</p>
            <div className="tp-role-picker">
              {['manager','agent'].map(r => {
                const rm = ROLE_META[r];
                return (
                  <div key={r} className={`tp-role-option ${inviteRole===r?'active':''}`} onClick={() => setInviteRole(r)}>
                    <span className="tp-role-option-icon">{rm.icon}</span>
                    <div>
                      <p className="tp-role-option-title">{rm.label}</p>
                      <p className="tp-role-option-sub">{r==='manager' ? 'Can manage queues and tickets' : 'Can operate a counter'}</p>
                    </div>
                    {inviteRole===r && <span className="tp-role-check">✓</span>}
                  </div>
                );
              })}
            </div>
            <button className="tp-invite-generate-btn" onClick={handleGenerateLink}>Generate Link</button>
            {inviteLink && (
              <div className="tp-link-box">
                <p className="tp-link-text">{inviteLink}</p>
                <button className="tp-copy-btn" onClick={handleCopy}>{copied ? '✓ Copied' : 'Copy'}</button>
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
            <h2 className="tp-modal-title">Remove {deleteTarget.name}?</h2>
            <p className="tp-modal-sub">This will revoke their access. They won't be able to log in as admin.</p>
            <div className="tp-modal-actions">
              <button className="tp-btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="tp-btn-danger" onClick={() => handleDelete(deleteTarget.id)}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </DashLayout>
  );
}