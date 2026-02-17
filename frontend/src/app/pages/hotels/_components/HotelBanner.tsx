"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { hotelService } from "@/lib/services/hotel";

// --- SVG Icons ---
const SearchIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
);
const BuildingIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" /></svg>
);
const PlaneIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 12h20" /><path d="M13 2l9 10-9 10" /><path d="M2 12l5-5m0 10l-5-5" /></svg>
);
const MapPinIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
);
const CalendarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
);
const UserIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);

const BANNER_HOTELS =
  "https://images.unsplash.com/photo-1651376589881-0e5a7eb15ae4?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070";

type Dest = {
  id?: string;
  name?: string;
  city?: string;
  label?: string;
  type?: string;
  latitude?: number;
  longitude?: number;
};

// --- Helper Components ---
const Counter = ({ label, sub, value, onChange, min = 0 }: any) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
    <div>
      <div className="text-sm font-bold text-slate-800">{label}</div>
      {sub && <div className="text-[11px] text-slate-500">{sub}</div>}
    </div>
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-full text-slate-600 hover:border-blue-500 hover:text-blue-500 transition-colors disabled:opacity-30"
        disabled={value <= min}
      >
        -
      </button>
      <span className="w-6 text-center text-sm font-bold text-slate-800">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-full text-slate-600 hover:border-blue-500 hover:text-blue-500 transition-colors"
      >
        +
      </button>
    </div>
  </div>
);

