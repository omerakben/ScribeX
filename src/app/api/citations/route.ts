import { NextRequest, NextResponse } from "next/server";

const SEMANTIC_SCHOLAR_BASE = "https://api.semanticscholar.org/graph/v1";
const API_KEY = process.env.SEMANTIC_SCHOLAR_API_KEY;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  const limit = searchParams.get("limit") ?? "10";
  const offset = searchParams.get("offset") ?? "0";

  if (!query) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  try {
    const fields = "paperId,title,authors,year,venue,abstract,externalIds,url,citationCount,isOpenAccess";
    const url = `${SEMANTIC_SCHOLAR_BASE}/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&fields=${fields}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (API_KEY) {
      headers["x-api-key"] = API_KEY;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Semantic Scholar API: ${response.status} - ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform to our Citation format
    const citations = (data.data ?? []).map((paper: Record<string, unknown>) => ({
      id: crypto.randomUUID(),
      paperId: paper.paperId,
      title: paper.title,
      authors: (paper.authors as Array<{ name: string; authorId?: string }>) ?? [],
      year: paper.year,
      venue: paper.venue ?? "",
      abstract: paper.abstract,
      doi: (paper.externalIds as Record<string, string>)?.DOI ?? null,
      url: paper.url,
      citationCount: paper.citationCount ?? 0,
      isOpenAccess: paper.isOpenAccess ?? false,
    }));

    return NextResponse.json({
      total: data.total ?? 0,
      offset: data.offset ?? 0,
      data: citations,
    });
  } catch (error) {
    console.error("Citation search error:", error);
    return NextResponse.json({ error: "Failed to search citations" }, { status: 500 });
  }
}
