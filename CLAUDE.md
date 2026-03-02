# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ScribeX is an academic writing assistant powered by Inception Labs' Mercury diffusion language models. It provides a TipTap-based rich text editor with AI writing modes (compose, autocomplete, quick-edit, deep-rewrite, review, diffusion-draft), a full writing tools suite (synonyms, stylize, fix, custom instructions, tone analysis), humanizer pipeline, AI detection, and Semantic Scholar citation search. The app uses a join-code gate (`NEXT_PUBLIC_JOIN_CODE`) instead of traditional auth — access is stored in localStorage.

## Commands

```bash
pnpm dev          # Start dev server (localhost:3000)
pnpm build        # Production build
pnpm lint         # ESLint (flat config, Next.js core-web-vitals + typescript)
npx tsc --noEmit  # Type-check without emitting
```

### E2E Tests (Playwright)

```bash
npx playwright test                    # Run all E2E tests (requires dev server running)
npx playwright test e2e/01-landing.spec.ts  # Run a single spec file
npx playwright test --headed           # Run with visible browser
npx playwright show-report e2e/report  # View HTML test report
```

Config: `playwright.config.ts` — Chromium only, `testDir: "./e2e"`, 60s timeout, no auto-started webServer (start `pnpm dev` first). Specs are numbered `01-landing` through `10-editor-extensions` and run sequentially (`fullyParallel: false`).

Test helpers (`e2e/helpers.ts`): `seedJoinToken()` and `seedPaper()` use `page.addInitScript` to pre-seed localStorage with valid Zustand persist state (key `scribex:editor`, version 1) before page load, bypassing the join-gate.

## Architecture

### Route Structure (Next.js 16 App Router)

- `/` — Landing page (Server Component, assembles `landing/` section components)
- `/dashboard` — Paper management hub (client-side, wrapped in `JoinGate` + `Sidebar` layout)
- `/dashboard/citations` | `/dashboard/templates` | `/dashboard/settings` — Dashboard sub-pages
- `/editor/[id]` — Paper editor (client-side, dynamic route by paper ID)

### API Routes (server-side, protect API keys)

- `POST /api/mercury` — Proxy to Inception Labs Mercury API. Accepts `{ endpoint, ...payload }` where endpoint is `chat|apply|fim|edit`. Handles both streaming (SSE passthrough) and non-streaming responses.
- `GET /api/citations?q=&limit=&offset=` — Proxy to Semantic Scholar `/graph/v1/paper/search`. Transforms response to internal `Citation` format.
- `POST /api/humanize` — Humanizer pipeline. Accepts `{ text, context?, count?, existing?, action: 'generate'|'generate_one', temperature? }`. Assembles few-shot messages from dataset server-side, calls Mercury-2. Returns `{alternatives: string[]}` or `{alternative: string}`.
- `POST /api/detect` — AI detection via Pangram v3 API. Accepts `{ text }`. Returns `{score, label, sentences, fractionAi, fractionAiAssisted, fractionHuman, windows, dashboardLink}`. When `PANGRAM_API_KEY` is set, calls `https://text.api.pangram.com/v3` for 3-way classification (AI / AI-Assisted / Human) with per-segment windows and a public dashboard link. Falls back to heuristic analysis (`src/lib/detection/heuristics.ts`) when no API key is configured.

All API routes that require join-code authentication use the shared `validateJoinCode()` helper from `src/lib/utils/api-auth.ts`, which performs constant-time comparison to prevent timing side-channel attacks.

### Proxy Middleware (`src/proxy.ts`)

Applied to all `/api/*` routes. Two checks:
1. **CSRF**: Compares `Origin` header against `NEXT_PUBLIC_APP_URL`. Cross-origin → 403.
2. **Rate limiting**: In-memory sliding window, 60 req/min per IP. Not multi-region safe (use Upstash Redis for production).

### Mercury Client (`src/lib/mercury/client.ts`)

