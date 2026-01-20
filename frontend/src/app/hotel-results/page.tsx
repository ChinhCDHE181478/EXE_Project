"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import HotelSearchCard from "./_components/HotelSearchCard";
import FilterSidebar, { HotelFilters } from "./_components/FilterSidebar";
import ResultsPane, { UiHotel } from "./_components/ResultsPane";
import MapPane from "./_components/MapPane";

import { hotelService } from "@/lib/services/hotel";

type SearchState = {
  // Match BE
  destination: string;
  arrivalDate?: string;
  departureDate?: string;
  adults?: number;
  roomQty?: number;

  // optional coordinate search
  latitude?: string;
  longitude?: string;
  radius?: string;

  // optional filters / paging
  pageNumber?: number;
  childrenAge?: string;
  languagecode?: string;
  currencyCode?: string;

  // UI filters (we map to BE priceMin/priceMax)
  freeCancel?: boolean;
  breakfast?: boolean;
  minPrice?: number;
  maxPrice?: number;
  stars?: number[];
};

function parseBool(v: string | null) {
  return v === "1" || v === "true";
}
function parseNum(v: string | null) {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
function parseStars(v: string | null) {
  if (!v) return [];
  return v
    .split(",")
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n));
}

function decodeLoose(v: string) {
  // URLSearchParams *usually* decodes, but users can still end up with values
  // that are double-encoded or contain '+' for spaces.
  const plusFixed = String(v ?? "").replace(/\+/g, " ");
  try {
    return decodeURIComponent(plusFixed);
  } catch {
    return plusFixed;
  }
}

