import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import FormField  from '../components/FormField';
import OtpGrid    from '../components/OtpGrid';
import { forgotPassword, verifyResetCode, resetPassword } from '../services/api.service';
import { useAuth } from '../hooks/useAuth';
import { validateEmail, validatePassword, validate } from '../utils/validators';
import { RESEND_COOLDOWN_SECONDS } from '../utils/constants';

// =============================================================
// FORGOT PASSWORD PAGE  (web)
// Mirrors the mobile 3-step flow against the shared backend:
//   1. email        -> POST /forgot-password      (sends reset code)
//   2. 6-digit code -> POST /verify-reset-code    (validates code)
//   3. new password -> POST /reset-password       (applies change)
// =============================================================

const EMAIL_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const LOCK_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { loading, error, setError, successMsg, setSuccessMsg, submit } = useAuth();

  const [step,     setStep]     = useState(1);   // 1 email · 2 code · 3 new password
  const [email,    setEmail]    = useState('');
  const [code,     setCode]     = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');

  const [cooldown, setCooldown] = useState(0);
  const [coolRef,  setCoolRef]  = useState(null);

  const startCooldown = (secs) => {
    if (coolRef) clearInterval(coolRef);
    setCooldown(secs);
    const t = setInterval(() => {
      setCooldown(prev => { if (prev <= 1) { clearInterval(t); return 0; } return prev - 1; });
    }, 1000);
    setCoolRef(t);
  };

  // ── Step 1: request a reset code ─────────────────────────
  const handleRequest = (e) => {
    e.preventDefault();
    const err = validate(validateEmail(email));
    if (err) { setError(err); return; }
    submit(async () => {
      const data = await forgotPassword({ email: email.toLowerCase().trim() });
      if (data.success) {
        setSuccessMsg('If this email is registered, a reset code has been sent.');
        setStep(2);
        startCooldown(RESEND_COOLDOWN_SECONDS);
      } else {
        setError(data.message || 'Could not send reset code.');
      }
    });
  };

  // ── Step 2: verify the code ──────────────────────────────
  const handleVerify = (enteredCode) => {
    submit(async () => {
      const data = await verifyResetCode({ email: email.toLowerCase().trim(), code: enteredCode });
      if (data.success) {
        setCode(enteredCode);
        setSuccessMsg('');
        setStep(3);
      } else {
        setError(data.message || 'Invalid or expired code.');
      }
    });
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    setError(''); setSuccessMsg('');
    submit(async () => {
      const data = await forgotPassword({ email: email.toLowerCase().trim() });
      if (data.success) {
        setSuccessMsg('New code sent!');
        startCooldown(RESEND_COOLDOWN_SECONDS);
      } else {
        setError(data.message || 'Could not resend.');
      }
    });
  };

  // ── Step 3: set the new password ─────────────────────────
  const handleReset = (e) => {
    e.preventDefault();
    const err = validate(validatePassword(password));
    if (err) { setError(err); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    submit(async () => {
      const data = await resetPassword({
        email: email.toLowerCase().trim(), code, newPassword: password,
      });
      if (data.success) {
        setSuccessMsg('Password reset! Redirecting to sign in…');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setError(data.message || 'Could not reset password.');
      }
    });
  };

  const leftContent = (
    <>
      <h2 className="auth-left-title">Forgot your<br />password?</h2>
      <p className="auth-left-sub">
        No problem — we'll email you a 6-digit code to reset it securely.
      </p>
    </>
  );

  const BADGE  = ['ACCOUNT RECOVERY', 'ENTER CODE', 'NEW PASSWORD'][step - 1];
  const TITLE  = ['Reset your password', 'Check your inbox', 'Choose a new password'][step - 1];

  return (
    <AuthLayout leftContent={leftContent}>
      <div className="auth-card-badge">{BADGE}</div>
      <h1 className="auth-card-title">{TITLE}</h1>
      <p className="auth-card-sub">
        {step === 1 && 'Enter the email tied to your account.'}
        {step === 2 && <>Code sent to <strong style={{ color: 'var(--crimson)' }}>{email}</strong></>}
        {step === 3 && 'Pick a strong password you haven\'t used before.'}
      </p>

      {error      && <div className="auth-error"><span className="auth-error-icon">⚠</span>{error}</div>}
      {successMsg && <div className="auth-success"><span>✓</span>{successMsg}</div>}

      {/* STEP 1 — email */}
      {step === 1 && (
        <form className="auth-form" onSubmit={handleRequest}>
          <FormField
            label="EMAIL ADDRESS" type="email" placeholder="you@gmail.com"
            value={email} onChange={setEmail} autoComplete="email" icon={EMAIL_ICON} />
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? <span className="auth-spinner" /> : 'SEND RESET CODE'}
          </button>
        </form>
      )}

      {/* STEP 2 — code */}
      {step === 2 && (
        <>
          <OtpGrid onComplete={handleVerify} disabled={loading} />
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
        </>
      )}

      {/* STEP 3 — new password */}
      {step === 3 && (
        <form className="auth-form" onSubmit={handleReset}>
          <FormField
            label="NEW PASSWORD" type="password" placeholder="New password"
            value={password} onChange={setPassword} autoComplete="new-password" icon={LOCK_ICON} />
          <FormField
            label="CONFIRM PASSWORD" type="password" placeholder="Re-enter password"
            value={confirm} onChange={setConfirm} autoComplete="new-password" icon={LOCK_ICON} />
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? <span className="auth-spinner" /> : 'RESET PASSWORD'}
          </button>
        </form>
      )}

      <div className="auth-divider"><span>or</span></div>
      <p className="auth-switch">
        <button className="auth-link" onClick={() => navigate('/login')}>Back to login</button>
      </p>
    </AuthLayout>
  );
}