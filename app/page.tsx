"use client";

import Header from "@/components/Header";
import { Play } from "lucide-react";
import { usePlayerStore } from "@/lib/store/usePlayerStore";

export default function Home() {
  const { setTrack } = usePlayerStore();

  const handlePlay = (i: number) => {
    setTrack({
      id: `featured-${i}`,
      title: `Song Name ${i}`,
      artist: `Artist Name`,
      thumbnail: `https://picsum.photos/seed/${i + 40}/200`,
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    });
  };

  return (
    <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden overflow-y-auto">
      <Header>
        <div className="mb-2">
          <h1 className="text-white text-3xl font-semibold">Welcome back</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 mt-4">
            {/* Quick Link Card */}
            <div
              onClick={() => handlePlay(0)}
              className="relative group flex items-center rounded-md overflow-hidden gap-x-4 bg-neutral-100/10 hover:bg-neutral-100/20 transition pr-4 cursor-pointer"
            >
              <div className="relative min-h-[64px] min-w-[64px]">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 to-blue-300 flex items-center justify-center">
                  <Play className="text-black fill-black" size={32} />
                </div>
              </div>
              <p className="font-medium truncate py-5">Liked Songs</p>
              <div className="absolute transition opacity-0 rounded-full flex items-center justify-center bg-green-500 p-4 drop-shadow-md right-5 group-hover:opacity-100 hover:scale-110">
                <Play className="text-black fill-black" />
              </div>
            </div>
          </div>
        </div>
      </Header>

      <div className="mt-2 mb-7 px-6">
        <div className="flex justify-between items-center">
          <h1 className="text-white text-2xl font-semibold">Newest songs</h1>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-8 gap-4 mt-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              onClick={() => handlePlay(i)}
              className="relative group bg-neutral-400/5 cursor-pointer hover:bg-neutral-400/10 transition p-3 rounded-md"
            >
              <div className="relative aspect-square w-full h-full rounded-md overflow-hidden">
                <img className="object-cover w-full h-full" src={`https://picsum.photos/seed/${i + 40}/200`} alt="Song cover" />
                <div className="absolute bottom-2 right-2 transition opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 flex items-center justify-center bg-green-500 p-3 rounded-full drop-shadow-md hover:scale-105">
                  <Play className="text-black fill-black" size={20} />
                </div>
              </div>
              <div className="flex flex-col items-start w-full pt-4 gap-y-1">
                <p className="font-semibold truncate w-full">Song Name {i}</p>
                <p className="text-neutral-400 text-sm pb-4 w-full truncate">Artist Name</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
