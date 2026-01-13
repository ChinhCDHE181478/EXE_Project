// src/app/pages/cars-result/page.tsx
"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

/* ========== Icons nhỏ ========== */
const IconChevronLeft = () => <span aria-hidden>←</span>;
const IconChevronRight = () => <span aria-hidden>→</span>;
function IconHeart(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...props}>
      <path
        d="M12 21s-7.2-4.35-9.6-8.16C.86 9.5 2.38 6 5.42 6c1.74 0 3 .89 3.94 2.02C10.58 6.89 11.84 6 13.58 6 16.62 6 18.14 9.5 21.6 12.84 19.2 16.65 12 21 12 21z"
        fill="currentColor"
      />
    </svg>
  );
}

/* ========== Types ========== */
type CarItem = {
  id: string;
  name: string;
  seats: number;
  luggage: number;
  transmission: "Tự động" | "Số sàn";
  supplier: string;
  price: number;
  pickupNote?: string;
  img: string;
};

/* ========== Mock data ========== */
const MOCK_CARS: CarItem[] = [
  {
    id: "1",
    name: "Ford Fiesta",
    seats: 5,
    luggage: 2,
    transmission: "Tự động",
    supplier: "Trip.com",
    price: 1830199,
    pickupNote: "Nhận xe: Xe buýt nhanh (HND)",
    img: "https://images.unsplash.com/photo-1631831905906-d9c44601ec7f?auto=format&fit=crop&q=80&w=1170",
  },
  {
    id: "2",
    name: "Nissan Versa",
    seats: 5,
    luggage: 2,
    transmission: "Tự động",
    supplier: "Trip.com",
    price: 1830199,
    pickupNote: "Nhận xe: Xe buýt nhanh (HND)",
    img: "https://images.unsplash.com/photo-1652644827556-35ef6c3f9602?auto=format&fit=crop&q=80&w=1170",
  },
  {
    id: "3",
    name: "Honda Fit EV",
    seats: 4,
    luggage: 2,
    transmission: "Tự động",
    supplier: "Trip.com",
    price: 1830199,
    pickupNote: "Nhận xe: Xe buýt nhanh (HND)",
    img: "https://images.unsplash.com/photo-1540431657627-415fdd6c3cee?auto=format&fit=crop&q=80&w=1171",
  },
  {
    id: "4",
    name: "Nissan Pathfinder",
    seats: 7,
    luggage: 3,
    transmission: "Tự động",
    supplier: "Trip.com",
    price: 3591835,
    pickupNote: "Nhận xe: Xe buýt nhanh (HND)",
    img: "https://images.unsplash.com/photo-1549156512-41b188820ac5?auto=format&fit=crop&q=80&w=1260",
  },
  {
    id: "5",
    name: "Toyota Sienna",
    seats: 7,
    luggage: 3,
    transmission: "Tự động",
    supplier: "Trip.com",
    price: 3634691,
    pickupNote: "Ga (HND)",
    img: "https://images.unsplash.com/photo-1720545044233-d2ac77fa6030?auto=format&fit=crop&q=80&w=1074",
  },
  {
    id: "6",
    name: "Ford Transit Wagon 350",
    seats: 8,
    luggage: 3,
    transmission: "Tự động",
    supplier: "Klook",
    price: 2933681,
    pickupNote: "Huỷ miễn phí",
    img: "https://images.unsplash.com/photo-1757271035656-feb7bbb83a2f?auto=format&fit=crop&q=80&w=1779",
  },
  {
    id: "7",
    name: "Mazda 3",
    seats: 5,
    luggage: 2,
    transmission: "Tự động",
    supplier: "Nissan Rent a Car",
    price: 2793641,
    img: "https://images.unsplash.com/photo-1697491517940-19a9b3b3ba80?auto=format&fit=crop&q=80&w=1170",
  },
  {
    id: "8",
    name: "Suzuki Swift",
    seats: 5,
    luggage: 1,
    transmission: "Số sàn",
    supplier: "GALILEO",
    price: 1793031,
    img: "https://images.unsplash.com/photo-1692970060626-8e96d7ee70d2?auto=format&fit=crop&q=80&w=687",
  },
];

