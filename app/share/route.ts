import { NextRequest, NextResponse } from "next/server";
import { parseYouTubeUrl, toWatchPath } from "@/lib/youtube-url";

export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const candidates = [params.get("url"), params.get("text"), params.get("title")].filter(Boolean) as string[];
  for (const candidate of candidates) {
    const direct = parseYouTubeUrl(candidate);
    if (direct) return NextResponse.redirect(new URL(toWatchPath(direct), request.url));
    const match = candidate.match(/https?:\/\/[^\s<>"']+/i);
    if (match) {
      const parsed = parseYouTubeUrl(match[0].replace(/[),.;]+$/, ""));
      if (parsed) return NextResponse.redirect(new URL(toWatchPath(parsed), request.url));
    }
  }
  return NextResponse.redirect(new URL("/?share=invalid", request.url));
}
