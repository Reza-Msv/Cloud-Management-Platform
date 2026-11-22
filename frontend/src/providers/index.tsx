"use client";

import React from "react";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "sonner";
import { useLocale } from "next-intl";
import { useAppTheme } from "@/hooks/use-app-theme";

function AppToaster() {
  const locale = useLocale();
  const isRtl = locale === "fa";
  const { resolvedTheme } = useAppTheme();

  return (
    <Toaster
      theme={resolvedTheme as "light" | "dark" | "system"}
      position={isRtl ? "top-left" : "top-right"}
      dir={isRtl ? "rtl" : "ltr"}
      richColors
      closeButton
      toastOptions={{
        className: isRtl ? "font-persian" : "font-sans",
        style: {
          fontFamily: isRtl
            ? 'var(--font-persian), "Vazirmatn", "IRANYekan", "Tahoma", sans-serif'
            : undefined,
        },
      }}
    />
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        {children}
        <AppToaster />
      </QueryProvider>
    </ThemeProvider>
  );
}

export { ThemeProvider };
export { QueryProvider };
