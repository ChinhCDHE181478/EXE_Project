"use client";
import BannerSection from "@/app/pages/flights/_components/BannerSection";
import CheapFlights from "@/app/pages/flights/_components/CheapFlights";

export default function Home() {
  return (
    <main className="min-h-screen">
      <BannerSection />
      <CheapFlights />
    </main>
  );
}
