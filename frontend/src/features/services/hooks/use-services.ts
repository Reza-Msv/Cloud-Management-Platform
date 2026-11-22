"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { servicesApi, ServiceListParams } from "@/services/services-api";
import { ServiceStatus } from "@/types";

export const SERVICES_QUERY_KEY = ["services"] as const;

export function useServices(params?: ServiceListParams) {
  return useQuery({
    queryKey: [...SERVICES_QUERY_KEY, params],
    queryFn: () => servicesApi.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useService(id: number) {
  return useQuery({
    queryKey: [...SERVICES_QUERY_KEY, id],
    queryFn: () => servicesApi.getById(id),
    enabled: !!id && !isNaN(id),
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
