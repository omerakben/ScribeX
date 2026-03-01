// ─── Temperature Constants ─────────────────────────────────────
// Maps writing actions to Mercury API temperature values.
// Lower = more deterministic/precise. Higher = more creative/varied.

export type TemperatureAction =
  | "fix"
  | "academic"
  | "simplify"
  | "mermaid"
  | "cite"
  | "rewrite"
  | "chat"
  | "evidence"
  | "abstract"
  | "compose"
  | "generate"
  | "expand"
  | "outline"
  | "counter"
  | "transition"
  | "stylize"
  | "diffuse"
  | "generate_name"
  | "synonyms"
  | "humanize"
  | "autocomplete"
  | "summarize"
  | "continue"
  | "analyze-tone";

export const ACTION_TEMPERATURES: Record<TemperatureAction, number> = {
  // Precision actions (low creativity)
  fix: 0.2,
  academic: 0.3,
  simplify: 0.3,
  mermaid: 0.3,
  cite: 0.3,
  "analyze-tone": 0.3,

  // Balanced actions
  rewrite: 0.5,
  chat: 0.6,
  evidence: 0.6,
  abstract: 0.6,
  summarize: 0.3,
  continue: 0.4,

  // Creative actions
  compose: 0.7,
  generate: 0.7,
  expand: 0.7,
  outline: 0.7,
  counter: 0.7,
  transition: 0.7,
  stylize: 0.7,
  diffuse: 0.7,
  generate_name: 0.7,

  // High creativity
  synonyms: 0.8,
  humanize: 0.9,

  // Deterministic
  autocomplete: 0.0,
};

export function getTemperature(action: string, fallback = 0.6): number {
  return ACTION_TEMPERATURES[action as TemperatureAction] ?? fallback;
}
