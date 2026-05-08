import { useState } from 'react';
import DashLayout     from '../components/DashboardLayout';
import { useSession } from '../hooks/useSession';
import { useTheme }   from '../context/ThemeContext';
import '../styles/settings.css';

// =============================================================
// SETTINGS PAGE
// Features:
//   - Profile: view + edit username, email, password
//   - Theme: dark / light — wired to ThemeContext, persists to
//     localStorage, instantly applies across the entire app
//   - Account: logout with confirmation modal
// OOP Principle: Encapsulation, Single Responsibility,
//               Observer Pattern (useTheme hook)
// =============================================================

const SECTIONS = [
  { id: 'profile', icon: '👤', label: 'Profile'  },
  { id: 'theme',   icon: '🎨', label: 'Theme'    },
  { id: 'account', icon: '⚠️', label: 'Account'  },
];

const THEMES = [
  {
    id:      'dark',
    label:   'Dark',
    desc:    'Dark background, crimson accent — easy on the eyes at night',
    preview: ['#0A0A0A', '#141414', '#DC0F0F'],
  },
  {
    id:      'light',
    label:   'Light',
    desc:    'Light background, crimson accent — clean and sharp in daylight',
    preview: ['#F2F2F2', '#FFFFFF', '#DC0F0F'],
  },
];

export default function SettingsPage() {
  const { user, logout }           = useSession();
  const { theme, setTheme, isDark } = useTheme();   // ← real context

  const [section,    setSection]    = useState('profile');
  const [username,   setUsername]   = useState(user?.username ?? '');
  const [email,      setEmail]      = useState(user?.email    ?? '');
  const [saved,      setSaved]      = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  const getInitials = (name = '') => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (name[0] || '?').toUpperCase();
  };

  const roleLabel =
    user?.admin_role === 'boss'    ? '👑 Owner / Boss'   :
    user?.admin_role === 'manager' ? '🎛 Ticket Manager' : '🪟 Counter Agent';

  const handleSave = (e) => {
    e.preventDefault();
    // Placeholder — will POST to /api/profile when backend is ready
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <DashLayout title="Settings" subtitle="PREFERENCES">
      <div className="sp-root">

        {/* LEFT NAV */}
        <aside className="sp-nav">
          {SECTIONS.map(s => (
            <button key={s.id}
              className={`sp-nav-item ${section === s.id ? 'active' : ''}`}
              onClick={() => setSection(s.id)}>
              <span className="sp-nav-icon">{s.icon}</span>
              {s.label}
            </button>
          ))}
        </aside>

        {/* RIGHT PANEL */}
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
                  {user?.service_name && (
                    <p className="sp-avatar-service">🏢 {user.service_name}</p>
                  )}
                </div>
              </div>

              <form className="sp-form" onSubmit={handleSave}>
                <div className="sp-field">
                  <label className="sp-label">DISPLAY NAME</label>
                  <input className="sp-input" type="text"
                    value={username} onChange={e => setUsername(e.target.value)}
                    placeholder="Your name" />
                </div>
                <div className="sp-field">
                  <label className="sp-label">EMAIL ADDRESS</label>
                  <input className="sp-input" type="email"
                    value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com" />
                </div>
                <div className="sp-field">
                  <label className="sp-label">NEW PASSWORD</label>
                  <input className="sp-input" type="password"
                    placeholder="Leave blank to keep current" />
                </div>

                {saved && (
                  <div className="sp-saved-banner">✓ Changes saved successfully</div>
                )}

                <button type="submit" className="sp-btn-primary">Save changes</button>
              </form>
            </div>
          )}

          {/* ── THEME ── */}
          {section === 'theme' && (
            <div className="sp-section">
              <p className="sp-section-tag">APPEARANCE</p>
              <h2 className="sp-section-title">Theme</h2>
              <p className="sp-section-sub">
                Changes apply instantly across the entire app and are saved for your next visit.
              </p>

              <div className="sp-theme-grid">
                {THEMES.map(t => (
                  <div key={t.id}
                    className={`sp-theme-card ${theme === t.id ? 'active' : ''}`}
                    onClick={() => setTheme(t.id)}>

                    {/* Colour preview swatches */}
                    <div className="sp-theme-preview">
                      {t.preview.map((c, i) => (
                        <div key={i} className="sp-preview-swatch"
                          style={{ background: c }} />
                      ))}
                    </div>

                    <div className="sp-theme-info">
                      <p className="sp-theme-name">{t.label}</p>
                      <p className="sp-theme-desc">{t.desc}</p>
                    </div>

                    {/* Active indicator */}
                    {theme === t.id && (
                      <span className="sp-theme-check">✓</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Live confirmation */}
              <div className="sp-theme-confirm">
                <span className="sp-theme-confirm-dot"
                  style={{ background: isDark ? '#666' : '#F59E0B' }} />
                Currently using <strong>{isDark ? 'Dark' : 'Light'}</strong> mode
              </div>
            </div>
          )}

          {/* ── ACCOUNT ── */}
          {section === 'account' && (
            <div className="sp-section">
              <p className="sp-section-tag">ACCOUNT</p>
              <h2 className="sp-section-title">Account actions</h2>
              <p className="sp-section-sub">
                Actions here affect your session and access.
              </p>

              <div className="sp-danger-card">
                <div className="sp-danger-info">
                  <p className="sp-danger-title">Sign out</p>
                  <p className="sp-danger-desc">
                    End your current session. You will need to log in again
                    to access the dashboard.
                  </p>
                </div>
                <button className="sp-btn-logout" onClick={() => setShowLogout(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2">
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

      {/* LOGOUT CONFIRM MODAL */}
      {showLogout && (
        <div className="sp-overlay" onClick={() => setShowLogout(false)}>
          <div className="sp-modal" onClick={e => e.stopPropagation()}>
            <p className="sp-modal-icon">👋</p>
            <h2 className="sp-modal-title">Sign out?</h2>
            <p className="sp-modal-sub">
              You will be redirected to the login page.
            </p>
            <div className="sp-modal-actions">
              <button className="sp-btn-ghost" onClick={() => setShowLogout(false)}>
                Cancel
              </button>
              <button className="sp-btn-logout" onClick={logout}>
                Yes, sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </DashLayout>
  );
}