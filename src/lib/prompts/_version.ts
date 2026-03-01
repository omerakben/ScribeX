/**
 * Prompt version tracking for future A/B testing.
 * Each key maps a prompt path to its semantic version.
 */
export const PROMPT_VERSIONS: Record<string, string> = {
  "system/academic": "1.0.0",
  "assistant/chat": "1.0.0",
  "commands/generate": "1.0.0",
  "commands/expand": "1.0.0",
  "commands/simplify": "1.0.0",
  "commands/academic-tone": "1.0.0",
  "commands/cite": "1.0.0",
  "commands/outline": "1.0.0",
  "commands/counter": "1.0.0",
  "commands/evidence": "1.0.0",
  "commands/transition": "1.0.0",
  "commands/abstract": "1.0.0",
  "commands/rewrite": "1.0.0",
  "commands/diffuse": "1.0.0",
  "commands/mermaid": "1.0.0",
  "humanize/humanize": "1.0.0",
  "humanize/humanize-no-context": "1.0.0",
  "humanize/humanize-one": "1.0.0",
};
