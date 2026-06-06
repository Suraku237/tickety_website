// =============================================================
// API SERVICE
// Single source of all HTTP communication with the backend.
// OOP Principle: Singleton, Encapsulation, Abstraction
// =============================================================

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

const WEB_HEADERS = {
  'Content-Type': 'application/json',
  'X-App-Source': 'web',
};

// ----------------------------------------------------------
// PRIVATE: Generic handlers
// ----------------------------------------------------------
async function _post(endpoint, body, includeStatus = false) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method:  'POST',
      headers: WEB_HEADERS,
      body:    JSON.stringify(body),
    });
    const data = await response.json();
    return includeStatus ? { ...data, statusCode: response.status } : data;
  } catch {
    return { success: false, message: 'Connection error. Please check your network.' };
  }
}

async function _get(endpoint, params = {}) {
  try {
    const clean    = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '')
    );
    const query    = new URLSearchParams(clean).toString();
    const url      = `${BASE_URL}${endpoint}${query ? `?${query}` : ''}`;
    const response = await fetch(url, { headers: WEB_HEADERS });
    return await response.json();
  } catch {
    return { success: false, message: 'Connection error. Please check your network.' };
  }
}

async function _patch(endpoint, body = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method:  'PATCH',
      headers: WEB_HEADERS,
      body:    JSON.stringify(body),
    });
    return await response.json();
  } catch {
    return { success: false, message: 'Connection error. Please check your network.' };
  }
}

async function _delete(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method:  'DELETE',
      headers: WEB_HEADERS,
    });
    return await response.json();
  } catch {
    return { success: false, message: 'Connection error. Please check your network.' };
  }
}

// =============================================================
// AUTH
// =============================================================
export const register    = ({ username, email, password }) =>
  _post('/register', { username, email, password });

export const login       = ({ email, password }) =>
  _post('/login', { email, password }, true);

export const verifyEmail = ({ email, code }) =>
  _post('/verify-email', { email, code });

export const resendOtp   = ({ email }) =>
  _post('/resend-otp', { email });

// =============================================================
// SERVICE
// =============================================================
export const createService  = ({ email, serviceName }) =>
  _post('/services', { email, service_name: serviceName });

export const getMyServices  = ({ email }) =>
  _get('/services/mine', { email });

// =============================================================
// QUEUES
// =============================================================
export const getQueues = ({ serviceId }) =>
  _get('/queues', { service_id: serviceId });

export const createQueue = ({ serviceId, name, code, color }) =>
  _post('/queues', { service_id: serviceId, name, code, color });

export const deleteQueue = ({ queueId }) =>
  _delete(`/queues/${queueId}`);

// =============================================================
// TICKETS
// =============================================================
export const getTickets = ({ queueId, status = 'all', priority = 'all' }) =>
  _get(`/queues/${queueId}/tickets`, { status, priority });

export const deleteTicket = ({ ticketId }) =>
  _delete(`/tickets/${ticketId}`);

export const setTicketPriority = ({ ticketId, priority }) =>
  _patch(`/tickets/${ticketId}/priority`, { priority });

export const swapTickets = ({ ticketIdA, ticketIdB }) =>
  _patch('/tickets/swap', { ticket_id_a: ticketIdA, ticket_id_b: ticketIdB });

// =============================================================
// COUNTER
// =============================================================
export const getCounterTickets = ({ serviceId, queueIds = '', counterName = '' }) =>
  _get('/counter/tickets', {
    service_id:   serviceId,
    queue_ids:    queueIds,
    counter_name: counterName,
  });

export const terminateTicket = ({ ticketId, counterName = '' }) =>
  _patch(`/counter/tickets/${ticketId}/terminate`, { counter_name: counterName });

export const suspendTicket = ({ ticketId }) =>
  _patch(`/counter/tickets/${ticketId}/suspend`);

export const reactivateTicket = ({ ticketId }) =>
  _patch(`/counter/tickets/${ticketId}/reactivate`);

export const callNext = ({ serviceId, queueIds = [], counterName = '' }) =>
  _patch('/counter/call-next', {
    service_id:   serviceId,
    queue_ids:    queueIds,
    counter_name: counterName,
  });

export const getCarriedOver = ({ serviceId }) =>
  _get('/counter/carried-over', { service_id: serviceId });

// =============================================================
// TEAM
// =============================================================
export const getTeam = ({ serviceId }) =>
  _get('/team', { service_id: serviceId });

export const removeAdmin = ({ adminId }) =>
  _delete(`/team/${adminId}`);

export const generateInvite = ({ serviceId, adminRole }) =>
  _post('/team/invite', { service_id: serviceId, admin_role: adminRole });

export const validateInvite = ({ token }) =>
  _get(`/team/invite/${token}`);

export const completeInvite = ({ token, email }) =>
  _post(`/team/invite/${token}/complete`, { email });

// =============================================================
// ANALYTICS
// =============================================================
export const getAnalytics = ({ serviceId, period = 'week' }) =>
  _get('/analytics', { service_id: serviceId, period });

// =============================================================
// SCHEDULE
// =============================================================
export const getSchedule = ({ serviceId }) =>
  _get('/schedule', { service_id: serviceId });

export const setGeneralSchedule = ({ serviceId, isOpen, openingTime, closingTime, avgDuration }) =>
  _post('/schedule/general', {
    service_id:   serviceId,
    is_open:      isOpen,
    opening_time: openingTime,
    closing_time: closingTime,
    avg_duration: avgDuration,
  });

export const setDaySchedule = ({ serviceId, dayOfWeek, isOpen, openingTime, closingTime, avgDuration }) =>
  _post('/schedule/day', {
    service_id:   serviceId,
    day_of_week:  dayOfWeek,
    is_open:      isOpen,
    opening_time: openingTime,
    closing_time: closingTime,
    avg_duration: avgDuration,
  });

export const deleteDaySchedule = ({ serviceId, dayOfWeek }) =>
  _delete(`/schedule/day/${dayOfWeek}?service_id=${serviceId}`);

export const getScheduleStatus = ({ serviceId }) =>
  _get('/schedule/status', { service_id: serviceId });

// =============================================================
// PROFILE
// =============================================================
export const updateUsername = ({ userId, username }) =>
  _patch('/profile/username', { user_id: userId, username });

export const initiateEmailChange = ({ userId, newEmail }) =>
  _post('/profile/email/initiate', { user_id: userId, new_email: newEmail });

export const confirmOldEmail = ({ userId, code }) =>
  _post('/profile/email/confirm-old', { user_id: userId, code });

export const confirmNewEmail = ({ userId, code }) =>
  _post('/profile/email/confirm-new', { user_id: userId, code });

export const updatePassword = ({ userId, currentPassword, newPassword }) =>
  _patch('/profile/password', {
    user_id:          userId,
    current_password: currentPassword,
    new_password:     newPassword,
  });