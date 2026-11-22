import { test, expect } from "@playwright/test";

test.describe("Frontend Locale & Smoke Tests", () => {
  test("root url automatically redirects to default locale /en", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/en/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.locator("h1")).toContainText("Cloud Management Platform");
  });

  test("persian locale /fa renders with dir=rtl and localized content", async ({ page }) => {
    await page.goto("/fa");
    await expect(page.locator("html")).toHaveAttribute("lang", "fa");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("h1")).toContainText("سامانه مدیریت ابری");
    await expect(page.getByText("سیستم فعال است")).toBeVisible();
  });
});

test.describe("Theme Management - Zero Storage E2E", () => {
  test("switches between light, dark, and system without writing to localStorage or sessionStorage", async ({
    page,
  }) => {
    await page.goto("/en");

    // Check initial state
    const themeGroup = page.getByTestId("theme-toggle-group");
    await expect(themeGroup).toBeVisible();
    await expect(themeGroup).toHaveAttribute("data-current-theme", "system");

    // Click dark button
    await page.getByTestId("theme-dark-btn").click();
    await expect(themeGroup).toHaveAttribute("data-current-theme", "dark");
    await expect(page.locator("html")).toHaveClass(/dark/);

    // Verify localStorage & sessionStorage are strictly empty of theme data
    const storageKeys = await page.evaluate(() => {
      return {
        local: Object.keys(localStorage),
        session: Object.keys(sessionStorage),
      };
    });
    expect(storageKeys.local).toEqual([]);
    expect(storageKeys.session).toEqual([]);

    // Click light button
    await page.getByTestId("theme-light-btn").click();
    await expect(themeGroup).toHaveAttribute("data-current-theme", "light");
    await expect(page.locator("html")).not.toHaveClass(/dark/);

    // Revert to system on page refresh
    await page.reload();
    await expect(page.getByTestId("theme-toggle-group")).toHaveAttribute(
      "data-current-theme",
      "system"
    );
  });
});

test.describe("Auth & Dashboard Flows", () => {
  test("login page renders with account sign-in form", async ({ page }) => {
    await page.goto("/en/login");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Sign In to Console");
    await expect(page.getByTestId("login-submit-btn")).toBeVisible();
  });

  test("unauthenticated access to dashboard redirects to login", async ({ page }) => {
    page.on("response", (res) => console.log("RES:", res.status(), res.url()));
    await page.goto("/en/dashboard");
    // ProtectedLayout redirects to /login when not authenticated
    await expect(page).toHaveURL(/\/login/);
  });
});
