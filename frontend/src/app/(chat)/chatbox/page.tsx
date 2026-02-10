"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
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
  Sparkle
} from "lucide-react";
import PlacesMapPane, { UiPlace } from "./PlacesMapPane";

const API_BASE = "http://localhost:4000/v1";
// Endpoint Spring Boot của bạn
const SPRING_BOOT_API = "http://localhost:8080/api/v1";

export default function VivuplanPremiumApp() {
  const [mounted, setMounted] = useState(false);
  const [activeId, setActiveId] = useState<string>("");
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [itineraryData, setItineraryData] = useState<any>(null);
  const [hotelData, setHotelData] = useState<any>(null);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);

  // State giao diện
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // State cho Popover Form
  const [isPromptPopoverOpen, setIsPromptPopoverOpen] = useState(false);

  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"chat" | "itinerary" | "hotel">("chat");
  const scrollRef = useRef<HTMLDivElement>(null);

  // State form mẫu
  const [promptForm, setPromptForm] = useState({
    destination: "",
    duration: "",
    budget: "",
    companions: "",
    interests: ""
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // --- LOGIC API ---
  const getUserIdFromToken = () => {
    try {
      const token = (typeof window !== "undefined" && localStorage.getItem("access_token")) ||
        (typeof window !== "undefined" && localStorage.getItem("token")) || null;
      if (!token) return null;
      const parts = token.split(".");
      if (parts.length < 2) return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload.user_id ?? payload.id ?? payload.uid ?? payload.user?.id ?? null;
    } catch { return null; }
  };

  const getCurrentUserId = () => {
    if (typeof window === "undefined") return "1";
    const fromToken = getUserIdFromToken();
    const fromStorage = localStorage.getItem("user_id");
    if (fromToken) return String(fromToken);
    if (fromStorage && !fromStorage.includes("@")) return String(fromStorage);
    return "1";
  };

  const newSessionId = () => {
    try {
      // @ts-ignore
      if (typeof crypto !== "undefined" && crypto?.randomUUID) return crypto.randomUUID();
    } catch { }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const getBannerPhoto = (name: string) => {
    if (itineraryData?.destination_image_url) return itineraryData.destination_image_url;
    return `https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&q=60&w=1200&sig=${encodeURIComponent(name || "travel")}`;
  };

  const totalCost = useMemo(() => {
    if (!itineraryData?.itinerary) return 0;
    return itineraryData.itinerary.reduce((sum: number, day: any) => sum + (day.estimated_cost?.max || 0), 0);
  }, [itineraryData]);

  const loadHistory = async () => {
    try {
      const uid = getCurrentUserId();
      const resH = await fetch(`${API_BASE}/conversation/history/${uid}?page=1&page_size=30`);
      const dataH = await resH.json();
      if (dataH?.data) {
        const sorted = [...dataH.data].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setChatHistory(sorted);
      }
    } catch (e) { console.error(e); }
  };

  const handleSelectChat = async (sid: string) => {
    try {
      setIsLoading(true);
      setSelectedDayIdx(null);
      setActiveId(sid);
      setViewMode("chat");
      const resD = await fetch(`${API_BASE}/conversation/${sid}`);
      const dataD = await resD.json();
      setMessages((dataD?.messages || []).map((m: any) => ({
        role: m.role === "user" ? "user" : "ai",
        content: m.parts?.[0]?.text || "",
      })));
      setItineraryData(dataD?.itinerary || null);
      setHotelData(dataD?.hotel_recommendation || null);
      setIsSidebarOpen(false);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
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

  useEffect(() => {
    if (!mounted) return;
    loadHistory();
    setActiveId(newSessionId());
  }, [mounted]);

  // --- LOGIC ĐẶT PHÒNG ---
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
        currencyCode: "VND"
      });

      const res = await fetch(`${SPRING_BOOT_API}/hotel/link?${queryParams.toString()}`);
      const data = await res.json();

      if (data.result) {
        window.open(data.result, "_blank");
      } else {
        console.error("Không tìm thấy link trong kết quả:", data);
        alert("Hiện tại không lấy được link đặt phòng. Vui lòng thử lại sau.");
      }
    } catch (error) {
      console.error("Booking error:", error);
      alert("Lỗi kết nối đến server Spring Boot (8080).");
    }
  };

  // --- LOGIC XỬ LÝ TÊN ĐỊA DANH NGẮN GỌN TRÊN MAP ---
  const places: UiPlace[] = useMemo(() => {
    if (!itineraryData?.itinerary) return [];
    const out: UiPlace[] = [];
    itineraryData.itinerary.forEach((day: any) => {
      const items = [...(day.attraction_recommendations || []), ...(day.restaurant_recommendations || [])];
      items.forEach((item: any) => {
        // Tối ưu trích xuất tên địa danh ngắn gọn
        let shortName = item.reason?.split(/[.\-:]/)[0] || "Địa điểm";
        shortName = shortName.split(/ mang | là | giúp | lý | có | được | để /)[0].trim();

        out.push({
          id: item.place_id, place_id: item.place_id, name: shortName,
          kind: item.reason?.toLowerCase().includes("ăn") ? "restaurant" : "attraction",
          day: day.date_, lat: 20.25 + Math.random() * 0.1, lng: 105.97 + Math.random() * 0.1,
          reason: item.reason,
        });
      });
    });
    return out;
  }, [itineraryData]);

  const executeSend = async (text: string) => {
    if (!text || isLoading) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInputText("");
    setIsLoading(true);
    const sid = activeId || newSessionId();
    if (!activeId) setActiveId(sid);

    try {
      const uid = getCurrentUserId();
      const res = await fetch(`${API_BASE}/conversation/response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sid, user_id: uid, content: text }),
      });

      const data = await res.json();
      const aiText = data?.content || data?.reply || data?.message || "Đã cập nhật thông tin.";
      setMessages((prev) => [...prev, { role: "ai", content: aiText }]);

      const resD = await fetch(`${API_BASE}/conversation/${sid}`);
      const dataD = await resD.json();
      if (dataD?.itinerary) setItineraryData(dataD.itinerary);
      if (dataD?.hotel_recommendation) setHotelData(dataD.hotel_recommendation);
      loadHistory();
    } catch (e) {
      setMessages((prev) => [...prev, { role: "ai", content: "Lỗi kết nối server." }]);
    } finally { setIsLoading(false); }
  }

  const handleSend = () => {
    executeSend(inputText.trim());
  };

  const handlePromptSubmit = () => {
    const parts = [];
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

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 top-[68px] w-screen h-[calc(100dvh-68px)] bg-white text-slate-900 font-sans flex overflow-hidden text-sm shadow-inner">

      {/* 1. SIDEBAR */}
      <aside className={`absolute md:relative inset-y-0 left-0 z-[3000] w-[280px] bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 shadow-2xl md:shadow-none ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="p-5 h-[60px] md:h-[70px] border-b flex items-center shrink-0 justify-between">
          <img src="/brand/logo.png" className="h-6 w-auto" alt="Vivuplan" />
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
        </div>

        <div className="p-4">
          <button onClick={handleNewChat} className="w-full py-3 bg-[#0056D2] text-white rounded-xl text-[11px] font-black flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all">
            <PlusCircle size={16} /> Chuyến đi mới
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5 custom-scrollbar">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2 px-2 mt-2">
            <History size={12} /> Lịch sử gần đây
          </p>
          {chatHistory.length > 0 ? chatHistory.map((chat) => (
            <button key={chat.session_id} onClick={() => handleSelectChat(chat.session_id)} className={`w-full text-left p-3 rounded-lg text-[11px] flex items-center gap-3 transition-all ${activeId === chat.session_id ? "bg-blue-50 text-[#0056D2] font-bold border border-blue-100" : "hover:bg-slate-50 text-slate-600 border border-transparent"}`}>
              <MessageSquare size={14} className={`shrink-0 ${activeId === chat.session_id ? "opacity-100 text-[#0056D2]" : "opacity-40"}`} />
              <span className="truncate flex-1">{chat.title || `Trip ${chat.session_id.substring(0, 8)}`}</span>
            </button>
          )) : (
            <div className="p-4 text-center text-[10px] text-slate-300 italic">Chưa có lịch sử</div>
          )}
        </div>
      </aside>

      {isSidebarOpen && <div className="absolute inset-0 bg-black/40 z-[2999] backdrop-blur-sm md:hidden" onClick={() => setIsSidebarOpen(false)} />}

      {/* 2. MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative bg-[#FDFDFD] min-w-0 overflow-hidden">

        <header className="md:hidden h-[60px] border-b bg-white flex items-center justify-between px-4 shrink-0 z-[40] relative">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-[#0056D2] hover:bg-blue-50 rounded-lg"><Menu size={22} /></button>
            <div className="flex flex-col">
              <h1 className="text-xs font-black uppercase tracking-widest text-[#0056D2]">Vivuplan AI</h1>
              <p className="text-[9px] text-slate-400 font-bold italic">Trợ lý du lịch cá nhân</p>
            </div>
          </div>
        </header>

        <div className="relative flex-1 overflow-hidden flex flex-col">

          <div className="flex-1 flex flex-col overflow-hidden">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
              {messages.length === 0 && !isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto py-10">
                  <div className="w-16 h-16 bg-blue-50 rounded-[2rem] flex items-center justify-center text-[#0056D2] animate-bounce shadow-lg shadow-blue-50">
                    <Sparkles size={32} />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black italic tracking-tighter uppercase mb-2 text-[#0056D2]">Xin chào!</h2>
                    <p className="text-xs text-slate-400 font-medium italic px-4">Bắt đầu chuyến đi trong mơ của bạn ngay bây giờ.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full px-4">
                    {["Đà Lạt 3N2Đ", "Huế ăn gì?", "Resort Nha Trang"].map((t, i) => (
                      <button key={i} onClick={() => setInputText(t)} className="p-3 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-blue-50 hover:text-[#0056D2] hover:border-blue-100 transition-all text-left">
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto w-full space-y-6 pb-4">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}>
                      <div className={`max-w-[90%] md:max-w-[85%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm ${m.role === "user" ? "bg-[#0056D2] text-white rounded-tr-none" : "bg-white text-slate-700 border border-slate-100 rounded-tl-none font-medium"}`}>
                        {m.content.replace(/\{"type":.*?\}/g, "")}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-blue-50 p-4 rounded-2xl rounded-tl-none shadow-md flex items-center gap-3">
                        <Loader2 size={16} className="animate-spin text-[#0056D2]" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#0056D2]">Đang xử lý...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white border-t border-slate-50 shrink-0 relative z-20 flex flex-col">
              {(itineraryData || hotelData) && (
                <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar justify-center border-b border-slate-50 bg-slate-50/50">
                  {itineraryData && (
                    <button onClick={() => setViewMode("itinerary")} className="flex items-center gap-2 px-5 py-2 bg-[#0056D2] text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-blue-700 active:scale-95 transition-all whitespace-nowrap">
                      <Calendar size={14} /> Xem Lịch Trình
                    </button>
                  )}
                  {hotelData && (
                    <button onClick={() => setViewMode("hotel")} className="flex items-center gap-2 px-5 py-2 bg-cyan-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-cyan-600 active:scale-95 transition-all whitespace-nowrap">
                      <Hotel size={14} /> Xem Khách sạn
                    </button>
                  )}
                </div>
              )}

              <div className="p-3 md:p-6 relative">
                {isPromptPopoverOpen && (
                  <div className="absolute bottom-full left-0 w-full px-3 md:px-6 pb-2 animate-in slide-in-from-bottom-4 fade-in duration-300 z-50">
                    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 md:p-5 relative">
                      <button onClick={() => setIsPromptPopoverOpen(false)} className="absolute top-3 right-3 p-1 text-slate-300 hover:text-red-500"><X size={16} /></button>
                      <h3 className="text-xs font-black italic uppercase tracking-widest text-[#0056D2] mb-3 flex items-center gap-2"><Sparkle size={14} /> Tạo yêu cầu nhanh</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="md:col-span-2">
                          <input value={promptForm.destination} onChange={e => setPromptForm({ ...promptForm, destination: e.target.value })} className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-bold" placeholder="Đi đâu? (VD: Đà Lạt)" />
                        </div>
                        <input value={promptForm.duration} onChange={e => setPromptForm({ ...promptForm, duration: e.target.value })} className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-bold" placeholder="Mấy ngày? (VD: 3N2Đ)" />
                        <input value={promptForm.budget} onChange={e => setPromptForm({ ...promptForm, budget: e.target.value })} className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-bold" placeholder="Ngân sách? (VD: 5tr)" />
                        <input value={promptForm.companions} onChange={e => setPromptForm({ ...promptForm, companions: e.target.value })} className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-bold" placeholder="Đi cùng ai?" />
                        <input value={promptForm.interests} onChange={e => setPromptForm({ ...promptForm, interests: e.target.value })} className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-bold" placeholder="Sở thích? (Ăn uống, chụp ảnh...)" />
                      </div>
                      <button onClick={handlePromptSubmit} className="w-full mt-3 bg-[#0056D2] text-white py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-md active:scale-95 transition-all">Tạo lịch trình</button>
                    </div>
                  </div>
                )}

                <div className="max-w-3xl mx-auto flex items-end gap-2">
                  <button onClick={() => setIsPromptPopoverOpen(!isPromptPopoverOpen)} className={`h-12 w-12 md:h-14 md:w-14 rounded-2xl flex flex-col items-center justify-center transition-all shrink-0 border ${isPromptPopoverOpen ? 'bg-blue-50 border-blue-200 text-[#0056D2]' : 'bg-slate-50 border-transparent text-slate-400 hover:text-[#0056D2]'}`} title="Tạo mẫu">
                    <FilePenLine size={18} />
                    <span className="text-[8px] font-black uppercase mt-0.5">Mẫu</span>
                  </button>

                  <div className="relative flex-1">
                    <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} className="w-full bg-slate-50 border-none rounded-2xl p-4 pr-12 text-[13px] h-12 md:h-14 resize-none outline-none focus:bg-white focus:ring-1 focus:ring-blue-200 transition-all font-medium shadow-inner" placeholder="Nhập yêu cầu..." />
                    <button onClick={handleSend} disabled={isLoading} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-[#0056D2] text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md">
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {(viewMode === "itinerary" || viewMode === "hotel") && (
            <div className="absolute inset-0 z-[200] bg-[#F8FAFB] flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
              <div className="h-[60px] md:h-[70px] bg-white border-b flex items-center justify-between px-4 shrink-0 shadow-sm z-[210]">
                <button onClick={() => setViewMode("chat")} className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-[#0056D2] hover:text-white transition-all group border border-slate-200">
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
                      <img src={getBannerPhoto(itineraryData?.trip_summary?.destinations[0])} className="w-full h-full object-cover" alt="banner" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <h1 className="absolute bottom-6 left-6 text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter">
                        {itineraryData?.trip_summary?.destinations[0]}
                      </h1>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                      <div className="md:col-span-2 bg-white p-2 rounded-[2rem] shadow-lg border border-slate-100 h-[350px] relative overflow-hidden group">
                        <PlacesMapPane places={places} />
                        <button onClick={() => setIsMapModalOpen(true)} className="absolute bottom-4 right-4 px-5 py-2.5 bg-white text-[#0056D2] rounded-full text-[9px] font-black shadow-xl flex items-center gap-2 uppercase tracking-widest hover:bg-[#0056D2] hover:text-white transition-all z-20 italic border border-slate-100">
                          <Maximize2 size={12} /> Mở rộng bản đồ
                        </button>
                      </div>
                      <div className="bg-[#0056D2] p-6 rounded-[2rem] shadow-xl text-white flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute -right-6 -top-6 opacity-10"><Wallet size={150} /></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2 italic">Tổng ngân sách</p>
                        <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter mb-4">{totalCost.toLocaleString()}đ</h2>
                        <div className="w-10 h-0.5 bg-white/30 mb-4" />
                        <p className="text-[11px] font-medium italic opacity-80 leading-relaxed">Chi phí ước tính bao gồm ăn uống, vé tham quan và di chuyển.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h2 className="text-base font-black italic tracking-widest text-[#0056D2] uppercase px-2 flex items-center gap-3">
                        <div className="w-6 h-[3px] bg-[#0056D2]" /> CHI TIẾT LỘ TRÌNH
                      </h2>
                      <div className="grid grid-cols-1 gap-4">
                        {itineraryData.itinerary.map((day: any, idx: number) => (
                          <div key={idx} onClick={() => setSelectedDayIdx(idx)} className="bg-white p-5 md:p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-4 md:gap-8 cursor-pointer hover:shadow-xl hover:border-blue-100 transition-all group">
                            <div className="w-full md:w-32 h-16 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-[#0056D2] transition-all">
                              <p className="text-[11px] font-black text-slate-400 group-hover:text-white uppercase italic">NGÀY {idx + 1}</p>
                            </div>
                            <div className="flex-1 text-center md:text-left">
                              <span className="text-[9px] font-black text-[#0056D2] block mb-1 uppercase tracking-widest">{day.date_}</span>
                              <h3 className="text-lg md:text-xl font-black italic uppercase tracking-tight group-hover:text-[#0056D2] transition-colors">{day.location}</h3>
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
                            <img src={h.details.photos[0]} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt="hotel" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300"><MapPin size={32} /></div>
                          )}
                          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-xl shadow-sm flex items-center gap-1">
                            <Star className="fill-yellow-400 text-yellow-400" size={12} />
                            <span className="text-[10px] font-black">4.8</span>
                          </div>
                        </div>
                        <h4 className="text-lg font-black mb-2 group-hover:text-[#0056D2] transition-colors uppercase italic tracking-tight">{h.details?.name || "Khách sạn cao cấp"}</h4>
                        <p className="text-[12px] text-slate-500 italic line-clamp-3 mb-6 leading-relaxed normal-case font-medium">{h.reasoning}</p>
                        <div className="mt-auto flex justify-between items-center pt-5 border-t border-slate-50">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Giá từ</p>
                            <p className="text-xl font-black text-[#0056D2] tracking-tighter">{h.details?.price_per_night?.toLocaleString() || "---"}đ</p>
                          </div>
                          <button onClick={() => handleBooking(h)} className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-[9px] font-black hover:bg-[#0056D2] transition-all uppercase italic shadow-lg">Đặt phòng</button>
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
              <button onClick={() => setSelectedDayIdx(null)} className="mb-8 flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 text-[#0056D2] text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm hover:shadow-md"><ArrowLeft size={14} /> Quay lại danh sách</button>
              <h2 className="text-4xl md:text-6xl font-black text-[#0056D2] italic tracking-tighter uppercase leading-none mb-2">NGÀY {selectedDayIdx + 1}</h2>
              <p className="text-lg font-black uppercase tracking-[0.3em] text-slate-300 italic mb-10">{itineraryData.itinerary[selectedDayIdx].location}</p>

              <div className="space-y-6 max-w-2xl">
                {["morning", "afternoon", "evening"].map((session, sIdx) => {
                  const sessionName = sIdx === 0 ? "BUỔI SÁNG" : sIdx === 1 ? "BUỔI CHIỀU" : "BUỔI TỐI";
                  return (
                    <div key={sIdx} className="flex gap-6 p-6 bg-white rounded-[2.5rem] border border-slate-50 shadow-sm transition-all group">
                      <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0056D2] shrink-0 group-hover:bg-[#0056D2] group-hover:text-white transition-colors">
                        {sIdx === 0 ? <Sun size={24} /> : sIdx === 1 ? <Sunset size={24} /> : <Moon size={24} />}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase italic mb-1 tracking-[0.2em]">{sessionName}</p>
                        <p className="text-sm md:text-base font-bold italic text-slate-700 leading-relaxed normal-case">"{itineraryData.itinerary[selectedDayIdx][session]}"</p>
                      </div>
                    </div>
                  )
                })}

                <div className="bg-[#0A0F1A] p-8 rounded-[3rem] text-white relative overflow-hidden shadow-xl mt-8">
                  <div className="absolute top-0 right-0 p-8 opacity-5"><Utensils size={150} /></div>
                  <h4 className="text-[10px] font-black text-[#4ECDC4] uppercase tracking-[0.3em] mb-6 italic flex items-center gap-3 relative z-10"><Utensils size={16} /> Ẩm thực địa phương</h4>
                  <div className="space-y-4 relative z-10">
                    {itineraryData.itinerary[selectedDayIdx].meals.map((meal: string, i: number) => (
                      <div key={i} className="pl-4 border-l-2 border-[#4ECDC4]/30">
                        <p className="text-base font-black text-slate-100 italic uppercase tracking-tight">{meal}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* BẢN ĐỒ MOBILE - HIỂN THỊ SAU PHẦN ẨM THỰC */}
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

      </main>

      {/* 4. FULL MAP MODAL - ĐẢM BẢO Z-INDEX CAO NHẤT VÀ NÚT TẮT KHÔNG BỊ CHE */}
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
