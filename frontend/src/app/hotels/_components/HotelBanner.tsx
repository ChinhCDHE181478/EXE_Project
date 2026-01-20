"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { hotelService } from "@/lib/services/hotel";

const BANNER_HOTELS =
  "https://images.unsplash.com/photo-1651376589881-0e5a7eb15ae4?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070";

type Dest = {
  id?: string;
  name?: string;
  city?: string;
  label?: string;
  lat?: number;
  lng?: number;
};

export default function HotelBanner() {
  const router = useRouter();

  const [q, setQ] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guestRoom, setGuestRoom] = useState("2adults_1room");

  const [suggest, setSuggest] = useState<Dest[]>([]);
  const [open, setOpen] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const pickedRef = useRef<Dest | null>(null);

  // debounce gợi ý
  useEffect(() => {
    const t = q.trim();
    pickedRef.current = null; // nếu user gõ lại -> bỏ selection cũ

    if (t.length < 2) {
      setSuggest([]);
      setOpen(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setLoadingSuggest(true);
      try {
        const data = await hotelService.searchDestination(t);

        // data có thể là array hoặc {items: []}. Bạn tùy backend chỉnh.
        const items: Dest[] = Array.isArray(data) ? data : data?.items || [];
        setSuggest(items);
        setOpen(true);
      } catch {
        setSuggest([]);
        setOpen(false);
      } finally {
        setLoadingSuggest(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [q]);

  const canSearch = useMemo(() => q.trim().length > 0, [q]);

  const onPick = (d: Dest) => {
    const label = d.name || d.label || d.city || "";
    setQ(label);
    pickedRef.current = d;
    setOpen(false);
  };

  const onSearch = () => {
    const keyword = q.trim();
    if (!keyword) return;

    // parse guests/rooms
    const [adultsStr, roomsStr] = guestRoom.split("_");
    const adults = Number(adultsStr.replace("adults", "")) || 2;
    const rooms = Number(roomsStr.replace("room", "")) || 1;

    // query params đưa sang trang hotel-results (match BE)
    const params = new URLSearchParams();
    params.set("destination", keyword);
    if (checkIn) params.set("arrivalDate", checkIn);
    if (checkOut) params.set("departureDate", checkOut);
    params.set("adults", String(adults));
    params.set("roomQty", String(rooms));

    // Nếu có tọa độ từ gợi ý, gắn vào để dùng /hotel/search-by-coordinate
    if (pickedRef.current?.lat && pickedRef.current?.lng) {
      params.set("latitude", String(pickedRef.current.lat));
      params.set("longitude", String(pickedRef.current.lng));
    }

    // App Router route
    router.push(`/hotel-results?${params.toString()}`);
  };

  return (
    <section
      className="relative w-full"
      style={{
        backgroundImage: `url("${BANNER_HOTELS}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="bg-gradient-to-b from-black/35 via-black/25 to-white/70">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white drop-shadow">
              Tìm khách sạn phù hợp ngay hôm nay
            </h1>
            <p className="mt-3 text-white/95 text-lg">
              So sánh giá từ hàng trăm đối tác và đặt phòng chỉ trong vài bước
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-6xl rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl ring-1 ring-black/5 p-4">
            <div className="grid gap-0 md:grid-cols-[1.4fr_1fr_1fr_1.2fr_auto] rounded-xl overflow-hidden ring-1 ring-black/5 bg-white divide-y md:divide-y-0 md:divide-x divide-black/5">
              {/* Destination + suggest */}
              <div className="px-4 py-3 relative">
                <label className="text-[11px] uppercase tracking-wide text-slate-600">
                  Bạn muốn đi đâu?
                </label>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onFocus={() => suggest.length && setOpen(true)}
                  placeholder="Nhập điểm đến hoặc tên khách sạn"
                  className="mt-1 w-full bg-transparent outline-none border-0 px-0 py-2 focus:ring-0 placeholder-slate-400"
                />

                {/* dropdown */}
                {open && (
                  <div className="absolute left-3 right-3 top-[74px] z-20 rounded-xl bg-white shadow-lg ring-1 ring-black/10 overflow-hidden">
                    <div className="max-h-64 overflow-auto">
                      {loadingSuggest && (
                        <div className="px-3 py-2 text-sm text-slate-500">
                          Đang tìm…
                        </div>
                      )}

                      {!loadingSuggest && suggest.length === 0 && (
                        <div className="px-3 py-2 text-sm text-slate-500">
                          Không có gợi ý
                        </div>
                      )}

                      {!loadingSuggest &&
                        suggest.map((d, i) => {
                          const label =
                            d.name || d.label || d.city || "Destination";
                          return (
                            <button
                              key={d.id ? String(d.id) : `${label}-${i}`}
                              type="button"
                              onClick={() => onPick(d)}
                              className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm"
                            >
                              {label}
                            </button>
                          );
                        })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="w-full border-t px-3 py-2 text-sm text-slate-500 hover:bg-slate-50"
                    >
                      Đóng
                    </button>
                  </div>
                )}
              </div>

              <div className="px-4 py-3">
                <label className="text-[11px] uppercase tracking-wide text-slate-600">
                  Nhận phòng
                </label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="mt-1 w-full bg-transparent outline-none border-0 px-0 py-2 focus:ring-0"
                />
              </div>

              <div className="px-4 py-3">
                <label className="text-[11px] uppercase tracking-wide text-slate-600">
                  Trả phòng
                </label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="mt-1 w-full bg-transparent outline-none border-0 px-0 py-2 focus:ring-0"
                />
              </div>

              <div className="px-4 py-3">
                <label className="text-[11px] uppercase tracking-wide text-slate-600">
                  Khách & phòng
                </label>
                <select
                  value={guestRoom}
                  onChange={(e) => setGuestRoom(e.target.value)}
                  className="mt-1 w-full bg-transparent outline-none border-0 px-0 py-2 focus:ring-0"
                >
                  <option value="2adults_1room">2 người lớn, 1 phòng</option>
                  <option value="3adults_1room">3 người lớn, 1 phòng</option>
                  <option value="2adults_2room">2 người lớn, 2 phòng</option>
                </select>
              </div>

              <div className="px-4 py-3 flex items-end justify-end">
                <button
                  type="button"
                  disabled={!canSearch}
                  className="h-12 px-6 rounded-lg bg-[#0891b2] text-white font-semibold hover:brightness-110 disabled:opacity-50"
                  onClick={onSearch}
                >
                  Tìm kiếm
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-6 text-sm text-slate-700">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-[#0891b2]" />
                Huỷ miễn phí
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-[#0891b2]" />4 sao +
              </label>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
