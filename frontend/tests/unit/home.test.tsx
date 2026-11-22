import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { HomeView } from "@/app/[locale]/(web)/(home)/page";
import { NextIntlClientProvider } from "next-intl";
import { AppThemeProvider } from "@/hooks/use-app-theme";
import messages from "../../messages/en.json";

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
      screen.getByText("Welcome to Cloud Management Platform")
    ).toBeInTheDocument();

    expect(screen.getByTestId("theme-toggle-group")).toBeInTheDocument();
  });
});
