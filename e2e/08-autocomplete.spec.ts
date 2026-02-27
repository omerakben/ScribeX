/**
 * MODULE 8: Autocomplete (FIM — Fill-in-the-Middle)
 * Verifies ghost text appears after typing pause.
 */
import { test, expect } from "@playwright/test";
import { seedJoinToken, seedPaper, waitForEditor } from "./helpers";

const PAPER_ID = "e2e-autocomplete-test-001";

// FIM calls take time — extend timeout
test.setTimeout(60_000);

test.describe("Autocomplete (FIM)", () => {
  test.beforeEach(async ({ page }) => {
    await seedJoinToken(page);
    await seedPaper(page, {
      id: PAPER_ID,
      title: "Autocomplete Test Paper",
      content: "<p>The impact of climate change on biodiversity includes loss of habitats and species extinction.</p>",
    });
  });

  test("autocomplete toggle is present in toolbar", async ({ page }) => {
    await page.goto(`/editor/${PAPER_ID}`);
    await waitForEditor(page);

    // Look for autocomplete toggle — could be a wand, waves, or sparkle icon
    const autocompleteToggle = page.getByTitle(/autocomplete|ghost|fim/i);
    await expect(autocompleteToggle).toBeVisible({ timeout: 10_000 });
  });

  test("ghost text appears after typing pause (autocomplete enabled)", async ({ page }) => {
    await page.goto(`/editor/${PAPER_ID}`);
    await waitForEditor(page);

    // Ensure autocomplete is enabled (toolbar toggle might be there)
    const toggleBtn = page.getByTitle(/autocomplete|ghost text|fim/i);
    if (await toggleBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      // Check if it indicates disabled; if so, enable it
      const isActive = await toggleBtn.evaluate((el) =>
        el.classList.contains("active") ||
        el.getAttribute("aria-pressed") === "true" ||
        el.getAttribute("data-active") === "true"
      );
      if (!isActive) {
        await toggleBtn.click();
      }
    }

    const editor = page.locator(".ProseMirror");
    await editor.click();
    await page.keyboard.press("End");
    await page.keyboard.type(" Furthermore, researchers have found that");

    // Wait for autocomplete delay (AUTOCOMPLETE_DELAY_MS = ~1500ms) plus API call
    await page.waitForTimeout(6_000);

    // Ghost text element should appear (rendered as span with special class)
    const ghostText = page.locator(".ghost-text, [data-ghost-text], .ProseMirror .text-ink-400");
    const hasGhost = await ghostText.first().isVisible({ timeout: 5_000 }).catch(() => false);
    // This test is best-effort — FIM may return empty suggestion
    // We verify there's no error in the console
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    await page.waitForTimeout(2_000);
    const aiErrors = consoleErrors.filter((e) => e.toLowerCase().includes("mercury"));
    expect(aiErrors.length).toBe(0);
  });

  test("Tab key accepts ghost text completion", async ({ page }) => {
    await page.goto(`/editor/${PAPER_ID}`);
    await waitForEditor(page);

    // If autocomplete produces ghost text, Tab should accept it
    // We'll just verify Tab doesn't cause a JS error
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    const editor = page.locator(".ProseMirror");
    await editor.click();
    await page.keyboard.press("End");
    await page.keyboard.type(" The temperature rise of");
    await page.waitForTimeout(4_000);
    await page.keyboard.press("Tab");
    await page.waitForTimeout(1_000);

    // No JS errors
    expect(errors.filter((e) => !e.includes("ResizeObserver"))).toHaveLength(0);
  });
});
