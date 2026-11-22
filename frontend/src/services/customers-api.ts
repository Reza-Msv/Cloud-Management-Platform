import { apiClient } from "./api-client";
import { Customer, PaginatedResponse, Service } from "@/types";

export interface CustomerListParams {
  page?: number;
  page_size?: number;
  search?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

export interface CreateCustomerPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export interface UpdateCustomerPayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

export const customersApi = {
  list: async (
    params?: CustomerListParams,
    signal?: AbortSignal
  ): Promise<PaginatedResponse<Customer>> => {
    return apiClient<PaginatedResponse<Customer>>("/customers/", {
      params: params as Record<string, string | number | boolean>,
      signal,
    });
  },

  getById: async (id: number, signal?: AbortSignal): Promise<Customer> => {
    return apiClient<Customer>(`/customers/${id}/`, { signal });
  },

  create: async (data: CreateCustomerPayload): Promise<Customer> => {
    return apiClient<Customer>("/customers/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: UpdateCustomerPayload): Promise<Customer> => {
    return apiClient<Customer>(`/customers/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  listServices: async (
    customerId: number,
    params?: { page?: number; page_size?: number; status?: string; service_type?: string },
    signal?: AbortSignal
  ): Promise<PaginatedResponse<Service>> => {
    return apiClient<PaginatedResponse<Service>>(`/customers/${customerId}/services/`, {
      params: params as Record<string, string | number | boolean>,
      signal,
    });
  },

  createService: async (
    customerId: number,
    data: { name: string; service_type: string }
  ): Promise<Service> => {
    return apiClient<Service>(`/customers/${customerId}/services/`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
