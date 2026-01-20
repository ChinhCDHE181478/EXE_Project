"use client";

import FlightOfferCard from "./FlightOfferCard";
import FlightPagination from "./FlightPagination";

export default function FlightResultsPane({
  offers,
  isLoading,
  error,
  currentPage,
  totalPages,
  buildHref,
}: {
  offers: any[];
  isLoading: boolean;
  error?: string | null;
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-[132px] rounded-2xl bg-white ring-1 ring-slate-200 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-white ring-1 ring-red-200 p-5 text-red-600">
        {error}
      </div>
    );
  }

  if (!offers?.length) {
    return (
      <div className="rounded-2xl bg-white ring-1 ring-slate-200 p-5 text-slate-700">
        Không tìm thấy chuyến bay phù hợp.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {offers.map((offer) => (
          <FlightOfferCard key={offer?.token ?? Math.random()} offer={offer} />
        ))}
      </div>

      <FlightPagination
        currentPage={currentPage}
        totalPages={totalPages}
        buildHref={buildHref}
      />
    </>
  );
}
