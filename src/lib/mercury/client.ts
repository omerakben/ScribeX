import { getSystemPrompt } from "@/lib/prompts";
import { getTemperature } from "@/lib/constants/temperatures";
import { STORAGE_KEYS } from "@/lib/storage";
import type {
  MercuryMessage,
  ReasoningEffort,
  HumanizerResponse,
  HumanizerOneResponse,
} from "@/lib/types";

// ─── Mercury Client ────────────────────────────────────────────
// Handles all communication with Inception Labs' Mercury API.
// All AI calls route through server-side API routes to keep the API key secure.
//
// Endpoint routing summary:
//   streamChatCompletion()     → POST /api/mercury { endpoint: "chat", model: "mercury-2", stream: true }
//                                Use for: compose, rewrite, expand, diffusion-draft, and all creative generation.
//   structuredChatCompletion() → POST /api/mercury { endpoint: "chat", model: "mercury-2", stream: false }
//                                Use for: JSON schema outputs — review, tone analysis, structured data.
//   applyEdit()                → POST /api/mercury { endpoint: "apply", model: "mercury-edit" }
//                                Use for: surgical inline edits — simplify, academic tone, grammar fix.
//   fimCompletion()            → POST /api/mercury { endpoint: "fim", model: "mercury-edit" }
//                                Use for: fill-in-the-middle autocomplete only.
//   humanizeText()             → POST /api/humanize (dedicated route, never /api/mercury)
//   humanizeOneMore()          → POST /api/humanize (dedicated route, never /api/mercury)

export function getJoinToken(): string {
  const envCode = process.env.NEXT_PUBLIC_JOIN_CODE ?? "";
  if (typeof window === "undefined") return envCode;
  return localStorage.getItem(STORAGE_KEYS.joinCode) ?? envCode;
}

/**
 * Calculate proportional max_tokens for short inputs.
 *
 * Prevents wasting tokens on single-word or short-phrase requests by scaling
 * the token budget to roughly 10× the input word count for inputs under 50 words.
 * Returns `defaultMax` unchanged for longer inputs.
 *
 * @param inputText - The user's input text (used to estimate word count).
 * @param defaultMax - The fallback token limit for longer inputs (default: 4096).
 * @returns A token budget between 64 and defaultMax.
 */
export function calculateMaxTokens(inputText: string, defaultMax: number = 4096): number {
  const wordCount = inputText.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount < 50) {
    return Math.max(64, wordCount * 10);
  }
  return defaultMax;
}

/**
 * Stream a chat completion from mercury-2 via Server-Sent Events.
 *
 * This is the primary endpoint for all **creative generation** tasks:
 * compose, rewrite, expand, outline, counter, abstract, evidence, transition,
 * and diffusion-draft. It always targets `mercury-2` — the generative model.
 *
 * In diffusion mode (`diffusing: true`), each SSE chunk contains the **full
 * denoised text** at that step rather than a delta. Use `onDiffusionStep`
 * instead of `onChunk` in that case.
 *
 * @param messages - Chat messages (system prompt is prepended automatically).
 * @param options.maxTokens - Max tokens to generate (auto-scaled for short inputs).
 * @param options.temperature - Sampling temperature (defaults to `getTemperature("chat")`).
 * @param options.diffusing - Enable diffusion mode where chunks are full-text snapshots.
 * @param options.reasoningEffort - Mercury reasoning tier: instant | low | medium | high.
 * @param options.onChunk - Called with each incremental text delta (non-diffusion mode).
 * @param options.onDiffusionStep - Called with full text + step index (diffusion mode only).
 * @param options.onDone - Called when the stream completes successfully.
 * @param options.onError - Called on network or API errors (AbortErrors are swallowed).
 * @param options.signal - AbortSignal for cancellation.
 */
