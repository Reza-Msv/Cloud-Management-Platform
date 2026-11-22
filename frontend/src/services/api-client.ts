import { API_BASE_URL } from "@/constants";

export class ApiError extends Error {
  status: number;
  data: Record<string, unknown> | null;

  constructor(status: number, message: string, data: Record<string, unknown> | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function getCsrfTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(^|;)\s*csrftoken=([^;]+)/);
  return match ? decodeURIComponent(match[2]) : null;
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

// In-flight GET request cache to deduplicate simultaneous duplicate GET calls
const inFlightGetRequests = new Map<string, Promise<unknown>>();

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers: customHeaders, ...customConfig } = options;

  let url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        searchParams.append(key, String(val));
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += (url.includes("?") ? "&" : "?") + qs;
    }
  }

  const method = (customConfig.method || "GET").toUpperCase();
  const isMutative = ["POST", "PATCH", "PUT", "DELETE"].includes(method);

  // If this is a GET request without a caller-provided custom signal/body, deduplicate concurrent identical in-flight requests
  const canDeduplicate = method === "GET" && !customConfig.signal;
  if (canDeduplicate && inFlightGetRequests.has(url)) {
    return inFlightGetRequests.get(url) as Promise<T>;
  }

  const executeRequest = async (): Promise<T> => {
    const csrfToken = isMutative ? getCsrfTokenFromCookie() : null;

    const defaultHeaders: Record<string, string> = {
      Accept: "application/json",
    };

    if (!(customConfig.body instanceof FormData)) {
      defaultHeaders["Content-Type"] = "application/json";
    }

    if (csrfToken) {
      defaultHeaders["X-CSRFToken"] = csrfToken;
    }

    const config: RequestInit = {
      credentials: "include",
      headers: {
        ...defaultHeaders,
        ...(customHeaders as Record<string, string>),
      },
      ...customConfig,
    };

    const response = await fetch(url, config);

    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const message =
        (isJson && data?.detail) ||
        (isJson && typeof data === "object"
          ? Object.entries(data)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(" ") : v}`)
              .join("; ")
          : `Request failed with status ${response.status}`);

      throw new ApiError(
        response.status,
        message,
        isJson && typeof data === "object" ? data : null
      );
    }

    return data as T;
  };

  if (canDeduplicate) {
    const promise = executeRequest().finally(() => {
      inFlightGetRequests.delete(url);
    });
    inFlightGetRequests.set(url, promise);
    return promise;
  }

  return executeRequest();
}
