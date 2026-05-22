// =============================================================
// API SERVICE
// Responsibilities:
//   - Single source of all HTTP communication with the backend
//   - Every page/component imports from here — never fetch() directly
//   - Sends X-App-Source: web on every request (auto admin role)
//   - Centralises base URL via environment variable
// OOP Principle: Singleton, Encapsulation, Abstraction
//   (mirrors ApiService singleton in the Flutter app)
// =============================================================

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let authToken = null;

const WEB_HEADERS = {
  'Content-Type': 'application/json',
  'X-App-Source': 'web',
};

// Set auth token for authenticated requests
export function setAuthToken(token) {
  authToken = token;
}

// Get headers with optional auth
function getHeaders(includeAuth = false) {
  const headers = { ...WEB_HEADERS };
  if (includeAuth && authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
}


// ----------------------------------------------------------
// PRIVATE: Generic POST handler
// ----------------------------------------------------------
async function _post(endpoint, body, includeStatus = false, useAuth = false) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method:  'POST',
      headers: getHeaders(useAuth),
      body:    JSON.stringify(body),
    });

    const data = await response.json();

    if (includeStatus) {
      return { ...data, statusCode: response.status };
    }

    return data;
  } catch {
    return {
      success: false,
      message: 'Connection error. Please check your network.',
    };
  }
}

// ----------------------------------------------------------
// PRIVATE: Generic GET handler
// ----------------------------------------------------------
async function _get(endpoint, params = {}, useAuth = false) {
  try {
    const query    = new URLSearchParams(params).toString();
    const url      = `${BASE_URL}${endpoint}${query ? `?${query}` : ''}`;
    const response = await fetch(url, { headers: getHeaders(useAuth) });
    return await response.json();
  } catch {
    return {
      success: false,
      message: 'Connection error. Please check your network.',
    };
  }
}

// =============================================================
// AUTH ENDPOINTS
// =============================================================

/**
 * Register a new admin user.
 * Backend assigns role='admin' from X-App-Source: web header.
 */
export async function register({ username, email, password }) {
  return _post('/register', { username, email, password });
}

/**
 * Log in with email and password.
 * Returns statusCode so UI can detect 403 (unverified) vs 401 (wrong creds).
 * Stores token for authenticated requests.
 */
export async function login({ email, password }) {
  const data = await _post('/login', { email, password }, true);
  if (data.success && data.token) {
    setAuthToken(data.token);
  }
  return data;
}

/**
 * Verify the 6-digit OTP sent by email.
 */
export async function verifyEmail({ email, code }) {
  return _post('/verify-email', { email, code });
}

/**
 * Resend a fresh OTP to the user's email.
 */
export async function resendOtp({ email }) {
  return _post('/resend-otp', { email });
}

// =============================================================
// SERVICE ENDPOINTS (Note: Services are Queues in backend)
// =============================================================

/**
 * Create a new service/queue.
 * Requires admin_id (from logged-in user).
 */
export async function createService({ adminId, name, description, category }) {
  return _post('/services', {
    admin_id: adminId,
    name: name,
    description: description || '',
    category: category || 'General',
  }, false, true);
}

/**
 * Get all services (admin can see all).
 */
export async function getAllServices() {
  return _get('/services', {}, true);
}

/**
 * Get a single service by ID.
 */
export async function getService(serviceId) {
  return _get(`/services/${serviceId}`, {}, true);
}

/**
 * Update a service.
 */
export async function updateService(serviceId, { name, description, category, isActive }) {
  const body = {};
  if (name !== undefined) body.name = name;
  if (description !== undefined) body.description = description;
  if (category !== undefined) body.category = category;
  if (isActive !== undefined) body.is_active = isActive;

  try {
    const response = await fetch(`${BASE_URL}/services/${serviceId}`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify(body),
    });
    return await response.json();
  } catch {
    return {
      success: false,
      message: 'Connection error. Please check your network.',
    };
  }
}

/**
 * Delete a service.
 */
export async function deleteService(serviceId) {
  try {
    const response = await fetch(`${BASE_URL}/services/${serviceId}`, {
      method: 'DELETE',
      headers: getHeaders(true),
      body: JSON.stringify({}),
    });
    return await response.json();
  } catch {
    return {
      success: false,
      message: 'Connection error. Please check your network.',
    };
  }
}

/**
 * Get QR code for a service (download as PNG).
 */
export async function getServiceQRCode(serviceId) {
  try {
    const response = await fetch(`${BASE_URL}/services/${serviceId}/qr.png`, {
      headers: getHeaders(true),
    });
    if (!response.ok) {
      return { success: false, message: 'Failed to download QR code' };
    }
    const blob = await response.blob();
    return { success: true, blob, contentType: response.headers.get('content-type') };
  } catch {
    return {
      success: false,
      message: 'Connection error. Please check your network.',
    };
  }
}

/**
 * Regenerate QR code for a service.
 */
export async function regenerateServiceQR(serviceId) {
  return _post(`/services/${serviceId}/regenerate-qr`, {}, false, true);
}

/**
 * Clear auth token (logout).
 */
export function clearAuthToken() {
  authToken = null;
}