"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LanguageToggle() {
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLanguage = () => {
    const nextLocale = currentLocale === "en" ? "fa" : "en";
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      aria-label="Switch Language"
      className="h-8 px-2 text-xs font-medium"
      data-testid="language-toggle-btn"
    >
      <Globe className="h-4 w-4 me-1.5" />
      <span>{currentLocale === "en" ? "فارسی" : "English"}</span>
    </Button>
  );
}
