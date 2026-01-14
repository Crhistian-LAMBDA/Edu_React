import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'colegio_color_mode';

const ColorModeContext = createContext({
  mode: 'dark',
  setMode: () => {},
  toggleColorMode: () => {},
});

export function ColorModeProvider({ children }) {
  const [mode, setMode] = useState('dark');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        setMode(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(() => {
    const toggleColorMode = () => {
      setMode((prev) => {
        const next = prev === 'dark' ? 'light' : 'dark';
        try {
          localStorage.setItem(STORAGE_KEY, next);
        } catch {
          // ignore
        }
        return next;
      });
    };

    const setModeSafe = (next) => {
      const nextMode = next === 'light' ? 'light' : 'dark';
      setMode(nextMode);
      try {
        localStorage.setItem(STORAGE_KEY, nextMode);
      } catch {
        // ignore
      }
    };

    return {
      mode,
      setMode: setModeSafe,
      toggleColorMode,
    };
  }, [mode]);

  return <ColorModeContext.Provider value={value}>{children}</ColorModeContext.Provider>;
}

export function useColorMode() {
  return useContext(ColorModeContext);
}
