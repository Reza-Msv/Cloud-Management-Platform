import { useTranslations } from "next-intl";

export default function Loading() {
  const t = useTranslations("Common");

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
      <p className="mt-4 text-sm font-medium text-muted-foreground">{t("loading")}</p>
      <span className="sr-only">{t("loading")}</span>
    </div>
  );
}
