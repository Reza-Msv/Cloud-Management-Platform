"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { servicesApi, ServiceListParams } from "@/services/services-api";
import { ServiceStatus } from "@/types";

import { useAuthStore } from "@/stores/auth-store";

export const SERVICES_QUERY_KEY = ["services"] as const;

export function useServices(params?: ServiceListParams, options?: { enabled?: boolean }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isEnabled = options?.enabled !== undefined ? options.enabled : isAuthenticated;

  return useQuery({
    queryKey: [...SERVICES_QUERY_KEY, params],
    queryFn: ({ signal }) => servicesApi.list(params, signal),
    placeholderData: (prev) => prev,
    enabled: isEnabled,
  });
}

export function useService(id: number) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: [...SERVICES_QUERY_KEY, id],
    queryFn: ({ signal }) => servicesApi.getById(id, signal),
    enabled: isAuthenticated && !!id && !isNaN(id),
  });
}

export function useUpdateServiceStatus(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: ServiceStatus) => servicesApi.updateStatus(id, status),
    onSuccess: (updatedService) => {
      queryClient.setQueryData([...SERVICES_QUERY_KEY, id], updatedService);
      queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: ["customers", updatedService.customer, "services"],
      });
    },
  });
}
