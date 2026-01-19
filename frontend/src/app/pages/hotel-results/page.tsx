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

// Backward-compatible: still accept old keys (q/checkIn/checkOut/lat/lng)
function stateFromSearchParams(sp: ReturnType<typeof useSearchParams>): SearchState {
  return {
    destination: sp.get("destination") || sp.get("q") || "",
    arrivalDate: sp.get("arrivalDate") || sp.get("checkIn") || undefined,
    departureDate: sp.get("departureDate") || sp.get("checkOut") || undefined,
    adults: parseNum(sp.get("adults")) ?? 2,
    roomQty: parseNum(sp.get("roomQty")) ?? parseNum(sp.get("rooms")) ?? 1,

    latitude: sp.get("latitude") || sp.get("lat") || undefined,
    longitude: sp.get("longitude") || sp.get("lng") || undefined,
    radius: sp.get("radius") || undefined,

    pageNumber: parseNum(sp.get("pageNumber")) ?? 1,
    childrenAge: sp.get("childrenAge") || undefined,
    languagecode: sp.get("languagecode") || "en-us",
    currencyCode: sp.get("currencyCode") || "USD",

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
  if (s.minPrice != null) p.set("minPrice", String(s.minPrice));
  if (s.maxPrice != null) p.set("maxPrice", String(s.maxPrice));
  if (s.stars && s.stars.length) p.set("stars", s.stars.join(","));

  return p.toString();
}

function mapToUiHotel(x: any): UiHotel {
  return {
    id: String(x?.id ?? x?.hotelId ?? x?.propertyId ?? ""),
    name: x?.name ?? x?.hotelName ?? "Hotel",
    city: x?.city ?? x?.location ?? x?.address ?? "",
    priceText:
      x?.priceText ??
      x?.price ??
      (x?.minPrice
        ? `${new Intl.NumberFormat("vi-VN").format(x.minPrice)} ₫/đêm`
        : ""),
    rating10: x?.rating10 ?? x?.score ?? (x?.rating ? x.rating * 2 : undefined),
    reviews: x?.reviews ?? x?.reviewCount ?? undefined,
    img:
      x?.img ??
      x?.image ??
      x?.thumbnail ??
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1600&auto=format&fit=crop",
    linkId: String(x?.id ?? x?.hotelId ?? x?.propertyId ?? ""),
  };
}

function pickDestinationValue(item: any): string {
  return (
    item?.dest_id ??
    item?.destinationId ??
    item?.destination_id ??
    item?.id ??
    item?.name ??
    item?.label ??
    item?.city ??
    ""
  ).toString();
}
function pickLat(item: any): string | undefined {
  const v = item?.lat ?? item?.latitude;
  return v != null ? String(v) : undefined;
}
function pickLng(item: any): string | undefined {
  const v = item?.lng ?? item?.longitude;
  return v != null ? String(v) : undefined;
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

  useEffect(() => {
    setState(stateFromSearchParams(sp));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.toString()]);

  const canSearch = useMemo(() => state.destination.trim().length > 0, [state.destination]);

  const runSearch = async (next?: SearchState) => {
    const s = next ?? state;
    if (!s.destination.trim()) return;

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
      let destinationValue = s.destination.trim();
      let latitude = s.latitude;
      let longitude = s.longitude;

      // Destination-first: call search-destination to get a usable destination value (id/name)
      if (!latitude || !longitude) {
        const suggest = await hotelService.searchDestination(destinationValue);
        const list = Array.isArray(suggest) ? suggest : suggest?.items || suggest?.result || [];
        if (Array.isArray(list) && list.length > 0) {
          const picked = list[0];
          destinationValue = pickDestinationValue(picked) || destinationValue;
          latitude = pickLat(picked) ?? latitude;
          longitude = pickLng(picked) ?? longitude;
        }
      }

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
        languagecode: s.languagecode ?? "en-us",
        currencyCode: s.currencyCode ?? "USD",
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

      const listRaw = Array.isArray(data) ? data : data?.items || data?.results || [];
      const mapped = (Array.isArray(listRaw) ? listRaw : []).map(mapToUiHotel);

      setItems(mapped);
      setTotal(data?.total ?? data?.count ?? (Array.isArray(listRaw) ? listRaw.length : undefined));
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

  const updateAndSearch = (patch: Partial<SearchState>) => {
    const next = { ...state, ...patch };
    setState(next);
    router.push(`/pages/hotel-results?${toQueryString(next)}`);
    runSearch(next);
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
              onOpenDeal={async (hotelId) => {
                if (!state.arrivalDate || !state.departureDate) return;
                const data = await hotelService.link({
                  hotelId,
                  arrivalDate: state.arrivalDate,
                  departureDate: state.departureDate,
                  adults: String(state.adults ?? 2),
                });
                const url = data?.url || data?.link || data;
                if (url) window.open(url, "_blank");
              }}
            />
          </section>

          <aside className="col-span-12 lg:col-span-5 xl:col-span-4 2xl:col-span-5 px-4 lg:px-0 pb-6">
            <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] overflow-hidden rounded-2xl lg:rounded-none">
              <MapPane />
            </div>
          </aside>
        </div>
      </div>

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
                <FilterSidebar value={filters} onChange={(patch) => updateAndSearch(patch)} />
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
