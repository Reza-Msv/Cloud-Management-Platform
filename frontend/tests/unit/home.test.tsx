import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { HomeView } from "@/app/[locale]/(web)/(home)/page";
import { NextIntlClientProvider } from "next-intl";
import { AppThemeProvider } from "@/hooks/use-app-theme";
import messages from "../../messages/en.json";

vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
}));

describe("HomeView Component", () => {
  it("renders status badge, application title, and theme controls", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AppThemeProvider>
          <HomeView />
        </AppThemeProvider>
      </NextIntlClientProvider>
    );

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent("Cloud Management Platform");

    expect(screen.getByText("System Operational")).toBeInTheDocument();
    expect(
      screen.getByText("Enterprise Cloud Infrastructure & Management")
    ).toBeInTheDocument();

    expect(screen.getByTestId("theme-toggle-group")).toBeInTheDocument();
    expect(screen.getByTestId("landing-login-btn")).toBeInTheDocument();
  });
});
