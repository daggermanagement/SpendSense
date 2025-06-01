
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { themes, type AppTheme, type ThemeColors } from '@/themes';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: AppTheme;
  mode: ThemeMode;
  setThemeByName: (themeName: string) => void;
  toggleMode: () => void;
  availableThemes: AppTheme[];
  hasMounted: boolean; // Expose hasMounted for potential conditional rendering by consumers
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const applyThemeStyles = (colors: ThemeColors) => {
  const root = document.documentElement;
  Object.entries(colors).forEach(([key, value]) => {
    const cssVarName = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssVarName, value);
  });
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize with server-safe defaults
  const [currentThemeName, setCurrentThemeName] = useState<string>(themes[0].name);
  const [mode, setMode] = useState<ThemeMode>('light');
  const [hasMounted, setHasMounted] = useState(false);

  // Effect to signal that the component has mounted on the client
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Effect to load saved theme and mode from localStorage or determine from system prefs AFTER mounting
  useEffect(() => {
    if (hasMounted) {
      const storedTheme = localStorage.getItem('appTheme') || themes[0].name;
      setCurrentThemeName(storedTheme);

      const storedMode = localStorage.getItem('appMode') as ThemeMode;
      if (storedMode) {
        setMode(storedMode);
      } else {
        setMode(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      }
    }
  }, [hasMounted]);

  const theme = themes.find(t => t.name === currentThemeName) || themes[0];

  // Effect to apply theme styles and update localStorage
  useEffect(() => {
    if (hasMounted) {
      const root = document.documentElement;
      const colorsToApply = mode === 'dark' ? theme.dark : theme.light;
      applyThemeStyles(colorsToApply);

      if (mode === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      localStorage.setItem('appTheme', theme.name);
      localStorage.setItem('appMode', mode);
    }
  }, [theme, mode, hasMounted]); // theme itself depends on currentThemeName, which is updated after mount

  // Listener for system theme changes
  useEffect(() => {
    if (hasMounted) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        // Only update if no explicit mode is set by user in localStorage
        if (!localStorage.getItem('appMode')) {
          setMode(e.matches ? 'dark' : 'light');
        }
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [hasMounted]);


  const setThemeByName = useCallback((themeName: string) => {
    const newTheme = themes.find(t => t.name === themeName);
    if (newTheme) {
      setCurrentThemeName(newTheme.name);
    }
  }, []);

  const toggleMode = useCallback(() => {
    setMode(prevMode => (prevMode === 'light' ? 'dark' : 'light'));
  }, []);

  // The theme object passed to the provider should be based on the stateful currentThemeName
  const currentThemeObject = themes.find(t => t.name === currentThemeName) || themes[0];

  return (
    <ThemeContext.Provider value={{ theme: currentThemeObject, mode, setThemeByName, toggleMode, availableThemes: themes, hasMounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
