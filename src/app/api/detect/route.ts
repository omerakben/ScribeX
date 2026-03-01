/**
 * POST /api/detect
 *
 * Accepts { text: string } and returns a DetectionResponse.
 *
 * Currently uses a heuristic-based mock detector (no external API key required).
 * All analysis runs server-side using text pattern analysis.
 *
 * TODO: Swap heuristics for a real provider by:
 *   1. Add your provider key to .env (e.g. PANGRAM_API_KEY, GPTZERO_API_KEY)
 *   2. Replace the `analyzeText(body.text)` call with a fetch to the provider
 *   3. Map the provider response to DetectionResponse shape
 *   Example providers: Pangram (pangram.com), GPTZero (gptzero.me), Sapling (sapling.ai)
 *
 * Security:
 * - CSRF + rate limiting enforced by middleware (src/middleware.ts)
 * - Join-code auth mirrors the mercury route pattern
 * - Body size capped at 32 KB (detection calls on large docs are expensive)
 */

import { NextRequest, NextResponse } from "next/server";
import { analyzeText } from "@/lib/detection/heuristics";

const JOIN_CODE = process.env.NEXT_PUBLIC_JOIN_CODE?.trim();
const MAX_BODY_BYTES = 32_000; // 32 KB — enough for a full paper section
const MIN_TEXT_LENGTH = 10;
const MAX_TEXT_LENGTH = 20_000;

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  if (JOIN_CODE) {
    const token = req.headers.get("x-join-token")?.trim();
    if (!token || token.toLowerCase() !== JOIN_CODE.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // ── Body size guard ───────────────────────────────────────────────────────
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: { text?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";

  if (text.length < MIN_TEXT_LENGTH) {
    return NextResponse.json(
      { error: "Text too short for analysis" },
      { status: 400 }
    );
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: "Text too long — split into smaller sections" },
      { status: 413 }
    );
  }

  // ── Analyze ───────────────────────────────────────────────────────────────
  try {
    const result = analyzeText(text);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Detection route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
