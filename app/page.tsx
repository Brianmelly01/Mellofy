"use client";

<<<<<<< HEAD
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { usePlayerStore } from "@/lib/store/usePlayerStore";
import Image from "next/image";

const topPlaylists = [
  { id: 1, title: "Hits of the Moment", cover: "https://picsum.photos/seed/playlist1/300", gradient: "from-orange-600 to-pink-600" },
  { id: 2, title: "Chill Vibes", cover: "https://picsum.photos/seed/playlist2/300", gradient: "from-amber-600 to-orange-600" },
  { id: 3, title: "Afro Beats", cover: "https://picsum.photos/seed/playlist3/300", gradient: "from-rose-600 to-pink-600" },
];

const trendingNow = [
  { id: 1, title: "Weekend Party", artist: "DJ Stellar", cover: "https://picsum.photos/seed/trend1/200" },
  { id: 2, title: "Lost in Love", artist: "Mia Roberts", cover: "https://picsum.photos/seed/trend2/200" },
  { id: 3, title: "Rise Up", artist: "Kings & Crew", cover: "https://picsum.photos/seed/trend3/200" },
  { id: 4, title: "On My Mind", artist: "Lucas Drake", cover: "https://picsum.photos/seed/trend4/200" },
];
=======
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HorizontalSection from "@/components/HorizontalSection";
>>>>>>> 208d31989d1d1ffc320c3a0b64ec05ff94fc4379

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

<<<<<<< HEAD
  const handlePlay = (id: string, title: string, artist: string, cover: string) => {
    setTrack({
      id,
      title,
      artist,
      thumbnail: cover,
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    });
  };

  return (
    <div className="min-h-screen pt-20 pb-24 px-4 md:px-6">
      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-white text-3xl font-bold mb-1">Welcome, Brian</h1>
        <p className="text-neutral-400">Let's vibe with your favorite music</p>
      </div>

      {/* Hero Section - Discover Weekly */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden mb-8 bg-gradient-to-br from-purple-900 via-purple-600 to-pink-600 p-8 h-64"
      >
        <div className="relative z-10 flex flex-col justify-between h-full">
          <div>
            <h2 className="text-white text-4xl font-bold mb-2">Discover Weekly</h2>
            <p className="text-white/90 text-lg">Fresh Tracks Just for You</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handlePlay("discover-weekly", "Discover Weekly", "Mellofy", "")}
            className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 w-fit transition shadow-xl"
          >
            <Play className="w-5 h-5 fill-white" />
            Play
          </motion.button>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      </motion.div>

      {/* Top Playlists */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-2xl font-bold">Top Playlists</h2>
          <button className="text-neutral-400 hover:text-white transition text-sm">See All →</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topPlaylists.map((playlist) => (
            <motion.div
              key={playlist.id}
              whileHover={{ scale: 1.02 }}
              className={`relative rounded-xl overflow-hidden bg-gradient-to-br ${playlist.gradient} p-4 h-48 cursor-pointer group`}
              onClick={() => handlePlay(playlist.id.toString(), playlist.title, "Mellofy", playlist.cover)}
            >
              <div className="relative z-10">
                <h3 className="text-white text-xl font-bold mb-1">{playlist.title}</h3>
              </div>
              <div className="absolute right-4 bottom-4 w-32 h-32 opacity-30 group-hover:opacity-50 transition">
                <img src={playlist.cover} alt={playlist.title} className="w-full h-full object-cover rounded-lg" />
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute bottom-4 left-4"
              >
                <div className="bg-black/20 backdrop-blur-sm p-3 rounded-full">
                  <Play className="w-6 h-6 text-white fill-white" />
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Trending Now */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-2xl font-bold">Trending Now</h2>
          <button className="text-neutral-400 hover:text-white transition text-sm">See All →</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {trendingNow.map((track) => (
            <motion.div
              key={track.id}
              whileHover={{ scale: 1.05 }}
              className="bg-neutral-800/30 rounded-xl p-3 cursor-pointer hover:bg-neutral-800/50 transition group"
              onClick={() => handlePlay(track.id.toString(), track.title, track.artist, track.cover)}
            >
              <div className="relative aspect-square rounded-lg overflow-hidden mb-3">
                <img src={track.cover} alt={track.title} className="w-full h-full object-cover" />
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center"
                >
                  <div className="bg-purple-600 p-3 rounded-full">
                    <Play className="w-5 h-5 text-white fill-white" />
                  </div>
                </motion.div>
              </div>
              <h3 className="text-white font-semibold text-sm truncate">{track.title}</h3>
              <p className="text-neutral-400 text-xs truncate">{track.artist}</p>
            </motion.div>
          ))}
=======
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
>>>>>>> 208d31989d1d1ffc320c3a0b64ec05ff94fc4379
        </div>
      </div>
    </div>
  );
}
