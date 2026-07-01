"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext({ theme: "light", toggleTheme: () => {}, setTheme: () => {} });
const FORCE_DARK = false;

const getInitialTheme = () => {
  if (FORCE_DARK) return "dark";
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") return stored;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
};

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setThemeState(getInitialTheme());
    setMounted(true);
  }, []);

  // Listen for system theme changes in real-time
  useEffect(() => {
    if (FORCE_DARK || typeof window === "undefined") return;
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleSystemThemeChange = (e) => {
      // Only auto-switch if user hasn't manually set a preference
      const stored = localStorage.getItem("theme");
      if (stored !== "dark" && stored !== "light") {
        setThemeState(e.matches ? "dark" : "light");
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleSystemThemeChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleSystemThemeChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleSystemThemeChange);
      } else {
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, []);

  // Apply theme to HTML tag when it changes (but do NOT write to localStorage automatically here)
  useEffect(() => {
    if (!mounted) return;
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = FORCE_DARK ? "dark" : theme;
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    if (FORCE_DARK) return;
    const newTheme = theme === "dark" ? "light" : "dark";
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const setTheme = (newTheme) => {
    if (FORCE_DARK) return;
    if (newTheme === "dark" || newTheme === "light") {
      setThemeState(newTheme);
      localStorage.setItem("theme", newTheme);
    } else if (newTheme === "system") {
      localStorage.removeItem("theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setThemeState(prefersDark ? "dark" : "light");
    }
  };

  const value = useMemo(() => ({ theme, toggleTheme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
