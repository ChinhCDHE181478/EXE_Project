"use client";

/* ====== STATIC ASSETS ====== */
const BANNER_CARS =
  "https://images.unsplash.com/photo-1602546660809-077fa7a5576a?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070";

/* ====== BANNER ====== */
export default function CarBanner() {
  return (
    <section
      className="relative w-full"
      style={{
        backgroundImage: `url("${BANNER_CARS}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="bg-gradient-to-b from-black/45 via-black/30 to-white/70">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow">
              Tìm ưu đãi thuê ô tô tốt nhất
            </h1>
            <p className="mt-3 text-white/95 text-lg">
              So sánh giá từ hàng trăm đại lý và đặt xe chỉ trong vài bước
            </p>
          </div>

          {/* Search card */}
          <div className="mx-auto mt-8 max-w-6xl rounded-2xl bg-white shadow-xl ring-1 ring-black/5 p-4">
            <div className="grid gap-0 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto] rounded-xl overflow-hidden ring-1 ring-black/5 bg-white divide-y md:divide-y-0 md:divide-x divide-black/5">
              <div className="px-4 py-3">
                <label className="text-[11px] uppercase tracking-wide text-slate-600">
                  Địa điểm nhận xe
                </label>
                <input
                  type="text"
                  placeholder="Thành phố, sân bay hoặc nhà ga"
                  className="mt-1 w-full bg-transparent outline-none border-0 px-0 py-2 focus:ring-0 placeholder-slate-400"
                />
              </div>
              <div className="px-4 py-3">
                <label className="text-[11px] uppercase tracking-wide text-slate-600">
                  Ngày nhận xe
                </label>
                <input
                  type="date"
                  className="mt-1 w-full bg-transparent outline-none border-0 px-0 py-2 focus:ring-0"
                />
              </div>
              <div className="px-4 py-3">
                <label className="text-[11px] uppercase tracking-wide text-slate-600">
                  Thời gian
                </label>
                <input
                  type="time"
                  defaultValue="10:00"
                  className="mt-1 w-full bg-transparent outline-none border-0 px-0 py-2 focus:ring-0"
                />
              </div>
              <div className="px-4 py-3">
                <label className="text-[11px] uppercase tracking-wide text-slate-600">
                  Ngày trả xe
                </label>
                <input
                  type="date"
                  className="mt-1 w-full bg-transparent outline-none border-0 px-0 py-2 focus:ring-0"
                />
              </div>
              <div className="px-4 py-3">
                <label className="text-[11px] uppercase tracking-wide text-slate-600">
                  Thời gian
                </label>
                <input
                  type="time"
                  defaultValue="10:00"
                  className="mt-1 w-full bg-transparent outline-none border-0 px-0 py-2 focus:ring-0"
                />
              </div>
              <div className="px-4 py-3 flex items-end justify-end">
                <button
                  className="h-12 px-6 rounded-lg bg-[#0891b2] text-white font-semibold hover:brightness-110"
                  onClick={() => (window.location.href = "/pages/cars-result")}
                >
                  Tìm kiếm
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-6 text-sm text-slate-700">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-[#0891b2]"
                  defaultChecked
                />
                Người lái xe tuổi từ 25 - 70
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-[#0891b2]" />
                Trả xe ở địa điểm khác
              </label>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
