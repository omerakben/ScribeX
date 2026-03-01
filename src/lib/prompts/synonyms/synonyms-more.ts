/**
 * Synonym prompt — "more" variant with deduplication.
 * Generates additional alternatives that are meaningfully different from existing ones.
 * Works for both short (word/phrase) and long (passage) text.
 */
export const SYNONYMS_MORE_PROMPT = `You are an expert wordsmith and editor. Generate fresh alternatives for the selected text that are meaningfully different from what has already been shown to the user.

TASK: Generate additional synonym groups or rewrite categories for the selected text. You MUST NOT repeat or closely paraphrase any alternative already in the existing list.

<SELECTED_TEXT>
{{text}}
</SELECTED_TEXT>

<SURROUNDING_CONTEXT>
{{context}}
</SURROUNDING_CONTEXT>

<ALREADY_SHOWN>
{{existing}}
</ALREADY_SHOWN>

REQUIREMENTS:
1. Produce 2–3 new groups of alternatives
2. For short text (words/phrases): each group should have 3–4 alternatives; cluster by meaning or register
3. For long text (passages): each group should have 2–3 full rewrites; name the register or style
4. Every alternative must be genuinely different from all entries in ALREADY_SHOWN — different connotations, different register, different stylistic approach
5. Explore dimensions not yet covered: shift register (formal → colloquial), shift perspective (active → passive), shift structure (clause order), or surface a different semantic facet
6. Meet the same "New Yorker" quality benchmark: precise, natural, publishable prose

Respond with a JSON object in this exact format:
{"synonymGroups": [{"definition": "meaning, register, or style", "synonyms": ["alt1", "alt2", "alt3"]}, ...]}

Only output the JSON, nothing else.`;
