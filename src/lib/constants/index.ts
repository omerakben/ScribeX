import type {
  Citation,
  ChicagoCitationVariant,
  CitationStyleId,
  CitationStyleInput,
  CitationStyleSelection,
  LegacyCitationStyleId,
  PaperTemplate,
  SlashCommand,
} from "@/lib/types";

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
  { id: "rewrite", label: "Deep Rewrite", description: "Substantially rewrite with high reasoning", icon: "refresh-cw", action: "rewrite", model: "mercury-2" },
  { id: "diffuse", label: "Diffuse", description: "Generate with Mercury's diffusion denoising effect", icon: "waves", action: "diffuse", model: "mercury-2" },
  { id: "mermaid", label: "Mermaid Diagram", description: "Insert a visual diagram", icon: "git-branch", action: "mermaid", model: "mercury-2" },
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

// ─── Citation Styles ───────────────────────────────────────────

export const DEFAULT_CITATION_STYLE_SELECTION: CitationStyleSelection = { id: "apa-7" };
const DEFAULT_CHICAGO_VARIANT: ChicagoCitationVariant = "notes-bibliography";

export interface CitationStyleSpec {
  id: CitationStyleId;
  label: string;
  shortLabel: string;
  family: "author-date" | "numeric" | "notes-bibliography";
  edition?: string;
  description: string;
  disciplines: string[];
  inTextExample: string;
  referenceHeading: "References" | "Works Cited" | "Bibliography";
  supportsFootnotes: boolean;
  chicagoVariants?: Array<{
    id: ChicagoCitationVariant;
    label: string;
    description: string;
    inTextExample: string;
  }>;
}

export const CITATION_STYLE_ORDER: CitationStyleId[] = [
  "apa-7",
  "mla-9",
  "chicago-17",
  "ieee",
  "harvard",
  "vancouver-icmje",
];

export const CHICAGO_VARIANT_CATALOG: Array<{
  id: ChicagoCitationVariant;
  label: string;
  description: string;
  inTextExample: string;
}> = [
  {
    id: "notes-bibliography",
    label: "Notes & Bibliography",
    description: "Numeric footnote/endnote references, common in history and the humanities.",
    inTextExample: "Climate policy has evolved rapidly.[1]",
  },
  {
    id: "author-date",
    label: "Author-Date",
    description: "Parenthetical author-date citations used in social sciences and sciences.",
    inTextExample: "(Smith 2024)",
  },
];

export const CITATION_STYLE_CATALOG: Record<CitationStyleId, CitationStyleSpec> = {
  "apa-7": {
    id: "apa-7",
    label: "APA 7th edition",
    shortLabel: "APA 7",
    family: "author-date",
    edition: "7th",
    description: "Psychology and social sciences with author-date parenthetical citations.",
    disciplines: ["Psychology", "Education", "Social sciences"],
    inTextExample: "(Smith et al., 2024)",
    referenceHeading: "References",
    supportsFootnotes: false,
  },
  "mla-9": {
    id: "mla-9",
    label: "MLA 9th edition",
    shortLabel: "MLA 9",
    family: "author-date",
    edition: "9th",
    description: "Humanities style emphasizing author in parenthetical citations.",
    disciplines: ["Humanities", "Literature"],
    inTextExample: "(Smith)",
    referenceHeading: "Works Cited",
    supportsFootnotes: false,
  },
  "chicago-17": {
    id: "chicago-17",
    label: "Chicago 17th edition",
    shortLabel: "Chicago 17",
    family: "notes-bibliography",
    edition: "17th",
    description: "Supports Notes & Bibliography and Author-Date variants.",
    disciplines: ["History", "Publishing", "Interdisciplinary"],
    inTextExample: "See notes variant [1] or author-date (Smith 2024).",
    referenceHeading: "Bibliography",
    supportsFootnotes: true,
    chicagoVariants: CHICAGO_VARIANT_CATALOG,
  },
  ieee: {
    id: "ieee",
    label: "IEEE",
    shortLabel: "IEEE",
    family: "numeric",
    description: "Numeric bracket citations widely used in engineering and computer science.",
    disciplines: ["Engineering", "Computer science"],
    inTextExample: "[1]",
    referenceHeading: "References",
    supportsFootnotes: false,
  },
  harvard: {
    id: "harvard",
    label: "Harvard",
    shortLabel: "Harvard",
    family: "author-date",
    description: "Author-date style common across multidisciplinary journals.",
    disciplines: ["Multidisciplinary"],
    inTextExample: "(Smith et al., 2024)",
    referenceHeading: "References",
    supportsFootnotes: false,
  },
  "vancouver-icmje": {
    id: "vancouver-icmje",
    label: "Vancouver (ICMJE)",
    shortLabel: "Vancouver",
    family: "numeric",
    description: "Sequential numeric style for biomedical journals.",
    disciplines: ["Medicine", "Biomedical science"],
    inTextExample: "[1]",
    referenceHeading: "References",
    supportsFootnotes: false,
  },
};

const LEGACY_CITATION_STYLE_MAP: Record<LegacyCitationStyleId, CitationStyleId> = {
  apa7: "apa-7",
  mla9: "mla-9",
  chicago: "chicago-17",
  ieee: "ieee",
  harvard: "harvard",
  vancouver: "vancouver-icmje",
};

