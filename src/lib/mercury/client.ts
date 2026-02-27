import { MERCURY_API_BASE, MERCURY_ENDPOINTS, ACADEMIC_SYSTEM_PROMPT } from "@/lib/constants";
import type { MercuryModel, MercuryMessage, WritingMode } from "@/lib/types";

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
    onChunk: (text: string) => void;
    onDone: () => void;
    onError: (error: Error) => void;
    signal?: AbortSignal;
  }
) {
  try {
    const res = await fetch("/api/mercury", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: "chat",
        model: "mercury-2",
        messages: [
          { role: "system", content: ACADEMIC_SYSTEM_PROMPT },
          ...messages,
        ],
        max_tokens: options.maxTokens ?? 4096,
        temperature: options.temperature ?? 0.3,
        stream: true,
        diffusing: options.diffusing ?? false,
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
            options.onChunk(content);
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
 * Apply an edit using Mercury Edit via our API route.
 */
export async function applyEdit(
  originalText: string,
  editInstruction: string,
  options?: { signal?: AbortSignal }
): Promise<string> {
  const res = await fetch("/api/mercury", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
    headers: { "Content-Type": "application/json" },
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
