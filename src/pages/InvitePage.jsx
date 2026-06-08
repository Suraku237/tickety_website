import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthLayout  from '../components/AuthLayout';
import FormField   from '../components/FormField';
import OtpGrid     from '../components/OtpGrid';
import { register, verifyEmail, resendOtp, validateInvite, completeInvite } from '../services/api.service';
import { useSession } from '../hooks/useSession';
import { useAuth }  from '../hooks/useAuth';
import {
  validateUsername, validateEmail,
  validatePassword, validate,
} from '../utils/validators';
import { RESEND_COOLDOWN_SECONDS } from '../utils/constants';

// =============================================================
// INVITE PAGE  (Steps 1 and 2 only — no service setup)
// Step 1 → credentials (register via invite)
// Step 2 → OTP verification → redirect to role-based dashboard
// =============================================================
export default function InvitePage() {
  const { token }  = useParams();
  const navigate   = useNavigate();
  const { updateSession } = useSession();
  const { loading, error, setError, successMsg, setSuccessMsg, submit } = useAuth();

  const [step,        setStep]        = useState(0);   // 0 = loading invite info
  const [inviteInfo,  setInviteInfo]  = useState(null);
  const [inviteError, setInviteError] = useState('');

  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [coolRef,  setCoolRef]  = useState(null);

  // ── VALIDATE INVITE TOKEN ON MOUNT ──────────────────────
  useEffect(() => {
    if (!token) { setInviteError('Invalid invite link.'); return; }

    validateInvite({ token }).then(data => {
      if (data.success) {
        setInviteInfo(data);
        setStep(1);
      } else {
        setInviteError(data.message || 'This invite link is invalid or has expired.');
      }
    });
  }, [token]);

  // ── STEP 1: REGISTER ────────────────────────────────────
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

  // ── STEP 2: VERIFY OTP → complete invite ────────────────
  const handleOtpComplete = (code) => {
    submit(async () => {
      // First verify the email
      const verifyData = await verifyEmail({
        email: email.toLowerCase().trim(),
        code,
      });

      if (!verifyData.success) {
        setError(verifyData.message || 'Invalid code.');
        return;
      }

      // Then complete the invite (creates Admin row with pre-set role)
      const completeData = await completeInvite({
        token,
        email: email.toLowerCase().trim(),
      });

      if (completeData.success) {
        // Build session from verify response + invite completion data
        updateSession({
          user_id:      verifyData.user_id,
          username:     verifyData.username,
          email:        verifyData.email,
          role:         verifyData.role,
          admin_role:   completeData.admin_role,
          service_id:   completeData.service_id,
          service_name: completeData.service_name,
        });

        // Redirect based on role
        const role = completeData.admin_role;
        if (role === 'manager') navigate('/queues');
        else if (role === 'agent') navigate('/counter');
        else navigate('/dashboard');
      } else {
        setError(completeData.message || 'Failed to complete registration.');
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

  // ── ROLE DISPLAY HELPERS ─────────────────────────────────
  const roleIcon  = inviteInfo?.admin_role === 'manager' ? '🎛' : '🪟';
  const roleLabel = inviteInfo?.admin_role === 'manager' ? 'Ticket Manager' : 'Counter Agent';

  // ── LEFT PANEL CONTENT ───────────────────────────────────
  const leftContent = (
    <>
      <div className="reg-steps">
        {['Account', 'Verify'].map((label, i) => (
          <div key={label}
            className={`reg-step ${step === i + 1 ? 'active' : ''} ${step > i + 1 ? 'done' : ''}`}>
            <div className="rs-circle">{step > i + 1 ? '✓' : i + 1}</div>
            <span className="rs-label">{label}</span>
            {i < 1 && <div className="rs-line" />}
          </div>
        ))}
      </div>
      <h2 className="auth-left-title">
        {step <= 1 ? <>You've been<br />invited.</> : <>Check your<br />inbox.</>}
      </h2>
      <p className="auth-left-sub">
        {step <= 1
          ? inviteInfo
            ? `Join ${inviteInfo.service_name} as ${roleLabel}`
            : 'Loading invite details…'
          : `We sent a 6-digit code to ${email}`}
      </p>
      {inviteInfo && step <= 1 && (
        <div className="auth-left-features" style={{ marginTop: '32px' }}>
          <div className="feature-row">
            <span className="feature-check">{roleIcon}</span>
            <span>Role: <strong style={{ color: 'var(--text)' }}>{roleLabel}</strong></span>
          </div>
          <div className="feature-row">
            <span className="feature-check">🏢</span>
            <span>Service: <strong style={{ color: 'var(--text)' }}>{inviteInfo.service_name}</strong></span>
          </div>
        </div>
      )}
    </>
  );

  // ── LOADING STATE ────────────────────────────────────────
  if (step === 0) {
    return (
      <AuthLayout leftContent={leftContent}>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          {inviteError ? (
            <>
              <p style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</p>
              <h2 style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '32px', letterSpacing: '2px',
                color: 'var(--crimson)', marginBottom: '12px',
              }}>Invalid Invite</h2>
              <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '28px' }}>
                {inviteError}
              </p>
              <button className="auth-submit" style={{ width: 'auto', padding: '12px 28px' }}
                onClick={() => navigate('/login')}>
                Go to Login
              </button>
            </>
          ) : (
            <>
              <span className="auth-spinner" style={{ width: '32px', height: '32px' }} />
              <p style={{ color: 'var(--muted)', marginTop: '16px', fontSize: '14px' }}>
                Validating invite link…
              </p>
            </>
          )}
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout leftContent={leftContent}>

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <>
          <div className="auth-card-badge">INVITE — {roleLabel.toUpperCase()}</div>
          <h1 className="auth-card-title">Create account</h1>
          <p className="auth-card-sub">
            Joining <strong style={{ color: 'var(--crimson)' }}>{inviteInfo?.service_name}</strong>
          </p>

          {error && <div className="auth-error"><span className="auth-error-icon">⚠</span>{error}</div>}

          <form className="auth-form" onSubmit={handleRegister}>
            <FormField label="FULL NAME / USERNAME" type="text"
              placeholder=" " value={username} onChange={setUsername}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              }
            />
            <FormField label="EMAIL ADDRESS" type="email"
              placeholder="you@gmail.com" value={email} onChange={setEmail}
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
        </>
      )}

      {/* ── STEP 2 ── */}
      {step === 2 && (
        <>
          <div className="auth-card-badge">STEP 2 OF 2 — VERIFICATION</div>
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