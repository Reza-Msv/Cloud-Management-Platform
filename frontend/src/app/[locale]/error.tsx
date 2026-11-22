"use client";

import React, { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  const t = useTranslations("Errors");

  useEffect(() => {
    // Log error to an error reporting service if configured
    console.error("Application error boundary triggered:", error);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertCircle className="h-7 w-7" />
      </div>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
        {t("serverErrorTitle")}
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {t("serverErrorDescription")}
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          Digest: {error.digest}
        </p>
      )}
      <div className="mt-6">
        <Button onClick={reset} variant="default" size="default">
          <RefreshCw className="h-4 w-4 me-2" />
          {t("retry")}
        </Button>
      </div>
    </div>
  );
}
