import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthLayout  from '../components/AuthLayout';
import OtpGrid     from '../components/OtpGrid';
import { verifyEmail, resendOtp } from '../services/api.service';
import { useAuth } from '../hooks/useAuth';
import { RESEND_COOLDOWN_SECONDS } from '../utils/constants';

// =============================================================
// VERIFY PAGE
// Reached when a user logs in with an unverified email.
// Accepts the email via router state (passed from LoginPage).
// On success redirects to /login so they can sign in properly.
// =============================================================
export default function VerifyPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { loading, error, setError, successMsg, setSuccessMsg, submit } = useAuth();

  // Email passed via router state from LoginPage
  const email = location.state?.email ?? '';

  const [cooldown, setCooldown] = useState(0);
  const [coolRef,  setCoolRef]  = useState(null);

  useEffect(() => {
    // If no email in state, they navigated here directly — send back to login
    if (!email) navigate('/login', { replace: true });
  }, [email, navigate]);

  const handleOtpComplete = (code) => {
    submit(async () => {
      const data = await verifyEmail({ email, code });
      if (data.success) {
        setSuccessMsg('Email verified! You can now sign in.');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setError(data.message || 'Invalid code.');
      }
    });
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    setError(''); setSuccessMsg('');
    submit(async () => {
      const data = await resendOtp({ email });
      if (data.success) {
        setSuccessMsg('New code sent!');
        startCooldown(RESEND_COOLDOWN_SECONDS);
      } else {
        setError(data.message || 'Could not resend.');
      }
    });
  };

  const startCooldown = (secs) => {
    if (coolRef) clearInterval(coolRef);
    setCooldown(secs);
    const t = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(t); return 0; }
        return prev - 1;
      });
    }, 1000);
    setCoolRef(t);
  };

  const leftContent = (
    <>
      <h2 className="auth-left-title">Verify your<br />email first.</h2>
      <p className="auth-left-sub">
        We sent a 6-digit code to{' '}
        <strong style={{ color: 'var(--text)' }}>{email}</strong>
      </p>
    </>
  );

  return (
    <AuthLayout leftContent={leftContent}>
      <div className="auth-card-badge">EMAIL VERIFICATION</div>
      <h1 className="auth-card-title">Check your inbox</h1>
      <p className="auth-card-sub">
        Code sent to <strong style={{ color: 'var(--crimson)' }}>{email}</strong>
      </p>

      {error      && <div className="auth-error"><span className="auth-error-icon">⚠</span>{error}</div>}
      {successMsg && <div className="auth-success"><span>✓</span>{successMsg}</div>}

      <OtpGrid onComplete={handleOtpComplete} disabled={loading} />

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
          <span className="auth-spinner" />
        </div>
      )}

      <div className="otp-resend">
        <span>Didn't receive it?</span>
        <button className="auth-link" onClick={handleResend}
          disabled={cooldown > 0} style={{ opacity: cooldown > 0 ? .5 : 1 }}>
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
      </div>
      <p className="otp-expiry">Code expires in 10 minutes</p>

      <div className="auth-divider"><span>or</span></div>
      <p className="auth-switch">
        <button className="auth-link" onClick={() => navigate('/login')}>
          Back to login
        </button>
      </p>
    </AuthLayout>
  );
}