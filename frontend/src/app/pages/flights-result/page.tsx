// src/app/pages/flights-result/page.tsx
"use client";

import { useMemo, useState } from "react";

/* ========== Tiny icons (no external deps) ========== */
const IconHeart = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
    <path
      d="M12 21s-7.2-4.35-9.6-8.16C.86 9.5 2.38 6 5.42 6c1.74 0 3 .89 3.94 2.02C10.58 6.89 11.84 6 13.58 6 16.62 6 18.14 9.5 21.6 12.84 19.2 16.65 12 21 12 21z"
      fill="currentColor"
    />
  </svg>
);
const IconChevronLeft = () => <span aria-hidden>←</span>;
const IconChevronRight = () => <span aria-hidden>→</span>;

/* ========== Brand badge (thay logo để tránh hotlink) ========== */
/* Màu gần đúng: VietJet=red, VNA=teal, Thai=purple, AirAsia=crimson, AirCambodia=blue, Bangkok=royal, ChinaEastern=rose, Lao=amber */
type AirlineKey = "VJ" | "VN" | "TG" | "AK" | "QC" | "DD" | "MU" | "QV";
const BRAND: Record<
  AirlineKey,
  { name: string; bg: string; priceFrom: number }
> = {
  VJ: { name: "VietJet Air", bg: "bg-red-600", priceFrom: 3591050 },
  VN: { name: "Vietnam Airlines", bg: "bg-teal-700", priceFrom: 4490999 },
  TG: { name: "Thai Airways", bg: "bg-purple-700", priceFrom: 6394641 },
  AK: { name: "Thai AirAsia", bg: "bg-rose-600", priceFrom: 3591050 },
  QC: { name: "Air Cambodia", bg: "bg-blue-600", priceFrom: 8643000 },
  DD: { name: "Bangkok Airways", bg: "bg-indigo-600", priceFrom: 6550999 },
  MU: { name: "China Eastern", bg: "bg-rose-500", priceFrom: 11673602 },
  QV: { name: "Lao Airlines", bg: "bg-amber-600", priceFrom: 15075374 },
};
const BrandPill = ({ code }: { code: AirlineKey }) => (
  <span className="inline-flex items-center gap-2">
    <span
      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white ${BRAND[code].bg}`}
      title={BRAND[code].name}
    >
      {code}
    </span>
    <span className="text-sm text-slate-700">{BRAND[code].name}</span>
  </span>
);

/* ========== MOCK flights ========== */
type FlightItem = {
  id: string;
  airline: AirlineKey;
  depart: string; // "09:15"
  arrive: string; // "11:10"
  from: string; // "HAN"
  to: string; // "DMK"
  duration: string; // "1g 55"
  direct: boolean; // true = Trực tiếp
  returnDepart?: string;
  returnArrive?: string;
  returnDuration?: string;
  price: number; // VND
  optionsCount?: number;
};

const FLIGHTS: FlightItem[] = [
  {
    id: "f1",
    airline: "AK",
    depart: "09:15",
    arrive: "11:10",
    from: "HAN",
    to: "DMK",
    duration: "1g 55",
    direct: true,
    returnDepart: "18:30",
    returnArrive: "20:15",
    returnDuration: "1g 45",
    price: 3991050,
    optionsCount: 9,
  },
  {
    id: "f2",
    airline: "AK",
    depart: "20:50",
    arrive: "22:40",
    from: "HAN",
    to: "DMK",
    duration: "1g 50",
    direct: true,
    returnDepart: "18:30",
    returnArrive: "20:15",
    returnDuration: "1g 45",
    price: 3591050,
    optionsCount: 9,
  },
  {
    id: "f3",
    airline: "VN",
    depart: "18:55",
    arrive: "21:00",
    from: "HAN",
    to: "BKK",
    duration: "2g 05",
    direct: false,
    returnDepart: "22:10",
    returnArrive: "00:05+1",
    returnDuration: "1g 55",
    price: 4490999,
    optionsCount: 12,
  },
  {
    id: "f4",
    airline: "TG",
    depart: "10:35",
    arrive: "12:25",
    from: "HAN",
    to: "BKK",
    duration: "1g 50",
    direct: true,
    returnDepart: "17:30",
    returnArrive: "19:20",
    returnDuration: "1g 50",
    price: 6394641,
    optionsCount: 10,
  },
];

/* ========== Hotels & Cars mock ========== */
const HOTELS = [
  {
    id: "h1",
    name: "Livotel Hotel Kaset Nawamin Bangkok",
    rating: 4.4,
    votes: 13649,
    price: 619415,
    img: "https://plus.unsplash.com/premium_photo-1734607188791-8ec52c651ade?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=687",
  },
  {
    id: "h2",
    name: "Bangkok Marriott Marquis Queen’s Park",
    rating: 4.7,
    votes: 2544,
    price: 6269145,
    img: "https://images.unsplash.com/photo-1706576211922-7180daa672b5?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=735",
  },
  {
    id: "h3",
    name: "Livotel Hotel Lat Phrao Bangkok",
    rating: 4.2,
    votes: 6570,
    price: 474660,
    img: "https://images.unsplash.com/photo-1697535442452-d129a08bec70?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1074",
  },
];

const CAR_DEALS = [
  {
    id: "c1",
    name: "Trung bình",
    seats: 4,
    luggage: 3,
    doors: "4–5 cửa",
    img: "https://images.unsplash.com/photo-1668757223097-01644f23f034?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1175",
    price: 433415,
  },
  {
    id: "c2",
    name: "Nhỏ",
    seats: 4,
    luggage: 2,
    doors: "4–5 cửa",
    img: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170",
    price: 494221,
  },
  {
    id: "c3",
    name: "SUV",
    seats: 5,
    luggage: 3,
    doors: "4–5 cửa",
    img: "https://images.unsplash.com/photo-1506015391300-4802dc74de2e?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1259",
    price: 582044,
  },
];

/* ========== Small UI helpers ========== */
const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
    {children}
  </span>
);

/* ========== Search Bar (banner) ========== */
function SearchBar() {
  const [from, setFrom] = useState("Hà Nội (HAN)");
  const [to, setTo] = useState("Bangkok (BKK/DMK)");
  const [tripType, setTripType] = useState<"round" | "oneway">("round");

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <div className="w-full bg-[#0891b2]/10">
      <div className="container mx-auto px-4 py-5">
        {/* Toggle */}
        <div className="mb-3 flex items-center gap-2">
          {["round", "oneway"].map((t) => (
            <button
              key={t}
              onClick={() => setTripType(t as any)}
              className={`px-3 py-1.5 rounded-full text-sm ${
                tripType === t
                  ? "bg-[#0891b2] text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {t === "round" ? "Khứ hồi" : "Một chiều"}
            </button>
          ))}
        </div>

        <div className="grid gap-0 md:grid-cols-[1.2fr_auto_1.2fr_1fr_1fr_1.2fr_auto] rounded-xl overflow-hidden ring-1 ring-black/10 bg-white divide-y md:divide-y-0 md:divide-x divide-black/5">
          <div className="px-4 py-3">
            <div className="text-[11px] uppercase tracking-wide text-slate-600">
              Từ
            </div>
            <input
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 w-full bg-transparent outline-none border-0 px-0 py-2 focus:ring-0"
            />
          </div>

          <div className="flex items-end justify-center px-3 py-3">
            <button
              onClick={swap}
              className="mb-[2px] inline-flex h-10 w-10 items-center justify-center rounded-full border hover:bg-slate-50"
              title="Đổi chiều"
            >
              ↔
            </button>
          </div>

          <div className="px-4 py-3">
            <div className="text-[11px] uppercase tracking-wide text-slate-600">
              Đến
            </div>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 w-full bg-transparent outline-none border-0 px-0 py-2 focus:ring-0"
            />
          </div>

          <div className={`px-4 py-3 ${tripType === "oneway" ? "md:col-span-2" : ""}`}>
            <div className="text-[11px] uppercase tracking-wide text-slate-600">
              Ngày đi
            </div>
            <input
              type="date"
              className="mt-1 w-full bg-transparent outline-none border-0 px-0 py-2 focus:ring-0"
            />
          </div>

          {tripType === "round" && (
            <div className="px-4 py-3">
              <div className="text-[11px] uppercase tracking-wide text-slate-600">
                Ngày về
              </div>
              <input
                type="date"
                className="mt-1 w-full bg-transparent outline-none border-0 px-0 py-2 focus:ring-0"
              />
            </div>
          )}

          <div className="px-4 py-3">
            <div className="text-[11px] uppercase tracking-wide text-slate-600">
              Ngân sách (tối đa)
            </div>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={100000}
                placeholder="2,000,000"
                className="w-full bg-transparent outline-none border-0 px-0 py-2 focus:ring-0"
              />
              <select className="rounded-lg border px-2 py-2">
                <option>VND</option>
                <option>USD</option>
              </select>
            </div>
          </div>

          <div className="px-4 py-3 flex items-end justify-end">
            <button className="h-12 px-6 rounded-lg bg-[#0a6c86] text-white font-semibold hover:brightness-110">
              Tìm kiếm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========== FILTER SIDEBAR ========== */
