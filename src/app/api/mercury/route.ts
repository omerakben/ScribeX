import { NextRequest, NextResponse } from "next/server";

const MERCURY_API_BASE = "https://api.inceptionlabs.ai/v1";
const API_KEY = process.env.INCEPTION_API_KEY;

const ENDPOINT_MAP: Record<string, string> = {
  chat: "/chat/completions",
  apply: "/apply/completions",
  fim: "/fim/completions",
  edit: "/edit/completions",
};

export async function POST(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "INCEPTION_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { endpoint, ...payload } = body;

    const path = ENDPOINT_MAP[endpoint];
    if (!path) {
      return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });
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
        const error = await response.text();
        return NextResponse.json(
          { error: `Mercury API: ${response.status} - ${error}` },
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
      const error = await response.text();
      return NextResponse.json(
        { error: `Mercury API: ${response.status} - ${error}` },
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
