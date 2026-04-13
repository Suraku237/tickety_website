import { useNavigate } from 'react-router-dom';
import '../styles/auth.css';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--surface)', color: 'var(--text)',
      fontFamily: "'DM Sans', sans-serif", gap: '16px',
    }}>
      <span style={{ fontSize: '48px' }}>🎟</span>
      <h1 style={{ fontSize: '80px', fontFamily: "'Bebas Neue', sans-serif",
        letterSpacing: '4px', color: 'var(--crimson)', margin: 0 }}>404</h1>
      <p style={{ color: 'var(--muted)', fontSize: '15px' }}>
        This page doesn't exist.
      </p>
      <button className="auth-submit" style={{ width: 'auto', padding: '12px 28px' }}
        onClick={() => navigate('/')}>
        Go home
      </button>
    </div>
  );
}