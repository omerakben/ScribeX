# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ScribeX is an academic writing assistant powered by Inception Labs' Mercury diffusion language models. It provides a TipTap-based rich text editor with AI writing modes (compose, autocomplete, quick-edit, deep-rewrite, review, diffusion-draft) and Semantic Scholar citation search. The app uses a join-code gate (`NEXT_PUBLIC_JOIN_CODE`) instead of traditional auth — access is stored in localStorage.

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

### Middleware (`src/middleware.ts`)

Applied to all `/api/*` routes. Two checks:
1. **CSRF**: Compares `Origin` header against `NEXT_PUBLIC_APP_URL`. Cross-origin → 403.
2. **Rate limiting**: In-memory sliding window, 60 req/min per IP. Not multi-region safe (use Upstash Redis for production).

### Mercury Client (`src/lib/mercury/client.ts`)

All AI features route through this client → `/api/mercury` (never external API directly):
- `streamChatCompletion()` — SSE streaming for compose/generate (mercury-2). Supports `diffusing: true` mode where each chunk is a full denoised snapshot.
- `structuredChatCompletion<T>()` — Non-streaming JSON schema mode. Returns parsed `T`.
- `applyEdit()` — Non-streaming edit via `<|original_code|>` / `<|update_snippet|>` delimiters (mercury-edit).
- `fimCompletion()` — Fill-in-the-middle for autocomplete (mercury-edit).
- `routeToModel()` — Maps `WritingMode` → `MercuryModel`. `quick-edit` routes to mercury-edit for short selections (<500 chars), mercury-2 otherwise.

### State Management

Two Zustand stores with persist middleware in `src/lib/store/editor-store.ts`:
- `useEditorStore` — Editor state. **Persisted fields**: `papers`, `autocompleteEnabled`, `diffusionEnabled`, `reasoningEffort`.
- `useDashboardStore` — Dashboard state. **Persisted fields**: `selectedTemplate`, `selectedCitationStyle`.

Both use `skipHydration: true` — rehydration is triggered by `useHydration()` hook (`src/hooks/use-hydration.ts`) which uses `useSyncExternalStore` to avoid React lint issues. The dashboard layout shows a spinner until hydration completes.

Storage keys: `scribex:editor` and `scribex:dashboard` (defined in `src/lib/storage/index.ts`).

### Custom TipTap Extensions (`src/lib/extensions/`)

- **`ghost-text.ts`** — ProseMirror plugin for FIM autocomplete. Debounces 300ms, renders `.ghost-text` decoration at cursor. Tab accepts, Escape dismisses. Uses `AbortController` for in-flight cancellation.
- **`mermaid-block.tsx`** — Atom node with React NodeView. Edit/render toggle, dynamic `import("mermaid")`, `securityLevel: "strict"`.
- **`floating-menu-plugin.ts`** — ProseMirror plugin for text selection detection. 300ms debounce, viewport edge flip, dismiss on Escape/mousedown-outside. Exports `FloatingMenuPlugin`, `floatingMenuPluginKey`, `getFloatingMenuState()`, `FloatingMenuPluginState` interface.

**Critical: Math delimiter convention** — `@tiptap/extension-mathematics` uses non-standard delimiters: `$$...$$` for inline, `$$$...$$$` for block (NOT standard LaTeX `$`/`$$`). For programmatic insertion use `insertInlineMath({ latex })` / `insertBlockMath({ latex })` commands — never `insertContent('$...$')` (input rules only fire on keystrokes). The `markdown-to-html.ts` utility preserves these conventions when converting Mercury API output.

### Floating Menu System (`src/components/editor/`)

Selection-triggered AI actions with two tiers (Phase 1):

- **`floating-menu.tsx`** — 4-button fan-out (Rewrite, Simplify, Academic, Expand) from a sparkle trigger icon. Framer Motion spring animations, self-contained viewport positioning. Reads selection state from `floating-menu-plugin.ts`.
- **`floating-ribbon.tsx`** — Tier-2 expansion panel with 4 modes (rewrite, stylize, humanize, detect). Style chips, alternative generators, AI detection placeholder. AI handler stubs ready for Phase 2 wiring.
- **`change-diff-card.tsx`** — Visual diff card with red strikethrough (old) / green (new), Apply/Decline buttons. Apply uses ProseMirror `doc.descendants()` to find exact text position, then `deleteRange().insertContentAt()`.

Supporting utilities:
- **`src/lib/utils/change-block-parser.ts`** — Regex parser for `` ```change `` blocks in AI chat responses. Exports `parseChangeBlocks()`, `hasChangeBlocks()`, `ChangeBlock` type. Used by `ai-panel.tsx` to conditionally render `ChangeDiffCard` components when `!message.isStreaming`.

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

### Design System

- **Tailwind CSS v4** with `@theme` directive in `globals.css` defining three color scales: `brand-*` (editorial navy, oklch hue 252), `mercury-*` (cool teal, hue 195), `ink-*` (warm stone neutral, hue 72). Plus semantic colors, surface tokens, and custom shadows.
- **Fonts**: Manrope (sans/UI), Newsreader (serif/editor body), IBM Plex Mono (mono/code)
- **UI components**: shadcn/ui pattern in `src/components/ui/` with barrel export via `index.ts`. Built on Radix primitives + CVA.
- **Animations**: Framer Motion for page transitions; CSS keyframes for `fade-in`, `slide-up`, `scale-in`, `pulse-glow`, `diffuse`, `shimmer`.

### Key Types (`src/lib/types/index.ts`)

Central type definitions: `Paper`, `WritingMode`, `MercuryModel`, `Citation`, `AIMessage`, `SlashCommand`, `DiffusionStep`, `UserProfile`. All Mercury request/response types live here. Export types in `src/lib/types/export.ts`.

### Constants (`src/lib/constants/index.ts`)

`ACADEMIC_SYSTEM_PROMPT`, `SLASH_COMMANDS` (13 commands with model assignments), `PAPER_TEMPLATES` (7 templates), `CITATION_STYLE_CATALOG` (6 styles with full metadata), `REVIEW_JSON_SCHEMA`, `PLAN_LIMITS` (4 tiers), timing constants (`AUTOCOMPLETE_DELAY_MS = 300`, `AUTOSAVE_INTERVAL_MS = 30_000`, `MAX_EDITOR_CONTEXT_TOKENS = 128_000`). Citation normalization utilities handle legacy ID migration (e.g. `apa7` → `apa-7`).

## Environment Variables

```
INCEPTION_API_KEY          # Required — Mercury API key (server-side only)
SEMANTIC_SCHOLAR_API_KEY   # Optional — increases Semantic Scholar rate limits
NEXT_PUBLIC_APP_URL        # App URL (default: http://localhost:3000)
NEXT_PUBLIC_JOIN_CODE      # Access gate code (if empty, gate is bypassed)
```

## Known Build Issues

- `/_global-error` fails to prerender — Next.js 16.1.6 Turbopack regression where `OuterLayoutRouter` calls `useContext(LayoutRouterContext)` = null during static generation. Build fails with `useContext(LayoutRouterContext) = null` if `NODE_ENV=development` is set in shell. Fix: run `NODE_ENV=production pnpm build`. With correct NODE_ENV, build succeeds fully (only `/_global-error` fails, which is the unfixable Next.js regression). Dev server works fine regardless.
- `ToasterProvider` uses `useSyncExternalStore(subscribe, () => true, () => false)` pattern to avoid sonner 2.x incompatibility with Next.js 16 static generation.

## Path Aliases

`@/*` maps to `./src/*` (configured in tsconfig.json).
