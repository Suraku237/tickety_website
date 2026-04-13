// =============================================================
// CONSTANTS
// Responsibilities:
//   - Single source of truth for magic values used across the app
// OOP Principle: Encapsulation, Single Source of Truth
// =============================================================

export const ADMIN_ROLES = {
  BOSS:    'boss',
  MANAGER: 'manager',
  AGENT:   'agent',
};

export const ROLE_LABELS = {
  boss:    '👑 Owner / Boss',
  manager: '🎛 Ticket Manager',
  agent:   '🪟 Counter Agent',
};

export const OTP_EXPIRY_MINUTES = 10;
export const RESEND_COOLDOWN_SECONDS = 60;