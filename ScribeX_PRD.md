# Product Requirements Document (PRD)

# **ScribeX** — Mercury-Powered Academic Paper Writing Assistant

**Version:** 1.0 · **Date:** February 26, 2026 · **Author:** Ozzy Akben / TUEL AI
**Status:** Draft · **Classification:** Internal / Hackathon Submission
<https://docs.inceptionlabs.ai/get-started/models#mercury-edit>
<https://docs.inceptionlabs.ai/get-started/models#mercury-2>

---

## 1. Executive Summary

ScribeX is a real-time, canvas-style academic paper writing assistant powered exclusively by Inception Labs' Mercury diffusion language models. Unlike every competitor in the academic writing space (Paperpal, Jenni AI, Paperguide, Yomu AI), which rely on slow autoregressive models that generate text one token at a time, ScribeX leverages Mercury 2's diffusion-based architecture to deliver **1,000+ tokens/second** — making the writing experience feel instantaneous. The core thesis: academic writing is an iterative refinement process, and diffusion models — which work by refining a "rough sketch" into a polished output through parallel denoising — are architecturally perfect for this workflow. Mercury doesn't just write faster; it *thinks* the way academic writers think: draft broadly, then refine iteratively.

The product combines Mercury 2 (reasoning + generation, 128K context window) for deep academic content generation with Mercury Edit (apply-edit model, 92% accuracy at 46x the speed of GPT-5) for blazing-fast inline edits, creating a dual-model architecture where each model handles what it's best at.

**Target users:** Researchers, PhD students, professors, and academic professionals who write papers, theses, literature reviews, and grant proposals.

**Key differentiators:**

- Only academic writing tool built on diffusion LLMs (not autoregressive)
- Sub-second response times for every interaction (no "thinking" spinners)
- Canvas editor with real-time "diffusion visualization" — users can watch text refine from rough to polished
- Mercury Edit-powered inline editing that preserves document structure and voice
- 128K context window enables full-paper awareness (most competitors cap at 32K)

---

## 2. Problem Statement

### 2.1 The Academic Writing Pain

Academic writing is one of the most time-intensive intellectual activities. A single peer-reviewed paper takes an average of 3–6 months from first draft to submission. The process involves literature discovery, argument structuring, drafting, citation management, revision cycles, and tone calibration — all of which are cognitively demanding and inherently iterative.

### 2.2 Why Current AI Tools Fall Short

Every major academic AI writing tool in 2026 (Paperpal, Jenni AI, Paperguide, Yomu, SciSpace) shares the same fundamental bottleneck: they are built on autoregressive models (GPT, Claude, Gemini variants) that generate text sequentially — one token at a time. This creates several problems specific to academic workflows:

**Latency kills flow state.** Academic writing requires deep concentration. When a researcher asks the AI to expand a paragraph, rephrase an argument, or generate a literature review section, waiting 5–15 seconds breaks the cognitive thread. Studies show that interruptions of even 3 seconds reduce task performance significantly.

**Cost limits iteration.** Academic writing is inherently iterative — researchers rewrite sections 10–20 times. At frontier model pricing ($1–5/M output tokens), heavy iteration becomes expensive. Mercury 2's pricing at $0.25/$0.75 per million input/output tokens makes unlimited iteration economically viable.

**Context windows are too small.** Most tools use models with 32K or less effective context. An average research paper is 8,000–12,000 words (roughly 10K–15K tokens) *before* adding cited sources, notes, and instructions. This means current tools lose awareness of earlier sections while editing later ones, leading to inconsistencies in argument flow, terminology, and tone.

**No tool handles "edit-in-place" well.** Existing tools either regenerate entire sections (losing nuance) or offer superficial word-level suggestions. None can intelligently merge edits while preserving document structure, comments, and academic voice — which is exactly what Mercury Edit was designed to do.

### 2.3 The Mercury Advantage

Mercury 2 and Mercury Edit solve these problems at the architectural level:

