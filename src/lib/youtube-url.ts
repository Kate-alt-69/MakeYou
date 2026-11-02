const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const PLAYLIST_ID = /^[A-Za-z0-9_-]{10,80}$/;
const TRUSTED_HOSTS = new Set([
  "youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com",
  "youtu.be", "www.youtube-nocookie.com", "youtube-nocookie.com",
]);

export type ParsedYouTubeUrl = { videoId?: string; playlistId?: string };

function parseHttpUrl(raw: string): URL | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!TRUSTED_HOSTS.has(url.hostname.toLowerCase())) return null;
    return url;
  } catch {
    return null;
  }
}

export function parseYouTubeUrl(input: string): ParsedYouTubeUrl | null {
  const raw = input.trim();
  if (!raw || raw.length > 2048) return null;

  if (raw.startsWith("intent://")) {
    const match = raw.match(/scheme=https;end/i);
    if (!match) return null;
    const embedded = raw.match(/^intent:\/\/([^#]+)#Intent;/i);
    if (!embedded) return null;
    const url = parseHttpUrl(\`https://\${embedded[1].replace(/^www\./i, "www.")}\`);
    return url ? parseYouTubeUrl(url.toString()) : null;
  }

  if (raw.startsWith("vnd.youtube:")) {
    const value = raw.slice("vnd.youtube:".length).replace(/^\/\//, "");
    const id = value.match(/(?:v=)?([A-Za-z0-9_-]{11})/)?.[1];
    return id && VIDEO_ID.test(id) ? { videoId: id } : null;
  }

  const url = parseHttpUrl(raw.includes("://") ? raw : \`https://\${raw}\`);
  if (!url) return null;

  const playlistId = url.searchParams.get("list") || undefined;
  const queryVideo = url.searchParams.get("v") || undefined;
  const segments = url.pathname.split("/").filter(Boolean);
  const pathVideo = url.hostname === "youtu.be"
    ? segments[0]
    : ["shorts", "live", "embed", "v"].includes(segments[0] || "")
      ? segments[1]
      : undefined;
  const videoId = queryVideo || pathVideo;

  if (videoId && !VIDEO_ID.test(videoId)) return null;
  if (playlistId && !PLAYLIST_ID.test(playlistId)) return null;
  if (!videoId && !playlistId) return null;
  return { ...(videoId ? { videoId } : {}), ...(playlistId ? { playlistId } : {}) };
}

export function toWatchPath(parsed: ParsedYouTubeUrl) {
  const params = new URLSearchParams();
  if (parsed.videoId) params.set("v", parsed.videoId);
  if (parsed.playlistId) params.set("list", parsed.playlistId);
  return \`/watch?\${params.toString()}\`;
}
