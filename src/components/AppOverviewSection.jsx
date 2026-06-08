// ============================================================
// AppOverviewSection.jsx
// Imported in LandingPage.jsx — wrapped in <div id="web-app">
// ============================================================

// ============================================================
// ✏️ WEB APP — three roles. Edit label, description per role.
// ============================================================
const WEB_ROLES = [
  {
    icon: '👑',
    title: 'Boss Admin',
    color: '#7C3AED',
    colorBg: 'rgba(124,58,237,0.08)',
    colorBorder: 'rgba(124,58,237,0.25)',
    description:
      'Full system control. Creates and manages services, counters, and staff accounts. Views analytics across all queues and has access to every configuration setting.',
    perks: ['Manage all services & counters', 'Create manager & agent accounts', 'View system-wide analytics', 'Full configuration access'],
  },
  {
    icon: '🗂️',
    title: 'Manager',
    color: '#0369A1',
    colorBg: 'rgba(3,105,161,0.08)',
    colorBorder: 'rgba(3,105,161,0.25)',
    description:
      'Oversees daily operations for assigned services. Monitors queue activity, manages agents under their service, and generates reports.',
    perks: ['Monitor live queue activity', 'Manage agents in their service', 'Open & close service sessions', 'Generate service reports'],
  },
  {
    icon: '🎫',
    title: 'Agent',
    color: '#0F766E',
    colorBg: 'rgba(15,118,110,0.08)',
    colorBorder: 'rgba(15,118,110,0.25)',
    description:
      'Handles ticket processing at the counter. Calls the next ticket, marks customers as served or absent, and manages their counter in real time.',
    perks: ['Call next ticket', 'Mark tickets served / absent', 'Manage personal counter', 'View queue in real time'],
  },
];

// ============================================================
// ✏️ MOBILE APP — features list. Edit or add items freely.
// ============================================================
const MOBILE_FEATURES = [
  {
    icon: '🎟️',
    title: 'Join a Queue',
    description: 'Scan a QR code or browse available services to instantly get a digital ticket. Track your position live without standing in line.',
  },
  {
    icon: '🏢',
    title: 'View Services',
    description: 'Browse all areas that use the ticketing queue system — hospitals, banks, government offices, and more — and see wait times before joining.',
  },
  {
    icon: '🔔',
    title: 'Real-time Updates',
    description: 'Get notified as your turn approaches. The app updates your position live so you never miss your call.',
  },
  {
    icon: '📋',
    title: 'Ticket History',
    description: 'View all your past and active tickets across different services in one place.',
  },
  // ──  ADD MORE FEATURES: copy a block above and paste here ──
];

// ============================================================
//  SCREENSHOTS — replace the placeholder strings with your
// actual image paths once you have screenshots ready.
//
// Put screenshots in:  public/screenshots/
// Example path:        "/screenshots/web-dashboard.png"
//
// WEB screenshots: show the admin/manager/agent dashboards
// MOBILE screenshots: show the ticket screen, service list, etc.
// ============================================================
const WEB_SCREENSHOTS = [
  { src: '/team/counter.jpg', label: 'Admin Dashboard' },       // ← replace src with "/screenshots/web-admin.png"
  { src: '/team/create.jpg', label: 'Queue Management' },      // ← replace src with "/screenshots/web-queue.png"
  { src: '/team/Analytics.jpg', label: 'Analytics Overview' },    // ← replace src with "/screenshots/web-analytics.png"
];

const MOBILE_SCREENSHOTS = [
  { src: '/team/Join.jpg', label: 'Join a Queue' },          // ← replace src with "/screenshots/mobile-join.png"
  { src: '/team/Services.jpg', label: 'View Services' },         // ← replace src with "/screenshots/mobile-services.png"
  { src: '/team/Notif.jpg', label: 'notifictions' },             // ← replace src with "/screenshots/mobile-ticket.png"
];

// ── Helpers ───────────────────────────────────────────────

// Screenshot placeholder — shown when src is empty
// Sized to match the real screenshot dimensions so layout won't shift on upload
function ScreenPlaceholder({ label, mobile }) {
  return (
    <div style={{
      width: mobile ? '160px' : '100%',
      minWidth: mobile ? '160px' : undefined,
      height: mobile ? '300px' : '240px',
      borderRadius: mobile ? '20px' : '14px',
      background: 'rgba(255,255,255,0.03)',
      border: '2px dashed rgba(255,255,255,0.12)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      color: 'rgba(255,255,255,0.4)',
      fontSize: '13px',
      textAlign: 'center',
      padding: '16px',
      boxSizing: 'border-box',
      flexShrink: 0,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Corner decoration */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: '32px', height: '32px',
        borderTop: '2px solid rgba(220,15,15,0.35)',
        borderLeft: '2px solid rgba(220,15,15,0.35)',
        borderRadius: '14px 0 0 0',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, right: 0,
        width: '32px', height: '32px',
        borderBottom: '2px solid rgba(220,15,15,0.35)',
        borderRight: '2px solid rgba(220,15,15,0.35)',
        borderRadius: '0 0 14px 0',
      }} />

      <span style={{ fontSize: '32px', opacity: 0.5 }}>{mobile ? '📱' : '🖥️'}</span>
      <div>
        {/* ✏️ This label comes from the arrays above */}
        <div style={{ fontWeight: '600', marginBottom: '4px', color: 'rgba(255,255,255,0.55)' }}>{label}</div>
        <div style={{ fontSize: '11px', opacity: 0.5 }}>Screenshot coming soon</div>
      </div>
    </div>
  );
}

