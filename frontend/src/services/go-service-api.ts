export interface GoHealthResponse {
  status: string;
  service: string;
  version: string;
  uptime: string;
  go_version: string;
  service_detail?: {
    id: number;
    name: string;
    service_type: string;
    status: "active" | "suspended";
    customer: number;
    created_at: string;
  };
}

export interface GoErrorResponse {
  error: string;
  detail?: string;
}

export const goServiceApi = {
  getHealth: async (serviceId?: number, signal?: AbortSignal): Promise<GoHealthResponse> => {
    let url = "/api/go/health";
    if (serviceId !== undefined && serviceId !== null) {
      url += `?service_id=${serviceId}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal,
      cache: "no-store",
    });

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMessage =
        (typeof data === "object" && data !== null && (data.detail || data.error)) ||
        `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return data as GoHealthResponse;
  },
};
