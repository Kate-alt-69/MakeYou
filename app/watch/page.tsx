import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Watch" };

type Props = { searchParams: Promise<{ v?: string; list?: string }> };

export default async function WatchPage({ searchParams }: Props) {
  const { v, list } = await searchParams;
  if ((!v || !/^[A-Za-z0-9_-]{11}$/.test(v)) && (!list || !/^[A-Za-z0-9_-]{10,80}$/.test(list))) notFound();

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const origin = \`\${protocol}://\${host}\`;
  const playerParams = new URLSearchParams({ enablejsapi: "1", origin, playsinline: "1", rel: "0" });
  if (list) playerParams.set("list", list);
  const embed = v
    ? \`https://www.youtube.com/embed/\${encodeURIComponent(v)}?\${playerParams.toString()}\`
    : \`https://www.youtube.com/embed/videoseries?\${playerParams.toString()}\`;

  return (
    <main className="watch-page">
      <header className="watch-header">
        <Link href="/" className="brand"><span className="brand-mark"><span>▶</span></span><span>MakeYou</span></Link>
        <Link href="/" className="back-home">← Back to discovery</Link>
      </header>
      <div className="watch-content">
        <div className="watch-player-wrap">
          <iframe
            className="watch-player"
            src={embed}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
        <div className="watch-info">
          <div><p className="eyebrow">NOW PLAYING</p><h1>{v ? "Enjoy your video." : "Your playlist is ready."}</h1><p>Playback is provided by the official YouTube player.</p></div>
          <Link className="secondary-button" href={v ? \`https://www.youtube.com/watch?v=\${encodeURIComponent(v)}\` : \`https://www.youtube.com/playlist?list=\${encodeURIComponent(list!)}\`} target="_blank">Open on YouTube ↗</Link>
        </div>
      </div>
      <p className="watch-disclaimer">MakeYou is an independent client. YouTube player controls, attribution, and advertisements remain provided by YouTube.</p>
    </main>
  );
}