// Format Date YYYY-MM-DD
function formatDateDisplay(isoDate: string): string {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

export default function HotelBanner() {
  const router = useRouter();

  // State Search
  const [q, setQ] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  // State Guests & Rooms
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);

  // State UI
  const [suggest, setSuggest] = useState<Dest[]>([]);
  const [openSuggest, setOpenSuggest] = useState(false);
  const [openGuest, setOpenGuest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  // Refs
  const pickedRef = useRef<Dest | null>(null);
  const suggestRef = useRef<HTMLDivElement>(null);
  const guestRef = useRef<HTMLDivElement>(null);
  const checkInRef = useRef<HTMLInputElement>(null);
  const checkOutRef = useRef<HTMLInputElement>(null);

  // Click outside to close popups
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestRef.current && !suggestRef.current.contains(event.target as Node)) {
        setOpenSuggest(false);
      }
      if (guestRef.current && !guestRef.current.contains(event.target as Node)) {
        setOpenGuest(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce Search Destination
  useEffect(() => {
    const t = q.trim();
    if (t.length < 2) {
      setSuggest([]);
      return;
    }
    // Nếu user gõ text khác với item đã chọn -> reset selection
    if (pickedRef.current && (pickedRef.current.name !== t && pickedRef.current.label !== t)) {
      pickedRef.current = null;
    }

    const timer = window.setTimeout(async () => {
      setLoadingSuggest(true);
      try {
        const data = await hotelService.searchListDestination(t);
        const items: Dest[] = Array.isArray(data) ? data : data?.items || [];
        setSuggest(items);
        setOpenSuggest(true);
      } catch {
        setSuggest([]);
      } finally {
        setLoadingSuggest(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [q]);

  const onPickDest = (d: Dest) => {
    const displayText = d.name || d.label || "";
    setQ(displayText);
    pickedRef.current = d;
    setOpenSuggest(false);
  };

  const onSearch = () => {
    const keyword = q.trim();
    const params = new URLSearchParams();
    params.set("destination", keyword);
    if (checkIn) params.set("arrivalDate", checkIn);
    if (checkOut) params.set("departureDate", checkOut);
    params.set("adults", String(adults));
    params.set("children", String(children));
    params.set("roomQty", String(rooms));

    // Nếu có tọa độ từ gợi ý
    const pickedLat = pickedRef.current?.latitude;
    const pickedLng = pickedRef.current?.longitude;
    if (pickedLat != null && pickedLng != null) {
      params.set("latitude", String(pickedLat));
      params.set("longitude", String(pickedLng));
    }

    router.push(`/pages/hotel-results?${params.toString()}`);
  };

  // Xác định icon và loại cho Dropdown
  const getDestIcon = (type?: string) => {
    const t = type?.toUpperCase();
    if (t === "AIRPORT") return <PlaneIcon className="w-5 h-5" />;
    if (t === "CITY") return <BuildingIcon className="w-5 h-5" />;
    return <MapPinIcon className="w-5 h-5" />;
  };

  const getDestLabel = (type?: string) => {
    const t = type?.toUpperCase();
    if (t === "AIRPORT") return "sân bay";
    if (t === "CITY") return "thành phố";
    return "địa điểm";
  };

  return (
    <section
      className="relative w-full font-sans"
      style={{
        backgroundImage: `url("${BANNER_HOTELS}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="bg-gradient-to-b from-black/50 via-black/30 to-black/10">
        <div className="container mx-auto px-4 py-20 md:py-32">

          <div className="text-center mb-8 font-sans">
            {/* --- ĐÂY LÀ PHẦN TIÊU ĐỀ ĐÃ ĐƯỢC KHÔI PHỤC --- */}
            <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
              Tìm khách sạn phù hợp ngay hôm nay
            </h1>
            <p className="mt-4 text-white/90 text-lg font-medium drop-shadow-md">
              Khám phá hàng ngàn khách sạn, resort và nhà nghỉ dưỡng
            </p>
          </div>

          <div className="mx-auto max-w-6xl">
            {/* Main Search Container - Giống hệt FlightSearchCard */}
            <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] grid grid-cols-1 lg:grid-cols-[1.6fr_0.1px_1fr_0.1px_1fr_0.1px_1.2fr_auto] items-center p-1 relative z-20">

              {/* 1. Destination Input */}
              <div className="relative group h-full" ref={suggestRef}>
                <div className="px-5 py-3 hover:bg-slate-100 transition-colors rounded-lg cursor-text h-full flex flex-col justify-center relative z-10" onClick={() => setOpenSuggest(true)}>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 pointer-events-none">
                    <BuildingIcon className="w-3.5 h-3.5" /> Bạn muốn đi đâu?
                  </label>
                  <input
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value);
                      setOpenSuggest(true);
                    }}
                    onFocus={() => setOpenSuggest(true)}
                    placeholder="Nhập điểm đến..."
                    className="w-full bg-transparent font-bold text-slate-900 text-[17px] outline-none placeholder:text-slate-300 truncate leading-tight"
                    autoComplete="off"
                  />
                </div>

                {/* Dropdown Suggestion */}
                {openSuggest && (
                  <div className="absolute left-0 top-[calc(100%+8px)] z-50 rounded-lg bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top font-sans min-w-full w-max max-w-[450px]">
                    <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                      {loadingSuggest && <div className="p-4 text-center text-sm text-slate-500">Đang tìm kiếm...</div>}
                      {!loadingSuggest && suggest.length === 0 && q.length >= 2 && <div className="p-4 text-center text-sm text-slate-500">Không tìm thấy kết quả nào</div>}
                      {!loadingSuggest && suggest.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => onPickDest(item)}
                          className="w-full text-left px-4 py-3 hover:bg-slate-100 transition-colors flex items-center gap-4 border-b border-slate-50 last:border-0 group"
                        >
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors shrink-0">
                            {getDestIcon(item.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[15px] font-semibold text-slate-900 truncate">{item.name || item.city}</div>
                            <div className="text-[13px] text-slate-500 truncate mt-0.5">{item.label}</div>
                          </div>
                          <div className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded">
                            {getDestLabel(item.type)}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="hidden lg:block w-[1px] h-3/4 bg-slate-200 mx-auto"></div>

              {/* 2. Check-in Date */}
              <div className="group h-full px-4 py-3 hover:bg-slate-100 transition-colors rounded-lg flex flex-col justify-center relative cursor-pointer" onClick={() => checkInRef.current?.showPicker()}>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 pointer-events-none relative z-10">
                  <CalendarIcon className="w-3.5 h-3.5" /> Nhận phòng
                </label>
                <div className="relative w-full h-[26px]">
                  <div className={`absolute inset-0 flex items-center font-bold text-[15px] pointer-events-none ${checkIn ? "text-slate-900" : "text-slate-300"}`}>
                    {checkIn ? formatDateDisplay(checkIn) : "DD/MM/YYYY"}
                  </div>
                  <input
                    ref={checkInRef}
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="hidden lg:block w-[1px] h-3/4 bg-slate-200 mx-auto"></div>

              {/* 3. Check-out Date */}
              <div className="group h-full px-4 py-3 hover:bg-slate-100 transition-colors rounded-lg flex flex-col justify-center relative cursor-pointer" onClick={() => checkOutRef.current?.showPicker()}>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 pointer-events-none relative z-10">
                  <CalendarIcon className="w-3.5 h-3.5" /> Trả phòng
                </label>
                <div className="relative w-full h-[26px]">
                  <div className={`absolute inset-0 flex items-center font-bold text-[15px] pointer-events-none ${checkOut ? "text-slate-900" : "text-slate-300"}`}>
                    {checkOut ? formatDateDisplay(checkOut) : "DD/MM/YYYY"}
                  </div>
                  <input
                    ref={checkOutRef}
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="hidden lg:block w-[1px] h-3/4 bg-slate-200 mx-auto"></div>

              {/* 4. Guest & Room Popover */}
              <div className="relative h-full group" ref={guestRef}>
                <div
                  className="px-5 py-3 hover:bg-slate-100 transition-colors cursor-pointer h-full rounded-lg flex flex-col justify-center"
                  onClick={() => setOpenGuest(!openGuest)}
                >
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                    <UserIcon className="w-3.5 h-3.5" /> Khách & Phòng
                  </label>
                  <div className="font-bold text-slate-900 text-[15px] truncate leading-tight">
                    {adults} người lớn, {rooms} phòng
                  </div>
                </div>

                {openGuest && (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 bg-white rounded-xl shadow-2xl ring-1 ring-black/10 p-5 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <Counter
                      label="Người lớn"
                      sub="Trên 18 tuổi"
                      value={adults}
                      onChange={setAdults}
                      min={1}
                    />
                    <Counter
                      label="Trẻ em"
                      sub="0 - 17 tuổi"
                      value={children}
                      onChange={setChildren}
                      min={0}
                    />
                    <Counter
                      label="Phòng"
                      sub="Mỗi phòng phải có ít nhất 1 người lớn"
                      value={rooms}
                      onChange={setRooms}
                      min={1}
                    />
                    <button
                      onClick={() => setOpenGuest(false)}
                      className="w-full mt-4 bg-blue-600 text-white rounded-lg py-3 text-sm font-bold hover:bg-blue-700 hover:shadow-lg transition-all"
                    >
                      Xong
                    </button>
                  </div>
                )}
              </div>

              {/* 5. Search Button */}
              <div className="p-1">
                <button
                  onClick={onSearch}
                  className="h-[52px] w-full lg:w-auto px-6 rounded-lg bg-[#0891b2] text-white font-bold hover:brightness-110 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <SearchIcon className="w-5 h-5" />
                </button>
              </div>

            </div>

            {/* Checkboxes below */}
            {/* <div className="mt-4 flex gap-6 px-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white/10" />
                <span className="text-white font-medium text-sm drop-shadow-md group-hover:text-blue-200 transition-colors">Hủy miễn phí</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white/10" />
                <span className="text-white font-medium text-sm drop-shadow-md group-hover:text-blue-200 transition-colors">4 sao +</span>
              </label>
            </div> */}
          </div>

        </div>
      </div>
    </section>
  );
}