All AI features route through this client → `/api/mercury` (never external API directly):
- `streamChatCompletion()` — SSE streaming for compose/generate (mercury-2). Supports `diffusing: true` mode where each chunk is a full denoised snapshot. Default temperature via `getTemperature("chat")`.
- `structuredChatCompletion<T>()` — Non-streaming JSON schema mode. Returns parsed `T`. Used by synonyms, stylize, custom, tone analysis.
- `applyEdit()` — Non-streaming edit via `<|original_code|>` / `<|update_snippet|>` delimiters (mercury-edit).
- `fimCompletion()` — Fill-in-the-middle for autocomplete (mercury-edit). Accepts `temperature` param (default 0.0, ramped for alternatives).
- `calculateMaxTokens()` — Dynamic token cap: short inputs (<100 chars) get 256 tokens, medium (<500) get 512, otherwise full cap. Prevents wasted tokens on simple edits.
- `routeToModel()` — Maps `WritingMode` → `MercuryModel`. `quick-edit` routes to mercury-edit for short selections (<500 chars), mercury-2 otherwise.
- `humanizeText()` — Thin client for `/api/humanize` (batch generation). Returns `HumanizerResponse`.
- `humanizeOneMore()` — Thin client for `/api/humanize` (incremental generation with dedup). Returns `HumanizerOneResponse`.

### State Management

Two Zustand stores with persist middleware in `src/lib/store/editor-store.ts`:
- `useEditorStore` — Editor state. **Persisted fields**: `papers`, `autocompleteEnabled`, `diffusionEnabled`, `reasoningEffort`, `promptHistory`, `darkMode`, `chatHistories`. **Transient fields**: `contentHashes` (per-paper djb2 hash map), `promptHistoryIndex`, `autoNamedPapers`.
- `useDashboardStore` — Dashboard state. **Persisted fields**: `selectedTemplate`, `selectedCitationStyle`.

Both use `skipHydration: true` — rehydration is triggered by `useHydration()` hook (`src/hooks/use-hydration.ts`) which uses `useSyncExternalStore` to avoid React lint issues. The dashboard layout shows a spinner until hydration completes.

Key store features:
- **Per-paper chat**: `chatHistories: Record<string, AIMessage[]>` keyed by paper ID. `getCurrentMessages()` returns messages for active paper. `pruneOrphanedChatHistories()` cleans up deleted papers.
- **Prompt history**: Last 50 prompts persisted. Arrow Up/Down navigation in AI panel with draft preservation.
- **Content hash autosave**: `contentHashes: Record<string, number>` — djb2 fingerprinting prevents no-op saves when content hasn't changed.
- **Auto-naming**: `autoNamePaper(id)` fires async when content > 50 chars and title is "Untitled Paper". Uses `structuredChatCompletion` with `generate-name` prompt.
- **Dark mode**: `darkMode: boolean` toggled via `toggleDarkMode()`. `DarkModeProvider` applies `.dark` class on `<html>`.

Storage keys: `scribex:editor` and `scribex:dashboard` (defined in `src/lib/storage/index.ts`).

### Custom TipTap Extensions (`src/lib/extensions/`)

- **`ghost-text.ts`** — ProseMirror plugin for FIM autocomplete. Word-by-word acceptance (Tab = next word, Cmd/Ctrl+Enter = accept all). Multi-alternative caching (up to 5 per cursor position, Arrow Up/Down to cycle, temperature ramp 0.0–0.4). Background pre-fetch of alternative[1]. Jaccard similarity dedup (0.8 threshold). Visual "1/3" badge. Smart spacing via `normalizeSpacing()`.
- **`mermaid-block.tsx`** — Atom node with React NodeView. Edit/render toggle, dynamic `import("mermaid")`, `securityLevel: "strict"`.
- **`keyboard-shortcuts.ts`** — TipTap Extension with 5 AI action bindings: `Mod-Shift-R` (rewrite), `Mod-Shift-H` (humanize), `Mod-Shift-F` (fix), `Mod-Shift-Y` (stylize), `Mod-Shift-D` (detect). Dispatches `CustomEvent('scribex:shortcut', { detail: { action } })` for decoupled communication with floating menu.

