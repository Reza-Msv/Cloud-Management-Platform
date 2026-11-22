"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useCustomers, useCreateCustomer } from "../hooks/use-customers";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { PageHeader } from "@/components/shared/page-header";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Pagination } from "@/components/shared/pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import { UserPlus, Search, Eye, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const createCustomerSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(5, "Valid phone number is required"),
});

type CreateCustomerFormData = z.infer<typeof createCustomerSchema>;

export function CustomerListView() {
  const t = useTranslations("Customers");
  const tCommon = useTranslations("Common");
  const { isAdmin } = useAuth();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useCustomers({
    page,
    page_size: pageSize,
    search: search || undefined,
  });

  const createMutation = useCreateCustomer();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCustomerFormData>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
    },
  });

  const onSubmit = async (values: CreateCustomerFormData) => {
    try {
      setApiError(null);
      await createMutation.mutateAsync(values);
      reset();
      setModalOpen(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setApiError(err.message);
      } else {
        setApiError("Failed to create customer");
      }
    }
  };

  const breadcrumbs = [
    { label: tCommon("title"), href: "/dashboard" },
    { label: t("title") },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />

      <PageHeader title={t("title")} description={t("description")}>
        {isAdmin && (
          <Button
            onClick={() => {
              setApiError(null);
              reset();
              setModalOpen(true);
            }}
            data-testid="add-customer-btn"
          >
            <UserPlus className="h-4 w-4 me-2" />
            <span>{t("addCustomer")}</span>
          </Button>
        )}
      </PageHeader>

      {/* Search Bar */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={tCommon("searchPlaceholder")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="ps-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customer Table */}
      <Card className="border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tCommon("id")}</TableHead>
                <TableHead>{t("fullName")}</TableHead>
                <TableHead>{t("email")}</TableHead>
                <TableHead>{t("phone")}</TableHead>
                <TableHead>{t("registeredAt")}</TableHead>
                <TableHead className="text-end">{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    {tCommon("loading")}
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-destructive">
                    {error instanceof Error ? error.message : "Error loading customers"}
                  </TableCell>
                </TableRow>
              ) : data?.results && data.results.length > 0 ? (
                data.results.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-mono text-xs">{customer.id}</TableCell>
                    <TableCell className="font-medium">{customer.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{customer.email}</TableCell>
                    <TableCell className="font-mono text-xs">{customer.phone}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-end">
                      <Link
                        href={`/dashboard/customers/${customer.id}`}
                        className="inline-flex items-center justify-center rounded-md text-xs font-medium h-8 px-2.5 hover:bg-muted text-foreground transition-colors"
                      >
                        <Eye className="h-4 w-4 me-1" />
                        <span>{tCommon("details")}</span>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
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

      {/* Add Customer Modal */}
      <Dialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={t("addCustomer")}
        description="Enter customer identity details according to enterprise schema."
      >
        {apiError && (
          <div
            role="alert"
            className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">
                {t("firstName")} *
              </label>
              <Input
                error={errors.first_name?.message}
                {...register("first_name")}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                {t("lastName")} *
              </label>
              <Input
                error={errors.last_name?.message}
                {...register("last_name")}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">
              {t("email")} *
            </label>
            <Input
              type="email"
              error={errors.email?.message}
              {...register("email")}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">
              {t("phone")} *
            </label>
            <Input
              type="tel"
              error={errors.phone?.message}
              {...register("phone")}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || createMutation.isPending}
            >
              {isSubmitting || createMutation.isPending
                ? tCommon("loading")
                : tCommon("save")}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
