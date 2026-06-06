import { createContext, useState, useEffect, useCallback } from 'react';
import { restoreSession } from '../services/session.service';
import { getQueues, createQueue as apiCreateQueue, deleteQueue as apiDeleteQueue, getTickets } from '../services/api.service';

// =============================================================
// APP CONTEXT
// Responsibilities:
//   - Load and cache queues for the logged-in service
//   - Expose createQueue / deleteQueue actions backed by the API
//   - Provide loading + error state to any consumer
// OOP Principle: Single Responsibility, Encapsulation
// =============================================================
export const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [queues,  setQueues]  = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const user = restoreSession();

  // ── Load queues from backend ──────────────────────────────
  const loadQueues = useCallback(async () => {
    if (!user?.service_id) return;
    setLoading(true);
    setError('');
    try {
      const data = await getQueues({ serviceId: user.service_id });
      if (data.success) {
        setQueues(data.queues ?? []);
      } else {
        setError(data.message || 'Failed to load queues.');
      }
    } catch {
      setError('Connection error.');
    } finally {
      setLoading(false);
    }
  }, [user?.service_id]);

  // ── Load tickets from backend ─────────────────────────────
  const loadTickets = useCallback(async () => {
    if (!user?.service_id) return;
    try {
      const data = await getTickets({ serviceId: user.service_id });
      if (data.success) {
        setTickets(data.tickets ?? []);
      }
    } catch {
      // silently fail — tickets are non-critical on load
    }
  }, [user?.service_id]);

  useEffect(() => { loadQueues(); loadTickets(); }, [loadQueues, loadTickets]);

  // ── Create queue ─────────────────────────────────────────
  const createQueue = async ({ name, category }) => {
    if (!user?.service_id) return { success: false, message: 'No service found.' };
    setLoading(true);
    setError('');
    try {
      // Generate a short code from the name (e.g. "General Window" → "GEN")
      const code = name.trim().slice(0, 3).toUpperCase().replace(/\s/g, '');
      const data = await apiCreateQueue({
        serviceId: user.service_id,
        name:      name.trim(),
        code,
        color:     categoryColor(category),
      });
      if (data.success) {
        setQueues(prev => [...prev, data.queue]);
      } else {
        setError(data.message || 'Failed to create queue.');
      }
      return data;
    } catch {
      const err = { success: false, message: 'Connection error.' };
      setError(err.message);
      return err;
    } finally {
      setLoading(false);
    }
  };

  // ── Delete queue ─────────────────────────────────────────
  const deleteQueue = async (queueId) => {
    setLoading(true);
    setError('');
    try {
      const data = await apiDeleteQueue({ queueId });
      if (data.success) {
        setQueues(prev => prev.filter(q => q.queue_id !== String(queueId)));
      } else {
        setError(data.message || 'Failed to delete queue.');
      }
      return data;
    } catch {
      const err = { success: false, message: 'Connection error.' };
      setError(err.message);
      return err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppContext.Provider value={{ queues, tickets, loading, error, createQueue, deleteQueue, loadQueues, loadTickets }}>
      {children}
    </AppContext.Provider>
  );
}

function categoryColor(category) {
  switch (category) {
    case 'priority': return '#F59E0B';
    case 'vip':      return '#DC0F0F';
    case 'medical':  return '#22C55E';
    default:         return '#3B82F6';
  }
}