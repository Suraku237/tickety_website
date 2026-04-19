import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthLayout       from '../components/AuthLayout';
import FormField        from '../components/FormField';
import { createService } from '../services/api.service';
import { saveSession }   from '../services/session.service';
import { useAuth }       from '../hooks/useAuth';
import { validateServiceName } from '../utils/validators';
import { ROLE_LABELS }   from '../utils/constants';
// ===test
// =============================================================
// SERVICE SETUP PAGE  (Step 3 of registration)
// Responsibilities:
//   - Accept service/enterprise name from the newly verified admin
//   - POST to /api/services → creates Service + Admin(boss) rows
//   - Save full session and redirect to dashboard
// OOP Principle: Single Responsibility, Encapsulation
// =============================================================
export default function ServiceSetupPage() {
  const navigate  = useNavigate();
  const location  = useLocation();

  // Passed from RegistrationPage via router state after OTP verified
  const { email = '', username = '' } = location.state ?? {};

  const { loading, error, setError, submit } = useAuth();
  const [serviceName, setServiceName] = useState('');

  const handleSetup = (e) => {
    e.preventDefault();

    const err = validateServiceName(serviceName);
    if (err) { setError(err); return; }

    submit(async () => {
      const data = await createService({
        email,
        serviceName: serviceName.trim(),
      });

      if (data.success) {
        saveSession({
          user_id:      data.user_id,
          username:     data.username,
          email:        data.email,
          role:         data.role,
          admin_role:   data.admin_role,
          service_id:   data.service_id,
          service_name: data.service_name,
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