/**
 * MODULE 4: Editor Core
 * Verifies TipTap editor, toolbar formatting, and save/export flows.
 */
import { test, expect } from "@playwright/test";
import { seedJoinToken, seedPaper, waitForEditor, typeInEditor, clickToolbarAndType } from "./helpers";

const TEST_PAPER_ID = "e2e-test-paper-001";

test.describe("Editor Core", () => {
  test.beforeEach(async ({ page }) => {
    await seedJoinToken(page);
    await seedPaper(page, {
      id: TEST_PAPER_ID,
      title: "E2E Test Paper",
      content: "<p>Initial content for testing.</p>",
    });
  });

  test("editor loads and displays paper content", async ({ page }) => {
    await page.goto(`/editor/${TEST_PAPER_ID}`);
    await waitForEditor(page);
    const editor = page.locator(".ProseMirror");
    await expect(editor).toBeVisible();
    await expect(editor).toContainText("Initial content for testing.");
  });

  test("toolbar is visible with formatting buttons", async ({ page }) => {
    await page.goto(`/editor/${TEST_PAPER_ID}`);
    await waitForEditor(page);

    // Key toolbar buttons should be present (exact titles from source)
    await expect(page.getByTitle("Bold")).toBeVisible();
    await expect(page.getByTitle("Italic")).toBeVisible();
    await expect(page.getByTitle("Underline")).toBeVisible();
    await expect(page.getByTitle("Heading 1")).toBeVisible();
  });

  test("bold formatting toggle via toolbar", async ({ page }) => {
    await page.goto(`/editor/${TEST_PAPER_ID}`);
    await waitForEditor(page);

    const editor = page.locator(".ProseMirror");
    await editor.click();
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    // Use clickToolbarAndType to avoid focus/timing race with Typography extension
    await clickToolbarAndType(page, "Bold", "boldtext");

    await expect(page.locator(".ProseMirror strong")).toBeVisible();
    await expect(page.locator(".ProseMirror strong")).toContainText("boldtext");
  });

  test("italic formatting toggle via toolbar", async ({ page }) => {
    await page.goto(`/editor/${TEST_PAPER_ID}`);
    await waitForEditor(page);

    const editor = page.locator(".ProseMirror");
    await editor.click();
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    await clickToolbarAndType(page, "Italic", "italictext");

    await expect(page.locator(".ProseMirror em")).toBeVisible();
    await expect(page.locator(".ProseMirror em")).toContainText("italictext");
  });

  test("heading 1 formatting", async ({ page }) => {
    await page.goto(`/editor/${TEST_PAPER_ID}`);
    await waitForEditor(page);

    const editor = page.locator(".ProseMirror");
    await editor.click();
    await page.getByTitle("Heading 1").click();
    await page.keyboard.type("Test Heading");

    await expect(page.locator(".ProseMirror h1")).toBeVisible();
    await expect(page.locator(".ProseMirror h1")).toContainText("Test Heading");
  });

  test("heading 2 formatting", async ({ page }) => {
    await page.goto(`/editor/${TEST_PAPER_ID}`);
    await waitForEditor(page);

    const editor = page.locator(".ProseMirror");
    await editor.click();
    await page.getByTitle("Heading 2").click();
    await page.keyboard.type("Section Heading");

    await expect(page.locator(".ProseMirror h2")).toContainText("Section Heading");
  });

  test("bulleted list formatting", async ({ page }) => {
    await page.goto(`/editor/${TEST_PAPER_ID}`);
    await waitForEditor(page);

    const editor = page.locator(".ProseMirror");
    await editor.click();
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    await clickToolbarAndType(page, "Bulleted list", "listitem");
    // Check the first li specifically
    await expect(page.locator(".ProseMirror ul li").first()).toContainText("listitem");
  });

  test("numbered list formatting", async ({ page }) => {
    await page.goto(`/editor/${TEST_PAPER_ID}`);
    await waitForEditor(page);

    const editor = page.locator(".ProseMirror");
    await editor.click();
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    await clickToolbarAndType(page, "Numbered list", "ordereditem");

    await expect(page.locator(".ProseMirror ol li").first()).toContainText("ordereditem");
  });

  test("blockquote formatting", async ({ page }) => {
    await page.goto(`/editor/${TEST_PAPER_ID}`);
    await waitForEditor(page);

    const editor = page.locator(".ProseMirror");
    await editor.click();
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    await clickToolbarAndType(page, "Blockquote", "quotedpassage");

    await expect(page.locator(".ProseMirror blockquote")).toContainText("quotedpassage");
  });

  test("code block formatting", async ({ page }) => {
    await page.goto(`/editor/${TEST_PAPER_ID}`);
    await waitForEditor(page);

    const editor = page.locator(".ProseMirror");
    await editor.click();
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    await clickToolbarAndType(page, "Code block", "codetest42");

    await expect(page.locator(".ProseMirror pre")).toBeVisible();
    await expect(page.locator(".ProseMirror pre")).toContainText("codetest42");
  });

  test("keyboard shortcut Cmd+B applies bold (macOS)", async ({ page }) => {
    await page.goto(`/editor/${TEST_PAPER_ID}`);
    await waitForEditor(page);

    const editor = page.locator(".ProseMirror");
    await editor.click();
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    // On macOS, TipTap bold shortcut is Cmd+B (Meta+b in Playwright)
    await page.keyboard.press("Meta+b");
    await page.keyboard.type("keyboard bold text");
    await expect(page.locator(".ProseMirror strong")).toContainText("keyboard bold text");
  });

  test("word count updates on typing", async ({ page }) => {
    await page.goto(`/editor/${TEST_PAPER_ID}`);
    await waitForEditor(page);

    // Use the toolbar word count span specifically (tabular-nums class)
    const wordCountSpan = page.locator("span.tabular-nums");
    const before = await wordCountSpan.textContent({ timeout: 5_000 });

    await typeInEditor(page, " extra words added here now");
    await page.waitForTimeout(500);

    const after = await wordCountSpan.textContent({ timeout: 5_000 });
    expect(before).not.toEqual(after);
  });

  test("dirty state indicator appears after typing", async ({ page }) => {
    await page.goto(`/editor/${TEST_PAPER_ID}`);
    await waitForEditor(page);

    await typeInEditor(page, " modified content");

    // "Unsaved" text should appear in the save button
    await expect(page.getByText("Unsaved")).toBeVisible({ timeout: 5_000 });
  });

  test("export dialog opens via Export paper button", async ({ page }) => {
    await page.goto(`/editor/${TEST_PAPER_ID}`);
    await waitForEditor(page);

    // Export button uses aria-label="Export paper" (no title attr, uses aria-label)
    const exportBtn = page.getByRole("button", { name: "Export paper" });
    await expect(exportBtn).toBeVisible({ timeout: 5_000 });
    await exportBtn.click();

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/export|format|download/i).first()).toBeVisible();
  });

  test("AI panel toggle opens panel showing tabs", async ({ page }) => {
    await page.goto(`/editor/${TEST_PAPER_ID}`);
    await waitForEditor(page);

    // AI panel toggle: aria-label="Show AI panel" or "Hide AI panel"
    const toggleBtn = page.getByRole("button", { name: "Show AI panel" });
    await expect(toggleBtn).toBeVisible({ timeout: 5_000 });
    await toggleBtn.click();

    // Panel should be open — tab buttons appear (aria-label based)
    await expect(page.getByRole("button", { name: "Chat" })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole("button", { name: "Review" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Citations" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Outline" })).toBeVisible();
  });

  test("AI panel can be closed", async ({ page }) => {
    await page.goto(`/editor/${TEST_PAPER_ID}`);
    await waitForEditor(page);

    // Open it
    await page.getByRole("button", { name: "Show AI panel" }).click();
    await expect(page.getByRole("button", { name: "Chat" })).toBeVisible({ timeout: 5_000 });

    // Close it — aria-label changes to "Hide AI panel" after opening
    await page.getByRole("button", { name: "Hide AI panel" }).click();
    await expect(page.getByRole("button", { name: "Chat" })).not.toBeVisible({ timeout: 3_000 });
  });

  test("back button returns to dashboard", async ({ page }) => {
    await page.goto(`/editor/${TEST_PAPER_ID}`);
    await waitForEditor(page);

    // Back button uses aria-label="Back to dashboard"
    const backBtn = page.getByRole("button", { name: "Back to dashboard" });
    await expect(backBtn).toBeVisible();
    await backBtn.click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 8_000 });
  });

  test("autocomplete toggle button is present", async ({ page }) => {
    await page.goto(`/editor/${TEST_PAPER_ID}`);
    await waitForEditor(page);

    // Autocomplete toggle uses aria-label "Enable/Disable autocomplete"
    const toggleBtn = page.getByRole("button", { name: /autocomplete/i });
    await expect(toggleBtn).toBeVisible({ timeout: 5_000 });
  });

  test("diffusion mode toggle button is present", async ({ page }) => {
    await page.goto(`/editor/${TEST_PAPER_ID}`);
    await waitForEditor(page);

    // Diffusion toggle uses aria-label "Enable/Disable diffusion effect"
    const toggleBtn = page.getByRole("button", { name: /diffusion effect/i });
    await expect(toggleBtn).toBeVisible({ timeout: 5_000 });
  });

  test("insert math button inserts KaTeX math node", async ({ page }) => {
    await page.goto(`/editor/${TEST_PAPER_ID}`);
    await waitForEditor(page);

    const editor = page.locator(".ProseMirror");
    await editor.click();
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");

    await page.getByTitle("Insert math").click();
    // KaTeX render should produce a .katex element
    await expect(page.locator(".ProseMirror .katex")).toBeVisible({ timeout: 5_000 });
  });

  test("paper title is editable in toolbar", async ({ page }) => {
    await page.goto(`/editor/${TEST_PAPER_ID}`);
    await waitForEditor(page);

    const titleInput = page.getByRole("textbox", { name: "Paper title" });
    await expect(titleInput).toBeVisible();
    await expect(titleInput).toHaveValue("E2E Test Paper");

    // Edit title
    await titleInput.clear();
    await titleInput.fill("Renamed Test Paper");
    await titleInput.press("Enter");

    // Verify value updated
    await expect(titleInput).toHaveValue("Renamed Test Paper");
  });
});
