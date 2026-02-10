"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { flightService } from "@/lib/services/flight";

// --- SVG Icons ---
const PlaneIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 12h20" /><path d="M13 2l9 10-9 10" /><path d="M2 12l5-5m0 10l-5-5" /></svg>
);
const CalendarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
);
const UserIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
const SearchIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
);
const CheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12" /></svg>
);
const ArrowRightArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M7 10h14l-4-4" /><path d="M17 14H3l4 4" /></svg>
);

// --- Types ---
export type FlightSearchValue = {
  tripType: "ONEWAY" | "ROUND";
  from: string;
  to: string;
  fromId?: string;
  toId?: string;
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

type DestinationOption = {
  id: string;
  label: string;
};

const CABIN_LABEL: Record<string, string> = {
  "": "Phổ thông",
  ECONOMY: "Phổ thông",
  PREMIUM_ECONOMY: "PT Đặc biệt",
  BUSINESS: "Thương gia",
  FIRST: "Hạng nhất",
};

// --- Helpers ---
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

function asString(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

// Format Date YYYY-MM-DD to DD/MM/YYYY
function formatDateDisplay(isoDate: string): string {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
}

function normalizeDestination(item: any): DestinationOption | null {
  const id =
    asString(item?.id) ||
    asString(item?.locationId) ||
    asString(item?.destId) ||
    asString(item?.code);

  const label =
    asString(item?.label) ||
    asString(item?.displayName) ||
    asString(item?.name) ||
    asString(item?.cityName) ||
    asString(item?.city) ||
    id;

  if (!id) return null;
  return { id, label };
}

function normalizeDestinationList(raw: any): DestinationOption[] {
  const source = Array.isArray(raw) ? raw : raw?.result ?? raw?.items ?? raw?.data ?? [];
  if (!Array.isArray(source)) return [];
  return source
    .map((item) => normalizeDestination(item))
    .filter((item): item is DestinationOption => !!item);
}

// --- Component: Dropdown List ---
const DropdownList = ({
  loading,
  items,
  onSelect,
  onClose
}: {
  loading: boolean;
  items: DestinationOption[];
  onSelect: (item: DestinationOption) => void;
  onClose: () => void;
}) => (
  <div className="absolute left-0 top-[calc(100%+8px)] z-50 rounded-lg bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top font-sans min-w-full w-max max-w-[450px]">
    <div className="max-h-[320px] overflow-auto custom-scrollbar">
      {loading && (
        <div className="px-4 py-8 text-sm text-slate-500 flex flex-col items-center justify-center gap-2 min-w-[250px]">
          <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span>Đang tìm kiếm...</span>
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="px-4 py-8 text-center flex flex-col items-center min-w-[250px]">
          <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mb-2 text-slate-400">
            <SearchIcon className="w-5 h-5" />
          </div>
          <span className="text-slate-900 font-medium text-sm">Không tìm thấy địa điểm</span>
        </div>
      )}

      {!loading &&
        items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className="w-full text-left px-4 py-3 hover:bg-slate-100 transition-colors flex items-center gap-4 border-b border-slate-50 last:border-0 group"
          >
            <div className="text-slate-400 group-hover:text-slate-600 transition-colors shrink-0">
              <PlaneIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-semibold text-slate-900 whitespace-nowrap">{item.label}</span>
              </div>
              <div className="text-[13px] text-slate-500 truncate mt-0.5">Việt Nam</div>
            </div>
          </button>
        ))}
    </div>
  </div>
);


