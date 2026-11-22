"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { useServices, useUpdateServiceStatus } from "../hooks/use-services";
import { PageHeader } from "@/components/shared/page-header";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select } from "@/components/ui/select";
import { SERVICE_TYPES } from "@/constants";
import { Server, RefreshCw, Eye, Filter } from "lucide-react";
import { ServiceStatus } from "@/types";
import { formatDate } from "@/lib/utils";

export function ServiceListView() {
  const t = useTranslations("Services");
  const tStatus = useTranslations("serviceStatus");
  const tCommon = useTranslations("Common");
  const locale = useLocale();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");

  const { data, isLoading, isError, error } = useServices({
    page,
    page_size: pageSize,
    status: statusFilter || undefined,
    service_type: typeFilter || undefined,
  });

  const updateStatusMutation = useUpdateServiceStatus(0);

  const handleToggleStatus = async (serviceId: number, currentStatus: ServiceStatus) => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    if (confirm(t("confirmStatusChange", { status: nextStatus }))) {
      await updateStatusMutation.mutateAsync(nextStatus);
    }
  };

  const breadcrumbs = [
    { label: tCommon("title"), href: "/dashboard" },
    { label: t("title") },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />

      <PageHeader title={t("title")} description={t("description")} />

      {/* Filter Bar */}
      <Card className="border-border">
        <CardContent className="p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <Filter className="h-4 w-4" />
            <span>{tCommon("filter")}:</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs">{t("status")}:</span>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{tCommon("all")}</option>
              <option value="active">{tStatus("active")}</option>
              <option value="suspended">{tStatus("suspended")}</option>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs">{t("type")}:</span>
            <Select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{tCommon("all")}</option>
              {SERVICE_TYPES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.value.toUpperCase()}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card className="border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tCommon("id")}</TableHead>
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("type")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("customer")}</TableHead>
                <TableHead>{tCommon("created")}</TableHead>
                <TableHead className="text-end">{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    {tCommon("loading")}
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-destructive">
                    {error instanceof Error ? error.message : "Error loading services"}
                  </TableCell>
                </TableRow>
              ) : data?.results && data.results.length > 0 ? (
                data.results.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-mono text-xs">{service.id}</TableCell>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell className="font-mono text-xs">{service.service_type}</TableCell>
                    <TableCell>
                      <Badge
                        variant={service.status === "active" ? "success" : "warning"}
                        className="capitalize"
                      >
                        {tStatus(service.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/customers/${service.customer}`}
                        className="text-xs font-medium text-primary hover:underline font-mono"
                      >
                        #{service.customer}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(service.created_at, locale)}
                    </TableCell>
                    <TableCell className="text-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(service.id, service.status)}
                        className="h-7 text-xs"
                      >
                        <RefreshCw className="h-3 w-3 me-1" />
                        <span>{t("changeStatus")}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    {tCommon("noData")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {data && data.count > 0 && (
            <div className="border-t border-border px-4">
              <Pagination
                page={page}
                totalCount={data.count}
                pageSize={pageSize}
                onPageChange={setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
