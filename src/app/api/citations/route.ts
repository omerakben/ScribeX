import { NextRequest, NextResponse } from "next/server";

const SEMANTIC_SCHOLAR_BASE = "https://api.semanticscholar.org/graph/v1";
const API_KEY = process.env.SEMANTIC_SCHOLAR_API_KEY;
const JOIN_CODE = process.env.NEXT_PUBLIC_JOIN_CODE?.trim();
const CITATION_PROVIDER = "semantic-scholar" as const;

function pickExternalId(paper: Record<string, unknown>): string {
  const paperId = typeof paper.paperId === "string" ? paper.paperId : "";
  if (paperId) return paperId;

  const externalIds = (paper.externalIds as Record<string, string | undefined>) ?? {};
  const fallbackOrder = ["DOI", "ArXiv", "CorpusId", "MAG", "PubMed", "PMID"];
  for (const key of fallbackOrder) {
    const value = externalIds[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  const title = typeof paper.title === "string" ? paper.title : "untitled";
  const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "citation";
  const year = typeof paper.year === "number" ? String(paper.year) : "n.d.";
  return `${normalizedTitle}-${year}`;
}

export async function GET(req: NextRequest) {
  // A) Join code auth
  if (JOIN_CODE) {
    const token = req.headers.get("x-join-token")?.trim();
    if (!token || token.toLowerCase() !== JOIN_CODE.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  // B) Validate limit and offset
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") ?? "10", 10) || 10));
  const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10) || 0);

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
      console.error("Semantic Scholar API error", {
        status: response.status,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        { error: "Citation service error" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform to our Citation format
    const citations = (data.data ?? []).map((paper: Record<string, unknown>) => ({
      provider: CITATION_PROVIDER,
      externalId: pickExternalId(paper),
      title: paper.title,
      authors: (paper.authors as Array<{ name: string; authorId?: string }>) ?? [],
      year: paper.year,
      venue: paper.venue ?? "",
      abstract: paper.abstract,
      doi: (paper.externalIds as Record<string, string | undefined>)?.DOI,
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
