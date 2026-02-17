import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";
<<<<<<< HEAD
import { TopNav } from "@/components/TopNav";
=======
>>>>>>> 208d31989d1d1ffc320c3a0b64ec05ff94fc4379
import { BottomNav } from "@/components/BottomNav";
import Player from "@/components/Player";
import AuthModal from "@/components/AuthModal";

const font = Figtree({ subsets: ["latin"] });

export const metadata: Metadata = {
<<<<<<< HEAD
  title: "Mellofy - Music & Videos",
  description: "Listen to music and videos for free.",
=======
  title: "Mellofy - Ultra-Premium Music Hub",
  description: "Experience infinite music with zero blocks.",
>>>>>>> 208d31989d1d1ffc320c3a0b64ec05ff94fc4379
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={cn(font.className, "bg-background text-foreground h-full overflow-hidden")}>
        <AuthModal />
<<<<<<< HEAD
        <TopNav />
        <main className="h-full overflow-y-auto bg-gradient-to-b from-neutral-900 via-black to-black">
          {children}
        </main>
        <BottomNav />
        <Player />
=======
        <div className="flex h-full flex-col">
          <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
            {children}
          </main>
          <BottomNav />
        </div>
        <div className="fixed bottom-24 left-0 right-0 z-40 px-4 md:bottom-6">
          <Player />
        </div>
>>>>>>> 208d31989d1d1ffc320c3a0b64ec05ff94fc4379
      </body>
    </html>
  );
}
