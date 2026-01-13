"use client";
import { useState } from "react";

export default function BannerSection() {
  const [from, setFrom] = useState("Hà Nội (HAN)");
  const [to, setTo] = useState("TP.HCM (SGN)");
  const [tripType, setTripType] = useState<"round" | "oneway">("round");

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <section
      className="relative w-full"
      style={{
        backgroundImage:
          "url(https://img2.thuthuat123.com/uploads/2020/05/12/hinh-anh-canh-may-bay_111631657.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="bg-gradient-to-b from-black/40 via-black/25 to-white/70">
        <div className="container mx-auto px-4 py-20 md:py-28">
          {/* Title */}
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow">
              Khám phá thế giới cùng chúng tôi
            </h1>
            <p className="mt-3 text-white/95 text-lg">
              Tìm kiếm và so sánh hàng triệu chuyến bay, khách sạn và xe thuê
            </p>
          </div>

          {/* Search card */}
          <div className="mx-auto mt-8 max-w-6xl rounded-2xl bg-white shadow-xl ring-1 ring-black/5 p-4">
            {/* Toggle khứ hồi / một chiều */}
            <div className="flex items-center gap-2 pb-3">
              <button
                onClick={() => setTripType("round")}
                className={`px-3 py-1.5 rounded-full text-sm ${
                  tripType === "round"
                    ? "bg-[#0891b2] text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Khứ hồi
              </button>
              <button
                onClick={() => setTripType("oneway")}
                className={`px-3 py-1.5 rounded-full text-sm ${
                  tripType === "oneway"
                    ? "bg-[#0891b2] text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Một chiều
              </button>
            </div>

            {/* Input group: 7 cột cố định theo KHỨ HỒI */}
            <div
              className={`
                grid gap-0
                md:grid-cols-[1.2fr_auto_1.2fr_1fr_1fr_1.2fr_auto]
                rounded-xl overflow-hidden ring-1 ring-slate-200 bg-white
                divide-y md:divide-y-0 md:divide-x divide-slate-200
              `}
            >
              {/* Từ */}
              <div className="px-4 py-3">
                <label className="text-[11px] uppercase tracking-wide text-slate-600">
                  Từ
                </label>
                <input
                  className="mt-1 w-full bg-transparent outline-none border-0 px-0 py-2 focus:ring-0"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="Nhập nơi đi"
                />
              </div>

              {/* Nút đảo chiều */}
              <div className="flex items-end justify-center px-3 py-3">
                <button
                  onClick={swap}
                  className="mb-[2px] inline-flex h-10 w-10 items-center justify-center rounded-full border hover:bg-slate-50"
                  title="Đổi chiều"
                >
                  ↔
                </button>
              </div>

              {/* Đến */}
              <div className="px-4 py-3">
                <label className="text-[11px] uppercase tracking-wide text-slate-600">
                  Đến
                </label>
                <input
                  className="mt-1 w-full bg-transparent outline-none border-0 px-0 py-2 focus:ring-0"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="Nhập nơi đến"
                />
              </div>

              {/* Ngày đi (giãn ra 2 cột khi Một chiều để giữ tổng chiều ngang cố định) */}
              <div
                className={`px-4 py-3 ${
                  tripType === "oneway" ? "md:col-span-2" : ""
                }`}
              >
                <label className="text-[11px] uppercase tracking-wide text-slate-600">
                  Ngày đi
                </label>
                <input
                  type="date"
                  className="mt-1 w-full bg-transparent outline-none border-0 px-0 py-2 focus:ring-0"
                />
              </div>

              {/* Ngày về – ẩn khi Một chiều */}
              {tripType === "round" && (
                <div className="px-4 py-3">
                  <label className="text-[11px] uppercase tracking-wide text-slate-600">
                    Ngày về
                  </label>
                  <input
                    type="date"
                    className="mt-1 w-full bg-transparent outline-none border-0 px-0 py-2 focus:ring-0"
                  />
                </div>
              )}

              {/* Ngân sách */}
              <div className="px-4 py-3">
                <label className="text-[11px] uppercase tracking-wide text-slate-600">
                  Ngân sách (tối đa)
                </label>
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

              {/* Tìm kiếm */}
              <div className="px-4 py-3 flex items-end justify-end">
                <button
                  className="h-12 px-6 rounded-lg bg-[#0891b2] text-white font-semibold hover:brightness-110"
                  onClick={() => (window.location.href = "/pages/flights-result")}
                >
                  Tìm kiếm
                </button>
              </div>
            </div>
          </div>
          {/* /Search card */}
        </div>
      </div>
    </section>
  );
}
