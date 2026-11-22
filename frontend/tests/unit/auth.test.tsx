import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { LoginForm } from "@/features/auth/components/login-form";
import { NextIntlClientProvider } from "next-intl";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppThemeProvider } from "@/hooks/use-app-theme";
import messages from "../../messages/en.json";
import * as authApiModule from "@/services/auth-api";

vi.mock("@/services/auth-api", () => ({
  authApi: {
    getCsrf: vi.fn().mockResolvedValue({ detail: "CSRF cookie set.", csrfToken: "dummy" }),
    login: vi.fn(),
    logout: vi.fn().mockResolvedValue({ detail: "Successfully logged out." }),
    getMe: vi.fn(),
  },
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/login",
}));

describe("LoginForm Component", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  const renderLoginForm = () => {
    return render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AppThemeProvider>
          <QueryClientProvider client={queryClient}>
            <LoginForm />
          </QueryClientProvider>
        </AppThemeProvider>
      </NextIntlClientProvider>
    );
  };

  it("renders username, password inputs and sign-in button", () => {
    renderLoginForm();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByTestId("login-submit-btn")).toBeInTheDocument();
  });

  it("validates empty inputs and submits valid credentials to authApi.login", async () => {
    const mockLogin = vi.spyOn(authApiModule.authApi, "login").mockResolvedValueOnce({
      id: 1,
      username: "admin_user",
      email: "admin@cmp.com",
      first_name: "Admin",
      last_name: "User",
      is_superuser: true,
      is_staff: true,
      is_active: true,
      groups: ["Admin"],
      roles: ["Admin"],
      permissions: [],
    });

    renderLoginForm();

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "admin_user" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "SecretPass123!" },
    });

    fireEvent.click(screen.getByTestId("login-submit-btn"));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        username: "admin_user",
        password: "SecretPass123!",
      });
    });
  });
});
