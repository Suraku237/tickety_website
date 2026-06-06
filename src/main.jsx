import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider }        from './context/ThemeContext';
import { SessionProvider }      from './context/SessionContext';
import { NotificationProvider } from './context/NotificationContext';
import './styles/globals.css';

// =============================================================
// ENTRY POINT
// SessionProvider      → reactive session (fix 2)
// ThemeProvider        → global theme (dark/light)
// NotificationProvider → global notification state + polling
// =============================================================
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SessionProvider>
      <ThemeProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </ThemeProvider>
    </SessionProvider>
  </React.StrictMode>
);