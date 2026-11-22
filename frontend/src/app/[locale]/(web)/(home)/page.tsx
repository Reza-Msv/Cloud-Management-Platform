import React from "react";
import Image from "next/image";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Activity, ShieldCheck, Database, ArrowRight, Server } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
  };
}

export function HomeView() {
  const tCommon = useTranslations("Common");
  const tLanding = useTranslations("Landing");
  const tNav = useTranslations("Navigation");

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-border bg-card/70 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Brand Identity */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 p-1 shadow-xs ring-1 ring-primary/20">
              <Image
                src="/logo-symbol.svg"
                alt="Cloud Management Platform Logo"
                width={32}
                height={32}
                priority
                className="h-8 w-8"
              />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-none tracking-tight">
                {tCommon("title")}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                {tCommon("description")}
              </p>
            </div>
          </Link>

          {/* Header Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle />
            <ThemeToggle />
            <Button asChild size="sm" className="ms-2">
              <Link href="/login" data-testid="landing-login-btn" className="inline-flex items-center">
                <span>{tNav("login")}</span>
                <ArrowRight className="ms-1.5 h-3.5 w-3.5 shrink-0 rtl:rotate-180" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1 text-xs font-medium text-muted-foreground shadow-xs">
              <Activity className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
              <span>{tLanding("badge")}</span>
            </div>

            {/* Headline */}
            <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-5xl">
              {tLanding("heroTitle")}
            </h2>

            {/* Subtitle */}
            <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
              {tLanding("heroSubtitle")}
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="px-6 shadow-sm">
                <Link href="/login" className="inline-flex items-center">
                  <span>{tLanding("signIn")}</span>
                  <ArrowRight className="ms-2 h-4 w-4 shrink-0 rtl:rotate-180" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="px-6">
                <Link href="/dashboard" className="inline-flex items-center">
                  <span>{tLanding("goToDashboard")}</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Three Feature Highlight Cards */}
          <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card 1: Cloud Resource Monitoring */}
            <div className="group rounded-2xl border border-border bg-card p-6 shadow-xs transition-all hover:border-primary/40 hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Server className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">
                {tLanding("feature1Title")}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {tLanding("feature1Desc")}
              </p>
            </div>

            {/* Card 2: Security & Governance */}
            <div className="group rounded-2xl border border-border bg-card p-6 shadow-xs transition-all hover:border-emerald-500/40 hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">
                {tLanding("feature2Title")}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {tLanding("feature2Desc")}
              </p>
            </div>

            {/* Card 3: Service Orchestration */}
            <div className="group rounded-2xl border border-border bg-card p-6 shadow-xs transition-all hover:border-indigo-500/40 hover:shadow-md sm:col-span-2 lg:col-span-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                <Database className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">
                {tLanding("feature3Title")}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {tLanding("feature3Desc")}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/40 py-6">
        <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-xs text-muted-foreground">
            &copy; 2026 {tCommon("title")}. {tLanding("footerRights")}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="font-mono">Next.js 16.4.6</span>
            <span>&bull;</span>
            <span className="font-mono">Tailwind CSS 4.3.5</span>
            <span>&bull;</span>
            <span className="font-mono">next-intl 4.15.3</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomeView />;
}
