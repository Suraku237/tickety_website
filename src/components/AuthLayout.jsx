import { useNavigate } from 'react-router-dom';
import '../styles/auth.css';

// =============================================================
// AUTH LAYOUT
// Responsibilities:
//   - Provide the shared two-panel structure (left info + right form)
//   - Accept leftContent and children as slots
//   - Render blobs, brand, step indicators via props
// OOP Principle: Abstraction, Reusability, Single Responsibility
//   (mirrors AuthPage abstract base class from Flutter)
// =============================================================
export default function AuthLayout({ leftContent, children }) {
  const navigate = useNavigate();

  return (
    <div className="auth-root">
      <div className="auth-blob auth-blob-tl" />
      <div className="auth-blob auth-blob-br" />

      <div className="auth-left">
        <div className="auth-brand" onClick={() => navigate('/')}>
          <span className="auth-brand-icon">🎟</span>
          <span className="auth-brand-name">TICKETY</span>
        </div>
        <div className="auth-left-body">
          {leftContent}
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          {children}
        </div>
      </div>
    </div>
  );
}