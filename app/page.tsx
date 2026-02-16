"use client";

import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HorizontalSection from "@/components/HorizontalSection";

export default function Home() {
  // Phase 21 High-Fidelity Data (Matching Mockup)
  const topPlaylists = [
    {
      id: "p1",
      title: "Hits of",
      artist: "the Moment",
      thumbnail: "file:///home/melly/.gemini/antigravity/brain/b73abbe4-f412-4c81-8753-332faece39cc/playlist_hits_moment_v2_1771266052746.png"
    },
    {
      id: "p2",
      title: "Chill Vibes",
      artist: "Sunset Moods",
      thumbnail: "file:///home/melly/.gemini/antigravity/brain/b73abbe4-f412-4c81-8753-332faece39cc/playlist_chill_vibes_v2_1771266070675.png"
    },
    {
      id: "p3",
      title: "Afro Beats",
      artist: "Global Rhythms",
      thumbnail: "file:///home/melly/.gemini/antigravity/brain/b73abbe4-f412-4c81-8753-332faece39cc/playlist_afro_beats_final_1771266193679.png"
    },
  ];

  const trendingTracks = [
    {
      id: "t1",
      title: "Weekend Party",
      artist: "DJ Stellar",
      thumbnail: "file:///home/melly/.gemini/antigravity/brain/b73abbe4-f412-4c81-8753-332faece39cc/track_weekend_party_1771266120787.png"
    },
    {
      id: "t2",
      title: "Lost in Love",
      artist: "Mia Roberts",
      thumbnail: "file:///home/melly/.gemini/antigravity/brain/b73abbe4-f412-4c81-8753-332faece39cc/track_lost_love_1771266138653.png"
    },
    {
      id: "t3",
      title: "Rise Up",
      artist: "Kings & Crew",
      thumbnail: "file:///home/melly/.gemini/antigravity/brain/b73abbe4-f412-4c81-8753-332faece39cc/track_rise_up_final_1771266208307.png"
    },
    {
      id: "t4",
      title: "On My Mind",
      artist: "Lucas Drake",
      thumbnail: "file:///home/melly/.gemini/antigravity/brain/b73abbe4-f412-4c81-8753-332faece39cc/track_on_my_mind_final_v2_1771266263479.png"
    },
  ];

  return (
    <div className="bg-[#080808] h-full w-full overflow-hidden overflow-y-auto no-scrollbar">
      <Header />
      <div className="px-5 md:px-8 pb-32">
        {/* Welcome Section (Mockup Precise) */}
        <div className="py-6 flex flex-col gap-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Welcome, Brian
          </h1>
          <p className="text-sm md:text-base text-neutral-400 font-medium">
            Let's vibe with your favorite music
          </p>
        </div>

        <Hero />
        <div className="mt-8 space-y-12">
          <HorizontalSection
            title="Top Playlists"
            items={topPlaylists}
            isSquare
          />
          <HorizontalSection
            title="Trending Now"
            items={trendingTracks}
          />
        </div>
      </div>
    </div>
  );
}
