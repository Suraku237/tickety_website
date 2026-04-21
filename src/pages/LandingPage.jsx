import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import '../styles/landing.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    const particles = [];

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 38; i++) {
      particles.push({
        x:    Math.random() * window.innerWidth,
        y:    Math.random() * window.innerHeight,
        r:    Math.random() * 1.5 + 0.3,
        dx:   (Math.random() - 0.5) * 0.3,
        dy:   (Math.random() - 0.5) * 0.3,
        op:   Math.random() * 0.4 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220,15,15,${p.op})`;
        ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width)  p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <div className="land-root">
      <canvas ref={canvasRef} className="land-canvas" />

      {/* Glow blobs */}
      <div className="blob blob-tl" />
      <div className="blob blob-br" />

      {/* NAV */}
      <nav className="land-nav">
        <div className="land-brand">
          <span className="brand-icon">🎟</span>
          <span className="brand-name">TICKETY</span>
        </div>
        <button className="nav-signin" onClick={() => navigate('/login')}>
          Sign In
        </button>
      </nav>

      {/* HERO */}
      <main className="land-hero">
        <div className="hero-left">
          <div className="hero-badge">
            <span className="badge-dot" />
            SMART QUEUE MANAGEMENT
          </div>

          <h1 className="hero-title">
            Run your <br />
            <span className="title-accent">ticket service</span><br />
            smarter.
          </h1>

          <p className="hero-sub">
            Create queues, manage counters, and serve customers —<br />
            all from one powerful dashboard.
          </p>

          <button
            className="btn-primary hero-cta"
            onClick={() => navigate('/register')}
          >
            <span>Create and manage your ticket service</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>

          <div className="hero-stats">
            {[['∞', 'Queues'], ['3', 'Admin roles'], ['Real-time', 'Updates']].map(([v, l]) => (
              <div key={l} className="stat-item">
                <span className="stat-val">{v}</span>
                <span className="stat-label">{l}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-right">
          <div className="ticket-mockup">
            <div className="ticket-top">
              <span className="tm-brand">🎟 TICKETY</span>
              <span className="tm-live">● LIVE</span>
            </div>
            <div className="tm-number">047</div>
            <div className="tm-service">Counter A — General Service</div>
            <div className="tm-divider">
              <span /><span className="tm-dot" /><span />
            </div>
            <div className="tm-row">
              <span>Queue position</span><strong>3rd</strong>
            </div>
            <div className="tm-row">
              <span>Est. wait</span><strong>~8 min</strong>
            </div>
            <div className="tm-barcode">
              {[...Array(28)].map((_, i) => (
                <div key={i} className="bc-bar"
                  style={{ height: `${Math.random() * 16 + 10}px` }} />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* MOBILE STRIP */}
      <section className="mobile-strip">
        <div className="ms-left">
          <p className="ms-tag">FOR CUSTOMERS</p>
          <h2 className="ms-title">
            Tired of printed tickets?<br />
            <span>Get your digital ticket here.</span>
          </h2>
          <p className="ms-sub">
            Join a queue, track your position in real time, and get notified
            — no paper, no waiting in line.
          </p>
          <a href="/downloads/app-release.apk" download className="btn-download">
          {/* Standard Download Icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>
              <small>Download for</small>
              Android (APK)
              </span>
        </a>
        </div>
        <div className="ms-right">
          <div className="phone-mockup">
            <div className="phone-notch" />
            <div className="phone-screen">
              <div className="ps-header">
                <span>🎟 TICKETY</span>
                <span className="ps-verified">✓ Verified</span>
              </div>
              <div className="ps-ticket-num">A-047</div>
              <div className="ps-status">You're next!</div>
              <div className="ps-bar">
                <div className="ps-bar-fill" />
              </div>
              <div className="ps-info">
                <span>Counter A</span>
                <span className="ps-eta">~2 min</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="land-footer">
        <span>© 2025 TICKETY — Smart Queue Management</span>
        <span className="footer-dot">·</span>
        <span>Built with precision</span>
      </footer>
    </div>
  );
}
// ===test