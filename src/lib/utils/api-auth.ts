import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const JOIN_CODE = process.env.NEXT_PUBLIC_JOIN_CODE?.trim();

/**
 * Constant-time string comparison (case-insensitive).
 *
 * `crypto.timingSafeEqual` requires equal-length buffers. When lengths differ
 * we still run the comparison against the expected value (padded/truncated is
 * irrelevant — the result is always `false`) so the timing profile does not
 * leak length information.
 */
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a.toLowerCase(), "utf-8");
  const bufB = Buffer.from(b.toLowerCase(), "utf-8");

  // Length mismatch: compare expected against itself to burn the same time,
  // then return false. This prevents length-oracle timing side-channels.
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufB, bufB);
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}

/**
 * Validate the join-code header on an API request.
 * Returns a 401 NextResponse if the code is invalid, or `null` if auth passes.
 *
 * Uses constant-time comparison to prevent timing side-channel attacks
 * that could leak the join code character-by-character.
 */
export function validateJoinCode(req: NextRequest): NextResponse | null {
  if (!JOIN_CODE) return null;
  const token = req.headers.get("x-join-token")?.trim();
  if (!token || !safeCompare(token, JOIN_CODE)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
