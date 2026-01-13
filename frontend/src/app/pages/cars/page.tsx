"use client";

import CarBanner from "./_components/CarBanner";
import BenefitsRow from "./_components/BenefitsRow";
import PopularDestinations from "./_components/PopularDestinations";
import BestDealsHanoi from "./_components/BestDealsHanoi";
import HowToFindDeals from "./_components/HowToFindDeals";
import ReadyToPlan from "./_components/ReadyToPlan";

/* ====== PAGE ====== */
export default function CarsPage() {
  return (
    <main className="min-h-screen">
      <CarBanner />
      <BenefitsRow />
      <PopularDestinations />
      <BestDealsHanoi />
      <HowToFindDeals />
      <ReadyToPlan />
    </main>
  );
}
