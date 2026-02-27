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

No test framework is currently configured.

## Architecture

### Route Structure (Next.js 16 App Router)

- `/` — Landing page (Server Component, assembles landing/ section components)
- `/dashboard` — Paper management hub (client-side, wrapped in `JoinGate` + `Sidebar` layout)
- `/dashboard/citations` | `/dashboard/templates` | `/dashboard/settings` — Dashboard sub-pages
- `/editor/[id]` — Paper editor (client-side, dynamic route by paper ID)

### API Routes (server-side, protect API keys)

- `POST /api/mercury` — Proxy to Inception Labs Mercury API. Accepts `{ endpoint, ...payload }` where endpoint is `chat|apply|fim|edit`. Handles both streaming (SSE passthrough) and non-streaming responses.
- `GET /api/citations?q=&limit=&offset=` — Proxy to Semantic Scholar `/graph/v1/paper/search`. Transforms response to internal `Citation` format.

### Mercury Client (`src/lib/mercury/client.ts`)

All AI features route through this client, which calls the API routes (never the external API directly):
- `streamChatCompletion()` — SSE streaming for compose/generate commands (mercury-2)
- `applyEdit()` — Non-streaming edit operations (mercury-edit)
- `fimCompletion()` — Fill-in-the-middle for autocomplete (mercury-edit)
- `routeToModel()` — Maps `WritingMode` → `MercuryModel` (mercury-2 vs mercury-edit)

### State Management

Two Zustand stores in `src/lib/store/editor-store.ts`:
- `useEditorStore` — Editor state: current paper, AI panel, writing mode, ghost text, diffusion, word count
- `useDashboardStore` — Dashboard state: paper creation, template/citation-style selection, search

### Editor

TipTap (v3) with StarterKit plus extensions: tables, images, links, character count, text align, highlight, typography, underline, code-block-lowlight. Slash command menu (`/`) triggers AI actions defined in `SLASH_COMMANDS` constant. The editor canvas handles command routing — generative commands stream via mercury-2, edit commands use mercury-edit's apply endpoint.

### Design System

- **Tailwind CSS v4** with `@theme` directive in `globals.css` defining three color scales: `brand-*` (editorial navy), `mercury-*` (cool teal), `ink-*` (neutral). Plus semantic colors, surface tokens, and custom shadows.
- **Fonts**: Manrope (sans/UI), Newsreader (serif/editor body), IBM Plex Mono (mono/code)
- **UI components**: shadcn/ui pattern in `src/components/ui/` with barrel export via `index.ts`. Built on Radix primitives + CVA.
- **Animations**: Framer Motion for page transitions; CSS keyframes for `fade-in`, `slide-up`, `scale-in`, `pulse-glow`, `diffuse`, `shimmer`.

### Key Types (`src/lib/types/index.ts`)

Central type definitions: `Paper`, `WritingMode`, `MercuryModel`, `Citation`, `AIMessage`, `SlashCommand`, `DiffusionStep`, `UserProfile`. All Mercury request/response types live here.

### Constants (`src/lib/constants/index.ts`)

`ACADEMIC_SYSTEM_PROMPT`, `SLASH_COMMANDS`, `PAPER_TEMPLATES`, `PLAN_LIMITS`, Mercury API config, and editor timing constants (`AUTOCOMPLETE_DELAY_MS`, `AUTOSAVE_INTERVAL_MS`, `MAX_EDITOR_CONTEXT_TOKENS`).

## Environment Variables

```
INCEPTION_API_KEY          # Required — Mercury API key (server-side only)
SEMANTIC_SCHOLAR_API_KEY   # Optional — increases Semantic Scholar rate limits
NEXT_PUBLIC_APP_URL        # App URL (default: http://localhost:3000)
NEXT_PUBLIC_JOIN_CODE      # Access gate code (if empty, gate is bypassed)
```

## Path Aliases

`@/*` maps to `./src/*` (configured in tsconfig.json).
