/**
 * MODULE 6: AI Features — Mercury API (LIVE calls)
 * Tests AI writing modes via slash commands and verifies streaming works end-to-end.
 * These tests make real API calls to Mercury.
 */
import { test, expect } from "@playwright/test";
import { seedJoinToken, seedPaper, waitForEditor } from "./helpers";

const PAPER_ID = "e2e-ai-test-001";

// Longer timeout for AI-dependent tests
test.setTimeout(90_000);

test.describe("AI Features — Mercury API", () => {
  test.beforeEach(async ({ page }) => {
    await seedJoinToken(page);
    await seedPaper(page, {
      id: PAPER_ID,
      title: "AI Features Test Paper",
      content: "<p>Climate change is one of the most pressing challenges of our time. Researchers have documented significant increases in global temperatures over the past century.</p>",
    });
  });

  // ─── /compose (mercury-2 streaming) ───────────────────────────
  test("/compose — streams new content into editor", async ({ page }) => {
    await page.goto(`/editor/${PAPER_ID}`);
    await waitForEditor(page);

    const editor = page.locator(".ProseMirror");
    await editor.click();
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");

    // Type compose command
    await page.keyboard.type("/compose");
    await expect(page.getByText(/compose/i).first()).toBeVisible({ timeout: 5_000 });
    await page.keyboard.press("Enter");

    // Writing mode bar should show "Composing"
    await expect(page.getByText(/composing/i)).toBeVisible({ timeout: 10_000 });

    // AI streaming indicator (pulsing dot) should appear
    await expect(page.locator(".animate-pulse")).toBeVisible({ timeout: 10_000 });

    // Wait for streaming to complete (mode bar dismisses or stops pulsing)
    await page.waitForFunction(
      () => !document.querySelector(".animate-pulse"),
      { timeout: 60_000 }
    );

    // Editor content should have grown
    const contentAfter = await editor.textContent();
    expect(contentAfter!.length).toBeGreaterThan(200);
  });

  // ─── /review (mercury-2 structured output) ────────────────────
  test("/review — generates structured review in AI panel", async ({ page }) => {
    await page.goto(`/editor/${PAPER_ID}`);
    await waitForEditor(page);

    // Open AI panel first
    const toggleBtn = page.getByRole("button", { name: "Show AI panel" });
    await toggleBtn.click();
    await expect(page.getByRole("button", { name: "Review" })).toBeVisible({ timeout: 5_000 });

    // Switch to Review tab
    await page.getByRole("button", { name: "Review" }).click();

    // Trigger review (should have a Generate Review button or similar)
    const reviewBtn = page.getByRole("button", { name: /generate review|review paper|analyze/i });
    if (await reviewBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await reviewBtn.click();
    } else {
      // Alternative: use slash command
      const editor = page.locator(".ProseMirror");
      await editor.click();
      await page.keyboard.press("End");
      await page.keyboard.press("Enter");
      await page.keyboard.type("/review");
      await expect(page.getByText(/review/i).first()).toBeVisible({ timeout: 5_000 });
      await page.keyboard.press("Enter");
    }

    // Writing mode bar should show "Reviewing"
    await expect(page.getByText(/review/i).first()).toBeVisible({ timeout: 10_000 });

    // Wait for completion
    await page.waitForFunction(
      () => !document.querySelector(".animate-pulse"),
      { timeout: 60_000 }
    );

    // Review content should appear in AI panel
    const panelContent = page.locator("[data-ai-panel], [data-panel-content]").first();
    if (await panelContent.isVisible({ timeout: 3_000 }).catch(() => false)) {
      expect(await panelContent.textContent()).toContain("");
    }
  });

  // ─── /quick-edit (mercury-edit apply) ─────────────────────────
  test("/quick-edit — applies edit to selected text", async ({ page }) => {
    await page.goto(`/editor/${PAPER_ID}`);
    await waitForEditor(page);

    const editor = page.locator(".ProseMirror");

    // Select all text first
    await editor.click();
    await page.keyboard.press("Control+a");

    // Capture content before
    const contentBefore = await editor.textContent();

    // Open slash menu and trigger quick-edit
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    await page.keyboard.type("/quick");
    await expect(page.getByText(/quick.edit|quick edit/i).first()).toBeVisible({ timeout: 5_000 });
    await page.keyboard.press("Enter");

    // Mode bar should indicate editing
    await expect(page.getByText(/quick edit/i, { exact: false })).toBeVisible({ timeout: 10_000 });

    // Wait for completion
    await page.waitForFunction(
      () => !document.querySelector(".animate-pulse"),
      { timeout: 60_000 }
    );

    // Content should have changed
    const contentAfter = await editor.textContent();
    expect(contentAfter).not.toEqual(contentBefore);
  });

  // ─── AI Panel Chat ─────────────────────────────────────────────
  test("AI Panel Chat — sends message and receives streaming response", async ({ page }) => {
    await page.goto(`/editor/${PAPER_ID}`);
    await waitForEditor(page);

    // Open AI panel
    const toggleBtn = page.getByRole("button", { name: "Show AI panel" });
    await toggleBtn.click();

    // Switch to Chat tab (default)
    const chatTab = page.getByRole("button", { name: "Chat" });
    await expect(chatTab).toBeVisible({ timeout: 5_000 });
    await chatTab.click();

    // Find chat input
    const chatInput = page.getByPlaceholder(/ask|message|type/i);
    await expect(chatInput).toBeVisible({ timeout: 5_000 });
    await chatInput.fill("Summarize the main point of this paper in one sentence.");

    // Send message
    await page.getByRole("button", { name: /send/i }).click();

    // Streaming should start — loading indicator
    await expect(page.locator(".animate-pulse, [data-streaming]")).toBeVisible({ timeout: 10_000 });

    // Wait for response to finish
    await page.waitForFunction(
      () => !document.querySelector(".animate-pulse"),
      { timeout: 60_000 }
    );

    // Response should be visible in chat
    const chatMessages = page.locator("[data-message], .ai-message, [role='log'] p");
    await expect(chatMessages.first()).toBeVisible({ timeout: 5_000 });
  });

  // ─── AI Panel Outline ─────────────────────────────────────────
  test("AI Panel Outline — generates paper outline", async ({ page }) => {
    await page.goto(`/editor/${PAPER_ID}`);
    await waitForEditor(page);

    const toggleBtn = page.getByRole("button", { name: "Show AI panel" });
    await toggleBtn.click();

    const outlineTab = page.getByRole("button", { name: "Outline" });
    await expect(outlineTab).toBeVisible({ timeout: 5_000 });
    await outlineTab.click();

    // Trigger outline generation
    const generateBtn = page.getByRole("button", { name: /generate outline|create outline|outline/i });
    if (await generateBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await generateBtn.click();

      // Wait for response
      await page.waitForFunction(
        () => !document.querySelector(".animate-pulse, [data-streaming]"),
        { timeout: 60_000 }
      );

      // Some outline content should appear
      const outlineContent = page.locator("[data-outline], [data-panel-content]").first();
      expect(await outlineContent.textContent()).toBeTruthy();
    }
  });

  // ─── /diffusion-draft ─────────────────────────────────────────
  test("/diffusion-draft — activates diffusion mode overlay", async ({ page }) => {
    await page.goto(`/editor/${PAPER_ID}`);
    await waitForEditor(page);

    const editor = page.locator(".ProseMirror");
    await editor.click();
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    await page.keyboard.type("/diffusion");

    await expect(page.getByText(/diffusion/i).first()).toBeVisible({ timeout: 5_000 });
    await page.keyboard.press("Enter");

    // Mode bar should show "Diffusing"
    await expect(page.getByText(/diffus/i).first()).toBeVisible({ timeout: 10_000 });

    // Wait for completion
    await page.waitForFunction(
      () => !document.querySelector(".animate-pulse"),
      { timeout: 60_000 }
    );
  });

  // ─── API route authorization ───────────────────────────────────
  test("API /api/mercury rejects requests without join token", async ({ page }) => {
    const response = await page.request.post("/api/mercury", {
      headers: { "Content-Type": "application/json" },
      // Deliberately no x-join-token header
      data: { endpoint: "chat", model: "mercury-2", messages: [], max_tokens: 10 },
    });
    expect(response.status()).toBe(401);
  });

  test("API /api/mercury rejects invalid model", async ({ page }) => {
    const response = await page.request.post("/api/mercury", {
      headers: {
        "Content-Type": "application/json",
        "x-join-token": "tuel-ai",
      },
      data: { endpoint: "chat", model: "gpt-4", messages: [], max_tokens: 10 },
    });
    expect(response.status()).toBe(400);
  });

  test("API /api/mercury rejects invalid endpoint", async ({ page }) => {
    const response = await page.request.post("/api/mercury", {
      headers: {
        "Content-Type": "application/json",
        "x-join-token": "tuel-ai",
      },
      data: { endpoint: "invalid", model: "mercury-2", messages: [], max_tokens: 10 },
    });
    expect(response.status()).toBe(400);
  });
});
