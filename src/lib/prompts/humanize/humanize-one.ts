/**
 * Humanize prompt — incremental single generation.
 * Generates one more alternative that differs from existing options.
 */
export const HUMANIZE_ONE_PROMPT = `Rewrite this text to sound more natural and human-like. Provide ONE new alternative that is DIFFERENT from the existing options.

Original: "{{text}}"

Existing alternatives (DO NOT repeat these):
{{existing}}

Respond with ONLY the new alternative text, no quotes or explanation.`;
