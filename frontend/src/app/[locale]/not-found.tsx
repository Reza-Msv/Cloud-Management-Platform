import Link from "next/link";
import { useTranslations } from "next-intl";
import { FileQuestion, Home } from "lucide-react";

export default function NotFoundPage() {
  const tErrors = useTranslations("Errors");
  const tNav = useTranslations("Navigation");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <FileQuestion className="h-7 w-7" />
      </div>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
        {tErrors("notFoundTitle")}
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {tErrors("notFoundDescription")}
      </p>
      <div className="mt-6">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Home className="h-4 w-4 me-2" />
          {tNav("home")}
        </Link>
      </div>
    </div>
  );
}