// Web screenshot item
function WebShot({ item }) {
  return item.src ? (
    <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
      <img src={item.src} alt={item.label} style={{ width: '100%', display: 'block' }} />
      <p style={{ margin: 0, padding: '8px 14px', fontSize: '13px', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.04)' }}>{item.label}</p>
    </div>
  ) : (
    <div>
      <ScreenPlaceholder label={item.label} mobile={false} />
      <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>{item.label}</p>
    </div>
  );
}

// Mobile screenshot item
function MobileShot({ item }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      {item.src ? (
        <img src={item.src} alt={item.label} style={{
          width: '160px', height: '300px', objectFit: 'cover',
          borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)',
        }} />
      ) : (
        <ScreenPlaceholder label={item.label} mobile={true} />
      )}
      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>{item.label}</span>
    </div>
  );
}

// Section heading helper
function SectionHeading({ badge, title, sub }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '52px' }}>
      <span style={{
        display: 'inline-block', padding: '4px 14px', borderRadius: '99px',
        fontSize: '12px', fontWeight: '600', letterSpacing: '0.6px',
        background: 'rgba(220,15,15,0.10)', color: '#DC0F0F',
        border: '1px solid rgba(220,15,15,0.25)', marginBottom: '16px',
        textTransform: 'uppercase',
      }}>{badge}</span>
      <h2 style={{
        fontSize: 'clamp(26px,3.5vw,38px)', fontWeight: '700',
        letterSpacing: '-0.6px', color: '#F0F0F0', margin: '0 0 14px',
      }}>{title}</h2>
      {sub && <p style={{ fontSize: '15px', color: '#888', maxWidth: '540px', margin: '0 auto', lineHeight: '1.7' }}>{sub}</p>}
    </div>
  );
}

// ── Main exported component ────────────────────────────────
export default function AppOverviewSection() {
  return (
    <div style={{ width: '100%' }}>

      {/* ════════════════════════════════════════════════════
          WEB APP SECTION
      ════════════════════════════════════════════════════ */}
      <section style={{
        padding: '96px 32px 64px',
        maxWidth: '1100px',
        margin: '0 auto',
      }}>
        <SectionHeading
          badge="Web Application"
          title="Three roles. One powerful platform."
          sub="The Tickety web app gives every stakeholder the right tools — from full system control down to counter-level ticket processing."
        />

        {/* Role cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '64px',
        }}>
          {WEB_ROLES.map(role => (
            <div key={role.title} style={{
              background: '#141414',
              border: `1px solid ${role.colorBorder}`,
              borderTop: `4px solid ${role.color}`,
              borderRadius: '16px',
              padding: '28px 24px',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>{role.icon}</div>
              <h3 style={{
                margin: '0 0 4px', fontSize: '18px', fontWeight: '700',
                color: role.color,
              }}>{role.title}</h3>
              <p style={{
                margin: '0 0 16px', fontSize: '14px', lineHeight: '1.65',
                color: '#aaa',
              }}>{role.description}</p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {role.perks.map(p => (
                  <li key={p} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    fontSize: '13px', color: '#ccc',
                  }}>
                    <span style={{
                      width: '18px', height: '18px', borderRadius: '50%',
                      background: role.colorBg, color: role.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', flexShrink: 0,
                    }}>✓</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Web screenshots ── */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '20px',
          padding: '40px',
          border: '1px solid rgba(255,255,255,0.07)',
        }}>
          <p style={{
            margin: '0 0 8px', fontSize: '13px', fontWeight: '600',
            letterSpacing: '0.8px', color: '#DC0F0F', textTransform: 'uppercase',
          }}>
            Web App Screenshots
          </p>
          <p style={{
            margin: '0 0 28px', fontSize: '13px', color: 'rgba(255,255,255,0.35)',
          }}>
            Replace the placeholders below with real screenshots once they are ready.
            {/* ✏️ To add a screenshot, set the src field in WEB_SCREENSHOTS above */}
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
          }}>
            {WEB_SCREENSHOTS.map(item => (
              <WebShot key={item.label} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 32px' }} />

      {/* ════════════════════════════════════════════════════
          MOBILE APP SECTION
      ════════════════════════════════════════════════════ */}
      <section id="mobile-app" style={{
        padding: '96px 32px',
        maxWidth: '1100px',
        margin: '0 auto',
      }}>
        <SectionHeading
          badge="Mobile Application"
          title="Your queue, in your pocket."
          sub="Customers use the Tickety mobile app to join queues digitally, track their position live, and never waste time waiting in line again."
        />

        {/* Feature grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '64px',
        }}>
          {MOBILE_FEATURES.map(feat => (
            <div key={feat.title} style={{
              background: '#141414',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px',
              padding: '24px 20px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>{feat.icon}</div>
              <h3 style={{
                margin: '0 0 8px', fontSize: '16px', fontWeight: '700',
                color: '#F0F0F0',
              }}>{feat.title}</h3>
              <p style={{
                margin: 0, fontSize: '14px', lineHeight: '1.65',
                color: '#888',
              }}>{feat.description}</p>
            </div>
          ))}
        </div>

        {/* ── Mobile screenshots ── */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '20px',
          padding: '40px',
          border: '1px solid rgba(255,255,255,0.07)',
        }}>
          <p style={{
            margin: '0 0 8px', fontSize: '13px', fontWeight: '600',
            letterSpacing: '0.8px', color: '#DC0F0F', textTransform: 'uppercase',
          }}>
            Mobile App Screenshots
          </p>
          <p style={{
            margin: '0 0 28px', fontSize: '13px', color: 'rgba(255,255,255,0.35)',
          }}>
            Replace the placeholders below with real screenshots once they are ready.
            {/* ✏️ To add a screenshot, set the src field in MOBILE_SCREENSHOTS above */}
          </p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '28px',
            justifyContent: 'center',
          }}>
            {MOBILE_SCREENSHOTS.map(item => (
              <MobileShot key={item.label} item={item} />
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
