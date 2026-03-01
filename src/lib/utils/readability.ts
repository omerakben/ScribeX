// ─── Types ─────────────────────────────────────────────────────

export type ReadabilityGrade =
  | "Easy"
  | "Standard"
  | "Hard"
  | "Complex"
  | "Very Complex";

export interface ReadabilityResult {
  /** Flesch Reading Ease score (0–100, clamped) */
  score: number;
  /** Human-readable grade label */
  grade: ReadabilityGrade;
  /** Tailwind color class for the grade */
  color: string;
  sentenceCount: number;
  wordCount: number;
  syllableCount: number;
  /** Average words per sentence, rounded to 1 decimal */
  avgWordsPerSentence: number;
  /** Average syllables per word, rounded to 2 decimals */
  avgSyllablesPerWord: number;
}

// ─── Syllable Counting ──────────────────────────────────────────

/**
 * Estimate the number of syllables in a single word using heuristic rules
 * derived from the Flesch–Kincaid methodology.
 */
export function countSyllables(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!cleaned) return 0;

  // Fast path: very short words are almost always monosyllabic
  if (cleaned.length <= 3) return 1;

  // Strip silent suffixes that don't contribute a syllable
  const stripped = cleaned
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    .replace(/^y/, "");

  // Count contiguous vowel groups — each group ≈ one syllable
  const matches = stripped.match(/[aeiouy]{1,2}/g);
  return Math.max(1, matches ? matches.length : 1);
}

// ─── Grade Thresholds ───────────────────────────────────────────

interface GradeBand {
  minScore: number;
  grade: ReadabilityGrade;
  color: string;
}

const GRADE_BANDS: GradeBand[] = [
  { minScore: 80, grade: "Easy", color: "text-emerald-600" },
  { minScore: 60, grade: "Standard", color: "text-yellow-600" },
  { minScore: 40, grade: "Hard", color: "text-orange-600" },
  { minScore: 20, grade: "Complex", color: "text-red-600" },
  { minScore: 0, grade: "Very Complex", color: "text-red-700" },
];

function getGrade(score: number): { grade: ReadabilityGrade; color: string } {
  for (const band of GRADE_BANDS) {
    if (score >= band.minScore) {
      return { grade: band.grade, color: band.color };
    }
  }
  return { grade: "Very Complex", color: "text-red-700" };
}

// ─── Easy Result Helper ─────────────────────────────────────────

function easyResult(
  sentenceCount: number,
  wordCount: number,
  syllableCount: number
): ReadabilityResult {
  return {
    score: 100,
    grade: "Easy",
    color: "text-emerald-600",
    sentenceCount,
    wordCount,
    syllableCount,
    avgWordsPerSentence: wordCount,
    avgSyllablesPerWord: syllableCount > 0 ? syllableCount / Math.max(1, wordCount) : 0,
  };
}

// ─── Main Analysis ──────────────────────────────────────────────

/**
 * Analyze the readability of a block of plain text using the Flesch Reading
 * Ease formula: `206.835 − 1.015 × (words/sentences) − 84.6 × (syllables/words)`.
 *
 * Scores are clamped to [0, 100]. Edge cases (empty input, single word, no
 * detectable sentences) return score 100 with grade "Easy".
 */
export function analyzeReadability(text: string): ReadabilityResult {
  if (!text || !text.trim()) {
    return easyResult(0, 0, 0);
  }

  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter((w) => w.trim().length > 0);

  const wordCount = words.length;
  const sentenceCount = sentences.length;

  if (wordCount === 0) return easyResult(0, 0, 0);

  const syllableCount = words.reduce((sum, w) => sum + countSyllables(w), 0);

  // Single word or no detectable sentence boundaries → trivially easy
  if (sentenceCount === 0 || wordCount === 1) {
    return easyResult(sentenceCount, wordCount, syllableCount);
  }

  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgSyllablesPerWord = syllableCount / wordCount;

  const rawScore =
    206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

  const score = Math.max(0, Math.min(100, Math.round(rawScore * 10) / 10));

  const { grade, color } = getGrade(score);

  return {
    score,
    grade,
    color,
    sentenceCount,
    wordCount,
    syllableCount,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
  };
}
