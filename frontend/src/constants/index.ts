export const APP_NAME = "Cloud Management Platform";
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000/api/v1";

export const SERVICE_TYPES = [
  { value: "vps", labelKey: "serviceTypes.vps" },
  { value: "cloud_server", labelKey: "serviceTypes.cloud_server" },
  { value: "dedicated_server", labelKey: "serviceTypes.dedicated_server" },
  { value: "cloud_storage", labelKey: "serviceTypes.cloud_storage" },
] as const;

export const SERVICE_STATUSES = [
  { value: "active", labelKey: "serviceStatus.active" },
  { value: "suspended", labelKey: "serviceStatus.suspended" },
] as const;
