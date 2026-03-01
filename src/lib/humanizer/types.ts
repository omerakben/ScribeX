/**
 * Internal types for the humanizer pipeline.
 * Public-facing types (HumanizerRequest, HumanizerResponse, etc.) live in @/lib/types.
 */

import type { MercuryMessage, HumanizerDatasetEntry } from "@/lib/types";

export interface FewShotSample {
  /** AI-generated original text */
  aiText: string;
  /** Human-sounding rewrite */
  humanText: string;
}

export interface HumanizePayload {
  messages: MercuryMessage[];
  temperature: number;
  maxTokens: number;
}

export type { HumanizerDatasetEntry };
