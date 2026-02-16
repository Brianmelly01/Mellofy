import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import Player from "@/components/Player";
import AuthModal from "@/components/AuthModal";

const font = Figtree({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mellofy - Ultra-Premium Music Hub",
  description: "Experience infinite music with zero blocks.",
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
        <div className="flex h-full flex-col">
          <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
            {children}
          </main>
          <BottomNav />
        </div>
        <div className="fixed bottom-24 left-0 right-0 z-40 px-4 md:bottom-6">
          <Player />
        </div>
      </body>
    </html>
  );
}
