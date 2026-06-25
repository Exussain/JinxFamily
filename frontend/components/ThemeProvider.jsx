"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext({ theme: "light", toggleTheme: () => {}, setTheme: () => {} });
const FORCE_DARK = true;

const getInitialTheme = () => {
  if (FORCE_DARK) return "dark";
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("theme");
  // If user has manually set a theme, respect it
  if (stored === "dark" || stored === "light") return stored;
  // Otherwise, follow system preference
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(getInitialTheme());
    setMounted(true);
  }, []);

  // Listen for system theme changes in real-time
  useEffect(() => {
    if (FORCE_DARK || typeof window === "undefined") return;
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleSystemThemeChange = (e) => {
      // Only auto-switch if user hasn't manually set a preference
      const stored = localStorage.getItem("theme");
      if (!stored) {
        setTheme(e.matches ? "dark" : "light");
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

  useEffect(() => {
    if (!mounted) return;
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = FORCE_DARK ? "dark" : theme;
    }
    if (typeof window !== "undefined") {
      if (FORCE_DARK) {
        localStorage.setItem("theme", "dark");
      } else {
        localStorage.setItem("theme", theme);
      }
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    if (FORCE_DARK) return;
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const value = useMemo(() => ({ theme, toggleTheme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
