"use client";

import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";
import type { UiHotel } from "./ResultsPane";

// Free map stack:
// - Leaflet (loaded via CDN)
// - OpenStreetMap tiles
// - Optional POIs from Overpass API (public, free)

type Poi = { id: string; name: string; lat: number; lng: number; kind: string };

function pickCenter(hotels: UiHotel[]) {
  const h = hotels.find((x) => typeof x.lat === "number" && typeof x.lng === "number");
  return { lat: h?.lat ?? 21.028, lng: h?.lng ?? 105.852 };
}

function escapeHtml(s: string) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parsePriceNumber(priceText?: string) {
  if (!priceText) return "";
  // ex: "429.250 VND/đêm" => "429.250"
  const cleaned = priceText
    .replace(/\/\s*một\s*đêm/i, "")
    .replace(/\/\s*\/?\s*đêm/i, "")
    .replace(/VND|₫|đ\b/gi, "")
    .trim();
  // keep digits + '.' + ','
  const m = cleaned.match(/[0-9][0-9\.,]*/);
  return m ? m[0] : cleaned;
}

function popupCardHtml(h: UiHotel) {
  const price = parsePriceNumber(h.priceText);
  const rating = typeof h.rating10 === "number" ? h.rating10.toFixed(1) : "";
  const reviews = typeof h.reviews === "number" ? h.reviews.toLocaleString("vi-VN") : "";
  return `
  <div style="width: 260px; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;">
    <div style="border-radius: 14px; overflow: hidden; box-shadow: 0 12px 30px rgba(15,23,42,.18); border:1px solid rgba(15,23,42,.12); background:#fff;">
      <div style="height: 118px; background:#f1f5f9;">
        <img src="${escapeHtml(h.img)}" alt="${escapeHtml(h.name)}" style="width:100%; height:118px; object-fit:cover; display:block;"/>
      </div>
      <div style="padding: 10px 12px 12px;">
        <div style="font-weight: 800; font-size: 14px; color:#0f172a; line-height: 1.2; margin-bottom: 4px;">
          ${escapeHtml(h.name)}
        </div>
        <div style="font-size: 12px; color:#475569; margin-bottom: 8px;">
          ${escapeHtml(h.city || "")}
        </div>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom: 10px;">
          ${rating ? `<div style="display:inline-flex; align-items:center; gap:6px;"><span style="display:inline-flex; align-items:center; justify-content:center; height:22px; padding:0 8px; border-radius:8px; background:#0f172a; color:#fff; font-weight:800; font-size:12px;">${rating}</span><span style="font-size:12px; color:#0f172a; font-weight:600;">Rất tốt</span>${reviews ? `<span style="font-size:12px; color:#64748b;">${reviews}</span>` : ""}</div>` : `<span style="font-size:12px; color:#64748b;">Chưa có đánh giá</span>`}
        </div>
        <div style="display:flex; align-items:flex-end; justify-content:space-between;">
          <div>
            <div style="font-size: 12px; color:#64748b;">Giá từ</div>
            <div style="font-size: 22px; font-weight: 900; color:#0f172a; line-height: 1;">${escapeHtml(price || "—")}${price ? " ₫" : ""}</div>
            <div style="font-size: 12px; color:#64748b; margin-top:2px;">một đêm</div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function priceMarkerHtml(h: UiHotel, active: boolean) {
  const price = parsePriceNumber(h.priceText);
  const bg = active ? "#0f172a" : "#ffffff";
  const fg = active ? "#ffffff" : "#0f172a";
  const ring = active ? "0 0 0 2px rgba(56,189,248,.55)" : "0 0 0 1px rgba(15,23,42,.14)";
  return `
  <div style="display:inline-flex; align-items:center; justify-content:center; min-width: 64px; height: 28px; padding: 0 10px; border-radius: 999px; background:${bg}; color:${fg}; font-weight: 800; font-size: 12px; box-shadow: 0 10px 24px rgba(15,23,42,.18); ${ring};">
    ${escapeHtml(price || "•")}
  </div>`;
}

async function fetchPois(center: { lat: number; lng: number }, radiusMeters: number): Promise<Poi[]> {
  const q = `
[out:json][timeout:25];
(
  node["tourism"~"attraction|museum"][name](around:${radiusMeters},${center.lat},${center.lng});
  node["amenity"~"restaurant|cafe"][name](around:${radiusMeters},${center.lat},${center.lng});
  node["historic"][name](around:${radiusMeters},${center.lat},${center.lng});
  way["tourism"~"attraction|museum"][name](around:${radiusMeters},${center.lat},${center.lng});
  way["amenity"~"restaurant|cafe"][name](around:${radiusMeters},${center.lat},${center.lng});
  relation["tourism"~"attraction|museum"][name](around:${radiusMeters},${center.lat},${center.lng});
);
out center 60;
`;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const els = Array.isArray(data?.elements) ? data.elements : [];
  const out: Poi[] = [];
  for (const el of els) {
    const name = el?.tags?.name;
    const lat = typeof el?.lat === "number" ? el.lat : typeof el?.center?.lat === "number" ? el.center.lat : undefined;
    const lng = typeof el?.lon === "number" ? el.lon : typeof el?.center?.lon === "number" ? el.center.lon : undefined;
    if (!name || lat == null || lng == null) continue;
    const kind = el?.tags?.tourism || el?.tags?.amenity || el?.tags?.historic || "poi";
    out.push({ id: `${el.type}-${el.id}`, name, lat, lng, kind });
  }
  const seen = new Set<string>();
  return out
    .filter((p) => {
      const k = `${p.name}-${p.lat.toFixed(5)}-${p.lng.toFixed(5)}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 60);
}

