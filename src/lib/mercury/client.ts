import { getSystemPrompt } from "@/lib/prompts";
import type {
  MercuryModel,
  MercuryMessage,
  ReasoningEffort,
  WritingMode,
  HumanizerResponse,
  HumanizerOneResponse,
} from "@/lib/types";

function getJoinToken(): string {
  const envCode = process.env.NEXT_PUBLIC_JOIN_CODE ?? "";
  if (typeof window === "undefined") return envCode;
  return localStorage.getItem("scribex-join-code") ?? envCode;
}

// ─── Mercury Client ────────────────────────────────────────────
// Handles all communication with Inception Labs' Mercury API.
// Uses server-side API routes to keep the API key secure.

/**
 * Route a writing action to the correct Mercury model.
 */
export function routeToModel(mode: WritingMode, editScope?: number): MercuryModel {
  switch (mode) {
    case "compose":
    case "deep-rewrite":
    case "review":
    case "diffusion-draft":
      return "mercury-2";
    case "autocomplete":
    case "next-edit":
      return "mercury-edit";
    case "quick-edit":
      return (editScope ?? 0) < 500 ? "mercury-edit" : "mercury-2";
    default:
      return "mercury-2";
  }
}

/**
 * Stream a Mercury 2 chat completion via our API route.
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
        max_tokens: options.maxTokens ?? 4096,
        temperature: options.temperature ?? 0.3,
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
 * Non-streaming chat completion with structured output (JSON schema).
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
 * Apply an edit using Mercury Edit via our API route.
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
  return data.choices?.[0]?.message?.content ?? originalText;
}

/**
 * Fill-in-the-middle completion for autocomplete.
 */
export async function fimCompletion(
  prefix: string,
  suffix: string,
  options?: { maxTokens?: number; signal?: AbortSignal }
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
      temperature: 0.0,
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

/**
 * Generate humanized alternatives for AI-generated text.
 * Calls /api/humanize which assembles few-shot examples server-side.
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
 * Generate one more humanized alternative, avoiding duplicates.
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
