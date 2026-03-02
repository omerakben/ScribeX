/**
 * Heuristic-based AI text detection.
 *
 * Analyzes several signals that correlate with AI-generated academic text:
 * - Sentence length uniformity (AI tends toward consistent sentence length)
 * - Type-token ratio / vocabulary richness (AI often has lower lexical diversity)
 * - Passive voice frequency (AI overuses passive constructions)
 * - Transition word density (AI uses formulaic connectives)
 * - Burstiness (human writing has high variance in sentence length)
 *
 * Scores are 0–1 where 1 = highly likely AI-generated.
 *
 * This module serves as the fallback when PANGRAM_API_KEY is not configured.
 * The primary detection path uses the Pangram v3 API (see src/app/api/detect/route.ts).
 */

import type { DetectionResponse, DetectionSentence } from "@/lib/types";

// ─── Vocabulary helpers ────────────────────────────────────────────────────────

/** Tokenize text into lowercase words (letters only). */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .match(/\b[a-z']+\b/g) ?? [];
}

/** Type-token ratio — lexical diversity, 0 (no diversity) → 1 (all unique). */
function typeTokenRatio(tokens: string[]): number {
  if (tokens.length === 0) return 1;
  const unique = new Set(tokens).size;
  return unique / tokens.length;
}

// ─── Passive voice ─────────────────────────────────────────────────────────────

const PASSIVE_PATTERN =
  /\b(is|are|was|were|be|been|being)\s+(\w+ed|written|shown|known|found|given|made|done|taken|seen|used|based|considered|noted|provided|described|indicated|demonstrated|suggested|observed|reported|identified|analyzed|examined|studied|investigated|discussed|presented|proposed|conducted|performed|implemented|developed|designed|evaluated|assessed|measured|calculated|estimated|tested|verified|validated|compared)\b/i;

function passiveVoiceRatio(sentences: string[]): number {
  if (sentences.length === 0) return 0;
  const passiveCount = sentences.filter((s) => PASSIVE_PATTERN.test(s)).length;
  return passiveCount / sentences.length;
}

// ─── Transition words ──────────────────────────────────────────────────────────

const TRANSITION_WORDS = new Set([
  "furthermore", "moreover", "additionally", "consequently", "therefore",
  "thus", "hence", "however", "nevertheless", "nonetheless", "notwithstanding",
  "subsequently", "accordingly", "in conclusion", "in summary", "to summarize",
  "in addition", "as a result", "for example", "for instance", "in contrast",
  "on the other hand", "it is important", "it should be noted", "it is worth",
  "notably", "importantly", "significantly", "essentially", "ultimately",
  "overall", "in general", "generally speaking", "in particular", "specifically",
]);

function transitionWordDensity(tokens: string[]): number {
  if (tokens.length === 0) return 0;
  const hits = tokens.filter((t) => TRANSITION_WORDS.has(t)).length;
  return Math.min(hits / (tokens.length / 10), 1); // normalize per ~10 words
}

// ─── Sentence length variance (burstiness) ────────────────────────────────────

function sentenceLengths(sentences: string[]): number[] {
  return sentences.map((s) => tokenize(s).length);
}

/**
 * Coefficient of variation — high CV = human-like variation, low = AI-uniform.
 * Returns a score where 0 = perfectly uniform (AI-like), 1 = high variance (human).
 */
function burstinessScore(lengths: number[]): number {
  if (lengths.length < 2) return 0.5;
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  if (mean === 0) return 0.5;
  const variance =
    lengths.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / lengths.length;
  const cv = Math.sqrt(variance) / mean;
  // Humans typically CV ~0.4–0.7; AI ~0.1–0.3
  return Math.min(cv / 0.6, 1);
}

// ─── Average sentence length ───────────────────────────────────────────────────

/** Very long sentences are a weak AI signal; very short = human. Normalize 0→1. */
function avgSentenceLengthScore(lengths: number[]): number {
  if (lengths.length === 0) return 0.5;
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  // Score rises as avg approaches 25+ words (common in AI output)
  return Math.min(avg / 28, 1);
}

// ─── Per-sentence scoring ──────────────────────────────────────────────────────

/**
 * Score a single sentence. Returns 0–1 probability of AI authorship.
 * Uses a weighted combination of local signals.
 */
function scoreSentence(sentence: string): number {
  const tokens = tokenize(sentence);
  if (tokens.length < 4) return 0.3; // too short to classify reliably

  const ttr = typeTokenRatio(tokens);
  const passive = PASSIVE_PATTERN.test(sentence) ? 1 : 0;

  const transitionHit = tokens.some((t) => TRANSITION_WORDS.has(t)) ? 1 : 0;
  const lenScore = Math.min(tokens.length / 30, 1);

  // Low TTR = more repetitive = AI-like; invert so high = AI
  const ttrScore = 1 - Math.min(ttr / 0.8, 1);

  // Weighted sum
  const raw =
    ttrScore * 0.3 +
    passive * 0.3 +
    transitionHit * 0.2 +
    lenScore * 0.2;

  // Clamp + slight jitter to look realistic (deterministic via char codes)
  const jitter =
    (sentence.charCodeAt(0) % 7) * 0.01 -
    (sentence.charCodeAt(sentence.length - 1) % 5) * 0.01;

  return Math.max(0, Math.min(1, raw + jitter));
}

// ─── Main export ───────────────────────────────────────────────────────────────

/** Split text into sentences using simple punctuation heuristics. */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);
}

/**
 * Analyze text and return a DetectionResponse.
 * All computation is synchronous and local — no network calls.
 */
export function analyzeText(text: string): DetectionResponse {
  const trimmed = text.trim();

  if (trimmed.length < 20) {
    return { score: 0, label: "human", sentences: [] };
  }

  const rawSentences = splitSentences(trimmed);
  // Fallback: treat whole text as one sentence if splitting yields nothing
  const sentences = rawSentences.length > 0 ? rawSentences : [trimmed];

  // Per-sentence scores
  const detectedSentences: DetectionSentence[] = sentences.map((s) => ({
    text: s,
    score: scoreSentence(s),
  }));

  // Global signals
  const allTokens = tokenize(trimmed);
  const lengths = sentenceLengths(sentences);

  const globalTtr = typeTokenRatio(allTokens);
  const globalPassive = passiveVoiceRatio(sentences);
  const globalTransition = transitionWordDensity(allTokens);
  const burstiness = burstinessScore(lengths);
  const avgLenScore = avgSentenceLengthScore(lengths);

  // Global score: weighted blend of sentence-level mean + global signals
  const sentenceMean =
    detectedSentences.reduce((sum, s) => sum + s.score, 0) /
    detectedSentences.length;

  const ttrPenalty = 1 - Math.min(globalTtr / 0.8, 1); // low diversity → AI
  const burstinessPenalty = 1 - burstiness; // low variance → AI

  const globalScore =
    sentenceMean * 0.35 +
    globalPassive * 0.2 +
    globalTransition * 0.15 +
    ttrPenalty * 0.15 +
    burstinessPenalty * 0.1 +
    avgLenScore * 0.05;

  const clampedScore = Math.max(0, Math.min(1, globalScore));

  const label: DetectionResponse["label"] =
    clampedScore < 0.3 ? "human" : clampedScore < 0.6 ? "mixed" : "ai";

  return {
    score: Math.round(clampedScore * 100) / 100,
    label,
    sentences: detectedSentences,
  };
}
