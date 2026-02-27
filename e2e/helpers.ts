import { Page } from "@playwright/test";

export const JOIN_CODE = "tuel-ai";
export const BASE_URL = "http://localhost:3000";

/** Seed localStorage so JoinGate passes immediately without UI interaction */
export async function seedJoinToken(page: Page) {
  await page.addInitScript((code) => {
    localStorage.setItem("scribex-joined", "true");
    localStorage.setItem("scribex-join-code", code);
  }, JOIN_CODE);
}

/**
 * Seed a paper in Zustand's persisted store and RESET all editor state.
 * Clears existing papers to avoid cross-test contamination.
 */
export async function seedPaper(
  page: Page,
  paper: {
    id: string;
    title: string;
    content?: string;
  }
) {
  await page.addInitScript((p) => {
    const now = new Date().toISOString();
    const newPaper = {
      id: p.id,
      title: p.title,
      content: p.content ?? "",
      template: "blank",
      status: "draft",
      citationStyle: { id: "apa-7" },
      references: [],
      wordCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    // Build a clean initial state — wipe any existing editor state
    const cleanEditorState = {
      version: 1,
      state: {
        papers: [newPaper],
        currentPaper: null,
        isDirty: false,
        aiPanelOpen: false,       // Always start with panel CLOSED
        aiPanelMode: "chat",
        aiMessages: [],
        isAIStreaming: false,
        activeWritingMode: null,
        selectedText: "",
        selectionRange: null,
        ghostText: "",
        showGhostText: false,
        autocompleteEnabled: true,
        isDiffusing: false,
        diffusionStep: 0,
        diffusionContent: "",
        diffusionEnabled: false,
        reasoningEffort: "medium",
        wordCount: 0,
        isSaving: false,
        isExporting: false,
      },
    };

    localStorage.setItem("scribex:editor", JSON.stringify(cleanEditorState));
  }, paper);
}

/** Wait for the editor TipTap content-editable to be ready */
export async function waitForEditor(page: Page) {
  await page.waitForSelector(".ProseMirror", { timeout: 15_000 });
  // Small buffer for TipTap to fully initialize all extensions
  await page.waitForTimeout(200);
}

/** Type text into the TipTap editor */
export async function typeInEditor(page: Page, text: string) {
  const editor = page.locator(".ProseMirror");
  await editor.click();
  await editor.type(text);
}

/** Click toolbar button and then type — ensures focus is back in editor */
export async function clickToolbarAndType(page: Page, toolbarTitle: string, text: string) {
  await page.getByTitle(toolbarTitle).click();
  // Re-click editor to ensure focus is back before typing
  const editor = page.locator(".ProseMirror");
  await editor.click({ position: { x: 10, y: 10 } });
  await page.waitForTimeout(100);
  // Slow typing avoids Typography extension race conditions
  await page.keyboard.type(text, { delay: 30 });
}
