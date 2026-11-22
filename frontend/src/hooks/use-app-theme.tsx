"use client";

import React, { createContext, useContext, useSyncExternalStore, useState } from "react";

export type Theme = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export interface AppThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

export const AppThemeContext = createContext<AppThemeContextValue | undefined>(undefined);

export function useAppTheme(): AppThemeContextValue {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within an AppThemeProvider");
  }
  return context;
}

function subscribeToSystemTheme(callback: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", callback);
    return () => mediaQuery.removeEventListener("change", callback);
  } else if (
    typeof (mediaQuery as unknown as { addListener: (cb: () => void) => void }).addListener === "function"
  ) {
    (mediaQuery as unknown as { addListener: (cb: () => void) => void }).addListener(callback);
    return () =>
      (mediaQuery as unknown as { removeListener: (cb: () => void) => void }).removeListener(callback);
  }
  return () => {};
}

function getSystemThemeSnapshot(): ResolvedTheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getSystemThemeServerSnapshot(): ResolvedTheme {
  return "light";
}

export interface AppThemeProviderProps {
  children: React.ReactNode;
}

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  // STRICT ZERO-STORAGE CONSTRAINT:
  // Theme state is held strictly in React memory (useState).
  // Neither localStorage, sessionStorage, cookies, nor IndexedDB are ever accessed or written.
  // Initial state is always "system", ensuring every refresh reverts to OS preference.
  const [theme, setTheme] = useState<Theme>("system");

  const systemTheme = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemThemeSnapshot,
    getSystemThemeServerSnapshot
  );

  const resolvedTheme: ResolvedTheme = theme === "system" ? systemTheme : theme;

  const value: AppThemeContextValue = {
    theme,
    resolvedTheme,
    setTheme,
  };

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}
