"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  customersApi,
  CustomerListParams,
  CreateCustomerPayload,
  UpdateCustomerPayload,
} from "@/services/customers-api";

export const CUSTOMERS_QUERY_KEY = ["customers"] as const;

export function useCustomers(params?: CustomerListParams) {
  return useQuery({
    queryKey: [...CUSTOMERS_QUERY_KEY, params],
    queryFn: () => customersApi.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useCustomer(id: number) {
  return useQuery({
    queryKey: [...CUSTOMERS_QUERY_KEY, id],
    queryFn: () => customersApi.getById(id),
    enabled: !!id && !isNaN(id),
  });
}

export function useCustomerServices(
  customerId: number,
  params?: { page?: number; page_size?: number; status?: string; service_type?: string }
) {
  return useQuery({
    queryKey: [...CUSTOMERS_QUERY_KEY, customerId, "services", params],
    queryFn: () => customersApi.listServices(customerId, params),
    enabled: !!customerId && !isNaN(customerId),
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
