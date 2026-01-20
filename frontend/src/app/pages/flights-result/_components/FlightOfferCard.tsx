"use client";

import Image from "next/image";

function formatCurrency(amount: number, code: string) {
  const n = Math.round(amount);
  if (code === "VND") return `${new Intl.NumberFormat("vi-VN").format(n)} đ`;
  return new Intl.NumberFormat(undefined, { style: "currency", currency: code }).format(n);
}

function formatTime(iso: string) {
  const d = new Date(iso);
  // 23:55
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function dayOffsetTag(departIso: string, arriveIso: string) {
  const d0 = new Date(departIso);
  const d1 = new Date(arriveIso);
  const offset = Math.floor((d1.getTime() - d0.getTime()) / (24 * 60 * 60 * 1000));
  return offset > 0 ? `+${offset}` : "";
}

function durationLabel(departIso: string, arriveIso: string) {
  const d0 = new Date(departIso);
  const d1 = new Date(arriveIso);
  const mins = Math.max(0, Math.round((d1.getTime() - d0.getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}g ${String(m).padStart(2, "0")}`;
}

function stopsLabel(legsCount: number) {
  if (legsCount <= 1) return "Bay thẳng";
  return `${legsCount - 1} điểm dừng`;
}

function uniqCarriers(legs: any[]) {
  const map = new Map<string, { name: string; logo?: string }>();
  for (const leg of legs ?? []) {
    for (const c of leg?.carriersData ?? []) {
      const key = `${c?.code ?? ""}-${c?.name ?? ""}`;
      if (!map.has(key)) map.set(key, { name: c?.name ?? "", logo: c?.logo });
    }
  }
  return Array.from(map.values()).filter((x) => x.name);
}

export default function FlightOfferCard({ offer }: { offer: any }) {
  const seg = offer?.segments?.[0];
  const legs = seg?.legs ?? [];
  const carriers = uniqCarriers(legs);
  const primaryCarrier = carriers[0];

  const depCode = seg?.departureAirport?.code ?? "";
  const arrCode = seg?.arrivalAirport?.code ?? "";

  const depTime = seg?.departureTime;
  const arrTime = seg?.arrivalTime;

  const currency = offer?.priceBreakdown?.total?.currencyCode ?? offer?.priceBreakdown?.totalRounded?.currencyCode ?? "VND";
  const priceUnits = Number(offer?.priceBreakdown?.totalRounded?.units ?? offer?.priceBreakdown?.total?.units ?? 0);

  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto]">
        {/* Left */}
        <div className="p-5">
          <div className="flex items-center gap-3">
            {/* Airline logo */}
            <div className="relative h-7 w-7 shrink-0">
              {primaryCarrier?.logo ? (
                <Image
                  src={primaryCarrier.logo}
                  alt={primaryCarrier.name}
                  fill
                  sizes="28px"
                  className="object-contain"
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-slate-200" />
              )}
            </div>
            <div className="text-sm text-slate-700 line-clamp-1">
              {primaryCarrier?.name || "Hãng bay"}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-6">
            {/* Departure */}
            <div className="min-w-[80px]">
              <div className="text-2xl font-semibold text-slate-900">{depTime ? formatTime(depTime) : "--:--"}</div>
              <div className="mt-1 text-sm text-slate-500">{depCode}</div>
            </div>

            {/* Middle */}
            <div className="flex-1">
              <div className="text-center text-sm text-slate-500">
                {depTime && arrTime ? durationLabel(depTime, arrTime) : ""}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-slate-400">✈</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
              <div className="mt-2 text-center text-sm text-[#0891b2]">
                {stopsLabel(legs.length)}
              </div>
            </div>

            {/* Arrival */}
            <div className="min-w-[92px] text-right">
              <div className="text-2xl font-semibold text-slate-900">
                {arrTime ? formatTime(arrTime) : "--:--"}
                <sup className="ml-1 text-xs text-slate-500">{depTime && arrTime ? dayOffsetTag(depTime, arrTime) : ""}</sup>
              </div>
              <div className="mt-1 text-sm text-slate-500">{arrCode}</div>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="border-t md:border-t-0 md:border-l border-slate-200 p-5 flex items-center justify-between md:justify-end gap-4">
          <button
            type="button"
            aria-label="Yêu thích"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100 text-slate-700"
          >
            ♡
          </button>

          <div className="text-right">
            <div className="text-xs text-slate-500">Tùy chọn từ</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(priceUnits, currency)}</div>
            <a
              href={offer?.linkFFFlight || "#"}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-6 text-white font-semibold hover:brightness-110"
            >
              Chọn →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
