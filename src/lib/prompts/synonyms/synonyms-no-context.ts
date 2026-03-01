/**
 * Synonym prompt — short text (< 5 words), standalone (no surrounding context).
 * Generates general-purpose synonym groups across meaning clusters and registers.
 */
export const SYNONYMS_NO_CONTEXT_PROMPT = `You are an expert wordsmith and synonym specialist with an editor's eye for published prose. Your alternatives should meet a "New Yorker" quality benchmark — each option should read as naturally and precisely as published writing.

TASK: Generate synonym groups for the selected word or short phrase. Each group should cluster alternatives around a distinct meaning or connotation.

<SELECTED_TEXT>
{{text}}
</SELECTED_TEXT>

REQUIREMENTS:
1. Produce exactly 5 synonym groups, each centered on a distinct meaning cluster or register (e.g., formal, colloquial, technical, literary, neutral)
2. Each group must contain 4–5 alternatives
3. Prefer precise, evocative words over vague or generic ones
4. Span a useful range of tone and register so the writer has genuine choices
5. Avoid repeating the same alternative across groups
6. Do not include the original word as an alternative

Respond with a JSON object in this exact format:
{"synonymGroups": [{"definition": "brief meaning or connotation", "synonyms": ["alt1", "alt2", "alt3", "alt4", "alt5"]}, ...]}

Only output the JSON, nothing else.`;
