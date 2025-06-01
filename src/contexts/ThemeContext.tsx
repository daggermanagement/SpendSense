
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
  const [currentThemeName, setCurrentThemeName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('appTheme') || themes[0].name;
    }
    return themes[0].name;
  });

  const [mode, setMode] = useState<ThemeMode>(() => {
     if (typeof window !== 'undefined') {
      const storedMode = localStorage.getItem('appMode') as ThemeMode;
      if (storedMode) return storedMode;
      // Fallback to system preference if no mode is stored
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light'; // Default for server rendering or if window is not available
  });

  const theme = themes.find(t => t.name === currentThemeName) || themes[0];

  useEffect(() => {
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
  }, [theme, mode]);

  // Listener for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if no explicit mode is set by user in localStorage
      if (!localStorage.getItem('appMode')) {
        setMode(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);


  const setThemeByName = useCallback((themeName: string) => {
    const newTheme = themes.find(t => t.name === themeName);
    if (newTheme) {
      setCurrentThemeName(newTheme.name);
    }
  }, []);

  const toggleMode = useCallback(() => {
    setMode(prevMode => (prevMode === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, mode, setThemeByName, toggleMode, availableThemes: themes }}>
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
