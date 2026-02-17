"use client";

import HotelBanner from "./_components/HotelBanner";
import BenefitsStrip from "./_components/BenefitsStrip";
import CityBreakSection from "./_components/CityBreakSection";
import Faq from "./_components/Faq";

export default function HotelsPage() {
  return (
    <main className="min-h-screen">
      <HotelBanner />
      {/* <BrandRow /> */}
      {/* <DomesticSection /> */}
      <CityBreakSection />
      <BenefitsStrip />
      <Faq />
    </main>
  );
}
