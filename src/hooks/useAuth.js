import { useState } from 'react';

// =============================================================
// USE AUTH  (Custom Hook)
// Responsibilities:
//   - Provide shared loading / error / success state
//   - Provide a submit wrapper that handles try/catch boilerplate
// OOP Principle: Encapsulation, Single Responsibility, DRY
// =============================================================
export function useAuth() {
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearMessages = () => { setError(''); setSuccessMsg(''); };

  /**
   * Wraps an async action — handles loading flag and error capture.
   * @param {() => Promise<void>} action
   */
  const submit = async (action) => {
    clearMessages();
    setLoading(true);
    try {
      await action();
    } catch (err) {
      setError(err.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,    setError,
    successMsg, setSuccessMsg,
    clearMessages,
    submit,
  };
}// ===