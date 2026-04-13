// =============================================================
// VALIDATORS
// Responsibilities:
//   - Centralise all client-side validation rules
//   - Return error strings or null (mirrors backend Validator class)
// OOP Principle: Single Responsibility, DRY
// =============================================================

export function validateUsername(username) {
  if (!username || username.trim().length < 3)
    return 'Username must be at least 3 characters.';
  return null;
}

export function validateEmail(email) {
  if (!email || !email.includes('@'))
    return 'Enter a valid email address.';
  return null;
}

export function validatePassword(password) {
  if (!password || password.length < 6)
    return 'Password must be at least 6 characters.';
  if (!/\d/.test(password))
    return 'Password must include at least one number.';
  return null;
}

export function validateServiceName(name) {
  if (!name || name.trim().length < 2)
    return 'Service name must be at least 2 characters.';
  return null;
}

/** Run multiple validators and return the first error found, or null. */
export function validate(...checks) {
  for (const check of checks) {
    if (check) return check;
  }
  return null;
}