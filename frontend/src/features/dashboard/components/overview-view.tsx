"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useServices } from "@/features/services/hooks/use-services";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Server, CheckCircle2, PauseCircle, ArrowRight } from "lucide-react";

export function OverviewView() {
  const t = useTranslations("Dashboard");
  const tNav = useTranslations("Navigation");

  // Derive counts from existing backend pagination metadata count
  const { data: customersData, isLoading: isCustomersLoading } = useCustomers({
    page: 1,
    page_size: 5,
  });

  const { data: totalServicesData, isLoading: isServicesLoading } = useServices({
    page: 1,
    page_size: 5,
  });

  const { data: activeServicesData } = useServices({
    status: "active",
    page: 1,
    page_size: 1,
  });

  const { data: suspendedServicesData } = useServices({
    status: "suspended",
    page: 1,
    page_size: 1,
  });

  const totalCustomers = customersData?.count ?? 0;
  const totalServices = totalServicesData?.count ?? 0;
  const activeServices = activeServicesData?.count ?? 0;
  const suspendedServices = suspendedServicesData?.count ?? 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("overview")}
        description={t("overviewDescription")}
      />

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("totalCustomers")}
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              {isCustomersLoading ? "..." : totalCustomers}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {t("totalCustomersDesc")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("totalServices")}
            </CardTitle>
            <Server className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              {isServicesLoading ? "..." : totalServices}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {t("totalServicesDesc")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("activeServices")}
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {isServicesLoading ? "..." : activeServices}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {t("activeServicesDesc")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("suspendedServices")}
            </CardTitle>
            <PauseCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
              {isServicesLoading ? "..." : suspendedServices}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {t("suspendedServicesDesc")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Records Panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Customers */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-sm font-semibold">{t("recentCustomers")}</CardTitle>
              <CardDescription className="text-xs">
                Recently registered enterprise clients
              </CardDescription>
            </div>
            <Link
              href="/dashboard/customers"
              className="inline-flex items-center text-xs font-medium text-primary hover:underline"
            >
              <span>{t("viewAll")}</span>
              <ArrowRight className="h-3.5 w-3.5 ms-1 rtl:rotate-180" />
            </Link>
          </CardHeader>
          <CardContent>
            {customersData?.results && customersData.results.length > 0 ? (
              <div className="divide-y divide-border">
                {customersData.results.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-medium">{c.full_name}</p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {c.phone}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-xs text-muted-foreground">
                No recent customer activity.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Services */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-sm font-semibold">{t("recentServices")}</CardTitle>
              <CardDescription className="text-xs">
                Recently provisioned cloud infrastructure
              </CardDescription>
            </div>
            <Link
              href="/dashboard/services"
              className="inline-flex items-center text-xs font-medium text-primary hover:underline"
            >
              <span>{t("viewAll")}</span>
              <ArrowRight className="h-3.5 w-3.5 ms-1 rtl:rotate-180" />
            </Link>
          </CardHeader>
          <CardContent>
            {totalServicesData?.results && totalServicesData.results.length > 0 ? (
              <div className="divide-y divide-border">
                {totalServicesData.results.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {s.service_type}
                      </p>
                    </div>
                    <Badge
                      variant={s.status === "active" ? "success" : "warning"}
                      className="capitalize text-[10px]"
                    >
                      {s.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-xs text-muted-foreground">
                No recent services deployed.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
