import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ServiceListView } from "@/features/services/components/service-list-view";

interface ServicesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ServicesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("servicesTitle"),
    description: t("servicesDescription"),
  };
}

export default function ServicesPage() {
  return <ServiceListView />;
}
