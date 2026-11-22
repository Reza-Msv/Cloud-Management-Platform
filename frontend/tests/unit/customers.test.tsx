import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { CustomerListView } from "@/features/customers/components/customer-list-view";
import { NextIntlClientProvider } from "next-intl";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppThemeProvider } from "@/hooks/use-app-theme";
import messages from "../../messages/en.json";
import * as customersApiModule from "@/services/customers-api";

vi.mock("@/services/customers-api", () => ({
  customersApi: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    listServices: vi.fn(),
    createService: vi.fn(),
  },
}));

vi.mock("@/features/auth/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { id: 1, username: "admin", roles: ["Admin"] },
    isAdmin: true,
    isOperator: false,
    isAuthenticated: true,
  }),
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/dashboard/customers",
}));

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: (selector: any) => selector({
    user: { id: 1, username: "admin", roles: ["Admin"] },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

describe("CustomerListView Component", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  it("renders customer rows returned by backend API contract", async () => {
    vi.spyOn(customersApiModule.customersApi, "list").mockResolvedValueOnce({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 1,
          first_name: "Kaveh",
          last_name: "Ahangar",
          full_name: "Kaveh Ahangar",
          email: "kaveh@cmp.com",
          phone: "+989123456789",
          created_at: "2026-11-22T05:25:35.123456Z",
        },
      ],
    });

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AppThemeProvider>
          <QueryClientProvider client={queryClient}>
            <CustomerListView />
          </QueryClientProvider>
        </AppThemeProvider>
      </NextIntlClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Kaveh Ahangar")).toBeInTheDocument();
      expect(screen.getByText("kaveh@cmp.com")).toBeInTheDocument();
      expect(screen.getByText("+989123456789")).toBeInTheDocument();
    });
  });
});
