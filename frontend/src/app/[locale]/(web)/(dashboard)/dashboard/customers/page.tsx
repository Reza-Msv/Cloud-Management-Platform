import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CustomerListView } from "@/features/customers/components/customer-list-view";

interface CustomersPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CustomersPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("customersTitle"),
    description: t("customersDescription"),
  };
}

export default function CustomersPage() {
  return <CustomerListView />;
}
