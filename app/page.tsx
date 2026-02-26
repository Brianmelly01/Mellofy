"use client";

import { motion } from "framer-motion";
import { Play, Loader2 } from "lucide-react";
import { usePlayerStore } from "@/lib/store/usePlayerStore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useEffect, useState } from "react";

interface DiscoveryData {
  playlists: any[];
  trending: any[];
  newReleases: any[];
}

export default function Home() {
  const { setTrack } = usePlayerStore();
  const { user } = useAuthStore();
  const [data, setData] = useState<DiscoveryData>({ playlists: [], trending: [], newReleases: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const res = await fetch("/api/browse");
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setData({
          playlists: json.playlists || [],
          trending: json.trending || [],
          newReleases: json.newReleases || [],
        });
      } catch (err) {
        console.error("Home fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  const handlePlay = (item: any) => {
    setTrack({
      id: item.id,
      title: item.title,
      artist: item.artist,
      thumbnail: item.cover || item.thumbnail,
      url: "", // Extracted automatically by Player
      type: 'song'
    });
  };

  return (
    <div className="min-h-screen pt-20 pb-24 px-4 md:px-6">
      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-white text-3xl font-bold mb-1">
          Welcome, {user?.name?.split(' ')[0] || "Brian"}
        </h1>
        <p className="text-neutral-400">Let's vibe with your favorite music</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      )}

      {!loading && (
        <>

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
                onClick={() => {
                  const feat = data.trending[0] || data.playlists[0];
                  if (feat) handlePlay(feat);
                }}
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
              {data.playlists.slice(0, 3).map((playlist, idx) => (
                <motion.div
                  key={playlist.id}
                  whileHover={{ scale: 1.02 }}
                  className={`relative rounded-xl overflow-hidden bg-gradient-to-br ${idx === 0 ? 'from-orange-600 to-pink-600' : idx === 1 ? 'from-amber-600 to-orange-600' : 'from-rose-600 to-pink-600'} p-4 h-48 cursor-pointer group`}
                  onClick={() => handlePlay(playlist)}
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
              {data.trending.slice(0, 4).map((track) => (
                <motion.div
                  key={track.id}
                  whileHover={{ scale: 1.05 }}
                  className="bg-neutral-800/30 rounded-xl p-3 cursor-pointer hover:bg-neutral-800/50 transition group"
                  onClick={() => handlePlay(track)}
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
            </div>
          </div>
        </>
      )}
    </div>
  );
}
