import { useState, useCallback } from 'react';

// =============================================================
// OTP GRID
// Responsibilities:
//   - Render 6 individual digit boxes
//   - Handle focus navigation between boxes automatically
//   - Auto-submit when all 6 digits are filled
//   - Expose clear() via ref if needed
// OOP Principle: Encapsulation, Single Responsibility
//   (mirrors the OTP grid in VerificationPage.dart)
// =============================================================
export default function OtpGrid({ onComplete, disabled }) {
  const [digits, setDigits] = useState(Array(6).fill(''));

  const clear = useCallback(() => {
    setDigits(Array(6).fill(''));
    document.getElementById('otp-0')?.focus();
  }, []);

  const handleChange = (index, val) => {
    if (!/^\d?$/.test(val)) return;

    const next = [...digits];
    next[index] = val;
    setDigits(next);

    if (val && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }

    if (next.join('').length === 6) {
      onComplete(next.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  return (
    <div className="otp-grid">
      {digits.map((d, i) => (
        <input
          key={i}
          id={`otp-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          className={`otp-box ${d ? 'otp-filled' : ''}`}
          value={d}
          disabled={disabled}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
        />
      ))}
    </div>
  );
}