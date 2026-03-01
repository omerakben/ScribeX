/**
 * Thin client for the AI detection API route.
 * Calls POST /api/detect and returns a DetectionResponse.
 *
 * TODO: If you swap heuristics for a real provider (Pangram, GPTZero, etc.),
 * no changes are needed here — only update src/app/api/detect/route.ts.
 */

import type { DetectionResponse } from "@/lib/types";

/**
 * Detect whether the given text is AI-generated.
 *
 * @param text    The text to analyze (at least a few sentences for accuracy).
 * @param signal  Optional AbortSignal for cancellation.
 * @returns       A DetectionResponse with overall score, label, and per-sentence data.
 */
export async function detectAI(
  text: string,
  signal?: AbortSignal
): Promise<DetectionResponse> {
  const response = await fetch("/api/detect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error ?? `Detection failed (${response.status})`);
  }

  return response.json() as Promise<DetectionResponse>;
}
