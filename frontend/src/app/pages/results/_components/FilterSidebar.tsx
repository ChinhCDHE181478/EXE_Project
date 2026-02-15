"use client";

import { useEffect, useState } from "react";

export type HotelFilters = {
  freeCancel: boolean;
  breakfast: boolean;
  minPrice?: number;
  maxPrice?: number;
  stars: number[];
};

export default function FilterSidebar({
  value,
  onChange,
}: {
  value: HotelFilters;
  onChange: (patch: Partial<any>) => void;
}) {
  const [freeCancel, setFreeCancel] = useState(value.freeCancel);
  const [breakfast, setBreakfast] = useState(value.breakfast);
  const [minPrice, setMinPrice] = useState<string>(value.minPrice?.toString() ?? "");
  const [maxPrice, setMaxPrice] = useState<string>(value.maxPrice?.toString() ?? "");
  const [stars, setStars] = useState<number[]>(value.stars ?? []);

  useEffect(() => {
    setFreeCancel(value.freeCancel);
    setBreakfast(value.breakfast);
    setMinPrice(value.minPrice?.toString() ?? "");
    setMaxPrice(value.maxPrice?.toString() ?? "");
    setStars(value.stars ?? []);
  }, [value.freeCancel, value.breakfast, value.minPrice, value.maxPrice, value.stars]);

  const toggleStar = (s: number) => {
    setStars((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const apply = () => {
    const min = minPrice.trim() ? Number(minPrice) : undefined;
    const max = maxPrice.trim() ? Number(maxPrice) : undefined;

    onChange({
      freeCancel,
      breakfast,
      minPrice: Number.isFinite(min as any) ? min : undefined,
      maxPrice: Number.isFinite(max as any) ? max : undefined,
      stars,
    });
  };

  return (
    <aside className="bg-white shadow-xl ring-1 ring-black/5">
      <div className="px-3 py-2 border-b border-black/5 flex items-center justify-between">
        <div className="text-slate-900 font-semibold">Bộ lọc</div>
        <button type="button" onClick={apply} className="text-sky-700 text-sm font-medium">
          Áp dụng
        </button>
      </div>

      <div className="px-3 py-2 overflow-auto text-[13px] leading-6">
        <div className="font-semibold text-slate-800 mb-1">Yên tâm đặt phòng</div>
        <label className="flex items-center gap-2">
          <input checked={freeCancel} onChange={(e) => setFreeCancel(e.target.checked)} type="checkbox" className="accent-sky-600" />
          Hủy miễn phí
        </label>
        <label className="flex items-center gap-2">
          <input checked={breakfast} onChange={(e) => setBreakfast(e.target.checked)} type="checkbox" className="accent-sky-600" />
          Bao gồm ăn sáng
        </label>

        <div className="mt-4 font-semibold text-slate-800">Giá</div>
        <div className="mt-2 flex items-center gap-2">
          <input
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min"
            className="w-24 rounded-md ring-1 ring-black/10 px-2 py-1"
          />
          <span>–</span>
          <input
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max"
            className="w-24 rounded-md ring-1 ring-black/10 px-2 py-1"
          />
          <button type="button" onClick={apply} className="ml-1 h-8 px-3 rounded-md bg-sky-600 text-white text-sm">
            Tìm
          </button>
        </div>

        <div className="mt-4 font-semibold text-slate-800">Xếp hạng sao</div>
        {[5, 4, 3, 2].map((s) => (
          <label key={s} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={stars.includes(s)}
              onChange={() => toggleStar(s)}
              className="accent-sky-600"
            />
            {s} sao
          </label>
        ))}

        <div className="mt-4">
          <button
            type="button"
            onClick={() => {
              setFreeCancel(false);
              setBreakfast(false);
              setMinPrice("");
              setMaxPrice("");
              setStars([]);
              onChange({ freeCancel: false, breakfast: false, minPrice: undefined, maxPrice: undefined, stars: [] });
            }}
            className="w-full h-10 rounded-lg border border-slate-200 text-slate-800 hover:bg-slate-50"
          >
            Xoá bộ lọc
          </button>
        </div>
      </div>
    </aside>
  );
}