export default function MapPane({
  hotels,
  hoveredHotelId,
  onHoverHotel,
  onSearchByMap,
}: {
  hotels: UiHotel[];
  hoveredHotelId: string | null;
  onHoverHotel: (id: string | null) => void;
  onSearchByMap: (payload: { latitude: string; longitude: string; radius: string }) => void;
}) {
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const [pois, setPois] = useState<Poi[]>([]);
  const [autoSearch, setAutoSearch] = useState(false);
  const lastSearchKeyRef = useRef<string>("");
  const moveDebounceRef = useRef<any>(null);

  const center = useMemo(() => pickCenter(hotels), [hotels]);
  const hotelsWithGeo = useMemo(
    () => hotels.filter((h) => typeof h.lat === "number" && typeof h.lng === "number"),
    [hotels]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await fetchPois(center, 2500);
        if (!cancelled) setPois(p);
      } catch {
        if (!cancelled) setPois([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [center.lat, center.lng]);

  useEffect(() => {
    const L = (globalThis as any).L;
    if (!L) return;

    const ensureMap = () => {
      if (!mapRef.current) {
        mapRef.current = L.map("vivu_map", { zoomControl: true }).setView([center.lat, center.lng], 12);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(mapRef.current);

        mapRef.current.on("moveend", () => {
          if (!autoSearch) return;
          if (moveDebounceRef.current) clearTimeout(moveDebounceRef.current);
          moveDebounceRef.current = setTimeout(() => {
            const c = mapRef.current.getCenter();
            const key = `${c.lat.toFixed(4)},${c.lng.toFixed(4)}`;
            if (key === lastSearchKeyRef.current) return;
            lastSearchKeyRef.current = key;
            onSearchByMap({ latitude: String(c.lat), longitude: String(c.lng), radius: "20" });
          }, 500);
        });
      } else {
        mapRef.current.setView([center.lat, center.lng], 12);
      }

      if (!layerRef.current) {
        layerRef.current = L.layerGroup().addTo(mapRef.current);
      }
    };

    ensureMap();

    // Clear layer + rebuild markers.
    layerRef.current.clearLayers();
    markersRef.current.clear();

    const makeIcon = (h: UiHotel, active: boolean) =>
      L.divIcon({
        className: "",
        html: priceMarkerHtml(h, active),
        iconSize: [68, 28],
        iconAnchor: [34, 14],
      });

    for (const h of hotelsWithGeo) {
      const active = hoveredHotelId === h.id;
      const m = L.marker([h.lat!, h.lng!], { icon: makeIcon(h, active) });
      m.on("mouseover", () => onHoverHotel(h.id));
      m.on("mouseout", () => onHoverHotel(null));
      m.on("click", () => {
        onHoverHotel(h.id);
      });
      m.bindPopup(popupCardHtml(h), { closeButton: true, maxWidth: 320, autoPan: true });
      m.addTo(layerRef.current);
      markersRef.current.set(h.id, m);
    }

    // POIs
    for (const p of pois) {
      const m = L.circleMarker([p.lat, p.lng], { radius: 5, color: "#0ea5e9", weight: 1, fillOpacity: 0.25 });
      m.bindPopup(`<b>${escapeHtml(p.name)}</b><br/><span style="opacity:.8">${escapeHtml(p.kind)}</span>`);
      m.addTo(layerRef.current);
    }
  }, [center.lat, center.lng, hotelsWithGeo, pois, hoveredHotelId, autoSearch, onHoverHotel, onSearchByMap]);

  // When hovering a hotel in the list: pan + open popup and update marker icons.
  useEffect(() => {
    const L = (globalThis as any).L;
    if (!L) return;
    if (!mapRef.current) return;
    if (!hoveredHotelId) {
      // close popup
      mapRef.current.closePopup();
      return;
    }
    const m = markersRef.current.get(hoveredHotelId);
    if (!m) return;
    try {
      const ll = m.getLatLng();
      mapRef.current.panTo(ll, { animate: true, duration: 0.25 });
      m.openPopup();
    } catch {
      // ignore
    }
  }, [hoveredHotelId]);

  return (
    <aside className="bg-white rounded-2xl shadow-xl ring-1 ring-black/5 sticky top-20 h-[calc(100vh-6rem)] overflow-hidden">
      <Script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" strategy="afterInteractive" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      <div className="px-3 py-2 border-b text-sm text-slate-700 flex items-center justify-between">
        <div className="font-medium">Bản đồ</div>
        <div className="text-xs text-slate-500">{hotelsWithGeo.length} khách sạn</div>
      </div>

      <div className="relative h-[calc(100%-40px)]">
        <div className="absolute z-[60] left-1/2 -translate-x-1/2 top-3">
          <label className="bg-white/95 backdrop-blur shadow-lg ring-1 ring-black/10 rounded-full px-4 py-2 text-sm font-medium text-slate-900 flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoSearch}
              onChange={(e) => setAutoSearch(e.target.checked)}
              className="h-4 w-4"
            />
            Tìm kiếm khi di chuyển bản đồ
          </label>
        </div>

        <div id="vivu_map" className="w-full h-full" />
      </div>
    </aside>
  );
}
