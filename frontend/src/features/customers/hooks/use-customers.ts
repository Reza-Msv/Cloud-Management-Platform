"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  customersApi,
  CustomerListParams,
  CreateCustomerPayload,
  UpdateCustomerPayload,
} from "@/services/customers-api";

import { useAuthStore } from "@/stores/auth-store";

export const CUSTOMERS_QUERY_KEY = ["customers"] as const;

export function useCustomers(params?: CustomerListParams, options?: { enabled?: boolean }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isEnabled = options?.enabled !== undefined ? options.enabled : isAuthenticated;

  return useQuery({
    queryKey: [...CUSTOMERS_QUERY_KEY, params],
    queryFn: ({ signal }) => customersApi.list(params, signal),
    placeholderData: (prev) => prev,
    enabled: isEnabled,
  });
}

export function useCustomer(id: number) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: [...CUSTOMERS_QUERY_KEY, id],
    queryFn: ({ signal }) => customersApi.getById(id, signal),
    enabled: isAuthenticated && !!id && !isNaN(id),
  });
}

export function useCustomerServices(
  customerId: number,
  params?: { page?: number; page_size?: number; status?: string; service_type?: string }
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: [...CUSTOMERS_QUERY_KEY, customerId, "services", params],
    queryFn: ({ signal }) => customersApi.listServices(customerId, params, signal),
    enabled: isAuthenticated && !!customerId && !isNaN(customerId),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCustomerPayload) => customersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
    },
  });
}

export function useUpdateCustomer(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateCustomerPayload) => customersApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...CUSTOMERS_QUERY_KEY, id] });
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
    },
  });
}

export function useCreateCustomerService(customerId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; service_type: string }) =>
      customersApi.createService(customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...CUSTOMERS_QUERY_KEY, customerId, "services"],
      });
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
}
