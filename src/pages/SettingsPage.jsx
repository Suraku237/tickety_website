import { useState, useEffect } from 'react';
import DashLayout     from '../components/DashboardLayout';
import { useSession } from '../hooks/useSession';
import { useTheme }   from '../context/ThemeContext';
import {
  getSchedule,
  setGeneralSchedule,
  setDaySchedule,
  deleteDaySchedule,
} from '../services/api.service';
import '../styles/settings.css';

// =============================================================
// SETTINGS PAGE
// Sections: Profile | Theme | Schedule | Account
// Schedule section is boss-only.
// OOP Principle: Encapsulation, Single Responsibility
// =============================================================

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

const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const EMPTY_SCHED = { is_open: true, opening_time: '08:00', closing_time: '17:00', avg_duration: 10 };

export default function SettingsPage() {
  const { user, logout }            = useSession();
  const { theme, setTheme, isDark } = useTheme();

  const [section,     setSection]     = useState('profile');
  const [username,    setUsername]     = useState(user?.username ?? '');
  const [email,       setEmail]        = useState(user?.email    ?? '');
  const [saved,       setSaved]        = useState(false);
  const [showLogout,  setShowLogout]   = useState(false);

  // Schedule state
  const [general,     setGeneral]      = useState(null);
  const [overrides,   setOverrides]    = useState({});   // { day_of_week: schedule_row }
  const [schedLoading, setSchedLoading] = useState(false);
  const [schedSaved,   setSchedSaved]   = useState('');
  const [schedError,   setSchedError]   = useState('');
  const [editGeneral,  setEditGeneral]  = useState({ ...EMPTY_SCHED });
  const [editDay,      setEditDay]      = useState(null);  // { dow: int, ...fields }

  const isBoss = user?.admin_role === 'boss';

  useEffect(() => {
    if (section === 'schedule' && isBoss && user?.service_id) {
      loadSchedule();
    }
  }, [section]);

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

  const getInitials = (name = '') => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (name[0] || '?').toUpperCase();
  };

  const roleLabel =
    user?.admin_role === 'boss'    ? '👑 Owner / Boss'   :
    user?.admin_role === 'manager' ? '🎛 Ticket Manager' : '🪟 Counter Agent';

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <DashLayout title="Settings" subtitle="PREFERENCES">
      <div className="sp-root">

        {/* LEFT NAV */}
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
                <div className="sp-avatar">{getInitials(username)}</div>
                <div>
                  <p className="sp-avatar-name">{username}</p>
                  <p className="sp-avatar-role">{roleLabel}</p>
                  {user?.service_name && <p className="sp-avatar-service">🏢 {user.service_name}</p>}
                </div>
              </div>
              <form className="sp-form" onSubmit={handleSaveProfile}>
                <div className="sp-field">
                  <label className="sp-label">DISPLAY NAME</label>
                  <input className="sp-input" type="text" value={username}
                    onChange={e => setUsername(e.target.value)} placeholder="Your name" />
                </div>
                <div className="sp-field">
                  <label className="sp-label">EMAIL ADDRESS</label>
                  <input className="sp-input" type="email" value={email}
                    onChange={e => setEmail(e.target.value)} placeholder="you@company.com" />
                </div>
                <div className="sp-field">
                  <label className="sp-label">NEW PASSWORD</label>
                  <input className="sp-input" type="password" placeholder="Leave blank to keep current" />
                </div>
                {saved && <div className="sp-saved-banner">✓ Changes saved successfully</div>}
                <button type="submit" className="sp-btn-primary">Save changes</button>
              </form>
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
                Set your default opening and closing times. Override individual days as needed.
                Tickets whose estimated serve time exceeds closing time will be carried over to the next day.
              </p>

              {schedLoading && <div className="sp-info-box"><span>⏳</span> Loading schedule…</div>}
              {schedError   && <div className="sp-error-banner">⚠ {schedError}</div>}
              {schedSaved   && <div className="sp-saved-banner">✓ {schedSaved}</div>}

              {/* GENERAL SCHEDULE */}
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
                    <div className="sch-field">
                      <label className="sch-label">AVG DURATION (min/ticket)</label>
                      <input type="number" min="1" max="60" className="sch-input"
                        value={editGeneral.avg_duration}
                        onChange={e => setEditGeneral(p => ({ ...p, avg_duration: parseInt(e.target.value) || 10 }))} />
                    </div>
                  </div>
                )}

                <button className="sp-btn-primary" onClick={handleSaveGeneral}>
                  Save general schedule
                </button>
              </div>

              {/* DAY OVERRIDES */}
              <div className="sch-section-title">Day Overrides</div>
              <p className="sch-section-sub">
                Click a day to set different hours or mark it as closed.
                Days without an override use the general schedule above.
              </p>

              <div className="sch-days-grid">
                {DAY_NAMES.map((dayName, dow) => {
                  const ov      = overrides[dow];
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
                          <label className="sch-toggle-label" style={{ marginBottom: '12px' }}>
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
                              <div className="sch-field">
                                <label className="sch-label">AVG (min)</label>
                                <input type="number" min="1" max="60" className="sch-input"
                                  value={editDay.avg_duration}
                                  onChange={e => setEditDay(p => ({ ...p, avg_duration: parseInt(e.target.value) || 10 }))} />
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
                              dow:          dow,
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
    </DashLayout>
  );
}