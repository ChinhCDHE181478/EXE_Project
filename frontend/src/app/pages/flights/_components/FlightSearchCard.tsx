"use client";

import { useEffect, useMemo, useState } from "react";
import { pickIata } from "@/lib/utils/flight";

export type FlightSearchValue = {
  tripType: "ONEWAY" | "ROUND";
  from: string;
  to: string;
  departDate: string;
  returnDate?: string;
  adults: number;
  childrenAge?: string;
  cabinClass?: string;
  currency_code: string;
  nearbyFrom?: boolean;
  nearbyTo?: boolean;
  directOnly?: boolean;
};

const CABIN_LABEL: Record<string, string> = {
  "": "Phổ thông",
  ECONOMY: "Phổ thông",
  PREMIUM_ECONOMY: "Phổ thông cao cấp",
  BUSINESS: "Thương gia",
  FIRST: "Hạng nhất",
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function parseAges(csv: string): number[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map((x) => Number(String(x).trim()))
    .filter((x) => Number.isFinite(x) && x >= 0 && x <= 17);
}

function toCsv(ages: number[]): string {
  return ages.filter((x) => Number.isFinite(x)).map((x) => String(x)).join(",");
}

export default function FlightSearchCard({
  value,
  onSearch,
}: {
  value: FlightSearchValue;
  onSearch: (next: FlightSearchValue) => void;
}) {
  const [tripType, setTripType] = useState<FlightSearchValue["tripType"]>(value.tripType);
  const [from, setFrom] = useState(value.from);
  const [to, setTo] = useState(value.to);
  const [departDate, setDepartDate] = useState(value.departDate);
  const [returnDate, setReturnDate] = useState(value.returnDate ?? "");
  const [adults, setAdults] = useState<number>(value.adults ?? 1);
  const [cabinClass, setCabinClass] = useState(value.cabinClass ?? "");
  const [nearbyFrom, setNearbyFrom] = useState<boolean>(!!value.nearbyFrom);
  const [nearbyTo, setNearbyTo] = useState<boolean>(!!value.nearbyTo);
  const [directOnly, setDirectOnly] = useState<boolean>(!!value.directOnly);
  
  const [childrenCount, setChildrenCount] = useState<number>(() => parseAges(value.childrenAge ?? "").length);
  const [childrenAges, setChildrenAges] = useState<(number | null)[]>(() => {
    const parsed = parseAges(value.childrenAge ?? "");
    return parsed.map((n) => (Number.isFinite(n) ? n : null));
  });
  const [currencyCode, setCurrencyCode] = useState(value.currency_code ?? "VND");
  const [paxOpen, setPaxOpen] = useState(false);

  useEffect(() => {
    setTripType(value.tripType);
    setFrom(value.from);
    setTo(value.to);
    setDepartDate(value.departDate);
    setReturnDate(value.returnDate ?? "");
    setAdults(value.adults ?? 1);
    setCabinClass(value.cabinClass ?? "");
    setNearbyFrom(!!value.nearbyFrom);
    setNearbyTo(!!value.nearbyTo);
    setDirectOnly(!!value.directOnly);
    const parsed = parseAges(value.childrenAge ?? "");
    setChildrenCount(parsed.length);
    setChildrenAges(parsed.map((n) => (Number.isFinite(n) ? n : null)));
    setCurrencyCode(value.currency_code ?? "VND");
  }, [value]);

  useEffect(() => {
    setChildrenAges((prev) => {
      const next = prev.slice(0, childrenCount);
      while (next.length < childrenCount) next.push(null);
      return next;
    });
  }, [childrenCount]);

  useEffect(() => {
    if (!paxOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-flight-pax-popover='1']")) setPaxOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [paxOpen]);

  const swap = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  const handleSearch = () => {
    const normalizedChildren = clamp(Number(childrenCount) || 0, 0, 6);
    const selected = childrenAges.slice(0, normalizedChildren);
    const allAgesSelected = normalizedChildren === 0 || selected.every((x) => x !== null);

    if (!allAgesSelected) {
      setPaxOpen(true);
      return;
    }

    const ages = selected.map((x) => clamp(Number(x), 0, 17));
    onSearch({
      tripType,
      from: pickIata(from),
      to: pickIata(to),
      departDate,
      returnDate: tripType === "ROUND" ? returnDate || undefined : undefined,
      adults: clamp(Number(adults) || 1, 1, 9),
      childrenAge: ages.length ? toCsv(ages) : undefined,
      cabinClass: cabinClass || undefined,
      currency_code: currencyCode || "VND",
      nearbyFrom,
      nearbyTo,
      directOnly,
    });
  };

  const summaryPax = useMemo(() => {
    const a = clamp(Number(adults) || 1, 1, 9);
    const c = clamp(Number(childrenCount) || 0, 0, 6);
    const cabin = CABIN_LABEL[cabinClass] ?? CABIN_LABEL[""];
    const paxPart = c > 0 ? `${a} NL, ${c} TE` : `${a} NL`;
    return `${paxPart}, ${cabin}`;
  }, [adults, childrenCount, cabinClass]);

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      {/* 1. Trip Type Toggle */}
      <div className="flex items-center gap-2 mb-3">
        {["ROUND", "ONEWAY"].map((type) => (
          <button
            key={type}
            onClick={() => setTripType(type as any)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              tripType === type ? "bg-blue-600 text-white shadow-md" : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            {type === "ROUND" ? "Khứ hồi" : "Một chiều"}
          </button>
        ))}
      </div>

      {/* 2. Main Container */}
      <div className="bg-white rounded-lg shadow-2xl flex flex-col lg:flex-row items-stretch p-1">
        
        {/* From */}
        <div className="relative flex-1 px-4 py-2 hover:bg-slate-50 transition-colors rounded-l-md">
          <label className="block text-[11px] font-bold text-slate-400 uppercase">Từ</label>
          <input
            className="w-full bg-transparent font-bold text-slate-800 outline-none py-1"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="Hà Nội (HAN)"
          />
          <button 
            onClick={swap}
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white border border-slate-100 rounded-full p-1.5 shadow-md hover:scale-110 transition-all text-blue-500 hidden lg:block"
          >
            ⇄
          </button>
        </div>

        {/* To */}
        <div className="flex-1 px-4 py-2 border-l border-slate-100 hover:bg-slate-50 transition-colors">
          <label className="block text-[11px] font-bold text-slate-400 uppercase">Đến</label>
          <input
            className="w-full bg-transparent font-bold text-slate-800 outline-none py-1"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Đà Nẵng (DAD)"
          />
        </div>

        {/* Departure Date */}
        <div className="flex-1 px-4 py-2 border-l border-slate-100 hover:bg-slate-50 transition-colors">
          <label className="block text-[11px] font-bold text-slate-400 uppercase">Ngày đi</label>
          <input
            type="date"
            className="w-full bg-transparent font-bold text-slate-800 outline-none py-1 text-sm cursor-pointer"
            value={departDate}
            onChange={(e) => setDepartDate(e.target.value)}
          />
        </div>

        {/* Return Date */}
        <div className={`flex-1 px-4 py-2 border-l border-slate-100 hover:bg-slate-50 transition-colors ${tripType === "ONEWAY" ? "opacity-40" : ""}`}>
          <label className="block text-[11px] font-bold text-slate-400 uppercase">Ngày về</label>
          <input
            type="date"
            disabled={tripType === "ONEWAY"}
            className="w-full bg-transparent font-bold text-slate-800 outline-none py-1 text-sm cursor-pointer disabled:cursor-not-allowed"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
          />
        </div>

        {/* Pax Popover */}
        <div className="relative flex-[1.4] border-l border-slate-100" data-flight-pax-popover="1">
          <div 
            className="px-4 py-2 hover:bg-slate-50 transition-colors cursor-pointer h-full"
            onClick={() => setPaxOpen(!paxOpen)}
          >
            <label className="block text-[11px] font-bold text-slate-400 uppercase">Hành khách & Hạng ghế</label>
            <div className="font-bold text-slate-800 py-1 text-sm truncate">{summaryPax}</div>
          </div>

          {paxOpen && (
            <div className="absolute right-0 lg:left-0 top-[calc(100%+8px)] z-50 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 p-5 space-y-5">
              {/* Cabin Class */}
              <div>
                <label className="text-xs font-bold text-slate-500 mb-2 block">Hạng khoang</label>
                <select 
                  value={cabinClass} 
                  onChange={(e) => setCabinClass(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 ring-blue-100"
                >
                  {Object.entries(CABIN_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              {/* Adults & Children Count */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">Người lớn</p>
                    <p className="text-[10px] text-slate-400">Trên 18 tuổi</p>
                  </div>
                  <div className="flex items-center gap-3 border rounded-lg p-1">
                    <button onClick={() => setAdults(a => clamp(a-1, 1, 9))} className="w-7 h-7 hover:bg-slate-100 rounded">-</button>
                    <span className="w-4 text-center text-sm font-bold">{adults}</span>
                    <button onClick={() => setAdults(a => clamp(a+1, 1, 9))} className="w-7 h-7 hover:bg-slate-100 rounded">+</button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">Trẻ em</p>
                    <p className="text-[10px] text-slate-400">0 - 17 tuổi</p>
                  </div>
                  <div className="flex items-center gap-3 border rounded-lg p-1">
                    <button onClick={() => setChildrenCount(c => clamp(c-1, 0, 6))} className="w-7 h-7 hover:bg-slate-100 rounded">-</button>
                    <span className="w-4 text-center text-sm font-bold">{childrenCount}</span>
                    <button onClick={() => setChildrenCount(c => clamp(c+1, 0, 6))} className="w-7 h-7 hover:bg-slate-100 rounded">+</button>
                  </div>
                </div>
              </div>

              {/* Children Ages Selection */}
              {childrenCount > 0 && (
                <div className="pt-2 border-t border-slate-100 max-h-40 overflow-y-auto space-y-3">
                  {Array.from({ length: childrenCount }).map((_, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">Tuổi trẻ {idx + 1}</span>
                      <select
                        value={childrenAges[idx] ?? ""}
                        onChange={(e) => setChildrenAges(ages => {
                          const copy = [...ages];
                          copy[idx] = e.target.value === "" ? null : Number(e.target.value);
                          return copy;
                        })}
                        className="border border-slate-200 rounded p-1 text-xs outline-none"
                      >
                        <option value="" disabled>Chọn</option>
                        {Array.from({ length: 18 }).map((_, age) => <option key={age} value={age}>{age}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              <button 
                onClick={() => setPaxOpen(false)}
                className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-bold hover:bg-blue-700 transition-colors"
              >
                Áp dụng
              </button>
            </div>
          )}
        </div>

        {/* Search Button */}
        <div className="px-4 py-3 flex items-end justify-end">
                <button
                  type="button"
                  className="h-12 px-6 rounded-lg bg-[#0891b2] text-white font-semibold hover:brightness-110 disabled:opacity-50"
                  onClick={handleSearch}
                >
                  Tìm kiếm
                </button>
              </div>
      </div>

      {/* 3. Footer Checkboxes */}
      <div className="flex flex-wrap gap-6 mt-4 px-1">
        {[
          { label: "Thêm sân bay lân cận", state: nearbyFrom, setter: setNearbyFrom },
          { label: "Chuyến bay thẳng", state: directOnly, setter: setDirectOnly }
        ].map((item, i) => (
          <label key={i} className="flex items-center gap-2 text-white text-sm cursor-pointer group">
            <input 
              type="checkbox" 
              checked={item.state} 
              onChange={(e) => item.setter(e.target.checked)}
              className="w-4 h-4 rounded border-none accent-blue-500 cursor-pointer" 
            />
            <span className="opacity-80 group-hover:opacity-100 transition-opacity">{item.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}