**Critical: Math delimiter convention** — `@tiptap/extension-mathematics` uses non-standard delimiters: `$$...$$` for inline, `$$$...$$$` for block (NOT standard LaTeX `$`/`$$`). For programmatic insertion use `insertInlineMath({ latex })` / `insertBlockMath({ latex })` commands — never `insertContent('$...$')` (input rules only fire on keystrokes). The `markdown-to-html.ts` utility preserves these conventions when converting Mercury API output.

### Floating Menu System (`src/components/editor/`)

Selection-triggered AI actions with two tiers:

- **`floating-menu.tsx`** — 10-button fan-out (Rewrite, Simplify, Academic, Expand, Stylize, Humanize, Fix, Detect, Custom, Tone) from a sparkle trigger icon. Framer Motion spring animations. Handles its own positioning via TipTap `selectionUpdate`/`update` events (self-contained, no separate ProseMirror plugin). Listens for `scribex:shortcut` CustomEvents from keyboard shortcuts. Pulse animation during processing (Phase 9).
- **`floating-ribbon.tsx`** — Tier-2 expansion panel with 7 modes: rewrite (synonym prompts with short/long routing), stylize (8 style chips via `structuredChatCompletion`), fix (`applyEdit` with before/after diff), custom (textarea input → 3 options), tone (`ToneAnalysisCard`), humanize (`HumanizerPanel`), detect (`AIDetectionBadge`). All with `AbortController` cancellation. Toast notifications on completion.
- **`change-diff-card.tsx`** — Visual diff card with red strikethrough (old) / green (new), Apply/Decline buttons. Apply uses ProseMirror `doc.descendants()` to find exact text position, then `deleteRange().insertContentAt()`.
- **`tone-analysis-card.tsx`** — Self-contained card: idle/analyzing/done/error states. Formality/sentiment color-coded badges, confidence progress bar, collapsible suggestions.
- **`document-stats.tsx`** — Popover with word/sentence/paragraph counts, reading time (200 wpm), avg sentence length, longest sentence, syllable complexity distribution with animated bars. 500ms debounce. Mounted in editor footer.