function FilterSidebar() {
  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-4 md:p-5">
      {/* Hành lý */}
      <div>
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-slate-900">Hành lý</h4>
        </div>
        <div className="mt-2 text-sm">
          <button className="text-blue-600 text-xs mr-2">Chọn tất cả</button>
          <button className="text-slate-500 text-xs">Xóa tất cả</button>
          <div className="mt-3 space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" /> Hành lý xách tay
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" /> Hành lý ký gửi
            </label>
          </div>
        </div>
      </div>

      {/* Giờ khởi hành */}
      <div className="mt-6 border-t border-slate-200/60 pt-4">
        <h4 className="font-semibold text-slate-900">Giờ khởi hành</h4>
        <div className="mt-3">
          <div className="text-sm text-slate-700">Chuyến đi</div>
          <div className="text-xs text-slate-500">00:00 – 23:59</div>
          <input type="range" className="w-full" />
        </div>
        <div className="mt-4">
          <div className="text-sm text-slate-700">Quay về</div>
          <div className="text-xs text-slate-500">00:00 – 23:59</div>
          <input type="range" className="w-full" />
        </div>
      </div>

      {/* Thời gian kéo dài */}
      <div className="mt-6 border-t border-slate-200/60 pt-4">
        <h4 className="font-semibold text-slate-900">Thời gian kéo dài của hành trình</h4>
        <div className="text-xs text-slate-500">2,0 giờ – 26,0 giờ</div>
        <input type="range" className="w-full mt-2" />
      </div>

      {/* Hãng hàng không */}
      <div className="mt-6 border-t border-slate-200/60 pt-4">
        <h4 className="font-semibold text-slate-900">Hãng hàng không</h4>
        <div className="mt-2 flex gap-2">
          <button className="rounded-full border px-3 py-1 text-xs">Star Alliance</button>
          <button className="rounded-full border px-3 py-1 text-xs">SkyTeam</button>
          <button className="rounded-full border px-3 py-1 text-xs">oneworld</button>
        </div>

        <div className="mt-3 space-y-3 text-sm">
          {(Object.keys(BRAND) as AirlineKey[]).map((code) => (
            <label key={code} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="accent-blue-600" />
                <BrandPill code={code} />
              </span>
              <span className="text-slate-500 text-xs">
                từ {BRAND[code].priceFrom.toLocaleString("vi-VN")} đ
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Các sân bay */}
      <div className="mt-6 border-t border-slate-200/60 pt-4">
        <h4 className="font-semibold text-slate-900">Các sân bay</h4>
        <label className="mt-2 inline-flex items-center gap-2 text-sm">
          <input type="checkbox" /> Bay đi bay về với <b>cùng</b> sân bay
        </label>
        <div className="mt-3 text-sm">
          <div className="text-slate-700 font-medium">Bangkok</div>
          <label className="mt-2 flex items-center gap-2">
            <input type="checkbox" defaultChecked className="accent-blue-600" />
            Bangkok Don Mueang <span className="text-slate-500">DMK</span>
          </label>
          <label className="mt-2 flex items-center gap-2">
            <input type="checkbox" defaultChecked className="accent-blue-600" />
            Bangkok Suvarnabhumi <span className="text-slate-500">BKK</span>
          </label>
        </div>
      </div>

      {/* CO2 */}
      <div className="mt-6 border-t border-slate-200/60 pt-4">
        <h4 className="font-semibold text-slate-900">Lượng khí thải của chuyến bay</h4>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input type="checkbox" className="accent-blue-600" /> Chỉ hiển thị các chuyến bay phát thải ít CO₂e hơn
        </label>
      </div>
    </aside>
  );
}

/* ========== RESULT CARD ========== */
function FlightCard({ f }: { f: FlightItem }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_220px]">
        {/* left side times */}
        <div className="p-4 md:p-5 flex flex-col gap-4">
          {/* row 1 (outbound) */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <BrandPill code={f.airline} />
            <div className="grid grid-cols-[auto_auto_auto] items-center gap-3">
              <div className="text-xl font-semibold">{f.depart}</div>
              <div className="text-xs text-slate-500">
                <div className="whitespace-nowrap text-center">
                  <span className="text-slate-700">{f.duration}</span>
                </div>
                <div className="text-center text-blue-600 mt-0.5">
                  {f.direct ? "Trực tiếp" : "1 điểm dừng"}
                </div>
              </div>
              <div className="text-xl font-semibold">{f.arrive}</div>
            </div>
            <div className="text-slate-600 text-sm">{f.from}</div>
            <div />
            <div className="text-slate-600 text-sm">{f.to}</div>
          </div>

          {/* row 2 (return) */}
          {f.returnDepart && (
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
              <BrandPill code={f.airline} />
              <div className="grid grid-cols-[auto_auto_auto] items-center gap-3">
                <div className="text-xl font-semibold">{f.returnDepart}</div>
                <div className="text-xs text-slate-500">
                  <div className="whitespace-nowrap text-center">
                    <span className="text-slate-700">{f.returnDuration}</span>
                  </div>
                  <div className="text-center text-blue-600 mt-0.5">
                    {f.direct ? "Trực tiếp" : "1 điểm dừng"}
                  </div>
                </div>
                <div className="text-xl font-semibold">{f.returnArrive}</div>
              </div>
              <div className="text-slate-600 text-sm">{f.to}</div>
              <div />
              <div className="text-slate-600 text-sm">{f.from}</div>
            </div>
          )}
        </div>

        {/* right price/cta */}
        <div className="p-4 md:p-5 border-t md:border-t-0 md:border-l border-slate-200 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <button className="p-1.5 rounded-full hover:bg-slate-100">
              <IconHeart className="text-slate-600" />
            </button>
            <div className="text-right">
              <div className="text-slate-500 text-xs">
                {f.optionsCount ?? 5} tùy chọn từ
              </div>
              <div className="text-2xl font-extrabold">
                {f.price.toLocaleString("vi-VN")} đ
              </div>
            </div>
          </div>
          <button className="mt-3 h-10 rounded-lg bg-slate-900 text-white font-semibold hover:brightness-110">
            Chọn →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========== HOTELS section ========== */
function HotelsSection() {
  return (
    <section className="mt-10">
      <h3 className="text-xl font-semibold">Ưu đãi khách sạn tại Bangkok</h3>
      <div className="mt-4 space-y-3">
        {HOTELS.map((h) => (
          <div
            key={h.id}
            className="rounded-xl border border-slate-200 bg-white overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-[260px_1fr_220px]">
              <img
                src={h.img}
                alt={h.name}
                className="w-full h-44 md:h-36 object-cover"
              />
              <div className="p-4">
                <div className="text-lg font-semibold">{h.name}</div>
                <div className="mt-1 flex items-center gap-3 text-sm">
                  <div className="text-amber-500">★★★★★</div>
                  <div className="text-slate-600">
                    <b>{h.rating}</b>/5 <span className="text-slate-400">Rất tốt</span>{" "}
                    <span className="text-slate-400">{h.votes.toLocaleString("vi-VN")} phiếu bình</span>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t md:border-t-0 md:border-l border-slate-200 flex flex-col items-end justify-between">
                <div className="text-right">
                  <div className="text-2xl font-extrabold">
                    {h.price.toLocaleString("vi-VN")} đ
                  </div>
                  <div className="text-xs text-slate-500">một đêm</div>
                </div>
                <button className="h-10 px-5 rounded-lg bg-slate-900 text-white font-semibold hover:brightness-110">
                  Xem chi tiết
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-3 w-full h-11 rounded-lg bg-slate-100 text-slate-900 font-medium hover:bg-slate-200">
        Khám phá các khách sạn
      </button>
    </section>
  );
}

/* ========== CARS section ========== */
function CarsSection() {
  return (
    <section className="mt-10">
      <h3 className="text-xl font-semibold">Dịch vụ cho thuê xe ô tô tại Bangkok</h3>
      <div className="mt-4 space-y-3">
        {CAR_DEALS.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-slate-200 bg-white overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-[260px_1fr_220px]">
              <div className="p-4 flex items-center justify-center bg-slate-50">
                <img
                  src={c.img}
                  alt={c.name}
                  className="w-full h-28 object-contain"
                />
              </div>
              <div className="p-4">
                <div className="text-lg font-semibold">{c.name}</div>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <Pill>👤 {c.seats}</Pill>
                  <Pill>🧳 {c.luggage}</Pill>
                  <Pill>{c.doors}</Pill>
                </div>
              </div>
              <div className="p-4 border-t md:border-t-0 md:border-l border-slate-200 flex flex-col items-end justify-between">
                <div className="text-right">
                  <div className="text-2xl font-extrabold">
                    {c.price.toLocaleString("vi-VN")} đ
                  </div>
                  <div className="text-xs text-slate-500">trên ngày</div>
                </div>
                <button className="h-10 px-5 rounded-lg bg-slate-900 text-white font-semibold hover:brightness-110">
                  Xem các ưu đãi
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-3 w-full h-11 rounded-lg bg-slate-100 text-slate-900 font-medium hover:bg-slate-200">
        Tìm xe
      </button>
    </section>
  );
}

/* ========== PAGE ========== */
export default function FlightsResultPage() {
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const totalPages = 9;

  const flightsSlice = useMemo(
    () => FLIGHTS.slice((page - 1) * pageSize, page * pageSize),
    [page]
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <SearchBar />

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-12 lg:col-span-3">
            <div className="sticky top-24">
              <FilterSidebar />
            </div>
          </div>

          {/* Results */}
          <div className="col-span-12 lg:col-span-9">
            {/* summary header */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-stretch overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="px-4 py-2 bg-slate-900 text-white rounded-l-xl">
                  <div className="text-xs">Tốt nhất</div>
                  <div className="text-base font-bold">
                    3.991.050 đ
                  </div>
                  <div className="text-[11px] opacity-80">Trung bình 1g 50</div>
                </div>
                <div className="px-4 py-2">
                  <div className="text-xs text-slate-600">Rẻ nhất</div>
                  <div className="text-base font-bold">3.591.050 đ</div>
                  <div className="text-[11px] text-slate-500">Trung bình 1g 48</div>
                </div>
                <div className="px-4 py-2">
                  <div className="text-xs text-slate-600">Nhanh nhất</div>
                  <div className="text-base font-bold">3.591.050 đ</div>
                  <div className="text-[11px] text-slate-500">Trung bình 1g 48</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Sắp xếp</span>
                <select className="rounded-md border px-3 py-2 text-sm bg-white">
                  <option>Khuyến nghị</option>
                  <option>Giá tăng dần</option>
                  <option>Giá giảm dần</option>
                  <option>Thời gian ngắn nhất</option>
                </select>
              </div>
            </div>

            {/* list */}
            <div className="space-y-4">
              {flightsSlice.map((f) => (
                <FlightCard key={f.id} f={f} />
              ))}
            </div>

            {/* pagination */}
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm disabled:opacity-40"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <IconChevronLeft /> Trước
              </button>
              {Array.from({ length: 6 }).map((_, i) => {
                const n = i + 1;
                return (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`h-9 w-9 rounded-md border text-sm ${
                      page === n
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white"
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
              <span className="px-2 text-slate-500">…</span>
              <button
                onClick={() => setPage(totalPages)}
                className={`h-9 w-9 rounded-md border text-sm ${
                  page === totalPages
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white"
                }`}
              >
                {totalPages}
              </button>
              <button
                className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm disabled:opacity-40"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Sau <IconChevronRight />
              </button>
            </div>

            {/* Hotels + Cars */}
            <HotelsSection />
            <CarsSection />
          </div>
        </div>
      </div>
    </main>
  );
}
