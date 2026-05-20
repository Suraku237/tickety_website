import { createContext, useState, useCallback, useEffect } from 'react';
import * as queueService from '../services/queue.service';

// =============================================================
// APP CONTEXT
// Responsibilities:
//   - Global state management for user, queues, auth
//   - Load/save queues from backend
//   - Provide CRUD operations for queues
// OOP Principle: Encapsulation, Single Responsibility
// =============================================================
export const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load queues from backend
  const loadQueues = useCallback(async () => {
    if (!user?.user_id) {
      setQueues([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await queueService.getQueues();
      if (response.success) {
        setQueues(response.services || []);
      } else {
        setError(response.message || 'Failed to load queues');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  // Auto-load queues when user changes
  useEffect(() => {
    loadQueues();
  }, [user, loadQueues]);

  // Create a new queue
  const createQueue = useCallback(async (data) => {
    if (!user?.user_id) {
      return { success: false, message: 'Not logged in' };
    }

    setLoading(true);
    setError(null);
    try {
      const response = await queueService.createQueue(
        user.user_id,
        data.name,
        data.description || '',
        data.category || 'General'
      );
      if (response.success) {
        await loadQueues();
      } else {
        setError(response.message || 'Failed to create queue');
      }
      return response;
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [user?.user_id, loadQueues]);

  // Update a queue
  const updateQueue = useCallback(async (queueId, data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await queueService.updateQueue(queueId, data);
      if (response.success) {
        await loadQueues();
      } else {
        setError(response.message || 'Failed to update queue');
      }
      return response;
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadQueues]);

  // Delete a queue
  const deleteQueue = useCallback(async (queueId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await queueService.deleteQueue(queueId);
      if (response.success) {
        await loadQueues();
      } else {
        setError(response.message || 'Failed to delete queue');
      }
      return response;
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadQueues]);

  // Get QR code for a queue
  const getQRCode = useCallback(async (queueId) => {
    try {
      return await queueService.getQRCode(queueId);
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  }, []);

  // Regenerate QR code
  const regenerateQR = useCallback(async (queueId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await queueService.regenerateQR(queueId);
      if (response.success) {
        await loadQueues();
      }
      return response;
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadQueues]);

  // Clear error
  const clearError = useCallback(() => setError(null), []);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        queues,
        loading,
        error,
        clearError,
        loadQueues,
        createQueue,
        updateQueue,
        deleteQueue,
        getQRCode,
        regenerateQR,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
