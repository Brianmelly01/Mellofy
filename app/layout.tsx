import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import Player from "@/components/Player";

const font = Figtree({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mellofy - Spotify Clone",
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
        <div className="flex h-full">
          <Sidebar />
          <main className="h-full flex-1 overflow-y-auto py-2 pr-2">
            {children}
          </main>
        </div>
        <Player />
      </body>
    </html>
  );
}
