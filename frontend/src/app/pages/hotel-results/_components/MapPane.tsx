"use client";

import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";
import type { UiHotel } from "./ResultsPane";

// Leaflet via CDN (free) + OpenStreetMap tiles (free)
// We also pull nearby POIs via the public Overpass API (free).

type Poi = { id: string; name: string; lat: number; lng: number; kind: string };

function pickCenter(hotels: UiHotel[]) {
  const h = hotels.find((x) => typeof x.lat === "number" && typeof x.lng === "number");
  // fallback: Hanoi
  return { lat: h?.lat ?? 21.028, lng: h?.lng ?? 105.852 };
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const aa = s1 * s1 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * s2 * s2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(aa)));
}

async function fetchPois(center: { lat: number; lng: number }, radiusMeters: number): Promise<Poi[]> {
  // A small, practical set of free POIs around the center.
  // Overpass returns nodes/ways/relations. We'll use center for ways/relations.
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

  // dedupe by name+coord (Overpass can return duplicates)
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

export default function MapPane({ hotels }: { hotels: UiHotel[] }) {
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const [pois, setPois] = useState<Poi[]>([]);

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
    // init when leaflet is available
    const L = (globalThis as any).L;
    if (!L) return;

    if (!mapRef.current) {
      mapRef.current = L.map("vivu_map", {
        zoomControl: true,
      }).setView([center.lat, center.lng], 12);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(mapRef.current);
    } else {
      mapRef.current.setView([center.lat, center.lng], 12);
    }

    if (layerRef.current) {
      layerRef.current.clearLayers();
    } else {
      layerRef.current = L.layerGroup().addTo(mapRef.current);
    }

    // Hotel markers
    for (const h of hotelsWithGeo) {
      const m = L.marker([h.lat!, h.lng!]);
      m.bindPopup(`<b>${escapeHtml(h.name)}</b><br/>${escapeHtml(h.city || "")}`);
      m.addTo(layerRef.current);
    }

    // POI markers (only those reasonably close to the center)
    const c = { lat: center.lat, lng: center.lng };
    for (const p of pois) {
      if (haversineKm(c, { lat: p.lat, lng: p.lng }) > 8) continue;
      const m = L.circleMarker([p.lat, p.lng], { radius: 6 });
      m.bindPopup(`<b>${escapeHtml(p.name)}</b><br/><span style="opacity:.8">${escapeHtml(p.kind)}</span>`);
      m.addTo(layerRef.current);
    }
  }, [center.lat, center.lng, hotelsWithGeo, pois]);

  return (
    <aside className="bg-white shadow-xl ring-1 ring-black/5 sticky top-20 h-[calc(100vh-6rem)] overflow-hidden">
      <Script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        strategy="afterInteractive"
      />
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />

      <div className="px-3 py-2 border-b text-sm text-slate-700 flex items-center justify-between">
        <div className="font-medium">Bản đồ (miễn phí)</div>
        <div className="text-xs text-slate-500">
          {hotelsWithGeo.length} KS • {pois.length} điểm
        </div>
      </div>

      <div id="vivu_map" className="w-full h-[calc(100%-40px)]" />
    </aside>
  );
}

function escapeHtml(s: string) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
