import { NextRequest, NextResponse } from "next/server";
import {
  buildHumanizePayload,
  buildHumanizeOnePayload,
  parseAlternatives,
  parseSingleAlternative,
} from "@/lib/humanizer";
import { validateJoinCode } from "@/lib/utils/api-auth";
import { MERCURY_API_BASE } from "@/lib/constants";

const API_KEY = process.env.INCEPTION_API_KEY;
const MAX_BODY_BYTES = 128_000;

export async function POST(req: NextRequest) {
  const authError = validateJoinCode(req);
  if (authError) return authError;

  if (!API_KEY) {
    return NextResponse.json(
      { error: "INCEPTION_API_KEY not configured" },
      { status: 500 }
    );
  }

  // Body size check
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  try {
    const body = await req.json();
    const { text, context, count, existing, action, temperature } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    if (action === "generate") {
      // Build few-shot payload for batch generation
      const payload = buildHumanizePayload(text, {
        context,
        count: count ?? 4,
        temperature,
      });

      // Call Mercury API directly
      const response = await fetch(`${MERCURY_API_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: "mercury-2",
          messages: payload.messages,
          max_tokens: payload.maxTokens,
          temperature: payload.temperature,
          stream: false,
        }),
      });

      if (!response.ok) {
        console.error("Mercury API error (humanize)", {
          status: response.status,
          timestamp: new Date().toISOString(),
        });
        return NextResponse.json(
          { error: "AI service error" },
          { status: response.status }
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        return NextResponse.json(
          { alternatives: [], parseError: true },
          { status: 200 }
        );
      }

      const alternatives = parseAlternatives(content);

      if (alternatives.length === 0) {
        return NextResponse.json(
          { alternatives: [], parseError: true, raw: content },
          { status: 200 }
        );
      }

      return NextResponse.json({ alternatives });

    } else if (action === "generate_one") {
      // Build payload for single incremental generation
      const payload = buildHumanizeOnePayload(text, existing ?? [], {
        temperature,
      });

      const response = await fetch(`${MERCURY_API_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: "mercury-2",
          messages: payload.messages,
          max_tokens: payload.maxTokens,
          temperature: payload.temperature,
          stream: false,
        }),
      });

      if (!response.ok) {
        console.error("Mercury API error (humanize-one)", {
          status: response.status,
          timestamp: new Date().toISOString(),
        });
        return NextResponse.json(
          { error: "AI service error" },
          { status: response.status }
        );
      }

      const data = await response.json();
      const responseContent = data.choices?.[0]?.message?.content;

      if (!responseContent) {
        return NextResponse.json(
          { error: "No content in response" },
          { status: 500 }
        );
      }

      const alternative = parseSingleAlternative(responseContent);
      return NextResponse.json({ alternative });

    } else {
      return NextResponse.json(
        { error: `Invalid action: ${action}` },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Humanize API route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
