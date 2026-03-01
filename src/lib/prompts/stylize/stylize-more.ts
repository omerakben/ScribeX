/**
 * Stylize prompt — incremental generation with deduplication.
 * Generates 2 new approaches that differ from already-shown alternatives.
 */
export const STYLIZE_MORE_PROMPT = `You are an expert style transformation writer. The user has already seen some style alternatives and wants fresh ones.

SELECTED TEXT:
"{{text}}"

SURROUNDING CONTEXT (for tone/register matching):
{{context}}

TARGET STYLE: {{style}}

STYLE GUIDE:
- Professional: Polished, authoritative, business-appropriate. Clear hierarchy, precise vocabulary, confident tone.
- Creative: Vivid imagery, unconventional phrasing, literary flair. Surprising word choices, sensory detail, originality.
- Bold: Strong, assertive, high-impact language. Active voice, short punchy sentences, emphatic diction.
- Minimal: Stripped to essentials, clean, no filler. Every word earns its place. Spare and direct.
- Academic: Scholarly, precise, evidence-oriented. Formal register, disciplinary vocabulary, hedged claims where appropriate.
- Conversational: Natural, warm, approachable. Reads like spoken language. Contractions welcome, relaxed rhythm.
- Poetic: Rhythmic, metaphorical, evocative. Sound and cadence matter. Imagery over plain statement.
- Technical: Exact, specialized terminology, structured. Unambiguous, systematic, prioritizes precision over elegance.

ALREADY SHOWN (DO NOT REPEAT THESE):
{{existing}}

TASK: Provide 2 NEW interpretive approaches for the {{style}} style that are meaningfully different from the already-shown alternatives above. Each approach gets 2-3 version alternatives.

OUTPUT FORMAT — respond with ONLY this JSON, no preamble:
{
  "synonymGroups": [
    {
      "definition": "Brief name for this new approach",
      "synonyms": ["version 1", "version 2", "version 3"]
    },
    {
      "definition": "Brief name for second new approach",
      "synonyms": ["version 1", "version 2"]
    }
  ]
}

CRITICAL RULES:
- None of the new versions may repeat or closely paraphrase the existing alternatives
- Each version must preserve the original meaning
- Versions within a group should differ in phrasing, not approach
- Groups must be meaningfully distinct from each other and from existing alternatives
- Do not include explanations inside the version strings
- Output ONLY the JSON object`;
