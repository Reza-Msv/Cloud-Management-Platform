"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { DashboardShell } from "@/components/shared/dashboard-shell";

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isError } = useAuth();
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    // Only redirect to login once the auth check has settled and confirmed failure.
    // Avoid triggering premature redirects while loading or before isError settles.
    if (!isLoading && (isError || !isAuthenticated)) {
      router.replace(`/${locale}/login`);
    }
  }, [isLoading, isError, isAuthenticated, router, locale]);

  // Keep children unmounted while authenticating session or if unauthenticated
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">Authenticating session...</p>
        </div>
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
