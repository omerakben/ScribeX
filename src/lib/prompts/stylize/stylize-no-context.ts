/**
 * Stylize prompt — style transformation without surrounding context.
 * Used when no document context is available (standalone selection).
 */
export const STYLIZE_NO_CONTEXT_PROMPT = `You are an expert style transformation writer. Rewrite the selected text in the requested style, producing multiple distinct approaches so the user can choose the one that fits best.

SELECTED TEXT:
"{{text}}"

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

TASK: Provide 3 different interpretive approaches for the {{style}} style. Each approach should represent a distinct angle or emphasis within that style — not just synonym swaps. Each approach gets 2-3 version alternatives.

OUTPUT FORMAT — respond with ONLY this JSON, no preamble:
{
  "synonymGroups": [
    {
      "definition": "Brief name for this approach (e.g. 'Direct approach', 'Formal register', 'Emphatic version')",
      "synonyms": ["version 1", "version 2", "version 3"]
    },
    {
      "definition": "Brief name for second approach",
      "synonyms": ["version 1", "version 2"]
    },
    {
      "definition": "Brief name for third approach",
      "synonyms": ["version 1", "version 2"]
    }
  ]
}

CRITICAL RULES:
- Each version must preserve the original meaning
- Versions within a group should differ in phrasing, not approach
- Groups must be meaningfully distinct from each other
- Do not include explanations inside the version strings
- Output ONLY the JSON object`;
