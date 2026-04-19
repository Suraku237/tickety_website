import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout  from '../components/AuthLayout';
import FormField   from '../components/FormField';
import OtpGrid     from '../components/OtpGrid';
import { register, verifyEmail, resendOtp } from '../services/api.service';
import { useAuth } from '../hooks/useAuth';
import {
  validateUsername, validateEmail,
  validatePassword, validate,
} from '../utils/validators';
import { RESEND_COOLDOWN_SECONDS } from '../utils/constants';

// =============================================================
// REGISTRATION PAGE  (Steps 1 and 2)
// Step 1 → credentials
// Step 2 → OTP verification  (then redirects to /setup-service)
// OOP Principle: State machine, Encapsulation
// All HTTP logic delegated to api.service.js
// =============================================================
export default function RegistrationPage() {
  const navigate = useNavigate();
  const { loading, error, setError, successMsg, setSuccessMsg, submit } = useAuth();

  const [step,     setStep]     = useState(1);
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [coolRef,  setCoolRef]  = useState(null);

  // ── STEP 1 ──────────────────────────────────────────────
  const handleRegister = (e) => {
    e.preventDefault();

    const err = validate(
      validateUsername(username),
      validateEmail(email),
      validatePassword(password),
    );
    if (err) { setError(err); return; }

    submit(async () => {
      const data = await register({
        username: username.trim(),
        email:    email.toLowerCase().trim(),
        password,
      });

      if (data.success) {
        setStep(2);
        startCooldown(RESEND_COOLDOWN_SECONDS);
      } else {
        setError(data.message || 'Registration failed.');
      }
    });
  };

  // ── STEP 2: OTP ─────────────────────────────────────────
  const handleOtpComplete = (code) => {
    submit(async () => {
      const data = await verifyEmail({
        email: email.toLowerCase().trim(),
        code,
      });

      if (data.success) {
        // Pass email + username to Step 3 page
        navigate('/setup-service', {
          state: {
            email:    email.toLowerCase().trim(),
            username: username.trim(),
          },
        });
      } else {
        setError(data.message || 'Invalid code.');
      }
    });
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    setError(''); setSuccessMsg('');

    submit(async () => {
      const data = await resendOtp({ email: email.toLowerCase().trim() });
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

  // ── LEFT PANEL CONTENT ───────────────────────────────────
  const leftContent = (
    <>
      <div className="reg-steps">
        {['Account', 'Verify', 'Service'].map((label, i) => (
          <div key={label}
            className={`reg-step ${step === i + 1 ? 'active' : ''} ${step > i + 1 ? 'done' : ''}`}>
            <div className="rs-circle">{step > i + 1 ? '✓' : i + 1}</div>
            <span className="rs-label">{label}</span>
            {i < 2 && <div className="rs-line" />}
          </div>
        ))}
      </div>
      <h2 className="auth-left-title">
        {step === 1 ? <>Create your<br />admin account.</> : <>Check your<br />inbox.</>}
      </h2>
      <p className="auth-left-sub">
        {step === 1
          ? 'Set up your credentials to get started.'
          : `We sent a 6-digit code to ${email}`}
      </p>
    </>
  );
// ===test
  return (
    <AuthLayout leftContent={leftContent}>

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <>
          <div className="auth-card-badge">STEP 1 OF 3 — ACCOUNT</div>
          <h1 className="auth-card-title">Create account</h1>
          <p className="auth-card-sub">You'll be set up as the service owner</p>

          {error && <div className="auth-error"><span className="auth-error-icon">⚠</span>{error}</div>}

          <form className="auth-form" onSubmit={handleRegister}>
            <FormField label="FULL NAME / USERNAME" type="text"
              placeholder="e.g. John Doe" value={username} onChange={setUsername}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              }
            />
            <FormField label="EMAIL ADDRESS" type="email"
              placeholder="you@company.com" value={email} onChange={setEmail}
              autoComplete="email"
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              }
            />
            <FormField label="PASSWORD" type="password"
              placeholder="Min 6 chars with a number" value={password} onChange={setPassword}
              autoComplete="new-password"
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              }
            />
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <span className="auth-spinner" /> : 'CREATE ACCOUNT'}
            </button>
          </form>

          <div className="auth-divider"><span>or</span></div>
          <p className="auth-switch">
            Already have an account?{' '}
            <button className="auth-link" onClick={() => navigate('/login')}>Sign in</button>
          </p>
        </>
      )}

      {/* ── STEP 2 ── */}
      {step === 2 && (
        <>
          <div className="auth-card-badge">STEP 2 OF 3 — VERIFICATION</div>
          <h1 className="auth-card-title">Verify email</h1>
          <p className="auth-card-sub">
            Code sent to{' '}
            <strong style={{ color: 'var(--crimson)' }}>{email}</strong>
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
        </>
      )}

    </AuthLayout>
  );
}