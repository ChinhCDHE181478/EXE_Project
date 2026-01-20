"use client";

import { useEffect, useMemo, useState } from "react";

import { pickIata } from "@/lib/utils/flight";

export type FlightSearchValue = {
  tripType: "ONEWAY" | "ROUND";
  from: string;
  to: string;
  departDate: string;
  returnDate?: string;
  adults: number;
  /** CSV of ages (e.g. "5,7") */
  childrenAge?: string;
  cabinClass?: string;
  currency_code: string;

  /** UI-only toggles (BE may ignore) */
  nearbyFrom?: boolean;
  nearbyTo?: boolean;
  directOnly?: boolean;
};

const CABIN_LABEL: Record<string, string> = {
  "": "Phổ thông",
  ECONOMY: "Phổ thông",
  PREMIUM_ECONOMY: "Phổ thông cao cấp",
  BUSINESS: "Thương gia",
  FIRST: "Hạng nhất",
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function parseAges(csv: string): number[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map((x) => Number(String(x).trim()))
    .filter((x) => Number.isFinite(x) && x >= 0 && x <= 17);
}

function toCsv(ages: number[]): string {
  return ages
    .filter((x) => Number.isFinite(x))
    .map((x) => String(x))
    .join(",");
}

export default function FlightSearchCard({
  value,
  variant = "hero",
  onSearch,
}: {
  value: FlightSearchValue;
  variant?: "hero" | "compact";
  onSearch: (next: FlightSearchValue) => void;
}) {
  const [tripType, setTripType] = useState<FlightSearchValue["tripType"]>(value.tripType);
  const [from, setFrom] = useState(value.from);
  const [to, setTo] = useState(value.to);
  const [departDate, setDepartDate] = useState(value.departDate);
  const [returnDate, setReturnDate] = useState(value.returnDate ?? "");
  const [adults, setAdults] = useState<number>(value.adults ?? 1);
  const [cabinClass, setCabinClass] = useState(value.cabinClass ?? "");
  const [nearbyFrom, setNearbyFrom] = useState<boolean>(!!value.nearbyFrom);
  const [nearbyTo, setNearbyTo] = useState<boolean>(!!value.nearbyTo);
  const [directOnly, setDirectOnly] = useState<boolean>(!!value.directOnly);

  const [childrenCount, setChildrenCount] = useState<number>(() => parseAges(value.childrenAge ?? "").length);
  const [childrenAges, setChildrenAges] = useState<(number | null)[]>(() => {
    const parsed = parseAges(value.childrenAge ?? "");
    return parsed.map((n) => (Number.isFinite(n) ? n : null));
  });
  const [currencyCode, setCurrencyCode] = useState(value.currency_code ?? "VND");

  const [paxOpen, setPaxOpen] = useState(false);

  useEffect(() => {
    setTripType(value.tripType);
    setFrom(value.from);
    setTo(value.to);
    setDepartDate(value.departDate);
    setReturnDate(value.returnDate ?? "");
    setAdults(value.adults ?? 1);
    setCabinClass(value.cabinClass ?? "");
    setNearbyFrom(!!value.nearbyFrom);
    setNearbyTo(!!value.nearbyTo);
    setDirectOnly(!!value.directOnly);
    const parsed = parseAges(value.childrenAge ?? "");
    setChildrenCount(parsed.length);
    setChildrenAges(parsed.map((n) => (Number.isFinite(n) ? n : null)));
    setCurrencyCode(value.currency_code ?? "VND");
  }, [
    value.tripType,
    value.from,
    value.to,
    value.departDate,
    value.returnDate,
    value.adults,
    value.childrenAge,
    value.cabinClass,
    value.currency_code,
    value.nearbyFrom,
    value.nearbyTo,
    value.directOnly,
  ]);

  // Keep children ages array in sync with childrenCount
  useEffect(() => {
    setChildrenAges((prev) => {
      const next = prev.slice(0, childrenCount);
      while (next.length < childrenCount) next.push(null);
      return next;
    });
  }, [childrenCount]);

  // Close pax popover when clicking outside
  useEffect(() => {
    if (!paxOpen) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest?.("[data-flight-pax-popover='1']")) return;
      setPaxOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [paxOpen]);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const canSearch = useMemo(() => {
    return !!pickIata(from) && !!pickIata(to) && !!departDate;
  }, [from, to, departDate]);

  const handleSearch = () => {
    const normalizedAdults = clamp(Number(adults) || 1, 1, 9);
    const normalizedChildren = clamp(Number(childrenCount) || 0, 0, 6);
    const selected = childrenAges.slice(0, normalizedChildren);
    const allAgesSelected = normalizedChildren === 0 || selected.every((x) => x !== null && x !== undefined);

    if (!allAgesSelected) {
      setPaxOpen(true);
      return;
    }

    const ages = selected.map((x) => clamp(Number(x), 0, 17));

    const next: FlightSearchValue = {
      tripType,
      from: pickIata(from),
      to: pickIata(to),
      departDate,
      returnDate: tripType === "ROUND" ? returnDate || undefined : undefined,
      adults: normalizedAdults,
      childrenAge: ages.length ? toCsv(ages) : undefined,
      cabinClass: cabinClass || undefined,
      currency_code: currencyCode || "VND",
      nearbyFrom,
      nearbyTo,
      directOnly,
    };
    onSearch(next);
  };

  const summaryPax = useMemo(() => {
    const a = clamp(Number(adults) || 1, 1, 9);
    const c = clamp(Number(childrenCount) || 0, 0, 6);
    const cabin = CABIN_LABEL[cabinClass] ?? CABIN_LABEL[""];
    const paxPart = c > 0 ? `${a} người lớn, ${c} trẻ em` : `${a} người lớn`;
    return `${paxPart}, ${cabin}`;
  }, [adults, childrenCount, cabinClass]);

  const wrapClass =
    variant === "hero"
      ? "mx-auto mt-8 max-w-6xl rounded-2xl bg-white shadow-xl ring-1 ring-black/5 p-4"
      : "mx-auto max-w-6xl rounded-2xl bg-white/95 backdrop-blur shadow-2xl ring-1 ring-black/10 p-4";

  return (
    <div className={wrapClass}>
      {/* Toggle */}
      <div className="flex items-center gap-2 pb-3">
        <button
          type="button"
          onClick={() => setTripType("ROUND")}
          className={`px-3 py-1.5 rounded-full text-sm ${
            tripType === "ROUND"
              ? "bg-[#0891b2] text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Khứ hồi
        </button>
        <button
          type="button"
          onClick={() => setTripType("ONEWAY")}
          className={`px-3 py-1.5 rounded-full text-sm ${
            tripType === "ONEWAY"
              ? "bg-[#0891b2] text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Một chiều
        </button>
      </div>

      <div
        className={
          // NOTE: Do not use `overflow-hidden` here.
          // The pax/cabin popover is absolutely positioned and must be able to overflow.
          // Layout: 2 rows on desktop so the checkbox options sit UNDER the inputs (like your design).
          "grid gap-0 md:grid-cols-[1.2fr_auto_1.2fr_1fr_1fr_1.4fr_auto] md:grid-rows-2 rounded-xl ring-1 ring-slate-200 bg-white divide-y md:divide-y-0 md:divide-x divide-slate-200"
        }
      >
        {/* From */}
        <div className="px-4 py-3">
          <label className="text-[11px] uppercase tracking-wide text-slate-600">Từ</label>
          <input
            className="mt-1 w-full bg-transparent outline-none border-0 px-0 py-2 focus:ring-0"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="HAN"
          />
        </div>

        {/* Swap */}
        <div className="flex items-end justify-center px-3 py-3">
          <button
            type="button"
            onClick={swap}
            className="mb-[2px] inline-flex h-10 w-10 items-center justify-center rounded-full border hover:bg-slate-50"
            title="Đổi chiều"
          >
            ↔
          </button>
        </div>

        {/* To */}
        <div className="px-4 py-3">
          <label className="text-[11px] uppercase tracking-wide text-slate-600">Đến</label>
          <input
            className="mt-1 w-full bg-transparent outline-none border-0 px-0 py-2 focus:ring-0"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="SGN"
          />
        </div>

        {/* Depart */}
        <div className="px-4 py-3">
          <label className="text-[11px] uppercase tracking-wide text-slate-600">Ngày đi</label>
          <input
            type="date"
            value={departDate}
            onChange={(e) => setDepartDate(e.target.value)}
            className="mt-1 w-full bg-transparent outline-none border-0 px-0 py-2 focus:ring-0"
          />
        </div>

        {/* Return */}
        <div className={`px-4 py-3 ${tripType === "ONEWAY" ? "hidden" : ""}`}>
          <label className="text-[11px] uppercase tracking-wide text-slate-600">Quay về</label>
          <input
            type="date"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            disabled={tripType !== "ROUND"}
            className="mt-1 w-full bg-transparent outline-none border-0 px-0 py-2 focus:ring-0 disabled:opacity-40"
          />
        </div>

        {/* Pax + Cabin */}
        <div className="relative px-4 py-3" data-flight-pax-popover="1">
          <label className="text-[11px] uppercase tracking-wide text-slate-600">Khách và hạng ghế</label>
          <button
            type="button"
            onClick={() => setPaxOpen((v) => !v)}
            className="mt-1 w-full rounded-lg border border-transparent bg-transparent px-0 py-2 text-left outline-none hover:bg-slate-50"
          >
            <div className="font-medium text-slate-900">{summaryPax}</div>
          </button>

          {paxOpen ? (
            <div className="absolute left-0 top-[calc(100%+10px)] z-50 w-[360px] max-w-[calc(100vw-24px)] rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-black/10">
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-semibold text-slate-800">Hạng khoang</div>
                  <select
                    value={cabinClass}
                    onChange={(e) => setCabinClass(e.target.value)}
                    className="mt-2 w-full rounded-xl border px-3 py-3"
                  >
                    <option value="">Phổ thông</option>
                    <option value="ECONOMY">Phổ thông</option>
                    <option value="PREMIUM_ECONOMY">Phổ thông cao cấp</option>
                    <option value="BUSINESS">Thương gia</option>
                    <option value="FIRST">Hạng nhất</option>
                  </select>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">Người lớn</div>
                      <div className="text-xs text-slate-500">Từ 18 tuổi trở lên</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAdults((x) => clamp((Number(x) || 1) - 1, 1, 9))}
                        className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200"
                      >
                        −
                      </button>
                      <div className="min-w-6 text-center font-semibold">{clamp(Number(adults) || 1, 1, 9)}</div>
                      <button
                        type="button"
                        onClick={() => setAdults((x) => clamp((Number(x) || 1) + 1, 1, 9))}
                        className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">Trẻ em</div>
                      <div className="text-xs text-slate-500">Từ 0 đến 17 tuổi</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setChildrenCount((x) => {
                            const next = clamp((Number(x) || 0) - 1, 0, 6);
                            setChildrenAges((ages) => ages.slice(0, next));
                            return next;
                          })
                        }
                        className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200"
                      >
                        −
                      </button>
                      <div className="min-w-6 text-center font-semibold">{clamp(Number(childrenCount) || 0, 0, 6)}</div>
                      <button
                        type="button"
                        onClick={() =>
                          setChildrenCount((x) => {
                            const next = clamp((Number(x) || 0) + 1, 0, 6);
                            setChildrenAges((ages) => {
                              const copy = [...ages];
                              while (copy.length < next) copy.push(null);
                              return copy;
                            });
                            return next;
                          })
                        }
                        className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {clamp(Number(childrenCount) || 0, 0, 6) > 0 ? (
                  <div className="space-y-3">
                    {Array.from({ length: clamp(Number(childrenCount) || 0, 0, 6) }).map((_, idx) => (
                      <div key={idx}>
                        <div className="text-xs font-medium text-slate-600">Tuổi của trẻ {idx + 1}</div>
                        <select
                          value={childrenAges[idx] ?? ""}
                          onChange={(e) =>
                            setChildrenAges((ages) => {
                              const copy = [...ages];
                              copy[idx] = e.target.value === "" ? null : clamp(Number(e.target.value) || 0, 0, 17);
                              return copy;
                            })
                          }
                          className="mt-1 w-full rounded-xl border px-3 py-3"
                        >
                          <option value="" disabled>
                            Chọn tuổi
                          </option>
                          {Array.from({ length: 18 }).map((__, age) => (
                            <option key={age} value={age}>
                              {age}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}

                    <p className="text-xs text-slate-500">
                      Tuổi của bạn tại thời điểm đi phải nằm trong độ tuổi được chọn khi đặt vé. Các hãng hàng không có các
                      quy định giới hạn đối với những người dưới 18 tuổi đi lại một mình.
                    </p>
                    <p className="text-xs text-slate-500">
                      Các chính sách và giới hạn về độ tuổi đi lại với trẻ em có thể khác nhau, vì vậy bạn luôn nên kiểm tra với
                      hãng hàng không trước khi đặt vé.
                    </p>
                  </div>
                ) : null}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPaxOpen(false)}
                    disabled={
                      clamp(Number(childrenCount) || 0, 0, 6) > 0 &&
                      !childrenAges
                        .slice(0, clamp(Number(childrenCount) || 0, 0, 6))
                        .every((x) => x !== null && x !== undefined)
                    }
                    className="rounded-xl bg-slate-100 px-4 py-2 font-semibold hover:bg-slate-200 disabled:opacity-50"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Quick options (match Skyscanner-like UI) */}
        <div className="px-4 py-3 grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-6 md:col-span-6 md:row-start-2 md:border-t md:border-slate-200">
          <label className="inline-flex items-center gap-2 text-sm text-slate-700 select-none">
            <input type="checkbox" checked={nearbyFrom} onChange={(e) => setNearbyFrom(e.target.checked)} />
            Thêm sân bay lân cận
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700 select-none">
            <input type="checkbox" checked={nearbyTo} onChange={(e) => setNearbyTo(e.target.checked)} />
            Thêm sân bay lân cận
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700 select-none">
            <input type="checkbox" checked={directOnly} onChange={(e) => setDirectOnly(e.target.checked)} />
            Chuyến bay thẳng
          </label>
        </div>

        {/* Search */}
        <div className="px-4 py-3 flex items-end justify-end gap-2 md:col-start-7 md:row-span-2">
          <select
            value={currencyCode}
            onChange={(e) => setCurrencyCode(e.target.value)}
            className="h-12 rounded-lg border px-3"
            aria-label="Currency"
          >
            <option value="VND">VND</option>
            <option value="USD">USD</option>
          </select>
          <button
            type="button"
            className="h-12 px-6 rounded-lg bg-[#0891b2] text-white font-semibold hover:brightness-110 disabled:opacity-50"
            disabled={!canSearch}
            onClick={handleSearch}
          >
            Tìm kiếm
          </button>
        </div>
      </div>
    </div>
  );
}
