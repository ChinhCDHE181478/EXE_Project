"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FilterSidebar, { HotelFilters } from "./_components/FilterSidebar";
import ResultsPane, { UiHotel } from "./_components/ResultsPane";
import MapPane from "./_components/MapPane";
import { hotelService } from "@/lib/services/hotel";

// --- SVG Icons (Giống FlightSearchCard) ---
const SearchIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
);
const BuildingIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" /></svg>
);
const PlaneIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 12h20" /><path d="M13 2l9 10-9 10" /><path d="M2 12l5-5m0 10l-5-5" /></svg>
);
const MapPinIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
);
const CalendarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
);
const UserIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);

// --- Helpers ---
function formatDateDisplay(isoDate: string): string {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

type Dest = {
  id?: string;
  name?: string;
  city?: string;
  label?: string;
  type?: string;
  latitude?: number;
  longitude?: number;
};

// --- Hotel Search Box Component (Đồng bộ Style với FlightSearchCard) ---
const HotelSearchBox = ({
  init,
  onSearch
}: {
  init: { q: string, checkIn: string, checkOut: string, adults: number, rooms: number },
  onSearch: (val: any) => void
}) => {
  const [q, setQ] = useState(init.q);
  const [checkIn, setCheckIn] = useState(init.checkIn);
  const [checkOut, setCheckOut] = useState(init.checkOut);
  const [adults, setAdults] = useState(init.adults);
  const [rooms, setRooms] = useState(init.rooms);

  // UI States
  const [suggest, setSuggest] = useState<Dest[]>([]);
  const [openSuggest, setOpenSuggest] = useState(false);
  const [openGuest, setOpenGuest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  // Refs
  const suggestRef = useRef<HTMLDivElement>(null);
  const guestRef = useRef<HTMLDivElement>(null);
  const checkInRef = useRef<HTMLInputElement>(null);
  const checkOutRef = useRef<HTMLInputElement>(null);
  const pickedRef = useRef<Dest | null>(null);

  useEffect(() => {
    setQ(init.q);
    setCheckIn(init.checkIn);
    setCheckOut(init.checkOut);
    setAdults(init.adults);
    setRooms(init.rooms);
  }, [init]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestRef.current && !suggestRef.current.contains(event.target as Node)) setOpenSuggest(false);
      if (guestRef.current && !guestRef.current.contains(event.target as Node)) setOpenGuest(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const t = q.trim();
    if (t.length < 2) {
      setSuggest([]);
      return;
    }
    if (pickedRef.current && (pickedRef.current.name !== t && pickedRef.current.label !== t)) {
      pickedRef.current = null;
    }
    const timer = window.setTimeout(async () => {
      setLoadingSuggest(true);
      try {
        const data = await hotelService.searchListDestination(t);
        const items: Dest[] = Array.isArray(data) ? data : data?.items || [];
        setSuggest(items);
        setOpenSuggest(true);
      } catch {
        setSuggest([]);
      } finally {
        setLoadingSuggest(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [q]);

  const onPickDest = (d: Dest) => {
    const displayText = d.name || d.label || "";
    setQ(displayText);
    pickedRef.current = d;
    setOpenSuggest(false);
  };

  const handleSearchClick = () => {
    onSearch({
      q,
      checkIn,
      checkOut,
      adults,
      rooms,
      lat: pickedRef.current?.latitude,
      lng: pickedRef.current?.longitude
    });
  };

  const getDestIcon = (type?: string) => {
    const t = type?.toUpperCase();
    if (t === "AIRPORT") return <PlaneIcon className="w-5 h-5" />;
    if (t === "CITY") return <BuildingIcon className="w-5 h-5" />;
    return <MapPinIcon className="w-5 h-5" />;
  };

  // --- Counter Sub-component ---
  const Counter = ({ label, sub, value, onChange, min = 0 }: any) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div>
        <div className="text-sm font-bold text-slate-800">{label}</div>
        {sub && <div className="text-[11px] text-slate-500">{sub}</div>}
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-full text-slate-600 hover:border-blue-500 hover:text-blue-500 transition-colors disabled:opacity-30" disabled={value <= min}>-</button>
        <span className="w-6 text-center text-sm font-bold text-slate-800">{value}</span>
        <button type="button" onClick={() => onChange(value + 1)} className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-full text-slate-600 hover:border-blue-500 hover:text-blue-500 transition-colors">+</button>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] grid grid-cols-1 lg:grid-cols-[1.8fr_0.1px_1.1fr_0.1px_1.1fr_0.1px_1.3fr_auto] items-center p-1 relative z-20 mb-6">

      {/* 1. Destination */}
      <div className="relative group h-full" ref={suggestRef}>
        <div className="px-5 py-3 hover:bg-slate-100 transition-colors rounded-lg cursor-text h-full flex flex-col justify-center" onClick={() => setOpenSuggest(true)}>
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 pointer-events-none">
            <BuildingIcon className="w-3.5 h-3.5" /> Điểm đến
          </label>
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpenSuggest(true); }}
            onFocus={() => setOpenSuggest(true)}
            placeholder="Nhập tên thành phố..."
            className="w-full bg-transparent font-bold text-slate-900 text-[17px] outline-none placeholder:text-slate-300 truncate leading-tight"
            autoComplete="off"
          />
        </div>

        {openSuggest && (
          <div className="absolute left-0 top-[calc(100%+8px)] z-50 rounded-lg bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top font-sans min-w-full w-max max-w-[450px]">
            <div className="max-h-[320px] overflow-auto custom-scrollbar">
              {loadingSuggest && <div className="p-4 text-center text-sm text-slate-500">Đang tìm kiếm...</div>}
              {!loadingSuggest && suggest.length === 0 && q.length >= 2 && <div className="p-4 text-center text-sm text-slate-500">Không tìm thấy</div>}
              {!loadingSuggest && suggest.map((item, idx) => (
                <button key={idx} onClick={() => onPickDest(item)} className="w-full text-left px-4 py-3 hover:bg-slate-100 transition-colors flex items-center gap-4 border-b border-slate-50 last:border-0 group">
                  <div className="text-slate-400 group-hover:text-slate-600 transition-colors shrink-0">{getDestIcon(item.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold text-slate-900 truncate">{item.name || item.city}</div>
                    <div className="text-[13px] text-slate-500 truncate mt-0.5">{item.label}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="hidden lg:block w-[1px] h-3/4 bg-slate-200 mx-auto"></div>

      {/* 2. Check-in */}
      <div className="group h-full px-4 py-3 hover:bg-slate-100 transition-colors rounded-lg flex flex-col justify-center relative cursor-pointer" onClick={() => checkInRef.current?.showPicker()}>
        <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 pointer-events-none relative z-10">
          <CalendarIcon className="w-3.5 h-3.5" /> Nhận phòng
        </label>
        <div className="relative w-full h-[26px]">
          <div className={`absolute inset-0 flex items-center font-bold text-[15px] pointer-events-none ${checkIn ? "text-slate-900" : "text-slate-300"}`}>
            {checkIn ? formatDateDisplay(checkIn) : "DD/MM/YYYY"}
          </div>
          <input ref={checkInRef} type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
        </div>
      </div>

      <div className="hidden lg:block w-[1px] h-3/4 bg-slate-200 mx-auto"></div>

      {/* 3. Check-out */}
      <div className="group h-full px-4 py-3 hover:bg-slate-100 transition-colors rounded-lg flex flex-col justify-center relative cursor-pointer" onClick={() => checkOutRef.current?.showPicker()}>
        <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 pointer-events-none relative z-10">
          <CalendarIcon className="w-3.5 h-3.5" /> Trả phòng
        </label>
        <div className="relative w-full h-[26px]">
          <div className={`absolute inset-0 flex items-center font-bold text-[15px] pointer-events-none ${checkOut ? "text-slate-900" : "text-slate-300"}`}>
            {checkOut ? formatDateDisplay(checkOut) : "DD/MM/YYYY"}
          </div>
          <input ref={checkOutRef} type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
        </div>
      </div>

      <div className="hidden lg:block w-[1px] h-3/4 bg-slate-200 mx-auto"></div>

      {/* 4. Guest & Room */}
      <div className="relative group h-full" ref={guestRef}>
        <div className="px-5 py-3 hover:bg-slate-100 transition-colors cursor-pointer h-full rounded-lg flex flex-col justify-center" onClick={() => setOpenGuest(!openGuest)}>
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
            <UserIcon className="w-3.5 h-3.5" /> Khách & Phòng
          </label>
          <div className="font-bold text-slate-900 text-[15px] truncate leading-tight">
            {adults} người lớn, {rooms} phòng
          </div>
        </div>

        {openGuest && (
          <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 bg-white rounded-xl shadow-2xl ring-1 ring-black/10 p-5 space-y-2 animate-in fade-in zoom-in-95 duration-200 cursor-default origin-top-right">
            <Counter label="Người lớn" sub="Từ 18 tuổi" value={adults} onChange={setAdults} min={1} />
            <Counter label="Số phòng" sub="" value={rooms} onChange={setRooms} min={1} />
            <button onClick={() => setOpenGuest(false)} className="w-full mt-2 bg-blue-600 text-white rounded-lg py-3 text-sm font-bold hover:bg-blue-700 hover:shadow-lg transition-all">Xong</button>
          </div>
        )}
      </div>

      {/* 5. Search Button */}
      <div className="p-1">
        <button type="button" className="h-[52px] w-full lg:w-auto px-6 rounded-lg bg-[#0891b2] text-white font-bold hover:brightness-110 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all flex items-center justify-center gap-2" onClick={handleSearchClick}>
          <SearchIcon className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
};


// --- Page Types & Logic ---
type SearchState = {
  destination: string;
  arrivalDate?: string;
  departureDate?: string;
  adults?: number;
  roomQty?: number;
  latitude?: string;
  longitude?: string;
  radius?: string;
  pageNumber?: number;
  childrenAge?: string;
  languagecode?: string;
  currencyCode?: string;
  freeCancel?: boolean;
  breakfast?: boolean;
  minPrice?: number;
  maxPrice?: number;
  stars?: number[];
};

function parseBool(v: string | null) { return v === "1" || v === "true"; }
function parseNum(v: string | null) { if (!v) return undefined; const n = Number(v); return Number.isFinite(n) ? n : undefined; }
function parseStars(v: string | null) { if (!v) return []; return v.split(",").map((x) => Number(x)).filter((n) => Number.isFinite(n)); }
function decodeLoose(v: string) { const plusFixed = String(v ?? "").replace(/\+/g, " "); try { return decodeURIComponent(plusFixed); } catch { return plusFixed; } }

function stateFromSearchParams(sp: ReturnType<typeof useSearchParams>): SearchState {
  return {
    destination: decodeLoose(sp.get("destination") || sp.get("q") || ""),
    arrivalDate: sp.get("arrivalDate") || sp.get("checkIn") || undefined,
    departureDate: sp.get("departureDate") || sp.get("checkOut") || undefined,
    adults: parseNum(sp.get("adults")) ?? 2,
    roomQty: parseNum(sp.get("roomQty")) ?? 1,
    latitude: sp.get("latitude") || undefined,
    longitude: sp.get("longitude") || undefined,
    radius: sp.get("radius") || undefined,
    pageNumber: parseNum(sp.get("pageNumber")) ?? 1,
    childrenAge: sp.get("childrenAge") || undefined,
    languagecode: sp.get("languagecode") || "vi",
    currencyCode: sp.get("currencyCode") || "VND",
    freeCancel: parseBool(sp.get("freeCancel")),
    breakfast: parseBool(sp.get("breakfast")),
    minPrice: parseNum(sp.get("minPrice")) ?? parseNum(sp.get("priceMin")),
    maxPrice: parseNum(sp.get("maxPrice")) ?? parseNum(sp.get("priceMax")),
    stars: parseStars(sp.get("stars")),
  };
}

function toQueryString(s: SearchState) {
  const p = new URLSearchParams();
  if (s.destination) p.set("destination", s.destination);
  if (s.arrivalDate) p.set("arrivalDate", s.arrivalDate);
  if (s.departureDate) p.set("departureDate", s.departureDate);
  if (s.adults != null) p.set("adults", String(s.adults));
  if (s.roomQty != null) p.set("roomQty", String(s.roomQty));
  if (s.latitude) p.set("latitude", s.latitude);
  if (s.longitude) p.set("longitude", s.longitude);
  if (s.pageNumber != null) p.set("pageNumber", String(s.pageNumber));
  if (s.freeCancel) p.set("freeCancel", "1");
  if (s.breakfast) p.set("breakfast", "1");
  if (s.minPrice != null) p.set("priceMin", String(s.minPrice));
  if (s.maxPrice != null) p.set("priceMax", String(s.maxPrice));
  if (s.stars && s.stars.length) p.set("stars", s.stars.join(","));
  return p.toString();
}

function mapToUiHotel(x: any): UiHotel {
  const breakdown = x?.composite_price_breakdown;
  const grossPerNight = breakdown?.gross_amount_per_night;
  const gross = breakdown?.gross_amount;
  const allIn = breakdown?.all_inclusive_amount;
  const strikePerNight = breakdown?.strikethrough_amount_per_night;

  const priceValue = grossPerNight?.value ?? gross?.value ?? allIn?.value ?? x?.min_total_price ?? x?.minPrice ?? x?.priceValue ?? x?.price;
  const currency = grossPerNight?.currency ?? gross?.currency ?? allIn?.currency ?? x?.currencycode ?? x?.currencyCode ?? "VND";
  const id = x?.hotel_id ?? x?.hotelId ?? x?.id ?? x?.propertyId;
  const rawImg = x?.main_photo_url ?? x?.img ?? x?.image ?? x?.thumbnail ?? "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1600&auto=format&fit=crop";
  const img = typeof rawImg === "string" ? rawImg.replace("/square60/", "/square200/") : rawImg;
  const strikeText = strikePerNight?.value != null && Number.isFinite(Number(strikePerNight.value)) ? `${new Intl.NumberFormat("vi-VN").format(Number(strikePerNight.value))} ${strikePerNight.currency ?? currency}/đêm` : undefined;

  return {
    id: String(id ?? ""),
    name: x?.hotel_name_trans ?? x?.hotel_name ?? x?.name ?? x?.hotelName ?? "Hotel",
    city: x?.city_in_trans ?? x?.city ?? x?.location ?? x?.address ?? "",
    priceText: x?.priceText ?? (priceValue != null && Number.isFinite(Number(priceValue)) ? `${new Intl.NumberFormat("vi-VN").format(Number(priceValue))} ${currency}/đêm` : ""),
    strikeText,
    rating10: x?.review_score ?? x?.rating10 ?? x?.score ?? (x?.rating ? x.rating * 2 : undefined),
    reviews: x?.review_nr ?? x?.reviews ?? x?.reviewCount ?? undefined,
    img,
    linkId: String(id ?? ""),
    lat: typeof x?.latitude === "number" ? x.latitude : Number.isFinite(Number(x?.latitude)) ? Number(x?.latitude) : undefined,
    lng: typeof x?.longitude === "number" ? x.longitude : Number.isFinite(Number(x?.longitude)) ? Number(x?.longitude) : undefined,
  };
}

function HotelResultsContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [state, setState] = useState<SearchState>(() => stateFromSearchParams(sp));
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [items, setItems] = useState<UiHotel[]>([]);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [hoveredHotelId, setHoveredHotelId] = useState<string | null>(null);
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(20);
  const currentPage = state.pageNumber ?? 1;
  const totalPages = useMemo(() => {
    if (typeof total !== "number" || total <= 0) return 1;
    return Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  }, [total, pageSize]);

  useEffect(() => { setState(stateFromSearchParams(sp)); }, [sp.toString()]);

  const canSearch = useMemo(() => {
    const hasText = state.destination.trim().length > 0;
    const hasCoord = !!(state.latitude && state.longitude);
    return hasText || hasCoord;
  }, [state.destination, state.latitude, state.longitude]);

  const runSearch = async (next?: SearchState) => {
    const s = next ?? state;
    if (!s.destination.trim() && !(s.latitude && s.longitude)) return;
    if (!s.arrivalDate || !s.departureDate) {
      setErr("Vui lòng chọn ngày nhận phòng và trả phòng.");
      setItems([]); setTotal(undefined); return;
    }
    setLoading(true); setErr("");
    try {
      const common = { arrivalDate: s.arrivalDate, departureDate: s.departureDate, adults: String(s.adults ?? 2), roomQty: String(s.roomQty ?? 1), childrenAge: s.childrenAge ?? "", pageNumber: String(s.pageNumber ?? 1), priceMin: s.minPrice != null ? String(s.minPrice) : "", priceMax: s.maxPrice != null ? String(s.maxPrice) : "", languagecode: s.languagecode ?? "vi", currencyCode: s.currencyCode ?? "VND" };
      const data = s.latitude && s.longitude ? await hotelService.searchByCoordinate({ latitude: s.latitude, longitude: s.longitude, radius: s.radius ?? "20", ...common }) : await hotelService.search({ destination: s.destination.trim(), ...common });
      const listRaw = (Array.isArray(data) && data) || (Array.isArray((data as any)?.result) && (data as any).result) || (Array.isArray((data as any)?.result?.result) && (data as any).result.result) || [];
      setItems(listRaw.map(mapToUiHotel));
      const totalFromEnvelope = (data as any)?.result?.count ?? (data as any)?.count;
      setTotal((data as any)?.total ?? (data as any)?.count ?? totalFromEnvelope ?? (Array.isArray(listRaw) ? listRaw.length : undefined));
    } catch (e: any) { setErr(e?.message || "Search failed"); setItems([]); setTotal(undefined); } finally { setLoading(false); }
  };

  useEffect(() => { if (canSearch) runSearch(); }, [canSearch]);
  useEffect(() => { if (items.length > 0 && pageSize === 20) setPageSize(items.length); }, [items.length, pageSize]);

  const updateAndSearch = (patch: Partial<SearchState>) => {
    const next = { ...state, ...patch };
    setState(next);
    router.push(`/pages/hotel-results?${toQueryString(next)}`);
    runSearch(next);
  };

  const goToPage = (page: number) => { updateAndSearch({ pageNumber: Math.min(Math.max(1, page), totalPages) }); };

  const filters: HotelFilters = { freeCancel: !!state.freeCancel, breakfast: !!state.breakfast, minPrice: state.minPrice, maxPrice: state.maxPrice, stars: state.stars ?? [] };

  return (
    <main className="min-h-screen bg-slate-50 font-sans">
      <section
        className="relative w-full"
        style={{
          backgroundImage: "url(https://images.unsplash.com/photo-1651376589881-0e5a7eb15ae4?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="bg-gradient-to-b from-black/50 via-black/30 to-black/10">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="text-center mb-10 mt-12">
              <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">Tìm chỗ nghỉ tuyệt vời nhất</h1>
              <p className="mt-4 text-white/90 text-lg font-medium drop-shadow-md">Khám phá hàng ngàn khách sạn, resort và nhà nghỉ dưỡng</p>
            </div>
            <div className="max-w-7xl mx-auto">
              <HotelSearchBox
                init={{ q: state.destination, checkIn: state.arrivalDate || "", checkOut: state.departureDate || "", adults: state.adults ?? 2, rooms: state.roomQty ?? 1 }}
                onSearch={(v) => updateAndSearch({ destination: v.q, arrivalDate: v.checkIn, departureDate: v.checkOut, adults: v.adults, roomQty: v.rooms, latitude: v.lat ? String(v.lat) : undefined, longitude: v.lng ? String(v.lng) : undefined })}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-4">
          <section className="col-span-12 lg:col-span-6 xl:col-span-6 2xl:col-span-6">
            <ResultsPane loading={loading} error={err} total={total} items={items} page={currentPage} totalPages={totalPages} onPageChange={goToPage} hoveredHotelId={hoveredHotelId} onHoverHotel={setHoveredHotelId} selectedHotelId={selectedHotelId} onOpenDeal={async (hotelId) => { if (!state.arrivalDate || !state.departureDate) return; const data = await hotelService.link({ hotelId, arrivalDate: state.arrivalDate, departureDate: state.departureDate, adults: String(state.adults ?? 2), childrenAge: state.childrenAge, languagecode: state.languagecode, currencyCode: state.currencyCode }); const url = data?.url || data?.link || data; if (url) window.open(url, "_blank"); }} />
          </section>
          <aside className="col-span-12 lg:col-span-6 hidden lg:block">
            <MapPane hotels={items} hoveredHotelId={hoveredHotelId} onHoverHotel={setHoveredHotelId} onSelectHotel={(id) => { setSelectedHotelId(id); setHoveredHotelId(id); }} onSearchByMap={(payload) => updateAndSearch({ latitude: payload.latitude, longitude: payload.longitude, radius: payload.radius, pageNumber: 1 })} />
          </aside>
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {/* {filtersOpen && (
        <div className="fixed inset-0 z-[120] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setFiltersOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 top-10 bg-white rounded-t-2xl flex flex-col">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <span className="font-bold text-lg">Bộ lọc</span>
              <button onClick={() => setFiltersOpen(false)} className="p-2 bg-slate-100 rounded-full">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <FilterSidebar value={filters} onChange={(patch) => updateAndSearch(patch)} />
            </div>
            <div className="p-4 border-t bg-white">
              <button onClick={() => setFiltersOpen(false)} className="w-full bg-[#0891b2] text-white font-bold py-3 rounded-xl">Áp dụng</button>
            </div>
          </div>
        </div>
      )} */}
    </main>
  );
}

export default function HotelResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600">Đang tải...</div>
      </div>
    }>
      <HotelResultsContent />
    </Suspense>
  );
}
