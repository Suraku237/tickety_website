// =============================================================
// FORM FIELD
// Responsibilities:
//   - Render a labelled, icon-prefixed input consistently
//   - Handle password visibility toggle internally
// OOP Principle: Encapsulation, Reusability, Single Responsibility
//   (mirrors AuthWidgets.buildTextField from Flutter)
// =============================================================
import { useState } from 'react';

export default function FormField({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon,
  autoComplete,
  autoFocus,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType  = isPassword ? (showPassword ? 'text' : 'password') : type;
// ===
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="input-wrap">
        <span className="input-icon">{icon}</span>
        <input
          type={inputType}
          className="form-input"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
        />
        {isPassword && (
          <button
            type="button"
            className="input-eye"
            onClick={() => setShowPassword(p => !p)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8
                  a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4
                  c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19
                  m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}