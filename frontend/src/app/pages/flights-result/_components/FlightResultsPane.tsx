"use client";

import { useState } from "react";
import FlightOfferCard from "./FlightOfferCard";
import FlightPagination from "./FlightPagination";
import FlightFiltersSidebar, { FlightUiFilters } from "./FlightFiltersSidebar";

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
  const [filters, setFilters] = useState<FlightUiFilters>({
    stops: { direct: true, oneStop: true, twoPlus: true },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <div className="h-96 bg-slate-200 animate-pulse rounded-xl hidden lg:block" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-white ring-1 ring-slate-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="rounded-xl bg-red-50 p-6 text-red-600 border border-red-200">{error}</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
      {/* Sidebar Lọc bên trái */}
      <aside className="sticky top-24 hidden lg:block">
        <FlightFiltersSidebar
          offers={offers}
          value={filters}
          onChange={(patch) => setFilters(prev => ({ ...prev, ...patch }))}
        />
      </aside>

      {/* Danh sách kết quả bên phải */}
      <div className="space-y-4">
        {/* Header Phân loại (Tốt nhất, Rẻ nhất...) */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button className="bg-slate-900 text-white p-3 rounded-xl shadow-sm text-left ring-1 ring-slate-900">
            <div className="text-[10px] uppercase font-bold opacity-70">Tốt nhất</div>
            <div className="text-sm font-bold">808.000 đ</div>
            <div className="text-[10px] opacity-60">1g 20m (Trung bình)</div>
          </button>
          <button className="bg-white text-slate-600 p-3 rounded-xl shadow-sm text-left ring-1 ring-slate-200 hover:bg-slate-50 transition-colors">
            <div className="text-[10px] uppercase font-bold opacity-70 text-slate-400">Rẻ nhất</div>
            <div className="text-sm font-bold">808.000 đ</div>
            <div className="text-[10px] opacity-60 text-slate-400">1g 20m</div>
          </button>
          <button className="bg-white text-slate-600 p-3 rounded-xl shadow-sm text-left ring-1 ring-slate-200 hover:bg-slate-50 transition-colors">
            <div className="text-[10px] uppercase font-bold opacity-70 text-slate-400">Nhanh nhất</div>
            <div className="text-sm font-bold">861.000 đ</div>
            <div className="text-[10px] opacity-60 text-slate-400">1g 15m</div>
          </button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-700">{offers?.length} kết quả được tìm thấy</h2>
          <div className="text-xs text-blue-600 font-semibold cursor-pointer">Hiển thị toàn bộ tháng</div>
        </div>

        {offers?.length > 0 ? (
          <>
            <div className="space-y-4">
              {offers.map((offer) => (
                <FlightOfferCard key={offer?.token || Math.random()} offer={offer} />
              ))}
            </div>
            <FlightPagination currentPage={currentPage} totalPages={totalPages} buildHref={buildHref} />
          </>
        ) : (
          <div className="bg-white p-10 rounded-xl text-center border border-slate-200 text-slate-500">
            Không tìm thấy chuyến bay phù hợp.
          </div>
        )}
      </div>
    </div>
  );
}