# Mercury API Wrapper Reference

Last verified: **February 27, 2026**.

This document explains the ScribeX Mercury wrapper layer implemented in `src/lib/mercury/client.ts` and how it maps to `src/app/api/mercury/route.ts`.

## 1. Wrapper Purpose

ScribeX uses a browser-side wrapper to standardize AI calls while delegating credentialed upstream requests to a server route.

Wrapper responsibilities:

- Normalize request patterns for chat/edit/FIM flows
- Provide stream callbacks for UI updates
- Inject academic system prompt for chat flows
- Support reasoning-effort and diffusion options

Route responsibilities:

- Map logical endpoint keys to Inception API paths
- Attach bearer auth from `INCEPTION_API_KEY`
- Proxy streaming and non-streaming responses

Middleware responsibilities (`src/middleware.ts`):

- CSRF validation (origin header check against `NEXT_PUBLIC_APP_URL`)
- Rate limiting (60 req/min per IP, in-memory sliding window)

## 2. Endpoint Mapping (`POST /api/mercury`)

`src/app/api/mercury/route.ts` maps:

- `chat` → `/chat/completions`
- `apply` → `/apply/completions`
- `fim` → `/fim/completions`
- `edit` → `/edit/completions`

Base URL: `https://api.inceptionlabs.ai/v1`

## 3. Wrapper Functions

### `routeToModel(mode, editScope?)`

Selects model based on writing mode.

- Returns `"mercury-2"` for compose/review/deep rewrite/diffusion operations
- Returns `"mercury-edit"` for autocomplete/next-edit and short quick edits
- Quick-edit fallback: `editScope < 500` → `mercury-edit`, else `mercury-2`

### `streamChatCompletion(messages, options)`

Purpose: streaming chat generation via `/api/mercury` with SSE handling.

Important behaviors:

- Prepends `ACADEMIC_SYSTEM_PROMPT` to input messages
- Defaults: `max_tokens=4096`, `temperature=0.3`, `stream=true`
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

Example:

```ts
import { fimCompletion } from "@/lib/mercury/client";

const completion = await fimCompletion(
  "Our findings indicate that",
  "under constrained token budgets."
);
```

## 4. Request Body Shapes (As Used In ScribeX)

Chat payload example:

```json
{
  "endpoint": "chat",
  "model": "mercury-2",
  "messages": [{ "role": "system", "content": "..." }, { "role": "user", "content": "..." }],
  "max_tokens": 4096,
  "temperature": 0.3,
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

## 5. Error Handling Behavior

- Wrapper throws if response status is not OK.
- Streaming parser ignores malformed `data:` chunks and continues.
- `AbortError` in streaming is treated as non-fatal cancellation.
- Route returns upstream status + error text when provider request fails.

## 6. Model Context And Attribution

ScribeX wraps Inception's Mercury platform endpoints and model controls.

Source attribution for model statements in this repository should reference official Inception materials:

- Mercury 2 launch: [Introducing Mercury 2](https://www.inceptionlabs.ai/blog/introducing-mercury-2)
- Platform onboarding and API compatibility: [Get Started](https://docs.inceptionlabs.ai/get-started/get-started)
- Models and endpoint overview: [Models](https://docs.inceptionlabs.ai/get-started/models)

When describing performance/quality characteristics, attribute those claims to Inception rather than presenting them as independent ScribeX benchmark results.
