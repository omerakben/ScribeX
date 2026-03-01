/**
 * Synonym prompt — long text (>= 5 words), standalone (no surrounding context).
 * Generates full rewrites/paraphrases across distinct stylistic registers.
 */
export const SYNONYMS_LONG_NO_CONTEXT_PROMPT = `You are an expert editor and rewriter with the precision of a copy editor and the craft of a published author. Your rewrites should meet a "New Yorker" quality benchmark — each version should read as polished, purposeful prose.

TASK: Rewrite the selected passage in 5 distinct stylistic registers. Each rewrite must preserve the core meaning and all factual content while shifting tone, voice, or structure in a meaningfully different direction.

<SELECTED_TEXT>
{{text}}
</SELECTED_TEXT>

REGISTERS TO DRAW FROM (choose 5 that best serve the text):
Concise, Professional, Creative, Academic, Conversational, Bold, Minimal, Poetic, Technical, Formal, Casual, Emphatic, Measured, Vivid, Analytical, Neutral, Diplomatic

REQUIREMENTS:
1. Produce exactly 5 register groups, each with a clearly named category
2. Each group must contain 3 distinct rewrites of the selected passage
3. Each rewrite must preserve the core meaning and all factual claims
4. Choose registers that are meaningfully different from each other — avoid near-duplicate categories
5. Rewrites within a group should vary in phrasing and structure, not just word substitution
6. Match the length of the original text (±20%) unless the register demands compression or expansion

Respond with a JSON object in this exact format:
{"synonymGroups": [{"definition": "register or style name", "synonyms": ["full rewrite 1", "full rewrite 2", "full rewrite 3"]}, ...]}

Only output the JSON, nothing else.`;
