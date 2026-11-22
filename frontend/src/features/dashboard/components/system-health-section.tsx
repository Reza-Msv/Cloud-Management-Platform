"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useGoHealth, useGoServiceStatusLookup } from "../hooks/use-go-health";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Activity,
  Server,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Clock,
  Layers,
  ArrowRight,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export function SystemHealthSection() {
  const t = useTranslations("Dashboard");
  const tCommon = useTranslations("Common");
  const tTypes = useTranslations("serviceTypes");
  const tStatus = useTranslations("serviceStatus");
  const locale = useLocale();

  // Go Runtime Health Query
  const {
    data: healthData,
    isLoading: isHealthLoading,
    isError: isHealthError,
    error: healthError,
    refetch: refetchHealth,
    dataUpdatedAt,
  } = useGoHealth();

  // Service Status Lookup State
  const [inputServiceId, setInputServiceId] = useState("");
  const [queriedServiceId, setQueriedServiceId] = useState<number | undefined>(undefined);

  const {
    data: lookupData,
    isLoading: isLookupLoading,
    isError: isLookupError,
    error: lookupError,
    refetch: refetchLookup,
  } = useGoServiceStatusLookup(queriedServiceId, Boolean(queriedServiceId));

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(inputServiceId.trim(), 10);
    if (!isNaN(id) && id > 0) {
      setQueriedServiceId(id);
    }
  };

  const lastCheckedTime = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString(locale === "fa" ? "fa-IR" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  return (
    <div className="space-y-6 pt-4">
      {/* Section Header */}
      <div>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {t("systemHealthTitle")}
          </h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("systemHealthDesc")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 1. Go Runtime Status Card */}
        <Card className="border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                <span>{t("goRuntimeStatus")}</span>
              </CardTitle>
              <CardDescription className="text-xs">
                {t("goRuntimeStatusDesc")}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchHealth()}
              disabled={isHealthLoading}
              className="h-8 gap-1.5 text-xs"
              aria-label={t("refresh")}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isHealthLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{t("refresh")}</span>
            </Button>
          </CardHeader>
          <CardContent>
            {isHealthLoading && !healthData ? (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{tCommon("loading")}</p>
              </div>
            ) : isHealthError ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive flex items-start gap-3">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">{t("goServiceUnavailable")}</p>
                  <p className="text-muted-foreground">{healthError?.message || t("failedToReachGo")}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchHealth()}
                    className="mt-2 h-7 text-xs bg-background"
                  >
                    {t("retry")}
                  </Button>
                </div>
              </div>
            ) : healthData ? (
              <div className="space-y-4">
                {/* Status Indicator */}
                <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <div>
                      <p className="text-xs font-semibold capitalize">{healthData.status === "ok" ? t("healthy") : healthData.status}</p>
                      <p className="text-[11px] text-muted-foreground">{healthData.service}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-xs">
                    {t("operational")}
                  </Badge>
                </div>

                {/* Runtime Attributes Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-md border border-border p-2.5">
                    <span className="text-[11px] text-muted-foreground block">{t("version")}</span>
                    <span className="font-semibold">{healthData.version}</span>
                  </div>
                  <div className="rounded-md border border-border p-2.5">
                    <span className="text-[11px] text-muted-foreground block">{t("uptime")}</span>
                    <span className="font-semibold">{healthData.uptime}</span>
                  </div>
                  <div className="rounded-md border border-border p-2.5">
                    <span className="text-[11px] text-muted-foreground block">{t("runtimeEngine")}</span>
                    <span className="font-semibold font-mono">{healthData.go_version}</span>
                  </div>
                  <div className="rounded-md border border-border p-2.5">
                    <span className="text-[11px] text-muted-foreground block">{t("lastHealthCheck")}</span>
                    <span className="font-semibold">{lastCheckedTime || "—"}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* 2. Cloud Service Status Checker Card */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" />
              <span>{t("serviceCheckerTitle")}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {t("serviceCheckerDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Input Form */}
            <form onSubmit={handleLookupSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="1"
                  step="1"
                  placeholder={t("serviceIdPlaceholder")}
                  value={inputServiceId}
                  onChange={(e) => setInputServiceId(e.target.value)}
                  className="ps-9 h-9 text-xs"
                />
              </div>
              <Button type="submit" size="sm" disabled={isLookupLoading || !inputServiceId.trim()} className="h-9 px-3 text-xs">
                {isLookupLoading ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span>{t("checkStatus")}</span>
                )}
              </Button>
            </form>

            {/* Results / Status State Area */}
            {isLookupLoading ? (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-2 rounded-lg border border-dashed border-border">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{t("queryingServiceStatus")}</p>
              </div>
            ) : isLookupError ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive flex items-start gap-3">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="font-semibold">{t("lookupFailed")}</p>
                  <p className="text-muted-foreground truncate">{lookupError?.message || t("serviceNotFoundOrUnavailable")}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchLookup()}
                    className="mt-2 h-7 text-xs bg-background"
                  >
                    {t("retry")}
                  </Button>
                </div>
              </div>
            ) : lookupData?.service_detail ? (
              <div className="rounded-lg border border-border bg-card p-3.5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div>
                    <h3 className="font-semibold text-sm">{lookupData.service_detail.name}</h3>
                    <p className="text-[11px] text-muted-foreground">
                      {t("serviceIdLabel")}: #{lookupData.service_detail.id}
                    </p>
                  </div>
                  <Badge
                    variant={lookupData.service_detail.status === "active" ? "default" : "secondary"}
                    className={
                      lookupData.service_detail.status === "active"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                        : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                    }
                  >
                    {lookupData.service_detail.status === "active" ? (
                      <CheckCircle2 className="me-1 h-3 w-3 inline" />
                    ) : (
                      <AlertCircle className="me-1 h-3 w-3 inline" />
                    )}
                    {tStatus(lookupData.service_detail.status)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">{t("serviceType")}</span>
                    <span className="font-medium">
                      {tTypes(lookupData.service_detail.service_type) || lookupData.service_detail.service_type}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">{t("customerId")}</span>
                    <span className="font-medium">#{lookupData.service_detail.customer}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[11px] text-muted-foreground block">{t("provisionedDate")}</span>
                    <span className="font-medium">
                      {formatDate(lookupData.service_detail.created_at, locale)}
                    </span>
                  </div>
                </div>

                <div className="pt-1 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => refetchLookup()}
                    className="h-7 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>{t("refresh")}</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                <Server className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
                <p>{t("serviceCheckerEmptyPrompt")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
