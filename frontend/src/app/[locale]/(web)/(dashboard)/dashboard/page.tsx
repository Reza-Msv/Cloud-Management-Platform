import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { OverviewView } from "@/features/dashboard/components/overview-view";

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: DashboardPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("dashboardTitle"),
    description: t("dashboardDescription"),
  };
}

export default function DashboardPage() {
  return <OverviewView />;
}