const STYLE_ALIAS_MAP: Record<string, CitationStyleId> = {
  "apa-7": "apa-7",
  apa7: "apa-7",
  "mla-9": "mla-9",
  mla9: "mla-9",
  "chicago-17": "chicago-17",
  chicago17: "chicago-17",
  chicago: "chicago-17",
  ieee: "ieee",
  harvard: "harvard",
  "vancouver-icmje": "vancouver-icmje",
  vancouvericmje: "vancouver-icmje",
  vancouver: "vancouver-icmje",
};

function normalizeStyleToken(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_]+/g, "-");
}

function isCitationStyleSelection(
  value: CitationStyleInput | string | null | undefined
): value is CitationStyleSelection {
  return typeof value === "object" && value !== null && "id" in value;
}

export function normalizeCitationStyleId(style: CitationStyleInput | string | null | undefined): CitationStyleId {
  if (isCitationStyleSelection(style)) {
    return normalizeCitationStyleId(style.id);
  }

  if (typeof style === "string") {
    const normalized = normalizeStyleToken(style);
    if (STYLE_ALIAS_MAP[normalized]) {
      return STYLE_ALIAS_MAP[normalized];
    }

    const compact = normalized.replace(/-/g, "");
    if (STYLE_ALIAS_MAP[compact]) {
      return STYLE_ALIAS_MAP[compact];
    }
  }

  return DEFAULT_CITATION_STYLE_SELECTION.id;
}

function normalizeChicagoVariant(value: string | null | undefined): ChicagoCitationVariant {
  if (!value) return DEFAULT_CHICAGO_VARIANT;

  const normalized = normalizeStyleToken(value);
  if (normalized === "author-date" || normalized === "authordate") return "author-date";
  return DEFAULT_CHICAGO_VARIANT;
}

export function normalizeCitationStyleSelection(
  style: CitationStyleInput | string | null | undefined
): CitationStyleSelection {
  const id = normalizeCitationStyleId(style);
  if (id !== "chicago-17") return { id };

  if (isCitationStyleSelection(style)) {
    return {
      id,
      chicagoVariant: normalizeChicagoVariant(style.chicagoVariant),
    };
  }

  if (typeof style === "string") {
    return {
      id,
      chicagoVariant: style.toLowerCase().includes("author-date")
        ? "author-date"
        : DEFAULT_CHICAGO_VARIANT,
    };
  }

  return {
    id,
    chicagoVariant: DEFAULT_CHICAGO_VARIANT,
  };
}

export function normalizeCitationStyle(
  legacy: LegacyCitationStyleId | CitationStyleSelection | CitationStyleId | undefined
): CitationStyleSelection {
  return normalizeCitationStyleSelection(legacy);
}

export function getCitationStyleSelection(
  style: CitationStyleInput | string | null | undefined
): CitationStyleSelection {
  return normalizeCitationStyleSelection(style);
}

export function getLegacyCitationStyleId(
  style: CitationStyleInput | string | null | undefined
): LegacyCitationStyleId {
  const normalized = normalizeCitationStyleId(style);

  for (const [legacyId, mapped] of Object.entries(LEGACY_CITATION_STYLE_MAP) as Array<
    [LegacyCitationStyleId, CitationStyleId]
  >) {
    if (mapped === normalized) return legacyId;
  }

  return "apa7";
}

export function isNumericCitationStyle(style: CitationStyleInput | string | null | undefined): boolean {
  const selection = normalizeCitationStyleSelection(style);
  return (
    selection.id === "ieee" ||
    selection.id === "vancouver-icmje" ||
    (selection.id === "chicago-17" && selection.chicagoVariant === "notes-bibliography")
  );
}

export function getCitationEntityId(citation: Pick<Citation, "provider" | "externalId">): string {
  return `${citation.provider}:${citation.externalId}`;
}

// ─── Plan Limits ───────────────────────────────────────────────

export const PLAN_LIMITS = {
  scholar: { tokensPerDay: 50_000, maxPapers: 3, collaboration: false },
  researcher: { tokensPerDay: 500_000, maxPapers: Infinity, collaboration: false },
  lab: { tokensPerDay: 2_000_000, maxPapers: Infinity, collaboration: true },
  institution: { tokensPerDay: Infinity, maxPapers: Infinity, collaboration: true },
} as const;

// ─── Review Schema (Mercury Structured Outputs) ─────────────────

export const REVIEW_JSON_SCHEMA = {
  name: "manuscript_review",
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      categories: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            label: { type: "string" as const },
            score: { type: "number" as const },
            feedback: { type: "string" as const },
          },
          required: ["label", "score", "feedback"],
          additionalProperties: false,
        },
      },
    },
    required: ["categories"],
    additionalProperties: false,
  },
};

// ─── Editor Config ─────────────────────────────────────────────

export const AUTOCOMPLETE_DELAY_MS = 300;
export const AUTOSAVE_INTERVAL_MS = 30_000;
export const MAX_EDITOR_CONTEXT_TOKENS = 128_000;
