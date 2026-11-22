"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useCustomer, useCustomerServices, useCreateCustomerService, useUpdateCustomer } from "../hooks/use-customers";
import { useUpdateServiceStatus } from "@/features/services/hooks/use-services";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { PageHeader } from "@/components/shared/page-header";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { SERVICE_TYPES } from "@/constants";
import { Plus, Edit2, AlertCircle, RefreshCw, User, Mail, Phone, Calendar } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

const createServiceSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t("serviceNameRequired")),
    service_type: z.enum(["vps", "cloud_server", "dedicated_server", "cloud_storage"], {
      errorMap: () => ({ message: t("serviceTypeRequired") }),
    }),
  });

type CreateServiceFormData = z.infer<ReturnType<typeof createServiceSchema>>;

interface CustomerDetailViewProps {
  customerId: number;
}

export function CustomerDetailView({ customerId }: CustomerDetailViewProps) {
  const t = useTranslations("Customers");
  const tServices = useTranslations("Services");
  const tServiceTypes = useTranslations("serviceTypes");
  const tStatus = useTranslations("serviceStatus");
  const tCommon = useTranslations("Common");
  const tVal = useTranslations("Validation");
  const locale = useLocale();
  const { isAdmin } = useAuth();

  const [addServiceModal, setAddServiceModal] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    serviceId: number;
    nextStatus: "active" | "suspended";
  } | null>(null);

  const { data: customer, isLoading, isError, error } = useCustomer(customerId);
  const { data: servicesData, isLoading: isServicesLoading } = useCustomerServices(customerId);

  const createServiceMutation = useCreateCustomerService(customerId);
  const updateStatusMutation = useUpdateServiceStatus();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateServiceFormData>({
    resolver: zodResolver(createServiceSchema(tVal)),
    defaultValues: {
      name: "",
      service_type: "vps",
    },
  });

  const onAddService = async (values: CreateServiceFormData) => {
    try {
      setModalError(null);
      await createServiceMutation.mutateAsync(values);
      toast.success(tServices("createSuccess"));
      reset();
      setAddServiceModal(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setModalError(err.message);
        toast.error(err.message);
      } else {
        setModalError("Failed to add service");
        toast.error(tCommon("notFound"));
      }
    }
  };

  const handleToggleStatus = (serviceId: number, currentStatus: "active" | "suspended") => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    setPendingStatusChange({ serviceId, nextStatus });
  };

  const handleConfirmStatusChange = async () => {
    if (!pendingStatusChange) return;
    try {
      await updateStatusMutation.mutateAsync({
        id: pendingStatusChange.serviceId,
        status: pendingStatusChange.nextStatus,
      });
      toast.success(tServices("statusUpdated"));
      setPendingStatusChange(null);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : tCommon("notFound");
      toast.error(errMsg);
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-destructive">{error instanceof Error ? error.message : t("customerNotFound")}</p>
      </div>
    );
  }

  const breadcrumbs = [
    { label: tCommon("title"), href: "/dashboard" },
    { label: t("title"), href: "/dashboard/customers" },
    { label: customer.full_name },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />

      <PageHeader
        title={customer.full_name}
        description={t("customerIdBadge", {
          id: customer.id,
          date: formatDate(customer.created_at, locale),
        })}
      >
        <Button
          onClick={() => {
            setModalError(null);
            reset();
            setAddServiceModal(true);
          }}
          data-testid="add-service-btn"
        >
          <Plus className="h-4 w-4 me-2" />
          <span>{t("addServiceToCustomer")}</span>
        </Button>
      </PageHeader>

      {/* Customer Info Card */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">{t("customerDetails")}</CardTitle>
          <CardDescription className="text-xs">
            {t("customerDetailsDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("fullName")}</p>
              <p className="text-sm font-semibold">{customer.full_name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("email")}</p>
              <p className="text-sm font-semibold">{customer.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("phone")}</p>
              <p className="text-sm font-semibold font-mono">{customer.phone}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("registeredAt")}</p>
              <p className="text-sm font-semibold">
                {formatDate(customer.created_at, locale)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Belonging to Customer */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">{t("servicesBelonging")}</CardTitle>
          <CardDescription className="text-xs">
            {t("servicesBelongingDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tCommon("id")}</TableHead>
                <TableHead>{tServices("name")}</TableHead>
                <TableHead>{tServices("type")}</TableHead>
                <TableHead>{tServices("status")}</TableHead>
                <TableHead>{tCommon("created")}</TableHead>
                <TableHead className="text-end">{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isServicesLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {tCommon("loading")}
                  </TableCell>
                </TableRow>
              ) : servicesData?.results && servicesData.results.length > 0 ? (
                servicesData.results.map((service) => (
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
                        <span>{tServices("changeStatus")}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {tServices("noServices")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Service Modal */}
      <Dialog
        open={addServiceModal}
        onOpenChange={setAddServiceModal}
        title={t("addServiceToCustomer")}
        description={`Deploy an infrastructure service for ${customer.full_name}`}
      >
        {modalError && (
          <div
            role="alert"
            className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{modalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onAddService)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1">
              {tServices("name")} *
            </label>
            <Input error={errors.name?.message} {...register("name")} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">
              {tServices("type")} *
            </label>
            <Select
              wrapperClassName="w-full"
              className="h-9 w-full text-sm"
              error={errors.service_type?.message}
              {...register("service_type")}
            >
              {SERVICE_TYPES.map((st) => (
                <option key={st.value} value={st.value}>
                  {tServiceTypes(st.value as any)}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddServiceModal(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || createServiceMutation.isPending}
            >
              {isSubmitting || createServiceMutation.isPending
                ? tCommon("loading")
                : tCommon("save")}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Status Change Confirmation Modal */}
      <Dialog
        open={Boolean(pendingStatusChange)}
        onOpenChange={(open) => {
          if (!open) setPendingStatusChange(null);
        }}
        title={tServices("changeStatus")}
      >
        <div className="space-y-4">
          <p className="text-sm text-foreground">
            {pendingStatusChange &&
              tServices("confirmStatusChange", {
                status: tStatus(pendingStatusChange.nextStatus),
              })}
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingStatusChange(null)}
              disabled={updateStatusMutation.isPending}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleConfirmStatusChange}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? tCommon("loading") : tCommon("confirm")}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
