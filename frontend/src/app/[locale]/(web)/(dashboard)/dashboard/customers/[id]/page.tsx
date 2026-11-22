import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CustomerDetailView } from "@/features/customers/components/customer-detail-view";

interface CustomerDetailPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({ params }: CustomerDetailPageProps): Promise<Metadata> {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("customerDetailTitle", { id }),
    description: t("customerDetailDescription", { id }),
  };
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;
  return <CustomerDetailView customerId={parseInt(id, 10)} />;
}
