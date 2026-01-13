// src/app/pages/chatbox/page.tsx
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
  id: string;
  title: string;
  updatedAt: number;
  messages: Msg[];
};

const STORAGE_KEY = "vivu_threads_v1";

/** ========= MOCK DATA ========= */
const MOCK_ITINERARY = [
  {
    day: 1,
    date: "12/12",
    city: "Tokyo",
    items: [
      {
        time: "07:30",
        title: "Bay HAN → HND",
        note: "VNA 2 kiện 23kg",
        type: "move",
      },
      { time: "12:10", title: "Check-in Shinjuku Granbell", type: "move" },
      { time: "15:00", title: "Shinjuku Gyoen", type: "sight" },
      { time: "19:00", title: "Ichiran Ramen", type: "meal" },
    ],
  },
  {
    day: 2,
    date: "13/12",
    city: "Tokyo",
    items: [
      { time: "09:00", title: "Asakusa – Sensoji", type: "sight" },
      { time: "12:00", title: "Sushi Zanmai", type: "meal" },
      { time: "15:00", title: "Shibuya Sky", type: "sight" },
      { time: "20:00", title: "TeamLab Planets", type: "sight" },
    ],
  },
  {
    day: 3,
    date: "14/12",
    city: "Hakone",
    items: [
      { time: "08:00", title: "JR Shinjuku → Odawara", type: "move" },
      { time: "11:00", title: "Hakone Ropeway", type: "sight" },
      { time: "18:30", title: "Ryokan dinner", type: "meal" },
    ],
  },
  {
    day: 4,
    date: "15/12",
    city: "Tokyo",
    items: [
      { time: "10:00", title: "Ueno Park & Zoo", type: "sight" },
      { time: "13:00", title: "Gyukatsu Motomura", type: "meal" },
      { time: "16:00", title: "Akihabara shopping", type: "sight" },
    ],
  },
];

const MOCK_FLIGHTS = Array.from({ length: 13 }).map((_, i) => ({
  id: `F${i + 1}`,
  from: ["HAN", "SGN", "DAD"][i % 3],
  to: ["HND", "NRT", "KIX"][i % 3],
  depart: `0${(i % 9) + 8}:30 • ${10 + (i % 9)}/12`,
  arrive: `${(i % 12) + 12}:10 • ${10 + (i % 9)}/12`,
  airline: ["Vietnam Airlines", "JAL", "ANA"][i % 3],
  price: 3500000 + i * 120000,
  stops: i % 2,
}));

const MOCK_HOTELS = Array.from({ length: 12 }).map((_, i) => ({
  id: `H${i + 1}`,
  name:
    ["Shinjuku Granbell", "Hotel The Knot", "Park Hyatt"][i % 3] + ` #${i + 1}`,
  star: (i % 3) + 3,
  location: ["Shinjuku", "Shibuya", "Ueno"][i % 3] + ", Tokyo",
  price: 1200000 + i * 90000,
  img: "https://images.unsplash.com/photo-1551776235-dde6d4829808?q=80&w=1200&auto=format&fit=crop",
}));

const MOCK_CARS = Array.from({ length: 11 }).map((_, i) => ({
  id: `C${i + 1}`,
  name: ["Mazda 3", "Toyota Sienta", "Suzuki Swift"][i % 3],
  supplier: ["Nissan Rent a Car", "Klook", "Trip.com"][i % 3],
  auto: i % 2 === 0,
  seats: [5, 7, 5][i % 3],
  price: 1500000 + i * 100000,
  img: "https://images.unsplash.com/photo-1606666385590-8a8631987e51?q=80&w=1200&auto=format&fit=crop",
}));

