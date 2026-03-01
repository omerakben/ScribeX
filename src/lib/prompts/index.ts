/**
 * Prompt Externalization System for ScribeX.
 *
 * All AI prompts are managed here as TypeScript modules with {{variable}} interpolation.
 * This replaces hardcoded prompt strings throughout the codebase.
 *
 * Usage:
 *   import { getSystemPrompt, getCommandPrompt, getChatPrompt } from "@/lib/prompts";
 *
 *   const systemPrompt = getSystemPrompt();
 *   const cmdPrompt = getCommandPrompt("generate", { context: "..." });
 *   const chatPrompt = getChatPrompt({ context: "Paper about climate change" });
 */

export {
  interpolate,
  getRawCommandPrompt,
  getRawChatPrompt,
  getRawSystemPrompt,
  COMMAND_PROMPTS,
} from "./loader";

export { PROMPT_VERSIONS } from "./_version";

// Re-export raw prompt constants for direct access
export { ACADEMIC_SYSTEM_PROMPT } from "./system/academic";
export { CHAT_SYSTEM_PROMPT } from "./assistant/chat";

import {
  interpolate,
  getRawSystemPrompt,
  getRawChatPrompt,
  getRawCommandPrompt,
} from "./loader";

// ─── Public API ──────────────────────────────────────────────

/**
 * Get the academic system prompt (no interpolation needed).
 */
export function getSystemPrompt(): string {
  return getRawSystemPrompt();
}

/**
 * Get an interpolated command prompt for a slash command.
 * Returns undefined if the command ID is not recognized.
 *
 * @param commandId - One of the 13 slash command IDs (e.g., "generate", "expand")
 * @param vars - Template variables to interpolate (e.g., { context: "...", selectedText: "..." })
 */
export function getCommandPrompt(
  commandId: string,
  vars?: Record<string, string>
): string | undefined {
  const raw = getRawCommandPrompt(commandId);
  if (!raw) return undefined;
  if (!vars) return raw;
  return interpolate(raw, vars);
}

/**
 * Get an interpolated chat prompt.
 *
 * @param vars - Template variables (e.g., { context: "Paper title and field" })
 */
export function getChatPrompt(vars?: Record<string, string>): string {
  const raw = getRawChatPrompt();
  if (!vars) return raw;
  return interpolate(raw, vars);
}

/**
 * General-purpose prompt interpolation.
 * Use this when you have a raw template string and want to fill in variables.
 *
 * @param template - A string containing {{variable}} placeholders
 * @param vars - Key-value pairs to substitute
 */
export function interpolatePrompt(
  template: string,
  vars: Record<string, string>
): string {
  return interpolate(template, vars);
}
