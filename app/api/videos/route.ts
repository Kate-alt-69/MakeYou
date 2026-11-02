import { NextRequest, NextResponse } from "next/server";
import { getPopularVideos, isYouTubeApiConfigured, searchVideos } from "@/lib/youtube";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isYouTubeApiConfigured()) {
    return NextResponse.json(
      { configured: false, items: [], message: "Add YOUTUBE_DATA_API_KEY to .env.local to load live videos." },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  const query = request.nextUrl.searchParams.get("q")?.trim();
  const category = request.nextUrl.searchParams.get("category") || undefined;
  if (query && query.length < 2) {
    return NextResponse.json({ configured: true, items: [], message: "Enter at least two characters." });
  }

  try {
    const items = query ? await searchVideos(query) : await getPopularVideos(category);
    return NextResponse.json(
      { configured: true, items },
      { headers: { "Cache-Control": query ? "private, max-age=30" : "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (error) {
    return NextResponse.json(
      { configured: true, items: [], message: error instanceof Error ? error.message : "Unable to load videos." },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
