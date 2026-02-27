/**
 * MODULE 9: State Persistence (localStorage)
 * Verifies papers survive page reloads and join token persists.
 */
import { test, expect } from "@playwright/test";
import { seedJoinToken, seedPaper, waitForEditor } from "./helpers";

const PAPER_ID = "e2e-persist-test-001";

test.describe("State Persistence", () => {
  test("paper content persists across editor page reload", async ({ page }) => {
    await seedJoinToken(page);
    await seedPaper(page, {
      id: PAPER_ID,
      title: "Persistence Test Paper",
      content: "<p>Original content to persist.</p>",
    });

    await page.goto(`/editor/${PAPER_ID}`);
    await waitForEditor(page);

    // Type new content
    const editor = page.locator(".ProseMirror");
    await editor.click();
    await page.keyboard.press("End");
    await page.keyboard.type(" This was added and should persist.");

    // Wait for autosave (or trigger manual save)
    await page.keyboard.press("Control+s");
    await page.waitForTimeout(2_000);

    // Reload
    await page.reload();
    await waitForEditor(page);

    const content = await page.locator(".ProseMirror").textContent();
    expect(content).toContain("should persist");
  });

  test("papers list persists across dashboard reload", async ({ page }) => {
    await seedJoinToken(page);
    await seedPaper(page, {
      id: PAPER_ID,
      title: "Persisted Paper Title",
    });

    await page.goto("/dashboard");
    await expect(page.getByText("Persisted Paper Title")).toBeVisible({ timeout: 10_000 });

    // Reload
    await page.reload();
    await expect(page.getByText("Persisted Paper Title")).toBeVisible({ timeout: 10_000 });
  });

  test("join token persists across full page reload", async ({ page }) => {
    // Grant access via UI
    await page.goto("/dashboard");
    const input = page.getByPlaceholder(/xxxx/i);
    await expect(input).toBeVisible({ timeout: 8_000 });
    await input.fill("tuel-ai");
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByText(/papers|manuscripts/i).first()).toBeVisible({ timeout: 10_000 });

    // Full reload
    await page.reload();
    // Gate should NOT reappear
    await expect(page.getByPlaceholder(/xxxx/i)).not.toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/papers|manuscripts/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test("localStorage keys are set correctly after joining", async ({ page }) => {
    await seedJoinToken(page);
    await page.goto("/dashboard");
    await expect(page.getByText(/papers|manuscripts/i).first()).toBeVisible({ timeout: 10_000 });

    const joined = await page.evaluate(() => localStorage.getItem("scribex-joined"));
    const code = await page.evaluate(() => localStorage.getItem("scribex-join-code"));
    expect(joined).toBe("true");
    expect(code).toBe("tuel-ai");
  });

  test("zustand persist keys exist after paper creation", async ({ page }) => {
    await seedJoinToken(page);
    await page.goto("/dashboard");

    // Create a paper via UI
    await page.getByRole("button", { name: /new paper/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });
    await page.getByLabel(/paper title/i).fill("Zustand Persist Test");
    await page.getByRole("button", { name: /continue/i }).click();
    await page.getByRole("button", { name: /continue/i }).click();
    await page.getByRole("button", { name: /create paper/i }).click();
    await expect(page).toHaveURL(/\/editor\//, { timeout: 10_000 });

    // Check localStorage
    const editorState = await page.evaluate(() => localStorage.getItem("scribex:editor"));
    expect(editorState).toBeTruthy();
    const parsed = JSON.parse(editorState!);
    expect(parsed.state.papers.length).toBeGreaterThan(0);
    const paper = parsed.state.papers.find((p: { title: string }) => p.title === "Zustand Persist Test");
    expect(paper).toBeTruthy();
  });
});
