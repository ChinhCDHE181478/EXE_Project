"use client";

import React, { useEffect, useRef } from "react";

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
  var L: any;
}

const VIETNAM_CENTER = { lat: 16.047079, lng: 108.206235 };

function escapeHtml(s: string) {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
const ICONS = {
  restaurant: `
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
      <path d="M7 2v20"/>
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
    </svg>
  `,
  attraction: `
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  `
};

function markerHtml(p: UiPlace, active: boolean) {
  const baseColor = p.kind === "restaurant" ? "#F97316" : "#0056D2";
  const bg = active ? baseColor : "#ffffff";
  const fg = active ? "#ffffff" : baseColor;
  const border = active ? "#ffffff" : baseColor;
  const iconSvg = p.kind === "restaurant" ? ICONS.restaurant : ICONS.attraction;
  const zIndex = active ? 9999 : 100;

  return `
    <div style="
      position: relative;
      z-index: ${zIndex};
      display: inline-flex; align-items: center; gap: 8px;
      padding: 6px 10px 6px 6px; 
      border-radius: 20px;
      background: ${bg}; 
      color: ${fg};
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      border: 2px solid ${border};
      font-family: sans-serif; font-weight: 700; font-size: 12px;
      white-space: nowrap; 
      transform: ${active ? "scale(1.15)" : "scale(1)"};
      transition: all 0.2s ease;
    ">
      <span style="
        display: flex; align-items: center; justify-content: center;
        width: 20px; height: 20px;
        background: ${active ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.05)"};
        border-radius: 50%;
      ">
        ${iconSvg}
      </span>
      
      <span style="max-width: 140px; overflow: hidden; text-overflow: ellipsis; padding-right: 4px;">
        ${escapeHtml(p.name)}
      </span>

      ${active ? `<div style="
        position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%) rotate(45deg);
        width: 10px; height: 10px; background: ${bg}; border-bottom: 2px solid ${border}; border-right: 2px solid ${border}; z-index: -1;
      "></div>` : ""}
    </div>
  `;
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

  // 1. Load Leaflet CSS & JS
  useEffect(() => {
    let cancelled = false;

    const loadLeaflet = async () => {
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
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
          zoomControl: false,
          attributionControl: false,
        }).setView([VIETNAM_CENTER.lat, VIETNAM_CENTER.lng], 6);

        // Google Maps Layer
        L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
          maxZoom: 20,
          attribution: 'Google Maps'
        }).addTo(mapRef.current);

        L.control.zoom({ position: "bottomright" }).addTo(mapRef.current);
        
        // --- QUAN TRỌNG: Fix lỗi map không full ---
        setTimeout(() => {
           mapRef.current.invalidateSize();
        }, 100);
      }
    };

    loadLeaflet().catch((e) => console.error(e));

    return () => { cancelled = true; };
  }, []);

  // 2. Vẽ Markers
  useEffect(() => {
    if (!mapRef.current || !globalThis.L) return;
    const L = globalThis.L;

    // --- QUAN TRỌNG: Fix lỗi map không full khi data đổi ---
    setTimeout(() => {
        mapRef.current.invalidateSize();
    }, 200);

    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    const validPlaces = places.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
    if (validPlaces.length === 0) return;

    const group = L.featureGroup();

    validPlaces.forEach((p) => {
      const icon = L.divIcon({
        className: "places-div-icon",
        html: markerHtml(p, p.place_id === hoveredPlaceId),
        iconSize: [0, 0],
        iconAnchor: [15, 20], 
      });

      const marker = L.marker([Number(p.lat), Number(p.lng)], { icon }).addTo(mapRef.current);

      marker.on("mouseover", () => {
        onHoverPlace?.(p.place_id);
        marker.setZIndexOffset(9999);
      });
      marker.on("mouseout", () => {
        onHoverPlace?.(null);
        marker.setZIndexOffset(0);
      });
      marker.on("click", () => onSelectPlace?.(p.place_id));

      const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name)}`;
      
      marker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 200px; padding: 4px;">
          <div style="font-weight: 800; color: #0f172a; font-size: 14px; margin-bottom: 6px;">
            ${escapeHtml(p.name)}
          </div>
          ${p.reason ? `<div style="font-size: 12px; color: #64748b; line-height: 1.4; margin-bottom: 12px;">${escapeHtml(p.reason)}</div>` : ""}
          <a href="${gmapsUrl}" target="_blank" rel="noreferrer"
             style="
               display: block; text-align: center;
               background: #0056D2; color: #fff;
               padding: 8px 0; border-radius: 8px;
               font-size: 12px; font-weight: 700; text-decoration: none;
               box-shadow: 0 4px 6px rgba(0, 86, 210, 0.2);
             ">
             Xem trên Google Maps
          </a>
        </div>
      `, {
        className: 'vivu-popup',
        closeButton: false,
        offset: [0, -10]
      });

      markersRef.current.set(p.place_id, marker);
      marker.addTo(group);
    });

    try {
      mapRef.current.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 16 });
    } catch(e) { }

  }, [places, onSelectPlace]); 

  // 3. Xử lý Hover Highlight
  useEffect(() => {
    if (!globalThis.L || !mapRef.current) return;
    const L = globalThis.L;

    markersRef.current.forEach((marker, placeId) => {
      const p = places.find(place => place.place_id === placeId);
      if (!p) return;

      const isActive = placeId === hoveredPlaceId;
      
      const newIcon = L.divIcon({
        className: "places-div-icon",
        html: markerHtml(p, isActive),
        iconSize: [0, 0],
        iconAnchor: [15, 20],
      });
      
      marker.setIcon(newIcon);

      if (isActive) {
        marker.setZIndexOffset(9999);
      } else {
        marker.setZIndexOffset(0);
      }
    });
  }, [hoveredPlaceId, places]);

  return (
    <div className="h-full w-full bg-slate-100 relative overflow-hidden isolate">
        {/* --- SỬA CSS TẠI ĐÂY: Dùng absolute inset-0 để map luôn full --- */}
      <div ref={mapEl} className="absolute inset-0 z-0" style={{ width: "100%", height: "100%" }} />
      <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/5 to-transparent pointer-events-none z-10" />
      
      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          padding: 0 !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15) !important;
          overflow: hidden;
        }
        .leaflet-popup-content { margin: 12px !important; }
        .leaflet-popup-tip { background: white; }
        .places-div-icon {
          background: transparent !important;
          border: none !important;
        }
        /* Ẩn logo Google */
        .gmnoprint a, .gmnoprint span, .gm-style-cc {
            display:none;
        }
        .gmnoprint div {
            background:none !important;
        }
        .leaflet-container {
            width: 100% !important;
            height: 100% !important;
        }
      `}</style>
    </div>
  );
}