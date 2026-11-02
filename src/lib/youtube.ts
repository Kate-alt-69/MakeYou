export type YouTubeVideo = {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  thumbnails: { high?: string; medium?: string; default?: string };
  duration?: string;
  viewCount?: string;
};

const API_BASE = "https://www.googleapis.com/youtube/v3";

function apiKey() {
  return process.env.YOUTUBE_DATA_API_KEY;
}

export function isYouTubeApiConfigured() {
  return Boolean(apiKey());
}

export async function getPopularVideos(categoryId?: string): Promise<YouTubeVideo[]> {
  const key = apiKey();
  if (!key) return [];
  const url = new URL(`${API_BASE}/videos`);
  url.searchParams.set("part", "snippet,contentDetails,statistics");
  url.searchParams.set("chart", "mostPopular");
  url.searchParams.set("regionCode", process.env.YOUTUBE_REGION_CODE || "IN");
  url.searchParams.set("maxResults", "24");
  url.searchParams.set("key", key);
  if (categoryId) url.searchParams.set("videoCategoryId", categoryId);

  const response = await fetch(url, { next: { revalidate: 300 } });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message || "YouTube discovery is temporarily unavailable.");
  }
  const data = await response.json();
  return (data.items || []).map((item: any) => ({
    id: item.id,
    title: item.snippet?.title || "Untitled video",
    description: item.snippet?.description || "",
    channelTitle: item.snippet?.channelTitle || "Unknown channel",
    channelId: item.snippet?.channelId || "",
    publishedAt: item.snippet?.publishedAt || "",
    thumbnails: item.snippet?.thumbnails || {},
    duration: item.contentDetails?.duration,
    viewCount: item.statistics?.viewCount,
  }));
}

export async function searchVideos(query: string): Promise<YouTubeVideo[]> {
  const key = apiKey();
  if (!key) throw new Error("Add YOUTUBE_DATA_API_KEY to enable search.");
  const url = new URL(`${API_BASE}/search`);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "24");
  url.searchParams.set("q", query.slice(0, 160));
  url.searchParams.set("key", key);
  const response = await fetch(url, { next: { revalidate: 60 } });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message || "Search is temporarily unavailable.");
  }
  const data = await response.json();
  return (data.items || []).map((item: any) => ({
    id: item.id?.videoId,
    title: item.snippet?.title || "Untitled video",
    description: item.snippet?.description || "",
    channelTitle: item.snippet?.channelTitle || "Unknown channel",
    channelId: item.snippet?.channelId || "",
    publishedAt: item.snippet?.publishedAt || "",
    thumbnails: item.snippet?.thumbnails || {},
  })).filter((video: YouTubeVideo) => Boolean(video.id));
}
