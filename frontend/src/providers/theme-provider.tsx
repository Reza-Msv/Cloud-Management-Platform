"use client";

import React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { AppThemeProvider, useAppTheme } from "@/hooks/use-app-theme";

interface ThemeConsumerProps {
  children: React.ReactNode;
}

function ThemeConsumer({ children }: ThemeConsumerProps) {
  const { resolvedTheme } = useAppTheme();

  return (
    <NextThemesProvider
      attribute="class"
      forcedTheme={resolvedTheme}
      enableSystem={false}
      enableColorScheme={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <AppThemeProvider>
      <ThemeConsumer>{children}</ThemeConsumer>
    </AppThemeProvider>
  );
}
