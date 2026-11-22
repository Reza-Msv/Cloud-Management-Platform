import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Button } from "@/components/ui/button";

describe("Button UI Component", () => {
  it("renders with default props and text", () => {
    render(<Button>Click Me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-primary");
  });

  it("applies variant and size styles correctly", () => {
    render(
      <Button variant="outline" size="sm">
        Small Outline
      </Button>
    );
    const button = screen.getByRole("button", { name: /small outline/i });
    expect(button).toHaveClass("border", "h-9");
  });

  it("respects disabled state", () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByRole("button", { name: /disabled button/i });
    expect(button).toBeDisabled();
    expect(button).toHaveClass("disabled:opacity-50");
  });
});