// Backward-compatible: still accept old keys (q/checkIn/checkOut/lat/lng)
function stateFromSearchParams(sp: ReturnType<typeof useSearchParams>): SearchState {
  const rawDestination = sp.get("destination") || sp.get("q") || "";
  return {
    destination: decodeLoose(rawDestination),
    arrivalDate: sp.get("arrivalDate") || sp.get("checkIn") || undefined,
    departureDate: sp.get("departureDate") || sp.get("checkOut") || undefined,
    adults: parseNum(sp.get("adults")) ?? 2,
    roomQty: parseNum(sp.get("roomQty")) ?? parseNum(sp.get("rooms")) ?? 1,

    latitude: sp.get("latitude") || sp.get("lat") || undefined,
    longitude: sp.get("longitude") || sp.get("lng") || undefined,
    radius: sp.get("radius") || undefined,

    pageNumber: parseNum(sp.get("pageNumber")) ?? 1,
    childrenAge: sp.get("childrenAge") || undefined,
    // Your current BE usage expects vi + VND by default
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
  if (s.radius) p.set("radius", s.radius);

  if (s.pageNumber != null) p.set("pageNumber", String(s.pageNumber));
  if (s.childrenAge) p.set("childrenAge", s.childrenAge);
  if (s.languagecode) p.set("languagecode", s.languagecode);
  if (s.currencyCode) p.set("currencyCode", s.currencyCode);

  if (s.freeCancel) p.set("freeCancel", "1");
  if (s.breakfast) p.set("breakfast", "1");
  // Match BE query names
  if (s.minPrice != null) p.set("priceMin", String(s.minPrice));
  if (s.maxPrice != null) p.set("priceMax", String(s.maxPrice));
  if (s.stars && s.stars.length) p.set("stars", s.stars.join(","));

  return p.toString();
}

function mapToUiHotel(x: any): UiHotel {
  // Handle BE snake_case payload (RapidAPI/Booking style)
  const breakdown = x?.composite_price_breakdown;
  const grossPerNight = breakdown?.gross_amount_per_night;
  const gross = breakdown?.gross_amount;
  const allIn = breakdown?.all_inclusive_amount;
  const strikePerNight = breakdown?.strikethrough_amount_per_night;

  // NOTE: Booking payload's "discounted_amount" is often the *discount value*, not the final price.
  // We should prioritize gross_per_night/gross/all_inclusive for display.
  const priceValue =
    grossPerNight?.value ??
    gross?.value ??
    allIn?.value ??
    // fallbacks (legacy)
    x?.min_total_price ??
    x?.minPrice ??
    x?.priceValue ??
    x?.price;

  const currency =
    grossPerNight?.currency ?? gross?.currency ?? allIn?.currency ?? x?.currencycode ?? x?.currencyCode ?? "VND";

  const id = x?.hotel_id ?? x?.hotelId ?? x?.id ?? x?.propertyId;

  // Improve photo quality: Booking "square60" is tiny, it will look blurry.
  const rawImg =
    x?.main_photo_url ??
    x?.img ??
    x?.image ??
    x?.thumbnail ??
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1600&auto=format&fit=crop";
  const img = typeof rawImg === "string" ? rawImg.replace("/square60/", "/square200/") : rawImg;

  const strikeText =
    strikePerNight?.value != null && Number.isFinite(Number(strikePerNight.value))
      ? `${new Intl.NumberFormat("vi-VN").format(Number(strikePerNight.value))} ${strikePerNight.currency ?? currency}/đêm`
      : undefined;

  return {
    id: String(id ?? ""),
    name: x?.hotel_name_trans ?? x?.hotel_name ?? x?.name ?? x?.hotelName ?? "Hotel",
    city: x?.city_in_trans ?? x?.city ?? x?.location ?? x?.address ?? "",
    priceText:
      x?.priceText ??
      (priceValue != null && Number.isFinite(Number(priceValue))
        ? `${new Intl.NumberFormat("vi-VN").format(Number(priceValue))} ${currency}/đêm`
        : ""),
    strikeText,
    rating10: x?.review_score ?? x?.rating10 ?? x?.score ?? (x?.rating ? x.rating * 2 : undefined),
    reviews: x?.review_nr ?? x?.reviews ?? x?.reviewCount ?? undefined,
    img,
    linkId: String(id ?? ""),
    lat: typeof x?.latitude === "number" ? x.latitude : Number.isFinite(Number(x?.latitude)) ? Number(x?.latitude) : undefined,
    lng: typeof x?.longitude === "number" ? x.longitude : Number.isFinite(Number(x?.longitude)) ? Number(x?.longitude) : undefined,
  };
}

export default function HotelResultsPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const [filtersOpen, setFiltersOpen] = useState(false);

  const [state, setState] = useState<SearchState>(() => stateFromSearchParams(sp));
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [items, setItems] = useState<UiHotel[]>([]);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [hoveredHotelId, setHoveredHotelId] = useState<string | null>(null);

  // Backend typically returns a fixed number of items per page.
  // We lock it based on the first non-empty response so pagination stays stable.
  const [pageSize, setPageSize] = useState<number>(20);
  const currentPage = state.pageNumber ?? 1;
  const totalPages = useMemo(() => {
    if (typeof total !== "number" || total <= 0) return 1;
    return Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  }, [total, pageSize]);

  useEffect(() => {
    setState(stateFromSearchParams(sp));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.toString()]);

  const canSearch = useMemo(() => {
    const hasText = state.destination.trim().length > 0;
    const hasCoord = !!(state.latitude && state.longitude);
    return hasText || hasCoord;
  }, [state.destination, state.latitude, state.longitude]);

  const runSearch = async (next?: SearchState) => {
    const s = next ?? state;
    if (!s.destination.trim() && !(s.latitude && s.longitude)) return;

    // BE requires dates
    if (!s.arrivalDate || !s.departureDate) {
      setErr("Vui lòng chọn ngày nhận phòng và trả phòng.");
      setItems([]);
      setTotal(undefined);
      return;
    }

    setLoading(true);
    setErr("");

    try {
      // Your BE already resolves destination -> destinationId internally,
      // so FE just sends the destination text directly.
      const destinationValue = s.destination.trim();
      const latitude = s.latitude;
      const longitude = s.longitude;

      const common = {
        arrivalDate: s.arrivalDate,
        departureDate: s.departureDate,
        adults: String(s.adults ?? 2),
        roomQty: String(s.roomQty ?? 1),
        childrenAge: s.childrenAge ?? "",
        pageNumber: String(s.pageNumber ?? 1),
        // map UI -> BE
        priceMin: s.minPrice != null ? String(s.minPrice) : "",
        priceMax: s.maxPrice != null ? String(s.maxPrice) : "",
        languagecode: s.languagecode ?? "vi",
        currencyCode: s.currencyCode ?? "VND",
      };

      const data =
        latitude && longitude
          ? await hotelService.searchByCoordinate({
              latitude,
              longitude,
              radius: s.radius ?? "20",
              ...common,
            })
          : await hotelService.search({
              destination: destinationValue,
              ...common,
            });

      // BE may return either:
      // 1) { count, result: [...] }
      // 2) { status, message, result: { count, result: [...] } }
      // 3) plain array (legacy)
      const listRaw =
        (Array.isArray(data) && data) ||
        (Array.isArray((data as any)?.result) && (data as any).result) ||
        (Array.isArray((data as any)?.result?.result) && (data as any).result.result) ||
        (Array.isArray((data as any)?.items) && (data as any).items) ||
        (Array.isArray((data as any)?.results) && (data as any).results) ||
        [];

      const mapped = (Array.isArray(listRaw) ? listRaw : []).map(mapToUiHotel);

      setItems(mapped);
      const totalFromEnvelope = (data as any)?.result?.count ?? (data as any)?.count;
      setTotal(
        (data as any)?.total ??
          (data as any)?.count ??
          totalFromEnvelope ??
          (Array.isArray(listRaw) ? listRaw.length : undefined)
      );
    } catch (e: any) {
      setErr(e?.message || "Search failed");
      setItems([]);
      setTotal(undefined);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canSearch) runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSearch]);

  useEffect(() => {
    if (items.length > 0 && pageSize === 20) setPageSize(items.length);
  }, [items.length, pageSize]);

  const updateAndSearch = (patch: Partial<SearchState>) => {
    const next = { ...state, ...patch };
    setState(next);
    // App Router route
    router.push(`/hotel-results?${toQueryString(next)}`);
    runSearch(next);
  };

  const goToPage = (page: number) => {
    const p = Math.min(Math.max(1, page), totalPages);
    updateAndSearch({ pageNumber: p });
  };

  useEffect(() => {
    if (!filtersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [filtersOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFiltersOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filters: HotelFilters = {
    freeCancel: !!state.freeCancel,
    breakfast: !!state.breakfast,
    minPrice: state.minPrice,
    maxPrice: state.maxPrice,
    stars: state.stars ?? [],
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <HotelSearchCard
        value={{
          q: state.destination,
          checkIn: state.arrivalDate,
          checkOut: state.departureDate,
          adults: state.adults ?? 2,
          rooms: state.roomQty ?? 1,
        }}
        onSearch={(v) =>
          updateAndSearch({
            destination: v.q,
            arrivalDate: v.checkIn,
            departureDate: v.checkOut,
            adults: v.adults,
            roomQty: v.rooms,
          })
        }
      />

      <div className="lg:hidden px-4 pt-3">
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className="w-full h-11 rounded-xl bg-white shadow-sm ring-1 ring-black/10 px-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#0891b2]/10 text-[#0891b2]">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M3 5h18v2H3V5zm4 6h10v2H7v-2zm3 6h4v2h-4v-2z" />
              </svg>
            </span>
{filtersOpen ? "Ẩn bộ lọc" : "Bộ lọc"}
          </div>
          <div className="text-sm text-slate-500 flex items-center gap-1">
            Mở
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M7 10l5 5 5-5H7z" />
            </svg>
          </div>
        </button>
      </div>



      {/* INLINE_MOBILE_FILTER_PANEL */}
      {filtersOpen && (
        <div className="lg:hidden px-4 pt-3">
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/10 overflow-hidden">
            <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
              <div className="font-semibold text-slate-900">Bộ lọc</div>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="h-9 w-9 rounded-lg hover:bg-slate-100 grid place-items-center"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <FilterSidebar value={filters} onChange={(patch) => updateAndSearch(patch)} />
            </div>
          </div>
        </div>
      )}

      <div className="w-full px-0 py-0">
        <div className="grid grid-cols-12 gap-2">
          <aside className="hidden lg:block col-span-3 lg:col-span-2">
            <div className="sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto">
              <FilterSidebar value={filters} onChange={(patch) => updateAndSearch(patch)} />
            </div>
          </aside>

          <section className="col-span-12 lg:col-span-5 xl:col-span-6 2xl:col-span-5 px-4 lg:px-0">
            <ResultsPane
              loading={loading}
              error={err}
              total={total}
              items={items}
              page={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              hoveredHotelId={hoveredHotelId}
              onHoverHotel={(id) => setHoveredHotelId(id)}
              onOpenDeal={async (hotelId) => {
                if (!state.arrivalDate || !state.departureDate) return;
                const data = await hotelService.link({
                  hotelId,
                  arrivalDate: state.arrivalDate,
                  departureDate: state.departureDate,
                  roomQty: String(state.roomQty ?? 1),
                  adults: String(state.adults ?? 2),
                  childrenAge: state.childrenAge || undefined,
                  languagecode: state.languagecode || undefined,
                  currencyCode: state.currencyCode || undefined,
                });
                const url = data?.url || data?.link || data;
                if (url) window.open(url, "_blank");
              }}
            />
          </section>

          <aside className="col-span-12 lg:col-span-5 xl:col-span-4 2xl:col-span-5 px-4 lg:px-0 pb-6">
            <MapPane
              hotels={items}
              hoveredHotelId={hoveredHotelId}
              onHoverHotel={(id) => setHoveredHotelId(id)}
              onSearchByMap={(payload) => {
                // Search around map center using your BE coordinate endpoint.
                updateAndSearch({
                  latitude: payload.latitude,
                  longitude: payload.longitude,
                  radius: payload.radius,
                  pageNumber: 1,
                });
              }}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}
