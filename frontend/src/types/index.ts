export type Locale = "en" | "fa";
export type Direction = "ltr" | "rtl";
export type Theme = "system" | "light" | "dark";

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type RoleName = "Admin" | "Operator";

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_superuser: boolean;
  is_staff: boolean;
  is_active: boolean;
  groups: string[];
  roles: RoleName[];
  permissions: string[];
}

export interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
}

export type ServiceType = "vps" | "cloud_server" | "dedicated_server" | "cloud_storage";
export type ServiceStatus = "active" | "suspended";

export interface Service {
  id: number;
  name: string;
  service_type: ServiceType;
  status: ServiceStatus;
  customer: number;
  customer_name?: string;
  created_at: string;
}

export interface ApiErrorResponse {
  detail?: string;
  [key: string]: unknown;
}
