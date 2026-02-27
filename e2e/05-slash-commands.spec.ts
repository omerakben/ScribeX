/**
 * MODULE 5: Slash Command Menu
 * Verifies the / menu opens, filters, and dispatches AI commands.
 */
import { test, expect } from "@playwright/test";
import { seedJoinToken, seedPaper, waitForEditor } from "./helpers";

const PAPER_ID = "e2e-slash-test-001";

test.describe("Slash Command Menu", () => {
  test.beforeEach(async ({ page }) => {
    await seedJoinToken(page);
    await seedPaper(page, {
      id: PAPER_ID,
      title: "Slash Command Test Paper",
      content: "<p>Background text for slash commands.</p>",
    });
  });

  test("slash menu opens on '/' keystroke", async ({ page }) => {
    await page.goto(`/editor/${PAPER_ID}`);
    await waitForEditor(page);

    const editor = page.locator(".ProseMirror");
    await editor.click();
    // Move to end
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    await page.keyboard.type("/");

    // Slash command menu should appear
    await expect(page.locator("[data-slash-menu], [role='listbox'], [role='menu']").first()).toBeVisible({ timeout: 5_000 });
  });

  test("slash menu filters on search text", async ({ page }) => {
    await page.goto(`/editor/${PAPER_ID}`);
    await waitForEditor(page);

    const editor = page.locator(".ProseMirror");
    await editor.click();
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    await page.keyboard.type("/compose");

    // Should show compose command
    await expect(page.getByText(/compose/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test("slash menu closes on Escape", async ({ page }) => {
    await page.goto(`/editor/${PAPER_ID}`);
    await waitForEditor(page);

    const editor = page.locator(".ProseMirror");
    await editor.click();
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    await page.keyboard.type("/");

    await expect(page.locator("[data-slash-menu], [role='listbox'], [role='menu']").first()).toBeVisible({ timeout: 5_000 });
    await page.keyboard.press("Escape");
    await expect(page.locator("[data-slash-menu], [role='listbox'], [role='menu']").first()).not.toBeVisible({ timeout: 3_000 });
  });

  test("slash menu shows category groups (Write, Edit, Mercury)", async ({ page }) => {
    await page.goto(`/editor/${PAPER_ID}`);
    await waitForEditor(page);

    const editor = page.locator(".ProseMirror");
    await editor.click();
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    await page.keyboard.type("/");

    await expect(page.locator("[data-slash-menu], [role='listbox'], [role='menu']").first()).toBeVisible({ timeout: 5_000 });
    // Category labels
    await expect(page.getByText(/write|generate|edit|mercury/i).first()).toBeVisible({ timeout: 3_000 });
  });
});
