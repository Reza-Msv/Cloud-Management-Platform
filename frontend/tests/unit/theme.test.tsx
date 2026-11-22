import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from "vitest";
import { render, screen, fireEvent, renderHook, act } from "@testing-library/react";
import React from "react";
import { NextIntlClientProvider } from "next-intl";
import { AppThemeProvider, useAppTheme } from "@/hooks/use-app-theme";
import { ThemeProvider } from "@/providers/theme-provider";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import messagesEn from "../../messages/en.json";

describe("Theme Management - Strict Zero Storage Architecture & Audit", () => {
  let localStorageSetSpy: MockInstance<typeof Storage.prototype.setItem>;
  let sessionStorageSetSpy: MockInstance<typeof Storage.prototype.setItem>;
  let localStorageGetSpy: MockInstance<typeof Storage.prototype.getItem>;
  let sessionStorageGetSpy: MockInstance<typeof Storage.prototype.getItem>;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = "";

    localStorageSetSpy = vi.spyOn(Storage.prototype, "setItem");
    sessionStorageSetSpy = vi.spyOn(Storage.prototype, "setItem");
    localStorageGetSpy = vi.spyOn(Storage.prototype, "getItem");
    sessionStorageGetSpy = vi.spyOn(Storage.prototype, "getItem");

    originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false, // Default to light OS
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.matchMedia = originalMatchMedia;
  });

  it("AppThemeProvider initializes with system theme and resolves to OS preference without writing to Storage", () => {
    const { result } = renderHook(() => useAppTheme(), {
      wrapper: ({ children }) => <AppThemeProvider>{children}</AppThemeProvider>,
    });

    expect(result.current.theme).toBe("system");
    expect(result.current.resolvedTheme).toBe("light");

    // ABSOLUTE ZERO STORAGE WRITE:
    expect(localStorageSetSpy).not.toHaveBeenCalled();
    expect(sessionStorageSetSpy).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    expect(document.cookie).toBe("");
  });

  it("updates theme to dark and light in memory without touching storage or cookies", () => {
    const { result } = renderHook(() => useAppTheme(), {
      wrapper: ({ children }) => <AppThemeProvider>{children}</AppThemeProvider>,
    });

    act(() => {
      result.current.setTheme("dark");
    });
    expect(result.current.theme).toBe("dark");
    expect(result.current.resolvedTheme).toBe("dark");

    act(() => {
      result.current.setTheme("light");
    });
    expect(result.current.theme).toBe("light");
    expect(result.current.resolvedTheme).toBe("light");

    act(() => {
      result.current.setTheme("system");
    });
    expect(result.current.theme).toBe("system");
    expect(result.current.resolvedTheme).toBe("light");

    // ABSOLUTE ZERO STORAGE WRITE CHECK:
    expect(localStorageSetSpy).not.toHaveBeenCalled();
    expect(sessionStorageSetSpy).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    expect(document.cookie).toBe("");
  });

  it("dynamically reacts to OS prefers-color-scheme changes when in system mode", () => {
    let changeHandler: (() => void) | null = null;
    let isDark = false;

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      get matches() {
        return isDark;
      },
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, handler: () => void) => {
        if (event === "change") changeHandler = handler;
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useAppTheme(), {
      wrapper: ({ children }) => <AppThemeProvider>{children}</AppThemeProvider>,
    });

    expect(result.current.theme).toBe("system");
    expect(result.current.resolvedTheme).toBe("light");

    // Simulate OS switching to dark mode
    act(() => {
      isDark = true;
      if (changeHandler) {
        changeHandler();
      }
    });

    expect(result.current.resolvedTheme).toBe("dark");
    expect(localStorageSetSpy).not.toHaveBeenCalled();
  });

  it("renders ThemeToggle buttons and allows user toggling without storage mutations", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messagesEn}>
        <AppThemeProvider>
          <ThemeToggle />
        </AppThemeProvider>
      </NextIntlClientProvider>
    );

    const lightBtn = screen.getByTestId("theme-light-btn");
    const darkBtn = screen.getByTestId("theme-dark-btn");
    const systemBtn = screen.getByTestId("theme-system-btn");

    expect(systemBtn).toHaveAttribute("aria-pressed", "true");
    expect(darkBtn).toHaveAttribute("aria-pressed", "false");
    expect(lightBtn).toHaveAttribute("aria-pressed", "false");

    // Click dark
    fireEvent.click(darkBtn);
    expect(darkBtn).toHaveAttribute("aria-pressed", "true");
    expect(systemBtn).toHaveAttribute("aria-pressed", "false");

    // Click light
    fireEvent.click(lightBtn);
    expect(lightBtn).toHaveAttribute("aria-pressed", "true");
    expect(darkBtn).toHaveAttribute("aria-pressed", "false");

    // ZERO STORAGE WRITES & COOKIES:
    expect(localStorageSetSpy).not.toHaveBeenCalled();
    expect(sessionStorageSetSpy).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
    expect(document.cookie).toBe("");
  });

  it("audits ThemeProvider DOM sync: zero writes to localStorage/sessionStorage/cookies across render and updates", () => {
    const { rerender } = render(
      <ThemeProvider>
        <div data-testid="child">Test Child</div>
      </ThemeProvider>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();

    // Verify ZERO writes occurred
    expect(localStorageSetSpy).not.toHaveBeenCalled();
    expect(sessionStorageSetSpy).not.toHaveBeenCalled();
    expect(document.cookie).toBe("");
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);

    // Re-render
    rerender(
      <ThemeProvider>
        <div data-testid="child">Updated Child</div>
      </ThemeProvider>
    );

    expect(localStorageSetSpy).not.toHaveBeenCalled();
    expect(sessionStorageSetSpy).not.toHaveBeenCalled();
    expect(document.cookie).toBe("");
  });

  it("audits and documents storage isolation: guarantees zero persistence across sessions", () => {
    render(
      <ThemeProvider>
        <div>Audit Details</div>
      </ThemeProvider>
    );

    // 1. Zero storage modifications (setItem calls):
    expect(localStorageSetSpy).not.toHaveBeenCalled();
    expect(sessionStorageSetSpy).not.toHaveBeenCalled();

    // 2. Storage structures remain strictly untouched and empty:
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    expect(document.cookie).toBe("");

    // 3. SessionStorage is never written:
    expect(sessionStorageSetSpy).not.toHaveBeenCalled();

    // 4. Verify no theme keys exist in localStorage:
    expect(localStorage.getItem("theme")).toBeNull();
  });
});
