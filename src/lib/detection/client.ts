/**
 * Thin client for the AI detection API route.
 * Calls POST /api/detect and returns a DetectionResponse.
 * The route uses Pangram v3 API when PANGRAM_API_KEY is set, heuristics otherwise.
 */

import type { DetectionResponse } from "@/lib/types";
import { getJoinToken } from "@/lib/mercury/client";

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
    headers: { "Content-Type": "application/json", "x-join-token": getJoinToken() },
    body: JSON.stringify({ text }),
    signal,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error ?? `Detection failed (${response.status})`);
  }

  return response.json() as Promise<DetectionResponse>;
}
