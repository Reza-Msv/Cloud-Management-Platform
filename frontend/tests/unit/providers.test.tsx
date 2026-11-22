import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { AppProviders } from "@/providers";

describe("AppProviders", () => {
  it("renders children wrapped in TanStack Query Provider", () => {
    render(
      <AppProviders>
        <div data-testid="test-child">Application Child Content</div>
      </AppProviders>
    );

    const child = screen.getByTestId("test-child");
    expect(child).toBeInTheDocument();
    expect(child).toHaveTextContent("Application Child Content");
  });
});
