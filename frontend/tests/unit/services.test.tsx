import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { ServiceListView } from "@/features/services/components/service-list-view";
import { NextIntlClientProvider } from "next-intl";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppThemeProvider } from "@/hooks/use-app-theme";
import messages from "../../messages/en.json";
import * as servicesApiModule from "@/services/services-api";

vi.mock("@/services/services-api", () => ({
  servicesApi: {
    list: vi.fn(),
    getById: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/dashboard/services",
}));

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: (selector: any) => selector({
    user: { id: 1, username: "admin", roles: ["Admin"] },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

describe("ServiceListView Component", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  it("renders services matching API response and status badge", async () => {
    vi.spyOn(servicesApiModule.servicesApi, "list").mockResolvedValueOnce({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 10,
          name: "Production Database Server",
          service_type: "vps",
          status: "active",
          customer: 1,
          created_at: "2026-11-22T06:15:00.123456Z",
        },
      ],
    });

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AppThemeProvider>
          <QueryClientProvider client={queryClient}>
            <ServiceListView />
          </QueryClientProvider>
        </AppThemeProvider>
      </NextIntlClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Production Database Server")).toBeInTheDocument();
      expect(screen.getAllByText("Active").length).toBeGreaterThanOrEqual(1);
    });
  });
});
