# ScribeX Product Improvement Roadmap

> Derived from 10-agent deep analysis of AI Canvas (`AI_CANVAS_Example/AI-Canvas/`)
> Goal: Port battle-tested patterns into ScribeX's Next.js 16 + TipTap + Zustand stack
> Philosophy: Simplicity is beauty. Less friction. UI/UX matters. Prompt engineering is the product.

---

## Phase 0: Foundation — Prompt Architecture & Context Intelligence ✅ COMPLETE (2026-02-28)

> Before building features, upgrade the prompt system that powers everything.
> AI Canvas uses 27 externalized prompt files with sophisticated routing — ScribeX currently embeds all prompts as string constants.
>
> **Completed**: 7-agent swarm (3x Opus 4.6, 4x Sonnet 4.6). 22 files created/modified. 0 type errors, 0 lint errors.

### 0.1 Prompt Externalization System ✅ (2026-02-28)

- [x] Create `src/lib/prompts/` directory structure mirroring AI Canvas's `prompts/` layout
- [x] Build a prompt loader utility with `{{variable}}` interpolation (template literals → runtime substitution)
- [x] Migrate `ACADEMIC_SYSTEM_PROMPT` from `src/lib/constants/index.ts` into external file
- [x] Migrate all 13 `SLASH_COMMANDS` system prompts to individual files
- [x] Add prompt versioning so prompts can be A/B tested without redeployment

**AI Canvas Reference:**

- `prompts/` directory — 27 `.txt` files organized by action domain
- `prompts/assistant/chat-assistant.txt` — System prompt with change-block protocol + document source-of-truth declaration
- `prompts/fix/fix.txt` — Copy editor role, temperature 0.2 (surgical precision)
- `prompts/synonyms/synonyms.txt` — "New Yorker" quality benchmark
- `prompts/document/generate_name.txt` — Auto-title with JSON output schema

**ScribeX Target:** `src/lib/prompts/` — new directory
**ScribeX Impact:** `src/lib/constants/index.ts`, `src/lib/mercury/client.ts`

---

### 0.2 Context-Aware Prompt Routing (2x2 Matrix) ✅ (2026-02-28)

- [x] Implement short/long text detection threshold (AI Canvas uses character count heuristics)
- [x] Implement context/no-context detection (is surrounding document text available?)
- [x] Build 2x2 router: `routePrompt(action, textLength, hasContext)` → selects best prompt variant
- [ ] Create context vs no-context variants for each writing action (rewrite, synonyms, stylize, humanize) — *router built; per-action variants deferred to Phase 4*

**AI Canvas Reference:**

- `prompts/synonyms/synonyms.txt` vs `synonyms-no-context.txt` — with/without surrounding text
- `prompts/synonyms/synonyms-long.txt` vs `synonyms-long-no-context.txt` — long text variants
- `prompts/stylize/stylize.txt` vs `stylize-no-context.txt` — same 2x2 pattern
- `prompts/humanize/humanize.txt` vs `humanize-no-context.txt`
- `js/modules/ai/AIAssistant.js` — frontend routing logic

**ScribeX Target:** `src/lib/prompts/router.ts` — new file
**ScribeX Impact:** `src/lib/mercury/client.ts` (`routeToModel()` gains prompt routing)

---

### 0.3 Selection Disambiguation ✅ (2026-02-28)

- [x] Implement `<<<SELECTED>>>text<<<END_SELECTED>>>` inline marker system
- [x] When user selects text that appears multiple times in document, wrap selection in markers before sending to AI
- [x] Ensures AI modifies only the selected occurrence, not all instances

**AI Canvas Reference:**

- `docs/selection-disambiguation-brainstorm.md` — 15 solutions ranked by impact (Feb 2026)
- Recommended approach: inline markers (same pattern used by VS Code Copilot, Cursor, Aider)
- Problem documented but not fully solved in AI Canvas — opportunity for ScribeX to leapfrog

**ScribeX Target:** `src/lib/utils/selection-markers.ts` — new utility
**ScribeX Impact:** All writing modes in `src/components/editor/writing-mode-bar.tsx`

---

### 0.4 Context Truncation with Selection Centering ✅ (2026-02-28)

- [x] When document exceeds token limit, center the context window around the user's selection
- [x] More relevant than head/tail truncation (current approach)
- [x] Use `MAX_EDITOR_CONTEXT_TOKENS` (128K) as the budget, center selection within it
- [x] Dynamic token cap for short inputs: `max(64, wordCount * 10)`

**AI Canvas Reference:**

- `api/chat_service.php` — context truncation logic with selection centering
- `js/modules/ai/AIAssistant.js` — dynamic token cap formula
- `api/model_config.php` — per-model token limits

**ScribeX Target:** `src/lib/utils/context-window.ts` — new utility
**ScribeX Impact:** `src/lib/mercury/client.ts` (all API calls that send document context)

---

### 0.5 Document Source-of-Truth in Chat ✅ (2026-02-28)

- [x] Add to chat system prompt: "NEVER assume your previous change suggestions were accepted"
- [x] Always re-send current document state with every chat request
- [x] Prevents AI from hallucinating about document state after multiple rounds

**AI Canvas Reference:**

- `prompts/assistant/chat-assistant.txt` — explicit source-of-truth declaration
- This is a single-line prompt addition but profoundly impacts chat reliability

**ScribeX Target:** `src/lib/prompts/assistant/chat.txt` (after 0.1)
**ScribeX Impact:** `src/components/editor/ai-panel.tsx`

---

## Phase 1: Floating Menu — Selection-Triggered AI Actions ✅ COMPLETE (2026-02-28)

> **STATUS: COMPLETE** — Commit `49401d4`. 8-agent swarm (2x Opus 4.6, 6x Sonnet 4.6). 9 files created/modified. 0 type errors, 0 lint errors.

> The signature interaction pattern from AI Canvas. User selects text → floating menu appears with contextual AI actions. Two tiers: quick actions (gooey buttons) and detailed configuration (ribbon panel).

### 1.1 Selection Detection Engine

- [x] Build ProseMirror plugin that detects text selection in TipTap editor
- [x] 300ms debounce on selection changes (prevents flickering on drag-select)
- [x] Calculate selection position relative to viewport for menu placement
- [x] Implement viewport edge flip logic (menu flips direction near edges)
- [x] Dismiss on mousedown outside menu, Escape key, or new empty selection

**AI Canvas Reference:**

- `js/modules/ui/FloatingMenu.js` — `handleSelectionChange()` with debounce, `positionMenu()` with flip logic
- `css/modules/floating-menu.css` — z-index 1000, positioned absolutely, flip classes
- `css/modules/variables.css` — z-index scale (500-2000)

**ScribeX Target:** `src/lib/extensions/floating-menu.ts` — new TipTap extension
**ScribeX Impact:** `src/components/editor/editor-canvas.tsx`

---

### 1.2 Floating Action Buttons (Tier 1)

