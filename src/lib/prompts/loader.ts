/**
 * Prompt template loader with {{variable}} interpolation.
 * Works client-side in Next.js — all prompts are imported as TS modules.
 */

// ─── Variable Interpolation ──────────────────────────────────

const VARIABLE_PATTERN = /\{\{(\w+)\}\}/g;

/**
 * Replace {{variable}} placeholders in a template string with provided values.
 * Unmatched variables are replaced with an empty string.
 */
export function interpolate(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(VARIABLE_PATTERN, (_, key: string) => {
    return vars[key] ?? "";
  });
}

// ─── Prompt Registry ─────────────────────────────────────────

import { ACADEMIC_SYSTEM_PROMPT } from "./system/academic";
import { CHAT_SYSTEM_PROMPT } from "./assistant/chat";
import { GENERATE_PROMPT } from "./commands/generate";
import { EXPAND_PROMPT } from "./commands/expand";
import { SIMPLIFY_PROMPT } from "./commands/simplify";
import { ACADEMIC_TONE_PROMPT } from "./commands/academic-tone";
import { CITE_PROMPT } from "./commands/cite";
import { OUTLINE_PROMPT } from "./commands/outline";
import { COUNTER_PROMPT } from "./commands/counter";
import { EVIDENCE_PROMPT } from "./commands/evidence";
import { TRANSITION_PROMPT } from "./commands/transition";
import { ABSTRACT_PROMPT } from "./commands/abstract";
import { REWRITE_PROMPT } from "./commands/rewrite";
import { DIFFUSE_PROMPT } from "./commands/diffuse";
import { MERMAID_PROMPT } from "./commands/mermaid";

/**
 * Registry mapping command IDs to their raw prompt templates.
 */
const COMMAND_PROMPTS: Record<string, string> = {
  generate: GENERATE_PROMPT,
  expand: EXPAND_PROMPT,
  simplify: SIMPLIFY_PROMPT,
  academic: ACADEMIC_TONE_PROMPT,
  cite: CITE_PROMPT,
  outline: OUTLINE_PROMPT,
  counter: COUNTER_PROMPT,
  evidence: EVIDENCE_PROMPT,
  transition: TRANSITION_PROMPT,
  abstract: ABSTRACT_PROMPT,
  rewrite: REWRITE_PROMPT,
  diffuse: DIFFUSE_PROMPT,
  mermaid: MERMAID_PROMPT,
};

/**
 * Get a raw command prompt template by command ID.
 * Returns undefined if the command ID is not recognized.
 */
export function getRawCommandPrompt(commandId: string): string | undefined {
  return COMMAND_PROMPTS[commandId];
}

/**
 * Get the raw chat prompt template.
 */
export function getRawChatPrompt(): string {
  return CHAT_SYSTEM_PROMPT;
}

/**
 * Get the raw academic system prompt.
 */
export function getRawSystemPrompt(): string {
  return ACADEMIC_SYSTEM_PROMPT;
}

export { COMMAND_PROMPTS };
