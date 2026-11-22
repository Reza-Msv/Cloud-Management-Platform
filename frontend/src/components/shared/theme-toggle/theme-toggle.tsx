"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Moon, Sun, Monitor } from "lucide-react";
import { useAppTheme } from "@/hooks/use-app-theme";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const t = useTranslations("Theme");
  const { theme, setTheme, resolvedTheme } = useAppTheme();

  return (
    <div
      role="group"
      aria-label={t("toggle")}
      data-testid="theme-toggle-group"
      data-current-theme={theme}
      data-resolved-theme={resolvedTheme}
      className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-xs"
    >
      <Button
        type="button"
        variant={theme === "light" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => setTheme("light")}
        aria-pressed={theme === "light"}
        data-testid="theme-light-btn"
        className="h-8 px-2.5 text-xs font-medium"
      >
        <Sun className="h-4 w-4" aria-hidden="true" />
        <span className="ms-1.5">{t("light")}</span>
      </Button>

      <Button
        type="button"
        variant={theme === "dark" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => setTheme("dark")}
        aria-pressed={theme === "dark"}
        data-testid="theme-dark-btn"
        className="h-8 px-2.5 text-xs font-medium"
      >
        <Moon className="h-4 w-4" aria-hidden="true" />
        <span className="ms-1.5">{t("dark")}</span>
      </Button>

      <Button
        type="button"
        variant={theme === "system" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => setTheme("system")}
        aria-pressed={theme === "system"}
        data-testid="theme-system-btn"
        className="h-8 px-2.5 text-xs font-medium"
      >
        <Monitor className="h-4 w-4" aria-hidden="true" />
        <span className="ms-1.5">{t("system")}</span>
      </Button>
    </div>
  );
}
