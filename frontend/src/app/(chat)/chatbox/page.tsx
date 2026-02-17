"use client";

import React, { Suspense, useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Utensils,
  Calendar,
  Send,
  ArrowLeft,
  X,
  Star,
  Maximize2,
  Sun,
  Sunset,
  Moon,
  MapPin,
  Menu,
  Wallet,
  History,
  MessageSquare,
  PlusCircle,
  Hotel,
  Map as MapIcon,
  Sparkles,
  Loader2,
  ChevronRight,
  FilePenLine,
  Sparkle,
  Lock,
  LogIn,
  CreditCard,
  ShieldAlert,
  CheckCircle2,
  Info,
  ExternalLink,
} from "lucide-react";
import PlacesMapPane, { UiPlace } from "./PlacesMapPane";
import { useAuth } from "../../AuthProvider";

const API_BASE = process.env.NEXT_PUBLIC_AGENT_API!;
const SPRING_BOOT_API = process.env.NEXT_PUBLIC_API_URL!;

const SUB_PACKAGES = [
  { id: 1, packageCode: "day", name: "Gói 1 ngày", days: 1, price: 10000 },
  { id: 2, packageCode: "month", name: "Gói 30 ngày", days: 30, price: 49000 },
] as const;

type SubStatus = {
  active: boolean;
  packageCode?: string | null;
  raw?: any;
};

function formatVND(n: number) {
  try {
    return n.toLocaleString("vi-VN") + "đ";
  } catch {
    return `${n}đ`;
  }
}

function getTokenFromStorage() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token") || localStorage.getItem("token");
}

function decodeJwtPayload(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function normalizePositiveId(value: any): string | null {
  if (value == null) return null;
  const n = Number(value);
  if (Number.isFinite(n) && n > 0) return String(Math.trunc(n));
  return null;
}

function extractUserIdFromPayload(payload: any): string | null {
  if (!payload || typeof payload !== "object") return null;
  const direct = payload.user_id ?? payload.userId ?? payload.id ?? payload.uid ?? payload.sub ?? null;
  const nested = payload.user?.id ?? payload.user?.userId ?? payload.user?.user_id ?? null;
  return normalizePositiveId(direct) ?? normalizePositiveId(nested);
}

function getStoredUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("vivuplan_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return (
      normalizePositiveId(parsed?.id) ??
      normalizePositiveId(parsed?.userId) ??
      normalizePositiveId(parsed?.user_id)
    );
  } catch {
    return null;
  }
}

async function fetchJsonSafe(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { res, text, json };
}

const openGoogleMaps = (query: string) => {
  if (!query) return;
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  window.open(url, "_blank");
};

function VivuplanPremiumContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [activeId, setActiveId] = useState<string>("");
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [itineraryData, setItineraryData] = useState<any>(null);
  const [hotelData, setHotelData] = useState<any>(null);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isPromptPopoverOpen, setIsPromptPopoverOpen] = useState(false);

  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"chat" | "itinerary" | "hotel">("chat");
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isStreaming, setIsStreaming] = useState(false);

  // ... (existing code)



  // ... (later in file)



  const hasProcessedInitialPrompt = useRef(false);

  // prompt mẫu
  const [quickMode, setQuickMode] = useState<"itinerary" | "hotel">("itinerary");

  const [itineraryForm, setItineraryForm] = useState({
    departure: "",
    destination: "",
    startDate: "",
    endDate: "",
    companions: "",
    budgetFrom: "",
    budgetTo: "",
  });

  const [hotelForm, setHotelForm] = useState({
    destination: "",
    checkIn: "",
    checkOut: "",
    adults: "",
    children: "",
    rooms: "",
  });

  const [showLoginGate, setShowLoginGate] = useState(false);
  const [allowGuestDemo, setAllowGuestDemo] = useState(false);
  const [subStatus, setSubStatus] = useState<SubStatus>({ active: false, packageCode: null });
  const [showPaywall, setShowPaywall] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const newSessionId = () => {
    try {
      // @ts-ignore
      if (typeof crypto !== "undefined" && crypto?.randomUUID) return crypto.randomUUID();
    } catch { }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  // Get user ID from AuthProvider
  const getUserId = () => {
    if (user?.id) return String(user.id);
    if (allowGuestDemo) return "1";
    return null;
  };

  const getBannerPhoto = (name: string) => {
    if (itineraryData?.destination_image_url) return itineraryData.destination_image_url;
    return undefined;
  };

  const totalCost = useMemo(() => {
    if (!itineraryData?.itinerary) return 0;
    return itineraryData.itinerary.reduce(
      (sum: number, day: any) => sum + (day.estimated_cost?.max || 0),
      0
    );
  }, [itineraryData]);

  const shouldLockContent = useMemo(() => {
    if (subStatus.active) return false;
    const hasAnyResult = Boolean(itineraryData || hotelData);
    const hasAnyMsg = messages.length > 0;
    const hasAnyHistory = chatHistory.length > 0;
    const isFirstTime = !hasAnyHistory && !hasAnyMsg && !hasAnyResult;
    if (!isAuthenticated && !allowGuestDemo) return true;
    if (isFirstTime) return false;
    return true;
  }, [subStatus.active, isAuthenticated, allowGuestDemo, itineraryData, hotelData, messages.length, chatHistory.length]);

  const loadHistory = async () => {
    try {
      if (!isAuthenticated || !user?.id) { setChatHistory([]); return; }
      const uid = getUserId();
      if (!uid) { setChatHistory([]); return; }
      const { res, json } = await fetchJsonSafe(`${API_BASE}/conversation/history/${uid}?page=1&page_size=30`);
      if (!res.ok) { setChatHistory([]); return; }
      const dataH = json ?? {};
      if (dataH?.data) {
        const sorted = [...dataH.data].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setChatHistory(sorted);
      } else { setChatHistory([]); }
    } catch { setChatHistory([]); }
  };

  const handleSelectChat = async (sid: string) => {
    try {
      setIsLoading(true); setSelectedDayIdx(null); setActiveId(sid); setViewMode("chat");
      const { res, json } = await fetchJsonSafe(`${API_BASE}/conversation/${sid}`);
      if (!res.ok) return;
      const dataD = json ?? {};
      setMessages((dataD?.messages || []).map((m: any) => ({ role: m.role === "user" ? "user" : "ai", content: m.parts?.[0]?.text || "" })));
      setItineraryData(dataD?.itinerary || null);
      setHotelData(dataD?.hotel_recommendation || null);
      setIsSidebarOpen(false);
    } finally { setIsLoading(false); }
  };

  const handleNewChat = () => {
    setActiveId(newSessionId()); setMessages([]); setItineraryData(null); setHotelData(null);
    setInputText(""); setSelectedDayIdx(null); setViewMode("chat"); setIsSidebarOpen(false);
  };

  const fetchSubscriptionStatus = async () => {
    const uid = user?.id;
    if (!uid) return { active: false, packageCode: null };
    try {
      const { res, json, text } = await fetchJsonSafe(`${SPRING_BOOT_API}/subscriptions/status?userId=${encodeURIComponent(String(uid))}`);
      console.log("🔍 Subscription check for userId:", uid, "Response:", { ok: res.ok, json });
      if (!res.ok) { setSubStatus({ active: false, packageCode: null, raw: text }); return { active: false, packageCode: null }; }
      const data = json ?? {};
      const result = data?.result ?? data;
      const active = Boolean(result?.active) || Boolean(result?.isActive) || String(result?.status || "").toLowerCase() === "active" || Boolean(result?.valid);
      const packageCode = result?.packageCode ?? result?.package_code ?? result?.plan ?? null;
      console.log("✅ Subscription status:", { active, packageCode, result });
      setSubStatus({ active, packageCode, raw: data });
      return { active, packageCode };
    } catch (err) {
      console.error("❌ Subscription error:", err);
      return { active: false, packageCode: null };
    }
  };

  const purchaseSubscription = async (packageCode: string) => {
    const uid = user?.id;
    if (!uid) { setShowLoginGate(true); return; }
    setIsPurchasing(true);
    try {
      const { res, json } = await fetchJsonSafe(`${SPRING_BOOT_API}/subscriptions/purchase`, {
        method: "POST", headers: { "Content-Type": "application/json", accept: "*/*" },
        body: JSON.stringify({ userId: uid, packageCode }),
      });
      if (!res.ok) { alert("Lỗi tạo giao dịch. Vui lòng thử lại."); return; }
      if (json?.status !== "success" || !json?.result?.checkoutUrl) { alert(json?.message || "Không lấy được link thanh toán."); return; }
      window.open(json.result.checkoutUrl, "_blank");
    } catch { alert("Lỗi kết nối."); } finally { setIsPurchasing(false); }
  };

  const handleBooking = async (hotel: any) => {
    try {
      const hotelId = hotel.place_id || hotel.details?.id || "11814601";
      const queryParams = new URLSearchParams({ hotelId: hotelId, arrivalDate: "2026-03-03", departureDate: "2026-03-05", adults: "2", childrenAge: "", languagecode: "vi", currencyCode: "VND" });
      const { res, json } = await fetchJsonSafe(`${SPRING_BOOT_API}/hotel/link?${queryParams.toString()}`);
      if (res.ok && json.result) window.open(json.result, "_blank");
      else alert("Không lấy được link đặt phòng.");
    } catch { alert("Lỗi kết nối."); }
  };

  // Helper for stable pseudo-random numbers
  const getStableOffset = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const random = Math.abs(hash) / 2147483648;
    return (random - 0.5) * 0.04; // Spread within ~4km
  };

  const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
    "hà nội": { lat: 21.0285, lng: 105.8542 },
    "hcm": { lat: 10.8231, lng: 106.6297 },
    "hồ chí minh": { lat: 10.8231, lng: 106.6297 },
    "đà nẵng": { lat: 16.0544, lng: 108.2022 },
    "đà lạt": { lat: 11.9404, lng: 108.4583 },
    "nha trang": { lat: 12.2388, lng: 109.1967 },
    "phú quốc": { lat: 10.2899, lng: 103.9840 },
    "huế": { lat: 16.4637, lng: 107.5909 },
    "hội an": { lat: 15.8801, lng: 108.3380 },
    "sapa": { lat: 22.3364, lng: 103.8438 },
    "hạ long": { lat: 20.9501, lng: 107.0734 },
    "vũng tàu": { lat: 10.3460, lng: 107.0843 },
    "cần thơ": { lat: 10.0452, lng: 105.7469 },
    "quy nhơn": { lat: 13.7830, lng: 109.2197 },
  };

  const places: UiPlace[] = useMemo(() => {
    if (isStreaming) return []; // Only show places when streaming is finished
    if (!itineraryData?.itinerary) return [];
    const out: UiPlace[] = [];
    itineraryData.itinerary.forEach((day: any) => {
      const locationKey = day.location?.toLowerCase().trim() || "";
      // Find closest city match
      const cityMatch = Object.keys(CITY_COORDS).find(k => locationKey.includes(k));
      const baseCoords = cityMatch ? CITY_COORDS[cityMatch] : { lat: 21.0285, lng: 105.8542 }; // Default Hanoi

      const items = [...(day.attraction_recommendations || []), ...(day.restaurant_recommendations || [])];
      items.forEach((item: any) => {
        let shortName = item.reason?.split(/[.\-:]/)[0] || "Địa điểm";
        shortName = shortName.split(/ mang | là | giúp | lý | có | được | để /)[0].trim();

        // Use name or place_id as seed for stable position
        const seed = item.place_id || item.name || shortName;

        out.push({
          id: item.place_id, place_id: item.place_id, name: shortName,
          kind: item.reason?.toLowerCase().includes("ăn") ? "restaurant" : "attraction",
          day: day.date_,
          lat: baseCoords.lat + getStableOffset(seed + "lat"),
          lng: baseCoords.lng + getStableOffset(seed + "lng"),
          reason: item.reason,
        });
      });

      // Map meals
      if (day.meals && Array.isArray(day.meals)) {
        day.meals.forEach((meal: string, i: number) => {
          if (!meal) return;
          const seed = `meal-${day.date_}-${i}`;
          out.push({
            id: seed,
            place_id: seed,
            name: meal,
            kind: "restaurant",
            day: day.date_,
            lat: baseCoords.lat + getStableOffset(seed + "lat"),
            lng: baseCoords.lng + getStableOffset(seed + "lng"),
            reason: "Gợi ý bữa ăn",
          });
        });
      }
    });
    return out;
  }, [itineraryData, isStreaming]);

  const executeSend = async (text: string) => {
    if (!text || isLoading) return;
    if (!isAuthenticated && !allowGuestDemo) { setShowLoginGate(true); return; }
    if (shouldLockContent) { setShowPaywall(true); return; }

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInputText("");
    setIsLoading(true);
    setIsStreaming(true);

    const sid = activeId || newSessionId();
    if (!activeId) setActiveId(sid);

    try {
      const uid = getUserId();
      if (!uid) { setShowLoginGate(true); setIsLoading(false); setIsStreaming(false); return; }

      const response = await fetch(`${API_BASE}/conversation/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sid, user_id: uid, content: text }),
      });

      if (!response.ok) {
        setMessages((prev) => [...prev, { role: "ai", content: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại." }]);
        setIsLoading(false);
        setIsStreaming(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      let buffer = "";
      let hasStartedStreaming = false;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // SSE format: events are separated by double newlines
          const events = buffer.split("\n\n");
          // Keep the last incomplete event in the buffer
          buffer = events.pop() || "";

          for (const event of events) {
            if (!event.trim()) continue;

            // SSE lines start with "data: "
            const lines = event.split("\n");
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;

              const dataStr = line.substring(6); // Remove "data: "

              // Check for termination
              if (dataStr === "[DONE]") continue;

              try {
                const data = JSON.parse(dataStr);

                // Handle text-delta events
                if (data.type === "text-delta" && data.delta) {
                  accumulatedText += data.delta;

                  // On first chunk, hide loading and add AI message
                  if (!hasStartedStreaming) {
                    hasStartedStreaming = true;
                    setIsLoading(false);
                    setMessages((prev) => [...prev, { role: "ai", content: accumulatedText }]);
                  } else {
                    // Update the last message (AI message)
                    setMessages((prev) => {
                      const newMsgs = [...prev];
                      const lastIdx = newMsgs.length - 1;
                      if (lastIdx >= 0 && newMsgs[lastIdx].role === "ai") {
                        newMsgs[lastIdx] = { role: "ai", content: accumulatedText };
                      }
                      return newMsgs;
                    });
                  }
                }
                // Handle data events
                else if (data.type === "data-itinerary" && data.data) {
                  setItineraryData(data.data);
                }
                else if (data.type === "data-hotel" && data.data) {
                  console.log("🏨 Hotel data received:", JSON.stringify(data.data, null, 2));
                  setHotelData(data.data);
                }
              } catch (e) {
                console.warn("Failed to parse SSE data:", e);
              }
            }
          }
        }
      }

      await loadHistory();
      if (!subStatus.active) setShowPaywall(true);

    } catch (err) {
      console.error("Stream error:", err);
      setMessages((prev) => [...prev, { role: "ai", content: "Lỗi kết nối." }]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleSend = () => executeSend(inputText.trim());

  const handlePromptSubmit = () => {
    if (quickMode === "itinerary") {
      const parts = [];
      if (itineraryForm.departure) parts.push(`Đi từ ${itineraryForm.departure}`);
      if (itineraryForm.destination) parts.push(`đến ${itineraryForm.destination}`);
      if (itineraryForm.startDate && itineraryForm.endDate) parts.push(`từ ${itineraryForm.startDate} đến ${itineraryForm.endDate}`);
      if (itineraryForm.companions) parts.push(`cho ${itineraryForm.companions} người`);
      if (itineraryForm.budgetFrom && itineraryForm.budgetTo) parts.push(`ngân sách khoảng ${itineraryForm.budgetFrom} - ${itineraryForm.budgetTo}`);

      const finalPrompt = `Lập lịch trình: ${parts.join(". ")}`;
      if (finalPrompt.length > 20) { executeSend(finalPrompt); setIsPromptPopoverOpen(false); }
    } else {
      const parts = [];
      if (hotelForm.destination) parts.push(`Tìm khách sạn tại ${hotelForm.destination}`);
      if (hotelForm.checkIn && hotelForm.checkOut) parts.push(`Check-in: ${hotelForm.checkIn}, Check-out: ${hotelForm.checkOut}`);
      if (hotelForm.adults) parts.push(`Người lớn: ${hotelForm.adults}`);
      if (hotelForm.children) parts.push(`Trẻ em: ${hotelForm.children}`);
      if (hotelForm.rooms) parts.push(`Số phòng: ${hotelForm.rooms}`);

      const finalPrompt = parts.join(". ");
      if (finalPrompt.length > 20) { executeSend(finalPrompt); setIsPromptPopoverOpen(false); }
    }
  };



  useEffect(() => setMounted(true), []);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, isLoading]);
  useEffect(() => {
    if (!mounted) return;
    if (isAuthenticated) {
      loadHistory();
    } else {
      const promptFromUrl = searchParams.get("prompt");
      if (promptFromUrl) { setAllowGuestDemo(true); setShowLoginGate(false); } else { /* setShowLoginGate(true); */ }
    }
    setActiveId(newSessionId());
  }, [mounted, isAuthenticated]);

  useEffect(() => {
    if (!mounted) return;
    const promptFromUrl = searchParams.get("prompt");
    if (promptFromUrl && !hasProcessedInitialPrompt.current) {
      hasProcessedInitialPrompt.current = true;
      setTimeout(() => { executeSend(promptFromUrl); window.history.replaceState({}, '', window.location.pathname); }, 500);
    }
  }, [mounted, searchParams]);

  useEffect(() => { if (user?.id) fetchSubscriptionStatus(); }, [user?.id]);

  const LoginGateModal = () => (
    <div className="fixed inset-0 z-[20000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0056D2] flex items-center justify-center"><ShieldAlert size={20} /></div><div><p className="font-bold text-slate-800">Cần đăng nhập</p><p className="text-xs text-slate-500">Để lưu lịch trình & mua gói</p></div></div>
          <button onClick={() => setShowLoginGate(false)}><X size={20} className="text-slate-400" /></button>
        </div>
        <button onClick={() => router.push("/pages/login?next=/")} className="w-full py-3 bg-[#0056D2] text-white rounded-xl font-bold flex justify-center gap-2 hover:bg-blue-700 transition-all"><LogIn size={18} /> Đăng nhập ngay</button>
      </div>
    </div>
  );

  function PaywallModal({ isOpen, onClose, isAuthenticated: isAuth, subStatus, isPurchasing, onPurchase, onCheckStatus }: any) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-[21000] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md transition-opacity" onClick={onClose} />
        <div className="relative w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col md:flex-row h-auto md:h-[500px]">
          <div className="w-full md:w-2/5 bg-slate-50 p-8 flex flex-col border-b md:border-b-0 md:border-r border-slate-100">
            <div className="mb-6"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-lg mb-4"><Lock size={24} /></div><h3 className="text-xl font-black text-slate-900 leading-tight">Mở khóa toàn bộ VivuPlan</h3><p className="text-xs text-slate-500 mt-2 font-medium">{subStatus.active ? `Đang kích hoạt: ${subStatus.packageCode || "Premium"}` : "Bạn đang dùng bản miễn phí giới hạn."}</p></div>
            <div className="space-y-3 mt-auto">{["Lịch trình AI chi tiết", "Bản đồ thông minh", "Gợi ý khách sạn & vé máy bay", "Không giới hạn câu hỏi"].map((item, i) => (<div key={i} className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 size={16} className="text-green-500 shrink-0" /><span>{item}</span></div>))}</div>
          </div>
          <div className="flex-1 p-8 flex flex-col relative">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-slate-500 transition-colors"><X size={20} /></button>
            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Chọn gói dịch vụ</h4>
            <div className="grid grid-cols-1 gap-4 flex-1">
              {SUB_PACKAGES.map((p) => (
                <div key={p.id} className={`relative rounded-2xl p-4 border-2 flex items-center justify-between transition-all ${p.packageCode === 'month' ? 'border-blue-500 bg-blue-50/10' : 'border-slate-100 hover:border-blue-200'}`}>
                  {p.packageCode === 'month' && <div className="absolute -top-3 right-4 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase shadow-md">Tiết kiệm nhất</div>}
                  <div className="flex-1"><p className="font-bold text-slate-800 text-sm">{p.name}</p><div className="flex items-baseline gap-1 mt-1"><p className="text-xl font-black text-slate-900">{p.price.toLocaleString()}đ</p><p className="text-[10px] text-slate-400 font-bold">/{p.days} ngày</p></div></div>
                  <button disabled={!isAuth || isPurchasing} onClick={() => onPurchase(p.packageCode)} className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all transform active:scale-95 shadow-sm ${(!isAuth || isPurchasing) ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-[#0056D2] text-white hover:bg-blue-700 hover:shadow-blue-200"}`}>Mua ngay</button>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-slate-100">
              {!isAuth && <div className="flex items-center justify-between gap-2 mb-3 bg-amber-50 p-2 rounded-lg text-amber-700 text-xs font-bold border border-amber-100"><span>⚠️ Cần đăng nhập để mua</span><button onClick={() => router.push("/pages/login")} className="underline uppercase text-[10px]">Đăng nhập</button></div>}
              {isPurchasing ? <button disabled className="w-full py-3 rounded-xl bg-slate-100 text-slate-400 font-bold flex items-center justify-center gap-2 cursor-not-allowed"><Loader2 size={16} className="animate-spin" /> Đang xử lý...</button> : <button onClick={onCheckStatus} disabled={!isAuth} className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wide hover:bg-slate-50 disabled:opacity-50 flex items-center justify-center gap-2"><CreditCard size={14} /> Kiểm tra thanh toán</button>}
              <p className="text-[10px] text-center text-slate-400 mt-3 font-medium">* Thanh toán an toàn qua cổng PayOS / VNPay.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const BlurLockLayer = () => (
    <div className="absolute inset-0 z-[150] bg-white/60 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white p-6 rounded-3xl shadow-xl text-center border border-slate-100 max-w-sm">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3"><Lock size={20} /></div>
        <h3 className="font-bold text-slate-900">Nội dung bị khóa</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">Vui lòng mở khóa Premium để xem chi tiết.</p>
        <button onClick={() => setShowPaywall(true)} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wide hover:bg-blue-700">Mở khóa ngay</button>
      </div>
    </div>
  );

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 top-[68px] w-screen h-[calc(100dvh-68px)] bg-white text-slate-900 font-sans flex overflow-hidden text-sm shadow-inner">
      {showLoginGate && <LoginGateModal />}
      {showPaywall && <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} isAuthenticated={isAuthenticated} subStatus={subStatus} isPurchasing={isPurchasing} onPurchase={purchaseSubscription} onCheckStatus={fetchSubscriptionStatus} />}

      {/* SIDEBAR */}
      <aside className={`absolute md:relative inset-y-0 left-0 z-[3000] w-[280px] bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 shadow-2xl md:shadow-none ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="p-5 h-[60px] md:h-[70px] border-b flex items-center shrink-0 justify-between"><img src="/brand/logo.png" className="h-6 w-auto" alt="Vivuplan" /><button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button></div>
        <div className="p-4"><button onClick={handleNewChat} className="w-full py-3 bg-[#0056D2] text-white rounded-xl text-[11px] font-black flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all"><PlusCircle size={16} /> Chuyến đi mới</button></div>
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5 custom-scrollbar"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2 px-2 mt-2"><History size={12} /> Lịch sử gần đây</p>{chatHistory.length > 0 ? (chatHistory.map((chat) => (<button key={chat.session_id} onClick={() => handleSelectChat(chat.session_id)} className={`w-full text-left p-3 rounded-lg text-[11px] flex items-center gap-3 transition-all ${activeId === chat.session_id ? "bg-blue-50 text-[#0056D2] font-bold border border-blue-100" : "hover:bg-slate-50 text-slate-600 border border-transparent"}`}><MessageSquare size={14} className={`shrink-0 ${activeId === chat.session_id ? "opacity-100 text-[#0056D2]" : "opacity-40"}`} /><span className="truncate flex-1">{chat.title || `Trip ${chat.session_id.substring(0, 8)}`}</span></button>))) : (<div className="p-4 text-center text-[10px] text-slate-300 italic"> {isAuthenticated ? "Chưa có lịch sử" : "Đăng nhập để xem lịch sử"} </div>)}</div>
      </aside>
      {isSidebarOpen && <div className="absolute inset-0 bg-black/40 z-[2999] backdrop-blur-sm md:hidden" onClick={() => setIsSidebarOpen(false)} />}

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative bg-[#FDFDFD] min-w-0 overflow-hidden">
        <header className="md:hidden h-[60px] border-b bg-white flex items-center justify-between px-4 shrink-0 z-[40] relative"><div className="flex items-center gap-3"><button onClick={() => setIsSidebarOpen(true)} className="p-2 text-[#0056D2] hover:bg-blue-50 rounded-lg"><Menu size={22} /></button><div className="flex flex-col"><h1 className="text-xs font-black uppercase tracking-widest text-[#0056D2]">Vivuplan AI</h1></div></div></header>

        <div className="relative flex-1 overflow-hidden flex flex-col">
          {shouldLockContent && <BlurLockLayer />}
          <div className={`flex-1 flex flex-col overflow-hidden ${shouldLockContent ? "pointer-events-none" : ""}`}>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
              {messages.length === 0 && !isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto py-10"><div className="w-16 h-16 bg-blue-50 rounded-[2rem] flex items-center justify-center text-[#0056D2] animate-bounce shadow-lg shadow-blue-50"><Sparkles size={32} /></div><h2 className="text-xl md:text-2xl font-black italic tracking-tighter uppercase mb-2 text-[#0056D2]">Xin chào!</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full px-4">{["Đà Lạt 3N2Đ", "Huế ăn gì?", "Resort Nha Trang"].map((t, i) => (<button key={i} onClick={() => setInputText(t)} className="p-3 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-blue-50 hover:text-[#0056D2] hover:border-blue-100 transition-all text-left">{t}</button>))}</div></div>
              ) : (
                <div className="max-w-3xl mx-auto w-full space-y-6 pb-4">
                  {messages.map((m, i) => (<div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}><div className={`max-w-[90%] md:max-w-[85%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm ${m.role === "user" ? "bg-[#0056D2] text-white rounded-tr-none" : "bg-white text-slate-700 border border-slate-100 rounded-tl-none font-medium"}`}>{m.content}</div></div>))}
                  {isLoading && (<div className="flex justify-start"><div className="bg-white border border-blue-50 p-4 rounded-2xl rounded-tl-none shadow-md flex items-center gap-3"><Loader2 size={16} className="animate-spin text-[#0056D2]" /><p className="text-[10px] font-black uppercase tracking-widest text-[#0056D2]">Đang xử lý...</p></div></div>)}
                </div>
              )}
            </div>

            {/* Footer Input */}
            <div className="bg-white border-t border-slate-50 shrink-0 relative z-20 flex flex-col">
              {(itineraryData || hotelData) && (
                <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar justify-center border-b border-slate-50 bg-slate-50/50">
                  {itineraryData && <button onClick={() => setViewMode("itinerary")} className="flex items-center gap-2 px-5 py-2 bg-[#0056D2] text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-blue-700 active:scale-95 transition-all whitespace-nowrap"><Calendar size={14} /> Xem Lịch Trình</button>}
                  {hotelData && <button onClick={() => setViewMode("hotel")} className="flex items-center gap-2 px-5 py-2 bg-cyan-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-cyan-600 active:scale-95 transition-all whitespace-nowrap"><Hotel size={14} /> Xem Khách sạn</button>}
                </div>
              )}
              <div className="p-3 md:p-6 relative">
                {isPromptPopoverOpen && (
                  <div className="absolute bottom-full left-0 w-full px-3 md:px-6 pb-2 animate-in slide-in-from-bottom-4 z-50">
                    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 relative">
                      <button onClick={() => setIsPromptPopoverOpen(false)} className="absolute top-3 right-3 text-slate-300 hover:text-red-500"><X size={16} /></button>
                      <h3 className="text-xs font-black italic uppercase text-[#0056D2] mb-3 flex items-center gap-2"><Sparkle size={14} /> Tạo nhanh</h3>

                      {/* Tabs */}
                      <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                        <button onClick={() => setQuickMode("itinerary")} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${quickMode === "itinerary" ? "bg-white text-[#0056D2] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Lịch trình</button>
                        <button onClick={() => setQuickMode("hotel")} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${quickMode === "hotel" ? "bg-white text-[#0056D2] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Khách sạn</button>
                      </div>

                      {quickMode === "itinerary" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input value={itineraryForm.departure} onChange={(e) => setItineraryForm({ ...itineraryForm, departure: e.target.value })} className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-bold" placeholder="Điểm xuất phát?" />
                          <input value={itineraryForm.destination} onChange={(e) => setItineraryForm({ ...itineraryForm, destination: e.target.value })} className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-bold" placeholder="Điểm đến?" />
                          <div className="flex gap-2">
                            <input type="text" onFocus={(e) => e.target.type = 'date'} onBlur={(e) => e.target.type = 'text'} value={itineraryForm.startDate} onChange={(e) => setItineraryForm({ ...itineraryForm, startDate: e.target.value })} className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-bold" placeholder="Ngày đi" />
                            <input type="text" onFocus={(e) => e.target.type = 'date'} onBlur={(e) => e.target.type = 'text'} value={itineraryForm.endDate} onChange={(e) => setItineraryForm({ ...itineraryForm, endDate: e.target.value })} className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-bold" placeholder="Ngày về" />
                          </div>

                          <input type="text" inputMode="numeric" value={itineraryForm.companions} onChange={(e) => setItineraryForm({ ...itineraryForm, companions: e.target.value.replace(/[^0-9]/g, "") })} className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-bold" placeholder="Số người?" />
                          <div className="flex gap-2 md:col-span-2">
                            <input type="text" inputMode="numeric" value={itineraryForm.budgetFrom} onChange={(e) => setItineraryForm({ ...itineraryForm, budgetFrom: e.target.value.replace(/[^0-9]/g, "") })} className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-bold" placeholder="Ngân sách từ..." />
                            <input type="text" inputMode="numeric" value={itineraryForm.budgetTo} onChange={(e) => setItineraryForm({ ...itineraryForm, budgetTo: e.target.value.replace(/[^0-9]/g, "") })} className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-bold" placeholder="...đến (VND)" />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input value={hotelForm.destination} onChange={(e) => setHotelForm({ ...hotelForm, destination: e.target.value })} className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-bold md:col-span-2" placeholder="Thành phố / Khu vực?" />
                          <div className="flex gap-2">
                            <input type="text" onFocus={(e) => e.target.type = 'date'} onBlur={(e) => e.target.type = 'text'} value={hotelForm.checkIn} onChange={(e) => setHotelForm({ ...hotelForm, checkIn: e.target.value })} className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-bold" placeholder="Check-in" />
                            <input type="text" onFocus={(e) => e.target.type = 'date'} onBlur={(e) => e.target.type = 'text'} value={hotelForm.checkOut} onChange={(e) => setHotelForm({ ...hotelForm, checkOut: e.target.value })} className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-bold" placeholder="Check-out" />
                          </div>
                          <div className="flex gap-2">
                            <input type="text" inputMode="numeric" value={hotelForm.adults} onChange={(e) => setHotelForm({ ...hotelForm, adults: e.target.value.replace(/[^0-9]/g, "") })} className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-bold" placeholder="Người lớn" />
                            <input type="text" inputMode="numeric" value={hotelForm.children} onChange={(e) => setHotelForm({ ...hotelForm, children: e.target.value.replace(/[^0-9]/g, "") })} className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-bold" placeholder="Trẻ em" />
                          </div>
                          <input type="text" inputMode="numeric" value={hotelForm.rooms} onChange={(e) => setHotelForm({ ...hotelForm, rooms: e.target.value.replace(/[^0-9]/g, "") })} className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-bold md:col-span-2" placeholder="Số phòng?" />
                        </div>
                      )}

                      <button onClick={handlePromptSubmit} className="w-full mt-4 bg-[#0056D2] text-white py-2.5 rounded-lg text-[10px] font-black uppercase hover:bg-blue-700 transition-all">
                        {quickMode === "itinerary" ? "Tạo lịch trình" : "Tìm khách sạn"}
                      </button>
                    </div>
                  </div>
                )}
                <div className="max-w-3xl mx-auto flex items-end gap-2"><button onClick={() => setIsPromptPopoverOpen(!isPromptPopoverOpen)} className={`h-12 w-12 rounded-2xl flex flex-col items-center justify-center border ${isPromptPopoverOpen ? "bg-blue-50 border-blue-200 text-[#0056D2]" : "bg-slate-50 border-transparent text-slate-400 hover:text-[#0056D2]"}`}><FilePenLine size={18} /></button><div className="relative flex-1"><textarea value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} className="w-full bg-slate-50 border-none rounded-2xl p-4 pr-12 text-[13px] h-12 md:h-14 resize-none outline-none focus:bg-white focus:ring-1 focus:ring-blue-200 transition-all font-medium shadow-inner" placeholder="Nhập yêu cầu..." /><button onClick={handleSend} disabled={isLoading} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-[#0056D2] text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50"><Send size={16} /></button></div></div>
                {!subStatus.active && (<div className="max-w-3xl mx-auto mt-2 text-[10px] text-slate-400 flex items-center justify-between"><span>Chưa kích hoạt gói — tạo xong sẽ yêu cầu mua gói.</span><button onClick={() => setShowPaywall(true)} className="text-[#0056D2] font-black hover:underline">Xem gói</button></div>)}
              </div>
            </div>

            {/* OVERLAY: ITINERARY VIEW */}
            {(viewMode === "itinerary" || viewMode === "hotel") && (
              <div className="absolute inset-0 z-[200] bg-[#F8FAFB] flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
                <div className="h-[60px] md:h-[70px] bg-white border-b flex items-center justify-between px-4 shrink-0 shadow-sm z-[210]">
                  <button onClick={() => setViewMode("chat")} className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-[10px] font-black uppercase text-slate-600 hover:bg-[#0056D2] hover:text-white transition-all"><ArrowLeft size={14} /> Quay lại</button>
                  <div className="flex items-center gap-2"><span className="hidden md:inline text-[10px] font-black uppercase tracking-[0.2em] text-[#0056D2] opacity-60">{viewMode === "itinerary" ? "LỊCH TRÌNH CHI TIẾT" : "KHÁCH SẠN ĐỀ XUẤT"}</span></div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
                  {viewMode === "itinerary" && itineraryData && (
                    <div className="space-y-8 max-w-5xl mx-auto">
                      {/* Banner Image */}
                      <section className="relative h-[200px] md:h-[300px] rounded-[2rem] overflow-hidden shadow-xl">
                        <img src={getBannerPhoto(itineraryData?.trip_summary?.destinations?.[0])} className="w-full h-full object-cover" alt="banner" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <h1 className="absolute bottom-6 left-6 text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter">{itineraryData?.trip_summary?.destinations?.[0]}</h1>
                      </section>

                      {/* Map & Total Cost */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        <div className="md:col-span-2 bg-white p-2 rounded-[2rem] shadow-lg border border-slate-100 h-[350px] relative overflow-hidden group">
                          {/* --- SỬA CONTAINER CHA CỦA MAP TẠI ĐÂY --- */}
                          <div className="w-full h-full rounded-[1.8rem] overflow-hidden relative">
                            <PlacesMapPane places={places} />
                            {isStreaming && (
                              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                                <Loader2 className="animate-spin text-[#0056D2] mb-2" size={32} />
                                <p className="text-xs font-bold text-[#0056D2] uppercase tracking-widest animate-pulse">Đang định vị...</p>
                              </div>
                            )}
                          </div>
                          <button onClick={() => setIsMapModalOpen(true)} className="absolute bottom-4 right-4 px-5 py-2.5 bg-white text-[#0056D2] rounded-full text-[9px] font-black shadow-xl flex items-center gap-2 uppercase tracking-widest hover:bg-[#0056D2] hover:text-white transition-all z-20 italic border border-slate-100"><Maximize2 size={12} /> Mở rộng bản đồ</button>
                        </div>
                        <div className="bg-[#0056D2] p-6 rounded-[2rem] shadow-xl text-white flex flex-col justify-center relative overflow-hidden"><div className="absolute -right-6 -top-6 opacity-10"><Wallet size={150} /></div><p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2 italic">Tổng ngân sách</p><h2 className="text-3xl md:text-4xl font-black italic tracking-tighter mb-4">{formatVND(totalCost)}</h2><p className="text-[11px] font-medium italic opacity-80 leading-relaxed">Chi phí ước tính bao gồm ăn uống, vé tham quan và di chuyển.</p></div>
                      </div>

                      {/* Day List */}
                      <div className="space-y-4">
                        <h2 className="text-base font-black italic tracking-widest text-[#0056D2] uppercase px-2 flex items-center gap-3"><div className="w-6 h-[3px] bg-[#0056D2]" /> CHI TIẾT LỘ TRÌNH</h2>
                        <div className="grid grid-cols-1 gap-4">
                          {itineraryData?.itinerary && Array.isArray(itineraryData.itinerary) && itineraryData.itinerary.map((day: any, idx: number) => (
                            <div key={idx} onClick={() => setSelectedDayIdx(idx)} className="bg-white p-5 md:p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-4 md:gap-8 cursor-pointer hover:shadow-xl hover:border-blue-100 transition-all group">
                              <div className="w-full md:w-32 h-16 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-[#0056D2] transition-all"><p className="text-[11px] font-black text-slate-400 group-hover:text-white uppercase italic">NGÀY {idx + 1}</p></div>
                              <div className="flex-1 text-center md:text-left"><span className="text-[9px] font-black text-[#0056D2] block mb-1 uppercase tracking-widest">{day.date_}</span><h3 className="text-lg md:text-xl font-black italic uppercase tracking-tight group-hover:text-[#0056D2] transition-colors">{day.location}</h3></div>
                              <ChevronRight className="text-slate-300 group-hover:text-[#0056D2] transition-all hidden md:block" size={20} />
                            </div>
                          ))}
                          {/* Show skeleton for expected but not yet loaded days */}
                          {(!itineraryData?.itinerary || !Array.isArray(itineraryData.itinerary) || itineraryData.itinerary.length === 0) && (
                            // If no data at all, show 3 skeleton placeholders
                            [1, 2, 3].map((i) => (
                              <div key={`skeleton-${i}`} className="bg-white p-5 md:p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-4 md:gap-8 animate-pulse">
                                <div className="w-full md:w-32 h-16 bg-slate-200 rounded-2xl"></div>
                                <div className="flex-1 space-y-2">
                                  <div className="h-3 bg-slate-200 rounded w-20 mx-auto md:mx-0"></div>
                                  <div className="h-6 bg-slate-200 rounded w-40 mx-auto md:mx-0"></div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* NOTES SECTION */}
                      {itineraryData.notes && (
                        <div className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-[2rem] border-l-4 border-[#0056D2] shadow-sm mt-8 group hover:shadow-md transition-all">
                          <div className="absolute top-0 right-0 p-6 opacity-10 text-[#0056D2] group-hover:scale-110 transition-transform duration-700">
                            <Info size={100} />
                          </div>
                          <h3 className="text-xs font-black text-[#0056D2] uppercase tracking-[0.2em] mb-4 flex items-center gap-2 relative z-10">
                            <Info size={16} strokeWidth={3} /> Lưu ý quan trọng
                          </h3>
                          <div className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-line relative z-10">
                            {itineraryData.notes.split("•").map((note: string, index: number) =>
                              note.trim() ? (
                                <p key={index} className="mb-2 pl-4 relative">
                                  <span className="absolute left-0 top-1.5 w-1.5 h-1.5 bg-[#0056D2] rounded-full"></span>
                                  {note.trim()}
                                </p>
                              ) : null
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {viewMode === "hotel" && hotelData && (
                    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                      {hotelData?.recommended_hotels && Array.isArray(hotelData.recommended_hotels) && hotelData.recommended_hotels.map((h: any, i: number) => (
                        <div key={i} className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-xl transition-all flex flex-col">
                          <div className="h-48 bg-slate-100 rounded-[2rem] mb-5 overflow-hidden relative">{h.details?.photos?.[0] ? (<img src={h.details.photos[0]} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt="hotel" />) : (<div className="w-full h-full flex items-center justify-center text-slate-300"><MapPin size={32} /></div>)}<div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-xl shadow-sm flex items-center gap-1"><Star className="fill-yellow-400 text-yellow-400" size={12} /><span className="text-[10px] font-black">4.8</span></div></div>
                          <h4 className="text-lg font-black mb-2 group-hover:text-[#0056D2] transition-colors uppercase italic tracking-tight">{h.details?.name || "Khách sạn cao cấp"}</h4>
                          <p className="text-[12px] text-slate-500 italic line-clamp-3 mb-6 leading-relaxed normal-case font-medium">{h.reasoning}</p>
                          <div className="mt-auto flex justify-between items-center pt-5 border-t border-slate-50"><div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Giá từ</p><p className="text-xl font-black text-[#0056D2] tracking-tighter">{h.details?.price_per_night?.toLocaleString() || "---"}đ</p></div><button onClick={() => handleBooking(h)} className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-[9px] font-black hover:bg-[#0056D2] transition-all uppercase italic shadow-lg">Đặt phòng</button></div>
                        </div>
                      ))}
                      {/* Show skeleton only if no data */}
                      {(!hotelData?.recommended_hotels || !Array.isArray(hotelData.recommended_hotels) || hotelData.recommended_hotels.length === 0) && (
                        // Loading skeleton
                        [1, 2].map((i) => (
                          <div key={`skeleton-${i}`} className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100 animate-pulse">
                            <div className="h-48 bg-slate-200 rounded-[2rem] mb-5"></div>
                            <div className="h-6 bg-slate-200 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-slate-200 rounded w-full mb-1"></div>
                            <div className="h-4 bg-slate-200 rounded w-2/3 mb-6"></div>
                            <div className="flex justify-between items-center pt-5 border-t border-slate-50">
                              <div className="h-8 bg-slate-200 rounded w-24"></div>
                              <div className="h-10 bg-slate-200 rounded-full w-28"></div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DETAIL MODAL (NGÀY) */}
            {selectedDayIdx !== null && itineraryData?.itinerary?.[selectedDayIdx] && (
              <div className="absolute inset-0 z-[250] bg-[#F8FAFB] flex flex-col md:flex-row animate-in slide-in-from-bottom duration-300">
                <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
                  <button onClick={() => setSelectedDayIdx(null)} className="mb-8 flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 text-[#0056D2] text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm hover:shadow-md"><ArrowLeft size={14} /> Quay lại danh sách</button>
                  <h2 className="text-4xl md:text-6xl font-black text-[#0056D2] italic tracking-tighter uppercase leading-none mb-2">NGÀY {selectedDayIdx + 1}</h2>
                  <p className="text-lg font-black uppercase tracking-[0.3em] text-slate-300 italic mb-10">{itineraryData.itinerary[selectedDayIdx].location}</p>

                  <div className="space-y-6 max-w-2xl">
                    {["morning", "afternoon", "evening"].map((session, sIdx) => {
                      const sessionName = sIdx === 0 ? "BUỔI SÁNG" : sIdx === 1 ? "BUỔI CHIỀU" : "BUỔI TỐI";
                      return (
                        <div key={sIdx} className="flex gap-6 p-6 bg-white rounded-[2.5rem] border border-slate-50 shadow-sm transition-all group">
                          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0056D2] shrink-0 group-hover:bg-[#0056D2] group-hover:text-white transition-colors">{sIdx === 0 ? <Sun size={24} /> : sIdx === 1 ? <Sunset size={24} /> : <Moon size={24} />}</div>
                          <div><p className="text-[10px] font-black text-slate-400 uppercase italic mb-1 tracking-[0.2em]">{sessionName}</p><p className="text-sm md:text-base font-bold italic text-slate-700 leading-relaxed normal-case">"{itineraryData.itinerary[selectedDayIdx][session]}"</p></div>
                        </div>
                      );
                    })}

                    {/* GIAO DIỆN BỮA ĂN */}
                    <div className="bg-[#0A0F1A] p-8 rounded-[3rem] shadow-xl mt-8 overflow-hidden relative group">
                      <div className="absolute top-0 right-0 p-8 opacity-5 text-white"><Utensils size={150} /></div>
                      <h4 className="text-[10px] font-black text-[#4ECDC4] uppercase tracking-[0.3em] mb-6 italic flex items-center gap-3 relative z-10">
                        <Utensils size={16} /> Ẩm thực địa phương
                      </h4>
                      <div className="space-y-3 relative z-10">
                        {itineraryData.itinerary[selectedDayIdx].meals?.map((meal: string, i: number) => (
                          <div
                            key={i}
                            onClick={() => openGoogleMaps(meal)}
                            className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/5 cursor-pointer transition-all duration-300 hover:bg-white/10 hover:pl-6 hover:shadow-[0_0_15px_rgba(78,205,196,0.3)] hover:border-[#4ECDC4]/50 group/meal"
                          >
                            <div className="w-8 h-8 rounded-full bg-[#4ECDC4]/20 text-[#4ECDC4] flex items-center justify-center shrink-0 font-black text-xs group-hover/meal:scale-110 transition-transform">
                              {i + 1}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-slate-200 leading-relaxed group-hover/meal:text-white transition-colors">{meal}</p>
                            </div>
                            <ExternalLink size={14} className="text-slate-500 opacity-0 group-hover/meal:opacity-100 transition-opacity" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ĐIỂM THAM QUAN NỔI BẬT */}
                    {itineraryData.itinerary[selectedDayIdx].attraction_recommendations && itineraryData.itinerary[selectedDayIdx].attraction_recommendations.length > 0 && (
                      <div className="mt-8">
                        <h4 className="text-[10px] font-black text-[#0056D2] uppercase tracking-[0.3em] mb-6 italic flex items-center gap-3">
                          <MapPin size={16} /> Điểm tham quan nổi bật
                        </h4>
                        <div className="grid gap-4">
                          {itineraryData.itinerary[selectedDayIdx].attraction_recommendations.map((attr: any, i: number) => {
                            let name = attr.reason?.split(/[.\-:]/)[0] || "Địa điểm tham quan";
                            name = name.split(/ mang | là | giúp | lý | có | được | để /)[0].trim();

                            return (
                              <div
                                key={i}
                                onClick={() => openGoogleMaps(name)}
                                className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group/attr"
                              >
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0056D2] flex items-center justify-center shrink-0 group-hover/attr:bg-[#0056D2] group-hover/attr:text-white transition-colors">
                                    <MapPin size={16} />
                                  </div>
                                  <h5 className="font-black text-slate-800 text-sm uppercase group-hover/attr:text-[#0056D2] transition-colors">{name}</h5>
                                  <ExternalLink size={12} className="ml-auto text-slate-300 group-hover/attr:text-[#0056D2]" />
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed pl-11">{attr.reason}</p>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <div className="md:hidden w-full h-[300px] rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm mt-8 relative">
                      <div className="absolute inset-0 w-full h-full">
                        <PlacesMapPane places={places.filter((p) => p.day === itineraryData.itinerary[selectedDayIdx!].date_)} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="hidden md:block w-2/5 border-l relative bg-slate-100">
                  <div className="absolute inset-0 w-full h-full">
                    <PlacesMapPane places={places.filter((p) => p.day === itineraryData.itinerary[selectedDayIdx!].date_)} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main >

      {/* FULL MAP */}
      {
        isMapModalOpen && (
          <div className="fixed inset-x-0 bottom-0 top-[68px] z-[10000] bg-white flex flex-col animate-in fade-in duration-300">
            <header className="h-[60px] md:h-[70px] bg-white border-b flex items-center justify-between px-6 shrink-0 shadow-md relative z-[10001]"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#0056D2]"><MapIcon size={20} /></div><h3 className="font-black italic uppercase tracking-widest text-[#0056D2] text-sm">Bản đồ</h3></div><button onClick={() => setIsMapModalOpen(false)} className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-500 transition-colors pointer-events-auto"><X size={20} /></button></header>
            <div className="flex-1 w-full h-full relative z-[10000]"><PlacesMapPane places={places} /></div>
          </div>
        )
      }
    </div >
  );
}

export default function VivuplanPremiumApp() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600">Đang tải...</div>
      </div>
    }>
      <VivuplanPremiumContent />
    </Suspense>
  );
}
