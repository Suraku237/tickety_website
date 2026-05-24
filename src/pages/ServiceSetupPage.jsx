import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthLayout        from '../components/AuthLayout';
import FormField         from '../components/FormField';
import { createService } from '../services/api.service';
import { saveSession }   from '../services/session.service';
import { setAuthToken }  from '../services/api.service';
import { useAuth }       from '../hooks/useAuth';
import { validateServiceName } from '../utils/validators';
import { ROLE_LABELS }   from '../utils/constants';

// =============================================================
// SERVICE SETUP PAGE  (Step 3 of registration)
// Responsibilities:
//   - Accept service/enterprise name from the newly verified admin
//   - POST to /api/services → creates Service row with QR code
//   - Save full session and redirect to dashboard
// OOP Principle: Single Responsibility, Encapsulation
//
// Fixed: createService() was called with wrong params (email +
//   serviceName). It now sends the correct fields (adminId, name).
//   user_id is passed via router state from RegistrationPage after
//   the backend login call that follows OTP verification.
// =============================================================
export default function ServiceSetupPage() {
  const navigate  = useNavigate();
  const location  = useLocation();

  // Passed from RegistrationPage via router state after OTP verified
  // Fixed: now also receives user_id and token so we can call
  // createService as an authenticated admin.
  const {
    email    = '',
    username = '',
    user_id  = null,
    token    = null,
  } = location.state ?? {};

  const { loading, error, setError, submit } = useAuth();
  const [serviceName, setServiceName] = useState('');

  const handleSetup = (e) => {
    e.preventDefault();

    const err = validateServiceName(serviceName);
    if (err) { setError(err); return; }

    if (!user_id) {
      setError('Session expired. Please register again.');
      return;
    }

    // Restore auth token for this request
    if (token) setAuthToken(token);

    submit(async () => {
      const data = await createService({
        adminId:     user_id,          // Fixed: was missing / wrong field name
        name:        serviceName.trim(), // Fixed: was 'serviceName', should be 'name'
        description: '',
        category:    'General',
      });

      if (data.success) {
        saveSession({
          user_id,
          username,
          email,
          role:         'admin',
          service_id:   data.service?.service_id ?? null,
          service_name: data.service?.name       ?? serviceName.trim(),
        });
        navigate('/dashboard');
      } else {
        setError(data.message || 'Could not create service.');
      }
    });
  };

  const leftContent = (
    <>
      <div className="reg-steps">
        {['Account', 'Verify', 'Service'].map((label, i) => (
          <div key={label} className={`reg-step ${i === 2 ? 'active' : 'done'}`}>
            <div className="rs-circle">{i === 2 ? 3 : '✓'}</div>
            <span className="rs-label">{label}</span>
            {i < 2 && <div className="rs-line" />}
          </div>
        ))}
      </div>
      <h2 className="auth-left-title">Name your<br />service.</h2>
      <p className="auth-left-sub">
        This is the name customers will see on their digital tickets.
      </p>
    </>
  );

  return (
    <AuthLayout leftContent={leftContent}>
      <div className="auth-card-badge">STEP 3 OF 3 — SERVICE</div>
      <div className="step3-icon">🏢</div>
      <h1 className="auth-card-title">Name your service</h1>
      <p className="auth-card-sub">
        What's the name of your business or service?
      </p>

      {error && (
        <div className="auth-error">
          <span className="auth-error-icon">⚠</span>{error}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSetup}>
        <FormField
          label="SERVICE / ENTERPRISE NAME"
          type="text"
          placeholder="e.g. City Hall, MediCare Clinic…"
          value={serviceName}
          onChange={setServiceName}
          autoFocus
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          }
        />

        <div className="role-badge-row">
          <div className="role-badge">
            <span className="rb-icon">👑</span>
            <div>
              <p className="rb-title">Owner / Boss</p>
              <p className="rb-sub">{ROLE_LABELS.boss} — full control over this service</p>
            </div>
          </div>
        </div>

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? <span className="auth-spinner" /> : 'LAUNCH MY SERVICE →'}
        </button>
      </form>
    </AuthLayout>
  );
}
