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
  var L: any;
}

const VIETNAM_CENTER = { lat: 16.047079, lng: 108.206235 }; // Đà Nẵng / Trung tâm VN

function escapeHtml(s: string) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/** * Marker Style: Thiết kế theo tone màu Vivuplan 
 * Xanh dương đậm (#0056D2) khi active
 */
function markerHtml(p: UiPlace, active: boolean) {
  const bg = active ? "#0056D2" : "#ffffff";
  const fg = active ? "#ffffff" : "#0f172a";
  const border = active ? "#ffffff" : "#0056D2";
  const label = p.kind === "restaurant" ? "Ăn" : "Chơi";
  
  return `
    <div style="
      display:inline-flex; align-items:center; gap:8px;
      padding:6px 12px; border-radius:999px;
      background:${bg}; color:${fg};
      box-shadow: 0 10px 25px -5px rgba(0, 86, 210, 0.3);
      border: 2px solid ${border};
      font-family: system-ui, -apple-system, sans-serif;
      font-weight: 800; font-size: 13px;
      white-space: nowrap;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    ">
      <span style="
        display:inline-flex; width:18px; height:18px; border-radius:999px;
        align-items:center; justify-content:center;
        background:${active ? "rgba(255,255,255,0.2)" : "rgba(0,86,210,0.1)"};
        color: ${active ? "#fff" : "#0056D2"};
        font-size:10px;
      ">${label}</span>
      <span style="max-width:180px; overflow:hidden; text-overflow:ellipsis;">
        ${escapeHtml(p.name)}
      </span>
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

  // Load Leaflet CDN
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

        // Khởi tạo map không có zoomControl để giao diện sạch hơn
        mapRef.current = L.map(mapEl.current, {
          zoomControl: false,
          attributionControl: false,
        }).setView([VIETNAM_CENTER.lat, VIETNAM_CENTER.lng], 6);

        // Tile layer sang trọng (CartoDB Positron - Sáng và Minimalist)
        L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
          maxZoom: 19,
        }).addTo(mapRef.current);

        // Thêm lại zoomControl vào góc phải dưới cho gọn
        L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);
      }
    };

    load().catch((e) => console.error(e));
    return () => { cancelled = true; };
  }, []);

  // Cập nhật Markers và Fit Bounds (Tự động căn chỉnh nhìn rõ toàn bộ điểm)
  useEffect(() => {
    if (!mapRef.current || !globalThis.L) return;
    const L = globalThis.L;

    // Xóa markers cũ
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
        iconAnchor: [0, 0],
      });

      const marker = L.marker([Number(p.lat), Number(p.lng)], { icon }).addTo(mapRef.current);
      
      marker.on("mouseover", () => onHoverPlace?.(p.place_id));
      marker.on("mouseout", () => onHoverPlace?.(null));
      marker.on("click", () => onSelectPlace?.(p.place_id));

      const gmaps = `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${p.place_id}`;
      
      marker.bindPopup(`
        <div style="font-family: system-ui; min-width:200px; padding: 4px;">
          <div style="font-weight:900; color:#0056D2; font-size:14px; margin-bottom:4px;">${escapeHtml(p.name)}</div>
          ${p.reason ? `<div style="font-size:12px; color:#64748b; line-height:1.4; margin-bottom:10px;">${escapeHtml(p.reason)}</div>` : ""}
          <a href="${gmaps}" target="_blank" rel="noreferrer"
             style="display:block; text-align:center; background:#0056D2; color:#fff; padding:6px; border-radius:8px; font-size:11px; font-weight:bold; text-decoration:none;">
            Xem trên Google Maps
          </a>
        </div>
      `, {
        className: 'vivu-popup'
      });

      markersRef.current.set(p.place_id, marker);
      marker.addTo(group);
    });

    // Tự động căn chỉnh bản đồ để thấy hết các điểm
    mapRef.current.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 15 });

  }, [places, onHoverPlace, onSelectPlace]);

  // Hiệu ứng Hover Highlight
  useEffect(() => {
    if (!globalThis.L || !mapRef.current) return;
    const L = globalThis.L;

    places.forEach((p) => {
      const marker = markersRef.current.get(p.place_id);
      if (!marker) return;

      const isActive = p.place_id === hoveredPlaceId;
      marker.setIcon(L.divIcon({
        className: "places-div-icon",
        html: markerHtml(p, isActive),
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      }));

      if (isActive) {
        marker.setZIndexOffset(1000); // Đưa điểm đang chọn lên trên cùng
      } else {
        marker.setZIndexOffset(0);
      }
    });
  }, [hoveredPlaceId, places]);

  return (
    <div className="h-full w-full bg-slate-50 relative overflow-hidden">
      <div ref={mapEl} className="h-full w-full z-0" />
      
      {/* Overlay hiệu ứng kính mờ ở các cạnh cho sang trọng */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(255,255,255,0.2)]" />
      
      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          border-radius: 16px !important;
          padding: 8px !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1) !important;
        }
        .leaflet-popup-tip {
          display: none !important;
        }
        .places-div-icon {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}