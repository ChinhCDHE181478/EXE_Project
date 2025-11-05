"use client";
import { useEffect, useRef, useState } from "react";

type Msg = { role: "ai" | "user"; content: string };
type Conv = { id: string; title: string; messages: Msg[] };

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

const HERO_TITLE = "Bạn muốn đi đâu, khi nào & ngân sách?";
const QUICK_SUGGESTS = [
  "HAN ⇄ DAD cuối tuần",
  "SGN → BKK 3N2Đ",
  "Khách sạn 4★ Đà Lạt",
];

export default function ChatboxPage() {
  const [openSidebar, setOpenSidebar] = useState(true);
  const [openTopMenu, setOpenTopMenu] = useState(false);

  const [convs, setConvs] = useState<Conv[]>([
    { id: "c1", title: "Cuộc trò chuyện 1", messages: [] },
  ]);
  const [activeId, setActiveId] = useState("c1");
  const active = convs.find((c) => c.id === activeId)!;

  const [text, setText] = useState("");
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [summary, setSummary] = useState<TripSummary | null>(null);
  const [notes, setNotes] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);
  const isEmpty = active.messages.length === 0;

  const scrollToEnd = () =>
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  useEffect(() => {
    scrollToEnd();
  }, [active?.messages]);

  // ========= STREAM LOGIC =========
  const send = async (preFill?: string) => {
    const t = (preFill ?? text).trim();
    if (!t) return;

    setConvs((arr) =>
      arr.map((c) =>
        c.id === activeId
          ? { ...c, messages: [...c.messages, { role: "user", content: t }] }
          : c
      )
    );
    setText("");

    setConvs((arr) =>
      arr.map((c) =>
        c.id === activeId
          ? { ...c, messages: [...c.messages, { role: "ai", content: "" }] }
          : c
      )
    );

    const response = await fetch(
      "http://localhost:4000/v1/conversation/stream",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: "4",
          user_id: "1",
          content: t,
        }),
      }
    );

    if (!response.body) return;
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let buffer = "";
    let jsonBuffer = "";
    let lastAI = "";
    let addedPlanNotice = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const raw = line.replace("data:", "").trim();
        if (raw === "[DONE]") break;

        jsonBuffer += raw;

        if (!jsonBuffer.startsWith("{") || !jsonBuffer.endsWith("}")) continue;

        try {
          const data = JSON.parse(jsonBuffer);
          jsonBuffer = "";

          // 💬 Chat stream
          if (data.type === "text-delta") {
            lastAI += data.delta;
            setConvs((arr) =>
              arr.map((c) =>
                c.id === activeId
                  ? {
                      ...c,
                      messages: c.messages.map((m, idx) =>
                        idx === c.messages.length - 1
                          ? { ...m, content: lastAI }
                          : m
                      ),
                    }
                  : c
              )
            );
          }

          // 🗓️ Itinerary stream
          if (data.type === "data-itinerary" && data.data) {
            const trip = data.data as ItineraryResponse;

            if (trip.trip_summary) setSummary(trip.trip_summary);

            const itineraryList = trip.itinerary ?? [];
            if (Array.isArray(itineraryList) && itineraryList.length > 0) {
              setItinerary((prev) => {
                const merged = [...prev];
                for (const d of itineraryList) {
                  // bỏ qua các item thiếu date hoặc location
                  if (!d?.date_ || d.date_.length < 10 || !d.location) continue;
                  const idx = merged.findIndex((x) => x.date_ === d.date_);
                  if (idx >= 0) merged[idx] = { ...merged[idx], ...d };
                  else merged.push(d);
                }
                return merged;
              });
            }

            if (trip.notes) setNotes(trip.notes);

            if (!addedPlanNotice) {
              setConvs((arr) =>
                arr.map((c) =>
                  c.id === activeId
                    ? {
                        ...c,
                        messages: [
                          ...c.messages,
                          {
                            role: "ai",
                            content:
                              "🗓️ Lịch trình của bạn đang được chuẩn bị, vui lòng đợi một chút nha",
                          },
                        ],
                      }
                    : c
                )
              );
              addedPlanNotice = true;
            }
          }
        } catch (err) {
          if (!(jsonBuffer.startsWith("{") && jsonBuffer.endsWith("}")))
            continue;
          console.warn("⚠️ Parse error:", err, jsonBuffer);
          jsonBuffer = "";
        }
      }
    }
  };

  const newChat = () => {
    const id = crypto.randomUUID();
    const next: Conv = {
      id,
      title: `Cuộc trò chuyện ${convs.length + 1}`,
      messages: [],
    };
    setConvs((arr) => [next, ...arr]);
    setActiveId(id);
    setItinerary([]);
    setSummary(null);
    setNotes(null);
  };

  const deleteActive = () => {
    if (!active) return;
    if (!window.confirm("Xóa cuộc trò chuyện hiện tại?")) return;

    setConvs((arr) => {
      const next = arr.filter((c) => c.id !== activeId);
      if (next.length > 0) {
        setActiveId(next[0].id);
        return next;
      }
      const id = crypto.randomUUID();
      const blank: Conv = { id, title: "Cuộc trò chuyện mới", messages: [] };
      setActiveId(id);
      return [blank];
    });
  };

  return (
    <div
      className="relative min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-slate-100"
      onClick={() => setOpenTopMenu(false)}
    >
      {/* Top-right menu */}
      <div className="fixed right-4 top-4 z-30">
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenTopMenu((v) => !v);
            }}
            className="rounded-lg bg-slate-900/70 backdrop-blur ring-1 ring-white/10 shadow px-3 py-2 hover:bg-slate-800"
            title="Tùy chọn"
          >
            …
          </button>
          {openTopMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900/95 ring-1 ring-white/10 shadow-2xl overflow-hidden">
              <button className="w-full text-left px-3 py-2 hover:bg-slate-800 text-sm">
                Di chuyển sang dự án →
              </button>
              <button className="w-full text-left px-3 py-2 hover:bg-slate-800 text-sm">
                Xóa khỏi Project
              </button>
              <div className="my-1 h-px bg-white/10" />
              <button className="w-full text-left px-3 py-2 hover:bg-slate-800 text-sm">
                Lưu trữ
              </button>
              <button className="w-full text-left px-3 py-2 hover:bg-slate-800 text-sm">
                Báo cáo cuộc trò chuyện
              </button>
              <div className="my-1 h-px bg-white/10" />
              <button
                onClick={deleteActive}
                className="w-full text-left px-3 py-2 hover:bg-red-900/40 text-red-300 text-sm"
              >
                Xóa
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      {/* ===== Chat + Lịch trình layout ===== */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-24 pb-32 grid grid-cols-3 gap-6">
        {/* ==== Chat area (2/3) ==== */}
        <div className="col-span-2 flex flex-col">
          {isEmpty ? (
            <div className="min-h-[60vh] grid place-items-center text-center">
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold text-slate-100">
                  {HERO_TITLE}
                </h1>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {QUICK_SUGGESTS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-full border border-white/15 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div
              ref={listRef}
              className="flex-1 max-h-[65vh] overflow-auto space-y-3 pr-1"
            >
              {active.messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : ""}`}
                >
                  <div
                    className={`rounded-2xl px-4 py-2.5 leading-relaxed shadow-sm max-w-[78%] ${
                      m.role === "user"
                        ? "bg-[#0891b2] text-white"
                        : "bg-slate-800 text-slate-100 ring-1 ring-white/10"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ===== Input bar (auto-height) ===== */}
          <div className="mt-4">
            <div className="w-full rounded-2xl bg-slate-900/70 backdrop-blur ring-1 ring-white/10 shadow-lg flex items-end gap-2 p-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Nhập điểm đi/đến, ngày dự kiến và ngân sách…"
                className="flex-1 resize-none rounded-2xl bg-transparent px-4 py-3 outline-none placeholder:text-slate-400 text-slate-100 max-h-[20rem] overflow-y-auto"
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = `${Math.min(
                    target.scrollHeight,
                    20 * 16
                  )}px`; // ~10 dòng
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              <button
                onClick={() => send()}
                className="h-11 shrink-0 rounded-xl bg-[#0891b2] px-5 text-white font-medium hover:brightness-110"
              >
                Gửi
              </button>
            </div>
          </div>
        </div>

        {/* ==== Itinerary (1/3) ==== */}
        <div className="col-span-1">
          <div className="sticky top-20 p-4 bg-slate-900/40 rounded-2xl ring-1 ring-white/10 h-[75vh] overflow-auto shadow-lg">
            <h2 className="text-lg font-semibold mb-2 text-sky-300">
              🗓️ Lịch trình gợi ý
            </h2>

            {itinerary.length === 0 ? (
              <p className="text-slate-400 italic text-sm mt-3">
                💭 Chưa có lịch trình nào được sinh ra.
              </p>
            ) : (
              <>
                {summary && (
                  <div className="text-sm mb-4 space-y-1">
                    <p>
                      <strong>Tổng số ngày:</strong> {summary.total_days}
                    </p>
                    <p>
                      <strong>Điểm đến:</strong>{" "}
                      {summary.destinations?.join(", ")}
                    </p>
                    {summary.estimated_total_budget && (
                      <p>
                        <strong>Ngân sách:</strong>{" "}
                        {summary.estimated_total_budget.min}–
                        {summary.estimated_total_budget.max}{" "}
                        {summary.estimated_total_budget.currency}
                      </p>
                    )}
                  </div>
                )}

                {itinerary
                  .filter((d) => d?.date_ && d.date_.length >= 10 && d.location)
                  .map((day, i) => (
                    <div
                      key={i}
                      className="mb-4 pb-3 border-b border-white/10 last:border-0 text-sm"
                    >
                      <p className="font-medium text-sky-200 mb-1">
                        Ngày {i + 1} — {day.date_} ({day.location})
                      </p>
                      {day.morning && (
                        <p>
                          🌅 <strong>Sáng:</strong> {day.morning}
                        </p>
                      )}
                      {day.afternoon && (
                        <p>
                          🌞 <strong>Chiều:</strong> {day.afternoon}
                        </p>
                      )}
                      {day.evening && (
                        <p>
                          🌙 <strong>Tối:</strong> {day.evening}
                        </p>
                      )}
                      {day.meals?.length > 0 && (
                        <div className="mt-2">
                          <p className="font-medium text-sky-200">🍽️ Bữa ăn:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {day.meals.map((m, idx) => (
                              <li key={idx}>{m}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {day.transportation && (
                        <p className="mt-2">
                          🚗 <strong>Di chuyển:</strong> {day.transportation}
                        </p>
                      )}
                      {day.estimated_cost && (
                        <p>
                          💰 <strong>Chi phí:</strong> {day.estimated_cost.min}–
                          {day.estimated_cost.max} {day.estimated_cost.currency}
                        </p>
                      )}
                      {day.attraction_recommendations?.length > 0 && (
                        <div className="mt-2">
                          <p className="font-medium text-sky-200">
                            📍 Gợi ý tham quan:
                          </p>
                          <ul className="list-disc list-inside space-y-1">
                            {day.attraction_recommendations.map((a, idx) => (
                              <li key={idx}>{a.reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {day.restaurant_recommendations?.length > 0 && (
                        <div className="mt-2">
                          <p className="font-medium text-sky-200">
                            🍴 Gợi ý nhà hàng:
                          </p>
                          <ul className="list-disc list-inside space-y-1">
                            {day.restaurant_recommendations.map((r, idx) => (
                              <li key={idx}>{r.reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}

                {notes && (
                  <div className="mt-4 p-3 bg-slate-800/70 rounded-xl ring-1 ring-white/10 text-sm">
                    <p className="font-medium text-sky-200 mb-1">📝 Ghi chú:</p>
                    <p>{notes}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
