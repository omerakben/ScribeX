import type { SlashCommand, PaperTemplate } from "@/lib/types";

// ─── Mercury API ───────────────────────────────────────────────

export const MERCURY_API_BASE = "https://api.inceptionlabs.ai/v1";

export const MERCURY_MODELS = {
  reasoning: "mercury-2",
  edit: "mercury-edit",
} as const;

export const MERCURY_ENDPOINTS = {
  chat: "/chat/completions",
  apply: "/apply/completions",
  fim: "/fim/completions",
  edit: "/edit/completions",
} as const;

// ─── Academic System Prompt ────────────────────────────────────

export const ACADEMIC_SYSTEM_PROMPT = `You are ScribeX, an expert academic writing assistant. You help researchers write, edit, and improve academic papers with precision and clarity.

RULES:
- Never fabricate citations. Only reference papers you can verify.
- Maintain the author's voice and argument structure.
- Use formal academic register unless instructed otherwise.
- Flag uncertainty explicitly: "This claim may need additional citation."
- When generating content, clearly separate facts from interpretations.
- Respect discipline-specific conventions when specified.
- Never write content intended to deceive reviewers about AI involvement.

CONTEXT: You have the full paper in your context window. Reference earlier sections when writing later ones. Maintain consistency in terminology, tense, and argumentation throughout.`;

// ─── Slash Commands ────────────────────────────────────────────

export const SLASH_COMMANDS: SlashCommand[] = [
  { id: "generate", label: "Generate", description: "Generate content from instruction", icon: "sparkles", action: "generate", model: "mercury-2" },
  { id: "expand", label: "Expand", description: "Expand with more detail", icon: "maximize-2", action: "expand", model: "mercury-2" },
  { id: "simplify", label: "Simplify", description: "Simplify complex sentences", icon: "minimize-2", action: "simplify", model: "mercury-edit" },
  { id: "academic", label: "Academic Tone", description: "Elevate to formal academic register", icon: "graduation-cap", action: "academic", model: "mercury-edit" },
  { id: "cite", label: "Find Citation", description: "Find and insert relevant citations", icon: "book-open", action: "cite", model: "mercury-2" },
  { id: "outline", label: "Outline", description: "Generate a section outline", icon: "list-tree", action: "outline", model: "mercury-2" },
  { id: "counter", label: "Counter-Argument", description: "Generate a counter-argument", icon: "swords", action: "counter", model: "mercury-2" },
  { id: "evidence", label: "Find Evidence", description: "Find supporting evidence", icon: "search", action: "evidence", model: "mercury-2" },
  { id: "transition", label: "Transition", description: "Generate section transition", icon: "arrow-right", action: "transition", model: "mercury-2" },
  { id: "abstract", label: "Abstract", description: "Auto-generate abstract from paper", icon: "file-text", action: "abstract", model: "mercury-2" },
];

// ─── Paper Templates ───────────────────────────────────────────

export const PAPER_TEMPLATES: Record<PaperTemplate, { label: string; description: string; sections: string[] }> = {
  blank: {
    label: "Blank Document",
    description: "Start from scratch",
    sections: [],
  },
  imrad: {
    label: "IMRAD",
    description: "Introduction, Methods, Results, and Discussion",
    sections: ["Abstract", "Introduction", "Methods", "Results", "Discussion", "Conclusion", "References"],
  },
  "literature-review": {
    label: "Literature Review",
    description: "Thematic literature review structure",
    sections: ["Abstract", "Introduction", "Theoretical Framework", "Methodology", "Thematic Analysis", "Discussion", "Conclusion", "References"],
  },
  "systematic-review": {
    label: "Systematic Review",
    description: "PRISMA-compliant systematic review",
    sections: ["Abstract", "Introduction", "Methods", "Search Strategy", "Inclusion Criteria", "Results", "Discussion", "Limitations", "Conclusion", "References"],
  },
  "grant-proposal": {
    label: "Grant Proposal",
    description: "Research grant proposal structure",
    sections: ["Executive Summary", "Specific Aims", "Background & Significance", "Research Design", "Methods", "Timeline", "Budget Justification", "References"],
  },
  "thesis-chapter": {
    label: "Thesis Chapter",
    description: "Single thesis chapter structure",
    sections: ["Introduction", "Literature Review", "Methodology", "Findings", "Discussion", "Summary"],
  },
  "conference-paper": {
    label: "Conference Paper",
    description: "Conference submission format",
    sections: ["Abstract", "Introduction", "Related Work", "Methodology", "Experiments", "Results", "Conclusion", "References"],
  },
};

// ─── Plan Limits ───────────────────────────────────────────────

export const PLAN_LIMITS = {
  scholar: { tokensPerDay: 50_000, maxPapers: 3, collaboration: false },
  researcher: { tokensPerDay: 500_000, maxPapers: Infinity, collaboration: false },
  lab: { tokensPerDay: 2_000_000, maxPapers: Infinity, collaboration: true },
  institution: { tokensPerDay: Infinity, maxPapers: Infinity, collaboration: true },
} as const;

// ─── Editor Config ─────────────────────────────────────────────

export const AUTOCOMPLETE_DELAY_MS = 300;
export const AUTOSAVE_INTERVAL_MS = 30_000;
export const MAX_EDITOR_CONTEXT_TOKENS = 128_000;
