/**
 * Humanizer few-shot dataset utilities.
 * Loads the 456-entry before/after dataset and samples random pairs
 * for few-shot prompting.
 *
 * IMPORTANT: This module imports the dataset JSON — it must only be
 * imported in server-side code (API routes). The 1.2MB dataset should
 * never be bundled into the client.
 */

import type { MercuryMessage, HumanizerDatasetEntry } from "@/lib/types";
import type { FewShotSample } from "./types";
import dataset from "@/data/humanizer-dataset.json";

const typedDataset = dataset as HumanizerDatasetEntry[];

/**
 * Randomly sample N before/after pairs from the humanizer dataset.
 * Uses Fisher-Yates partial shuffle for unbiased selection.
 */
export function sampleFewShot(n: number): FewShotSample[] {
  const count = Math.min(n, typedDataset.length);
  const indices = Array.from({ length: typedDataset.length }, (_, i) => i);

  // Fisher-Yates partial shuffle — only shuffle the first `count` positions
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(Math.random() * (indices.length - i));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  return indices.slice(0, count).map((idx) => ({
    aiText: typedDataset[idx].text,
    humanText: typedDataset[idx].use,
  }));
}

/**
 * Convert few-shot samples into Mercury chat message format.
 * Each pair becomes a user message (AI text) and assistant message (human text),
 * teaching the model the transformation by example.
 */
export function buildFewShotMessages(samples: FewShotSample[]): MercuryMessage[] {
  const messages: MercuryMessage[] = [];

  for (const sample of samples) {
    messages.push({
      role: "user",
      content: sample.aiText,
    });
    messages.push({
      role: "assistant",
      content: sample.humanText,
    });
  }

  return messages;
}
