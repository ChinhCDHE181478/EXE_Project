"use client";

import { useEffect, useState } from "react";

export type SearchCardValue = {
  q: string;
  checkIn?: string;
  checkOut?: string;
  adults: number;
  rooms: number;
};

export default function HotelSearchCard({
  value,
  onSearch,
}: {
  value: SearchCardValue;
  onSearch: (patch: Partial<any>) => void;
}) {
  const [q, setQ] = useState(value.q);
  const [checkIn, setCheckIn] = useState(value.checkIn ?? "");
  const [checkOut, setCheckOut] = useState(value.checkOut ?? "");
  const [guestRoom, setGuestRoom] = useState(`${value.adults}adults_${value.rooms}room`);

  // sync khi vào page mới / back forward
  useEffect(() => {
    setQ(value.q);
    setCheckIn(value.checkIn ?? "");
    setCheckOut(value.checkOut ?? "");
    setGuestRoom(`${value.adults}adults_${value.rooms}room`);
  }, [value.q, value.checkIn, value.checkOut, value.adults, value.rooms]);

  const handleSearch = () => {
    const keyword = q.trim();
    if (!keyword) return;

    const [adultsStr, roomsStr] = guestRoom.split("_");
    const adults = Number(adultsStr.replace("adults", "")) || 2;
    const rooms = Number(roomsStr.replace("room", "")) || 1;

    onSearch({
      q: keyword,
      checkIn: checkIn || undefined,
      checkOut: checkOut || undefined,
      adults,
      rooms,
    });
  };

  return (
    <section className="bg-slate-100">
      <div className="container mx-auto px-4 py-6">
        <div className="mx-auto max-w-6xl rounded-2xl bg-white shadow-xl ring-1 ring-black/5 p-4">
          <div className="grid gap-0 md:grid-cols-[1.4fr_1fr_1fr_1.2fr_auto] rounded-xl overflow-hidden ring-1 ring-black/5 bg-white divide-y md:divide-y-0 md:divide-x divide-black/5">
            <div className="px-4 py-3">
              <label className="text-[11px] uppercase tracking-wide text-slate-600">
                Bạn muốn đi đâu?
              </label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                type="text"
                placeholder="Nhập điểm đến hoặc tên khách sạn"
                className="mt-1 w-full bg-transparent outline-none border-0 px-0 py-2 focus:ring-0 placeholder-slate-400"
              />
            </div>

            <div className="px-4 py-3">
              <label className="text-[11px] uppercase tracking-wide text-slate-600">
                Nhận phòng
              </label>
              <input
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                type="date"
                className="mt-1 w-full bg-transparent outline-none border-0 px-0 py-2 focus:ring-0"
              />
            </div>

            <div className="px-4 py-3">
              <label className="text-[11px] uppercase tracking-wide text-slate-600">
                Trả phòng
              </label>
              <input
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                type="date"
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
                <option value="2adults_1room" className="text-slate-900">
                  2 người lớn, 1 phòng
                </option>
                <option value="3adults_1room" className="text-slate-900">
                  3 người lớn, 1 phòng
                </option>
                <option value="2adults_2room" className="text-slate-900">
                  2 người lớn, 2 phòng
                </option>
              </select>
            </div>

            <div className="px-4 py-3 flex items-end justify-end">
              <button
                type="button"
                className="h-12 px-6 rounded-lg bg-[#0891b2] text-white font-semibold hover:brightness-110 disabled:opacity-50"
                disabled={!q.trim()}
                onClick={handleSearch}
              >
                Tìm kiếm
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
