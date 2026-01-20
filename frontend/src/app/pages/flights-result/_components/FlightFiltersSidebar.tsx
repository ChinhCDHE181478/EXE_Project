"use client";

import { useMemo } from "react";

export type FlightUiFilters = {
  stops: {
    direct: boolean;
    oneStop: boolean;
    twoPlus: boolean;
  };
};

function getStopsCount(offer: any): number {
  const seg = offer?.segments?.[0];
  const legs = seg?.legs;
  if (!Array.isArray(legs) || legs.length === 0) return 0;
  return Math.max(0, legs.length - 1);
}

type Props = {
  offers: any[];
  value: FlightUiFilters;
  onChange: (v: FlightUiFilters) => void;
};

export default function FlightFiltersSidebar({ offers, value, onChange }: Props) {
  const counts = useMemo(() => {
    const c = { direct: 0, oneStop: 0, twoPlus: 0 };
    for (const o of offers || []) {
      const stops = getStopsCount(o);
      if (stops === 0) c.direct += 1;
      else if (stops === 1) c.oneStop += 1;
      else c.twoPlus += 1;
    }
    return c;
  }, [offers]);

  const setStops = (key: keyof FlightUiFilters["stops"], checked: boolean) => {
    onChange({ ...value, stops: { ...value.stops, [key]: checked } });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-4 ring-1 ring-black/5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Số chặng dừng</h3>
        </div>

        <div className="space-y-2">
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={value.stops.direct}
              onChange={(e) => setStops("direct", e.target.checked)}
            />
            <span className="flex-1">
              Bay thẳng
              <div className="text-xs text-slate-500">{counts.direct ? `Có ${counts.direct}` : "Không có"}</div>
            </span>
          </label>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={value.stops.oneStop}
              onChange={(e) => setStops("oneStop", e.target.checked)}
            />
            <span className="flex-1">
              1 chặng dừng
              <div className="text-xs text-slate-500">{counts.oneStop ? `Có ${counts.oneStop}` : "Không có"}</div>
            </span>
          </label>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={value.stops.twoPlus}
              onChange={(e) => setStops("twoPlus", e.target.checked)}
            />
            <span className="flex-1">
              2+ chặng dừng
              <div className="text-xs text-slate-500">{counts.twoPlus ? `Có ${counts.twoPlus}` : "Không có"}</div>
            </span>
          </label>
        </div>
      </div>

      {/* Placeholder blocks to match the UI density (you can wire these to real filters later) */}
      <div className="rounded-xl bg-white p-4 ring-1 ring-black/5">
        <h3 className="text-sm font-semibold">Hành lý</h3>
        <div className="mt-3 text-xs text-slate-500">(UI giữ đúng bố cục như Skyscanner. Có thể nối API sau.)</div>
      </div>

      <div className="rounded-xl bg-white p-4 ring-1 ring-black/5">
        <h3 className="text-sm font-semibold">Giờ khởi hành</h3>
        <div className="mt-3 text-xs text-slate-500">(Sẽ nối slider lọc theo thời gian sau.)</div>
      </div>
    </div>
  );
}
