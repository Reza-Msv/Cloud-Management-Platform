"use client";

import { useQuery } from "@tanstack/react-query";
import { goServiceApi, GoHealthResponse } from "@/services/go-service-api";

export const GO_HEALTH_QUERY_KEY = ["go", "health"] as const;

export function useGoHealth(refetchInterval: number | false = 30000) {
  return useQuery<GoHealthResponse, Error>({
    queryKey: GO_HEALTH_QUERY_KEY,
    queryFn: ({ signal }) => goServiceApi.getHealth(undefined, signal),
    staleTime: 10000,
    refetchInterval,
  });
}

export function useGoServiceStatusLookup(serviceId?: number, enabled: boolean = false) {
  return useQuery<GoHealthResponse, Error>({
    queryKey: [...GO_HEALTH_QUERY_KEY, "service", serviceId],
    queryFn: ({ signal }) => {
      if (!serviceId) throw new Error("Service ID is required");
      return goServiceApi.getHealth(serviceId, signal);
    },
    enabled: enabled && !!serviceId && serviceId > 0,
    retry: false,
  });
}