Supporting utilities:
- **`src/lib/utils/change-block-parser.ts`** — Regex parser for `` ```change `` blocks in AI chat responses. Exports `parseChangeBlocks()`, `hasChangeBlocks()`, `ChangeBlock` type. Used by `ai-panel.tsx` to conditionally render `ChangeDiffCard` components when `!message.isStreaming`.
- **`src/lib/utils/readability.ts`** — Pure TypeScript Flesch Reading Ease analyzer. `analyzeReadability()` returns score/grade/color/stats. Grade bands: Easy≥80, Standard≥60, Hard≥40, Complex≥20.
- **`src/lib/utils/content-hash.ts`** — `djb2Hash()` and `hasContentChanged()` for no-op save detection.
- **`src/lib/utils/sanitize-html.ts`** — 5-stage HTML sanitization pipeline (script/style/dangerous block removal, tag allowlist, event handler strip). SSR-compatible, applied in `markdown-to-html.ts`.

### Prompt System (`src/lib/prompts/`)

37 TypeScript prompt files organized by action domain with `{{variable}}` interpolation:
- **`loader.ts`** — `getCommandPrompt(action, vars)` and `getRawGenerateNamePrompt()`. Action map registers all prompts.
- **`router.ts`** — `routePrompt()` composing 2x2 matrix (short/long × context/standalone) + truncation + disambiguation.
- **`commands/`** — 13 slash command prompts (generate, expand, simplify, academic-tone, cite, outline, counter, evidence, transition, abstract, rewrite, diffuse, mermaid).
- **`synonyms/`** — 5 variants: `synonyms.ts`, `synonyms-no-context.ts`, `synonyms-long.ts`, `synonyms-long-no-context.ts`, `synonyms-more.ts` (incremental with `{{existing}}` dedup).
- **`stylize/`** — 3 variants: `stylize.ts`, `stylize-no-context.ts`, `stylize-more.ts`. 8 style transformations (Professional, Creative, Bold, Minimal, Academic, Conversational, Poetic, Technical).
- **`fix/`** — `fix.ts` — Copy editor persona, temperature 0.0 (surgical precision).
- **`custom/`** — `custom.ts`, `custom-no-context.ts` — Free-form user instruction → 3 options JSON.
- **`humanize/`** — 3 variants: batch, no-context, incremental with dedup.
- **`assistant/`** — `chat.ts`, `analyze-tone.ts`, `summarize.ts`, `continue.ts`.
- **`document/`** — `generate-name.ts` — Auto-title with JSON `{"name": "..."}` schema.
- **`system/academic.ts`** — System prompt with document source-of-truth declaration.

### Temperature Engineering (`src/lib/constants/temperatures.ts`)

22-action temperature map across 5 tiers: deterministic (0.0: fim, fix), low (0.2-0.3: academic, simplify, summarize, analyze-tone), medium (0.4-0.5: rewrite, generate, continue), standard (0.6: chat, custom), high (0.7-0.9: expand, stylize, humanize, synonyms). `getTemperature(action, fallback?)` getter used by `editor-canvas.tsx` and `mercury/client.ts`.

### Humanizer System (`src/lib/humanizer/`, Phase 2)

Few-shot learning pipeline that transforms AI-generated text into human-sounding prose:
- **`dataset.ts`** — Loads 456-entry dataset from `src/data/humanizer-dataset.json` (server-side only). `sampleFewShot(n)` uses Fisher-Yates partial shuffle. `buildFewShotMessages()` converts pairs to Mercury chat format (user=AI text, assistant=human text).
- **`pipeline.ts`** — `buildHumanizePayload()` for batch generation (5 few-shot examples, context-aware prompt selection), `buildHumanizeOnePayload()` for incremental generation with temperature ramp (+0.15 per existing, capped at 1.5). `parseAlternatives()` with 4-tier JSON extraction fallback.
- **`humanizer-panel.tsx`** — Three-tier UX: Tier 1 generates 4 alternatives (skeleton loading → stagger animation), Tier 2 "Generate More" button adds incrementally, Tier 3 deduplication via existing alternatives array. Click card to apply to editor.

### AI Detection System (`src/lib/detection/`, Phase 2)

- **`heuristics.ts`** — Self-contained text analyzer (fallback when `PANGRAM_API_KEY` is not set): type-token ratio, passive voice frequency, transition word density, sentence-length burstiness. Per-sentence + weighted global scoring.
- **`client.ts`** — Thin `detectAI(text, signal?)` fetch wrapper for `/api/detect`.
- **`ai-detection-badge.tsx`** — Self-contained badge component. States: idle/scanning/error/done. Color thresholds: <30% green/human, 30-60% amber/mixed, >60% red/ai. When Pangram data is present: 3-way stacked bar (AI/AI-Assisted/Human), per-segment window breakdown with labels and confidence, "View on Pangram" dashboard link, "Powered by Pangram" disclaimer. Falls back to single score bar for heuristic results.

### Export System (`src/lib/export/`)

Fully implemented for 6 formats, dispatched from `src/lib/export/index.ts`:

| Format | Approach |
|--------|----------|
| PDF | `html2pdf.js` via hidden iframe; uses hex colors (oklch incompatible with html2canvas) |
| DOCX | `docx` library with DOM-to-docx converter; supports math (Cambria Math font), tables, lists, TOC |
| Markdown | `turndown` with custom rules for math/mermaid/super/subscript |
| HTML | Standalone document with embedded CSS, Google Fonts, KaTeX CDN |
| BibTeX | Entry type detection, author formatting, double-braced titles |
| LaTeX | HTML-to-LaTeX via DOMParser; 12-package preamble; math passthrough |

UI in `src/components/export/export-dialog.tsx`. Custom type declaration for html2pdf.js at `src/types/html2pdf.d.ts`.

### Dark Mode

Tailwind v4 `.dark` class strategy:
- **`src/app/globals.css`** — `.dark` class overrides all CSS custom properties (oklch color scale inversion). `:root:not(.light)` for system preference fallback.
- **`src/components/shared/dark-mode-provider.tsx`** — Client component that reads `darkMode` from Zustand and applies `.dark` class on `<html>`. Mounted in `layout.tsx`.
- **`src/components/editor/dark-mode-toggle.tsx`** — Moon/Sun icon toggle in editor toolbar.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl+Shift+R` | Rewrite selection |
| `Cmd/Ctrl+Shift+H` | Humanize selection |
| `Cmd/Ctrl+Shift+F` | Fix grammar |
| `Cmd/Ctrl+Shift+Y` | Stylize selection |
| `Cmd/Ctrl+Shift+D` | Detect AI |