- [x] Design 4 primary action buttons that fan out from a sparkle trigger icon
- [x] Semantic color coding: green = AI actions (rewrite/fix), amber = stylize/humanize, teal = detection
- [x] Consider gooey SVG filter effect: `feGaussianBlur(stdDeviation=8)` + `feColorMatrix` for liquid merge visual
- [x] Alternatively, simpler framer-motion spring animation (evaluate which fits ScribeX's design)
- [x] Actions: Rewrite, Stylize, Humanize, Detect AI

**AI Canvas Reference:**

- `index.html` — SVG goo filter definition (`<filter id="goo">`)
- `css/modules/floating-menu.css` — `.gooey-cluster`, fan-out transform, scan animation
- `js/modules/ui/FloatingMenu.js` — button creation, mode switching, tooltip rendering
- `docs/ideation/floating-menu/v025.html` — canonical prototype (latest of 27 iterations)
- `docs/ideation/floating-menu/INTEGRATION.md` — integration task map

**ScribeX Target:** `src/components/editor/floating-menu.tsx` — new component
**ScribeX Impact:** `src/app/globals.css` (goo filter SVG, animation keyframes)

---

### 1.3 Ribbon Panel (Tier 2 — Configuration)

- [x] When a tier-1 button is clicked, expand a configuration ribbon below/beside it
- [x] Ribbon shows action-specific options: tone selector, style chips, generation count
- [x] For Synonyms/Rewrite: show numbered alternatives as clickable chips
- [x] For Stylize: show 8 style chips (Professional, Creative, Bold, Minimal, Academic, Conversational, Poetic, Technical)
- [x] For Humanize: show "Generate" button with count selector

**AI Canvas Reference:**

- `js/modules/ui/FloatingMenu.js` — `showSynonymRibbon()`, `showStylizeRibbon()`, chip generation
- `css/modules/floating-menu.css` — `.floating-ribbon`, max-height animation, chip hover states
- `css/modules/floating-menu-stylize.css` — amber/orange theme for stylize mode
- `prompts/stylize/stylize.txt` — 8 style categories defined in prompt

**ScribeX Target:** `src/components/editor/floating-ribbon.tsx` — new component
**ScribeX Impact:** Integrates with floating-menu.tsx

---

### 1.4 Apply/Decline Change Protocol

- [x] Parse AI responses for `\`\`\`change\nfind: ...\nreplace: ...\n\`\`\`` blocks
- [x] Render visual diff cards showing before → after for each change
- [x] Apply button: replace text in TipTap editor at the exact location
- [x] Decline button: dismiss the change, keep original text
- [x] Prevents silent overwrites — user always in control of every change

**AI Canvas Reference:**

- `js/modules/ui/ChangeBlockParser.js` — regex parser, card DOM builder, apply/decline handlers
- `prompts/assistant/chat-assistant.txt` — instructs AI to use `\`\`\`change` format
- `css/modules/chat-panel.css` — `.change-block-card`, diff styling, apply/decline buttons

**ScribeX Target:** `src/lib/utils/change-block-parser.ts` — new utility
**ScribeX Component:** `src/components/editor/change-diff-card.tsx` — new component
**ScribeX Impact:** `src/components/editor/ai-panel.tsx` (chat response rendering)

---

## Phase 2: Humanizer — The Killer Feature ✅ COMPLETE (2026-03-01)

> **STATUS: COMPLETE** — 4-agent swarm (3x Opus 4.6, 1x Sonnet 4.6). 12 files created, 4 modified. 0 type errors, 0 lint errors, build passes.

> AI Canvas's most sophisticated feature. A multi-stage pipeline that transforms AI-generated text into human-sounding prose using few-shot learning, parallel diversity, and AI detection scoring.

### 2.1 Humanizer Dataset & Few-Shot Pipeline ✅ (2026-03-01)

- [x] Curate an academic-domain humanizer dataset (before/after pairs of AI text → human-rewritten text)
- [x] Study `humanizer008.json` structure — 456 examples, 8th curation iteration
- [x] Build few-shot sampler: randomly select 5 examples per request using Fisher-Yates partial shuffle
- [x] Each example becomes a user/assistant turn: `user: "AI text"` → `assistant: "human text"`
- [x] This teaches the model the transformation pattern through demonstration, not instruction

**AI Canvas Reference:**

- `data/humanizer008.json` — the curated dataset (8th iteration, 456 before/after pairs)
- `api/humanizer/gemini001.php` — few-shot pipeline: load dataset → random sample → build chat history → Gemini API
- `docs/python-code-examples/gemini-001.py` — Python prototype of the pipeline
- `docs/python-code-examples/GPT-01.py` — original GPT-based humanizer (earlier approach)

**ScribeX Target:** `src/lib/humanizer/` — new module directory
**Key Files:**

- `src/lib/humanizer/dataset.ts` — dataset loader and sampler
- `src/lib/humanizer/pipeline.ts` — few-shot request builder
- `src/data/humanizer-dataset.json` — curated training pairs (456 entries, server-side only)

---

### 2.2 Temperature & Diversity Strategy ✅ (2026-03-01)

- [x] Use high temperature (base 0.9) for creative variation in humanization
- [x] Few-shot diversity: each request gets 5 randomly-sampled dataset pairs as context
- [x] Each request produces genuinely different output due to different few-shot context
- [x] Temperature ramping for "more" requests: +0.15 per additional variant (capped at 1.5)
- [x] This creates real diversity, not just rephrasing

**AI Canvas Reference:**

- `api/humanizer/gemini001.php` — temperature 1.4, parallel request pattern
- `js/modules/ui/InlineSuggestions.js` — temperature ramping: `baseTemp + (variantIndex * 0.15)`
- `prompts/humanize/humanize.txt` — dynamic `{{count}}` for batch sizing
- `prompts/humanize/humanize-one.txt` — minimal "one more" prompt (no persona, plain text, fast)

**ScribeX Target:** `src/lib/humanizer/pipeline.ts`
**ScribeX Impact:** `src/lib/mercury/client.ts` (new `humanizeText()` and `humanizeOneMore()` methods)

---

### 2.3 Three-Tier Humanize UX Pattern ✅ (2026-03-01)

- [x] **Tier 1 — Initial batch**: Generate 4 humanized alternatives simultaneously
- [x] **Tier 2 — "More" button**: Generate 1 additional alternative incrementally
- [x] **Tier 3 — Deduplication**: Pass `{{existing}}` list to prompt so AI never repeats previous outputs
- [x] Use minimal prompt for "More" (no persona, plain text return) for speed
- [ ] "Past last = generate more" — scrolling past the last alternative triggers generation of another — *deferred, manual "Generate More" button used instead*

**AI Canvas Reference:**

- `prompts/humanize/humanize.txt` — batch generation with `{{count}}` placeholder
- `prompts/humanize/humanize-one.txt` — minimal incremental prompt
- `prompts/synonyms/synonyms-more.txt` — `{{existing}}` deduplication pattern
- `js/modules/ui/HumanizerMenu.js` — UI for alternatives list, generate-more button

**ScribeX Target:** `src/components/editor/humanizer-panel.tsx` — new component
**ScribeX Impact:** `src/components/editor/floating-ribbon.tsx` (humanize mode now renders HumanizerPanel)

---

### 2.4 AI Detection Integration ✅ (2026-03-01)

- [x] Research AI detection APIs (AI Canvas uses Pangram API with `x-api-key` auth)
- [x] Build API route: `POST /api/detect` — heuristic-based mock (TODO: swap for real provider)
- [x] Return score as percentage with sentence-level classification
- [x] Color-coded score badge: green (< 30% AI), amber (30-60%), red (> 60%)
- [x] Display in floating ribbon's detect mode panel
- [x] Shimmer/pulse animation while detection runs

**AI Canvas Reference:**

- `api/pangram.php` — Pangram API proxy with `x-api-key` authentication
- `js/modules/ui/AIDetectorPanel.js` — score display, chunk cards, report modal, history
- `css/modules/ai-detector.css` — score badge colors, liquid fill scan animation
- `js/modules/ui/FloatingMenu.js` — detection trigger from floating menu

**ScribeX Target:**

- `src/app/api/detect/route.ts` — new API route (heuristic-based, TODO for Pangram/GPTZero)
- `src/components/editor/ai-detection-badge.tsx` — self-contained badge with sentence breakdown
- `src/lib/detection/heuristics.ts` — text analysis (TTR, passive voice, burstiness, transitions)
- `src/lib/detection/client.ts` — thin `detectAI()` fetch wrapper

---

## Phase 3: Enhanced Ghost Text & Inline Suggestions

> ScribeX already has ghost-text (`src/lib/extensions/ghost-text.ts`). AI Canvas adds word-by-word acceptance, multi-alternative caching, and keyboard cycling — significant UX upgrades.

### 3.1 Word-by-Word Tab Acceptance

- [ ] Current ScribeX ghost text: Tab accepts entire suggestion at once
- [ ] Upgrade to word-by-word: each Tab press accepts the next word
- [ ] Ctrl+Enter (or Cmd+Enter) accepts the full remaining suggestion
- [ ] Visual: accepted words transition from ghost to solid text, remaining stays ghost

**AI Canvas Reference:**

- `js/modules/ui/InlineSuggestions.js` — `acceptNextWord()`, word splitting, progressive acceptance
- Tab = next word, Ctrl+Enter = accept all, Escape = dismiss

**ScribeX Target:** `src/lib/extensions/ghost-text.ts` — modify existing
**ScribeX Impact:** Keyboard shortcut registration in editor

---

### 3.2 Multi-Alternative Cache with Cycling

- [ ] Cache up to 5 alternative completions per cursor position
- [ ] Arrow Up/Down cycles through cached alternatives (ghost text updates in place)
- [ ] Temperature ramping: each variant generated at `baseTemp + (index * 0.15)`
- [ ] Pre-fetch alternatives in background after first suggestion appears
- [ ] Smart deduplication against existing text (don't suggest what's already there)

**AI Canvas Reference:**

- `js/modules/ui/InlineSuggestions.js` — `alternatives[]` cache, `cycleAlternative(direction)`, temperature ramping
- `js/modules/core/utils.js` — `simpleHash()` (djb2) for dedup comparison

**ScribeX Target:** `src/lib/extensions/ghost-text.ts` — modify existing
**ScribeX Impact:** `src/lib/mercury/client.ts` (`fimCompletion()` gains alternative generation)

---

### 3.3 Smart Spacing & Continuation

- [ ] Detect if cursor is mid-sentence, end-of-sentence, or end-of-paragraph
- [ ] Adjust suggestion spacing accordingly (no double spaces, proper paragraph breaks)
- [ ] "Continue from cursor" mode: detect incomplete sentences and complete them naturally

**AI Canvas Reference:**

- `js/modules/ui/InlineSuggestions.js` — spacing normalization on acceptance
- `prompts/assistant/continue.txt` — cursor-aware continuation with sentence-fragment examples

**ScribeX Target:** `src/lib/extensions/ghost-text.ts` — modify existing
**ScribeX Impact:** `src/lib/prompts/assistant/continue.txt` (new prompt file after Phase 0)

---

## Phase 4: Writing Tools — Synonyms, Stylize, Rewrite, Fix

> AI Canvas has a complete writing tool suite with quality benchmarks, style catalogs, and "load more" with deduplication. ScribeX can offer these through the floating menu and slash commands.

### 4.1 Synonym/Alternative Generator

- [ ] Short text (< threshold): Generate numbered synonym list (5-10 alternatives)
- [ ] Long text (> threshold): Generate full rewrites with 17-category style menu
- [ ] "New Yorker" quality benchmark in prompt: alternatives should read like published prose
- [ ] "More" button with `{{existing}}` deduplication — never repeats previous suggestions
- [ ] Context-aware: include surrounding paragraph when available for better semantic fit

**AI Canvas Reference:**

- `prompts/synonyms/synonyms.txt` — "New Yorker" benchmark, numbered format, context boundary
- `prompts/synonyms/synonyms-long.txt` — 17 rewrite categories (Formal, Casual, Concise, etc.)
- `prompts/synonyms/synonyms-more.txt` — `{{existing}}` deduplication pattern
- `prompts/synonyms/synonyms-no-context.txt` — no-context variant
- `js/modules/ui/FloatingMenu.js` — `showSynonymRibbon()`, chip rendering

**ScribeX Target:** `src/lib/prompts/synonyms/` — new prompt directory (4 variants)
**ScribeX Component:** Integrated into `floating-ribbon.tsx` from Phase 1.3

---

### 4.2 Style Transformation Engine

- [ ] 8 built-in styles: Professional, Creative, Bold, Minimal, Academic, Conversational, Poetic, Technical
- [ ] User selects style chip → text is rewritten in that style
- [ ] "More" with deduplication (same pattern as synonyms)
- [ ] Context vs no-context routing

**AI Canvas Reference:**

- `prompts/stylize/stylize.txt` — 8 style definitions, context-aware
- `prompts/stylize/stylize-no-context.txt` — standalone version
- `prompts/stylize/stylize-more.txt` — incremental with dedup
- `prompts/stylize/stylize-more-no-context.txt`
- `css/modules/floating-menu-stylize.css` — amber/orange semantic color for stylize mode

**ScribeX Target:** `src/lib/prompts/stylize/` — new prompt directory (4 variants)
**ScribeX Component:** Integrated into `floating-ribbon.tsx`

---

### 4.3 Grammar & Punctuation Fix

- [ ] "Copy editor" role in prompt — surgical precision, minimal changes
- [ ] Temperature 0.2 for deterministic fixes
- [ ] HTML-aware variant for formatted text (allowlisted tags, URL protocol denylist for XSS prevention)
- [ ] Preserve formatting, only fix grammar/spelling/punctuation

**AI Canvas Reference:**

- `prompts/fix/fix.txt` — copy editor persona, temperature 0.2
- `prompts/document/autoformat.txt` — full-document grammar fix (plain text)
- `prompts/document/autoformat-html.txt` — HTML-aware with XSS prevention (tag allowlist, `javascript:` protocol deny)

**ScribeX Target:** `src/lib/prompts/fix/` — new prompt directory
**ScribeX Impact:** Existing `quick-edit` writing mode in `src/lib/mercury/client.ts`

---

### 4.4 Tone Analysis

- [ ] Analyze selected text for tone, formality, sentiment
- [ ] Return structured JSON with scores/labels
- [ ] Display as a compact card in AI panel or floating ribbon
- [ ] Useful for academic writers checking if their tone is appropriate

**AI Canvas Reference:**

- `prompts/assistant/analyze_tone.txt` — JSON schema for tone/formality/sentiment analysis
- `js/modules/ai/AIAssistant.js` — `analyzeTone()` action

**ScribeX Target:** `src/lib/prompts/assistant/analyze-tone.txt` — new prompt file
**ScribeX Component:** `src/components/editor/tone-analysis-card.tsx` — new component

---

## Phase 5: Readability Analytics & Content Intelligence

> AI Canvas has a self-contained readability analyzer. Combined with ScribeX's academic focus, this becomes a powerful feature for researchers targeting specific journal readability levels.

### 5.1 Flesch Reading Ease Analyzer

- [ ] Port `ReadabilityAnalyzer.js` logic to TypeScript utility
- [ ] Flesch formula: `206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)`
- [ ] Heuristic syllable counter (regex-based, handles common English patterns)
- [ ] Color-coded thresholds: Easy (green) >= 80, Medium (yellow) >= 60, Hard (orange) >= 40, Complex (red) >= 0
- [ ] Display as persistent footer badge or toolbar indicator

**AI Canvas Reference:**

- `js/modules/core/ReadabilityAnalyzer.js` — complete implementation, self-contained, no DOM deps
- Color thresholds and display logic in same file

**ScribeX Target:** `src/lib/utils/readability.ts` — new utility (pure function, no React deps)
**ScribeX Component:** `src/components/editor/readability-badge.tsx` — new component
**ScribeX Impact:** `src/components/editor/editor-toolbar.tsx` (mount badge)

---

### 5.2 Document Statistics Dashboard

- [ ] Word count, sentence count, paragraph count, reading time estimate
- [ ] Average sentence length, longest sentence highlight
- [ ] Syllable complexity distribution
- [ ] Academic readability target ranges (journal-specific, if data available)

**AI Canvas Reference:**

- `js/modules/core/ReadabilityAnalyzer.js` — sentence/word/syllable counting utilities
- `js/modules/core/DocumentManager.js` — document metadata tracking

**ScribeX Target:** `src/components/editor/document-stats.tsx` — new component
**ScribeX Impact:** `src/components/editor/editor-toolbar.tsx` or sidebar integration

---

## Phase 6: Content Hash Autosave & Data Integrity

> AI Canvas's autosave uses content hashing to skip no-op saves. ScribeX has autosave but can benefit from the hash-guard pattern and improved save indicators.

### 6.1 Content Hash Guard (djb2)

- [ ] Implement djb2 hash function for content fingerprinting
- [ ] Before each autosave: compare hash of current content vs last saved hash
- [ ] Skip save if hash matches (no-op guard — prevents unnecessary writes)
- [ ] Reduces localStorage writes and save indicator noise

**AI Canvas Reference:**

- `js/modules/core/AutoSave.js` — hash comparison before save
- `js/modules/core/utils.js` — `simpleHash()` function (djb2 algorithm)
- `js/modules/core/DocumentManager.js` — hash tracking per document

**ScribeX Target:** `src/lib/utils/content-hash.ts` — new utility
**ScribeX Impact:** `src/lib/store/editor-store.ts` (`updatePaperContent` gains hash check)

---

### 6.2 AI-Powered Auto-Naming

- [ ] When document content exceeds 50 characters and has no user-set title, auto-generate title
- [ ] Use cheapest/fastest model for cost optimization (AI Canvas: `generate_name` always uses cheapest)
- [ ] JSON output schema: `{ "name": "3-5 word title" }`
- [ ] Only trigger once per document (not on every save)

**AI Canvas Reference:**

- `prompts/document/generate_name.txt` — 3-5 word title, JSON schema output
- `js/modules/core/DocumentManager.js` — auto-naming trigger (content > 50 chars)
- `api/model_config.php` — `generate_name` action always routes to cheapest model

**ScribeX Target:** `src/lib/prompts/document/generate-name.txt` — new prompt file
**ScribeX Impact:** `src/lib/store/editor-store.ts` (`createPaper` or `updatePaperContent` trigger)

---

## Phase 7: Prompt History & Chat Improvements

> Shell-like prompt history navigation and improved chat panel UX patterns from AI Canvas.

### 7.1 Prompt History with Arrow-Key Navigation

- [ ] Store recent chat prompts in Zustand store (persisted, deduplicated)
- [ ] Arrow Up in empty chat input → cycle through previous prompts
- [ ] Arrow Down → cycle forward, empty on past-end
- [ ] Deduplication: don't store consecutive identical prompts
- [ ] Limit to last 50 prompts

**AI Canvas Reference:**

- `js/modules/core/PromptHistoryManager.js` — dedup, up/down navigation, cursor tracking
- `api/prompt_history.php` — server-side prompt string storage
- `js/modules/ui/ChatPanel.js` — keyboard event integration

**ScribeX Target:** `src/lib/store/editor-store.ts` (add `promptHistory` to persisted state)
**ScribeX Component:** `src/components/editor/ai-panel.tsx` (keyboard handler in chat input)

---

### 7.2 Custom User Instructions (Free-Form)

- [ ] Add "Custom" action to floating menu: user types arbitrary instruction
- [ ] Prompt template wraps user instruction with context and safety guardrails
- [ ] Context vs no-context variants

**AI Canvas Reference:**

- `prompts/custom/custom.txt` — user instruction with full document context
- `prompts/custom/custom-no-context.txt` — user instruction without context

**ScribeX Target:** `src/lib/prompts/custom/` — new prompt directory
**ScribeX Impact:** Floating menu (Phase 1) gets "Custom" action button

---

## Phase 8: Temperature Engineering & Model Optimization

> AI Canvas hardcodes temperature per action type — a crucial pattern that ScribeX should adopt. Different tasks need different levels of creativity vs precision.

### 8.1 Per-Action Temperature Map

- [ ] Define temperature constants per writing action:
  - `fix` = 0.2 (surgical precision)
  - `rewrite` = 0.5 (moderate variation)
  - `generate_name` = 0.7 (creative titles)
  - `humanize` = 0.9-1.4 (high creativity)
  - `synonyms` = 0.8 (diverse alternatives)
  - `stylize` = 0.7 (style-appropriate variation)
  - `compose` = 0.7 (balanced generation)
  - `chat` = 0.6 (helpful but grounded)
- [ ] Override Mercury client's default temperature based on action type

**AI Canvas Reference:**

- `api/model_config.php` — `clamp_model_temperature()`, per-model min/max
- `js/modules/ai/AIAssistant.js` — hardcoded temperature per action throughout
- `prompts/fix/fix.txt` — temperature 0.2 specified in prompt metadata

**ScribeX Target:** `src/lib/constants/temperatures.ts` — new file
**ScribeX Impact:** `src/lib/mercury/client.ts` (all API call methods)

---

### 8.2 Dynamic Token Caps

- [ ] For short inputs, cap output tokens proportionally: `max(64, wordCount * 10)`
- [ ] Prevents wasted tokens on single-word synonym requests
- [ ] Saves API cost and improves response speed for quick actions

**AI Canvas Reference:**

- `js/modules/ai/AIAssistant.js` — dynamic `max_tokens` calculation
- `api/model_config.php` — per-model token limits

**ScribeX Target:** `src/lib/mercury/client.ts` — modify `max_tokens` logic
**ScribeX Impact:** All Mercury API calls

---

## Phase 9: UI/UX Polish — Friction-Free Patterns

> Patterns observed across AI Canvas that reduce friction and improve the writing experience.

### 9.1 Keyboard Shortcuts System

- [ ] Document and implement comprehensive keyboard shortcuts:
  - `Cmd+Shift+R` — Rewrite selected text
  - `Cmd+Shift+H` — Humanize selected text
  - `Cmd+Shift+F` — Fix grammar
  - `Cmd+Shift+S` — Stylize
  - `Cmd+Shift+D` — Detect AI
  - `Tab` — Accept ghost text (word-by-word)
  - `Ctrl+Enter` — Accept full ghost text
  - `Escape` — Dismiss floating menu / ghost text
  - `Arrow Up/Down` — Cycle ghost text alternatives
- [ ] Display shortcuts in floating menu tooltips

**AI Canvas Reference:**

- `js/modules/ui/FloatingMenu.js` — keyboard shortcut handlers
- `js/modules/ui/InlineSuggestions.js` — Tab/Ctrl+Enter/Escape/Arrow handlers
- `README.md` — keyboard shortcuts documentation

**ScribeX Target:** `src/lib/extensions/keyboard-shortcuts.ts` — new TipTap extension
**ScribeX Impact:** `src/components/editor/editor-canvas.tsx`

---

### 9.2 Loading States & Action Feedback

- [ ] Scan animation on floating menu buttons while AI processes
- [ ] Subtle pulse on ghost text while generating alternatives
- [ ] Score badge animation during AI detection scan
- [ ] Toast notifications for completed actions with undo option

**AI Canvas Reference:**

- `css/modules/floating-menu.css` — `.scan-animation` keyframes
- `css/modules/ai-detector.css` — liquid fill scan effect
- `js/modules/ui/Toast.js` — minimal notification singleton

**ScribeX Target:** `src/app/globals.css` (keyframes), `src/components/editor/` (component-level states)

---

### 9.3 Dark Mode Foundation

- [ ] Evaluate dark mode implementation approach for ScribeX
- [ ] AI Canvas uses semantic CSS variable overrides via `body.dark-mode` class
- [ ] ScribeX's oklch color system in Tailwind v4 supports dark mode natively
- [ ] Map all `brand-*`, `mercury-*`, `ink-*` tokens to dark variants

**AI Canvas Reference:**

- `css/modules/dark-mode.css` — complete dark mode variable overrides
- `css/modules/variables.css` — light mode base values

**ScribeX Target:** `src/app/globals.css` (@theme dark variant)
**ScribeX Impact:** All components, `src/components/dashboard/sidebar.tsx`

---

## Phase 10: Advanced Features & Mercury Optimization

> Features that build on top of the core system. Mercury 2 is the sole AI provider — no multi-model complexity.

### 10.1 Mercury Model Optimization

> **Decision (Feb 2026): Mercury-only.** No multi-model support. Mercury 2's diffusion architecture provides purpose-built endpoints (`chat`, `apply`, `fim`, `edit`) that no other provider offers. Adding providers would add complexity without meaningful benefit. The per-action routing patterns from AI Canvas (temperature, token caps, prompt routing) are adopted in Phases 0 and 8 — they work with Mercury alone.

- [ ] Audit all Mercury endpoints for optimal usage (are we using `apply` vs `chat` for the right tasks?)
- [ ] Ensure `routeToModel()` in `client.ts` maps every writing mode to the best Mercury endpoint
- [ ] Test Mercury's few-shot capability for the humanizer pipeline (Phase 2) — if quality is sufficient, no secondary model needed
- [ ] Document Mercury API capabilities and limits as internal reference

**AI Canvas Lesson Learned:**

- AI Canvas needed 5 providers and 36 models because no single model covered all use cases well
- Mercury's specialized endpoints (`fim` for autocomplete, `apply` for edits, `chat` for generation) eliminate this need
- The valuable patterns from AI Canvas's multi-model system (temperature mapping, token caps, prompt routing) are already adopted in Phases 0 and 8 — without the provider abstraction complexity

**ScribeX Target:** `src/lib/mercury/client.ts` — optimize existing routing

---

### 10.2 Conversation-Document Binding

- [ ] AI Canvas designed but never implemented this (documentId always null in conversations)
- [ ] Opportunity: bind chat conversations to specific papers in ScribeX
- [ ] Each paper gets its own chat history thread
- [ ] Switching papers switches chat context automatically
- [ ] Research questions become paper-specific knowledge

**AI Canvas Reference:**

- `api/conversations.php` — `documentId` field exists but always null
- `js/modules/ui/ConversationHistoryManager.js` — conversation CRUD, search, threading
- `data/conversations.json` — conversation records with unused `documentId`

**ScribeX Target:** `src/lib/store/editor-store.ts` (add per-paper chat history)
**ScribeX Impact:** `src/components/editor/ai-panel.tsx` (paper-scoped conversations)

---

### 10.3 Summarize & Continue Actions

- [ ] Summarize: condense selected text or full document into 2-3 sentences
- [ ] Continue: generate text from cursor position, aware of sentence fragments
- [ ] Both leverage existing Mercury streaming infrastructure

**AI Canvas Reference:**

- `prompts/assistant/summarize.txt` — document summarization prompt
- `prompts/assistant/continue.txt` — cursor-aware continuation with sentence-fragment examples

**ScribeX Target:** New slash commands in `src/lib/constants/index.ts`
**ScribeX Impact:** `src/components/editor/slash-command-menu.tsx`

---

### 10.4 HTML Sanitization for AI Responses

- [ ] AI responses may contain unsafe HTML when generating formatted content
- [ ] Profile-based sanitization: different rules for document content vs chat display
- [ ] Tag allowlist, attribute filtering, protocol denylist (`javascript:`, `data:`)

**AI Canvas Reference:**

- `js/modules/core/HtmlSanitizer.js` — profile-based sanitization (documentLegacy/document/chat)
- `prompts/document/autoformat-html.txt` — XSS prevention embedded in prompt (tag allowlist, URL protocol denylist)

**ScribeX Target:** `src/lib/utils/sanitize-html.ts` — new utility (or enhance existing `src/lib/export/sanitize.ts`)
**ScribeX Impact:** `src/lib/utils/markdown-to-html.ts`, `src/components/editor/ai-panel.tsx`

---

## Cross-Cutting Concerns

### Security Checklist

- [ ] All new API routes (`/api/detect`) go through existing CSRF + rate limit middleware
- [ ] Humanizer dataset contains no PII or copyrighted content
- [ ] AI detection API key stored as server-side env var (never exposed to client)
- [ ] HTML sanitization on all AI-generated content before DOM insertion
- [ ] Prompt injection guard: user-provided text wrapped in clear delimiters

### Testing Strategy

- [ ] Unit tests for pure utilities: readability analyzer, content hash, change block parser, prompt router
- [ ] Integration tests for new API routes: `/api/detect`
- [ ] E2E tests for floating menu interaction flow
- [ ] E2E tests for humanizer generation and acceptance
- [ ] E2E tests for ghost text word-by-word acceptance

### Performance Budget

- [ ] Floating menu appears within 300ms of selection (debounce included)
- [ ] Ghost text suggestion appears within `AUTOCOMPLETE_DELAY_MS` (300ms) + API latency
- [ ] Humanizer alternatives display as they stream (not after full completion)
- [ ] Content hash comparison < 1ms for average document size
- [ ] Readability score recalculated on debounced content change (500ms)

---

## AI Canvas Source Reference Index

> Quick-lookup for all AI Canvas files analyzed during the 10-agent research session.

### Backend / API (`api/`)

| File                          | Purpose                                                 |
| ----------------------------- | ------------------------------------------------------- |
| `config.php`                  | API keys, URLs, timeouts, error logging                 |
| `api/chat_service.php`        | Core chat logic, reasoning mapping, context truncation  |
| `api/chat.php`                | Sync HTTP entry point                                   |
| `api/chat_jobs.php`           | Async job queue orchestration                           |
| `api/chat_job_worker.php`     | Background job worker                                   |
| `api/openrouter.php`          | 10-action multi-model endpoint, 3-stage JSON extraction |
| `api/rewrite.php`             | Text rewrite with multi-provider routing                |
| `api/humanize.php`            | Alternative generation endpoint                         |
| `api/humanizer/gemini001.php` | Few-shot humanizer pipeline                             |
| `api/openai-completion.php`   | Legacy FIM completions                                  |
| `api/pangram.php`             | AI detection proxy                                      |
| `api/model_config.php`        | Centralized model metadata + validation                 |
| `api/conversations.php`       | Conversation CRUD                                       |
| `api/documents.php`           | Document CRUD                                           |
| `api/prompt_history.php`      | Prompt history storage                                  |

### UI Modules (`js/modules/ui/`)

| File                            | Purpose                                                               |
| ------------------------------- | --------------------------------------------------------------------- |
| `FloatingMenu.js`               | Selection detection, positioning, mode management, keyboard shortcuts |
| `InlineSuggestions.js`          | Ghost text, word-by-word acceptance, alternative caching              |
| `ChangeBlockParser.js`          | AI response diff parsing, apply/decline cards                         |
| `HumanizerMenu.js`              | Humanizer selection UI, generate-more                                 |
| `ChatPanel.js`                  | Resizable side panel, change blocks, conversation history             |
| `AIDetectorPanel.js`            | AI detection score, chunk cards, report modal                         |
| `ConversationHistoryManager.js` | Conversation CRUD, threading, search                                  |
| `Sidebar.js`                    | Document list, pinnable overlay/push mode                             |
| `Toast.js`                      | Minimal notification singleton                                        |
| `AssistantPanel.js`             | Assistant mode panel                                                  |
| `MorePanel.js`                  | "Load more" alternatives panel                                        |

### Core Modules (`js/modules/core/`)

| File                      | Purpose                                              |
| ------------------------- | ---------------------------------------------------- |
| `DocumentManager.js`      | Document CRUD, localStorage + server sync, migration |
| `AutoSave.js`             | Debounce + fallback interval + content-hash guard    |
| `UndoManager.js`          | innerHTML snapshot stack (50 max)                    |
| `ReadabilityAnalyzer.js`  | Flesch Reading Ease, syllable counter                |
| `Formatting.js`           | execCommand wrappers, caret utilities                |
| `MarkdownProcessor.js`    | Shortcut regex patterns, HTML builders               |
| `HtmlSanitizer.js`        | Profile-based sanitization                           |
| `TableManager.js`         | Table builder, markdown table parser                 |
| `PromptHistoryManager.js` | Dedup history, up/down navigation                    |
| `Settings.js`             | Provider/model routing                               |
| `FeatureFlags.js`         | localStorage-backed toggles                          |
| `utils.js`                | UUID, djb2 hash, debounce, fetchWithTimeout          |

### AI Modules (`js/modules/ai/`)

| File             | Purpose                                       |
| ---------------- | --------------------------------------------- |
| `AIAssistant.js` | Frontend AI orchestration, all action methods |
| `ModelConfig.js` | Frontend model registry, capability queries   |

### Prompts (`prompts/`)

| Directory    | Files                                                                     | Purpose                                                        |
| ------------ | ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `assistant/` | `chat-assistant.txt`, `continue.txt`, `summarize.txt`, `analyze_tone.txt` | Chat, continuation, summarization, tone analysis               |
| `rewrite/`   | `rewrite.txt`                                                             | Light rewrite with context boundary                            |
| `fix/`       | `fix.txt`                                                                 | Grammar fix (copy editor, temp 0.2)                            |
| `synonyms/`  | 8 files                                                                   | 2x2 matrix (short/long x context/no-context) + "more" variants |
| `stylize/`   | 4 files                                                                   | Style transformation (8 styles) + "more" variants              |
| `humanize/`  | 3 files                                                                   | Humanization (batch, no-context, incremental-one)              |
| `custom/`    | 2 files                                                                   | Free-form user instructions (context/no-context)               |
| `document/`  | `autoformat.txt`, `autoformat-html.txt`, `generate_name.txt`              | Document-level grammar fix, auto-naming                        |

### Data (`data/`)

| File                  | Purpose                                                        |
| --------------------- | -------------------------------------------------------------- |
| `models.json`         | 36 model configs (5 providers, temp ranges, reasoning support) |
| `humanizer008.json`   | Curated few-shot training dataset (8th iteration)              |
| `conversations.json`  | Conversation records (documentId always null)                  |
| `documents.json`      | Document records with activeDocId                              |
| `prompt_history.json` | Recent prompt strings                                          |

### CSS Modules (`css/modules/`)

| File                        | Purpose                                      |
| --------------------------- | -------------------------------------------- |
| `variables.css`             | Design tokens, z-index scale, layout offsets |
| `base.css`                  | Flex layout, radial gradient backgrounds     |
| `floating-menu.css`         | Gooey cluster, ribbon, chips, flip logic     |
| `floating-menu-stylize.css` | Amber/orange stylize mode theme              |
| `chat-panel.css`            | Resizable panel, change block diff styling   |
| `humanizer.css`             | Humanizer floating menu styles               |
| `ai-detector.css`           | Score badge, liquid fill scan animation      |
| `dark-mode.css`             | Dark mode semantic variable overrides        |
| `conversation-history.css`  | History list, search, delete-on-hover        |

### Documentation (`docs/`)

| File                                              | Purpose                                       |
| ------------------------------------------------- | --------------------------------------------- |
| `README.md`                                       | Project overview, feature list, shortcuts     |
| `IDEAS.md`                                        | Feature ideas and brainstorming               |
| `REPORT.md`                                       | Project report                                |
| `QA-Report.md`                                    | QA findings with severity ranking             |
| `FIX.md`                                          | Known issues and fixes                        |
| `ISSUE-TO-FIX.md`                                 | CSS animation modal flicker root cause        |
| `selection-disambiguation-brainstorm.md`          | 15 solutions ranked by impact                 |
| `models.md`                                       | Model capability matrix (reference only)      |
| `model-cerebras.md`                               | Speed benchmarks (reference only)             |
| `plans/2026-01-15-humanizer-chat-panel-design.md` | Humanizer design spec                         |
| `plans/2026-01-15-implementation-plan.md`         | Implementation plan (completed)               |
| `plans/PLAN-cerebras-integration.md`              | Provider integration blueprint (reference)    |
| `ideation/IDEATION-WORKFLOW.md`                   | Genetic algorithm ideation process            |
| `ideation/floating-menu/INTEGRATION.md`           | Floating menu integration task map            |
| `ideation/floating-menu/v025.html`                | Canonical floating menu prototype (v25 of 27) |

---

## Implementation Priority Matrix

| Priority | Phase | Feature                           | Impact    | Effort | Dependencies | Status  |
| -------- | ----- | --------------------------------- | --------- | ------ | ------------ | ------- |
| P0       | 0     | Prompt Externalization            | High      | Low    | None         | ✅ Done  |
| P0       | 0     | Selection Disambiguation          | High      | Low    | None         | ✅ Done  |
| P0       | 0     | Document Source-of-Truth          | High      | Low    | Phase 0.1    | ✅ Done  |
| P1       | 1     | Floating Menu (Selection Actions) | Very High | High   | Phase 0 ✅    | ✅ Done  |
| P1       | 2     | Humanizer Pipeline                | Very High | High   | Phase 0 ✅    | 🔜 Next  |
| P1       | 5     | Readability Analyzer              | Medium    | Low    | None         | 🔜 Next  |
| P1       | 8     | Temperature Engineering           | High      | Low    | Phase 0 ✅    | 🔜 Next  |
| P2       | 3     | Ghost Text Upgrades               | High      | Medium | None         | Pending |
| P2       | 4     | Writing Tools Suite               | High      | Medium | Phase 0, 1   | Pending |
| P2       | 6     | Content Hash Autosave             | Medium    | Low    | None         | Pending |
| P2       | 7     | Prompt History                    | Medium    | Low    | None         | Pending |
| P3       | 2     | AI Detection Integration          | Medium    | Medium | External API | Pending |
| P3       | 9     | Dark Mode                         | Medium    | Medium | None         | Pending |
| P2       | 10    | Mercury Endpoint Optimization     | Medium    | Low    | None         | Pending |
| P3       | 10    | Conversation-Document Binding     | Medium    | Medium | Phase 7      | Pending |

---

*Generated: February 28, 2026*
*Phase 0 completed: February 28, 2026 (7-agent swarm, 22 files)*
*Phase 1 completed: February 28, 2026 (8-agent swarm, 9 files)*
*Source: 10-agent parallel analysis of AI Canvas codebase (90+ files)*
*Knowledge Base: `.claude/projects/-Users-ozzy-mac-Projects-ScribeX/memory/ai-canvas-knowledge-base.md`*

---

## Phase 2 Orchestration Prompt — Humanizer & AI Detection

> Copy-paste this prompt into a fresh Claude Code session to deploy the Phase 2 swarm.
> Mirrors the Phase 1 orchestration prompt structure exactly.

### PROMPT START

Hey Claude, I want you to deploy special agents — all under your centralized control — to build **Phase 2 (Humanizer & AI Detection)** of ScribeX. You are the **orchestrator**. You spawn agents, assign tasks, manage dependencies, and verify everything compiles.

Use `TeamCreate` to create the team, `TaskCreate` to define the task graph, and `Agent` tool to spawn teammates. Run maximum parallelism where no dependencies exist. Each agent reports back to you. You verify at the end.

---

### Context: What's Already Done

**Phase 0 — Prompt Architecture & Context Intelligence** ✅

- 18 files in `src/lib/prompts/` — loader with `{{variable}}` interpolation, 13 per-command prompts, system/chat prompts, version tracking
- `routePrompt()` in `src/lib/prompts/router.ts` — 2x2 matrix (short/long x context/standalone), composes truncation + disambiguation
- `src/lib/utils/selection-markers.ts` — `<<<SELECTED>>>` markers for disambiguation
- `src/lib/utils/context-window.ts` — `truncateAroundSelection()` with 60/40 split, paragraph boundary snapping

**Phase 1 — Floating Menu** ✅ (Commit `49401d4`)

- `src/lib/extensions/floating-menu-plugin.ts` — ProseMirror plugin for text selection detection, 300ms debounce, viewport edge flip, Escape/mousedown-outside dismiss
- `src/components/editor/floating-menu.tsx` — 4-button fan-out (Rewrite, Simplify, Academic, Expand), Framer Motion spring animations
- `src/components/editor/floating-ribbon.tsx` — Tier-2 expansion panel with 4 modes (rewrite, stylize, **humanize**, **detect**). **Humanize and Detect handlers are stubs — this is what Phase 2 wires up.**
- `src/lib/utils/change-block-parser.ts` — Regex parser for ` ```change` blocks, `parseChangeBlocks()`, `hasChangeBlocks()`
- `src/components/editor/change-diff-card.tsx` — Visual diff card with Apply/Decline, ProseMirror text replacement
- `src/lib/prompts/assistant/chat.ts` — SUGGESTING EDITS section instructs AI to use change block format
- `src/lib/store/editor-store.ts` — `updateLastAIMessage(content, isStreaming?)` extended to clear streaming flag

**Key Infrastructure:**

- Mercury API client: `src/lib/mercury/client.ts` — `streamChatCompletion()`, `structuredChatCompletion<T>()`, `applyEdit()`, `fimCompletion()`
- All AI calls route through `/api/mercury` (never direct external API)
- Zustand store: `src/lib/store/editor-store.ts` — `useEditorStore` with persist middleware
- Design system: `brand-*` (navy), `mercury-*` (teal), `ink-*` (stone), Framer Motion, Manrope/Newsreader fonts
- Prompt system: `src/lib/prompts/loader.ts` — `getCommandPrompt(action, vars?)` with `{{variable}}` interpolation

---

### What To Build Now: Phase 2 — Humanizer & AI Detection

#### Task 1: Research Agent (Opus 4.6)

**Goal:** Deep-dive the AI Canvas humanizer implementation and produce a ScribeX implementation map.

**Read these AI Canvas files:**

- `AI_CANVAS_Example/AI-Canvas/data/humanizer008.json` — curated few-shot dataset (8th iteration, hundreds of before/after pairs)
- `AI_CANVAS_Example/AI-Canvas/api/humanizer/gemini001.php` — few-shot pipeline: load dataset → random sample → build chat history → API call
- `AI_CANVAS_Example/AI-Canvas/api/pangram.php` — AI detection proxy with `x-api-key` auth
- `AI_CANVAS_Example/AI-Canvas/prompts/humanize/humanize.txt` — batch humanization prompt with `{{count}}` placeholder
- `AI_CANVAS_Example/AI-Canvas/prompts/humanize/humanize-one.txt` — minimal "one more" prompt (no persona, plain text, fast)
- `AI_CANVAS_Example/AI-Canvas/prompts/humanize/humanize-no-context.txt` — standalone humanization without document context
- `AI_CANVAS_Example/AI-Canvas/js/modules/ui/HumanizerMenu.js` — UI for alternatives list, generate-more button
- `AI_CANVAS_Example/AI-Canvas/js/modules/ui/AIDetectorPanel.js` — score display, chunk cards, report modal, history
- `AI_CANVAS_Example/AI-Canvas/css/modules/ai-detector.css` — score badge colors, liquid fill scan animation
- `AI_CANVAS_Example/AI-Canvas/js/modules/ui/InlineSuggestions.js` — temperature ramping: `baseTemp + (variantIndex * 0.15)`

**Also read ScribeX files for integration context:**

- `src/components/editor/floating-ribbon.tsx` — the humanize/detect stub handlers to replace
- `src/lib/mercury/client.ts` — understand existing API patterns
- `src/lib/prompts/loader.ts` — understand prompt system for registration
- `src/lib/store/editor-store.ts` — understand state management patterns

**Deliverable:** A detailed implementation map document covering:

1. Dataset structure analysis (how to adapt humanizer008.json for Mercury/academic domain)
2. Pipeline architecture (few-shot → Mercury API translation)
3. Temperature strategy (1.4 base, +0.15 ramping, how to implement in Mercury client)
4. Detection API options (Pangram vs alternatives, API key management)
5. UI patterns → ScribeX component map

---

#### Task 2: Humanizer Dataset & Sampler (Sonnet 4.6) — blocked by Task 1

**Files to create:**

- `src/lib/humanizer/dataset.ts` — Dataset loader and random few-shot sampler
- `src/data/humanizer-dataset.json` — Curated academic-domain before/after pairs

**Requirements:**

- Study `humanizer008.json` structure from Task 1 research
- Curate academic-specific pairs (not just generic AI text → human text)
- Build `sampleFewShot(n: number)` → returns array of `{ai: string, human: string}` pairs
- Convert sampled pairs to Mercury chat message format: `[{role: "user", content: ai}, {role: "assistant", content: human}]`
- Export `HumanizerExample` type, `loadDataset()`, `sampleFewShot()`

---

#### Task 3: Humanizer Pipeline (Sonnet 4.6) — blocked by Task 1

**Files to create/modify:**

- `src/lib/humanizer/pipeline.ts` — Few-shot request builder
- Modify `src/lib/mercury/client.ts` — Add `humanize()` method

**Requirements:**

- Build `humanize(text: string, options: HumanizeOptions)` in pipeline.ts
- `HumanizeOptions`: `{ count: number, existing?: string[], temperature?: number }`
- Use dataset sampler to build few-shot context for each request
- Temperature strategy: base 1.4, +0.15 per variant index (variant 0 = 1.4, variant 1 = 1.55, variant 2 = 1.7, variant 3 = 1.85)
- Parallel request support: `Promise.allSettled()` for initial batch (4 concurrent)
- Pass `existing` alternatives to prompt for deduplication
- Add `humanize()` convenience method to `mercury/client.ts` that calls the pipeline

---

#### Task 4: Humanizer Prompts (Sonnet 4.6) — parallel with Task 3, blocked by Task 1

**Files to create/modify:**

- `src/lib/prompts/commands/humanize.ts` — Batch humanization prompt
- `src/lib/prompts/commands/humanize-one.ts` — Incremental "one more" prompt
- Modify `src/lib/prompts/loader.ts` — Register new prompts

**Requirements:**

- Batch prompt: accepts `{{count}}` for number of alternatives, `{{text}}` for input
- Incremental prompt: minimal, no persona, plain text return, `{{existing}}` for dedup list
- Follow existing prompt patterns in `src/lib/prompts/commands/` (look at `generate.ts`, `rewrite.ts`)
- Register both in `loader.ts` action map
- Wire `{{count}}`, `{{text}}`, `{{existing}}` interpolation variables

---

#### Task 5: Humanizer UI Panel (Sonnet 4.6) — blocked by Tasks 3 & 4

**Files to create/modify:**

- `src/components/editor/humanizer-panel.tsx` — New component
- Modify `src/components/editor/floating-ribbon.tsx` — Replace humanize stubs

**Requirements:**

- 3-tier UX pattern:
  1. **Initial batch**: Generate 4 humanized alternatives simultaneously on open
  2. **"More" button**: Generate 1 additional alternative incrementally
  3. **Deduplication**: Pass existing alternatives to prompt so AI never repeats
- Alternative chips: numbered (1-N), clickable to apply (replaces selected text in editor)
- "Past last = generate more" — scrolling past the last alternative triggers generation
- Loading states with `Loader2` spinner (matches existing patterns)
- Design system: `brand-*`/`mercury-*`/`ink-*` colors, Framer Motion animations
- Wire into `floating-ribbon.tsx` `handleHumanizeGenerate()` — replace the `setTimeout` stub
- Get editor reference and selection range from floating-ribbon props

---

#### Task 6: AI Detection System (Sonnet 4.6) — blocked by Task 1

**Files to create/modify:**

- `src/app/api/detect/route.ts` — New API route (proxy to detection service)
- `src/components/editor/ai-detection-badge.tsx` — New component
- Modify `src/components/editor/floating-ribbon.tsx` — Replace detect stubs
- Modify `src/middleware.ts` — Add rate limiting for `/api/detect`

**Requirements:**

- API route: accept `{ text: string }`, proxy to Pangram or equivalent detection API
- Use `DETECTION_API_KEY` env var (server-side only)
- Return `{ score: number, sentences?: { text: string, score: number }[] }`
- Score badge component: color-coded (green < 30%, amber 30-60%, red > 60%)
- CSS scan animation while detection runs (match existing `shimmer`/`pulse-glow` keyframe patterns)
- Rate limiting: 10 req/min per IP for detection endpoint (separate from general 60/min)
- Wire into `floating-ribbon.tsx` `DetectContent` — replace the "Coming in Phase 2" placeholder
- Add `DETECTION_API_KEY` to env vars documentation

---

#### Task 7: Integration Agent (Opus 4.6) — blocked by Tasks 5 & 6

**Goal:** Wire everything together and ensure Phase 1 features remain intact.

**Responsibilities:**

- Wire humanizer panel into floating menu → ribbon → panel flow
- Ensure humanize button in floating-menu.tsx triggers ribbon humanize mode
- Ensure ribbon humanize mode opens humanizer panel with selected text
- Connect AI detection badge to floating menu detect mode
- Update `editor-store.ts` if new state is needed (e.g., `humanizerAlternatives`, `detectionScore`)
- Verify Phase 1 features still work:
  - Text selection → floating menu appears
  - Rewrite/Simplify/Academic/Expand buttons work
  - Change block cards render in chat with Apply/Decline
  - Chat panel works normally
- Verify no import cycles or circular dependencies

---

#### Task 8: Verification (Opus 4.6) — blocked by Task 7

**Run all quality gates:**

1. `npx tsc --noEmit` — 0 type errors
2. `pnpm lint` — 0 new errors (pre-existing AI Canvas warnings OK)
3. `NODE_ENV=production pnpm build` — success (only `/_global-error` prerender failure, which is the known Next.js 16.1.6 regression)
4. Browser test (if Chrome MCP available):
   - Select text in editor → floating menu appears
   - Click Humanize → ribbon opens → alternatives generate
   - Click an alternative → text replaced in editor
   - Click Detect → detection score badge appears
   - Phase 1 features all still work

**If any gate fails:** fix the issue and re-verify. Report all fixes to orchestrator.

---

#### Task 9: Documentation (Sonnet 4.6) — blocked by Task 8

**Files to update:**

- `TODO.md` — Check off Phase 2 items (2.1-2.4)
- `CLAUDE.md` — Document new humanizer and detection architecture
- `memory/MEMORY.md` — Add Phase 2 section with key decisions and file paths
- Create `memory/phase2-execution-log.md` — Task completion log

---

### Key Constraints

1. **Design System**: `brand-*`/`mercury-*`/`ink-*` color scales, Framer Motion for animations, Manrope (UI) / Newsreader (editor body) fonts
2. **Mercury API**: All AI calls route through `src/lib/mercury/client.ts` → `/api/mercury`. Never call external APIs directly from client code.
3. **Prompt System**: Use Phase 0 infrastructure — `getCommandPrompt()` from `loader.ts`, `{{variable}}` interpolation, register in action map
4. **Phase 1 Preserved**: Floating menu, change block cards, chat — all must continue working after Phase 2 changes
5. **Dataset Quality**: Humanizer before/after pairs must be academic-domain specific (research papers, essays, theses — not generic AI text)
6. **Temperature Strategy**: Base 1.4, +0.15 per variant index — creates genuine diversity through different sampling temperature, not just rephrasing
7. **State Management**: Use existing Zustand `useEditorStore` patterns — add new fields if needed, persist only what's necessary

### Agent Model Assignment

| Task                  | Agent Type                | Model      | Why                                                  |
| --------------------- | ------------------------- | ---------- | ---------------------------------------------------- |
| Task 1: Research      | Explore → general-purpose | Opus 4.6   | Deep reasoning across 10+ reference files            |
| Task 2: Dataset       | general-purpose           | Sonnet 4.6 | Focused data curation and TypeScript                 |
| Task 3: Pipeline      | general-purpose           | Sonnet 4.6 | Clean implementation of well-defined pipeline        |
| Task 4: Prompts       | general-purpose           | Sonnet 4.6 | Prompt writing follows existing patterns             |
| Task 5: UI Panel      | general-purpose           | Sonnet 4.6 | React component matching existing design             |
| Task 6: Detection     | general-purpose           | Sonnet 4.6 | API route + component, straightforward               |
| Task 7: Integration   | general-purpose           | Opus 4.6   | Cross-cutting wiring, must reason about side effects |
| Task 8: Verification  | general-purpose           | Opus 4.6   | Must reason about build failures and fix them        |
| Task 9: Documentation | general-purpose           | Sonnet 4.6 | Documentation updates                                |

### Dependency Graph

```
Task 1 (Research)
├── Task 2 (Dataset)      ← needs research findings
├── Task 3 (Pipeline)     ← needs research findings
├── Task 4 (Prompts)      ← needs research findings (parallel with 3)
└── Task 6 (Detection)    ← needs research findings

Task 3 + Task 4 → Task 5 (UI Panel)  ← needs pipeline + prompts
Task 5 + Task 6 → Task 7 (Integration) ← needs all components
Task 7 → Task 8 (Verification)
Task 8 → Task 9 (Documentation)
```

**Max parallelism:** After Task 1 completes, Tasks 2, 3, 4, and 6 can all run in parallel. Tasks 5 waits for 3+4. Task 7 waits for 5+6.

### AI Canvas Reference Files

```
AI_CANVAS_Example/AI-Canvas/
├── data/humanizer008.json                    # Few-shot dataset (8th curation)
├── api/humanizer/gemini001.php               # Few-shot pipeline implementation
├── api/pangram.php                           # AI detection API proxy
├── prompts/humanize/humanize.txt             # Batch humanization prompt
├── prompts/humanize/humanize-one.txt         # Incremental "one more" prompt
├── prompts/humanize/humanize-no-context.txt  # Standalone (no document context)
├── js/modules/ui/HumanizerMenu.js            # Humanizer alternatives UI
├── js/modules/ui/AIDetectorPanel.js          # Detection score + chunk cards
├── css/modules/ai-detector.css               # Score badge, scan animation
└── js/modules/ui/InlineSuggestions.js         # Temperature ramping pattern
```

Deploy all agents. Dependency-ordered task graph. Maximum parallel execution. Each agent reports completion to orchestrator. Orchestrator verifies at the end.

Let's build Phase 2.

### PROMPT END
