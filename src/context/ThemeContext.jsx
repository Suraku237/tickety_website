import { createContext, useContext, useEffect, useState } from 'react';

// =============================================================
// THEME CONTEXT
// Responsibilities:
//   - Store and expose the current theme mode (dark | light)
//   - Persist the user's choice to localStorage across sessions
//   - Apply data-theme attribute to <html> so CSS vars swap globally
//   - Notify all consumers when theme changes via React context
// OOP Principle: Singleton (one context instance), Observer Pattern,
//               Encapsulation, Single Responsibility
//   (mirrors ThemeProvider singleton + ChangeNotifier from Flutter)
// =============================================================

const STORAGE_KEY  = 'tickety_theme';
const DEFAULT_THEME = 'dark';

const ThemeContext = createContext({
  isDark:      true,
  theme:       'dark',
  toggleTheme: () => {},
  setTheme:    () => {},
});

// ----------------------------------------------------------
// PROVIDER — wrap <App> with this in main.jsx
// ----------------------------------------------------------
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    // Restore from localStorage on first render
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_THEME;
  });

  // Apply data-theme to <html> whenever theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (value) => {
    if (value === 'dark' || value === 'light') setThemeState(value);
  };

  const toggleTheme = () => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      isDark: theme === 'dark',
      setTheme,
      toggleTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ----------------------------------------------------------
// HOOK — useTheme()
// Usage in any component:
//   const { isDark, toggleTheme, setTheme } = useTheme();
// ----------------------------------------------------------
export function useTheme() {
  return useContext(ThemeContext);
}