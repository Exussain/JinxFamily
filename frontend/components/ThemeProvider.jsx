"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext({ theme: "dark", toggleTheme: () => {}, setTheme: () => {} });
const FORCE_DARK = false;
const THEME_STORAGE_KEY = "theme";

const getInitialTheme = () => {
  if (FORCE_DARK) return "dark";
  if (typeof window === "undefined") return "dark";
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
    return "dark";
  } catch {
    return "dark";
  }
};

const applyDocumentTheme = (nextTheme) => {
  if (typeof document === "undefined") return;
  const resolved = FORCE_DARK ? "dark" : nextTheme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
};

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const syncTheme = () => {
      const nextTheme = getInitialTheme();
      applyDocumentTheme(nextTheme);
      setThemeState(nextTheme);
    };

    syncTheme();
    setMounted(true);

    const handlePageShow = () => syncTheme();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") syncTheme();
    };
    const handleStorage = (event) => {
      if (event.key === THEME_STORAGE_KEY) syncTheme();
    };

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Listen for system theme changes in real-time
  useEffect(() => {
    if (FORCE_DARK || typeof window === "undefined") return;
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleSystemThemeChange = (e) => {
      // Only auto-switch if user hasn't manually set a preference
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored !== "dark" && stored !== "light") {
        const nextTheme = e.matches ? "dark" : "light";
        applyDocumentTheme(nextTheme);
        setThemeState(nextTheme);
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
    applyDocumentTheme(theme);
  }, [theme, mounted]);

  const toggleTheme = () => {
    if (FORCE_DARK) return;
    const newTheme = theme === "dark" ? "light" : "dark";
    applyDocumentTheme(newTheme);
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  const setTheme = (newTheme) => {
    if (FORCE_DARK) return;
    if (newTheme === "dark" || newTheme === "light") {
      applyDocumentTheme(newTheme);
      setThemeState(newTheme);
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } else if (newTheme === "system") {
      localStorage.removeItem(THEME_STORAGE_KEY);
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const resolvedTheme = prefersDark ? "dark" : "light";
      applyDocumentTheme(resolvedTheme);
      setThemeState(resolvedTheme);
    }
  };

  const value = useMemo(() => ({ theme, toggleTheme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
