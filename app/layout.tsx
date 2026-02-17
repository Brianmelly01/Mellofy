import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";
import Player from "@/components/Player";
import AuthModal from "@/components/AuthModal";

const font = Figtree({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mellofy - Music & Videos",
  description: "Listen to music and videos for free.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={font.className}>
        <AuthModal />
        <TopNav />
        <main className="h-full overflow-y-auto bg-gradient-to-b from-neutral-900 via-black to-black">
          {children}
        </main>
        <BottomNav />
        <Player />
      </body>
    </html>
  );
}
