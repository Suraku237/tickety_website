import { useState, useEffect } from 'react';
import DashLayout     from '../components/DashboardLayout';
import { useSession } from '../hooks/useSession';
import { useTheme }   from '../context/ThemeContext';
import OtpGrid        from '../components/OtpGrid';
import { useNotifications } from '../context/NotificationContext';
import {
  getSchedule, setGeneralSchedule, setDaySchedule, deleteDaySchedule,
  updateUsername, initiateEmailChange, confirmOldEmail, confirmNewEmail,
  updatePassword, deleteService, getPushHealth,
} from '../services/api.service';
import '../styles/settings.css';
import '../styles/settings_additions.css';

const SECTIONS = [
  { id: 'profile',  icon: '👤', label: 'Profile'   },
  { id: 'theme',    icon: '🎨', label: 'Theme'     },
  { id: 'schedule', icon: '🗓', label: 'Schedule'  },
  { id: 'account',  icon: '⚠️', label: 'Account'  },
];

const THEMES = [
  { id: 'dark',  label: 'Dark',  desc: 'Dark background, crimson accent', preview: ['#0A0A0A','#141414','#DC0F0F'] },
  { id: 'light', label: 'Light', desc: 'Light background, crimson accent', preview: ['#F2F2F2','#FFFFFF','#DC0F0F'] },
];

const DAY_NAMES    = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const EMPTY_SCHED  = { is_open: true, opening_time: '08:00', closing_time: '17:00', avg_duration: 10 };
const EMAIL_STEP   = { IDLE: 0, ENTER_NEW: 1, VERIFY_OLD: 2, VERIFY_NEW: 3, DONE: 4 };

