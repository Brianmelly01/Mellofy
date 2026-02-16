"use client";

import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HorizontalSection from "@/components/HorizontalSection";

export default function Home() {
  // Mock data for Phase 20 UI
  const trendingTracks = [
    { id: "1", title: "Starboy", artist: "The Weeknd", thumbnail: "https://i.ytimg.com/vi/34Na4j8AVgA/maxresdefault.jpg" },
    { id: "2", title: "Blinding Lights", artist: "The Weeknd", thumbnail: "https://i.ytimg.com/vi/fHI8X4OXn-g/maxresdefault.jpg" },
    { id: "3", title: "Save Your Tears", artist: "The Weeknd", thumbnail: "https://i.ytimg.com/vi/XXYlFuWEuKI/maxresdefault.jpg" },
    { id: "4", title: "The Hills", artist: "The Weeknd", thumbnail: "https://i.ytimg.com/vi/yzTuBuLH9M8/maxresdefault.jpg" },
    { id: "5", title: "Can't Feel My Face", artist: "The Weeknd", thumbnail: "https://i.ytimg.com/vi/KEI4qSrkPAs/maxresdefault.jpg" },
  ];

  const topPlaylists = [
    { id: "p1", title: "Pulsar Beats", artist: "Curated by Mellofy", thumbnail: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=3540&auto=format&fit=crop" },
    { id: "p2", title: "Synthwave Dreams", artist: "Neon Nights", thumbnail: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?q=80&w=3548&auto=format&fit=crop" },
    { id: "p3", title: "Cyberpunk 2077", artist: "Night City Radio", thumbnail: "https://images.unsplash.com/photo-1605648916319-cf082f7524a1?q=80&w=3540&auto=format&fit=crop" },
    { id: "p4", title: "Phonk Night", artist: "Drift Nation", thumbnail: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=3540&auto=format&fit=crop" },
  ];

  return (
    <div className="bg-background rounded-lg h-full w-full overflow-hidden overflow-y-auto no-scrollbar">
      <Header />
      <div className="px-4 md:px-8 pb-32">
        <Hero />
        <div className="mt-8 space-y-10">
          <HorizontalSection
            title="Trending Now"
            items={trendingTracks}
          />
          <HorizontalSection
            title="Your Playlists"
            items={topPlaylists}
            isSquare
          />
          <HorizontalSection
            title="Recently Played"
            items={trendingTracks.slice().reverse()}
          />
        </div>
      </div>
    </div>
  );
}
