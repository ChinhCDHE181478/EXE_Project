"use client";

import HeroSearch from "./_components/HeroSearch";
import NavTiles from "./_components/NavTiles";
import ExploreBanner from "./_components/ExploreBanner";
import Faq from "./_components/Faq";
import PricingSection from "./_components/PricingSection";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <HeroSearch />
      {/* <ChatStrip /> */}
      <NavTiles />
      <ExploreBanner />
      <PricingSection />
      <Faq />
    </main>
  );
}