export async function streamChatCompletion(
  messages: MercuryMessage[],
  options: {
    maxTokens?: number;
    temperature?: number;
    diffusing?: boolean;
    reasoningEffort?: ReasoningEffort;
    onChunk: (text: string) => void;
    onDiffusionStep?: (fullText: string, step: number) => void;
    onDone: () => void;
    onError: (error: Error) => void;
    signal?: AbortSignal;
  }
) {
  try {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    const lastUserContent = typeof lastUserMessage?.content === "string" ? lastUserMessage.content : "";
    const maxTokens = calculateMaxTokens(lastUserContent, options.maxTokens ?? 4096);

    const res = await fetch("/api/mercury", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-join-token": getJoinToken() },
      body: JSON.stringify({
        endpoint: "chat",
        model: "mercury-2",
        messages: [
          { role: "system", content: getSystemPrompt() },
          ...messages,
        ],
        max_tokens: maxTokens,
        temperature: options.temperature ?? getTemperature("chat"),
        stream: true,
        diffusing: options.diffusing ?? false,
        ...(options.reasoningEffort && { reasoning_effort: options.reasoningEffort }),
      }),
      signal: options.signal,
    });

    if (!res.ok) {
      throw new Error(`Mercury API error: ${res.status} ${res.statusText}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";
    let diffusionStepCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") {
          options.onDone();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            if (options.diffusing && options.onDiffusionStep) {
              // Diffusion mode: delta.content is the FULL text at this denoising step
              diffusionStepCount++;
              options.onDiffusionStep(content, diffusionStepCount);
            } else {
              options.onChunk(content);
            }
          }
        } catch {
          // Skip malformed chunks
        }
      }
    }

    options.onDone();
  } catch (error) {
    if ((error as Error).name === "AbortError") return;
    options.onError(error as Error);
  }
}

/**
 * Non-streaming chat completion with structured JSON output via mercury-2.
 *
 * Use this for tasks that require a **guaranteed JSON shape** — review scores,
 * tone analysis, outline generation, or any structured data extraction.
 * The response is validated against `schema` (JSON Schema object) and parsed
 * before returning, so callers receive typed data directly.
 *
 * Uses mercury-2 (generative model) with `stream: false`. Temperature defaults
 * to 0.3 — lower than chat (0.6) because structured outputs benefit from
 * less sampling variance.
 *
 * @param messages - Chat messages (system prompt is prepended automatically).
 * @param schema - JSON Schema object that constrains the response format.
 * @param options.maxTokens - Max tokens to generate (default: 4096).
 * @param options.temperature - Sampling temperature (default: 0.3 for precise JSON).
 * @param options.reasoningEffort - Mercury reasoning tier: instant | low | medium | high.
 * @param options.signal - AbortSignal for cancellation.
 * @returns Parsed response typed as T.
 * @throws If the API call fails or the response content is missing.
 */
export async function structuredChatCompletion<T>(
  messages: MercuryMessage[],
  schema: object,
  options?: {
    maxTokens?: number;
    temperature?: number;
    reasoningEffort?: ReasoningEffort;
    signal?: AbortSignal;
  }
): Promise<T> {
  const res = await fetch("/api/mercury", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-join-token": getJoinToken() },
    body: JSON.stringify({
      endpoint: "chat",
      model: "mercury-2",
      messages: [
        { role: "system", content: getSystemPrompt() },
        ...messages,
      ],
      max_tokens: options?.maxTokens ?? 4096,
      temperature: options?.temperature ?? 0.3,
      stream: false,
      response_format: {
        type: "json_schema",
        json_schema: schema,
      },
      ...(options?.reasoningEffort && { reasoning_effort: options.reasoningEffort }),
    }),
    signal: options?.signal,
  });

  if (!res.ok) {
    throw new Error(`Mercury API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content in response");

  return JSON.parse(content) as T;
}

/**
 * Apply a surgical inline edit using mercury-edit via the `/apply` endpoint.
 *
 * Use this for **precise, deterministic text transformations** on existing content:
 * simplify language, enforce academic tone, fix grammar, or apply style rules.
 * This is NOT appropriate for creative generation — use `streamChatCompletion`
 * for compose, rewrite, or expand tasks.
 *
 * The mercury-edit model receives a structured prompt with `<|original_code|>` and
 * `<|update_snippet|>` delimiters (analogous to code-editing conventions). Temperature
 * is fixed at 0.0 for maximum determinism — the model must follow the instruction
 * precisely without creative deviation.
 *
 * Routing: quick-edit on short selections (< 500 chars) → this function.
 *          quick-edit on longer selections → streamChatCompletion with mercury-2.
 *          simplify and academic slash commands → always this function.
 *
 * @param originalText - The text to be edited (selected passage or paragraph).
 * @param editInstruction - Natural language instruction describing the desired change.
 * @param options.signal - AbortSignal for cancellation.
 * @returns The edited text string, or `originalText` if the API returns no content.
 * @throws If the API call returns a non-OK status.
 */
export async function applyEdit(
  originalText: string,
  editInstruction: string,
  options?: { signal?: AbortSignal }
): Promise<string> {
  const res = await fetch("/api/mercury", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-join-token": getJoinToken() },
    body: JSON.stringify({
      endpoint: "apply",
      model: "mercury-edit",
      messages: [{
        role: "user",
        content: `<|original_code|>\n${originalText}\n<|/original_code|>\n\n<|update_snippet|>\n${editInstruction}\n<|/update_snippet|>`,
      }],
      max_tokens: 8192,
      temperature: 0.0,
    }),
    signal: options?.signal,
  });

  if (!res.ok) {
    throw new Error(`Mercury Edit API error: ${res.status}`);
  }

  const data = await res.json();
  const raw: string = data.choices?.[0]?.message?.content ?? originalText;

  // Mercury-edit may wrap its response in <|updated_code|> delimiters — strip them.
  const stripped = raw
    .replace(/^<\|updated_code\|>\s*/i, "")
    .replace(/\s*<\|\/updated_code\|>\s*$/i, "")
    .trim();

  return stripped || originalText;
}

/**
 * Fill-in-the-middle (FIM) completion for inline autocomplete via mercury-edit.
 *
 * Use this **exclusively** for the ghost-text autocomplete feature. The model
 * receives the document text before and after the cursor and predicts what
 * should be inserted at the cursor position.
 *
 * Unlike `applyEdit`, which transforms existing text, FIM generates new content
 * that bridges the gap between `prefix` and `suffix`. Mercury-edit's FIM
 * capability is trained for this specific task — do not use `streamChatCompletion`
 * for autocomplete.
 *
 * Temperature defaults to 0.0 for maximum prediction consistency. The ghost-text
 * extension uses a temperature ramp (0.0 → 0.4) when pre-fetching multiple
 * cached alternatives.
 *
 * `presence_penalty: 1.5` discourages repetition of words already in the prefix.
 *
 * @param prefix - Document text before the cursor (context for prediction).
 * @param suffix - Document text after the cursor (continuation target).
 * @param options.maxTokens - Max tokens to generate (default: 512).
 * @param options.temperature - Sampling temperature (default: 0.0 for determinism).
 * @param options.signal - AbortSignal for cancellation (used by GhostText on cursor move).
 * @returns The predicted inline completion string, or "" if the API returns nothing.
 * @throws If the API call returns a non-OK status.
 */
export async function fimCompletion(
  prefix: string,
  suffix: string,
  options?: { maxTokens?: number; temperature?: number; signal?: AbortSignal }
): Promise<string> {
  const res = await fetch("/api/mercury", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-join-token": getJoinToken() },
    body: JSON.stringify({
      endpoint: "fim",
      model: "mercury-edit",
      prompt: prefix,
      suffix: suffix,
      max_tokens: options?.maxTokens ?? 512,
      temperature: options?.temperature ?? 0.0,
      presence_penalty: 1.5,
    }),
    signal: options?.signal,
  });

  if (!res.ok) {
    throw new Error(`Mercury FIM API error: ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.text ?? "";
}

// ─── Humanizer Client ──────────────────────────────────────────
// These functions route to /api/humanize, NOT /api/mercury.
// The humanize API route assembles few-shot examples from the dataset server-side
// and calls mercury-2 directly with a specialized few-shot prompt.

/**
 * Generate a batch of humanized alternatives for AI-generated text.
 *
 * Routes to `POST /api/humanize` (not `/api/mercury`). The dedicated humanize
 * route assembles few-shot examples from the 456-entry dataset server-side
 * (never bundled to the client) and constructs the mercury-2 prompt internally.
 *
 * Returns `count` alternatives (default: 4) in a single request. For incremental
 * "Generate More" requests with deduplication, use `humanizeOneMore` instead.
 *
 * @param text - The AI-generated text to humanize.
 * @param options.context - Optional document context (paper title, abstract) for
 *   context-aware prompt selection.
 * @param options.count - Number of alternatives to generate (default: 4).
 * @param options.temperature - Base sampling temperature (default: 0.9 for humanization).
 * @param options.signal - AbortSignal for cancellation.
 * @returns `{ alternatives: string[] }` with `count` humanized variants.
 * @throws If the API call returns a non-OK status.
 */
export async function humanizeText(
  text: string,
  options?: {
    context?: string;
    count?: number;
    temperature?: number;
    signal?: AbortSignal;
  }
): Promise<HumanizerResponse> {
  const res = await fetch("/api/humanize", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-join-token": getJoinToken() },
    body: JSON.stringify({
      text,
      context: options?.context,
      count: options?.count ?? 4,
      action: "generate",
      temperature: options?.temperature,
    }),
    signal: options?.signal,
  });

  if (!res.ok) {
    throw new Error(`Humanize API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Generate one additional humanized alternative, avoiding duplicates.
 *
 * Companion to `humanizeText` for the "Generate More" tier of the HumanizerPanel.
 * Routes to `POST /api/humanize` with `action: "generate_one"`. The API route
 * applies a temperature ramp (+0.15 per existing alternative, capped at 1.5)
 * and passes `existing` to the model for deduplication via Jaccard similarity.
 *
 * Call this incrementally after `humanizeText` to add more alternatives without
 * re-generating the initial batch.
 *
 * @param text - The original AI-generated text (same as passed to `humanizeText`).
 * @param existing - Array of already-generated alternatives to avoid duplicating.
 * @param options.temperature - Override temperature (pipeline applies ramp by default).
 * @param options.signal - AbortSignal for cancellation.
 * @returns `{ alternative: string }` with a single new humanized variant.
 * @throws If the API call returns a non-OK status.
 */
export async function humanizeOneMore(
  text: string,
  existing: string[],
  options?: {
    temperature?: number;
    signal?: AbortSignal;
  }
): Promise<HumanizerOneResponse> {
  const res = await fetch("/api/humanize", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-join-token": getJoinToken() },
    body: JSON.stringify({
      text,
      existing,
      action: "generate_one",
      temperature: options?.temperature,
    }),
    signal: options?.signal,
  });

  if (!res.ok) {
    throw new Error(`Humanize API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