/* ========== Supplier badge ========== */
const SUPPLIER_LOGO: Record<string, string | undefined> = {
  "Trip.com": undefined,
  Klook: undefined,
  "Nissan Rent a Car": undefined,
  TravelCar: undefined,
  "JDM rent a car": undefined,
  GALILEO: undefined,
  "Miki Car Rental": undefined,
};

const SUPPLIER_META: Record<string, { abbr: string; bg: string }> = {
  "Trip.com": { abbr: "TR", bg: "bg-blue-600" },
  Klook: { abbr: "KL", bg: "bg-orange-500" },
  "Nissan Rent a Car": { abbr: "NR", bg: "bg-red-600" },
  TravelCar: { abbr: "TC", bg: "bg-emerald-600" },
  "JDM rent a car": { abbr: "JD", bg: "bg-amber-600" },
  GALILEO: { abbr: "GA", bg: "bg-cyan-700" },
  "Miki Car Rental": { abbr: "MK", bg: "bg-indigo-600" },
};

function SupplierBadge({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const logo = SUPPLIER_LOGO[name];
  const meta = SUPPLIER_META[name] ?? {
    abbr: name.slice(0, 2).toUpperCase(),
    bg: "bg-slate-500",
  };
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {logo ? (
        <img
          src={logo}
          alt={name}
          width={28}
          height={14}
          referrerPolicy="no-referrer"
          onError={(e) =>
            ((e.currentTarget as HTMLImageElement).style.display = "none")
          }
        />
      ) : (
        <span
          className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${meta.bg}`}
        >
          {meta.abbr}
        </span>
      )}
      <span className="text-xs text-slate-600">{name}</span>
    </span>
  );
}

function Pill({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 ${className}`}
    >
      {children}
    </span>
  );
}

/* ========== CarCard (định nghĩa rõ props) ========== */
type CarCardProps = { car: CarItem };
const CarCard: React.FC<CarCardProps> = ({ car }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr_260px]">
        {/* Ảnh */}
        <div className="p-0 flex items-center justify-center bg-slate-50">
          <img
            src={car.img}
            alt={car.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "/cars/placeholder.jpg";
            }}
            className="w-full h-56 md:h-48 object-cover"
          />
        </div>

        {/* Thông tin */}
        <div className="p-4 md:p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg md:text-xl font-semibold text-slate-900">
              {car.name}
            </h3>
            <button
              className="p-2 rounded-full hover:bg-slate-100"
              aria-label="Yêu thích"
            >
              <IconHeart className="w-5 h-5 text-slate-700" />
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Pill>
              <span className="font-semibold">{car.seats}</span> chỗ
            </Pill>
            <Pill>
              <span className="font-semibold">{car.luggage}</span> vali
            </Pill>
            <Pill>{car.transmission}</Pill>
            <Pill>★ 4.6</Pill>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <SupplierBadge name={car.supplier} />
          </div>
          {car.pickupNote && (
            <p className="mt-1 text-sm text-slate-600">{car.pickupNote}</p>
          )}
        </div>

        {/* Giá + CTA */}
        <div className="p-4 md:p-5 flex flex-col items-end justify-between border-t md:border-t-0 md:border-l border-slate-200">
          <div className="text-right">
            <div className="text-slate-500 text-sm">tổng cộng</div>
            <div className="text-[26px] leading-7 font-extrabold text-slate-900">
              {car.price.toLocaleString("vi-VN")} đ
            </div>
            <div className="mt-1 text-xs text-slate-500">Huỷ miễn phí</div>
          </div>
          <button className="mt-4 h-11 w-full md:w-auto px-6 rounded-lg bg-[#0a6c86] text-white font-semibold hover:brightness-110">
            Truy cập
          </button>
        </div>
      </div>
    </div>
  );
};

