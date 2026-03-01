/**
 * Humanizer Pipeline — server-side orchestration.
 *
 * Assembles few-shot examples from the dataset, builds the Mercury API
 * payload with the appropriate prompt, and returns humanized alternatives.
 *
 * This module is server-only — it imports the dataset and calls Mercury directly.
 */

import type { MercuryMessage } from "@/lib/types";
import type { HumanizePayload } from "./types";
import { sampleFewShot, buildFewShotMessages } from "./dataset";
import { interpolate } from "@/lib/prompts/loader";
import { HUMANIZE_PROMPT } from "@/lib/prompts/humanize/humanize";
import { HUMANIZE_NO_CONTEXT_PROMPT } from "@/lib/prompts/humanize/humanize-no-context";
import { HUMANIZE_ONE_PROMPT } from "@/lib/prompts/humanize/humanize-one";

/** Number of few-shot examples to include in each request */
const FEW_SHOT_COUNT = 5;

/** Base temperature for humanization (high for creative output) */
const BASE_TEMPERATURE = 0.9;

/** Temperature ramp per "more" request to increase diversity */
const TEMPERATURE_RAMP = 0.15;

/** Maximum temperature cap */
const MAX_TEMPERATURE = 1.5;

/**
 * Build the payload for batch humanization (generate N alternatives).
 */
export function buildHumanizePayload(
  text: string,
  options: {
    context?: string;
    count?: number;
    temperature?: number;
  } = {}
): HumanizePayload {
  const count = options.count ?? 4;
  const temperature = Math.min(options.temperature ?? BASE_TEMPERATURE, MAX_TEMPERATURE);

  // Select the appropriate prompt template
  const promptTemplate = options.context
    ? HUMANIZE_PROMPT
    : HUMANIZE_NO_CONTEXT_PROMPT;

  // Interpolate variables into the prompt
  const systemPrompt = interpolate(promptTemplate, {
    text,
    context: options.context ?? "",
    count: String(count),
  });

  // Build few-shot examples
  const fewShotSamples = sampleFewShot(FEW_SHOT_COUNT);
  const fewShotMessages = buildFewShotMessages(fewShotSamples);

  // Assemble the full message array:
  // system → few-shot pairs → user prompt
  const messages: MercuryMessage[] = [
    { role: "system", content: systemPrompt },
    ...fewShotMessages,
    {
      role: "user",
      content: `Rewrite this text to sound more natural and human-like. Provide exactly ${count} alternatives as JSON.\n\nText: "${text}"`,
    },
  ];

  return {
    messages,
    temperature,
    maxTokens: 4096,
  };
}

/**
 * Build the payload for single incremental humanization ("generate one more").
 */
export function buildHumanizeOnePayload(
  text: string,
  existing: string[],
  options: {
    temperature?: number;
  } = {}
): HumanizePayload {
  // Ramp temperature based on how many alternatives already exist
  const rampedTemp = BASE_TEMPERATURE + existing.length * TEMPERATURE_RAMP;
  const temperature = Math.min(
    options.temperature ?? rampedTemp,
    MAX_TEMPERATURE
  );

  // Format existing alternatives as a bulleted list
  const existingList = existing.map((alt) => `- ${alt}`).join("\n");

  // Interpolate the prompt
  const systemPrompt = interpolate(HUMANIZE_ONE_PROMPT, {
    text,
    existing: existingList,
  });

  // Build few-shot examples (fewer for single generation)
  const fewShotSamples = sampleFewShot(3);
  const fewShotMessages = buildFewShotMessages(fewShotSamples);

  const messages: MercuryMessage[] = [
    { role: "system", content: systemPrompt },
    ...fewShotMessages,
    {
      role: "user",
      content: `Rewrite this text to sound more natural. Provide ONE alternative different from the existing ones.\n\nText: "${text}"`,
    },
  ];

  return {
    messages,
    temperature,
    maxTokens: 2048,
  };
}

/**
 * Extract alternatives from the Mercury API response content.
 * Handles JSON parsing with fallback extraction.
 */
export function parseAlternatives(content: string): string[] {
  // Try direct JSON parse
  try {
    const parsed = JSON.parse(content);
    if (parsed.alternatives && Array.isArray(parsed.alternatives)) {
      return parsed.alternatives;
    }
  } catch {
    // Fall through to regex extraction
  }

  // Try extracting JSON from markdown code block
  const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1]);
      if (parsed.alternatives && Array.isArray(parsed.alternatives)) {
        return parsed.alternatives;
      }
    } catch {
      // Fall through
    }
  }

  // Try to find a JSON object with alternatives key
  const altMatch = content.match(/\{[^{}]*"alternatives"\s*:\s*\[[^\]]*\][^{}]*\}/);
  if (altMatch) {
    try {
      const parsed = JSON.parse(altMatch[0]);
      if (parsed.alternatives && Array.isArray(parsed.alternatives)) {
        return parsed.alternatives;
      }
    } catch {
      // Fall through
    }
  }

  // Last resort: extract quoted strings from an array
  const arrayMatch = content.match(/\[\s*"([^"]+)"(?:\s*,\s*"([^"]+)")*\s*\]/);
  if (arrayMatch) {
    const allQuoted = content.match(/"([^"]{10,})"/g);
    if (allQuoted) {
      return allQuoted.map((q) => q.slice(1, -1));
    }
  }

  return [];
}

/**
 * Extract a single alternative from the Mercury API response content.
 */
export function parseSingleAlternative(content: string): string {
  // The response should be just the alternative text, possibly with quotes
  return content.replace(/^["'\s]+|["'\s]+$/g, "").trim();
}
