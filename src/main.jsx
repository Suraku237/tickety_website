import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import './styles/globals.css';

// =============================================================
// ENTRY POINT
// ThemeProvider wraps everything so the theme context is
// available to every component in the tree.
// =============================================================
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);