export default function SettingsPage() {
  // Fix 2: use updateSession for reactive UI updates
  const { user, updateSession, logout } = useSession();
  const [showDeleteService, setShowDeleteService] = useState(false);
  const [deletingService,   setDeletingService]   = useState(false);
  const [deleteErr,         setDeleteErr]          = useState('');

  // --- Push notifications status (#8 visible health) ---
  const [push,        setPush]        = useState(null);   // health payload
  const [pushBusy,    setPushBusy]    = useState(false);

  const loadPush = async (probe = false) => {
    setPushBusy(true);
    const data = await getPushHealth({ probe, userId: user?.user_id });
    setPushBusy(false);
    if (data.success) setPush({ ...data, probed: probe });
    else setPush({ status: 'error', error: data.message || 'Could not reach the server.' });
  };

  const PUSH_UI = {
    working:        { color:'#22C55E', label:'Working',                    icon:'✓' },
    configured:     { color:'#F59E0B', label:'Configured (not yet tested)', icon:'•' },
    misconfigured:  { color:'#DC0F0F', label:'Configured but failing',      icon:'⚠' },
    not_configured: { color:'#888',    label:'Not set up',                  icon:'○' },
    error:          { color:'#DC0F0F', label:'Cannot reach server',         icon:'⚠' },
  };

  const handleDeleteService = async () => {
    setDeletingService(true);
    const data = await deleteService({ serviceId: user.service_id, userId: user.user_id });
    setDeletingService(false);
    if (data.success) { logout(); }   // service is gone — end the session
    else { setDeleteErr(data.message || 'Could not delete service.'); }
  };
  const { theme, setTheme, isDark }     = useTheme();
  const { pushToast }                   = useNotifications();

  const [section, setSection] = useState('profile');
  // Load push status when the Account tab is opened (section is defined above).
  useEffect(() => { if (section === 'account') loadPush(false); /* eslint-disable-next-line */ }, [section]);
  const isBoss = user?.admin_role === 'boss';

  // ── USERNAME ──────────────────────────────────────────────
  const [username,       setUsername]       = useState(user?.username ?? '');
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameMsg,    setUsernameMsg]    = useState('');
  const [usernameErr,    setUsernameErr]    = useState('');

  // ── EMAIL CHANGE ──────────────────────────────────────────
  const [emailStep,    setEmailStep]    = useState(EMAIL_STEP.IDLE);
  const [newEmail,     setNewEmail]     = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMsg,     setEmailMsg]     = useState('');
  const [emailErr,     setEmailErr]     = useState('');

  // ── PASSWORD ──────────────────────────────────────────────
  const [currentPw,     setCurrentPw]     = useState('');
  const [newPw,         setNewPw]         = useState('');
  const [confirmPw,     setConfirmPw]     = useState('');
  const [pwLoading,     setPwLoading]     = useState(false);
  const [pwMsg,         setPwMsg]         = useState('');
  const [pwErr,         setPwErr]         = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw,     setShowNewPw]     = useState(false);

  // ── SCHEDULE ──────────────────────────────────────────────
  const [general,      setGeneral]      = useState(null);
  const [overrides,    setOverrides]    = useState({});
  const [schedLoading, setSchedLoading] = useState(false);
  const [schedSaved,   setSchedSaved]   = useState('');
  const [schedError,   setSchedError]   = useState('');
  const [editGeneral,  setEditGeneral]  = useState({ ...EMPTY_SCHED });
  const [editDay,      setEditDay]      = useState(null);

  // ── ACCOUNT ───────────────────────────────────────────────
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    if (section === 'schedule' && isBoss && user?.service_id) loadSchedule();
  }, [section]);

  // ── SCHEDULE ─────────────────────────────────────────────
  const loadSchedule = async () => {
    setSchedLoading(true);
    const data = await getSchedule({ serviceId: user.service_id });
    if (data.success) {
      if (data.general) {
        setGeneral(data.general);
        setEditGeneral({
          is_open:      data.general.is_open,
          opening_time: data.general.opening_time,
          closing_time: data.general.closing_time,
          avg_duration: data.general.avg_duration,
        });
      }
      const ov = {};
      (data.overrides || []).forEach(r => { ov[r.day_of_week] = r; });
      setOverrides(ov);
    }
    setSchedLoading(false);
  };

  const handleSaveGeneral = async () => {
    setSchedError(''); setSchedSaved('');
    const data = await setGeneralSchedule({
      serviceId:   user.service_id,
      isOpen:      editGeneral.is_open,
      openingTime: editGeneral.opening_time,
      closingTime: editGeneral.closing_time,
      avgDuration: editGeneral.avg_duration,
    });
    if (data.success) {
      setGeneral(data.schedule);
      setSchedSaved('General schedule saved.');
      pushToast({ type: 'success', title: 'General schedule saved' });
      setTimeout(() => setSchedSaved(''), 2500);
    } else {
      setSchedError(data.message || 'Failed to save.');
    }
  };

  const handleSaveDay = async () => {
    if (editDay === null) return;
    setSchedError(''); setSchedSaved('');
    const data = await setDaySchedule({
      serviceId:   user.service_id,
      dayOfWeek:   editDay.dow,
      isOpen:      editDay.is_open,
      openingTime: editDay.opening_time,
      closingTime: editDay.closing_time,
      avgDuration: editDay.avg_duration,
    });
    if (data.success) {
      setOverrides(prev => ({ ...prev, [editDay.dow]: data.schedule }));
      setEditDay(null);
      setSchedSaved(`${DAY_NAMES[editDay.dow]} override saved.`);
      pushToast({ type: 'success', title: `${DAY_NAMES[editDay.dow]} schedule saved` });
      setTimeout(() => setSchedSaved(''), 2500);
    } else {
      setSchedError(data.message || 'Failed to save.');
    }
  };

  const handleDeleteDay = async (dow) => {
    setSchedError('');
    const data = await deleteDaySchedule({ serviceId: user.service_id, dayOfWeek: dow });
    if (data.success) {
      setOverrides(prev => { const n = { ...prev }; delete n[dow]; return n; });
      setSchedSaved(`${DAY_NAMES[dow]} override removed.`);
      setTimeout(() => setSchedSaved(''), 2500);
    } else {
      setSchedError(data.message || 'Failed to remove.');
    }
  };

  // ── USERNAME SAVE ─────────────────────────────────────────
  const handleSaveUsername = async (e) => {
    e.preventDefault();
    setUsernameErr(''); setUsernameMsg('');
    if (!username.trim() || username.trim().length < 3) {
      setUsernameErr('Username must be at least 3 characters.'); return;
    }
    setUsernameSaving(true);
    const data = await updateUsername({ userId: user.user_id, username: username.trim() });
    setUsernameSaving(false);
    if (data.success) {
      updateSession({ username: data.username }); // Fix 2: reactive update
      setUsernameMsg('Username updated successfully.');
      pushToast({ type: 'success', title: 'Username updated' });
      setTimeout(() => setUsernameMsg(''), 3000);
    } else {
      setUsernameErr(data.message || 'Failed to update username.');
    }
  };

  // ── EMAIL CHANGE ──────────────────────────────────────────
  const handleInitiateEmail = async (e) => {
    e.preventDefault();
    setEmailErr(''); setEmailMsg('');
    if (!newEmail.includes('@')) { setEmailErr('Enter a valid email address.'); return; }
    setEmailLoading(true);
    const data = await initiateEmailChange({ userId: user.user_id, newEmail });
    setEmailLoading(false);
    if (data.success) {
      setEmailMsg(data.message);
      setEmailStep(EMAIL_STEP.VERIFY_OLD);
    } else {
      setEmailErr(data.message || 'Failed to initiate email change.');
    }
  };

  const handleConfirmOld = async (code) => {
    setEmailErr(''); setEmailMsg('');
    setEmailLoading(true);
    const data = await confirmOldEmail({ userId: user.user_id, code });
    setEmailLoading(false);
    if (data.success) {
      setEmailMsg(data.message);
      setEmailStep(EMAIL_STEP.VERIFY_NEW);
    } else {
      setEmailErr(data.message || 'Invalid code.');
    }
  };

  const handleConfirmNew = async (code) => {
    setEmailErr(''); setEmailMsg('');
    setEmailLoading(true);
    const data = await confirmNewEmail({ userId: user.user_id, code });
    setEmailLoading(false);
    if (data.success) {
      updateSession({ email: data.email }); // Fix 2: reactive update
      setEmailMsg('Email updated successfully!');
      setEmailStep(EMAIL_STEP.DONE);
      pushToast({ type: 'success', title: 'Email updated successfully' });
      setTimeout(() => { setEmailStep(EMAIL_STEP.IDLE); setNewEmail(''); setEmailMsg(''); }, 3000);
    } else {
      setEmailErr(data.message || 'Invalid code.');
    }
  };

  // ── PASSWORD CHANGE ───────────────────────────────────────
  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPwErr(''); setPwMsg('');
    if (!currentPw)            { setPwErr('Please enter your current password.'); return; }
    if (newPw.length < 6)      { setPwErr('New password must be at least 6 characters.'); return; }
    if (!/\d/.test(newPw))     { setPwErr('New password must include at least one number.'); return; }
    if (newPw !== confirmPw)   { setPwErr('New passwords do not match.'); return; }
    setPwLoading(true);
    const data = await updatePassword({ userId: user.user_id, currentPassword: currentPw, newPassword: newPw });
    setPwLoading(false);
    if (data.success) {
      setPwMsg('Password updated successfully.');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      pushToast({ type: 'success', title: 'Password updated' });
      setTimeout(() => setPwMsg(''), 3000);
    } else {
      setPwErr(data.message || 'Failed to update password.');
    }
  };

  const getInitials = (name = '') => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (name[0] || '?').toUpperCase();
  };

  const roleLabel =
    user?.admin_role === 'boss'    ? '👑 Owner / Boss'   :
    user?.admin_role === 'manager' ? '🎛 Ticket Manager' : '🪟 Counter Agent';

  return (
    <DashLayout title="Settings" subtitle="PREFERENCES">
      <div className="sp-root">

        <aside className="sp-nav">
          {SECTIONS.filter(s => s.id !== 'schedule' || isBoss).map(s => (
            <button key={s.id}
              className={`sp-nav-item ${section === s.id ? 'active' : ''}`}
              onClick={() => setSection(s.id)}>
              <span className="sp-nav-icon">{s.icon}</span>
              {s.label}
            </button>
          ))}
        </aside>

        <div className="sp-panel">

          {/* ── PROFILE ── */}
          {section === 'profile' && (
            <div className="sp-section">
              <p className="sp-section-tag">PROFILE</p>
              <h2 className="sp-section-title">Your information</h2>
              <p className="sp-section-sub">Update your display name, email and password.</p>

              <div className="sp-avatar-row">
                <div className="sp-avatar">{getInitials(user?.username ?? '')}</div>
                <div>
                  <p className="sp-avatar-name">{user?.username}</p>
                  <p className="sp-avatar-role">{roleLabel}</p>
                  {user?.service_name && <p className="sp-avatar-service">🏢 {user.service_name}</p>}
                </div>
              </div>

              {/* USERNAME */}
              <div className="sp-profile-block">
                <p className="sp-block-title">USERNAME</p>
                <form className="sp-form" onSubmit={handleSaveUsername}>
                  <div className="sp-field">
                    <label className="sp-label">DISPLAY NAME</label>
                    <input className="sp-input" type="text" value={username}
                      onChange={e => setUsername(e.target.value)} placeholder="Your name" />
                  </div>
                  {usernameErr && <div className="sp-error-banner">⚠ {usernameErr}</div>}
                  {usernameMsg && <div className="sp-saved-banner">✓ {usernameMsg}</div>}
                  <button type="submit" className="sp-btn-primary" disabled={usernameSaving}>
                    {usernameSaving ? '…' : 'Save username'}
                  </button>
                </form>
              </div>

              {/* EMAIL */}
              <div className="sp-profile-block">
                <p className="sp-block-title">EMAIL ADDRESS</p>
                <p className="sp-block-sub">
                  Current: <strong style={{ color: 'var(--text)' }}>{user?.email}</strong>
                </p>

                {emailStep === EMAIL_STEP.IDLE && (
                  <button className="sp-btn-secondary"
                    onClick={() => setEmailStep(EMAIL_STEP.ENTER_NEW)}>
                    Change email address
                  </button>
                )}

                {emailStep === EMAIL_STEP.ENTER_NEW && (
                  <form className="sp-form" onSubmit={handleInitiateEmail}>
                    <div className="sp-field">
                      <label className="sp-label">NEW EMAIL ADDRESS</label>
                      <input className="sp-input" type="email" value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        placeholder="new@gmail.com" autoFocus />
                    </div>
                    {emailErr && <div className="sp-error-banner">⚠ {emailErr}</div>}
                    <div style={{ display:'flex', gap:'10px' }}>
                      <button type="button" className="sp-btn-ghost"
                        onClick={() => { setEmailStep(EMAIL_STEP.IDLE); setEmailErr(''); setNewEmail(''); }}>
                        Cancel
                      </button>
                      <button type="submit" className="sp-btn-primary" disabled={emailLoading}>
                        {emailLoading ? '…' : 'Send verification code'}
                      </button>
                    </div>
                  </form>
                )}

                {emailStep === EMAIL_STEP.VERIFY_OLD && (
                  <div className="sp-otp-block">
                    <p className="sp-otp-hint">
                      Enter the code sent to your <strong>current email</strong> ({user?.email}).
                    </p>
                    {emailMsg && <div className="sp-saved-banner">✓ {emailMsg}</div>}
                    {emailErr && <div className="sp-error-banner">⚠ {emailErr}</div>}
                    <OtpGrid onComplete={handleConfirmOld} disabled={emailLoading} />
                    {emailLoading && <div style={{ textAlign:'center' }}><span className="auth-spinner" /></div>}
                    <button className="sp-btn-ghost" style={{ marginTop:'8px' }}
                      onClick={() => { setEmailStep(EMAIL_STEP.IDLE); setEmailErr(''); setEmailMsg(''); setNewEmail(''); }}>
                      Cancel
                    </button>
                  </div>
                )}

                {emailStep === EMAIL_STEP.VERIFY_NEW && (
                  <div className="sp-otp-block">
                    <p className="sp-otp-hint">
                      Enter the code sent to your <strong>new email</strong> ({newEmail}).
                    </p>
                    {emailMsg && <div className="sp-saved-banner">✓ {emailMsg}</div>}
                    {emailErr && <div className="sp-error-banner">⚠ {emailErr}</div>}
                    <OtpGrid onComplete={handleConfirmNew} disabled={emailLoading} />
                    {emailLoading && <div style={{ textAlign:'center' }}><span className="auth-spinner" /></div>}
                    <button className="sp-btn-ghost" style={{ marginTop:'8px' }}
                      onClick={() => { setEmailStep(EMAIL_STEP.IDLE); setEmailErr(''); setEmailMsg(''); setNewEmail(''); }}>
                      Cancel
                    </button>
                  </div>
                )}

                {emailStep === EMAIL_STEP.DONE && (
                  <div className="sp-saved-banner">✓ {emailMsg}</div>
                )}
              </div>

              {/* PASSWORD */}
              <div className="sp-profile-block">
                <p className="sp-block-title">PASSWORD</p>
                <form className="sp-form" onSubmit={handleSavePassword}>
                  <div className="sp-field">
                    <label className="sp-label">CURRENT PASSWORD</label>
                    <div className="sp-pw-wrap">
                      <input className="sp-input" type={showCurrentPw ? 'text' : 'password'}
                        value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                        placeholder="Your current password" />
                      <button type="button" className="sp-pw-eye"
                        onClick={() => setShowCurrentPw(p => !p)}>
                        {showCurrentPw ? '🙈' : '👁'}
                      </button>
                    </div>
                  </div>
                  <div className="sp-field">
                    <label className="sp-label">NEW PASSWORD</label>
                    <div className="sp-pw-wrap">
                      <input className="sp-input" type={showNewPw ? 'text' : 'password'}
                        value={newPw} onChange={e => setNewPw(e.target.value)}
                        placeholder="Min 6 chars with a number" />
                      <button type="button" className="sp-pw-eye"
                        onClick={() => setShowNewPw(p => !p)}>
                        {showNewPw ? '🙈' : '👁'}
                      </button>
                    </div>
                  </div>
                  <div className="sp-field">
                    <label className="sp-label">CONFIRM NEW PASSWORD</label>
                    <input className="sp-input" type="password"
                      value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                      placeholder="Repeat new password" />
                  </div>
                  {pwErr && <div className="sp-error-banner">⚠ {pwErr}</div>}
                  {pwMsg && <div className="sp-saved-banner">✓ {pwMsg}</div>}
                  <button type="submit" className="sp-btn-primary" disabled={pwLoading}>
                    {pwLoading ? '…' : 'Update password'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ── THEME ── */}
          {section === 'theme' && (
            <div className="sp-section">
              <p className="sp-section-tag">APPEARANCE</p>
              <h2 className="sp-section-title">Theme</h2>
              <p className="sp-section-sub">Changes apply instantly and are saved for your next visit.</p>
              <div className="sp-theme-grid">
                {THEMES.map(t => (
                  <div key={t.id} className={`sp-theme-card ${theme === t.id ? 'active' : ''}`}
                    onClick={() => setTheme(t.id)}>
                    <div className="sp-theme-preview">
                      {t.preview.map((c, i) => <div key={i} className="sp-preview-swatch" style={{ background: c }} />)}
                    </div>
                    <div className="sp-theme-info">
                      <p className="sp-theme-name">{t.label}</p>
                      <p className="sp-theme-desc">{t.desc}</p>
                    </div>
                    {theme === t.id && <span className="sp-theme-check">✓</span>}
                  </div>
                ))}
              </div>
              <div className="sp-theme-confirm">
                <span className="sp-theme-confirm-dot" style={{ background: isDark ? '#666' : '#F59E0B' }} />
                Currently using <strong>{isDark ? 'Dark' : 'Light'}</strong> mode
              </div>
            </div>
          )}

          {/* ── SCHEDULE (boss only) ── */}
          {section === 'schedule' && isBoss && (
            <div className="sp-section">
              <p className="sp-section-tag">SCHEDULE</p>
              <h2 className="sp-section-title">Working hours</h2>
              <p className="sp-section-sub">
                Set your default opening and closing times. Tickets exceeding closing time are carried over.
              </p>
              {schedLoading && <div className="sp-info-box"><span>⏳</span> Loading schedule…</div>}
              {schedError   && <div className="sp-error-banner">⚠ {schedError}</div>}
              {schedSaved   && <div className="sp-saved-banner">✓ {schedSaved}</div>}

              <div className="sch-card">
                <div className="sch-card-head">
                  <div>
                    <p className="sch-card-title">General Schedule</p>
                    <p className="sch-card-sub">Applied to all days without a specific override</p>
                  </div>
                  <div className="sch-toggle">
                    <label className="sch-toggle-label">
                      <input type="checkbox" checked={editGeneral.is_open}
                        onChange={e => setEditGeneral(p => ({ ...p, is_open: e.target.checked }))} />
                      <span className="sch-toggle-track" />
                      <span className="sch-toggle-text">{editGeneral.is_open ? 'Open' : 'Closed'}</span>
                    </label>
                  </div>
                </div>
                {editGeneral.is_open && (
                  <div className="sch-fields">
                    <div className="sch-field">
                      <label className="sch-label">OPENING TIME</label>
                      <input type="time" className="sch-input" value={editGeneral.opening_time}
                        onChange={e => setEditGeneral(p => ({ ...p, opening_time: e.target.value }))} />
                    </div>
                    <div className="sch-field">
                      <label className="sch-label">CLOSING TIME</label>
                      <input type="time" className="sch-input" value={editGeneral.closing_time}
                        onChange={e => setEditGeneral(p => ({ ...p, closing_time: e.target.value }))} />
                    </div>
                  </div>
                )}
                <button className="sp-btn-primary" onClick={handleSaveGeneral}>Save general schedule</button>
              </div>

              <div className="sch-section-title">Day Overrides</div>
              <p className="sch-section-sub">Set different hours or mark specific days as closed.</p>
              <div className="sch-days-grid">
                {DAY_NAMES.map((dayName, dow) => {
                  const ov            = overrides[dow];
                  const isEditingThis = editDay?.dow === dow;
                  return (
                    <div key={dow} className={`sch-day-card ${ov ? 'overridden' : ''} ${isEditingThis ? 'editing' : ''}`}>
                      <div className="sch-day-head">
                        <span className="sch-day-name">{dayName}</span>
                        <div className="sch-day-badges">
                          {ov
                            ? <span className={`sch-day-badge ${ov.is_open ? 'open' : 'closed'}`}>
                                {ov.is_open ? `${ov.opening_time}–${ov.closing_time}` : 'Closed'}
                              </span>
                            : <span className="sch-day-badge default">General</span>
                          }
                        </div>
                      </div>
                      {isEditingThis ? (
                        <div className="sch-day-edit">
                          <label className="sch-toggle-label" style={{ marginBottom:'12px' }}>
                            <input type="checkbox" checked={editDay.is_open}
                              onChange={e => setEditDay(p => ({ ...p, is_open: e.target.checked }))} />
                            <span className="sch-toggle-track" />
                            <span className="sch-toggle-text">{editDay.is_open ? 'Open' : 'Closed'}</span>
                          </label>
                          {editDay.is_open && (
                            <div className="sch-fields sch-fields--compact">
                              <div className="sch-field">
                                <label className="sch-label">OPEN</label>
                                <input type="time" className="sch-input" value={editDay.opening_time}
                                  onChange={e => setEditDay(p => ({ ...p, opening_time: e.target.value }))} />
                              </div>
                              <div className="sch-field">
                                <label className="sch-label">CLOSE</label>
                                <input type="time" className="sch-input" value={editDay.closing_time}
                                  onChange={e => setEditDay(p => ({ ...p, closing_time: e.target.value }))} />
                              </div>
                            </div>
                          )}
                          <div className="sch-day-actions">
                            <button className="sch-btn-save" onClick={handleSaveDay}>Save</button>
                            <button className="sch-btn-cancel" onClick={() => setEditDay(null)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="sch-day-btns">
                          <button className="sch-btn-edit"
                            onClick={() => setEditDay({
                              dow,
                              is_open:      ov ? ov.is_open      : (editGeneral.is_open ?? true),
                              opening_time: ov ? ov.opening_time : editGeneral.opening_time,
                              closing_time: ov ? ov.closing_time : editGeneral.closing_time,
                              avg_duration: ov ? ov.avg_duration : editGeneral.avg_duration,
                            })}>
                            {ov ? '✏ Edit' : '+ Override'}
                          </button>
                          {ov && (
                            <button className="sch-btn-delete" onClick={() => handleDeleteDay(dow)}>
                              ✕ Remove
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── ACCOUNT ── */}
          {section === 'account' && (
            <div className="sp-section">
              <p className="sp-section-tag">ACCOUNT</p>
              <h2 className="sp-section-title">Account actions</h2>
              <p className="sp-section-sub">Actions here affect your session and access.</p>
              <div className="sp-danger-card">
                <div className="sp-danger-info">
                  <p className="sp-danger-title">Sign out</p>
                  <p className="sp-danger-desc">End your current session. You will need to log in again.</p>
                </div>
                <button className="sp-btn-logout" onClick={() => setShowLogout(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Sign out
                </button>
              </div>

              {(() => {
                const meta = PUSH_UI[push?.status] || PUSH_UI.not_configured;
                return (
                  <div className="sp-danger-card" style={{ marginTop:'14px', borderColor:`${meta.color}66` }}>
                    <div className="sp-danger-info">
                      <p className="sp-danger-title">
                        Push notifications:{' '}
                        <span style={{ color: meta.color }}>{meta.icon} {push ? meta.label : 'Checking…'}</span>
                      </p>
                      <p className="sp-danger-desc">
                        {push?.status === 'working'        && 'The server can reach Firebase — phone notifications will be delivered.'}
                        {push?.status === 'configured'     && 'Project ID and credentials are set. Click “Test now” to confirm the server can actually reach Firebase.'}
                        {push?.status === 'misconfigured'  && (push?.error || 'Configured, but the server could not authenticate with Firebase.')}
                        {push?.status === 'not_configured' && 'Set FCM_PROJECT_ID and GOOGLE_APPLICATION_CREDENTIALS (or FCM_CREDENTIALS_JSON) on the server to enable phone push.'}
                        {push?.status === 'error'          && (push?.error || 'Could not reach the server.')}
                        {!push && 'Checking push configuration…'}
                      </p>
                      {push && (
                        <p className="sp-danger-desc" style={{ opacity:.7, marginTop:'6px', fontSize:'12px' }}>
                          Project&nbsp;ID: {push.project_id_set ? 'set' : 'missing'} ·
                          credentials: {push.credentials_set ? (push.credentials_source || 'set') : 'missing'} ·
                          google-auth: {push.google_auth_installed ? 'installed' : 'missing'} ·
                          registered devices: {push.device_tokens ?? '—'}
                          {typeof push.my_device_tokens === 'number' && ` (yours: ${push.my_device_tokens})`}
                        </p>
                      )}
                    </div>
                    <button className="sp-btn-logout" disabled={pushBusy}
                      style={{ background: meta.color, color:'#fff' }}
                      onClick={() => loadPush(true)}>
                      {pushBusy ? 'Testing…' : 'Test now'}
                    </button>
                  </div>
                );
              })()}

              {isBoss && (
                <div className="sp-danger-card" style={{ borderColor:'rgba(220,15,15,0.4)', marginTop:'14px' }}>
                  <div className="sp-danger-info">
                    <p className="sp-danger-title" style={{ color:'var(--crimson)' }}>Delete service</p>
                    <p className="sp-danger-desc">
                      Permanently delete this service and everything in it — queues, tickets,
                      team members and schedule. This cannot be undone.
                    </p>
                  </div>
                  <button className="sp-btn-logout" style={{ background:'var(--crimson)', color:'#fff' }}
                    onClick={() => { setDeleteErr(''); setShowDeleteService(true); }}>
                    Delete service
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showLogout && (
        <div className="sp-overlay" onClick={() => setShowLogout(false)}>
          <div className="sp-modal" onClick={e => e.stopPropagation()}>
            <p className="sp-modal-icon">👋</p>
            <h2 className="sp-modal-title">Sign out?</h2>
            <p className="sp-modal-sub">You will be redirected to the login page.</p>
            <div className="sp-modal-actions">
              <button className="sp-btn-ghost"  onClick={() => setShowLogout(false)}>Cancel</button>
              <button className="sp-btn-logout" onClick={logout}>Yes, sign out</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteService && (
        <div className="sp-overlay" onClick={() => setShowDeleteService(false)}>
          <div className="sp-modal" onClick={e => e.stopPropagation()}>
            <p className="sp-modal-icon">🗑</p>
            <h2 className="sp-modal-title">Delete this service?</h2>
            <p className="sp-modal-sub">
              This permanently removes the service and ALL its queues, tickets, team
              members and schedule. This cannot be undone.
            </p>
            {deleteErr && (
              <div className="auth-error" style={{ marginBottom:'10px' }}>⚠ {deleteErr}</div>
            )}
            <div className="sp-modal-actions">
              <button className="sp-btn-ghost" onClick={() => setShowDeleteService(false)}>Cancel</button>
              <button className="sp-btn-logout" style={{ background:'var(--crimson)', color:'#fff' }}
                disabled={deletingService} onClick={handleDeleteService}>
                {deletingService ? 'Deleting…' : 'Delete forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashLayout>
  );
}