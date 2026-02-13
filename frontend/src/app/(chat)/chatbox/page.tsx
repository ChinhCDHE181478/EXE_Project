"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import PlacesMapPane, { UiPlace } from "./PlacesMapPane";

const API_BASE = process.env.NEXT_PUBLIC_AGENT_API!;
const SPRING_BOOT_API = process.env.NEXT_PUBLIC_API_URL!;

/** ====== GÓI THẬT THEO DATA BẠN CUNG CẤP ====== */
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

/** Fetch helper: đọc text trước, parse JSON nếu được (tránh lỗi Unexpected token ...) */
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

export default function VivuplanPremiumApp() {
  const router = useRouter();

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

  // prompt mẫu
  const [promptForm, setPromptForm] = useState({
    destination: "",
    duration: "",
    budget: "",
    companions: "",
    interests: "",
  });

  /** ====== AUTH / SUBSCRIPTION / PAYWALL ====== */
  const [isAuthed, setIsAuthed] = useState(false);

  // CHỐT UID HỢP LỆ (lấy đúng uid đã dùng được ở history/conversation)
  const [resolvedUserId, setResolvedUserId] = useState<number | null>(null);

  const [showLoginGate, setShowLoginGate] = useState(false);
  const [allowGuestDemo, setAllowGuestDemo] = useState(false);

  const [subStatus, setSubStatus] = useState<SubStatus>({
    active: false,
    packageCode: null,
  });

  const [showPaywall, setShowPaywall] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  /** ====== HELPERS ====== */
  const newSessionId = () => {
    try {
      // @ts-ignore
      if (typeof crypto !== "undefined" && crypto?.randomUUID) return crypto.randomUUID();
    } catch {}
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  /** Lấy userId dùng cho conversation/history:
   * - Nếu có token: decode uid
   * - Nếu guest demo: dùng "1" (hoặc user demo) để backend khỏi 500 (NHƯNG purchase KHÔNG DÙNG CÁI NÀY)
   */
  const getConversationUserId = () => {
    if (typeof window === "undefined") return null;

    const token = getTokenFromStorage();
    if (token) {
      const payload = decodeJwtPayload(token);
      const uidFromToken = extractUserIdFromPayload(payload);
      if (uidFromToken) return uidFromToken;
    }

    const uidFromStorage = getStoredUserId();
    if (uidFromStorage) return uidFromStorage;

    // Guest demo: dùng 1 để tránh backend crash. (Chỉ để tạo demo 1 lần)
    if (!token && allowGuestDemo) return "1";
    return null;
  };

  /** Purchase / status bắt buộc phải có UID thật đã chốt được */
  const requireResolvedUid = () => {
    if (!resolvedUserId || resolvedUserId <= 0) return null;
    return resolvedUserId;
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

  /** ====== LOCK RULE ======
   * - Nếu đã active subscription => không lock
   * - Nếu chưa login và chưa chọn demo => lock (show login modal)
   * - Nếu demo: cho tạo 1 lần khi chưa có gì; sau khi có kết quả => lock + paywall
   * - Nếu login nhưng chưa mua: nếu đã có kết quả => lock + paywall
   */
  const shouldLockContent = useMemo(() => {
    if (subStatus.active) return false;

    const hasAnyResult = Boolean(itineraryData || hotelData);
    const hasAnyMsg = messages.length > 0;
    const hasAnyHistory = chatHistory.length > 0;

    const isFirstTime = !hasAnyHistory && !hasAnyMsg && !hasAnyResult;

    if (!isAuthed && !allowGuestDemo) return true; // chưa login, chưa demo
    if (isFirstTime) return false; // cho tạo lần đầu (demo hoặc login)

    // đã có kết quả mà chưa active => lock
    return true;
  }, [
    subStatus.active,
    isAuthed,
    allowGuestDemo,
    itineraryData,
    hotelData,
    messages.length,
    chatHistory.length,
  ]);

  /** ====== API: HISTORY ====== */
  const loadHistory = async () => {
    try {
      // Nếu có token => login => mới load history
      if (!getTokenFromStorage()) {
        setChatHistory([]);
        return;
      }

      const uidForHistory = getConversationUserId();
      if (!uidForHistory) {
        setResolvedUserId(null);
        setChatHistory([]);
        return;
      }
      const { res, json, text } = await fetchJsonSafe(
        `${API_BASE}/conversation/history/${uidForHistory}?page=1&page_size=30`
      );

      if (!res.ok) {
        console.error("history not ok:", res.status, text);
        setChatHistory([]);
        return;
      }

      // ✅ CHỐT UID HỢP LỆ khi history OK
      const uidNum = Number(uidForHistory);
      if (Number.isFinite(uidNum) && uidNum > 0) setResolvedUserId(uidNum);

      const dataH = json ?? {};
      if (dataH?.data) {
        const sorted = [...dataH.data].sort(
          (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setChatHistory(sorted);
      } else {
        setChatHistory([]);
      }
    } catch (e) {
      console.error(e);
      setChatHistory([]);
    }
  };

  const handleSelectChat = async (sid: string) => {
    try {
      setIsLoading(true);
      setSelectedDayIdx(null);
      setActiveId(sid);
      setViewMode("chat");

      const { res, json, text } = await fetchJsonSafe(`${API_BASE}/conversation/${sid}`);
      if (!res.ok) {
        console.error("conversation not ok:", res.status, text);
        return;
      }

      const dataD = json ?? {};
      setMessages(
        (dataD?.messages || []).map((m: any) => ({
          role: m.role === "user" ? "user" : "ai",
          content: m.parts?.[0]?.text || "",
        }))
      );
      setItineraryData(dataD?.itinerary || null);
      setHotelData(dataD?.hotel_recommendation || null);
      setIsSidebarOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setActiveId(newSessionId());
    setMessages([]);
    setItineraryData(null);
    setHotelData(null);
    setInputText("");
    setSelectedDayIdx(null);
    setViewMode("chat");
    setIsSidebarOpen(false);
  };

  /** ====== API: SUBSCRIPTION STATUS ====== */
  const fetchSubscriptionStatus = async () => {
    const uid = requireResolvedUid();
    if (!uid) return { active: false, packageCode: null };

    try {
      const { res, json, text } = await fetchJsonSafe(
        `${SPRING_BOOT_API}/subscriptions/status?userId=${encodeURIComponent(String(uid))}`
      );

      if (!res.ok) {
        console.error("status api not ok:", res.status, text);
        setSubStatus({ active: false, packageCode: null, raw: text });
        return { active: false, packageCode: null };
      }

      const data = json ?? {};
      const result = data?.result ?? data;

      const active =
        Boolean(result?.active) ||
        Boolean(result?.isActive) ||
        String(result?.status || "").toLowerCase() === "active" ||
        Boolean(result?.valid);

      const packageCode = result?.packageCode ?? result?.package_code ?? result?.plan ?? null;

      setSubStatus({ active, packageCode, raw: data });
      return { active, packageCode };
    } catch (e) {
      console.error("fetchSubscriptionStatus error:", e);
      setSubStatus({ active: false, packageCode: null, raw: null });
      return { active: false, packageCode: null };
    }
  };

  /** ====== API: PURCHASE (DÙNG ĐÚNG checkoutUrl) ====== */
  const purchaseSubscription = async (packageCode: string) => {
    const uid = requireResolvedUid();

    // Nếu chưa chốt uid => coi như chưa login chuẩn
    if (!uid) {
      setShowLoginGate(true);
      return;
    }

    setIsPurchasing(true);
    try {
      const { res, json, text } = await fetchJsonSafe(`${SPRING_BOOT_API}/subscriptions/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json", accept: "*/*" },
        body: JSON.stringify({ userId: uid, packageCode }),
      });

      if (!res.ok) {
        console.error("purchase not ok:", res.status, text);
        alert("Không tạo được link thanh toán. Xem console để biết chi tiết.");
        return;
      }

      const data = json ?? {};
      if (data?.status !== "success") {
        console.error("purchase status not success:", data);
        alert(data?.message || "Không tạo được link thanh toán.");
        return;
      }

      // ✅ ĐÚNG CÁI BẠN CẦN
      const checkoutUrl = data?.result?.checkoutUrl;
      if (!checkoutUrl) {
        console.error("missing checkoutUrl:", data);
        alert("Không tìm thấy checkoutUrl trong response.");
        return;
      }

      window.open(checkoutUrl, "_blank");
    } catch (e) {
      console.error(e);
      alert("Lỗi tạo link thanh toán. Vui lòng thử lại.");
    } finally {
      setIsPurchasing(false);
    }
  };

  /** ====== BOOKING (GIỮ NGUYÊN) ====== */
  const handleBooking = async (hotel: any) => {
    try {
      const hotelId = hotel.place_id || hotel.details?.id || "11814601";
      const queryParams = new URLSearchParams({
        hotelId: hotelId,
        arrivalDate: "2026-03-03",
        departureDate: "2026-03-05",
        adults: "2",
        childrenAge: "",
        languagecode: "vi",
        currencyCode: "VND",
      });

      const { res, json, text } = await fetchJsonSafe(
        `${SPRING_BOOT_API}/hotel/link?${queryParams.toString()}`
      );

      if (!res.ok) {
        console.error("hotel link not ok:", res.status, text);
        alert("Lỗi lấy link đặt phòng.");
        return;
      }

      const data = json ?? {};
      if (data.result) window.open(data.result, "_blank");
      else alert("Hiện tại không lấy được link đặt phòng. Vui lòng thử lại sau.");
    } catch (error) {
      console.error("Booking error:", error);
      alert("Lỗi kết nối đến server Spring Boot (8080).");
    }
  };

  /** ====== MAP PLACES (GIỮ NGUYÊN) ====== */
  const places: UiPlace[] = useMemo(() => {
    if (!itineraryData?.itinerary) return [];
    const out: UiPlace[] = [];
    itineraryData.itinerary.forEach((day: any) => {
      const items = [...(day.attraction_recommendations || []), ...(day.restaurant_recommendations || [])];
      items.forEach((item: any) => {
        let shortName = item.reason?.split(/[.\-:]/)[0] || "Địa điểm";
        shortName = shortName.split(/ mang | là | giúp | lý | có | được | để /)[0].trim();

        out.push({
          id: item.place_id,
          place_id: item.place_id,
          name: shortName,
          kind: item.reason?.toLowerCase().includes("ăn") ? "restaurant" : "attraction",
          day: day.date_,
          lat: 20.25 + Math.random() * 0.1,
          lng: 105.97 + Math.random() * 0.1,
          reason: item.reason,
        });
      });
    });
    return out;
  }, [itineraryData]);

  /** ====== SEND ====== */
  const executeSend = async (text: string) => {
    if (!text || isLoading) return;

    // chưa login & chưa demo => hiện modal login
    if (!isAuthed && !allowGuestDemo) {
      setShowLoginGate(true);
      return;
    }

    // đã có kết quả mà chưa mua => paywall
    if (shouldLockContent) {
      setShowPaywall(true);
      return;
    }

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInputText("");
    setIsLoading(true);

    const sid = activeId || newSessionId();
    if (!activeId) setActiveId(sid);

    try {
      const uid = getConversationUserId(); // user id dùng cho conversation
      if (!uid) {
        setIsAuthed(false);
        setShowLoginGate(true);
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: "Khong xac dinh duoc tai khoan. Vui long dang nhap lai." },
        ]);
        return;
      }

      const { res, json, text: raw } = await fetchJsonSafe(`${API_BASE}/conversation/response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sid, user_id: uid, content: text }),
      });

      if (!res.ok) {
        console.error("response not ok:", res.status, raw);
        setMessages((prev) => [...prev, { role: "ai", content: "Lỗi server (response)." }]);
        return;
      }

      const data = json ?? {};
      const aiText = data?.content || data?.reply || data?.message || "Đã cập nhật thông tin.";
      setMessages((prev) => [...prev, { role: "ai", content: aiText }]);

      // lấy details session
      const d = await fetchJsonSafe(`${API_BASE}/conversation/${sid}`);
      if (d.res.ok) {
        const dataD = d.json ?? {};
        if (dataD?.itinerary) setItineraryData(dataD.itinerary);
        if (dataD?.hotel_recommendation) setHotelData(dataD.hotel_recommendation);
      }

      // nếu login => load history + chốt uid
      await loadHistory();

      // nếu chưa active => sau khi tạo xong lần demo -> paywall
      if (!subStatus.active) setShowPaywall(true);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [...prev, { role: "ai", content: "Lỗi kết nối server." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => executeSend(inputText.trim());

  const handlePromptSubmit = () => {
    const parts: string[] = [];
    if (promptForm.destination) parts.push(`Lập lịch trình đi ${promptForm.destination}`);
    if (promptForm.duration) parts.push(`trong ${promptForm.duration}`);
    if (promptForm.budget) parts.push(`ngân sách ${promptForm.budget}`);
    if (promptForm.companions) parts.push(`đi cùng ${promptForm.companions}`);
    if (promptForm.interests) parts.push(`. Sở thích: ${promptForm.interests}`);

    const finalPrompt = parts.join(", ");
    if (finalPrompt) {
      executeSend(finalPrompt);
      setIsPromptPopoverOpen(false);
      setPromptForm({ destination: "", duration: "", budget: "", companions: "", interests: "" });
    }
  };

  const resetToLoggedOutState = () => {
    setIsAuthed(false);
    setResolvedUserId(null);
    setAllowGuestDemo(false);
    setShowLoginGate(true);
    setShowPaywall(false);
    setChatHistory([]);
    setMessages([]);
    setItineraryData(null);
    setHotelData(null);
    setInputText("");
    setSelectedDayIdx(null);
    setViewMode("chat");
    setSubStatus({ active: false, packageCode: null });
    setActiveId(newSessionId());
  };

  /** ====== INIT ====== */
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  useEffect(() => {
    if (!mounted) return;

    const token = getTokenFromStorage();
    if (!token) {
      resetToLoggedOutState();
      return;
    }

    // đã login
    setIsAuthed(true);
    setShowLoginGate(false);
    setAllowGuestDemo(false);
    setActiveId(newSessionId());

    // load history sẽ chốt resolvedUserId
    loadHistory();
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;

    const onLogout = () => resetToLoggedOutState();
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      const watchedKeys = ["access_token", "refresh_token", "token", "vivuplan_user"];
      if (!watchedKeys.includes(e.key)) return;
      if (!getTokenFromStorage()) onLogout();
    };

    window.addEventListener("logout", onLogout);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("logout", onLogout);
      window.removeEventListener("storage", onStorage);
    };
  }, [mounted]);

  // Khi đã chốt uid => check subscription
  useEffect(() => {
    if (!resolvedUserId) return;
    fetchSubscriptionStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedUserId]);

  /** ====== MODALS ====== */
  const LoginGateModal = () => (
    <div className="fixed inset-0 z-[20000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0056D2] flex items-center justify-center">
              <ShieldAlert size={20} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">Bạn chưa đăng nhập</p>
              <p className="text-[11px] text-slate-500 font-medium">
                Hãy đăng nhập để lưu lịch sử & mua gói.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowLoginGate(false)}
            className="p-2 text-slate-300 hover:text-slate-600"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <button
            onClick={() => router.push("/pages/login?next=/")}
            className="w-full py-3 rounded-2xl bg-[#0056D2] text-white font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-[0.99] transition"
          >
            <LogIn size={16} /> Đăng nhập
          </button>

          {/* <button
            onClick={() => {
              setAllowGuestDemo(true);
              setShowLoginGate(false);
              setChatHistory([]); // guest: rỗng
              handleNewChat();
            }}
            className="w-full py-3 rounded-2xl bg-slate-100 text-slate-700 font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 active:scale-[0.99] transition"
          >
            <Sparkles size={16} /> Dùng thử 1 lần (Demo)
          </button> */}

          <p className="text-[10px] text-slate-400 leading-relaxed">
            * Demo cho phép tạo 1 lịch trình. Sau đó cần mua gói hoặc đăng nhập để xem đầy đủ.
          </p>
        </div>
      </div>
    </div>
  );

  const PaywallModal = () => (
    <div className="fixed inset-0 z-[21000] bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#0056D2] text-white flex items-center justify-center shadow">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Mở khoá Vivuplan AI</h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {subStatus.active
                  ? `Đang kích hoạt: ${subStatus.packageCode || "Premium"}`
                  : "Bạn chưa kích hoạt gói."}
              </p>
            </div>
          </div>
          <button onClick={() => setShowPaywall(false)} className="p-2 text-slate-300 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {!isAuthed && (
            <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3">
              <div className="text-amber-600 mt-0.5"><ShieldAlert size={18} /></div>
              <div>
                <p className="text-sm font-black text-amber-900">Bạn chưa đăng nhập</p>
                <p className="text-[11px] text-amber-800 font-medium">
                  Đăng nhập để mua gói và lưu lịch sử vào tài khoản.
                </p>
                <button
                  onClick={() => router.push("/login")}
                  className="mt-3 px-4 py-2 rounded-xl bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-amber-700"
                >
                  Đăng nhập
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SUB_PACKAGES.map((p) => (
              <div key={p.id} className="rounded-[2rem] border border-slate-100 p-5 bg-white shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#0056D2]">{p.name}</p>
                  <div className="text-slate-400"><CreditCard size={16} /></div>
                </div>
                <p className="mt-2 text-3xl font-black tracking-tighter text-slate-900">
                  {formatVND(p.price)}
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-2">
                  Thời hạn: {p.days} ngày
                </p>

                <button
                  disabled={!isAuthed || isPurchasing || !requireResolvedUid()}
                  onClick={() => purchaseSubscription(p.packageCode)}
                  className={`mt-5 w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition
                    ${(!isAuthed || isPurchasing || !requireResolvedUid())
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-[#0056D2] text-white hover:bg-blue-700"}`}
                >
                  {isPurchasing ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
                  {isAuthed ? "Mua gói" : "Cần đăng nhập"}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <button
              onClick={async () => {
                const uid = requireResolvedUid();
                if (!uid) return;
                const st = await fetchSubscriptionStatus();
                if (st.active) {
                  alert("Đã kích hoạt gói thành công!");
                  setShowPaywall(false);
                } else {
                  alert("Chưa thấy gói active. Nếu vừa thanh toán, hãy thử lại sau ít giây.");
                }
              }}
              disabled={!isAuthed || !requireResolvedUid()}
              className="px-5 py-3 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition disabled:opacity-50"
            >
              Tôi đã thanh toán → Kiểm tra lại
            </button>

            <button
              onClick={() => setShowPaywall(false)}
              className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition"
            >
              Để sau
            </button>
          </div>

          <p className="mt-4 text-[10px] text-slate-400">
            * Sau khi thanh toán PayOS, bấm “Kiểm tra lại” để mở khoá.
          </p>
        </div>
      </div>
    </div>
  );

  const BlurLockLayer = () => (
    <div className="absolute inset-0 z-[150] pointer-events-auto">
      <div className="absolute inset-0 bg-white/40 backdrop-blur-[6px]" />
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0056D2] mx-auto flex items-center justify-center">
            <Lock size={22} />
          </div>
          <h4 className="mt-3 text-lg font-black text-slate-900">Nội dung đã bị khoá</h4>
          <p className="mt-1 text-[11px] text-slate-500 font-medium">
            {isAuthed
              ? "Mua gói để xem đầy đủ lịch trình và mở khoá Premium."
              : "Hãy đăng nhập hoặc mua gói để tiếp tục."}
          </p>
          <div className="mt-4 flex gap-2 justify-center">
            {!isAuthed ? (
              <button
                onClick={() => router.push("/login")}
                className="px-5 py-3 rounded-2xl bg-[#0056D2] text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700"
              >
                Đăng nhập
              </button>
            ) : (
              <button
                onClick={() => setShowPaywall(true)}
                className="px-5 py-3 rounded-2xl bg-[#0056D2] text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700"
              >
                Mua gói
              </button>
            )}
            {/* <button
              onClick={() => setShowPaywall(true)}
              className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200"
            >
              Xem gói
            </button> */}
          </div>
        </div>
      </div>
    </div>
  );

  /** ====== UI ====== */
  if (!mounted) return null;

  return (
    <div className="fixed inset-0 top-[68px] w-screen h-[calc(100dvh-68px)] bg-white text-slate-900 font-sans flex overflow-hidden text-sm shadow-inner">
      {showLoginGate && <LoginGateModal />}
      {showPaywall && <PaywallModal />}

      {/* 1. SIDEBAR */}
      <aside
        className={`absolute md:relative inset-y-0 left-0 z-[3000] w-[280px] bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 shadow-2xl md:shadow-none ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-5 h-[60px] md:h-[70px] border-b flex items-center shrink-0 justify-between">
          <img src="/brand/logo.png" className="h-6 w-auto" alt="Vivuplan" />
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-slate-400 p-2 hover:bg-slate-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={handleNewChat}
            className="w-full py-3 bg-[#0056D2] text-white rounded-xl text-[11px] font-black flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all"
          >
            <PlusCircle size={16} /> Chuyến đi mới
          </button>

          {/* <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tài khoản</p>
            <p className="text-[11px] font-bold text-slate-700 mt-1">
              {isAuthed ? `Đã đăng nhập (uid: ${resolvedUserId ?? "..."})` : allowGuestDemo ? "Demo (khách)" : "Chưa đăng nhập"}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              {subStatus.active ? `Gói: ${subStatus.packageCode || "Premium"}` : "Gói: Chưa kích hoạt"}
            </p>
          </div> */}
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5 custom-scrollbar">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2 px-2 mt-2">
            <History size={12} /> Lịch sử gần đây
          </p>

          {chatHistory.length > 0 ? (
            chatHistory.map((chat) => (
              <button
                key={chat.session_id}
                onClick={() => handleSelectChat(chat.session_id)}
                className={`w-full text-left p-3 rounded-lg text-[11px] flex items-center gap-3 transition-all ${
                  activeId === chat.session_id
                    ? "bg-blue-50 text-[#0056D2] font-bold border border-blue-100"
                    : "hover:bg-slate-50 text-slate-600 border border-transparent"
                }`}
              >
                <MessageSquare
                  size={14}
                  className={`shrink-0 ${
                    activeId === chat.session_id ? "opacity-100 text-[#0056D2]" : "opacity-40"
                  }`}
                />
                <span className="truncate flex-1">{chat.title || `Trip ${chat.session_id.substring(0, 8)}`}</span>
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-[10px] text-slate-300 italic">
              {isAuthed ? "Chưa có lịch sử" : "Đăng nhập để xem lịch sử"}
            </div>
          )}
        </div>
      </aside>

      {isSidebarOpen && (
        <div
          className="absolute inset-0 bg-black/40 z-[2999] backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 2. MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative bg-[#FDFDFD] min-w-0 overflow-hidden">
        <header className="md:hidden h-[60px] border-b bg-white flex items-center justify-between px-4 shrink-0 z-[40] relative">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-[#0056D2] hover:bg-blue-50 rounded-lg"
            >
              <Menu size={22} />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xs font-black uppercase tracking-widest text-[#0056D2]">Vivuplan AI</h1>
              <p className="text-[9px] text-slate-400 font-bold italic">Trợ lý du lịch cá nhân</p>
            </div>
          </div>
        </header>

        <div className="relative flex-1 overflow-hidden flex flex-col">
          {shouldLockContent && <BlurLockLayer />}

          <div className={`flex-1 flex flex-col overflow-hidden ${shouldLockContent ? "pointer-events-none" : ""}`}>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
              {messages.length === 0 && !isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto py-10">
                  <div className="w-16 h-16 bg-blue-50 rounded-[2rem] flex items-center justify-center text-[#0056D2] animate-bounce shadow-lg shadow-blue-50">
                    <Sparkles size={32} />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black italic tracking-tighter uppercase mb-2 text-[#0056D2]">Xin chào!</h2>
                    <p className="text-xs text-slate-400 font-medium italic px-4">
                      Bắt đầu chuyến đi trong mơ của bạn ngay bây giờ.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full px-4">
                    {["Đà Lạt 3N2Đ", "Huế ăn gì?", "Resort Nha Trang"].map((t, i) => (
                      <button
                        key={i}
                        onClick={() => setInputText(t)}
                        className="p-3 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-blue-50 hover:text-[#0056D2] hover:border-blue-100 transition-all text-left"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto w-full space-y-6 pb-4">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}>
                      <div
                        className={`max-w-[90%] md:max-w-[85%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                          m.role === "user"
                            ? "bg-[#0056D2] text-white rounded-tr-none"
                            : "bg-white text-slate-700 border border-slate-100 rounded-tl-none font-medium"
                        }`}
                      >
                        {String(m.content || "").replace(/\{"type":.*?\}/g, "")}
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-blue-50 p-4 rounded-2xl rounded-tl-none shadow-md flex items-center gap-3">
                        <Loader2 size={16} className="animate-spin text-[#0056D2]" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#0056D2]">
                          Đang xử lý...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="bg-white border-t border-slate-50 shrink-0 relative z-20 flex flex-col">
              {(itineraryData || hotelData) && (
                <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar justify-center border-b border-slate-50 bg-slate-50/50">
                  {itineraryData && (
                    <button
                      onClick={() => setViewMode("itinerary")}
                      className="flex items-center gap-2 px-5 py-2 bg-[#0056D2] text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-blue-700 active:scale-95 transition-all whitespace-nowrap"
                    >
                      <Calendar size={14} /> Xem Lịch Trình
                    </button>
                  )}
                  {hotelData && (
                    <button
                      onClick={() => setViewMode("hotel")}
                      className="flex items-center gap-2 px-5 py-2 bg-cyan-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-cyan-600 active:scale-95 transition-all whitespace-nowrap"
                    >
                      <Hotel size={14} /> Xem Khách sạn
                    </button>
                  )}
                </div>
              )}

              <div className="p-3 md:p-6 relative">
                {isPromptPopoverOpen && (
                  <div className="absolute bottom-full left-0 w-full px-3 md:px-6 pb-2 animate-in slide-in-from-bottom-4 fade-in duration-300 z-50">
                    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 md:p-5 relative">
                      <button
                        onClick={() => setIsPromptPopoverOpen(false)}
                        className="absolute top-3 right-3 p-1 text-slate-300 hover:text-red-500"
                      >
                        <X size={16} />
                      </button>

                      <h3 className="text-xs font-black italic uppercase tracking-widest text-[#0056D2] mb-3 flex items-center gap-2">
                        <Sparkle size={14} /> Tạo yêu cầu nhanh
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="md:col-span-2">
                          <input
                            value={promptForm.destination}
                            onChange={(e) => setPromptForm({ ...promptForm, destination: e.target.value })}
                            className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-bold"
                            placeholder="Đi đâu? (VD: Đà Lạt)"
                          />
                        </div>
                        <input
                          value={promptForm.duration}
                          onChange={(e) => setPromptForm({ ...promptForm, duration: e.target.value })}
                          className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-bold"
                          placeholder="Mấy ngày? (VD: 3N2Đ)"
                        />
                        <input
                          value={promptForm.budget}
                          onChange={(e) => setPromptForm({ ...promptForm, budget: e.target.value })}
                          className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-bold"
                          placeholder="Ngân sách? (VD: 5tr)"
                        />
                        <input
                          value={promptForm.companions}
                          onChange={(e) => setPromptForm({ ...promptForm, companions: e.target.value })}
                          className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-bold"
                          placeholder="Đi cùng ai?"
                        />
                        <input
                          value={promptForm.interests}
                          onChange={(e) => setPromptForm({ ...promptForm, interests: e.target.value })}
                          className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-bold"
                          placeholder="Sở thích? (Ăn uống, chụp ảnh...)"
                        />
                      </div>

                      <button
                        onClick={handlePromptSubmit}
                        className="w-full mt-3 bg-[#0056D2] text-white py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-md active:scale-95 transition-all"
                      >
                        Tạo lịch trình
                      </button>
                    </div>
                  </div>
                )}

                <div className="max-w-3xl mx-auto flex items-end gap-2">
                  <button
                    onClick={() => setIsPromptPopoverOpen(!isPromptPopoverOpen)}
                    className={`h-12 w-12 md:h-14 md:w-14 rounded-2xl flex flex-col items-center justify-center transition-all shrink-0 border ${
                      isPromptPopoverOpen ? "bg-blue-50 border-blue-200 text-[#0056D2]" : "bg-slate-50 border-transparent text-slate-400 hover:text-[#0056D2]"
                    }`}
                    title="Tạo mẫu"
                  >
                    <FilePenLine size={18} />
                    <span className="text-[8px] font-black uppercase mt-0.5">Mẫu</span>
                  </button>

                  <div className="relative flex-1">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      className="w-full bg-slate-50 border-none rounded-2xl p-4 pr-12 text-[13px] h-12 md:h-14 resize-none outline-none focus:bg-white focus:ring-1 focus:ring-blue-200 transition-all font-medium shadow-inner"
                      placeholder="Nhập yêu cầu..."
                    />
                    <button
                      onClick={handleSend}
                      disabled={isLoading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-[#0056D2] text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>

                {!subStatus.active && (
                  <div className="max-w-3xl mx-auto mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Chưa kích hoạt gói — tạo xong sẽ yêu cầu mua gói.</span>
                    <button onClick={() => setShowPaywall(true)} className="text-[#0056D2] font-black hover:underline">
                      Xem gói
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ITINERARY/HOTEL OVERLAY */}
            {(viewMode === "itinerary" || viewMode === "hotel") && (
              <div className="absolute inset-0 z-[200] bg-[#F8FAFB] flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
                <div className="h-[60px] md:h-[70px] bg-white border-b flex items-center justify-between px-4 shrink-0 shadow-sm z-[210]">
                  <button
                    onClick={() => setViewMode("chat")}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-[#0056D2] hover:text-white transition-all group border border-slate-200"
                  >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Quay lại Chat
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="hidden md:inline text-[10px] font-black uppercase tracking-[0.2em] text-[#0056D2] opacity-60">
                      {viewMode === "itinerary" ? "LỊCH TRÌNH CHI TIẾT" : "KHÁCH SẠN ĐỀ XUẤT"}
                    </span>
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-[#0056D2]">
                      {viewMode === "itinerary" ? <Calendar size={16} /> : <Hotel size={16} />}
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
                  {viewMode === "itinerary" && itineraryData && (
                    <div className="space-y-8 max-w-5xl mx-auto">
                      <section className="relative h-[200px] md:h-[300px] rounded-[2rem] overflow-hidden shadow-xl">
                        <img
                          src={getBannerPhoto(itineraryData?.trip_summary?.destinations?.[0])}
                          className="w-full h-full object-cover"
                          alt="banner"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <h1 className="absolute bottom-6 left-6 text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter">
                          {itineraryData?.trip_summary?.destinations?.[0]}
                        </h1>
                      </section>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        <div className="md:col-span-2 bg-white p-2 rounded-[2rem] shadow-lg border border-slate-100 h-[350px] relative overflow-hidden group">
                          <PlacesMapPane places={places} />
                          <button
                            onClick={() => setIsMapModalOpen(true)}
                            className="absolute bottom-4 right-4 px-5 py-2.5 bg-white text-[#0056D2] rounded-full text-[9px] font-black shadow-xl flex items-center gap-2 uppercase tracking-widest hover:bg-[#0056D2] hover:text-white transition-all z-20 italic border border-slate-100"
                          >
                            <Maximize2 size={12} /> Mở rộng bản đồ
                          </button>
                        </div>

                        <div className="bg-[#0056D2] p-6 rounded-[2rem] shadow-xl text-white flex flex-col justify-center relative overflow-hidden">
                          <div className="absolute -right-6 -top-6 opacity-10"><Wallet size={150} /></div>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2 italic">
                            Tổng ngân sách
                          </p>
                          <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter mb-4">
                            {formatVND(totalCost)}
                          </h2>
                          <div className="w-10 h-0.5 bg-white/30 mb-4" />
                          <p className="text-[11px] font-medium italic opacity-80 leading-relaxed">
                            Chi phí ước tính bao gồm ăn uống, vé tham quan và di chuyển.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h2 className="text-base font-black italic tracking-widest text-[#0056D2] uppercase px-2 flex items-center gap-3">
                          <div className="w-6 h-[3px] bg-[#0056D2]" /> CHI TIẾT LỘ TRÌNH
                        </h2>

                        <div className="grid grid-cols-1 gap-4">
                          {itineraryData.itinerary.map((day: any, idx: number) => (
                            <div
                              key={idx}
                              onClick={() => setSelectedDayIdx(idx)}
                              className="bg-white p-5 md:p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-4 md:gap-8 cursor-pointer hover:shadow-xl hover:border-blue-100 transition-all group"
                            >
                              <div className="w-full md:w-32 h-16 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-[#0056D2] transition-all">
                                <p className="text-[11px] font-black text-slate-400 group-hover:text-white uppercase italic">
                                  NGÀY {idx + 1}
                                </p>
                              </div>
                              <div className="flex-1 text-center md:text-left">
                                <span className="text-[9px] font-black text-[#0056D2] block mb-1 uppercase tracking-widest">
                                  {day.date_}
                                </span>
                                <h3 className="text-lg md:text-xl font-black italic uppercase tracking-tight group-hover:text-[#0056D2] transition-colors">
                                  {day.location}
                                </h3>
                              </div>
                              <ChevronRight className="text-slate-300 group-hover:text-[#0056D2] transition-all hidden md:block" size={20} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {viewMode === "hotel" && hotelData && (
                    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                      {hotelData.recommended_hotels?.map((h: any, i: number) => (
                        <div key={i} className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-xl transition-all flex flex-col">
                          <div className="h-48 bg-slate-100 rounded-[2rem] mb-5 overflow-hidden relative">
                            {h.details?.photos?.[0] ? (
                              <img
                                src={h.details.photos[0]}
                                className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700"
                                alt="hotel"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300"><MapPin size={32} /></div>
                            )}
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-xl shadow-sm flex items-center gap-1">
                              <Star className="fill-yellow-400 text-yellow-400" size={12} />
                              <span className="text-[10px] font-black">4.8</span>
                            </div>
                          </div>

                          <h4 className="text-lg font-black mb-2 group-hover:text-[#0056D2] transition-colors uppercase italic tracking-tight">
                            {h.details?.name || "Khách sạn cao cấp"}
                          </h4>
                          <p className="text-[12px] text-slate-500 italic line-clamp-3 mb-6 leading-relaxed normal-case font-medium">
                            {h.reasoning}
                          </p>

                          <div className="mt-auto flex justify-between items-center pt-5 border-t border-slate-50">
                            <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Giá từ</p>
                              <p className="text-xl font-black text-[#0056D2] tracking-tighter">
                                {h.details?.price_per_night?.toLocaleString() || "---"}đ
                              </p>
                            </div>
                            <button
                              onClick={() => handleBooking(h)}
                              className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-[9px] font-black hover:bg-[#0056D2] transition-all uppercase italic shadow-lg"
                            >
                              Đặt phòng
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 3. MODAL CHI TIẾT NGÀY */}
          {selectedDayIdx !== null && itineraryData?.itinerary?.[selectedDayIdx] && (
            <div className="absolute inset-0 z-[250] bg-[#F8FAFB] flex flex-col md:flex-row animate-in slide-in-from-bottom duration-300">
              <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
                <button
                  onClick={() => setSelectedDayIdx(null)}
                  className="mb-8 flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 text-[#0056D2] text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm hover:shadow-md"
                >
                  <ArrowLeft size={14} /> Quay lại danh sách
                </button>

                <h2 className="text-4xl md:text-6xl font-black text-[#0056D2] italic tracking-tighter uppercase leading-none mb-2">
                  NGÀY {selectedDayIdx + 1}
                </h2>
                <p className="text-lg font-black uppercase tracking-[0.3em] text-slate-300 italic mb-10">
                  {itineraryData.itinerary[selectedDayIdx].location}
                </p>

                <div className="space-y-6 max-w-2xl">
                  {["morning", "afternoon", "evening"].map((session, sIdx) => {
                    const sessionName = sIdx === 0 ? "BUỔI SÁNG" : sIdx === 1 ? "BUỔI CHIỀU" : "BUỔI TỐI";
                    return (
                      <div key={sIdx} className="flex gap-6 p-6 bg-white rounded-[2.5rem] border border-slate-50 shadow-sm transition-all group">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0056D2] shrink-0 group-hover:bg-[#0056D2] group-hover:text-white transition-colors">
                          {sIdx === 0 ? <Sun size={24} /> : sIdx === 1 ? <Sunset size={24} /> : <Moon size={24} />}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase italic mb-1 tracking-[0.2em]">
                            {sessionName}
                          </p>
                          <p className="text-sm md:text-base font-bold italic text-slate-700 leading-relaxed normal-case">
                            "{itineraryData.itinerary[selectedDayIdx][session]}"
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  <div className="bg-[#0A0F1A] p-8 rounded-[3rem] text-white relative overflow-hidden shadow-xl mt-8">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><Utensils size={150} /></div>
                    <h4 className="text-[10px] font-black text-[#4ECDC4] uppercase tracking-[0.3em] mb-6 italic flex items-center gap-3 relative z-10">
                      <Utensils size={16} /> Ẩm thực địa phương
                    </h4>
                    <div className="space-y-4 relative z-10">
                      {itineraryData.itinerary[selectedDayIdx].meals?.map((meal: string, i: number) => (
                        <div key={i} className="pl-4 border-l-2 border-[#4ECDC4]/30">
                          <p className="text-base font-black text-slate-100 italic uppercase tracking-tight">{meal}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="md:hidden w-full h-[300px] rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm mt-8">
                    <PlacesMapPane places={places.filter((p) => p.day === itineraryData.itinerary[selectedDayIdx!].date_)} />
                  </div>
                </div>
              </div>

              <div className="hidden md:block w-2/5 border-l relative bg-slate-100">
                <PlacesMapPane places={places.filter((p) => p.day === itineraryData.itinerary[selectedDayIdx!].date_)} />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 4. FULL MAP MODAL */}
      {isMapModalOpen && (
        <div className="fixed inset-x-0 bottom-0 top-[68px] z-[10000] bg-white flex flex-col animate-in fade-in duration-300">
          <header className="h-[60px] md:h-[70px] bg-white border-b flex items-center justify-between px-6 shrink-0 shadow-md relative z-[10001]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#0056D2]">
                <MapIcon size={20} />
              </div>
              <h3 className="font-black italic uppercase tracking-widest text-[#0056D2] text-sm">Bản đồ</h3>
            </div>

            <button
              onClick={() => setIsMapModalOpen(false)}
              className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-500 transition-colors pointer-events-auto"
            >
              <X size={20} />
            </button>
          </header>

          <div className="flex-1 w-full h-full relative z-[10000]">
            <PlacesMapPane places={places} />
          </div>
        </div>
      )}
    </div>
  );
}


