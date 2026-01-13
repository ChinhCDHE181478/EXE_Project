"use client";

import HeroSearch from "./_components/HeroSearch";
import ChatStrip from "./_components/ChatStrip";
import NavTiles from "./_components/NavTiles";
import ExploreBanner from "./_components/ExploreBanner";
import Faq from "./_components/Faq";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <HeroSearch />
      <ChatStrip />
      <NavTiles />
      <ExploreBanner />
      <Faq />
    </main>
  );
}
