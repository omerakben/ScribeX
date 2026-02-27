# ScribeX Launch Kit

Last verified: **February 27, 2026**.

Use this file for GitHub, LinkedIn, and blog publication copy. Keep statements consistent with current repository status and source attribution.

## 1. Messaging Guardrails

- Describe ScribeX as a workflow wrapper and writing UI built on Mercury APIs.
- Attribute Mercury performance/architecture claims to Inception sources.
- All 6 export formats (PDF, DOCX, Markdown, HTML, BibTeX, LaTeX) are implemented and functional.
- Avoid claiming independent benchmark results unless you publish your own methodology.

## 2. Reusable Core Positioning

Short value statement:

> ScribeX is an academic writing workspace that wraps Inception Mercury APIs with editor-native drafting, rewriting, review, citation, and multi-format export workflows.

Long value statement:

> ScribeX helps researchers move from first draft to publication-ready manuscript inside one workspace. It integrates Mercury-powered writing modes, structured review, citation search, and export to PDF, Word, Markdown, HTML, BibTeX, and LaTeX — all in a local-first editor.

Attribution-safe model context line:

> Inception describes its diffusion approach as enabling the world's fastest, most efficient AI models with best-in-class quality (source: inceptionlabs.ai).

## 3. GitHub Description Variants

### Variant A (concise)

ScribeX is an AI-assisted academic writing workspace built on Inception Mercury APIs, with drafting modes, review workflows, citation search, and multi-format export in one editor.

### Variant B (technical)

Next.js + TipTap academic editor that wraps Inception Mercury (`chat/apply/fim/edit`) through server-side proxy routes. Adds writing-mode orchestration, citation search, structured review, and export to PDF/DOCX/Markdown/HTML/BibTeX/LaTeX.

### Variant C (publication-focused)

A Mercury-powered research writing tool for drafting, revising, reviewing, and exporting publication-ready manuscripts. Built for researchers shipping real papers.

## 4. LinkedIn Post Variants

### Variant A (builder update)

I built **ScribeX**, an academic writing workspace on top of Inception Mercury APIs.

What it does:

- Mercury-powered drafting, rewrite, and review modes in-editor
- 13 slash commands for writing workflows (generate, expand, simplify, academic, and more)
- Structured manuscript review with scored category feedback
- Citation search and insertion from Semantic Scholar (6 citation styles)
- Export to PDF, Word, Markdown, HTML, BibTeX, and LaTeX
- Local-first persistence and autosave

ScribeX is a workflow layer around Mercury's API capabilities — not just a chat wrapper. It puts the full draft-to-submission loop in one editor.

Sources for model context:

- Introducing Mercury 2: <https://www.inceptionlabs.ai/blog/introducing-mercury-2>
- Inception docs: <https://docs.inceptionlabs.ai/get-started/get-started>

### Variant B (technical audience)

Shipped **ScribeX** — an academic writing workspace built on Mercury diffusion models:

- Next.js 16 App Router + TipTap v3 editor
- Mercury wrapper for stream/structured/edit/FIM flows
- Server-side proxy route to keep `INCEPTION_API_KEY` out of client code
- 6 export formats: PDF (html2pdf.js), DOCX (docx lib), Markdown (turndown), HTML, BibTeX, LaTeX
- Citation search via Semantic Scholar with 6 style formats
- CSRF + rate limiting middleware
- 10 Playwright E2E test specs
- Zustand persistence with localStorage hydration

### Variant C (vision + product)

Academic writing is usually split across too many tools.

**ScribeX** brings drafting, rewriting, citation lookup, review, and export into one focused workspace powered by Mercury APIs.

Goal: faster iteration loops for researchers without losing rigor — from blank page to exported PDF/Word/LaTeX in one flow.

## 5. Blog Post Outline (TUEL / Company Site)

Suggested title:

- "Building ScribeX: A Mercury-Powered Academic Writing Workspace"

Outline:

1. **The workflow problem in academic writing**
   - Context switching between drafting, references, review, and export
   - Why generic AI chat is not enough for manuscript workflows

2. **Why Mercury for this build** (source-attributed)
   - Cite Inception Mercury 2 announcement
   - Cite Inception docs for API compatibility and model controls
   - Why low-latency generation changes editor UX design

3. **What ScribeX adds on top of base model access**
   - Writing-mode orchestration (13 slash commands)
   - Diffusion overlay UX
   - Structured review schema
   - Citation-aware insertion and style handling
   - Multi-format export pipeline

4. **Architecture deep dive**
   - `EditorCanvas` and `AIPanel` flow
   - `/api/mercury` proxy and endpoint map
   - `/api/citations` normalization path
   - Local persistence and autosave
   - Export system design (6 formats)

5. **Testing and quality**
   - Playwright E2E test suite
   - CSRF + rate limiting middleware
   - Export sanitization

6. **Current status and roadmap**
   - Fully implemented features
   - Next milestones (server persistence, auth, collaboration)

7. **Credits and references**
   - Inception first (model/platform)
   - TUEL AI project context
   - Personal and repo links

## 6. Canonical Attribution Block

Use this block in README/posts/blog:

- Model platform: **Inception Labs**
  - <https://www.inceptionlabs.ai/>
  - <https://www.inceptionlabs.ai/blog/introducing-mercury-2>
  - <https://docs.inceptionlabs.ai/get-started/get-started>
- Project context: **TUEL AI**
  - <https://tuel.ai/>
- Builder:
  - <https://omerakben.com/>
  - <https://github.com/omerakben/ScribeX>

## 7. Canonical Links

- Inception homepage: <https://www.inceptionlabs.ai/>
- Introducing Mercury 2: <https://www.inceptionlabs.ai/blog/introducing-mercury-2>
- Inception docs get started: <https://docs.inceptionlabs.ai/get-started/get-started>
- TUEL AI: <https://tuel.ai/>
- Omer Akben: <https://omerakben.com/>
- ScribeX repo: <https://github.com/omerakben/ScribeX>
