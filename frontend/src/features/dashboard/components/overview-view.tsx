"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useServices } from "@/features/services/hooks/use-services";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Server, CheckCircle2, PauseCircle, ArrowRight, BarChart3, PieChart } from "lucide-react";

// Stable query parameter objects to avoid re-triggering query observer changes on re-renders
const CUSTOMERS_QUERY_PARAMS = { page: 1, page_size: 5 };
const TOTAL_SERVICES_QUERY_PARAMS = { page: 1, page_size: 5 };
const ACTIVE_SERVICES_QUERY_PARAMS = { status: "active", page: 1, page_size: 1 };
const SUSPENDED_SERVICES_QUERY_PARAMS = { status: "suspended", page: 1, page_size: 1 };

export function OverviewView() {
  const t = useTranslations("Dashboard");
  const tNav = useTranslations("Navigation");
  const tStatus = useTranslations("serviceStatus");

  // Derive counts from existing backend pagination metadata count
  const { data: customersData, isLoading: isCustomersLoading } = useCustomers(CUSTOMERS_QUERY_PARAMS);

  const { data: totalServicesData, isLoading: isServicesLoading } = useServices(TOTAL_SERVICES_QUERY_PARAMS);

  const { data: activeServicesData } = useServices(ACTIVE_SERVICES_QUERY_PARAMS);

  const { data: suspendedServicesData } = useServices(SUSPENDED_SERVICES_QUERY_PARAMS);

  const totalCustomers = customersData?.count ?? 0;
  const totalServices = totalServicesData?.count ?? 0;
  const activeServices = activeServicesData?.count ?? 0;
  const suspendedServices = suspendedServicesData?.count ?? 0;

  return (
    <div className="space-y-8">
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

      {/* Analytics & Metrics Visual Chart Section */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between py-5">
          <div className="space-y-1.5">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span>{t("analytics")}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {t("analyticsDesc")}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Visual Bar Comparison Chart */}
            <div className="space-y-4">
              {[
                {
                  label: t("totalCustomers"),
                  value: totalCustomers,
                  color: "bg-primary",
                  textColor: "text-primary",
                  icon: Users,
                },
                {
                  label: t("totalServices"),
                  value: totalServices,
                  color: "bg-indigo-500",
                  textColor: "text-indigo-600 dark:text-indigo-400",
                  icon: Server,
                },
                {
                  label: t("activeServices"),
                  value: activeServices,
                  color: "bg-emerald-500",
                  textColor: "text-emerald-600 dark:text-emerald-400",
                  icon: CheckCircle2,
                },
                {
                  label: t("suspendedServices"),
                  value: suspendedServices,
                  color: "bg-amber-500",
                  textColor: "text-amber-600 dark:text-amber-400",
                  icon: PauseCircle,
                },
              ].map((item) => {
                const maxVal = Math.max(totalCustomers, totalServices, 1);
                const percent = Math.min(Math.round((item.value / maxVal) * 100), 100);
                const Icon = item.icon;
                return (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        <Icon className={`h-3.5 w-3.5 ${item.textColor}`} />
                        {item.label}
                      </span>
                      <span className="font-mono font-semibold">{item.value}</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all duration-700 ease-out`}
                        style={{ width: `${item.value === 0 ? 0 : Math.max(percent, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Circular Ratio Breakdown */}
            <div className="flex flex-col items-center justify-center p-6 rounded-xl border border-border/60 bg-muted/20">
              <div className="relative flex h-36 w-36 items-center justify-center">
                {/* SVG circular donut chart */}
                <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                  {/* Background Circle */}
                  <path
                    className="text-muted stroke-current"
                    strokeWidth="3.5"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Customers Stroke */}
                  <path
                    className="text-primary stroke-current transition-all duration-700"
                    strokeDasharray={`${
                      totalCustomers + totalServices > 0
                        ? Math.round((totalCustomers / (totalCustomers + totalServices)) * 100)
                        : 0
                    }, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Active Services Stroke */}
                  {totalServices > 0 && activeServices > 0 && (
                    <path
                      className="text-emerald-500 stroke-current transition-all duration-700"
                      strokeDasharray={`${Math.round((activeServices / (totalCustomers + totalServices)) * 100)}, 100`}
                      strokeDashoffset={`-${Math.round((totalCustomers / (totalCustomers + totalServices)) * 100)}`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  )}
                  {/* Suspended Services Stroke */}
                  {totalServices > 0 && suspendedServices > 0 && (
                    <path
                      className="text-amber-500 stroke-current transition-all duration-700"
                      strokeDasharray={`${Math.round((suspendedServices / (totalCustomers + totalServices)) * 100)}, 100`}
                      strokeDashoffset={`-${Math.round(((totalCustomers + activeServices) / (totalCustomers + totalServices)) * 100)}`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  )}
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold tracking-tight">
                    {totalCustomers + totalServices}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">
                    {t("distribution")}
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span>{t("totalCustomers")}: {totalCustomers}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>{t("activeServices")}: {activeServices}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>{t("suspendedServices")}: {suspendedServices}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Records Panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Customers */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-sm font-semibold">{t("recentCustomers")}</CardTitle>
              <CardDescription className="text-xs py-1">
                {t("recentCustomersDesc")}
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
                {t("noRecentCustomers")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Services */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-sm font-semibold">{t("recentServices")}</CardTitle>
              <CardDescription className="text-xs py-1">
                {t("recentServicesDesc")}
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
                      {tStatus(s.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-xs text-muted-foreground">
                {t("noRecentServices")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
