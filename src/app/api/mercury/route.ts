import { NextRequest, NextResponse } from "next/server";

const MERCURY_API_BASE = "https://api.inceptionlabs.ai/v1";
const API_KEY = process.env.INCEPTION_API_KEY;
const JOIN_CODE = process.env.NEXT_PUBLIC_JOIN_CODE?.trim();
const MAX_BODY_BYTES = 512_000;

const ENDPOINT_MAP: Record<string, string> = {
  chat: "/chat/completions",
  apply: "/apply/completions",
  fim: "/fim/completions",
  edit: "/edit/completions",
};

const ALLOWED_MODELS = new Set([
  "mercury-coder-small",
  "mercury-2",
  "mercury-edit",
]);

const FORWARDED_FIELDS = new Set([
  "model",
  "messages",
  "max_tokens",
  "temperature",
  "stream",
  "prompt",
  "suffix",
  "diffusing",
  "reasoning_effort",
  "response_format",
  "presence_penalty",
]);

export async function POST(req: NextRequest) {
  // A) Join code auth
  if (JOIN_CODE) {
    const token = req.headers.get("x-join-token")?.trim();
    if (!token || token.toLowerCase() !== JOIN_CODE.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!API_KEY) {
    return NextResponse.json(
      { error: "INCEPTION_API_KEY not configured" },
      { status: 500 }
    );
  }

  // C) Body size check
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  try {
    const body = await req.json();
    const { endpoint, ...raw } = body;

    const path = ENDPOINT_MAP[endpoint];
    if (!path) {
      return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });
    }

    // B) Validate model
    if (raw.model && !ALLOWED_MODELS.has(raw.model)) {
      return NextResponse.json({ error: "Invalid model" }, { status: 400 });
    }

    // B) Cap max_tokens
    if (raw.max_tokens !== undefined) {
      raw.max_tokens = Math.min(raw.max_tokens, 16384);
    }

    // B) Whitelist fields
    const payload: Record<string, unknown> = {};
    for (const key of FORWARDED_FIELDS) {
      if (key in raw) {
        payload[key] = raw[key];
      }
    }

    const url = `${MERCURY_API_BASE}${path}`;

    // For streaming requests, proxy the SSE stream
    if (payload.stream) {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error("Mercury API error", {
          endpoint,
          status: response.status,
          timestamp: new Date().toISOString(),
        });
        return NextResponse.json(
          { error: "AI service error" },
          { status: response.status }
        );
      }

      // Forward the stream
      return new Response(response.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming requests
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error("Mercury API error", {
        endpoint,
        status: response.status,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        { error: "AI service error" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Mercury API route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