/* ========== Sidebar filter ========== */
function FilterSidebar() {
  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-4 md:p-5">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-slate-900">Đặt lại tất cả</h4>
      </div>

      <div className="mt-4 border-t border-slate-200/60 pt-4">
        <div className="text-sm font-medium text-slate-700">Chỗ ngồi</div>
        <div className="mt-3 flex gap-2">
          <button className="px-3 py-1.5 rounded-md border text-sm">4–5</button>
          <button className="px-3 py-1.5 rounded-md border text-sm">6+</button>
        </div>
      </div>

      <div className="mt-6 border-t border-slate-200/60 pt-4">
        <div className="text-sm font-medium text-slate-700">Hộp số</div>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input type="checkbox" className="accent-[#0a6c86]" /> Tự động
        </label>
      </div>

      <div className="mt-6 border-t border-slate-200/60 pt-4">
        <div className="text-sm font-medium text-slate-700">Nhận xe</div>
        <div className="mt-2 space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="accent-[#0a6c86]" /> Điểm cuối sân
            bay
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="accent-[#0a6c86]" /> Gặp gỡ và
            chào hỏi
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="accent-[#0a6c86]" /> Xe buýt tuyến
            ngắn miễn phí
          </label>
        </div>
      </div>

      <div className="mt-6 border-t border-slate-200/60 pt-4">
        <div className="text-sm font-medium text-slate-700">Giá</div>
        <div className="mt-3">
          <input type="range" min={1700000} max={3600000} className="w-full" />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <input
              className="rounded-md border px-2 py-1 text-sm"
              defaultValue="1 793 031"
            />
            <input
              className="rounded-md border px-2 py-1 text-sm"
              defaultValue="3 572 842"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-slate-200/60 pt-4">
        <div className="text-sm font-medium text-slate-700">Chính sách</div>
        <div className="mt-2 space-y-3 text-sm">
          {[
            [
              "Số dặm không hạn chế",
              "Không tính thêm phí nếu bạn vượt quá quãng đường cho phép.",
            ],
            [
              "Huỷ miễn phí",
              "Huỷ miễn phí chậm nhất 48 giờ trước giờ nhận xe.",
            ],
            ["Thanh toán khi đến", "Thanh toán tại quầy khi lấy chìa khóa xe."],
            [
              "Chính sách xăng hợp lý",
              "Nhận và trả xe với lượng nhiên liệu như nhau.",
            ],
          ].map(([title, desc]) => (
            <div key={title as string}>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-[#0a6c86]" /> {title}
              </label>
              <p className="ml-7 mt-1 text-xs text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 border-t border-slate-200/60 pt-4">
        <div className="text-sm font-medium text-slate-700">Nhà cung cấp</div>
        <div className="mt-3 space-y-3 text-sm">
          {[
            "Nissan Rent a Car",
            "TravelCar",
            "JDM rent a car",
            "GALILEO",
            "Miki Car Rental",
          ].map((s) => (
            <label key={s} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <input type="checkbox" className="accent-[#0a6c86]" /> {s}
              </span>
              <SupplierBadge name={s} />
            </label>
          ))}
        </div>
        <button className="mt-3 text-xs text-slate-600 underline">
          Xem tất cả nhà cung cấp
        </button>
      </div>
    </aside>
  );
}

/* ========== Phần có useSearchParams — bọc trong Suspense ========== */
function CarsResultInner() {
  const router = useRouter();
  const sp = useSearchParams();

  const q = useMemo(
    () => ({
      pickup: sp.get("pickup") || "",
      pickDate: sp.get("pickDate") || "",
      pickTime: sp.get("pickTime") || "10:00",
      dropDate: sp.get("dropDate") || "",
      dropTime: sp.get("dropTime") || "10:00",
      driver2570: sp.get("driver2570") === "true",
      diffDrop: sp.get("diffDrop") === "true",
    }),
    [sp]
  );

  const [pickup, setPickup] = useState(q.pickup);
  const [pickDate, setPickDate] = useState(q.pickDate);
  const [pickTime, setPickTime] = useState(q.pickTime);
  const [dropDate, setDropDate] = useState(q.dropDate);
  const [dropTime, setDropTime] = useState(q.dropTime);
  const [driver2570, setDriver2570] = useState(q.driver2570);
  const [diffDrop, setDiffDrop] = useState(q.diffDrop);

  const reSearch = () => {
    const qs = new URLSearchParams({
      pickup,
      pickDate,
      pickTime,
      dropDate,
      dropTime,
      driver2570: String(driver2570),
      diffDrop: String(diffDrop),
    }).toString();
    router.replace(`/pages/cars-result?${qs}`);
  };

  // Phân trang (mock)
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const totalPages = 9;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Search bar nền xanh nhạt */}
      <div className="w-full bg-[#0891b2]/10">
        <div className="container mx-auto px-4 py-5">
          <div className="grid gap-0 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto] rounded-xl overflow-hidden ring-1 ring-black/10 bg-white divide-y md:divide-y-0 md:divide-x divide-black/5">
            <div className="px-4 py-3">
              <div className="text-[11px] uppercase tracking-wide text-slate-600">
                Địa điểm nhận xe
              </div>
              <input
                type="text"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="mt-1 w-full bg-transparent outline-none border-0 px-0 py-2 focus:ring-0 placeholder-slate-400"
                placeholder="TP, sân bay hoặc nhà ga"
              />
            </div>
            <div className="px-4 py-3">
              <div className="text-[11px] uppercase tracking-wide text-slate-600">
                Ngày nhận xe
              </div>
              <input
                type="date"
                value={pickDate}
                onChange={(e) => setPickDate(e.target.value)}
                className="mt-1 w-full bg-transparent outline-none border-0 px-0 py-2 focus:ring-0"
              />
            </div>
            <div className="px-4 py-3">
              <div className="text-[11px] uppercase tracking-wide text-slate-600">
                Thời gian
              </div>
              <input
                type="time"
                value={pickTime}
                onChange={(e) => setPickTime(e.target.value)}
                className="mt-1 w-full bg-transparent outline-none border-0 px-0 py-2 focus:ring-0"
              />
            </div>
            <div className="px-4 py-3">
              <div className="text-[11px] uppercase tracking-wide text-slate-600">
                Ngày trả xe
              </div>
              <input
                type="date"
                value={dropDate}
                onChange={(e) => setDropDate(e.target.value)}
                className="mt-1 w-full bg-transparent outline-none border-0 px-0 py-2 focus:ring-0"
              />
            </div>
            <div className="px-4 py-3">
              <div className="text-[11px] uppercase tracking-wide text-slate-600">
                Thời gian
              </div>
              <input
                type="time"
                value={dropTime}
                onChange={(e) => setDropTime(e.target.value)}
                className="mt-1 w-full bg-transparent outline-none border-0 px-0 py-2 focus:ring-0"
              />
            </div>
            <div className="px-4 py-3 flex items-end justify-end">
              <button
                onClick={reSearch}
                className="h-11 px-6 rounded-lg bg-[#0a6c86] text-white font-semibold hover:brightness-110"
              >
                Tìm kiếm
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-6 text-sm text-slate-800">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="accent-[#0a6c86]"
                checked={driver2570}
                onChange={(e) => setDriver2570(e.target.checked)}
              />
              Người lái xe tuổi từ 25 – 70
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="accent-[#0a6c86]"
                checked={diffDrop}
                onChange={(e) => setDiffDrop(e.target.checked)}
              />
              Trả xe ở địa điểm khác
            </label>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Filter */}
          <div className="col-span-12 lg:col-span-3">
            <div className="sticky top-24">
              <FilterSidebar />
            </div>
          </div>

          {/* List */}
          <div className="col-span-12 lg:col-span-9">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-slate-700">
                <span className="font-medium text-slate-900">
                  {MOCK_CARS.length}
                </span>{" "}
                kết quả được sắp xếp theo thứ tự đề xuất
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Sắp xếp theo</span>
                <select className="rounded-md border px-3 py-2 text-sm">
                  <option>Khuyến nghị</option>
                  <option>Giá tăng dần</option>
                  <option>Giá giảm dần</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {MOCK_CARS.slice((page - 1) * pageSize, page * pageSize).map(
                (car: CarItem) => (
                  <CarCard key={car.id} car={car} />
                )
              )}
            </div>

            {/* Pagination */}
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
                const active = page === n;
                return (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`h-9 w-9 rounded-md border text-sm ${
                      active
                        ? "bg-[#0a6c86] text-white border-[#0a6c86]"
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
                    ? "bg-[#0a6c86] text-white border-[#0a6c86]"
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
          </div>
        </div>
      </div>
    </main>
  );
}

/* ========== Wrapper có Suspense (để build không báo thiếu boundary) ========== */
export default function Page() {
  return (
    <Suspense
      fallback={<div className="p-6 text-slate-600">Đang tải kết quả…</div>}
    >
      <CarsResultInner />
    </Suspense>
  );
}
