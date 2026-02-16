'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { lightTheme, darkTheme } from '../../lib/themes';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load from localStorage
    const saved = localStorage.getItem('familyPlannerTheme');
    if (saved === 'dark') {
      setIsDarkMode(true);
    } else if (saved === null) {
      // Detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('familyPlannerTheme', newValue ? 'dark' : 'light');
      return newValue;
    });
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      <div style={{
        backgroundColor: theme.main,
        backgroundImage: theme.mainGradient,
        color: theme.card.text,
        minHeight: '100vh',
        transition: 'background-color 0.3s ease, color 0.3s ease',
        visibility: mounted ? 'visible' : 'hidden'
      }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