// --- Main Component ---
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
  const [fromId, setFromId] = useState(value.fromId ?? value.from);
  const [toId, setToId] = useState(value.toId ?? value.to);
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
  const [fromSuggest, setFromSuggest] = useState<DestinationOption[]>([]);
  const [toSuggest, setToSuggest] = useState<DestinationOption[]>([]);
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [loadingFromSuggest, setLoadingFromSuggest] = useState(false);
  const [loadingToSuggest, setLoadingToSuggest] = useState(false);
  const [paxOpen, setPaxOpen] = useState(false);

  // Refs for click outside AND date picker triggering
  const fromContainerRef = useRef<HTMLDivElement>(null);
  const toContainerRef = useRef<HTMLDivElement>(null);
  const paxContainerRef = useRef<HTMLDivElement>(null);

  // NEW: Refs for Date Inputs
  const departDateRef = useRef<HTMLInputElement>(null);
  const returnDateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTripType(value.tripType);
    setFrom(value.from);
    setTo(value.to);
    setFromId(value.fromId ?? value.from);
    setToId(value.toId ?? value.to);
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
    if (!fromOpen && fromId) return;
    const q = from.trim();
    if (q.length < 2) {
      setFromSuggest([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      setLoadingFromSuggest(true);
      try {
        const data = await flightService.searchListDestination(q, "vi");
        setFromSuggest(normalizeDestinationList(data));
      } catch {
        setFromSuggest([]);
      } finally {
        setLoadingFromSuggest(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [from]);

  useEffect(() => {
    if (!toOpen && toId) return;
    const q = to.trim();
    if (q.length < 2) {
      setToSuggest([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      setLoadingToSuggest(true);
      try {
        const data = await flightService.searchListDestination(q, "vi");
        setToSuggest(normalizeDestinationList(data));
      } catch {
        setToSuggest([]);
      } finally {
        setLoadingToSuggest(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [to]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (paxContainerRef.current && !paxContainerRef.current.contains(target)) setPaxOpen(false);
      if (fromContainerRef.current && !fromContainerRef.current.contains(target)) setFromOpen(false);
      if (toContainerRef.current && !toContainerRef.current.contains(target)) setToOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  const swap = () => {
    const tempFrom = from;
    const tempFromId = fromId;
    setFrom(to);
    setFromId(toId);
    setTo(tempFrom);
    setToId(tempFromId);
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
    const finalFromId = fromId || from.trim();
    const finalToId = toId || to.trim();

    onSearch({
      tripType,
      from: from.trim(),
      to: to.trim(),
      fromId: finalFromId,
      toId: finalToId,
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
    const paxPart = c > 0 ? `${a} Lớn, ${c} Trẻ` : `${a} Người lớn`;
    return `${paxPart}, ${cabin}`;
  }, [adults, childrenCount, cabinClass]);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 font-sans text-slate-900">
      {/* Trip Type & Options */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 pl-1 gap-4">
        <div className="flex items-center gap-3">
          {[
            { id: "ROUND", label: "Khứ hồi" },
            { id: "ONEWAY", label: "Một chiều" }
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setTripType(type.id as FlightSearchValue["tripType"])}
              className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-200 flex items-center gap-2 ${tripType === type.id
                ? "bg-[#0891b2] text-white shadow-md"
                : "bg-white text-[#0891b2] border border-[#0891b2]/30 hover:border-[#0891b2] hover:bg-[#0891b2]/10"
                }`}

            >
              {tripType === type.id && <CheckIcon className="w-3.5 h-3.5" />}
              {type.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-6 px-2">
          {[
            { label: "Tìm sân bay gần đây", state: nearbyFrom, setter: setNearbyFrom },
            { label: "Chỉ bay thẳng", state: directOnly, setter: setDirectOnly },
          ].map((item, i) => (
            <label key={i} className="flex items-center gap-2.5 text-white text-sm cursor-pointer group select-none">
              <div
                className={`w-5 h-5 rounded flex items-center justify-center border transition-all duration-200 ${item.state
                    ? "bg-[#0891b2] border-[#0891b2]"
                    : "border-white/40 bg-white/5 hover:border-white/70"
                  }`}
              >
                {item.state && <CheckIcon className="w-3.5 h-3.5 text-white" />}
              </div>

              <input
                type="checkbox"
                checked={item.state}
                onChange={(e) => item.setter(e.target.checked)}
                className="hidden"
              />
              <span className="opacity-90 group-hover:opacity-100 transition-opacity font-medium drop-shadow-md">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Main Search Box Container */}
      <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] grid grid-cols-1 lg:grid-cols-[1.8fr_0.1px_1.8fr_0.1px_1.2fr_0.1px_1.2fr_0.1px_1.5fr_auto] items-center p-1 relative z-20">

        {/* FROM */}
        <div className="relative group h-full" ref={fromContainerRef}>
          <div className="px-5 py-3 hover:bg-slate-100 transition-colors rounded-lg cursor-text h-full flex flex-col justify-center relative z-10" onClick={() => setFromOpen(true)}>
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 pointer-events-none">
              <PlaneIcon className="w-3.5 h-3.5" /> Đi từ
            </label>
            <input
              className="w-full bg-transparent font-bold text-slate-900 text-[17px] outline-none placeholder:text-slate-300 truncate leading-tight"
              value={from}
              onFocus={() => setFromOpen(true)}
              onChange={(e) => {
                setFrom(e.target.value);
                if (e.target.value !== from) setFromId("");
                setFromOpen(true);
              }}
              placeholder="Chọn sân bay"
              autoComplete="off"
            />
          </div>

          {fromOpen && (
            <DropdownList
              loading={loadingFromSuggest}
              items={fromSuggest}
              onSelect={(item) => {
                setFrom(item.label);
                setFromId(item.id);
                setFromOpen(false);
              }}
              onClose={() => setFromOpen(false)}
            />
          )}

          {/* Swap Button */}
          <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 hidden lg:block">
            <button
              onClick={swap}
              className="bg-white border border-slate-200 rounded-full p-1.5 shadow-sm hover:shadow-md hover:bg-slate-50 text-slate-500 hover:text-blue-600 transition-all hover:rotate-180 duration-300"
              title="Hoán đổi"
            >
              <ArrowRightArrowLeftIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="hidden lg:block w-[1px] h-3/4 bg-slate-200 mx-auto"></div>

        {/* TO */}
        <div className="relative group h-full" ref={toContainerRef}>
          <div className="px-5 py-3 hover:bg-slate-100 transition-colors rounded-lg cursor-text h-full flex flex-col justify-center pl-6" onClick={() => setToOpen(true)}>
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 pointer-events-none">
              <PlaneIcon className="w-3.5 h-3.5" /> Đến
            </label>
            <input
              className="w-full bg-transparent font-bold text-slate-900 text-[17px] outline-none placeholder:text-slate-300 truncate leading-tight"
              value={to}
              onFocus={() => setToOpen(true)}
              onChange={(e) => {
                setTo(e.target.value);
                if (e.target.value !== to) setToId("");
                setToOpen(true);
              }}
              placeholder="Chọn sân bay"
              autoComplete="off"
            />
          </div>

          {toOpen && (
            <DropdownList
              loading={loadingToSuggest}
              items={toSuggest}
              onSelect={(item) => {
                setTo(item.label);
                setToId(item.id);
                setToOpen(false);
              }}
              onClose={() => setToOpen(false)}
            />
          )}
        </div>

        <div className="hidden lg:block w-[1px] h-3/4 bg-slate-200 mx-auto"></div>

        {/* DEPART DATE - FIX: Added onClick to container and ref to input */}
        <div
          className="group h-full px-4 py-3 hover:bg-slate-100 transition-colors rounded-lg flex flex-col justify-center relative cursor-pointer"
          onClick={() => departDateRef.current?.showPicker()}
        >
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 pointer-events-none relative z-10">
            <CalendarIcon className="w-3.5 h-3.5" /> Ngày đi
          </label>
          <div className="relative w-full h-[26px]">
            <div className={`absolute inset-0 flex items-center font-bold text-[15px] pointer-events-none ${departDate ? "text-slate-900" : "text-slate-300"}`}>
              {departDate ? formatDateDisplay(departDate) : "DD/MM/YYYY"}
            </div>
            <input
              ref={departDateRef}
              type="date"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              value={departDate}
              onChange={(e) => setDepartDate(e.target.value)}
            />
          </div>
        </div>

        <div className="hidden lg:block w-[1px] h-3/4 bg-slate-200 mx-auto"></div>

        {/* RETURN DATE - FIX: Added onClick to container and ref to input */}
        <div
          className={`group h-full px-4 py-3 transition-colors rounded-lg flex flex-col justify-center relative ${tripType === "ONEWAY" ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-100 cursor-pointer"
            }`}
          onClick={() => tripType === "ROUND" && returnDateRef.current?.showPicker()}
        >
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 pointer-events-none relative z-10">
            <CalendarIcon className="w-3.5 h-3.5" /> Ngày về
          </label>
          <div className="relative w-full h-[26px]">
            <div className={`absolute inset-0 flex items-center font-bold text-[15px] pointer-events-none ${returnDate ? "text-slate-900" : "text-slate-300"}`}>
              {returnDate ? formatDateDisplay(returnDate) : "DD/MM/YYYY"}
            </div>
            <input
              ref={returnDateRef}
              type="date"
              disabled={tripType === "ONEWAY"}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-20"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
            />
          </div>
        </div>

        <div className="hidden lg:block w-[1px] h-3/4 bg-slate-200 mx-auto"></div>

        {/* PAX & CABIN */}
        <div className="relative group h-full" ref={paxContainerRef}>
          <div className="px-5 py-3 hover:bg-slate-100 transition-colors cursor-pointer h-full rounded-lg flex flex-col justify-center" onClick={() => setPaxOpen(!paxOpen)}>
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
              <UserIcon className="w-3.5 h-3.5" /> Hành khách
            </label>
            <div className="font-bold text-slate-900 text-[15px] truncate leading-tight">{summaryPax}</div>
          </div>

          {paxOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 bg-white rounded-xl shadow-2xl ring-1 ring-black/10 p-5 space-y-5 animate-in fade-in zoom-in-95 duration-200 cursor-default origin-top-right">
              {/* Cabin Class Selection */}
              <div>
                <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">Hạng ghế</label>
                <div className="relative">
                  <select
                    value={cabinClass}
                    onChange={(e) => setCabinClass(e.target.value)}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 text-sm font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                  >
                    {Object.entries(CABIN_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                  </div>
                </div>
              </div>

              <div className="h-[1px] bg-slate-100"></div>

              {/* Pax Counters */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-800">Người lớn</p>
                    <p className="text-[11px] text-slate-400">Từ 18 tuổi</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setAdults((a) => clamp(a - 1, 1, 9))} className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-full text-slate-600 hover:border-blue-500 hover:text-blue-500 transition-colors disabled:opacity-30">-</button>
                    <span className="w-6 text-center text-sm font-bold text-slate-800">{adults}</span>
                    <button onClick={() => setAdults((a) => clamp(a + 1, 1, 9))} className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-full text-slate-600 hover:border-blue-500 hover:text-blue-500 transition-colors">+</button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-800">Trẻ em</p>
                    <p className="text-[11px] text-slate-400">0 - 17 tuổi</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setChildrenCount((c) => clamp(c - 1, 0, 6))} className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-full text-slate-600 hover:border-blue-500 hover:text-blue-500 transition-colors disabled:opacity-30">-</button>
                    <span className="w-6 text-center text-sm font-bold text-slate-800">{childrenCount}</span>
                    <button onClick={() => setChildrenCount((c) => clamp(c + 1, 0, 6))} className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-full text-slate-600 hover:border-blue-500 hover:text-blue-500 transition-colors">+</button>
                  </div>
                </div>
              </div>

              {/* Children Ages */}
              {childrenCount > 0 && (
                <div className="pt-3 border-t border-slate-100 max-h-40 overflow-y-auto space-y-3 custom-scrollbar">
                  {Array.from({ length: childrenCount }).map((_, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-xs text-slate-600 font-medium">Tuổi trẻ em {idx + 1}</span>
                      <select
                        value={childrenAges[idx] ?? ""}
                        onChange={(e) =>
                          setChildrenAges((ages) => {
                            const copy = [...ages];
                            copy[idx] = e.target.value === "" ? null : Number(e.target.value);
                            return copy;
                          })
                        }
                        className="border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-blue-500 bg-white"
                      >
                        <option value="" disabled>-</option>
                        {Array.from({ length: 18 }).map((_, age) => (
                          <option key={age} value={age}>{age}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setPaxOpen(false)}
                className="w-full bg-blue-600 text-white rounded-lg py-3 text-sm font-bold hover:bg-blue-700 hover:shadow-lg transition-all"
              >
                Xong
              </button>
            </div>
          )}
        </div>

        {/* Search Button */}
        <div className="p-1">
          <button
            type="button"
            className="h-[52px] w-full lg:w-auto px-6 rounded-lg bg-[#0891b2] text-white font-bold hover:brightness-110 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all flex items-center justify-center gap-2"
            onClick={handleSearch}
          >
            <SearchIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}