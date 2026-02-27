/**
 * MODULE 3: Dashboard
 * Verifies paper management, navigation, and new paper creation flow.
 */
import { test, expect } from "@playwright/test";
import { seedJoinToken } from "./helpers";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await seedJoinToken(page);
  });

  test("dashboard loads with sidebar navigation", async ({ page }) => {
    await page.goto("/dashboard");
    // Sidebar items
    await expect(page.getByRole("link", { name: /papers|dashboard/i }).first()).toBeVisible({ timeout: 10_000 });
    // Stats row
    await expect(page.getByText(/total papers/i)).toBeVisible();
    await expect(page.getByText(/total words/i)).toBeVisible();
  });

  test("sidebar navigation — Citations link works", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("link", { name: /citations/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/citations/);
    await expect(page.getByText(/citation/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test("sidebar navigation — Templates link works", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("link", { name: /templates/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/templates/);
    await expect(page.getByText(/template/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test("sidebar navigation — Settings link works", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("link", { name: /settings/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/settings/);
  });

  test("New Paper button opens dialog", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: /new paper/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole("heading", { name: "Paper details" })).toBeVisible();
    // Title input should be focused
    await expect(page.getByLabel(/paper title/i)).toBeVisible();
  });

  test("new paper dialog — validates empty title", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: /new paper/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });
    // Click Continue without entering a title
    await page.getByRole("button", { name: /continue/i }).click();
    // Error message should appear
    await expect(page.getByText(/required/i).first()).toBeVisible();
  });

  test("new paper dialog — step progression (details → template → citation)", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: /new paper/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });

    // Step 1: Enter title
    await page.getByLabel(/paper title/i).fill("E2E Test Paper");
    await page.getByRole("button", { name: /continue/i }).click();

    // Step 2: Template selection visible
    await expect(page.getByRole("heading", { name: "Choose a template" })).toBeVisible();
    // Select IMRAD template
    await page.getByText(/imrad/i).first().click();
    await page.getByRole("button", { name: /continue/i }).click();

    // Step 3: Citation style
    await expect(page.getByRole("heading", { name: "Citation style" })).toBeVisible();
    // APA should be visible
    await expect(page.getByText(/APA/i).first()).toBeVisible();
  });

  test("new paper creation navigates to editor", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: /new paper/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });

    // Fill out all steps quickly
    await page.getByLabel(/paper title/i).fill("My Test Paper");
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByRole("heading", { name: "Choose a template" })).toBeVisible();
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByRole("heading", { name: "Citation style" })).toBeVisible();
    await page.getByRole("button", { name: /create paper/i }).click();

    // Should navigate to editor
    await expect(page).toHaveURL(/\/editor\//, { timeout: 10_000 });
    // Editor should load
    await page.waitForSelector(".ProseMirror", { timeout: 15_000 });
  });

  test("paper appears in dashboard list after creation", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: /new paper/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });

    await page.getByLabel(/paper title/i).fill("Listed Test Paper");
    await page.getByRole("button", { name: /continue/i }).click();
    await page.getByRole("button", { name: /continue/i }).click();
    await page.getByRole("button", { name: /create paper/i }).click();

    // Go back to dashboard
    await expect(page).toHaveURL(/\/editor\//);
    await page.goBack();
    // Or navigate directly
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Listed Test Paper" }).first()).toBeVisible({ timeout: 10_000 });
  });
});
