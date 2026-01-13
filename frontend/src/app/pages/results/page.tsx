"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import HotelSearchCard from "./_components/HotelSearchCard";
import FilterSidebar, { HotelFilters } from "./_components/FilterSidebar";
import ResultsPane, { UiHotel } from "./_components/ResultsPane";
import MapPane from "./_components/MapPane";

import { hotelService } from "@/lib/services/hotel";

type SearchState = {
  q: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  rooms?: number;
  // optional: destId, lat/lng...
  destId?: string;
  lat?: string;
  lng?: string;

  // filters
  freeCancel?: boolean;
  breakfast?: boolean;
  minPrice?: number;
  maxPrice?: number;
  stars?: number[]; // [3,4,5]
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

function stateFromSearchParams(sp: ReturnType<typeof useSearchParams>): SearchState {
  return {
    q: sp.get("q") || "",
    checkIn: sp.get("checkIn") || undefined,
    checkOut: sp.get("checkOut") || undefined,
    adults: parseNum(sp.get("adults")) ?? 2,
    rooms: parseNum(sp.get("rooms")) ?? 1,
    destId: sp.get("destId") || undefined,
    lat: sp.get("lat") || undefined,
    lng: sp.get("lng") || undefined,

    freeCancel: parseBool(sp.get("freeCancel")),
    breakfast: parseBool(sp.get("breakfast")),
    minPrice: parseNum(sp.get("minPrice")),
    maxPrice: parseNum(sp.get("maxPrice")),
    stars: parseStars(sp.get("stars")),
  };
}

function toQueryString(s: SearchState) {
  const p = new URLSearchParams();
  if (s.q) p.set("q", s.q);
  if (s.checkIn) p.set("checkIn", s.checkIn);
  if (s.checkOut) p.set("checkOut", s.checkOut);
  if (s.adults != null) p.set("adults", String(s.adults));
  if (s.rooms != null) p.set("rooms", String(s.rooms));
  if (s.destId) p.set("destId", s.destId);
  if (s.lat) p.set("lat", s.lat);
  if (s.lng) p.set("lng", s.lng);

  if (s.freeCancel) p.set("freeCancel", "1");
  if (s.breakfast) p.set("breakfast", "1");
  if (s.minPrice != null) p.set("minPrice", String(s.minPrice));
  if (s.maxPrice != null) p.set("maxPrice", String(s.maxPrice));
  if (s.stars && s.stars.length) p.set("stars", s.stars.join(","));

  return p.toString();
}

// mapping “linh hoạt” cho UI
function mapToUiHotel(x: any): UiHotel {
  return {
    id: String(x?.id ?? x?.hotelId ?? x?.propertyId ?? ""),
    name: x?.name ?? x?.hotelName ?? "Hotel",
    city: x?.city ?? x?.location ?? x?.address ?? "",
    priceText:
      x?.priceText ??
      x?.price ??
      (x?.minPrice ? `${new Intl.NumberFormat("vi-VN").format(x.minPrice)} ₫/đêm` : ""),
    rating10: x?.rating10 ?? x?.score ?? (x?.rating ? x.rating * 2 : undefined),
    reviews: x?.reviews ?? x?.reviewCount ?? undefined,
    img:
      x?.img ??
      x?.image ??
      x?.thumbnail ??
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1600&auto=format&fit=crop",
    // link id để gọi /hotel/link
    linkId: String(x?.id ?? x?.hotelId ?? x?.propertyId ?? ""),
  };
}

export default function HotelResultsPage() {
  const router = useRouter();
  const sp = useSearchParams();

  // ✅ Mobile filter dropdown
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [state, setState] = useState<SearchState>(() => stateFromSearchParams(sp));
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [items, setItems] = useState<UiHotel[]>([]);
  const [total, setTotal] = useState<number | undefined>(undefined);

  // sync state khi URL thay đổi (copy link / back/forward)
  useEffect(() => {
    setState(stateFromSearchParams(sp));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.toString()]);

  const canSearch = useMemo(() => state.q.trim().length > 0, [state.q]);

  const runSearch = async (next?: SearchState) => {
    const s = next ?? state;
    if (!s.q.trim()) return;

    setLoading(true);
    setErr("");

    try {
      // backend nhận params gì thì bạn giữ y như thế ở đây
      const params: Record<string, string | number | boolean> = {
        q: s.q,
        checkIn: s.checkIn ?? "",
        checkOut: s.checkOut ?? "",
        adults: s.adults ?? 2,
        rooms: s.rooms ?? 1,
        freeCancel: !!s.freeCancel,
        breakfast: !!s.breakfast,
      };

      if (s.destId) params.destId = s.destId;
      if (s.lat && s.lng) {
        params.lat = s.lat;
        params.lng = s.lng;
      }
      if (s.minPrice != null) params.minPrice = s.minPrice;
      if (s.maxPrice != null) params.maxPrice = s.maxPrice;
      if (s.stars?.length) params.stars = s.stars.join(",");

      const data = await hotelService.search(params);

      const listRaw = Array.isArray(data) ? data : data?.items || data?.results || [];
      const mapped = listRaw.map(mapToUiHotel);

      setItems(mapped);
      setTotal(
        data?.total ??
          data?.count ??
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

  // auto search khi có q (vừa vào từ Banner)
  useEffect(() => {
    if (canSearch) runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSearch]);

  // update URL + state + run search
  const updateAndSearch = (patch: Partial<SearchState>) => {
    const next = { ...state, ...patch };
    setState(next);
    router.push(`/pages/hotels/results?${toQueryString(next)}`);
    runSearch(next);
  };

  // lock scroll khi mở filter mobile
  useEffect(() => {
    if (!filtersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [filtersOpen]);

  // ESC đóng filter
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
      {/* Search card */}
      <HotelSearchCard
        value={{
          q: state.q,
          checkIn: state.checkIn,
          checkOut: state.checkOut,
          adults: state.adults ?? 2,
          rooms: state.rooms ?? 1,
        }}
        onSearch={(v) => updateAndSearch(v)}
      />

      {/* Mobile filter button */}
      <div className="lg:hidden px-4 pt-3">
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="w-full h-11 rounded-xl bg-white shadow-sm ring-1 ring-black/10 px-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#0891b2]/10 text-[#0891b2]">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M3 5h18v2H3V5zm4 6h10v2H7v-2zm3 6h4v2h-4v-2z" />
              </svg>
            </span>
            Bộ lọc
          </div>
          <div className="text-sm text-slate-500 flex items-center gap-1">
            Mở
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M7 10l5 5 5-5H7z" />
            </svg>
          </div>
        </button>
      </div>

      <div className="w-full px-0 py-0">
        <div className="grid grid-cols-12 gap-2">
          {/* FILTER desktop */}
          <aside className="hidden lg:block col-span-3 lg:col-span-2">
            <div className="sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto">
              <FilterSidebar
                value={filters}
                onChange={(nextFilters) => updateAndSearch(nextFilters)}
              />
            </div>
          </aside>

          {/* RESULTS */}
          <section className="col-span-12 lg:col-span-5 xl:col-span-6 2xl:col-span-5 px-4 lg:px-0">
            <ResultsPane
              loading={loading}
              error={err}
              total={total}
              items={items}
              onOpenDeal={async (id) => {
                const data = await hotelService.link(id);
                const url = data?.url || data?.link || data;
                if (url) window.open(url, "_blank");
              }}
            />
          </section>

          {/* MAP */}
          <aside className="col-span-12 lg:col-span-5 xl:col-span-4 2xl:col-span-5 px-4 lg:px-0 pb-6">
            <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] overflow-hidden rounded-2xl lg:rounded-none">
              <MapPane />
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile filter overlay */}
      {filtersOpen && (
        <div className="fixed inset-0 z-[120] lg:hidden">
          <button
            aria-label="Đóng bộ lọc"
            onClick={() => setFiltersOpen(false)}
            className="absolute inset-0 bg-black/35"
          />

          <div className="absolute inset-0 flex items-end justify-center p-3">
            <div className="w-full max-w-md rounded-t-2xl bg-white shadow-xl ring-1 ring-black/10 overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
                <div className="font-semibold text-slate-900">Bộ lọc</div>
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="h-9 w-9 rounded-lg hover:bg-slate-100 grid place-items-center"
                  aria-label="Đóng"
                  type="button"
                >
                  ✕
                </button>
              </div>

              <div className="max-h-[75vh] overflow-auto">
                <FilterSidebar
                  value={filters}
                  onChange={(nextFilters) => updateAndSearch(nextFilters)}
                />
              </div>

              <div className="p-3 border-t bg-white">
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="w-full h-11 rounded-xl bg-[#0891b2] text-white font-semibold hover:brightness-110"
                >
                  Áp dụng
                </button>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="mt-2 w-full h-11 rounded-xl border border-slate-200 text-slate-800 hover:bg-slate-50"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
