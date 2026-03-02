/**
 * POST /api/detect
 *
 * Accepts { text: string } and returns a DetectionResponse.
 *
 * When PANGRAM_API_KEY is configured, calls the Pangram v3 API for real
 * AI detection with 3-way classification (AI / AI-Assisted / Human),
 * per-segment windows, and a public dashboard link.
 *
 * Falls back to heuristic analysis (src/lib/detection/heuristics.ts) when
 * no Pangram key is set, so the feature works without an external API key.
 *
 * Security:
 * - CSRF + rate limiting enforced by proxy (src/proxy.ts)
 * - Join-code auth mirrors the mercury route pattern
 */

import { NextRequest, NextResponse } from "next/server";
import { analyzeText } from "@/lib/detection/heuristics";
import { validateJoinCode } from "@/lib/utils/api-auth";
import type { DetectionResponse, DetectionWindow } from "@/lib/types";

const PANGRAM_API_KEY = process.env.PANGRAM_API_KEY?.trim();
const PANGRAM_API_URL = "https://text.api.pangram.com/v3";
const PANGRAM_TIMEOUT_MS = 30_000;

const MAX_BODY_BYTES = 64_000; // 64 KB — Pangram handles longer texts
const MIN_TEXT_LENGTH = 10;
const MAX_TEXT_LENGTH = 50_000;

// ─── Pangram response mapping ─────────────────────────────────────────────────

interface PangramWindow {
  text?: string;
  label?: string;
  confidence?: string | number;
}

interface PangramResponse {
  fraction_ai?: number;
  fraction_ai_assisted?: number;
  fraction_human?: number;
  windows?: PangramWindow[];
  dashboard_link?: string;
  prediction_short?: string;
}

function mapWindowToScore(label: string): number {
  const l = label.toLowerCase();
  if (l.includes("human")) return 0.1;
  if (l.includes("ai_assisted") || l.includes("mixed")) return 0.5;
  return 0.9; // "ai"
}

function mapPangramResponse(data: PangramResponse): DetectionResponse {
  const fractionAi = data.fraction_ai ?? 0;
  const fractionAiAssisted = data.fraction_ai_assisted ?? 0;
  const fractionHuman = data.fraction_human ?? 0;

  // Overall score: fraction_ai is the primary signal
  const score = Math.round(fractionAi * 100) / 100;
  const label: DetectionResponse["label"] =
    score < 0.3 ? "human" : score < 0.6 ? "mixed" : "ai";

  // Map windows to sentences for backward compatibility
  const windows: DetectionWindow[] = (data.windows ?? []).map((w) => ({
    text: w.text ?? "",
    label: w.label ?? "unknown",
    confidence: w.confidence,
  }));

  const sentences = windows.map((w) => ({
    text: w.text,
    score: mapWindowToScore(w.label),
  }));

  return {
    score,
    label,
    sentences,
    fractionAi,
    fractionAiAssisted,
    fractionHuman,
    windows,
    dashboardLink: data.dashboard_link ?? null,
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const authError = validateJoinCode(req);
  if (authError) return authError;

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

  // ── Analyze: Pangram API or heuristic fallback ────────────────────────────
  try {
    if (PANGRAM_API_KEY) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), PANGRAM_TIMEOUT_MS);

      const response = await fetch(PANGRAM_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": PANGRAM_API_KEY,
        },
        body: JSON.stringify({ text, public_dashboard_link: true }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const msg = (err as Record<string, string>).error ?? `Pangram API error (${response.status})`;
        console.error("Pangram API error:", response.status, msg);
        return NextResponse.json({ error: msg }, { status: 502 });
      }

      const data: PangramResponse = await response.json();
      return NextResponse.json(mapPangramResponse(data));
    }

    // Fallback: heuristic analysis (no API key configured)
    const result = analyzeText(text);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Detection timed out — try a shorter text" },
        { status: 504 }
      );
    }
    console.error("Detection route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
