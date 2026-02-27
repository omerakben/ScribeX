/**
 * MODULE 2: Auth Gate (JoinGate)
 * Verifies the join-code gate blocks/grants access correctly.
 */
import { test, expect } from "@playwright/test";
import { JOIN_CODE, seedJoinToken } from "./helpers";

test.describe("Auth Gate", () => {
  test("blocks /dashboard without join code", async ({ page }) => {
    // No localStorage seeded — gate should appear
    await page.goto("/dashboard");
    // The gate UI should be visible
    await expect(page.getByPlaceholder(/xxxx/i)).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/Enter your access code/i)).toBeVisible();
  });

  test("shows error message for wrong join code", async ({ page }) => {
    await page.goto("/dashboard");
    const input = page.getByPlaceholder(/xxxx/i);
    await expect(input).toBeVisible({ timeout: 8_000 });
    await input.fill("wrong-code");
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByText(/not recognized/i)).toBeVisible();
  });

  test("grants access with correct join code and proceeds to dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    const input = page.getByPlaceholder(/xxxx/i);
    await expect(input).toBeVisible({ timeout: 8_000 });
    await input.fill(JOIN_CODE);
    await page.getByRole("button", { name: /continue/i }).click();
    // Gate should disappear — dashboard content visible
    await expect(page.getByText(/papers|manuscripts/i).first()).toBeVisible({ timeout: 10_000 });
    // Gate should be gone
    await expect(page.getByPlaceholder(/xxxx/i)).not.toBeVisible();
  });

  test("persists access across page reload", async ({ page }) => {
    // First grant access
    await page.goto("/dashboard");
    const input = page.getByPlaceholder(/xxxx/i);
    await expect(input).toBeVisible({ timeout: 8_000 });
    await input.fill(JOIN_CODE);
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByText(/papers|manuscripts/i).first()).toBeVisible({ timeout: 10_000 });

    // Now reload — should stay authenticated
    await page.reload();
    await expect(page.getByText(/papers|manuscripts/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByPlaceholder(/xxxx/i)).not.toBeVisible();
  });
});
