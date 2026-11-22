"use client";

import React, { useEffect } from "react";
import { AppThemeProvider, useAppTheme } from "@/hooks/use-app-theme";

interface ThemeDomEffectProps {
  children: React.ReactNode;
}

/**
 * ThemeDomEffect
 *
 * Applies the resolved theme ("light" | "dark") directly to the documentElement
 * via standard DOM classList synchronization.
 *
 * ARCHITECTURAL GUARANTEES:
 * 1. STRICT ZERO STORAGE: Never calls localStorage, sessionStorage, document.cookie, or IndexedDB.
 * 2. REACT 19 / NEXT.JS 16 CLEAN: Eliminates the NextThemesProvider inline <script> tag warning
 *    ("Encountered a script tag while rendering React component").
 * 3. INSTANT CLIENT SYNC: Syncs with system preference and in-memory manual toggles.
 */
function ThemeDomEffect({ children }: ThemeDomEffectProps) {
  const { resolvedTheme } = useAppTheme();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    if (resolvedTheme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }, [resolvedTheme]);

  return <>{children}</>;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <AppThemeProvider>
      <ThemeDomEffect>{children}</ThemeDomEffect>
    </AppThemeProvider>
  );
}