Shortcuts dispatch `CustomEvent('scribex:shortcut')` → floating menu listens and opens corresponding ribbon mode.

### Design System

- **Tailwind CSS v4** with `@theme` directive in `globals.css` defining three color scales: `brand-*` (editorial navy, oklch hue 252), `mercury-*` (cool teal, hue 195), `ink-*` (warm stone neutral, hue 72). Plus semantic colors, surface tokens, and custom shadows. Dark mode overrides via `.dark` class.
- **Fonts**: Manrope (sans/UI), Newsreader (serif/editor body), IBM Plex Mono (mono/code)
- **UI components**: shadcn/ui pattern in `src/components/ui/`. Built on Radix primitives + CVA. Consumers import directly from individual component files (no barrel export).
- **Animations**: Framer Motion for page transitions; CSS keyframes for `fade-in`, `slide-up`, `scale-in`, `pulse-glow`, `diffuse`, `shimmer`.

### Key Types (`src/lib/types/index.ts`)

Central type definitions: `Paper`, `WritingMode`, `MercuryModel`, `Citation`, `AIMessage`, `SlashCommand`, `DiffusionStep`, `UserProfile`, `HumanizerRequest`, `HumanizerResponse`, `HumanizerOneResponse`, `DetectionRequest`, `DetectionResponse`, `DetectionSentence`. All Mercury request/response types live here. Export types in `src/lib/types/export.ts`.

### Constants (`src/lib/constants/index.ts`)

`ACADEMIC_SYSTEM_PROMPT` (re-exported from `@/lib/prompts`), `SLASH_COMMANDS` (15 commands including `/summarize` and `/continue`), `PAPER_TEMPLATES` (7 templates), `CITATION_STYLE_CATALOG` (6 styles with full metadata), `REVIEW_JSON_SCHEMA`, `PLAN_LIMITS` (4 tiers), timing constants (`AUTOCOMPLETE_DELAY_MS = 300`, `AUTOSAVE_INTERVAL_MS = 30_000`, `MAX_EDITOR_CONTEXT_TOKENS = 128_000`). Citation normalization utilities handle legacy ID migration (e.g. `apa7` → `apa-7`). Temperature map in separate `src/lib/constants/temperatures.ts` (22 action temperatures).

## Environment Variables

```
INCEPTION_API_KEY          # Required — Mercury API key (server-side only)
SEMANTIC_SCHOLAR_API_KEY   # Optional — increases Semantic Scholar rate limits
PANGRAM_API_KEY            # Optional — Pangram v3 AI detection (falls back to heuristics without key)
NEXT_PUBLIC_APP_URL        # App URL (default: http://localhost:3000)
NEXT_PUBLIC_JOIN_CODE      # Access gate code (if empty, gate is bypassed)
```

## Known Build Issues

- `/_global-error` fails to prerender — Next.js 16.1.6 Turbopack regression where `OuterLayoutRouter` calls `useContext(LayoutRouterContext)` = null during static generation. Build fails with `useContext(LayoutRouterContext) = null` if `NODE_ENV=development` is set in shell. Fix: run `NODE_ENV=production pnpm build`. With correct NODE_ENV, build succeeds fully (only `/_global-error` fails, which is the unfixable Next.js regression). Dev server works fine regardless.
- `ToasterProvider` uses `useSyncExternalStore(subscribe, () => true, () => false)` pattern to avoid sonner 2.x incompatibility with Next.js 16 static generation.

## Path Aliases

`@/*` maps to `./src/*` (configured in tsconfig.json).
