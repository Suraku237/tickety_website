// ============================================================
// AboutSection.jsx
// Drop this file into:  src/components/AboutSection.jsx
//
// Then in your LandingPage.jsx, import and use it like this:
//
//   import AboutSection from '../components/AboutSection';
//   ...
//   <AboutSection />
//
// OOP Principle: Single Responsibility — this component owns
// only the "About the Team" UI; data lives in TEAM_MEMBERS below.
// ============================================================

import { useState } from 'react';

// ============================================================
// 
// Fields:
//   name        — full name displayed on the card
//   role        — your role / title in the project
//   photo       — path to the member's photo.
//                 Put images in:  public/team/
//                 Example value:  "/team/alice.jpg"
//                 Leave as ""     to show the initials avatar instead.
//   initials    — 2-letter fallback shown when photo is missing
//   contribution — short sentence describing what you built
//   color       — avatar background accent when no photo is set.
//                 Choose from: "purple" | "teal" | "coral" | "blue"
// ============================================================
const TEAM_MEMBERS = [
  {
    name: 'Kwete Ngnouba Junior Rayan',
    role: 'Backend Developer',
    photo: '/team/RN.jpg',                        
    initials: 'RN',
    contribution: 'Designed and implemented the REST API, managed queue processing logic, and integrated backend services with the database.',
    color: 'purple',
  },
  {
    name: 'Bissekie Ndongo Andre Marie',
    role: 'Backend Developer',
    photo: '/team/BN.jpg',                       
    initials: 'BN',
    contribution: 'Built the Flutter mobile app including QR code scanning, ticket flows, and OTP authentication.',
    color: 'teal',
  },
  {
    name: 'Amina Boubakary',
    role: 'Scrum Master/Frontend & UI/UX',
    photo: '/team/AM.jpg',                       
    initials: 'AM',
    contribution: 'Coordinated the development process, managed team workflows, and designed intuitive user interfaces and user experiences',
    color: 'coral',
  },
  {
    name: 'Djemtchimo Nkoui Bruno JonatanMohamadou Bachirou',
    role: 'Full Stack Engineer',
    photo: '/team/BR.jpg',    
    initials: 'BR',                   
    contribution: 'Worked across both frontend and backend development, integrating APIs, implementing features, and ensuring seamless system functionality.',
    color: 'purple',
  },
  {
    name: 'Mohamadou Bachirou',
    role: 'Frontend & UI/UX',
    photo: '/team/MB.jpg',                       
    initials: 'MB',
    contribution: 'Designed responsive user interfaces, created wireframes and prototypes, and enhanced the overall user experience of the application',
    color: 'blue',
  },
  // ── ADD MORE MEMBERS: copy the block above and paste here ──
];

// ============================================================
// ✏️  EDIT THIS — text content for the section header
// ============================================================
const SECTION_COPY = {
  badge: 'The Team',                                       // small label above the heading
  heading: 'Built by students, for everyone',              // main heading
  subheading:                                              // paragraph below heading
    'Tickety was crafted as a final-year project at The ICT University. ' +
    'Each member owned a slice of the product from design to deployment.',
};

// ============================================================
// COLOR MAP — maps the "color" field above to CSS values.
// You usually don't need to edit this.
// ============================================================
const COLOR_MAP = {
  purple: { bg: '#EEEDFE', text: '#3C3489', border: '#AFA9EC' },
  teal:   { bg: '#E1F5EE', text: '#085041', border: '#5DCAA5' },
  coral:  { bg: '#FAECE7', text: '#712B13', border: '#F0997B' },
  blue:   { bg: '#E6F1FB', text: '#0C447C', border: '#85B7EB' },
};

// ── Individual member card ─────────────────────────────────
function MemberCard({ member }) {
  const [imgError, setImgError] = useState(false);
  const accent = COLOR_MAP[member.color] ?? COLOR_MAP.purple;
  const showPhoto = member.photo && !imgError;

  return (
    <article style={{
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '28px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '14px',
      textAlign: 'center',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}
    >
      {/* ── Avatar ── */}
      {showPhoto ? (
        <img
          src={member.photo}
          alt={member.name}
          onError={() => setImgError(true)}
          style={{
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: `3px solid ${accent.border}`,
          }}
        />
      ) : (
        // Initials avatar — shown when photo is missing or fails to load
        <div style={{
          width: '88px',
          height: '88px',
          borderRadius: '50%',
          background: accent.bg,
          border: `3px solid ${accent.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '26px',
          fontWeight: '600',
          color: accent.text,
          userSelect: 'none',
        }}>
          {member.initials}
        </div>
      )}

      {/* ── Name & role ── */}
      <div>
        <h3 style={{
          margin: '0 0 4px',
          fontSize: '17px',
          fontWeight: '600',
          color: 'var(--text-h)',
        }}>
          {member.name}
        </h3>
        {/*  Role badge color follows the member's color field */}
        <span style={{
          display: 'inline-block',
          padding: '3px 12px',
          borderRadius: '99px',
          fontSize: '12px',
          fontWeight: '500',
          background: accent.bg,
          color: accent.text,
          border: `1px solid ${accent.border}`,
        }}>
          {member.role}
        </span>
      </div>

      {/* ── Contribution text ── */}
      <p style={{
        margin: 0,
        fontSize: '14px',
        lineHeight: '1.6',
        color: 'var(--text)',
      }}>
        {member.contribution}
      </p>
    </article>
  );
}

// ── Main exported component ────────────────────────────────
export default function AboutSection() {
  return (
    // ✏️ You can change the section id here if needed
    <section
      id="about"
      style={{
        padding: '96px 32px',
        maxWidth: '1100px',
        margin: '0 auto',
      }}
    >
      {/* ── Section header ── */}
      <div style={{ marginBottom: '56px', textAlign: 'center' }}>

        {/*  Badge — edit SECTION_COPY.badge above */}
        <span style={{
          display: 'inline-block',
          padding: '4px 14px',
          borderRadius: '99px',
          fontSize: '13px',
          fontWeight: '500',
          background: 'rgba(170,59,255,0.08)',
          color: 'var(--accent)',
          border: '1px solid rgba(170,59,255,0.3)',
          marginBottom: '16px',
          letterSpacing: '0.4px',
        }}>
          {SECTION_COPY.badge}
        </span>

        {/*  Heading — edit SECTION_COPY.heading above */}
        <h2 style={{
          fontSize: 'clamp(28px, 4vw, 42px)',
          fontWeight: '700',
          letterSpacing: '-0.8px',
          color: 'var(--text-h)',
          margin: '0 0 16px',
        }}>
          {SECTION_COPY.heading}
        </h2>

        {/*  Subheading — edit SECTION_COPY.subheading above */}
        <p style={{
          fontSize: '16px',
          lineHeight: '1.7',
          color: 'var(--text)',
          maxWidth: '540px',
          margin: '0 auto',
        }}>
          {SECTION_COPY.subheading}
        </p>
      </div>

      {/* ── Member cards grid ──
          Grid auto-adjusts: 1 col on mobile, up to 4 cols on wide screens.
           To force a fixed column count, replace auto-fit with e.g. repeat(4, 1fr) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '24px',
      }}>
        {TEAM_MEMBERS.map((member) => (
          <MemberCard key={member.name} member={member} />
        ))}
      </div>
    </section>
  );
}
