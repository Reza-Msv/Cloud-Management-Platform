import { apiClient } from "./api-client";
import { PaginatedResponse, Service, ServiceStatus } from "@/types";

export interface ServiceListParams {
  customer_id?: number;
  status?: string;
  service_type?: string;
  page?: number;
  page_size?: number;
}

export const servicesApi = {
  list: async (params?: ServiceListParams): Promise<PaginatedResponse<Service>> => {
    return apiClient<PaginatedResponse<Service>>("/services/", {
      params: params as Record<string, string | number | boolean>,
    });
  },

  getById: async (id: number): Promise<Service> => {
    return apiClient<Service>(`/services/${id}/`);
  },

  updateStatus: async (id: number, status: ServiceStatus): Promise<Service> => {
    return apiClient<Service>(`/services/${id}/status/`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
};