/** ========= UI helpers ========= */
function Badge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-[2px] text-[11px] ${className}`}
    >
      {children}
    </span>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/90 ring-1 ring-black/5 shadow">
      {children}
    </div>
  );
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
      <path
        d="M6 7h12M6 12h12M6 17h12"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** ========= Cards ========= */
function FlightCard({ f }: { f: (typeof MOCK_FLIGHTS)[number] }) {
  return (
    <div className="rounded-xl border bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
      <div className="p-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-slate-600">{f.airline}</div>
          <div className="text-lg font-semibold text-slate-900">
            {f.from} → {f.to}
          </div>
          <div className="text-sm text-slate-700 mt-1">
            {f.depart} · đến {f.arrive}
          </div>
          <div className="mt-2">
            <Badge
              className={
                f.stops === 0
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }
            >
              {f.stops === 0 ? "Bay thẳng" : `${f.stops} điểm dừng`}
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">từ</div>
          <div className="text-2xl font-extrabold text-slate-900">
            {f.price.toLocaleString("vi-VN")} đ
          </div>
          <button className="mt-3 h-10 rounded-lg bg-[#0891b2] px-4 text-white text-sm font-medium hover:brightness-110">
            Chọn vé
          </button>
        </div>
      </div>
    </div>
  );
}

function HotelCard({ h }: { h: (typeof MOCK_HOTELS)[number] }) {
  return (
    <div className="rounded-xl border bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
      <div className="aspect-[16/9] bg-slate-100">
        <img src={h.img} alt={h.name} className="h-full w-full object-cover" />
      </div>
      <div className="p-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-slate-900">{h.name}</div>
          <div className="text-sm text-slate-600">{h.location}</div>
          <div className="mt-1 text-amber-500 text-sm">{"★".repeat(h.star)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">mỗi đêm</div>
          <div className="text-2xl font-extrabold text-slate-900">
            {h.price.toLocaleString("vi-VN")} đ
          </div>
          <button className="mt-3 h-10 rounded-lg bg-[#0891b2] px-4 text-white text-sm font-medium hover:brightness-110">
            Xem phòng
          </button>
        </div>
      </div>
    </div>
  );
}

function CarCard({ c }: { c: (typeof MOCK_CARS)[number] }) {
  return (
    <div className="rounded-xl border bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
      <div className="aspect-[16/9] bg-slate-100">
        <img src={c.img} alt={c.name} className="h-full w-full object-cover" />
      </div>
      <div className="p-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-slate-900">{c.name}</div>
          <div className="text-sm text-slate-600">{c.supplier}</div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-700">
            <Badge className="bg-slate-100 text-slate-700">{c.seats} chỗ</Badge>
            <Badge className="bg-slate-100 text-slate-700">
              {c.auto ? "Tự động" : "Số sàn"}
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">tổng cộng</div>
          <div className="text-2xl font-extrabold text-slate-900">
            {c.price.toLocaleString("vi-VN")} đ
          </div>
          <button className="mt-3 h-10 rounded-lg bg-[#0891b2] px-4 text-white text-sm font-medium hover:brightness-110">
            Thuê xe
          </button>
        </div>
      </div>
    </div>
  );
}

/** ========= Pagination ========= */
function Pager({
  total,
  page,
  onChange,
  pageSize = 5,
  maxPages = 5,
}: {
  total: number;
  page: number;
  onChange: (n: number) => void;
  pageSize?: number;
  maxPages?: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clamped = Math.min(totalPages, Math.max(1, page));
  const start = Math.max(1, clamped - Math.floor(maxPages / 2));
  const end = Math.min(totalPages, start + maxPages - 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      <button
        className="rounded-md border px-3 py-2 text-sm disabled:opacity-40"
        disabled={clamped === 1}
        onClick={() => onChange(clamped - 1)}
      >
        ‹
      </button>

      {pages[0] > 1 && (
        <>
          <button
            className="h-9 w-9 rounded-md border text-sm"
            onClick={() => onChange(1)}
          >
            1
          </button>
          <span className="px-1 text-slate-500">…</span>
        </>
      )}

      {pages.map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`h-9 w-9 rounded-md border text-sm ${
            n === clamped ? "bg-[#0891b2] text-white border-[#0891b2]" : "bg-white"
          }`}
        >
          {n}
        </button>
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          <span className="px-1 text-slate-500">…</span>
          <button
            className="h-9 w-9 rounded-md border text-sm"
            onClick={() => onChange(totalPages)}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        className="rounded-md border px-3 py-2 text-sm disabled:opacity-40"
        disabled={clamped === totalPages}
        onClick={() => onChange(clamped + 1)}
      >
        ›
      </button>
    </div>
  );
}

/** ========= Helpers ========= */
const now = () => Date.now();
const uid = () => Math.random().toString(36).slice(2, 10);

function guessTitle(msgs: Msg[]) {
  const firstUser = msgs.find((m) => m.role === "user")?.content?.trim();
  if (!firstUser) return "Cuộc trò chuyện mới";
  return firstUser.length > 28 ? firstUser.slice(0, 28) + "…" : firstUser;
}

function defaultThread(): Thread {
  const init: Msg[] = [
    {
      role: "ai",
      content:
        "Xin chào! Nhập điểm đến & ngân sách, mình sẽ gợi ý lịch trình, vé, khách sạn và xe nhé.",
    },
  ];
  return {
    id: uid(),
    title: "Cuộc trò chuyện mới",
    updatedAt: now(),
    messages: init,
  };
}

/** ========= Main Page ========= */
export default function ChatboxPage() {
  // create one initial thread (avoid closure bug)
  const initialThread = useMemo(() => defaultThread(), []);
  const [threads, setThreads] = useState<Thread[]>(() => [initialThread]);
  const [activeId, setActiveId] = useState<string>(() => initialThread.id);

  const active = useMemo(
    () => threads.find((t) => t.id === activeId) ?? threads[0],
    [threads, activeId]
  );

  const sortedThreads = useMemo(
    () => threads.slice().sort((a, b) => b.updatedAt - a.updatedAt),
    [threads]
  );

  // chat input
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  // results pane
  const [resultsOpen, setResultsOpen] = useState(true);
  const [tab, setTab] = useState<TabKey>("itinerary");

  // mobile threads drawer
  const [threadsOpen, setThreadsOpen] = useState(false);

  // lock scroll when drawer open
  useEffect(() => {
    if (!threadsOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [threadsOpen]);

  // ESC to close drawer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setThreadsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Pagination (lists)
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  // Pagination (itinerary)
  const ITI_PAGE_SIZE = 2;
  const [itiPage, setItiPage] = useState(1);

  const itiSlice = useMemo(
    () =>
      MOCK_ITINERARY.slice(
        (itiPage - 1) * ITI_PAGE_SIZE,
        itiPage * ITI_PAGE_SIZE
      ),
    [itiPage]
  );

  const rightData = useMemo(() => {
    if (tab === "flights") return MOCK_FLIGHTS;
    if (tab === "hotels") return MOCK_HOTELS;
    if (tab === "cars") return MOCK_CARS;
    return [];
  }, [tab]);

  const pageSlice = rightData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /** ========= Persist threads ========= */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Thread[];
      if (Array.isArray(parsed) && parsed.length) {
        setThreads(parsed);
        setActiveId(parsed[0].id);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
    } catch {
      // ignore
    }
  }, [threads]);

  /** ========= Scroll to bottom ========= */
  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [active?.messages?.length]);

  /** ========= Reset pagination when tab changes ========= */
  useEffect(() => {
    if (tab === "itinerary") setItiPage(1);
    else setPage(1);
  }, [tab]);

  /** ========= Receive draft from previous page ========= */
  useEffect(() => {
    const draft = sessionStorage.getItem("vivu_draft");
    if (!draft) return;
    sessionStorage.removeItem("vivu_draft");
    sendText(draft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** ========= Thread actions ========= */
  const createNewChat = () => {
    const t = defaultThread();
    setThreads((prev) => [t, ...prev]);
    setActiveId(t.id);
    setText("");
    setTab("itinerary");
    setItiPage(1);
  };

  const deleteChat = (id: string) => {
    setThreads((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (!next.length) {
        const t = defaultThread();
        setActiveId(t.id);
        return [t];
      }
      if (activeId === id) setActiveId(next[0].id);
      return next;
    });
  };

  /** ========= Send logic ========= */
  const updateThreadById = (id: string, updater: (t: Thread) => Thread) => {
    setThreads((prev) => prev.map((t) => (t.id === id ? updater(t) : t)));
  };

  const sendText = (raw: string) => {
    const t = raw.trim();
    if (!t) return;

    const currentId = activeId;

    const userMsg: Msg = { role: "user", content: t };

    updateThreadById(currentId, (thr) => {
      const nextMsgs: Msg[] = [...thr.messages, userMsg];
      return {
        ...thr,
        messages: nextMsgs,
        title: guessTitle(nextMsgs),
        updatedAt: now(),
      };
    });

    setText("");

    // show results
    setResultsOpen(true);
    setTab("itinerary");
    setItiPage(1);

    setTimeout(() => {
      const aiMsg: Msg = {
        role: "ai",
        content:
          "Mình đã dựng lịch trình nháp bên phải. Bạn có thể chuyển sang Flights/Hotels/Cars để xem gợi ý chi tiết.",
      };

      updateThreadById(currentId, (thr) => {
        const nextMsgs: Msg[] = [...thr.messages, aiMsg];
        return {
          ...thr,
          messages: nextMsgs,
          title: guessTitle(nextMsgs),
          updatedAt: now(),
        };
      });
    }, 400);
  };

  const send = () => sendText(text);

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      {BG_URL && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${BG_URL}")` }}
            aria-hidden
          />
          <div className="absolute inset-0 bg-black/25" aria-hidden />
        </>
      )}

      <div className="relative z-10 min-h-screen">
        <div className="mx-auto max-w-[1400px] px-4 py-6">
          {/* Top badge row */}
          <div className="mb-4 flex items-center justify-between gap-3">
            {/* ✅ logo click -> home */}
            <Link
              href="/"
              className="inline-flex items-center gap-3 rounded-xl bg-white/95 px-3.5 py-2.5 ring-1 ring-black/5 shadow hover:brightness-[0.98]"
              title="Về trang chủ"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#0891b2] text-white font-bold">
                V
              </span>
              <div className="leading-tight">
                <div className="font-semibold text-slate-900">VivuPlan</div>
                <div className="text-xs text-slate-600">AI Trip Assistant</div>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              {/* ✅ Mobile: open threads */}
              <button
                type="button"
                onClick={() => setThreadsOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-sm ring-1 ring-black/10 hover:bg-white"
                title="Mở danh sách chat"
              >
                <IconMenu className="h-5 w-5 text-slate-700" />
                Chats
              </button>

              {/* Toggle results */}
              <button
                type="button"
                onClick={() => setResultsOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-sm ring-1 ring-black/10 hover:bg-white"
                title={resultsOpen ? "Thu gọn kết quả" : "Mở kết quả"}
              >
                <IconCollapse className="h-5 w-5 text-slate-700" />
                {resultsOpen ? "Thu kết quả" : "Mở kết quả"}
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            {/* Sidebar threads (desktop) */}
            <aside className="hidden lg:block w-[300px] shrink-0">
              <SectionCard>
                <div className="p-3 border-b bg-slate-50 flex items-center justify-between">
                  <div className="font-semibold text-slate-900">Chats</div>
                  <button
                    type="button"
                    onClick={createNewChat}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#0891b2] px-3 py-2 text-sm text-white hover:brightness-110"
                  >
                    <IconPlus className="h-5 w-5" />
                    New
                  </button>
                </div>

                <div className="max-h-[72vh] overflow-auto p-2">
                  <div className="space-y-1">
                    {sortedThreads.map((t) => {
                      const isActive = t.id === activeId;
                      return (
                        <div
                          key={t.id}
                          className={`group flex items-center justify-between gap-2 rounded-xl px-3 py-2 ring-1 ${
                            isActive
                              ? "bg-[#0891b2]/10 ring-[#0891b2]/20"
                              : "bg-white ring-black/5 hover:bg-slate-50"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setActiveId(t.id)}
                            className="flex-1 text-left"
                            title={t.title}
                          >
                            <div className="text-sm font-medium text-slate-900 line-clamp-1">
                              {t.title}
                            </div>
                            <div className="text-xs text-slate-500">
                              {new Date(t.updatedAt).toLocaleString("vi-VN")}
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteChat(t.id)}
                            className="opacity-0 group-hover:opacity-100 transition rounded-lg p-2 hover:bg-white"
                            title="Xoá cuộc chat"
                          >
                            <IconTrash className="h-5 w-5 text-slate-600" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </SectionCard>
            </aside>

            {/* Main area */}
            <main className="flex-1">
              <div
                className={`grid gap-4 ${
                  resultsOpen ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1"
                }`}
              >
                {/* LEFT: chat */}
                <div className={resultsOpen ? "lg:col-span-5" : ""}>
                  <div className={!resultsOpen ? "mx-auto max-w-[820px]" : ""}>
                    <SectionCard>
                      <div className="flex h-[76vh] min-h-[480px] flex-col overflow-hidden">
                        <div
                          ref={listRef}
                          className="flex-1 overflow-auto p-4 space-y-3"
                        >
                          {active.messages.map((m, i) => (
                            <div
                              key={i}
                              className={`flex ${m.role === "user" ? "justify-end" : ""}`}
                            >
                              <div
                                className={`rounded-2xl px-4 py-2.5 leading-relaxed shadow-sm max-w-[85%] ${
                                  m.role === "user"
                                    ? "bg-[#0891b2] text-white"
                                    : "bg-white ring-1 ring-slate-200 text-slate-900"
                                }`}
                              >
                                {m.content}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="p-3 border-t bg-white/80 backdrop-blur">
                          <div className="flex items-center gap-2 rounded-xl ring-1 ring-black/10 bg-white">
                            <input
                              value={text}
                              onChange={(e) => setText(e.target.value)}
                              placeholder="Nhập câu hỏi…"
                              className="flex-1 rounded-xl bg-transparent px-4 py-3 outline-none"
                              onKeyDown={(e) => e.key === "Enter" && send()}
                            />
                            <button
                              type="button"
                              onClick={send}
                              className="m-1 mr-2 h-10 shrink-0 rounded-lg bg-[#0891b2] px-4 text-white text-sm font-medium hover:brightness-110"
                            >
                              Gửi
                            </button>
                          </div>
                        </div>
                      </div>
                    </SectionCard>
                  </div>
                </div>

                {/* RIGHT: results */}
                {resultsOpen && (
                  <div className="lg:col-span-7">
                    <SectionCard>
                      {/* Tabs */}
                      <div className="flex items-center justify-between gap-2 p-3 border-b bg-slate-50">
                        <div className="flex items-center gap-2">
                          {(
                            [
                              { key: "itinerary", label: "Lịch trình" },
                              { key: "flights", label: "Flights" },
                              { key: "hotels", label: "Hotels" },
                              { key: "cars", label: "Cars" },
                            ] as { key: TabKey; label: string }[]
                          ).map((t) => (
                            <button
                              key={t.key}
                              type="button"
                              onClick={() => {
                                setTab(t.key);
                                setPage(1);
                              }}
                              className={`rounded-lg px-3 py-2 text-sm ${
                                tab === t.key
                                  ? "bg-[#0891b2] text-white"
                                  : "bg-white border text-slate-700"
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => setResultsOpen(false)}
                          className="rounded-lg border bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          title="Thu gọn"
                        >
                          Thu gọn
                        </button>
                      </div>

                      <div className="p-4">
                        {/* ITINERARY */}
                        {tab === "itinerary" && (
                          <>
                            <div className="mb-3 flex flex-wrap gap-2">
                              {MOCK_ITINERARY.map((d, i) => {
                                const pageOfDay = Math.floor(i / ITI_PAGE_SIZE) + 1;
                                const isVisible = pageOfDay === itiPage;
                                return (
                                  <button
                                    key={d.day}
                                    type="button"
                                    onClick={() => setItiPage(pageOfDay)}
                                    className={`px-3 py-1.5 rounded-md text-sm border ${
                                      isVisible
                                        ? "bg-[#0891b2] text-white border-[#0891b2]"
                                        : "bg-white text-slate-700"
                                    }`}
                                    title={`Nhảy đến Ngày ${d.day}`}
                                  >
                                    Ngày {d.day}
                                  </button>
                                );
                              })}
                            </div>

                            <div className="space-y-4">
                              {itiSlice.map((d, idx) => (
                                <div
                                  key={`${d.day}-${idx}`}
                                  className="rounded-xl border bg-white overflow-hidden"
                                >
                                  <div className="px-4 py-2 bg-slate-50 flex items-center justify-between">
                                    <div className="font-semibold text-slate-900">
                                      Ngày {d.day} — {d.city}
                                    </div>
                                    <div className="text-xs text-slate-600">{d.date}</div>
                                  </div>
                                  <ol className="p-4 space-y-3">
                                    {d.items.map((it: any, i2: number) => (
                                      <li key={i2} className="flex gap-3">
                                        <div className="mt-1">
                                          <span
                                            className={`inline-block h-2.5 w-2.5 rounded-full ${
                                              it.type === "move"
                                                ? "bg-sky-500"
                                                : it.type === "meal"
                                                ? "bg-amber-500"
                                                : "bg-emerald-500"
                                            }`}
                                          />
                                        </div>
                                        <div>
                                          <div className="text-sm text-slate-600">{it.time}</div>
                                          <div className="text-slate-900 font-medium">{it.title}</div>
                                          {"note" in it && it.note && (
                                            <div className="text-xs text-slate-600">{it.note}</div>
                                          )}
                                        </div>
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              ))}
                            </div>

                            <Pager
                              total={MOCK_ITINERARY.length}
                              page={itiPage}
                              onChange={setItiPage}
                              pageSize={ITI_PAGE_SIZE}
                            />
                          </>
                        )}

                        {/* FLIGHTS */}
                        {tab === "flights" && (
                          <>
                            <div className="grid grid-cols-1 gap-4">
                              {pageSlice.map((f: any) => (
                                <FlightCard key={f.id} f={f} />
                              ))}
                            </div>
                            <Pager
                              total={MOCK_FLIGHTS.length}
                              page={page}
                              onChange={setPage}
                              pageSize={PAGE_SIZE}
                            />
                          </>
                        )}

                        {/* HOTELS */}
                        {tab === "hotels" && (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {pageSlice.map((h: any) => (
                                <HotelCard key={h.id} h={h} />
                              ))}
                            </div>
                            <Pager
                              total={MOCK_HOTELS.length}
                              page={page}
                              onChange={setPage}
                              pageSize={PAGE_SIZE}
                            />
                          </>
                        )}

                        {/* CARS */}
                        {tab === "cars" && (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {pageSlice.map((c: any) => (
                                <CarCard key={c.id} c={c} />
                              ))}
                            </div>
                            <Pager
                              total={MOCK_CARS.length}
                              page={page}
                              onChange={setPage}
                              pageSize={PAGE_SIZE}
                            />
                          </>
                        )}
                      </div>
                    </SectionCard>
                  </div>
                )}
              </div>

              {/* Floating open button when collapsed */}
              {!resultsOpen && (
                <button
                  type="button"
                  onClick={() => setResultsOpen(true)}
                  className="fixed bottom-6 right-6 rounded-2xl bg-[#0891b2] px-4 py-3 text-white shadow-lg hover:brightness-110"
                >
                  Mở kết quả
                </button>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* ✅ Mobile Threads Drawer */}
      {threadsOpen && (
        <div className="fixed inset-0 z-[120] lg:hidden">
          {/* overlay */}
          <button
            type="button"
            aria-label="Đóng danh sách chat"
            onClick={() => setThreadsOpen(false)}
            className="absolute inset-0 bg-black/35"
          />

          {/* bottom sheet */}
          <div className="absolute inset-0 flex items-end justify-center p-3">
            <div className="w-full max-w-md rounded-t-2xl bg-white shadow-xl ring-1 ring-black/10 overflow-hidden">
              <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
                <div className="font-semibold text-slate-900">Chats</div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      createNewChat();
                      setThreadsOpen(false);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#0891b2] px-3 py-2 text-sm text-white hover:brightness-110"
                  >
                    <IconPlus className="h-5 w-5" />
                    New
                  </button>
                  <button
                    type="button"
                    onClick={() => setThreadsOpen(false)}
                    className="h-9 w-9 rounded-lg hover:bg-slate-100 grid place-items-center"
                    aria-label="Đóng"
                    title="Đóng"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="max-h-[70vh] overflow-auto p-2">
                <div className="space-y-1">
                  {sortedThreads.map((t) => {
                    const isActive = t.id === activeId;
                    return (
                      <div
                        key={t.id}
                        className={`group flex items-center justify-between gap-2 rounded-xl px-3 py-2 ring-1 ${
                          isActive
                            ? "bg-[#0891b2]/10 ring-[#0891b2]/20"
                            : "bg-white ring-black/5 hover:bg-slate-50"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveId(t.id);
                            setThreadsOpen(false);
                          }}
                          className="flex-1 text-left"
                          title={t.title}
                        >
                          <div className="text-sm font-medium text-slate-900 line-clamp-1">
                            {t.title}
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(t.updatedAt).toLocaleString("vi-VN")}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteChat(t.id)}
                          className="rounded-lg p-2 hover:bg-white"
                          title="Xoá cuộc chat"
                        >
                          <IconTrash className="h-5 w-5 text-slate-600" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 border-t bg-white">
                <button
                  type="button"
                  onClick={() => setThreadsOpen(false)}
                  className="w-full h-11 rounded-xl border border-slate-200 text-slate-800 hover:bg-slate-50"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
