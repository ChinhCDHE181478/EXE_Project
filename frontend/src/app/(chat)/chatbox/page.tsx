"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

/** ========= BG ========= */
const BG_URL =
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2400&auto=format&fit=crop";

/** ========= Types ========= */
type Msg = { role: "ai" | "user"; content: string };
type TabKey = "itinerary" | "flights" | "hotels" | "cars";

type Thread = {
  id: string; // session_id
  title: string;
  updatedAt: number;
  messages: Msg[];
};

type EstimatedCost = { min: number; max: number; currency: string };
type TripSummary = {
  total_days: number;
  destinations: string[];
  estimated_total_budget: EstimatedCost;
};
type PlaceRecommendation = { place_id: string; reason: string };
type ItineraryDay = {
  date_: string;
  location: string;
  morning: string;
  afternoon: string;
  evening: string;
  meals: string[];
  transportation: string;
  estimated_cost: EstimatedCost;
  attraction_recommendations: PlaceRecommendation[];
  restaurant_recommendations: PlaceRecommendation[];
};
type ItineraryResponse = {
  trip_summary?: TripSummary;
  itinerary?: ItineraryDay[];
  notes?: string;
};

/** ========= API ========= */
const API_BASE =
  (process.env.NEXT_PUBLIC_CHAT_AGENT_URL || process.env.NEXT_PUBLIC_API_URL || "").replace(
    /\/$/,
    ""
  );

const LS_USER_KEY = "vivu_user_id_v1";

/** ========= UI helpers ========= */
function Badge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-[2px] text-[11px] ${className}`}>
      {children}
    </span>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-white/90 ring-1 ring-black/5 shadow">{children}</div>;
}

function IconTrash({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 3h6m-8 4h10m-9 0 1 15h6l1-15M10 10v8m4-8v8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPlus({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCollapse({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 6h10M5 12h14M9 18h10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconMenu({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 7h12M6 12h12M6 17h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

/** ========= Helpers ========= */
function safeJsonParse(s: string): any | null {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function guessTitle(msgs: Msg[]) {
  const firstUser = msgs.find((m) => m.role === "user")?.content?.trim();
  if (!firstUser) return "New Chat";
  return firstUser.length > 32 ? firstUser.slice(0, 32) + "…" : firstUser;
}

function getOrCreateUserIdNumeric(): string {
  // Agent backend đang int(user_id) => phải là string số
  if (typeof window === "undefined") return "1";

  const existing = localStorage.getItem(LS_USER_KEY);
  if (existing && /^\d+$/.test(existing)) return existing;

  // Nếu đang lưu UUID cũ => overwrite
  localStorage.setItem(LS_USER_KEY, "1");
  return "1";
}

function newSessionIdClient(): string {
  // tạo trên client để tránh hydration mismatch
  return `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** ========= Components for right panel ========= */
