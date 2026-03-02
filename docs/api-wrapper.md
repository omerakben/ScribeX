# Mercury API Wrapper Reference

Last verified: **March 1, 2026**.

This document explains the ScribeX Mercury wrapper layer implemented in `src/lib/mercury/client.ts` and how it maps to `src/app/api/mercury/route.ts`.

## 1. Wrapper Purpose

ScribeX uses a browser-side wrapper to standardize AI calls while delegating credentialed upstream requests to a server route.

Wrapper responsibilities:

- Normalize request patterns for chat/edit/FIM flows
- Provide stream callbacks for UI updates
- Inject academic system prompt for chat flows
- Support reasoning-effort and diffusion options
- Dynamic token cap calculation based on input length
- Thin client methods for humanizer and detection endpoints

Route responsibilities:

- Map logical endpoint keys to Inception API paths
- Attach bearer auth from `INCEPTION_API_KEY`
- Proxy streaming and non-streaming responses

Middleware responsibilities (`src/proxy.ts`):

- CSRF validation (origin header check against `NEXT_PUBLIC_APP_URL`)
- Rate limiting (60 req/min per IP, in-memory sliding window)

## 2. Endpoint Mapping (`POST /api/mercury`)

`src/app/api/mercury/route.ts` maps:

- `chat` → `/chat/completions`
- `apply` → `/apply/completions`
- `fim` → `/fim/completions`
- `edit` → `/edit/completions`

Base URL: `https://api.inceptionlabs.ai/v1`

## 3. Additional API Routes

### `POST /api/humanize`

Server-side humanizer pipeline. Assembles few-shot examples from the 456-entry dataset, selects a context-aware or no-context prompt, and calls Mercury-2.

- `action: "generate"` — Batch generation. Returns `{ alternatives: string[] }` (default: 4 alternatives).
- `action: "generate_one"` — Incremental generation with dedup. Accepts `existing` array. Temperature ramps +0.15 per existing variant (capped at 1.5). Returns `{ alternative: string }`.

### `POST /api/detect`

AI detection endpoint. Accepts `{ text }` (10-char min, 20K-char max). Returns `{ score, label: "human"|"mixed"|"ai", sentences: [{ text, score }] }`. Currently uses heuristic analysis (type-token ratio, passive voice, transition density, burstiness).

## 4. Wrapper Functions

### `routeToModel(mode, editScope?)`

Selects model based on writing mode.

- Returns `"mercury-2"` for compose/review/deep rewrite/diffusion operations
- Returns `"mercury-edit"` for autocomplete/next-edit and short quick edits
- Quick-edit fallback: `editScope < 500` → `mercury-edit`, else `mercury-2`

### `calculateMaxTokens(inputText, defaultMax?)`

Dynamic token cap based on input length. Prevents wasted tokens on short inputs.

- Input under 50 words: returns `Math.max(wordCount * 10, 256)` (minimum 256)
- Input 50 words or more: returns `defaultMax` (default: 4096)

Used by `streamChatCompletion` and slash command handlers in `editor-canvas.tsx`.

### `streamChatCompletion(messages, options)`

Purpose: streaming chat generation via `/api/mercury` with SSE handling.

Important behaviors:

- Prepends `ACADEMIC_SYSTEM_PROMPT` to input messages
- Defaults: `max_tokens=4096`, `temperature` from `getTemperature("chat")`, `stream=true`
- Optional `reasoning_effort`
- Optional `diffusing` mode
- Invokes:
  - `onChunk(text)` for regular streaming text deltas
  - `onDiffusionStep(fullText, step)` when diffusion mode is enabled
  - `onDone()` on `[DONE]`
  - `onError(error)` on request/stream failure

Example:

```ts
import { streamChatCompletion } from "@/lib/mercury/client";

let text = "";

await streamChatCompletion(
  [{ role: "user", content: "Draft a concise discussion section for these findings." }],
  {
    reasoningEffort: "high",
    diffusing: false,
    onChunk: (chunk) => {
      text += chunk;
    },
    onDone: () => {
      console.log("stream complete", text);
    },
    onError: (error) => {
      console.error("stream failed", error);
    },
  }
);
```

Diffusion-mode example:

```ts
await streamChatCompletion(messages, {
  diffusing: true,
  onChunk: () => {},
  onDiffusionStep: (fullText, step) => {
    console.log("step", step, fullText);
  },
  onDone: () => {},
  onError: console.error,
});
```

### `structuredChatCompletion<T>(messages, schema, options?)`

Purpose: non-streaming chat call that requests JSON-schema-constrained output.

Important behaviors:

- Prepends `ACADEMIC_SYSTEM_PROMPT`
- Sends `response_format: { type: "json_schema", json_schema: schema }`
- Parses `choices[0].message.content` as JSON and returns typed object `T`

Example:

```ts
import { structuredChatCompletion } from "@/lib/mercury/client";
import { REVIEW_JSON_SCHEMA } from "@/lib/constants";

const result = await structuredChatCompletion<{
  categories: { label: string; score: number; feedback: string }[];
}>(
  [{ role: "user", content: "Review this manuscript." }],
  REVIEW_JSON_SCHEMA,
  { reasoningEffort: "medium" }
);

console.log(result.categories);
```

### `applyEdit(originalText, editInstruction, options?)`

Purpose: targeted rewrite/edit request using Mercury Edit path (`endpoint: "apply"`, model `mercury-edit`).

Request packaging format:

