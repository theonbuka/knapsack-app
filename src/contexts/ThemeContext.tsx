import React, { createContext, useContext, useState, useLayoutEffect, useCallback } from 'react';

const DARK_APP_BG = '#06060a';
const LIGHT_APP_BG = '#f2f1ed';
const LIGHT_THEME_MIGRATION_KEY = 'knapsack_theme_premium_light_v1';

interface ThemeContextValue {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    const migrated = localStorage.getItem(LIGHT_THEME_MIGRATION_KEY);
    const storedTheme = localStorage.getItem('knapsack_theme');

    if (!migrated) {
      localStorage.setItem(LIGHT_THEME_MIGRATION_KEY, 'true');
      localStorage.setItem('knapsack_theme', 'false');
      return false;
    }

    return storedTheme !== null ? JSON.parse(storedTheme) : false;
  });

  useLayoutEffect(() => {
    const root = document.documentElement;
    const bg = isDark ? DARK_APP_BG : LIGHT_APP_BG;
    root.style.backgroundColor = bg;
    root.style.colorScheme = isDark ? 'dark' : 'light';
    document.body.style.backgroundColor = bg;
    root.classList.toggle('dark', isDark);
    root.classList.toggle('light', !isDark);
  }, [isDark]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev: boolean) => {
      const next = !prev;
      localStorage.setItem('knapsack_theme', JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
