/**
 * Humanizer module — barrel export.
 *
 * Server-side: import pipeline functions and dataset utilities.
 * Client-side: import types only via @/lib/types.
 */

export {
  buildHumanizePayload,
  buildHumanizeOnePayload,
  parseAlternatives,
  parseSingleAlternative,
} from "./pipeline";

export { sampleFewShot, buildFewShotMessages } from "./dataset";

export type { FewShotSample, HumanizePayload } from "./types";
