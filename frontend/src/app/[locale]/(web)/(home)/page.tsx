import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Cloud, Activity, ShieldCheck, Database } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export function HomeView() {
  const t = useTranslations("Common");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-none tracking-tight">
                {t("title")}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("description")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs">
              <Activity className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
              <span>{t("status")}</span>
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {t("welcome")}
            </h2>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              {t("description")}
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs transition-shadow hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Cloud className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{t("title")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Centralized cloud resource monitoring and provisioning.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs transition-shadow hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Security & Governance</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Role-based access, audit trails, and strict enterprise compliance.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs transition-shadow hover:shadow-md sm:col-span-2 lg:col-span-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Database className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Service Orchestration</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Seamless customer onboarding and automated lifecycle orchestration.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card/40 py-6">
        <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-xs text-muted-foreground">
            &copy; 2026 Cloud Management Platform. All rights reserved.
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

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomeView />;
}
