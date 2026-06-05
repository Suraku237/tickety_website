import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import OtpGrid    from '../components/OtpGrid';
import { verifyEmail, resendOtp } from '../services/api.service';
import { useAuth } from '../hooks/useAuth';
import { RESEND_COOLDOWN_SECONDS } from '../utils/constants';

// =============================================================
// VERIFICATION PAGE
// Responsibilities:
//   - Accept the 6-digit OTP sent to the user's email after login
//   - Resend OTP on demand (with cooldown)
//   - Redirect to /dashboard on success
// Reached when login returns 403 with "verify" in message
// OOP Principle: Encapsulation, Single Responsibility
// =============================================================
export default function VerificationPage() {
  const navigate  = useNavigate();
  const location  = useLocation();

  // Email is passed via navigate('/verify', { state: { email } })
  const email = location.state?.email ?? '';

  const { loading, error, setError, successMsg, setSuccessMsg, submit } = useAuth();

  const [cooldown, setCooldown] = useState(0);
  const [coolRef,  setCoolRef]  = useState(null);

  // If someone lands here without an email in state, send them back
  useEffect(() => {
    if (!email) {
      navigate('/login', { replace: true });
    }
  }, [email, navigate]);

  // ── OTP submitted ───────────────────────────────────────
  const handleOtpComplete = (code) => {
    submit(async () => {
      const data = await verifyEmail({ email, code });

      if (data.success) {
        navigate('/dashboard');
      } else {
        setError(data.message || 'Invalid or expired code.');
      }
    });
  };

  // ── Resend OTP ──────────────────────────────────────────
  const startCooldown = (seconds) => {
    setCooldown(seconds);
    const ref = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) { clearInterval(ref); return 0; }
        return prev - 1;
      });
    }, 1000);
    setCoolRef(ref);
  };

  // Clean up timer on unmount
  useEffect(() => () => { if (coolRef) clearInterval(coolRef); }, [coolRef]);

  const handleResend = () => {
    if (cooldown > 0) return;

    submit(async () => {
      const data = await resendOtp({ email });
      if (data.success) {
        setSuccessMsg('A new code has been sent to your email.');
        startCooldown(RESEND_COOLDOWN_SECONDS);
      } else {
        setError(data.message || 'Failed to resend code.');
      }
    });
  };

  // ── Render ───────────────────────────────────────────────
  const leftContent = (
    <>
      <h2 className="auth-left-title">One last step.</h2>
      <p className="auth-left-subtitle">
        Check your inbox for a 6-digit code and enter it below to verify your email.
      </p>
    </>
  );

  return (
    <AuthLayout leftContent={leftContent}>
      <h1 className="auth-title">Verify your email</h1>
      <p className="auth-subtitle">
        We sent a code to <strong>{email}</strong>
      </p>

      {error      && <p className="auth-error">{error}</p>}
      {successMsg && <p className="auth-success">{successMsg}</p>}

      <OtpGrid
        length={6}
        onComplete={handleOtpComplete}
        disabled={loading}
      />

      <p className="auth-footer-text">
        Didn't receive it?{' '}
        <button
          className="auth-link-btn"
          onClick={handleResend}
          disabled={cooldown > 0 || loading}
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
      </p>

      <p className="auth-footer-text">
        <button
          className="auth-link-btn"
          onClick={() => navigate('/login')}
        >
          ← Back to login
        </button>
      </p>
    </AuthLayout>
  );
}