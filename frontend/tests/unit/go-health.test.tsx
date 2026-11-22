import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import React from "react";
import { SystemHealthSection } from "@/features/dashboard/components/system-health-section";
import { NextIntlClientProvider } from "next-intl";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import messages from "../../messages/en.json";
import * as goServiceApiModule from "@/services/go-service-api";

vi.mock("@/services/go-service-api", () => ({
  goServiceApi: {
    getHealth: vi.fn(),
  },
}));

describe("SystemHealthSection Component", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <QueryClientProvider client={queryClient}>
          <SystemHealthSection />
        </QueryClientProvider>
      </NextIntlClientProvider>
    );

  it("renders Go health runtime metrics on success", async () => {
    vi.spyOn(goServiceApiModule.goServiceApi, "getHealth").mockResolvedValueOnce({
      status: "ok",
      service: "cloud-management-go",
      version: "1.0.0",
      uptime: "3h12m",
      go_version: "go1.27.4",
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("cloud-management-go")).toBeInTheDocument();
      expect(screen.getByText("3h12m")).toBeInTheDocument();
      expect(screen.getByText("go1.27.4")).toBeInTheDocument();
    });
  });

  it("renders error state when Go health check fails", async () => {
    vi.spyOn(goServiceApiModule.goServiceApi, "getHealth").mockRejectedValueOnce(
      new Error("Unable to reach Go microservice")
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Go Microservice Unavailable")).toBeInTheDocument();
      expect(screen.getByText("Unable to reach Go microservice")).toBeInTheDocument();
    });
  });

  it("queries service status when valid service ID is submitted", async () => {
    vi.spyOn(goServiceApiModule.goServiceApi, "getHealth")
      .mockResolvedValueOnce({
        status: "ok",
        service: "cloud-management-go",
        version: "1.0.0",
        uptime: "1h",
        go_version: "go1.27.4",
      })
      .mockResolvedValueOnce({
        status: "ok",
        service: "cloud-management-go",
        version: "1.0.0",
        uptime: "1h",
        go_version: "go1.27.4",
        service_detail: {
          id: 10,
          name: "production-storage",
          service_type: "cloud_storage",
          status: "active",
          customer: 28,
          created_at: "2026-11-22T17:22:05Z",
        },
      });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("cloud-management-go")).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText("Enter Service ID (e.g. 10)");
    const submitBtn = screen.getByRole("button", { name: "Inspect Status" });

    fireEvent.change(input, { target: { value: "10" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("production-storage")).toBeInTheDocument();
      expect(screen.getByText("Service ID: #10")).toBeInTheDocument();
      expect(screen.getByText("Customer ID")).toBeInTheDocument();
      expect(screen.getByText("#28")).toBeInTheDocument();
    });
  });

  it("handles service lookup error when service is not found", async () => {
    vi.spyOn(goServiceApiModule.goServiceApi, "getHealth")
      .mockResolvedValueOnce({
        status: "ok",
        service: "cloud-management-go",
        version: "1.0.0",
        uptime: "1h",
        go_version: "go1.27.4",
      })
      .mockRejectedValueOnce(new Error("Service not found"));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("cloud-management-go")).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText("Enter Service ID (e.g. 10)");
    const submitBtn = screen.getByRole("button", { name: "Inspect Status" });

    fireEvent.change(input, { target: { value: "999" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Service Lookup Failed")).toBeInTheDocument();
      expect(screen.getByText("Service not found")).toBeInTheDocument();
    });
  });
});
