"use client";

import { useEffect, useState } from "react";

export type HotelFilters = {
  freeCancel: boolean;
  breakfast: boolean;
  minPrice?: number;
  maxPrice?: number;
  stars: number[];
};

export type FlightUiFilters = {
  stops: { direct: boolean; oneStop: boolean; twoPlus: boolean };
};

export default function FilterSidebar({
  offers,
  value,
  onChange,
}: {
  offers?: any[];
  value: HotelFilters | FlightUiFilters;
  onChange: (patch: Partial<HotelFilters | FlightUiFilters>) => void;
}) {
  // Check if this is FlightUiFilters
  const isFlightFilters = 'stops' in value;

  if (isFlightFilters) {
    // For flights, show minimal/placeholder UI for now
    return (
      <div className="bg-white rounded-xl p-6 space-y-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-800">Bộ lọc</h3>
        </div>
        <div className="text-sm text-slate-500">
          Flight filters coming soon...
        </div>
      </div>
    );
  }

  // Original hotel filter logic
  const hotelValue = value as HotelFilters;

  // Local state để nhập giá mượt hơn (debounce)
  const [minP, setMinP] = useState(hotelValue.minPrice?.toString() ?? "");
  const [maxP, setMaxP] = useState(hotelValue.maxPrice?.toString() ?? "");

  // Sync khi value từ cha thay đổi (ví dụ reset filter)
  useEffect(() => {
    setMinP(hotelValue.minPrice?.toString() ?? "");
    setMaxP(hotelValue.maxPrice?.toString() ?? "");
  }, [hotelValue.minPrice, hotelValue.maxPrice]);

  const handlePriceBlur = () => {
    onChange({
      minPrice: minP ? Number(minP) : undefined,
      maxPrice: maxP ? Number(maxP) : undefined,
    });
  };

  const toggleStar = (star: number) => {
    const current = hotelValue.stars || [];
    const next = current.includes(star)
      ? current.filter((s) => s !== star)
      : [...current, star];
    onChange({ stars: next });
  };

  return (
    <div className="space-y-6 pb-10">

      {/* 1. Tiêu đề + Nút Xóa */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg text-slate-800">Bộ lọc</h3>
        <button
          onClick={() => onChange({ freeCancel: false, breakfast: false, minPrice: undefined, maxPrice: undefined, stars: [] })}
          className="text-sm text-blue-600 hover:underline font-medium"
        >
          Xóa tất cả
        </button>
      </div>

      {/* 2. Tiện ích (Yên tâm đặt phòng) */}
      <div className="space-y-3">
        <h4 className="font-bold text-sm text-slate-700">Yên tâm đặt phòng</h4>
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={value.freeCancel}
            onChange={(e) => onChange({ freeCancel: e.target.checked })}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <span className="text-sm text-slate-600 group-hover:text-slate-900">Hủy miễn phí</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={value.breakfast}
            onChange={(e) => onChange({ breakfast: e.target.checked })}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <span className="text-sm text-slate-600 group-hover:text-slate-900">Bao gồm ăn sáng</span>
        </label>
      </div>

      <hr className="border-slate-100" />

      {/* 3. Khoảng giá (SỬA LỖI SCROLL) */}
      <div className="space-y-3">
        <h4 className="font-bold text-sm text-slate-700">Giá (VND)</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <input
              type="number"
              placeholder="Min"
              value={minP}
              onChange={(e) => setMinP(e.target.value)}
              onBlur={handlePriceBlur}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="relative">
            <input
              type="number"
              placeholder="Max"
              value={maxP}
              onChange={(e) => setMaxP(e.target.value)}
              onBlur={handlePriceBlur}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* 4. Xếp hạng sao */}
      <div className="space-y-3">
        <h4 className="font-bold text-sm text-slate-700">Xếp hạng sao</h4>
        {[5, 4, 3, 2].map((star) => (
          <label key={star} className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={hotelValue.stars?.includes(star)}
              onChange={() => toggleStar(star)}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <div className="flex items-center text-yellow-400 text-sm">
              {Array.from({ length: star }).map((_, i) => (
                <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                </svg>
              ))}
              <span className="text-slate-600 ml-2 group-hover:text-slate-900 font-medium">{star} sao</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}