import { CustomerDetailView } from "@/features/customers/components/customer-detail-view";

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;
  return <CustomerDetailView customerId={parseInt(id, 10)} />;
}