| Challenge                | Autoregressive Models                 | Mercury dLLMs                           |
| ------------------------ | ------------------------------------- | --------------------------------------- |
| Generation speed         | ~100 tokens/sec                       | 1,000+ tokens/sec                       |
| Edit application         | Regenerate full sections              | Surgical apply-edit (92% accuracy)      |
| Context window           | 32K–128K (but slow at scale)          | 128K native, fast throughout            |
| Cost per M output tokens | $0.75–$5.00                           | $0.75                                   |
| Iteration budget         | ~20 calls/session economically        | ~200+ calls/session at same cost        |
| Error correction         | Committed per-token (can't backtrack) | Mid-generation correction via denoising |

---

## 3. Product Vision

### 3.1 One-Liner

"Write academic papers at the speed of thought — powered by the world's fastest reasoning model."

### 3.2 Vision Statement

ScribeX reimagines academic writing as a real-time collaboration between researcher and AI. Instead of the current paradigm where writers type, wait, review, and repeat, ScribeX creates a fluid canvas where ideas materialize instantly, edits land surgically, and the AI maintains perfect awareness of the entire document at all times. The diffusion visualization feature — where users can optionally watch text refine from noisy to polished — isn't just a gimmick; it's a transparency mechanism that builds trust by showing the AI's "thinking process," which is critical for academic integrity.

### 3.3 Design Principles

1. **Speed is the feature.** Every interaction should feel instantaneous. No loading spinners, no "generating..." messages. Mercury's architecture makes this possible — we should never compromise it with slow UI patterns.

2. **The researcher is always the author.** ScribeX assists, suggests, and accelerates — but the human owns the argument. Every AI contribution should be clearly attributable and easily modifiable. The tool teaches thinking and refines expression; it never replaces the researcher's intellectual contribution.

3. **Full-paper awareness, always.** The 128K context window means ScribeX should *always* have the complete paper in context. No "lost context" errors. No inconsistencies between sections. The AI should reference earlier arguments when helping with later ones.

4. **Academic integrity by design.** Every AI-generated or AI-modified passage is tracked. Users can generate an "AI contribution report" showing exactly what was AI-assisted, suitable for journal disclosure requirements.

5. **Diffusion-native UX.** The UI should embrace the diffusion paradigm — iterative refinement, parallel exploration, and progressive improvement — rather than mimicking the linear, chat-based interfaces that autoregressive models demand.

---

## 4. User Personas

### 4.1 Primary: Dr. Sarah Chen — Postdoctoral Researcher

**Background:** Computational Biology, Stanford. Publishes 3–5 papers/year. Writes in English (non-native speaker).
**Pain points:** Spends 40% of writing time on phrasing and tone calibration. Current tools are too slow for her iterative workflow. Needs to maintain consistent terminology across 20+ page manuscripts. Frequently switches between writing and reading cited papers.
**ScribeX value:** Sub-second rephrasing. Full-paper context ensures terminology consistency. Academic tone enforcement trained on millions of published papers. Citation-aware suggestions.

### 4.2 Secondary: Marcus Williams — PhD Candidate (Year 3)

**Background:** Political Science, Duke. Working on dissertation (5 chapters, 200+ pages).
**Pain points:** Writer's block on literature reviews. Needs help structuring arguments across chapters. Budget-conscious — can't afford premium AI tools. Worried about academic integrity policies.
**ScribeX value:** Affordable unlimited iteration (Mercury's low cost). Outline-to-prose expansion. AI contribution tracking for academic integrity compliance. Chapter-to-chapter coherence via 128K context.

### 4.3 Tertiary: Prof. Yuki Tanaka — Department Chair

**Background:** Materials Science, MIT. Reviews dozens of student papers. Writes grant proposals.
**Pain points:** Needs to quickly review and provide feedback on student drafts. Grant proposal writing requires precise language within strict word limits. Needs collaborative features.
**ScribeX value:** Instant document review with suggested edits (Mercury Edit). Word-count-aware generation. Collaborative editing with role-based permissions.

---

## 5. Technical Architecture

### 5.1 Dual-Model Architecture

ScribeX uses a purpose-built dual-model system that routes requests to the optimal Mercury model:

```
┌─────────────────────────────────────────────────┐
│                 ScribeX Canvas UI                │
│         (Next.js + TipTap/ProseMirror)           │
├─────────────────────────────────────────────────┤
│              Intelligent Router                  │
│   ┌──────────────┐     ┌──────────────────┐     │
│   │  Mercury 2    │     │  Mercury Edit     │     │
│   │  (Reasoning)  │     │  (Apply-Edit)     │     │
│   │               │     │                   │     │
│   │ • Generation  │     │ • Inline edits    │     │
│   │ • Reasoning   │     │ • FIM completion  │     │
│   │ • Analysis    │     │ • Next-edit       │     │
│   │ • Structuring │     │ • Apply patches   │     │
│   │ • Citations   │     │ • Autocomplete    │     │
│   └──────────────┘     └──────────────────┘     │
├─────────────────────────────────────────────────┤
│              Supporting Services                 │
│  ┌─────────┐ ┌──────────┐ ┌─────────────────┐  │
│  │ Semantic │ │ Citation │ │   Document      │  │
│  │ Scholar  │ │  Engine  │ │   State Engine  │  │
│  │   API    │ │ (CSL)    │ │  (CRDT/Yjs)    │  │
│  └─────────┘ └──────────┘ └─────────────────┘  │
└─────────────────────────────────────────────────┘
```

### 5.2 Model Routing Logic

The Intelligent Router determines which Mercury model handles each request:

**Mercury 2** (`/v1/chat/completions`, model: `mercury-2`) handles:

- New content generation (paragraphs, sections, outlines)
- Reasoning tasks (argument analysis, logical flow checking)
- Literature review synthesis and summarization
- Citation suggestion and verification
- Structural recommendations and feedback
- Complex rephrasing that requires understanding context

**Mercury Edit** (`/v1/apply/completions`, model: `mercury-edit`) handles:

- Inline edits (grammar, word choice, sentence restructuring)
- Apply-edit operations using `<|original_code|>` / `<|update_snippet|>` format
- Fill-in-the-middle completions (`/v1/fim/completions`) for sentence/paragraph completion
- Next-edit predictions (`/v1/edit/completions`) for proactive suggestions
- Autocomplete as the user types

**Routing heuristic:**

```
IF action is "generate new content" → Mercury 2
IF action is "edit existing text" AND edit_scope < 500 tokens → Mercury Edit
IF action is "edit existing text" AND edit_scope >= 500 tokens → Mercury 2
IF action is "autocomplete" → Mercury Edit (FIM endpoint)
IF action is "suggest next edit" → Mercury Edit (next-edit endpoint)
IF action is "analyze/reason about content" → Mercury 2
```

### 5.3 API Integration Specifications

**Mercury 2 — Chat Completions:**

```javascript
const response = await fetch('https://api.inceptionlabs.ai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${INCEPTION_API_KEY}`
  },
  body: JSON.stringify({
    model: 'mercury-2',
    messages: [
      { role: 'system', content: ACADEMIC_SYSTEM_PROMPT },
      { role: 'user', content: userRequest }
    ],
    max_tokens: 10000,
    stream: true,  // Enable streaming for real-time display
    temperature: 0.3  // Lower temperature for academic precision
  })
});
```

**Mercury Edit — Apply Edit:**

```javascript
const response = await fetch('https://api.inceptionlabs.ai/v1/apply/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${INCEPTION_API_KEY}`
  },
  body: JSON.stringify({
    model: 'mercury-edit',
    messages: [{
      role: 'user',
      content: `<|original_code|>\n${selectedText}\n<|/original_code|>\n\n<|update_snippet|>\n${editInstruction}\n<|/update_snippet|>`
    }],
    max_tokens: 8192,
    temperature: 0.0  // Zero temperature for deterministic edits
  })
});
```

**Mercury Edit — Fill-in-the-Middle (Autocomplete):**

```javascript
const response = await fetch('https://api.inceptionlabs.ai/v1/fim/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${INCEPTION_API_KEY}`
  },
  body: JSON.stringify({
    model: 'mercury-edit',
    prompt: textBeforeCursor,
    suffix: textAfterCursor,
    max_tokens: 512,
    presence_penalty: 1.5,
    temperature: 0.0
  })
});
```

### 5.4 Tech Stack

| Layer            | Technology                                | Rationale                                                                                   |
| ---------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------- |
| Frontend         | Next.js 15 (App Router) + React 19        | Server components for fast initial load; streaming support                                  |
| Editor           | TipTap (ProseMirror)                      | Best extensible rich-text editor; supports custom nodes, decorations, collaborative editing |
| Real-time sync   | Yjs (CRDT) + y-websocket                  | Conflict-free collaborative editing; works offline                                          |
| State management | Zustand + React Query                     | Lightweight; perfect for streaming API responses                                            |
| Backend          | Next.js API Routes + Edge Functions       | Low latency; streaming proxy to Mercury API                                                 |
| Database         | PostgreSQL (Supabase)                     | Document storage, user data, version history                                                |
| Vector store     | pgvector (via Supabase)                   | Citation embeddings, semantic search across papers                                          |
| Auth             | Clerk or Supabase Auth                    | Academic SSO (ORCID, institutional)                                                         |
| Citation engine  | Citation.js (CSL)                         | 10,000+ citation styles (APA, MLA, Chicago, IEEE, etc.)                                     |
| Export           | Pandoc (server-side)                      | Export to .docx, .pdf, LaTeX, Markdown                                                      |
| Deployment       | Vercel (frontend) + Railway/Fly (backend) | Edge-optimized for global academic users                                                    |

### 5.5 Diffusion Visualization System

Mercury's API supports a `diffusing: true` parameter that streams blocks of noisy tokens being refined into final output. ScribeX uses this for a unique "Diffusion View" feature:

```
Step 1 (noisy):    "The ███████ of ██████ learning ████ demonstrates..."
Step 2 (refining):  "The implications of reinforcement learning models demonstrates..."
Step 3 (polished):  "The implications of reinforcement learning models demonstrate..."
```

This is rendered as a smooth animation in the canvas, showing text crystallizing from rough to polished. Users can toggle this on/off. It serves dual purposes: it's visually engaging AND it builds trust by showing the AI's iterative process — critical for academic users concerned about AI transparency.

---

## 6. Feature Specification

### 6.1 Canvas Editor (Core)

The canvas is a full-featured academic document editor with Mercury-powered intelligence woven into every interaction.

**6.1.1 Editor Foundation**

- Rich text editing with academic formatting: headings, footnotes, equations (KaTeX), tables, figures, blockquotes
- Section-based document structure (Abstract, Introduction, Methods, Results, Discussion, etc.)
- Real-time word count, reading time, and readability scores per section
- Split-pane view: editor on left, AI panel on right (collapsible)
- Dark mode with academic-friendly typography (Crimson Pro / Source Serif for body, JetBrains Mono for code)

**6.1.2 Mercury-Powered Writing Modes**

| Mode                | Trigger                    | Model                      | Description                                               |
| ------------------- | -------------------------- | -------------------------- | --------------------------------------------------------- |
| **Compose**         | Start writing or Cmd+G     | Mercury 2                  | Generate new content from an outline, notes, or prompt    |
| **Autocomplete**    | Pause while typing (300ms) | Mercury Edit (FIM)         | Ghost text appears ahead of cursor; Tab to accept         |
| **Quick Edit**      | Select text + Cmd+E        | Mercury Edit (Apply)       | Inline edit: rephrase, make academic, simplify, expand    |
| **Deep Rewrite**    | Select text + Cmd+Shift+E  | Mercury 2                  | Full contextual rewrite with argument-aware restructuring |
| **Next Edit**       | Proactive (background)     | Mercury Edit (Next-Edit)   | AI predicts what you'll edit next and pre-suggests        |
| **Review**          | Cmd+Shift+R                | Mercury 2                  | Full-document review with structural feedback             |
| **Diffusion Draft** | Cmd+D                      | Mercury 2 (diffusing=true) | Watch text crystallize from noise — brainstorming mode    |

**6.1.3 Inline Command Palette (Slash Commands)**

Typing `/` in the editor opens a command palette:

- `/generate [instruction]` — Generate content based on instruction
- `/expand` — Expand the current paragraph with more detail
- `/simplify` — Simplify complex sentences
- `/academic` — Elevate tone to formal academic register
- `/cite [topic]` — Find and insert relevant citations
- `/outline` — Generate a section outline
- `/counter` — Generate a counter-argument to the current paragraph
- `/evidence` — Find supporting evidence for the current claim
- `/transition` — Generate a transition to the next section
- `/abstract` — Auto-generate abstract from full paper

### 6.2 Academic Intelligence Features

**6.2.1 Argument Flow Analyzer**

Uses Mercury 2's reasoning capability + 128K context to analyze the logical flow of an entire paper:

- Maps claim → evidence → conclusion chains
- Identifies unsupported claims, logical gaps, and circular reasoning
- Suggests where additional evidence or citations are needed
- Visualizes argument structure as an interactive graph (using D3.js)

**6.2.2 Citation Intelligence**

Integration with Semantic Scholar API + OpenAlex for academic paper discovery:

- `/cite` command searches 200M+ papers and suggests relevant citations
- Auto-generates in-text citations in any style (APA 7, MLA 9, Chicago, IEEE, etc.)
- Reference list auto-maintained and formatted
- "Citation health check" — flags overcitation, undercitation, citation clusters, and outdated sources
- DOI-based citation verification (checks that cited papers actually say what's claimed)

**6.2.3 Section Templates & Scaffolding**

Pre-built templates powered by Mercury 2:

- IMRAD (Introduction, Methods, Results, And Discussion)
- Literature Review (thematic, chronological, methodological)
- Systematic Review (PRISMA-compliant)
- Grant Proposal (NSF, NIH, ERC formats)
- Thesis Chapter
- Conference Paper (ACM, IEEE, AAAI formats)

Each template includes section-specific prompts. For example, the Methods section template automatically prompts for: study design, participants, materials, procedure, and analysis plan.

**6.2.4 Consistency Guardian**

A background process that uses Mercury 2 to monitor:

- Terminology consistency (e.g., "machine learning" vs "ML" — pick one and stick with it)
- Tense consistency (past tense for methods, present for discussion)
- Abbreviation tracking (first use expanded, subsequent abbreviated)
- Figure/table reference accuracy
- Heading hierarchy and numbering
- Cross-section argument coherence

**6.2.5 Academic Tone Calibrator**

Mercury 2 is prompted with a rubric trained on millions of published papers to:

- Score text on an "academic register" scale (1–10)
- Flag informal language, hedging overuse, passive voice excess
- Suggest discipline-specific improvements (e.g., humanities vs STEM writing conventions)
- Adapt to target journal style (upload a sample paper from the journal)

### 6.3 Mercury Edit-Powered Features

**6.3.1 Surgical Inline Editing**

When a user selects text and triggers Quick Edit, Mercury Edit applies changes while preserving:

- Surrounding context and document structure
- Author's voice and established terminology
- Citation formatting and footnote references
- Sentence-level edits only (no scope creep into neighboring paragraphs)

**6.3.2 Smart Autocomplete**

Mercury Edit's FIM endpoint powers ghost-text autocomplete that appears as the user types:

- Activated after 300ms pause
- Aware of the full document context (sends surrounding text as prefix/suffix)
- Tuned for academic language patterns
- Tab to accept, Esc to dismiss, arrow keys to see alternatives
- Learns from the user's writing style within the session

**6.3.3 Predictive Next-Edit**

Mercury Edit's next-edit endpoint proactively suggests the next change the user should make:

- Analyzes recent edit history (diff pattern)
- Predicts the next likely edit location and type
- Displays as a subtle highlight with a one-click apply
- Example: if the user just changed "shows" to "demonstrates" in one paragraph, the system suggests the same change in other paragraphs

### 6.4 Collaboration & Export

**6.4.1 Real-Time Collaboration**

- Multi-user editing with Yjs/CRDT
- User cursors with names
- Commenting system with threaded replies
- Suggested edits (like Google Docs) powered by Mercury Edit
- Role-based permissions: Author, Reviewer, Viewer

**6.4.2 Version History**

- Auto-save every 30 seconds
- Named version snapshots ("Pre-reviewer-2 revision")
- Diff view between any two versions
- AI contribution tracking: every AI-generated or AI-modified passage is logged

**6.4.3 Export Options**

- PDF (via Pandoc + LaTeX)
- Microsoft Word (.docx)
- LaTeX source (with BibTeX)
- Markdown
- HTML
- Overleaf direct push (via API)
- Journal-specific submission formats

**6.4.4 AI Contribution Report**

- Generates a detailed log of all AI interactions
- Classifies contributions: generated, edited, suggested, autocompleted
- Exportable as a supplementary document for journal submission
- Compliant with emerging AI disclosure requirements (Nature, Science, IEEE policies)

---

## 7. User Experience Flows

### 7.1 New Paper Flow

```
1. User clicks "New Paper"
2. Selects template (IMRAD, Literature Review, etc.) or blank
3. Enters paper title, field, target journal (optional)
4. Mercury 2 generates an intelligent outline based on inputs
5. User reviews and adjusts outline in the canvas
6. For each section, user can:
   a. Write manually (with autocomplete from Mercury Edit)
   b. Use /generate to produce a first draft
   c. Paste existing notes and use /expand or /academic
