"use client";

import HotelBanner from "./_components/HotelBanner";
import BrandRow from "./_components/BrandRow";
import BenefitsStrip from "./_components/BenefitsStrip";
import DomesticSection from "./_components/DomesticSection";
import CityBreakSection from "./_components/CityBreakSection";
import Faq from "./_components/Faq";

export default function HotelsPage() {
  return (
    <main className="min-h-screen">
      <HotelBanner />
      <BrandRow />
      <DomesticSection />
      <CityBreakSection />
      <BenefitsStrip />
      <Faq />
    </main>
  );
}
