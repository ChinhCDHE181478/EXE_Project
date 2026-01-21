"use client";

import React, { useEffect, useMemo, useRef } from "react";

export type UiPlace = {
  id: string;
  place_id: string;
  name: string;
  kind: "attraction" | "restaurant";
  day?: string;
  city?: string;
  reason?: string;
  lat?: number;
  lng?: number;
};

declare global {
  // eslint-disable-next-line no-var
  var L: any;
}

const DALAT_CENTER = { lat: 11.9416, lng: 108.4383 };

function escapeHtml(s: string) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function markerHtml(p: UiPlace, active: boolean) {
  const bg = active ? "#0f172a" : "#ffffff";
  const fg = active ? "#ffffff" : "#0f172a";
  const ring = active ? "0 0 0 2px rgba(56,189,248,.55)" : "0 0 0 1px rgba(15,23,42,.14)";
  const label = p.kind === "restaurant" ? "Ăn" : "Chơi";
  return `
    <div style="
      display:inline-flex; align-items:center; gap:8px;
      padding:8px 10px; border-radius:999px;
      background:${bg}; color:${fg};
      box-shadow:${ring}, 0 10px 24px rgba(2,6,23,.12);
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto;
      font-weight:900; font-size:12px;
      white-space:nowrap;
    ">
      <span style="
        display:inline-flex; width:22px; height:22px; border-radius:999px;
        align-items:center; justify-content:center;
        background:${active ? "rgba(255,255,255,.18)" : "rgba(2,6,23,.06)"};
        font-size:11px;
      ">${label}</span>
      <span style="max-width:160px; overflow:hidden; text-overflow:ellipsis;">
        ${escapeHtml(p.name)}
      </span>
    </div>
  `;
}

function pickCenter(places: UiPlace[]) {
  const p = places.find((x) => Number.isFinite(x.lat) && Number.isFinite(x.lng));
  return p ? { lat: Number(p.lat), lng: Number(p.lng) } : DALAT_CENTER;
}

export default function PlacesMapPane({
  places,
  hoveredPlaceId,
  onHoverPlace,
  onSelectPlace,
}: {
  places: UiPlace[];
  hoveredPlaceId?: string | null;
  onHoverPlace?: (id: string | null) => void;
  onSelectPlace?: (id: string) => void;
}) {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());

  const center = useMemo(() => pickCenter(places), [places]);

  // Load Leaflet (CDN) once
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!document.querySelector('link[data-leaflet="1"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.setAttribute("data-leaflet", "1");
        document.head.appendChild(link);
      }

      if (!globalThis.L) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          s.async = true;
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Leaflet load failed"));
          document.body.appendChild(s);
        });
      }

      if (cancelled) return;

      if (!mapRef.current && mapEl.current) {
        const L = globalThis.L;

        mapRef.current = L.map(mapEl.current, {
          zoomControl: true,
          attributionControl: true,
        }).setView([center.lat, center.lng], 12);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(mapRef.current);
      }
    };

    load().catch((e) => console.error(e));
    return () => {
      cancelled = true;
    };
  }, []);

  // Update view when center changes
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView([center.lat, center.lng], 12);
  }, [center.lat, center.lng]);

  // Render markers
  useEffect(() => {
    if (!mapRef.current || !globalThis.L) return;
    const L = globalThis.L;

    // Clear old markers
    for (const [, m] of markersRef.current) {
      try {
        m.remove();
      } catch {}
    }
    markersRef.current.clear();

    const valid = places.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
    for (const p of valid) {
      const icon = L.divIcon({
        className: "places-div-icon",
        html: markerHtml(p, false),
        iconSize: [1, 1],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([Number(p.lat), Number(p.lng)], { icon }).addTo(mapRef.current);

      marker.on("mouseover", () => onHoverPlace?.(p.place_id));
      marker.on("mouseout", () => onHoverPlace?.(null));
      marker.on("click", () => onSelectPlace?.(p.place_id));

      const gmaps = `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(p.place_id)}`;

      marker.bindPopup(`
        <div style="font-family: ui-sans-serif, system-ui; min-width:240px;">
          <div style="font-weight:900; margin-bottom:6px;">${escapeHtml(p.name)}</div>
          ${p.reason ? `<div style="font-size:12px; color:#334155; margin-bottom:8px;">${escapeHtml(p.reason)}</div>` : ""}
          <a href="${gmaps}" target="_blank" rel="noreferrer"
             style="font-size:12px; color:#0891b2; text-decoration:underline;">
            Mở trên Google Maps
          </a>
        </div>
      `);

      markersRef.current.set(p.place_id, marker);
    }
  }, [places, onHoverPlace, onSelectPlace]);

  // Hover highlight
  useEffect(() => {
    if (!globalThis.L) return;
    const L = globalThis.L;
    const activeId = hoveredPlaceId ?? null;

    for (const p of places) {
      const marker = markersRef.current.get(p.place_id);
      if (!marker) continue;

      const active = activeId === p.place_id;
      const icon = L.divIcon({
        className: "places-div-icon",
        html: markerHtml(p, active),
        iconSize: [1, 1],
        iconAnchor: [0, 0],
      });
      marker.setIcon(icon);
    }
  }, [hoveredPlaceId, places]);

  return (
    <div className="h-[260px] rounded-2xl overflow-hidden ring-1 ring-slate-100 bg-white">
      <div ref={mapEl} className="h-full w-full" />
    </div>
  );
}
