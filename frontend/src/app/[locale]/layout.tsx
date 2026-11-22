import React from "react";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { routing, getLocaleDirection } from "@/i18n/routing";
import { AppProviders } from "@/providers";
import "@/app/globals.css";

// Persian Font (Vazirmatn / Yekan standard) configured locally via next/font/local
const persianFont = localFont({
  src: [
    {
      path: "../../../public/fonts/Vazirmatn-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../public/fonts/Vazirmatn-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-persian",
  display: "swap",
});

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return {
      title: "Cloud Management Platform",
    };
  }

  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: {
      template: `%s | ${t("siteTitle")}`,
      default: t("siteTitle"),
    },
    description: t("homeDescription"),
    icons: {
      icon: "/favicon.svg",
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = getLocaleDirection(locale);
  const isPersian = locale === "fa";

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={isPersian ? persianFont.variable : undefined}
    >
      <body
        suppressHydrationWarning
        className={`min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 ${
          isPersian ? "font-persian" : "font-sans"
        }`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppProviders>{children}</AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
