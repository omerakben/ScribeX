// ─── Document Types ────────────────────────────────────────────

export type PaperTemplate =
  | "blank"
  | "imrad"
  | "literature-review"
  | "systematic-review"
  | "grant-proposal"
  | "thesis-chapter"
  | "conference-paper";

export type PaperStatus = "draft" | "in-review" | "revision" | "final" | "published";

export type CitationStyleId =
  | "apa-7"
  | "mla-9"
  | "chicago-17"
  | "ieee"
  | "harvard"
  | "vancouver-icmje";

export type ChicagoCitationVariant = "notes-bibliography" | "author-date";

export interface CitationStyleSelection {
  id: CitationStyleId;
  chicagoVariant?: ChicagoCitationVariant;
}

// Backward compatibility for persisted legacy values.
export type LegacyCitationStyleId = "apa7" | "mla9" | "chicago" | "ieee" | "harvard" | "vancouver";
export type CitationStyle = CitationStyleId | LegacyCitationStyleId;
export type CitationStyleInput = CitationStyleSelection | CitationStyle;

export interface Paper {
  id: string;
  title: string;
  template: PaperTemplate;
  status: PaperStatus;
  citationStyle: CitationStyleSelection;
  references: Citation[];
  content: string; // TipTap HTML string (serialized via editor.getHTML())
  wordCount: number;
  targetJournal?: string;
  field?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Mercury Model Types ───────────────────────────────────────

export type MercuryModel = "mercury-2" | "mercury-edit";

export type ReasoningEffort = "instant" | "low" | "medium" | "high";

export type WritingMode =
  | "compose"
  | "autocomplete"
  | "quick-edit"
  | "deep-rewrite"
  | "next-edit"
  | "review"
  | "diffusion-draft";

export interface MercuryRequest {
  model: MercuryModel;
  messages: MercuryMessage[];
  max_tokens: number;
  temperature: number;
  stream: boolean;
  diffusing?: boolean;
  reasoning_effort?: ReasoningEffort;
  response_format?: { type: string; json_schema?: object };
}

export interface MercuryMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface MercuryStreamChunk {
  id: string;
  object: string;
  choices: {
    index: number;
    delta: { content?: string; role?: string };
    finish_reason: string | null;
  }[];
}

// ─── Mercury Edit Types ────────────────────────────────────────

export interface MercuryEditRequest {
  model: "mercury-edit";
  messages: { role: "user"; content: string }[];
  max_tokens: number;
  temperature: number;
}

export interface MercuryFIMRequest {
  model: "mercury-edit";
  prompt: string;
  suffix: string;
  max_tokens: number;
  temperature: number;
  presence_penalty?: number;
}

// ─── Citation Types ────────────────────────────────────────────

export type CitationProvider = "semantic-scholar" | (string & {});

export interface Citation {
  provider: CitationProvider;
  externalId: string;
  title: string;
  authors: Author[];
  year?: number;
  venue?: string;
  abstract?: string;
  doi?: string | null;
  url?: string;
  citationCount?: number;
  isOpenAccess?: boolean;
  // Backward compatibility for existing in-memory callers.
  id?: string;
  paperId?: string;
}

export interface Author {
  name: string;
  authorId?: string;
}

export interface CitationSearchResult {
  total: number;
  offset: number;
  data: Citation[];
}

// ─── Editor Types ──────────────────────────────────────────────

export interface SlashCommand {
  id: string;
  label: string;
  description: string;
  icon: string;
  action: string;
  model: MercuryModel;
}

export interface EditorSelection {
  text: string;
  from: number;
  to: number;
}

export type AIPanelMode = "chat" | "review" | "citations" | "outline";

// ─── AI Response Types ─────────────────────────────────────────

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  model?: MercuryModel;
  timestamp: string;
  isStreaming?: boolean;
}

export interface DiffusionStep {
  step: number;
  totalSteps: number;
  content: string;
  confidence: number;
}

// ─── User & Session Types ──────────────────────────────────────

export type PlanTier = "scholar" | "researcher" | "lab" | "institution";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  plan: PlanTier;
  tokensUsedToday: number;
  tokenLimit: number;
  papersCount: number;
}
