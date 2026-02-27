# ScribeX Feature Status

Last verified: **February 27, 2026**.

This status is based on current implementation in the repository, not aspirational roadmap copy.

## 1. Status Matrix

| Area | Status | Evidence In Code |
|------|--------|-----------------|
| Mercury proxy routing (`chat/apply/fim/edit`) | Implemented | `src/app/api/mercury/route.ts` endpoint map |
| Streaming chat generation | Implemented | `streamChatCompletion` + editor/panel usage |
| Diffusion drafting UX | Implemented | `diffusing` stream handling + `DiffusionOverlay` |
| Quick edit and deep rewrite modes | Implemented | `applyEdit` + rewrite stream flow in `editor-canvas` |
| FIM autocomplete ghost text | Implemented | `ghost-text` extension + `fimCompletion` |
| Structured manuscript review tab | Implemented | `structuredChatCompletion` with `REVIEW_JSON_SCHEMA` |
| Citation search route and insertion | Implemented | `api/citations` + `CitationSearch` + insertion logic |
| Citation style normalization (6 styles) | Implemented | `normalizeCitationStyleSelection` + `CITATION_STYLE_CATALOG` |
| Slash command workflow (13 commands) | Implemented | `SLASH_COMMANDS` + `SlashCommandMenu` |
| Local persistence + hydration | Implemented | Zustand persist + `useHydration` |
| Autosave + unload safety saves | Implemented | interval + `beforeunload` + `visibilitychange` |
| Join code gate | Implemented | `JoinGate` with `NEXT_PUBLIC_JOIN_CODE` |
| Export dialog UI | Implemented | Dialog wired from toolbar with format selection + options |
| Export: PDF | Implemented | `src/lib/export/pdf.ts` — html2pdf.js via hidden iframe |
| Export: DOCX | Implemented | `src/lib/export/docx.ts` — `docx` library with full DOM conversion |
| Export: Markdown | Implemented | `src/lib/export/markdown.ts` — `turndown` with custom rules |
| Export: HTML | Implemented | `src/lib/export/html.ts` — standalone document with embedded CSS |
| Export: BibTeX | Implemented | `src/lib/export/bibtex.ts` — entry type detection + author formatting |
| Export: LaTeX | Implemented | `src/lib/export/latex.ts` — HTML-to-LaTeX with 12-package preamble |
| Export sanitization | Implemented | `src/lib/export/sanitize.ts` — XSS prevention for exported content |
| Math (KaTeX) support | Implemented | `@tiptap/extension-mathematics` with `$$`/`$$$` delimiters |
| Mermaid diagram support | Implemented | `src/lib/extensions/mermaid-block.tsx` custom TipTap node |
| Superscript / Subscript | Implemented | `@tiptap/extension-superscript` + `@tiptap/extension-subscript` |
| CSRF protection | Implemented | `src/middleware.ts` origin validation |
| Rate limiting | Implemented | `src/middleware.ts` sliding window, 60 req/min per IP |
| Paper templates (7 templates) | Implemented | `PAPER_TEMPLATES` in constants |
| E2E test suite | Implemented | 10 Playwright specs in `e2e/` |

## 2. Export System Detail

All 6 export formats are fully implemented with real format-specific logic:

| Format | Engine | Key Capabilities |
|--------|--------|-----------------|
| PDF | html2pdf.js | Hidden iframe rendering, hex colors (oklch workaround), inline CSS |
| DOCX | docx | Math (Cambria Math font), tables, ordered/bullet lists, blockquotes, code blocks, images (placeholder), TOC, header/footer |
| Markdown | turndown | Custom rules for inline/block math, mermaid, super/subscript, strikethrough, underline, GFM tables |
| HTML | Custom | Google Fonts, KaTeX CDN, print media queries, full typography system |
| BibTeX | Custom | BibTeX special character escaping, entry type detection (article vs inproceedings), author Last/First formatting, double-braced titles |
| LaTeX | Custom | DOMParser traversal, 12 packages (geometry, listings, hyperref, etc.), math passthrough, mermaid as comments |

Supporting utilities:
- `sanitize.ts` — Regex-based strip of scripts, iframes, objects, event handlers, javascript: URLs
- `download.ts` — `downloadText()` and `downloadBlob()` wrappers over `file-saver`
- `cite-utils.ts` — `generateCiteKey()` with LastName+Year pattern and a/b/c deduplication

## 3. Known Constraints

- Persistence is local browser storage; there is no server-backed paper database in current code.
- Access gating uses client-side join code and is not a full authentication/authorization stack.
- Plan/usage limit constants exist in `PLAN_LIMITS`, but there is no active backend enforcement path.
- Citation route depends on Semantic Scholar availability and rate limits.
- Rate limiting is in-memory (single-process); not suitable for multi-region deployment without Redis.
- Math extension uses non-standard delimiters (`$$`/`$$$` instead of standard LaTeX `$`/`$$`).

## 4. Next Milestones

1. Add server-backed document persistence and user authentication.
2. Implement plan tier enforcement (backend gating for `PLAN_LIMITS`).
3. Add collaborative editing support.
4. Improve export fidelity (image embedding in DOCX, mermaid rendering in LaTeX).
5. Add CI pipeline for automated lint, type-check, and E2E tests on PR.

## 5. Verification Notes

- `pnpm lint` passes.
- `npx tsc --noEmit` type-checks successfully.
- E2E tests require `pnpm dev` running; configured for Chromium only.