```text
<|original_code|>
...original text...
<|/original_code|>

<|update_snippet|>
...instruction...
<|/update_snippet|>
```

Response handling: the wrapper auto-strips `<|updated_code|>` / `</|updated_code|>` delimiters from the response before returning clean edited text.

Defaults used by wrapper:

- `max_tokens: 8192`
- `temperature: 0.0`

Example:

```ts
import { applyEdit } from "@/lib/mercury/client";

const edited = await applyEdit(
  "This section is verbose and repetitive.",
  "Simplify wording while preserving scientific meaning."
);
```

### `fimCompletion(prefix, suffix, options?)`

Purpose: fill-in-the-middle completion for inline autocomplete (`endpoint: "fim"`, model `mercury-edit`).

Defaults used by wrapper:

- `max_tokens: 512`
- `temperature: 0.0`
- `presence_penalty: 1.5`

Accepts optional `temperature` parameter for alternative cycling. Ghost text uses ramped temperatures (0.0, 0.1, 0.2, 0.3, 0.4) when fetching additional alternatives for the same cursor position.

Example:

```ts
import { fimCompletion } from "@/lib/mercury/client";

const completion = await fimCompletion(
  "Our findings indicate that",
  "under constrained token budgets."
);

// With temperature for alternative generation
const alt = await fimCompletion(
  "Our findings indicate that",
  "under constrained token budgets.",
  { temperature: 0.2 }
);
```

### `humanizeText(text, options?)`

Purpose: batch generation of humanized text alternatives via `POST /api/humanize`.

Routes to the humanize API with `action: "generate"`. Server-side pipeline assembles 5 few-shot examples from the 456-entry dataset and calls Mercury-2 with the humanize prompt.

Returns `{ alternatives: string[] }` (default: 4 alternatives).

Example:

```ts
import { humanizeText } from "@/lib/mercury/client";

const result = await humanizeText(
  "The implementation demonstrates significant improvements in performance metrics.",
  { context: "Results section of a computer science paper" }
);

console.log(result.alternatives); // 4 humanized versions
```

### `humanizeOneMore(text, existing, options?)`

Purpose: incremental generation of a single humanized alternative with dedup via `POST /api/humanize`.

Routes to the humanize API with `action: "generate_one"`. Passes the `existing` alternatives array so the server can deduplicate. Temperature ramps +0.15 per existing variant (capped at 1.5).

Returns `{ alternative: string }`.

Example:

```ts
import { humanizeOneMore } from "@/lib/mercury/client";

const result = await humanizeOneMore(
  "The implementation demonstrates significant improvements.",
  ["The results show clear performance gains.", "We observed notable improvements."]
);

console.log(result.alternative); // 1 new humanized version, deduplicated
```

## 5. Request Body Shapes (As Used In ScribeX)

Chat payload example:

```json
{
  "endpoint": "chat",
  "model": "mercury-2",
  "messages": [{ "role": "system", "content": "..." }, { "role": "user", "content": "..." }],
  "max_tokens": 4096,
  "temperature": 0.6,
  "stream": true,
  "diffusing": false,
  "reasoning_effort": "medium"
}
```

Apply payload example:

```json
{
  "endpoint": "apply",
  "model": "mercury-edit",
  "messages": [{ "role": "user", "content": "<|original_code|>..." }],
  "max_tokens": 8192,
  "temperature": 0.0
}
```

FIM payload example:

```json
{
  "endpoint": "fim",
  "model": "mercury-edit",
  "prompt": "prefix",
  "suffix": "suffix",
  "max_tokens": 512,
  "temperature": 0.0,
  "presence_penalty": 1.5
}
```

Humanize payload example (batch):

```json
{
  "text": "The implementation demonstrates significant improvements.",
  "context": "Results section",
  "count": 4,
  "action": "generate"
}
```

Humanize payload example (incremental):

```json
{
  "text": "The implementation demonstrates significant improvements.",
  "existing": ["The results show clear performance gains."],
  "action": "generate_one",
  "temperature": 1.05
}
```

Detect payload example:

```json
{
  "text": "The implementation demonstrates significant improvements in performance metrics across all evaluated benchmarks."
}
```

Detect response example:

```json
{
  "score": 0.72,
  "label": "ai",
  "sentences": [
    { "text": "The implementation demonstrates significant improvements in performance metrics across all evaluated benchmarks.", "score": 0.72 }
  ]
}
```

## 6. Error Handling Behavior

- Wrapper throws if response status is not OK.
- Streaming parser ignores malformed `data:` chunks and continues.
- `AbortError` in streaming is treated as non-fatal cancellation.
- Route returns upstream status + error text when provider request fails.
- Humanize endpoint returns 400 for empty text, 500 for pipeline failures.
- Detect endpoint returns 400 for text under 10 chars or over 20K chars.

## 7. Model Context And Attribution

ScribeX wraps Inception's Mercury platform endpoints and model controls.

Source attribution for model statements in this repository should reference official Inception materials:

- Mercury 2 launch: [Introducing Mercury 2](https://www.inceptionlabs.ai/blog/introducing-mercury-2)
- Platform onboarding and API compatibility: [Get Started](https://docs.inceptionlabs.ai/get-started/get-started)
- Models and endpoint overview: [Models](https://docs.inceptionlabs.ai/get-started/models)

When describing performance/quality characteristics, attribute those claims to Inception rather than presenting them as independent ScribeX benchmark results.
