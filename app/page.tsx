import { HomeExperience } from "../components/home/HomeExperience";
import { getPopularVideos, isYouTubeApiConfigured } from "@/lib/youtube";
import type { YouTubeVideo } from "@/lib/youtube";

export const revalidate = 300;

export default async function HomePage() {
  const configured = isYouTubeApiConfigured();
  let initialVideos: YouTubeVideo[] = [];
  let initialMessage = "";

  if (configured) {
    try {
      initialVideos = await getPopularVideos();
    } catch (error) {
      initialMessage = error instanceof Error ? error.message : "Unable to load popular videos.";
    }
  } else {
    initialMessage = "Add YOUTUBE_DATA_API_KEY to .env.local to load live videos.";
  }

  return (
    <HomeExperience
      initialVideos={initialVideos}
      initialConfigured={configured}
      initialMessage={initialMessage}
    />
  );
}
