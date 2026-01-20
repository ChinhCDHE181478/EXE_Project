"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

/** ========= Types & Interfaces ========= */
type Msg = { role: "ai" | "user"; content: string };
type TabKey = "itinerary" | "flights" | "hotels" | "cars";

type Thread = {
  id: string;
  title: string;
  updatedAt: number;
  messages: Msg[];
};

type ItineraryResponse = {
  trip_summary?: any;
  itinerary?: any[];
  notes?: string;
};

/** ========= Config & Constants ========= */
const API_BASE = (process.env.NEXT_PUBLIC_CHAT_AGENT_URL || "").replace(/\/$/, "");
const LS_USER_KEY = "vivu_user_id_v1";
const ITI_PAGE_SIZE = 2; // Đã khai báo để tránh lỗi ReferenceError

/** ========= UI Components Chuyên Nghiệp ========= */
function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-lg shadow-cyan-200 transition-all group-hover:scale-110">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
          <path d="M2 12l7 2 4 8 2-6 6 2 1-2-6-4 3-8-2-1-6 7-9 2z" />
        </svg>
      </div>
      <span className="text-2xl font-black tracking-tighter text-slate-800">VivuPlan</span>
    </Link>
  );
}

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[2.5rem] bg-white/80 backdrop-blur-2xl border border-white shadow-[0_8px_40px_rgb(0,0,0,0.04)] ${className}`}>{children}</div>;
}

const safeJsonParse = (s: string) => { try { return JSON.parse(s); } catch { return null; } };
const newSessionIdClient = () => `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export default function ChatboxPage() {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<TabKey>("itinerary");
  const [resultsOpen, setResultsOpen] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(true); // Tắt/mở Prompt
  
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [text, setText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [itineraryCache, setItineraryCache] = useState<Record<string, ItineraryResponse>>({});
  const [itiPage, setItiPage] = useState(1);
  
  const userIdRef = useRef<string>("1");
  const abortRef = useRef<AbortController | null>(null);

  // Form cấu hình đầy đủ
  const [config, setConfig] = useState({
    from: "Hà Nội",
    to: "Đà Nẵng",
    startDate: new Date().toISOString().split('T')[0],
    guests: "2",
    days: "3",
    budget: "5.000.000",
    transport: "Máy bay", 
    style: "Khám phá & Ẩm thực",
    extra: "Khách sạn 4 sao, quán ăn địa phương trên 4 sao Google"
  });

  const activeThread = useMemo(() => threads.find((t) => t.id === activeId) || null, [threads, activeId]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const existing = localStorage.getItem(LS_USER_KEY);
      userIdRef.current = existing || "1";
    }
  }, []);

  // 1. Tải danh sách lịch sử
  useEffect(() => {
    if (!mounted || !API_BASE) return;
    const loadHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/conversation/history/${userIdRef.current}?page=1&page_size=20`);
        const data = await res.json();
        const items = data?.data || [];
        const mapped = items.map((it: any) => ({
          id: String(it.session_id || ""),
          title: String(it.title || "Chuyến đi"),
          updatedAt: Date.parse(it.created_at) || Date.now(),
          messages: [],
        }));
        if (mapped.length) { setThreads(mapped); setActiveId(mapped[0].id); }
      } catch (e) { console.error(e); }
    };
    loadHistory();
  }, [mounted]);

  // 2. Tải tin nhắn chi tiết khi chuyển Thread (Fix lỗi mất chat)
  useEffect(() => {
    if (!activeId || !API_BASE || !mounted) return;
    const loadMessages = async () => {
      const current = threads.find(t => t.id === activeId);
      if (current && current.messages.length > 0) return;
      try {
        const res = await fetch(`${API_BASE}/conversation/${activeId}`);
        const data = await res.json();
        const msgs = (Array.isArray(data) ? data : data?.messages || []).map((m: any) => ({
          role: m.role === "user" ? "user" : "ai",
          content: m.content || m.text || ""
        }));
        setThreads(prev => prev.map(t => t.id === activeId ? { ...t, messages: msgs } : t));
      } catch (e) { console.error(e); }
    };
    loadMessages();
  }, [activeId, mounted]);

  const sendText = async (customContent?: string) => {
    const content = (customContent || text).trim();
    if (!content || isStreaming || !activeId) return;

    abortRef.current = new AbortController();
    setThreads(prev => prev.map(t => t.id === activeId ? { ...t, messages: [...t.messages, { role: "user", content }, { role: "ai", content: "" }] } : t));
    setText("");
    setIsStreaming(true);

    try {
      const res = await fetch(`${API_BASE}/conversation/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: activeId, user_id: userIdRef.current, content }),
        signal: abortRef.current.signal,
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let lastAI = "";

      while (true) {
        const { done, value } = await reader?.read() || { done: true, value: undefined };
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          const payload = line.replace(/^data: /, "").trim();
          if (!payload || payload === "[DONE]") continue;
          const obj = safeJsonParse(payload);
          if (obj?.type === "data-itinerary") {
            setItineraryCache(prev => ({ ...prev, [activeId]: obj.data }));
            setIsFormOpen(false); // Tự đóng form khi có kết quả
          }
          const delta = obj?.delta || obj?.content || (typeof obj === 'string' ? obj : "");
          if (delta) {
            lastAI += delta;
            setThreads(p => p.map(t => t.id === activeId ? { ...t, messages: t.messages.map((m, i) => i === t.messages.length - 1 ? { ...m, content: lastAI } : m) } : t));
          }
        }
      }
    } catch (e) {} finally { setIsStreaming(false); }
  };

  /** MASTER PROMPT TẠO SỰ KHÁC BIỆT */
  const handleDesign = () => {
    const masterPrompt = `Lập lịch trình ĐẲNG CẤP: Khởi hành từ ${config.from} đi ${config.to}, ngày ${config.startDate}, ${config.days} ngày cho ${config.guests} người. Ngân sách ${config.budget}. Di chuyển bằng ${config.transport}. Phong cách: ${config.style}. YÊU CẦU: Khách sạn và quán ăn PHẢI có đánh giá Rating (Google/TripAdvisor) kèm link tham khảo. CHỈ chọn địa điểm trên 4.0 sao.`;
    sendText(masterPrompt);
  };

  const currentItinerary = itineraryCache[activeId];
  const itineraryBlocks = useMemo(() => {
    const api = currentItinerary?.itinerary;
    if (!api) return [];
    return api.map((d: any, idx: number) => ({
      day: idx + 1,
      date: d.date_ || d.date || "",
      city: d.location || d.city || "",
      items: [{ time: "Sáng", title: d.morning }, { time: "Chiều", title: d.afternoon }, { time: "Tối", title: d.evening }].filter(x => x.title)
    }));
  }, [currentItinerary, activeId]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans">
      <header className="sticky top-0 z-50 h-20 bg-white/80 backdrop-blur-md border-b flex items-center justify-between px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-slate-500 font-bold hover:text-cyan-600 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M15 19l-7-7 7-7" /></svg>
            Quay lại
          </Link>
          <Logo />
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {["LỊCH TRÌNH", "FLIGHTS", "HOTELS", "CARS"].map(t => (
            <button key={t} className={`px-4 py-2 rounded-lg text-[10px] font-black tracking-widest ${t === "LỊCH TRÌNH" ? "bg-white text-cyan-600 shadow-sm" : "text-slate-400"}`}>{t}</button>
          ))}
        </div>
        <button onClick={() => setResultsOpen(!resultsOpen)} className="px-5 py-2 bg-white border rounded-xl text-[10px] font-black text-slate-500 uppercase hover:bg-slate-50 transition-colors">
          {resultsOpen ? "THU GỌN" : "MỞ RỘNG"}
        </button>
      </header>

      <main className="mx-auto max-w-[1600px] px-8 py-8 grid grid-cols-12 gap-6 h-[calc(100vh-80px)]">
        {/* Sidebar History */}
        <div className="col-span-3">
          <GlassCard className="p-4 h-full flex flex-col">
            <button onClick={() => { const id = newSessionIdClient(); setThreads([{ id, title: "Chuyến đi mới", updatedAt: Date.now(), messages: [] }, ...threads]); setActiveId(id); setIsFormOpen(true); }} className="w-full bg-cyan-600 py-4 rounded-2xl text-[11px] font-black text-white shadow-lg shadow-cyan-100 hover:bg-cyan-700 transition-all">+ CHUYẾN ĐI MỚI</button>
            <div className="flex-1 overflow-y-auto mt-4 space-y-2 pr-2 custom-scrollbar">
              {threads.map(t => (
                <button key={t.id} onClick={() => setActiveId(t.id)} className={`w-full text-left p-4 rounded-2xl transition-all ${t.id === activeId ? "bg-white shadow-md ring-1 ring-black/5" : "opacity-60 hover:opacity-100"}`}>
                  <div className="text-sm font-bold text-slate-700 truncate">{t.title}</div>
                  <div className="text-[10px] text-slate-400 mt-1 uppercase">ID: {t.id.slice(-5)}</div>
                </button>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Center: Chat Area + Form */}
        <div className={`${resultsOpen ? "col-span-5" : "col-span-9"} flex flex-col h-full relative overflow-hidden`}>
          <GlassCard className="flex flex-col h-full overflow-hidden border-none shadow-2xl">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/20">
              {activeThread?.messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-3xl px-5 py-3 text-sm font-medium ${m.role === "user" ? "bg-cyan-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-100 shadow-sm"}`}>
                    {m.content.replace(/\{"type": "data-itinerary".*?\}/g, "")}
                  </div>
                </div>
              ))}
              {isStreaming && <div className="text-[10px] font-black text-cyan-500 animate-pulse uppercase tracking-widest ml-2">ĐANG THIẾT KẾ...</div>}
            </div>

            {/* FORM PROMPT (Tắt/Mở) */}
            <div className={`absolute bottom-24 left-6 right-6 transition-all duration-500 ${isFormOpen ? "translate-y-0 opacity-100" : "translate-y-[120%] opacity-0 pointer-events-none"}`}>
              <div className="bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 ring-1 ring-black/5">
                <div className="flex justify-between mb-4 items-center">
                  <span className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Cấu hình lịch trình hoàn hảo</span>
                  <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
                </div>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <InputBox label="Từ" value={config.from} onChange={v => setConfig({...config, from: v})} />
                  <InputBox label="Đến" value={config.to} onChange={v => setConfig({...config, to: v})} />
                  <InputBox label="Ngày đi" type="date" value={config.startDate} onChange={v => setConfig({...config, startDate: v})} />
                  <InputBox label="Ngân sách" value={config.budget} onChange={v => setConfig({...config, budget: v})} />
                </div>
                <div className="flex gap-3 items-end">
                   <div className="flex-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Yêu cầu & Phương tiện</label><input type="text" value={config.extra} onChange={e => setConfig({...config, extra: e.target.value})} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold focus:border-cyan-500 outline-none transition-all" /></div>
                   <div className="flex gap-2"><MiniInput label="Khách" value={config.guests} onChange={v => setConfig({...config, guests: v})} /><MiniInput label="Ngày" value={config.days} onChange={v => setConfig({...config, days: v})} /></div>
                   <button onClick={handleDesign} disabled={isStreaming} className="h-[40px] px-6 bg-cyan-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-cyan-100 hover:bg-cyan-700 transition-all">THIẾT KẾ</button>
                </div>
              </div>
            </div>

            {/* CHAT INPUT */}
            <div className="p-4 bg-white border-t flex items-center gap-3">
              <button onClick={() => setIsFormOpen(!isFormOpen)} className={`h-12 w-12 flex items-center justify-center rounded-2xl transition-all ${isFormOpen ? "bg-cyan-50 text-cyan-600" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4v2" /></svg>
              </button>
              <div className="flex-1 relative flex items-center bg-slate-50 rounded-2xl ring-1 ring-slate-200 focus-within:ring-cyan-500 transition-all">
                <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Hỏi thêm hoặc tinh chỉnh..." className="w-full bg-transparent px-4 py-3 text-sm font-bold outline-none resize-none h-12" onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendText())} />
                <button onClick={() => sendText()} disabled={!text.trim()} className="absolute right-2 h-9 w-9 bg-cyan-600 text-white flex items-center justify-center rounded-xl hover:bg-cyan-700 transition-all"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}><path d="M12 5l7 7-7 7M5 12h14" /></svg></button>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Results Panel */}
        {resultsOpen && (
          <div className="col-span-4 h-full">
            <GlassCard className="h-full flex flex-col overflow-hidden shadow-2xl">
              <div className="p-6 border-b flex justify-between items-center bg-white/50"><span className="text-sm font-black uppercase text-slate-800 tracking-widest">Lộ trình chi tiết</span><div className="h-8 w-8 bg-cyan-600 text-white rounded-full flex items-center justify-center text-[10px] font-black">AI</div></div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/10 custom-scrollbar">
                {itineraryBlocks.length > 0 ? (
                  <div className="space-y-4">
                    {itineraryBlocks.slice((itiPage - 1) * ITI_PAGE_SIZE, itiPage * ITI_PAGE_SIZE).map((d: any) => (
                      <div key={d.day} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-3 pb-2 border-b"><span className="text-[11px] font-black text-slate-800 uppercase tracking-tighter">Ngày {d.day} <span className="text-cyan-500 ml-1">{d.date}</span></span><span className="text-[9px] font-black text-cyan-600 px-2 py-0.5 bg-cyan-50 rounded-lg">{d.city}</span></div>
                        <div className="space-y-3">
                          {d.items.map((it:any, idx:number) => (
                            <div key={idx} className="flex gap-4 text-xs font-medium text-slate-600"><span className="w-12 font-black text-slate-300 italic uppercase">{it.time}</span><span>{it.title}</span></div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between items-center px-2 pt-4">
                      <button onClick={() => setItiPage(p => Math.max(1, p - 1))} className={`h-10 px-6 rounded-xl text-[10px] font-black transition-all ${itiPage > 1 ? "bg-white shadow-sm hover:bg-slate-50" : "opacity-30 pointer-events-none"}`}>TRƯỚC</button>
                      <span className="text-[11px] font-black text-slate-400">{itiPage} / {Math.ceil(itineraryBlocks.length / ITI_PAGE_SIZE)}</span>
                      <button onClick={() => setItiPage(p => p + 1)} className={`h-10 px-6 rounded-xl text-[10px] font-black transition-all ${itiPage * ITI_PAGE_SIZE < itineraryBlocks.length ? "bg-white shadow-sm hover:bg-slate-50" : "opacity-30 pointer-events-none"}`}>SAU</button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center p-12 text-center italic text-slate-400 text-xs">Lộ trình chi tiết sẽ hiển thị tại đây sau khi bạn tạo.</div>
                )}
              </div>
            </GlassCard>
          </div>
        )}
      </main>
    </div>
  );
}

// Sub-components
function InputBox({ label, value, onChange, type = "text" }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-bold outline-none focus:border-cyan-500 transition-all shadow-sm bg-white" />
    </div>
  );
}

function MiniInput({ label, value, onChange }: any) {
  return (
    <div className="w-12 space-y-1 text-center">
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-xl border border-slate-200 py-2 text-center text-xs font-bold shadow-sm bg-white outline-none focus:border-cyan-500 transition-all" />
    </div>
  );
}