function ItineraryList({
  blocks,
  page,
  pageSize,
  onPrev,
  onNext,
}: {
  blocks: Array<{ day: number; date: string; city: string; items: Array<{ time: string; title: string; type: string }> }>;
  page: number;
  pageSize: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const slice = blocks.slice((page - 1) * pageSize, page * pageSize);
  const hasPrev = page > 1;
  const hasNext = page * pageSize < blocks.length;

  return (
    <div className="px-4 py-3">
      {slice.length === 0 ? (
        <div className="text-sm text-slate-600">Chưa có lịch trình. Hãy hỏi ví dụ: "Lập lịch trình 3 ngày ở Đà Lạt, ngân sách 5 triệu, 2 người".</div>
      ) : (
        <div className="space-y-3">
          {slice.map((d) => (
            <div key={`${d.day}-${d.date}-${d.city}`} className="rounded-xl bg-white ring-1 ring-black/5 shadow-sm p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Ngày {d.day} {d.date ? `• ${d.date}` : ""} {d.city ? `• ${d.city}` : ""}
                  </div>
                  <div className="mt-2 space-y-2">
                    {d.items.map((it, idx) => (
                      <div key={idx} className="flex gap-3 text-sm">
                        <div className="w-14 shrink-0 text-slate-500">{it.time}</div>
                        <div className="text-slate-800">{it.title}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <Badge className="bg-slate-100 text-slate-700">Lịch trình</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className={`rounded-lg px-3 py-1.5 text-sm ring-1 ring-black/10 ${hasPrev ? "bg-white hover:bg-slate-50" : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
        >
          ← Trước
        </button>
        <div className="text-xs text-slate-500">
          {blocks.length === 0 ? "0" : `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, blocks.length)} / ${blocks.length}`}
        </div>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className={`rounded-lg px-3 py-1.5 text-sm ring-1 ring-black/10 ${hasNext ? "bg-white hover:bg-slate-50" : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
        >
          Sau →
        </button>
      </div>
    </div>
  );
}

export default function ChatboxPage() {
  /** ========= Mounted (fix hydration) ========= */
  const [mounted, setMounted] = useState(false);

  /** ========= UI state ========= */
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tab, setTab] = useState<TabKey>("itinerary");
  const [resultsOpen, setResultsOpen] = useState(true);

  /** ========= Identity ========= */
  const userIdRef = useRef<string>("1");

  /** ========= Threads ========= */
  const [threads, setThreads] = useState<Thread[]>([]); // IMPORTANT: empty init => no SSR random
  const [activeId, setActiveId] = useState<string>(""); // IMPORTANT: empty init

  const activeThread = useMemo(() => threads.find((t) => t.id === activeId) || null, [threads, activeId]);

  /** ========= Input ========= */
  const [text, setText] = useState("");

  /** ========= Stream control ========= */
  const abortRef = useRef<AbortController | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  /** ========= Itinerary state per thread ========= */
  const [itineraryByThread, setItineraryByThread] = useState<Record<string, ItineraryResponse & any>>({});

  /** ========= Pagination ========= */
  const ITI_PAGE_SIZE = 2;
  const [itiPage, setItiPage] = useState(1);

  const itineraryBlocks = useMemo(() => {
    const api = itineraryByThread[activeId]?.itinerary;
    if (!Array.isArray(api)) return [];
    return api.map((d: any, idx: number) => {
      const date = d.date_ || d.date || "";
      const city = d.location || d.city || "";
      const items = [
        { time: "09:00", title: d.morning || "", type: "sight" },
        { time: "14:00", title: d.afternoon || "", type: "sight" },
        { time: "19:00", title: d.evening || "", type: "meal" },
      ].filter((x) => x.title);
      return { day: idx + 1, date, city, items };
    });
  }, [itineraryByThread, activeId]);

  /** ========= Cache + throttle to avoid 429 ========= */
  const convCacheRef = useRef<Record<string, Msg[]>>({});
  const lastConvFetchAtRef = useRef<Record<string, number>>({});
  const lastSendAtRef = useRef<number>(0);

  /** ========= Mount ========= */
  useEffect(() => {
    setMounted(true);
    userIdRef.current = getOrCreateUserIdNumeric();
  }, []);

  /** ========= Create a local new thread ========= */
  const createLocalThread = () => {
    const id = newSessionIdClient();
    const t: Thread = {
      id,
      title: "Cuộc trò chuyện mới",
      updatedAt: Date.now(),
      messages: [{ role: "ai", content: "Xin chào! Hãy nhập điểm đến & ngân sách, mình sẽ gợi ý lịch trình nhé." }],
    };
    setThreads([t]);
    setActiveId(id);
    setItiPage(1);
    setTab("itinerary");
    setResultsOpen(true);
  };

  /** ========= Load history ========= */
  useEffect(() => {
    if (!mounted) return;
    if (!API_BASE) {
      // nếu thiếu env, vẫn cho UI chạy local
      if (threads.length === 0) createLocalThread();
      return;
    }

    const run = async () => {
      try {
        // giảm page_size để tránh 429
        const url = `${API_BASE}/conversation/history/${encodeURIComponent(userIdRef.current)}?page=1&page_size=20`;
        const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });

        if (res.status === 429) {
          console.warn("History rate limited (429). UI will continue without preloading history.");
          if (threads.length === 0) createLocalThread();
          return;
        }

        if (!res.ok) {
          console.warn(`History HTTP ${res.status}: ${await res.text()}`);
          if (threads.length === 0) createLocalThread();
          return;
        }

        const data = await res.json();
        const items = Array.isArray(data?.data) ? data.data : [];

        const mapped: Thread[] = items
          .map((it: any) => ({
            id: String(it.session_id ?? it.sessionId ?? ""),
            title: String(it.title ?? "New Chat"),
            updatedAt: Date.parse(it.created_at ?? it.createdAt ?? new Date().toISOString()) || Date.now(),
            messages: [],
          }))
          .filter((t: Thread) => t.id);

        if (mapped.length) {
          setThreads(mapped);
          setActiveId(mapped[0].id);
        } else {
          createLocalThread();
        }
      } catch (e) {
        console.warn("History error:", e);
        if (threads.length === 0) createLocalThread();
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, API_BASE]);

  /** ========= Load a conversation when selecting thread (throttle + cache) ========= */
  useEffect(() => {
    if (!mounted) return;
    if (!API_BASE) return;
    if (!activeId) return;

    // nếu đã có trong cache thì set luôn
    if (convCacheRef.current[activeId]) {
      setThreads((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, messages: convCacheRef.current[activeId] } : t))
      );
      return;
    }

    // throttle per thread (>= 3s) để tránh spam
    const lastAt = lastConvFetchAtRef.current[activeId] || 0;
    const now = Date.now();
    if (now - lastAt < 3000) return;
    lastConvFetchAtRef.current[activeId] = now;

    const run = async () => {
      try {
        const res = await fetch(`${API_BASE}/conversation/${encodeURIComponent(activeId)}`, {
          method: "GET",
          headers: { Accept: "application/json, text/plain" },
        });

        if (res.status === 429) {
          console.warn("Conversation rate limited (429). Skip loading this thread for now.");
          return;
        }

        if (!res.ok) {
          console.warn(`Conversation HTTP ${res.status}: ${await res.text()}`);
          return;
        }

        const txt = await res.text();
        const j = safeJsonParse(txt);

        let msgs: Msg[] = [];
        const rawMsgs = Array.isArray(j) ? j : Array.isArray((j as any)?.messages) ? (j as any).messages : null;

        if (Array.isArray(rawMsgs)) {
          msgs = rawMsgs
            .map((m: any) => ({
              role: m.role === "user" ? "user" : "ai",
              content: String(m.content ?? m.text ?? ""),
            }))
            .filter((m: Msg) => m.content);
        } else if (typeof txt === "string" && txt.trim()) {
          // fallback
          msgs = [{ role: "ai", content: txt }];
        }

        convCacheRef.current[activeId] = msgs;
        setThreads((prev) => prev.map((t) => (t.id === activeId ? { ...t, messages: msgs } : t)));
      } catch (e) {
        console.warn("Conversation load error:", e);
      }
    };

    run();
  }, [mounted, API_BASE, activeId]);

  /** ========= Update thread helper ========= */
  const updateThreadById = (id: string, updater: (t: Thread) => Thread) => {
    setThreads((prev) => prev.map((t) => (t.id === id ? updater(t) : t)));
  };

  /** ========= Stream send ========= */
  const sendText = async (raw: string) => {
    const t = raw.trim();
    if (!t) return;

    if (!activeId) {
      // nếu chưa có thread (hiếm), tạo local rồi gửi
      createLocalThread();
      return;
    }

    // cooldown để tránh /stream 5/min
    const now = Date.now();
    if (now - lastSendAtRef.current < 12000) {
      console.warn("Cooldown: tránh rate-limit stream (>= 12s/lần).");
      return;
    }
    lastSendAtRef.current = now;

    const currentId = activeId;

    // Abort previous stream
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const userMsg: Msg = { role: "user", content: t };

    // Append user message + placeholder AI message
    updateThreadById(currentId, (thr) => {
      const nextMsgs: Msg[] = [...thr.messages, userMsg, { role: "ai", content: "" }];
      const next = {
        ...thr,
        messages: nextMsgs,
        title: guessTitle(nextMsgs),
        updatedAt: Date.now(),
      };
      convCacheRef.current[currentId] = nextMsgs;
      return next;
    });

    setText("");
    setResultsOpen(true);
    setTab("itinerary");
    setItiPage(1);
    setIsStreaming(true);

    try {
      const res = await fetch(`${API_BASE}/conversation/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream, application/x-ndjson, application/json, text/plain",
        },
        body: JSON.stringify({
          session_id: currentId,
          user_id: userIdRef.current,
          content: t, // ✅ IMPORTANT: gửi đúng content, không nhét history/sys vào để agent trả itinerary chuẩn
        }),
        signal: abortRef.current.signal,
      });

      if (res.status === 429) {
        console.warn(`Stream rate limited (429): ${await res.text()}`);
        updateThreadById(currentId, (thr) => {
          const next = [...thr.messages];
          const idx = next.length - 1;
          if (idx >= 0 && next[idx].role === "ai") {
            next[idx] = { role: "ai", content: "⚠️ Bạn gửi quá nhanh. Vui lòng đợi 10–15 giây rồi thử lại." };
          }
          convCacheRef.current[currentId] = next;
          return { ...thr, messages: next, updatedAt: Date.now() };
        });
        return;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let buffer = "";
      let jsonBuffer = "";
      let lastAI = "";

      const handleEventObject = (obj: any) => {
        // ✅ itinerary event
        if (obj?.type === "data-itinerary" && obj?.data) {
          setItineraryByThread((m) => ({ ...m, [currentId]: { ...(m[currentId] || {}), ...(obj.data as any) } }));
        }

        // ✅ text stream (nhiều backend dùng text-delta / delta / content)
        const delta =
          obj?.delta ??
          obj?.content ??
          obj?.choices?.[0]?.delta?.content ??
          obj?.choices?.[0]?.message?.content ??
          "";

        if (typeof delta === "string" && delta) {
          lastAI += delta;
          updateThreadById(currentId, (thr) => {
            const next = [...thr.messages];
            const idx = next.length - 1;
            if (idx >= 0 && next[idx].role === "ai") next[idx] = { role: "ai", content: lastAI };
            else next.push({ role: "ai", content: lastAI });
            convCacheRef.current[currentId] = next;
            return { ...thr, messages: next, updatedAt: Date.now() };
          });
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          // SSE: data: ....
          const payload = trimmed.startsWith("data:") ? trimmed.slice(5).trim() : trimmed;
          if (!payload) continue;
          if (payload === "[DONE]") continue;

          // ✅ Robust JSON chunking: backend có thể cắt JSON làm nhiều mảnh
          // Nếu payload không phải JSON (plain text) -> append thẳng
          if (!payload.startsWith("{") && !payload.startsWith("[")) {
            lastAI += payload;
            updateThreadById(currentId, (thr) => {
              const next = [...thr.messages];
              const idx = next.length - 1;
              if (idx >= 0 && next[idx].role === "ai") next[idx] = { role: "ai", content: lastAI };
              convCacheRef.current[currentId] = next;
              return { ...thr, messages: next, updatedAt: Date.now() };
            });
            continue;
          }

          jsonBuffer += payload;

          // thử parse; nếu fail => đợi chunk tiếp theo
          const obj = safeJsonParse(jsonBuffer);
          if (obj === null) continue;

          jsonBuffer = "";
          handleEventObject(obj);
        }
      }
    } catch (e: any) {
      console.warn("Stream error:", e?.message || e);
      updateThreadById(currentId, (thr) => {
        const next = [...thr.messages];
        const idx = next.length - 1;
        if (idx >= 0 && next[idx].role === "ai") {
          next[idx] = { role: "ai", content: "⚠️ Có lỗi khi gọi agent. Vui lòng thử lại." };
        }
        convCacheRef.current[currentId] = next;
        return { ...thr, messages: next, updatedAt: Date.now() };
      });
    } finally {
      setIsStreaming(false);
    }
  };

  /** ========= Sidebar actions ========= */
  const newChat = () => {
    const id = newSessionIdClient();
    const t: Thread = {
      id,
      title: "Cuộc trò chuyện mới",
      updatedAt: Date.now(),
      messages: [{ role: "ai", content: "Xin chào! Hãy nhập điểm đến & ngân sách, mình sẽ gợi ý lịch trình nhé." }],
    };
    setThreads((prev) => [t, ...prev]);
    setActiveId(id);
    setItiPage(1);
    setTab("itinerary");
    setResultsOpen(true);
  };

  const deleteThread = (id: string) => {
    if (!window.confirm("Xóa cuộc trò chuyện này?")) return;
    setThreads((prev) => prev.filter((t) => t.id !== id));
    delete convCacheRef.current[id];
    delete lastConvFetchAtRef.current[id];
    setItineraryByThread((m) => {
      const { [id]: _, ...rest } = m;
      return rest;
    });

    if (activeId === id) {
      // chọn thread khác hoặc tạo mới
      setTimeout(() => {
        setThreads((prev) => {
          if (prev.length === 0) {
            const nid = newSessionIdClient();
            const blank: Thread = {
              id: nid,
              title: "Cuộc trò chuyện mới",
              updatedAt: Date.now(),
              messages: [{ role: "ai", content: "Xin chào! Hãy nhập điểm đến & ngân sách, mình sẽ gợi ý lịch trình nhé." }],
            };
            setActiveId(nid);
            return [blank];
          } else {
            setActiveId(prev[0].id);
            return prev;
          }
        });
      }, 0);
    }
  };

  /** ========= UI derived ========= */
  const msgs = activeThread?.messages || [];

  /** ========= Render ========= */
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Background */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url(${BG_URL})` }}
      />
      {/* Overlay giống UI zip (tối nhẹ + blur) */}
      <div className="fixed inset-0 -z-10 bg-black/35" />
      <div className="fixed inset-0 -z-10 backdrop-blur-[2px]" />

      <div className="fixed inset-0 -z-10 bg-white/60 backdrop-blur-[1px]" />

      {/* Top Bar */}
      <div className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="rounded-lg bg-white ring-1 ring-black/10 px-2.5 py-2 hover:bg-slate-50"
              title={sidebarOpen ? "Thu gọn" : "Mở"}
            >
              {sidebarOpen ? <IconCollapse className="h-5 w-5 text-slate-700" /> : <IconMenu className="h-5 w-5 text-slate-700" />}
            </button>

            <Link href="/" className="font-semibold text-slate-900">
              Vivuplan
            </Link>

            <div className="ml-2 hidden sm:flex items-center gap-2">
              <button
                onClick={() => setTab("itinerary")}
                className={`rounded-lg px-3 py-1.5 text-sm ring-1 ring-black/10 ${tab === "itinerary" ? "bg-[#0891b2] text-white ring-transparent" : "bg-white hover:bg-slate-50"
                  }`}
              >
                Lịch trình
              </button>
              <button
                onClick={() => setTab("flights")}
                className={`rounded-lg px-3 py-1.5 text-sm ring-1 ring-black/10 ${tab === "flights" ? "bg-[#0891b2] text-white ring-transparent" : "bg-white hover:bg-slate-50"
                  }`}
              >
                Flights
              </button>
              <button
                onClick={() => setTab("hotels")}
                className={`rounded-lg px-3 py-1.5 text-sm ring-1 ring-black/10 ${tab === "hotels" ? "bg-[#0891b2] text-white ring-transparent" : "bg-white hover:bg-slate-50"
                  }`}
              >
                Hotels
              </button>
              <button
                onClick={() => setTab("cars")}
                className={`rounded-lg px-3 py-1.5 text-sm ring-1 ring-black/10 ${tab === "cars" ? "bg-[#0891b2] text-white ring-transparent" : "bg-white hover:bg-slate-50"
                  }`}
              >
                Cars
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setResultsOpen((v) => !v)}
              className="rounded-lg bg-white ring-1 ring-black/10 px-3 py-2 text-sm hover:bg-slate-50"
            >
              {resultsOpen ? "Thu gọn" : "Mở rộng"}
            </button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-12 gap-4">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="col-span-12 md:col-span-3">
            <SectionCard>
              <div className="p-4 flex items-center justify-between">
                <div className="font-semibold text-slate-900">Chats</div>
                <button
                  onClick={newChat}
                  className="rounded-lg bg-[#0891b2] text-white px-3 py-2 text-sm hover:brightness-110"
                >
                  <span className="inline-flex items-center gap-1">
                    <IconPlus className="h-4 w-4" /> New
                  </span>
                </button>
              </div>

              <div className="px-2 pb-2">
                {threads.length === 0 ? (
                  <div className="p-3 text-sm text-slate-600">Chưa có lịch sử.</div>
                ) : (
                  <div className="space-y-1">
                    {threads
                      .slice()
                      .sort((a, b) => b.updatedAt - a.updatedAt)
                      .map((t) => {
                        const active = t.id === activeId;
                        return (
                          <div
                            key={t.id}
                            className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 ${active ? "bg-slate-100" : "hover:bg-slate-50"
                              }`}
                          >
                            <button
                              onClick={() => {
                                setActiveId(t.id);
                                setItiPage(1);
                              }}
                              className="min-w-0 flex-1 text-left"
                            >
                              <div className="truncate text-sm font-medium text-slate-900">{t.title || "New Chat"}</div>
                              <div className="truncate text-xs text-slate-500">
                                {mounted ? `session: ${t.id}` : ""}
                              </div>
                            </button>
                            <button
                              onClick={() => deleteThread(t.id)}
                              className="rounded-lg p-2 hover:bg-white ring-1 ring-transparent hover:ring-black/10"
                              title="Xóa"
                            >
                              <IconTrash className="h-4 w-4 text-slate-600" />
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </SectionCard>
          </div>
        )}

        {/* Chat + Results */}
        <div className={`${sidebarOpen ? "col-span-12 md:col-span-9" : "col-span-12"} grid grid-cols-12 gap-4`}>
          {/* Chat */}
          <div className={`${resultsOpen ? "col-span-12 lg:col-span-7" : "col-span-12"} space-y-4`}>
            <SectionCard>
              <div className="px-4 py-3 border-b border-black/5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">Chat</div>
                    <div className="text-xs text-slate-500">
                      {mounted ? `user_id: ${userIdRef.current} • session: ${activeId || "-"}` : ""}
                    </div>
                  </div>
                  {isStreaming && <Badge className="bg-amber-100 text-amber-800">Đang trả lời…</Badge>}
                </div>
              </div>

              <div className="px-4 py-3 space-y-3 max-h-[55vh] overflow-auto">
                {msgs.length === 0 ? (
                  <div className="text-sm text-slate-600">
                    Nhập yêu cầu để bắt đầu. Ví dụ: “Lập lịch trình 3 ngày ở Đà Lạt, ngân sách 5 triệu, 2 người”.
                  </div>
                ) : (
                  msgs.map((m, idx) => (
                    <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ring-1 ${m.role === "user"
                            ? "bg-[#0891b2] text-white ring-transparent"
                            : "bg-white text-slate-900 ring-black/5"
                          }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 border-t border-black/5">
                <div className="rounded-2xl bg-white ring-1 ring-black/10 shadow flex items-end gap-2 p-2">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Nhập điểm đi/đến, ngày dự kiến và ngân sách…"
                    className="flex-1 resize-none rounded-2xl bg-transparent px-3 py-2 outline-none placeholder:text-slate-400 text-slate-900 max-h-[20rem] overflow-y-auto"
                    rows={1}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = "auto";
                      target.style.height = `${Math.min(target.scrollHeight, 20 * 16)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendText(text);
                      }
                    }}
                  />
                  <button
                    onClick={() => sendText(text)}
                    className="h-11 shrink-0 rounded-xl bg-[#0891b2] px-5 text-white font-medium hover:brightness-110"
                  >
                    Gửi
                  </button>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Tip: Nhập rõ “ngày đi”, “số người”, “ngân sách”, “sở thích”, “điểm xuất phát”.
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Results / Right panel */}
          {resultsOpen && (
            <div className="col-span-12 lg:col-span-5">
              <SectionCard>
                <div className="px-4 py-3 border-b border-black/5 flex items-center justify-between">
                  <div className="font-semibold text-slate-900">
                    {tab === "itinerary" ? "Lịch trình" : tab === "flights" ? "Flights" : tab === "hotels" ? "Hotels" : "Cars"}
                  </div>

                  {/* Show summary if exists */}
                  {tab === "itinerary" && itineraryByThread[activeId]?.trip_summary && (
                    <Badge className="bg-slate-100 text-slate-700">
                      {itineraryByThread[activeId]?.trip_summary?.total_days ?? 0} ngày
                    </Badge>
                  )}
                </div>

                {tab === "itinerary" ? (
                  <>
                    {/* Summary + notes */}
                    <div className="px-4 pt-3">
                      {itineraryByThread[activeId]?.trip_summary && (
                        <div className="rounded-xl bg-white ring-1 ring-black/5 shadow-sm p-3 text-sm text-slate-800">
                          <div className="font-semibold text-slate-900 mb-1">Tóm tắt chuyến đi</div>
                          <div>
                            <span className="font-medium">Điểm đến:</span>{" "}
                            {(itineraryByThread[activeId]?.trip_summary?.destinations || []).join(", ")}
                          </div>
                          {itineraryByThread[activeId]?.trip_summary?.estimated_total_budget && (
                            <div>
                              <span className="font-medium">Ngân sách:</span>{" "}
                              {itineraryByThread[activeId]?.trip_summary?.estimated_total_budget?.min}–
                              {itineraryByThread[activeId]?.trip_summary?.estimated_total_budget?.max}{" "}
                              {itineraryByThread[activeId]?.trip_summary?.estimated_total_budget?.currency}
                            </div>
                          )}
                        </div>
                      )}

                      {itineraryByThread[activeId]?.notes && (
                        <div className="mt-3 rounded-xl bg-white ring-1 ring-black/5 shadow-sm p-3 text-sm text-slate-800">
                          <div className="font-semibold text-slate-900 mb-1">Ghi chú</div>
                          <div>{itineraryByThread[activeId]?.notes}</div>
                        </div>
                      )}
                    </div>

                    <ItineraryList
                      blocks={itineraryBlocks}
                      page={itiPage}
                      pageSize={ITI_PAGE_SIZE}
                      onPrev={() => setItiPage((p) => Math.max(1, p - 1))}
                      onNext={() => setItiPage((p) => p + 1)}
                    />
                  </>
                ) : (
                  <div className="px-4 py-3 text-sm text-slate-600">
                    Chưa triển khai dữ liệu {tab}. (Khi backend có event tương ứng, mình sẽ map vào đây.)
                  </div>
                )}
              </SectionCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