7. As paper grows, Consistency Guardian runs in background
8. User triggers /review for full-paper feedback when ready
```

### 7.2 Edit Existing Paper Flow

```
1. User uploads .docx, .pdf, or .tex file
2. ScribeX parses and renders in canvas editor
3. Full document is loaded into Mercury 2's 128K context
4. User can:
   a. Select text → Quick Edit (Mercury Edit)
   b. Select text → Deep Rewrite (Mercury 2)
   c. Run full-paper Review
   d. Use Argument Flow Analyzer
   e. Run Citation Health Check
5. All edits are tracked with change attribution
```

### 7.3 Diffusion Draft (Brainstorming) Flow

```
1. User enters Diffusion Draft mode (Cmd+D)
2. Types a rough idea or prompt
3. Mercury 2 generates with diffusing=true
4. Canvas shows text crystallizing in real-time (noisy → refined)
5. User can "freeze" interesting intermediate states
6. Multiple frozen versions appear as cards
7. User picks the best version and it drops into the main document
8. This flow is perfect for exploring different phrasings or arguments
```

---

## 8. Competitive Landscape & Positioning

| Feature                      | ScribeX                 | Paperpal      | Jenni AI      | Paperguide    | Yomu AI       |
| ---------------------------- | ----------------------- | ------------- | ------------- | ------------- | ------------- |
| **Underlying model**         | Mercury 2 (dLLM)        | GPT-based     | GPT-based     | GPT-based     | GPT-based     |
| **Response speed**           | <1 sec                  | 3–8 sec       | 3–10 sec      | 5–12 sec      | 3–8 sec       |
| **Context window**           | 128K tokens             | ~32K          | ~32K          | ~32K          | ~16K          |
| **Canvas editor**            | Full-featured           | Basic         | Yes           | Basic         | Yes           |
| **Inline edit-in-place**     | Mercury Edit (surgical) | Rewrite-based | Rewrite-based | Rewrite-based | Rewrite-based |
| **Autocomplete**             | FIM-powered, 300ms      | None          | Yes           | None          | None          |
| **Diffusion visualization**  | Yes (unique)            | No            | No            | No            | No            |
| **AI contribution tracking** | Full audit log          | None          | None          | None          | None          |
| **Argument flow analysis**   | Yes                     | No            | No            | No            | No            |
| **Citation integration**     | 200M+ papers            | 250M+ papers  | 2,600+ styles | Yes           | Limited       |
| **Cost to user**             | $15–25/mo               | $11.50–25/mo  | Free–$20/mo   | $12–24/mo     | $6–15/mo      |

**ScribeX's unique moat:** No competitor can match our speed without switching to diffusion models. Autoregressive architecture has a fundamental ceiling on token generation speed. Mercury's 10x advantage isn't from hardware optimization — it's from a fundamentally different approach. Competitors would need to rebuild their entire stack to match us.

---

## 9. Pricing Strategy

| Plan               | Price  | Target                      | Includes                                                                              |
| ------------------ | ------ | --------------------------- | ------------------------------------------------------------------------------------- |
| **Scholar** (Free) | $0/mo  | Students trying the product | 50K tokens/day, basic editor, 3 papers                                                |
| **Researcher**     | $19/mo | Active researchers          | 500K tokens/day, full editor, unlimited papers, citation integration, export          |
| **Lab**            | $39/mo | Power users, PhD students   | 2M tokens/day, collaboration (up to 5 users), version history, AI contribution report |
| **Institution**    | Custom | Universities, departments   | Unlimited tokens, SSO, admin dashboard, FERPA compliance, bulk licensing              |

**Cost basis:** Mercury 2 at $0.25/$0.75 per M input/output tokens means our Researcher tier costs approximately $0.50–$2/day in API costs per active user, leaving healthy margins.

---

## 10. Mercury-Specific Technical Considerations

### 10.1 Diffusion Model Constraints

Mercury 2, while incredibly fast, has known trade-offs to design around:

- **Quality at 85–95% of frontier AR models on complex reasoning.** Mitigation: Use Mercury 2 for drafting and iteration; optionally offer a "deep quality check" mode that runs slower verification. For academic content where accuracy is paramount, we'll implement a confidence-scoring system.

- **Text-only (no multimodal input).** Mitigation: Use separate services for figure analysis, table extraction from PDFs, and image processing. Mercury handles all text-based tasks.

- **No image generation.** Mitigation: Integrate with external services for figure generation; focus Mercury on what it does best — text.

### 10.2 Optimizing for Mercury's Strengths

- **Parallel exploration:** Since Mercury generates entire blocks in parallel, ScribeX can request 3 variations simultaneously and show them as options — something that would take 3x the time with AR models.

- **Iterative refinement native:** Mercury's denoising architecture means it can correct errors mid-generation. We exploit this by using higher temperature for initial drafts and lower temperature for edits.

- **Massive throughput for background tasks:** Mercury's speed means we can run Consistency Guardian, Citation Health Check, and Argument Flow Analysis continuously in the background without impacting the user's active editing experience.

### 10.3 Failover and Reliability

- Primary: Inception Labs API (direct)
- Secondary: OpenRouter (Mercury 2 available)
- Circuit breaker pattern: If Mercury API latency exceeds 3 seconds (unusual), queue requests and show cached suggestions
- Offline mode: Editor works fully offline; AI features queue until reconnection

---

## 11. Success Metrics & KPIs

### 11.1 North Star Metric

**Weekly Active Writers (WAW):** Users who write or edit at least 500 words in the canvas per week.

### 11.2 Product Metrics

| Metric                           | Target (Month 3) | Target (Month 12) |
| -------------------------------- | ---------------- | ----------------- |
| Registered users                 | 5,000            | 50,000            |
| Weekly Active Writers            | 1,500            | 15,000            |
| Avg. AI interactions per session | 25               | 40                |
| Avg. session duration            | 35 min           | 50 min            |
| Papers exported per user/month   | 1.5              | 3.0               |
| Free → Paid conversion           | 8%               | 15%               |
| User satisfaction (CSAT)         | 4.2/5            | 4.6/5             |
| Avg. response latency (P95)      | <800ms           | <500ms            |

### 11.3 Academic Impact Metrics

- Papers published by ScribeX users (tracked via opt-in)
- Time savings reported (target: 40% reduction in writing time)
- Citation accuracy rate (target: >95% correct formatting)
- AI contribution disclosure compliance rate (target: 100%)

---

## 12. Development Roadmap

### Phase 1: MVP (Weeks 1–6)

- Canvas editor with TipTap
- Mercury 2 integration (generation, rewriting)
- Mercury Edit integration (inline edits, autocomplete)
- Basic citation search (Semantic Scholar)
- Export to .docx and PDF
- User auth and document storage
- Scholar (free) and Researcher plans

### Phase 2: Academic Intelligence (Weeks 7–12)

- Argument Flow Analyzer
- Consistency Guardian (background)
- Academic Tone Calibrator
- Section templates and scaffolding
- Diffusion visualization mode
- AI contribution tracking and reporting
- Citation health check

### Phase 3: Collaboration & Scale (Weeks 13–20)

- Real-time multi-user collaboration (Yjs)
- Version history with diff view
- Institutional SSO and admin dashboard
- Overleaf integration
- LaTeX export
- Lab and Institution plans

### Phase 4: Platform Expansion (Weeks 21+)

- Journal-specific submission formatting
- Peer review assistant mode
- Grant proposal specialized workflows
- Mobile app (React Native)
- Browser extension for reading/annotating papers
- API for third-party integrations

---

## 13. Risks & Mitigations

| Risk                                                 | Probability | Impact | Mitigation                                                                                            |
| ---------------------------------------------------- | ----------- | ------ | ----------------------------------------------------------------------------------------------------- |
| Mercury API downtime/instability                     | Medium      | High   | Multi-provider failover (OpenRouter); offline editor; queue system                                    |
| Academic integrity concerns                          | High        | High   | Transparent AI contribution tracking; disclosure report generator; position as "assistant not author" |
| Mercury quality below frontier for complex reasoning | Medium      | Medium | Confidence scoring; optional "deep check" mode; user always reviews                                   |
| Inception Labs pricing changes                       | Low         | High   | Negotiate volume pricing early; architecture supports model swapping                                  |
| Competitor adopts Mercury                            | Low         | Medium | First-mover advantage; deep academic-specific features are the moat                                   |
| Regulatory changes (AI in academia)                  | Medium      | Medium | Proactive compliance features; adaptable disclosure system                                            |

---

## 14. Appendix

### A. Mercury 2 Model Specifications

- **Architecture:** Diffusion-based LLM (dLLM) — parallel token generation via iterative denoising
- **Speed:** 1,009 tokens/second on NVIDIA Blackwell GPUs
- **Context window:** 128,000 tokens
- **Pricing:** $0.25/M input tokens, $0.75/M output tokens
- **Features:** Tunable reasoning, native tool use, JSON mode, streaming, OpenAI API compatible
- **Endpoints:** `/v1/chat/completions`
- **Latency:** 1.7 seconds end-to-end (vs 14.4s Gemini 3 Flash, 23.4s Claude Haiku 4.5)

### B. Mercury Edit Model Specifications

- **Architecture:** Small, coding/editing-focused dLLM
- **Apply-Edit accuracy:** 92% (matching GPT-5 quality at 46x speed)
- **Max tokens:** 8,192 per request
- **Pricing:** Included in Mercury pricing tier
- **Endpoints:** `/v1/apply/completions`, `/v1/fim/completions`, `/v1/edit/completions`
- **Parameters:** Separate defaults for autocomplete, next-edit, and apply-edit modes

### C. Academic System Prompt (Mercury 2)

```
You are ScribeX, an expert academic writing assistant. You help researchers
write, edit, and improve academic papers with precision and clarity.

RULES:
- Never fabricate citations. Only reference papers you can verify.
- Maintain the author's voice and argument structure.
- Use formal academic register unless instructed otherwise.
- Flag uncertainty explicitly: "This claim may need additional citation."
- When generating content, clearly separate facts from interpretations.
- Respect discipline-specific conventions when specified.
- Never write content intended to deceive reviewers about AI involvement.

CONTEXT: You have the full paper in your context window. Reference earlier
sections when writing later ones. Maintain consistency in terminology,
tense, and argumentation throughout.
```

### D. Mercury Edit Prompt Template (Apply-Edit)

```
<|original_code|>
[Selected text from the document]
<|/original_code|>

<|update_snippet|>
// ... existing text ...
[Modified text with changes applied]
// ... existing text ...
<|/update_snippet|>
```

---

*This PRD is a living document. Last updated: February 26, 2026.*
