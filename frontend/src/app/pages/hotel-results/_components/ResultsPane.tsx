"use client";

import { useEffect, useMemo, useState } from "react";

export type UiHotel = {
  id: string;
  name: string;
  city: string;
  priceText?: string;
  strikeText?: string;
  rating10?: number;
  reviews?: number;
  img: string;
  linkId: string;
  lat?: number;
  lng?: number;
};

function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function HotelImage({ src, alt, photos }: { src: string; alt: string; photos?: string[] }) {
  const imgs = useMemo(() => {
    const arr = [src, ...(photos || [])].filter(Boolean);
    // de-dupe
    return Array.from(new Set(arr)).slice(0, 6);
  }, [src, photos]);
  const [active, setActive] = useState(0);
  const [showStrip, setShowStrip] = useState(false);

  return (
    <div
      className="relative h-44 w-full sm:h-full"
      onMouseEnter={() => setShowStrip(true)}
      onMouseLeave={() => {
        setShowStrip(false);
        setActive(0);
      }}
    >
      <img
        src={imgs[active]}
        alt={alt}
        className="h-full w-full object-cover"
        loading="lazy"
      />

      {imgs.length > 1 && showStrip ? (
        <div className="absolute left-0 right-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex gap-2">
            {imgs.map((u, i) => (
              <button
                key={u + i}
                type="button"
                onMouseEnter={() => setActive(i)}
                className={clsx(
                  "h-10 w-14 rounded-lg overflow-hidden ring-1",
                  i === active ? "ring-white" : "ring-white/30 opacity-90 hover:opacity-100"
                )}
                aria-label={`Ảnh ${i + 1}`}
              >
                <img src={u} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function buildPages(current: number, totalPages: number) {
  const out: Array<number | "…"> = [];
  const clamp = (n: number) => Math.max(1, Math.min(totalPages, n));
  const c = clamp(current);
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) out.push(i);
    return out;
  }
  out.push(1);
  const left = Math.max(2, c - 1);
  const right = Math.min(totalPages - 1, c + 1);
  if (left > 2) out.push("…");
  for (let i = left; i <= right; i++) out.push(i);
  if (right < totalPages - 1) out.push("…");
  out.push(totalPages);
  return out;
}

export default function ResultsPane({
  loading,
  error,
  total,
  items,
  page,
  totalPages,
  onPageChange,
  hoveredHotelId,
  onHoverHotel,
  onOpenDeal,
  selectedHotelId,
}: {
  loading: boolean;
  error: string;
  total?: number;
  items: UiHotel[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hoveredHotelId: string | null;
  onHoverHotel: (id: string | null) => void;
  onOpenDeal: (id: string) => void;
  selectedHotelId?: string | null;
}) {
  useEffect(() => {
    if (!selectedHotelId) return;
    const el = document.getElementById(`hotel-${selectedHotelId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selectedHotelId]);

  return (
    <section className="space-y-4">
      <div className="bg-slate-100 ring-1 ring-black/5 shadow-sm">
        <div className="px-4 py-3 text-sm text-slate-700">
          Bao gồm tất cả các loại thuế và phí |{" "}
          {typeof total === "number" ? new Intl.NumberFormat("vi-VN").format(total) : "—"} kết quả
        </div>
      </div>

      <div className="bg-white shadow-xl ring-1 ring-black/5">
        {/* <div className="flex flex-wrap gap-6 px-4 pt-3">
          {["Khuyến nghị", "Đánh giá hàng đầu", "Giá thấp nhất", "Nhiều sao nhất", "Gần nhất trước"].map((t, i) => (
            <button
              key={t}
              className={`pb-2 text-sm ${
                i === 0 ? "text-sky-700 border-b-2 border-sky-600" : "text-slate-700 hover:text-sky-700"
              }`}
              type="button"
            >
              {t}
            </button>
          ))}
        </div> */}
        <div className="px-4 pb-3 pt-3">
          <div className=" rounded-md bg-sky-50 text-slate-700 text-sm px-3 py-2 shadow-sm">
            Chúng tôi tìm thông tin giá từ mọi nguồn trên mạng – số tiền các nhà cung cấp chi trả cho chúng tôi quyết định
            thứ tự sắp xếp kết quả tìm kiếm.
          </div>
        </div>
      </div>

      {loading && <div className="text-slate-600 px-1">Đang tải kết quả…</div>}
      {!loading && error && <div className="text-rose-600 px-1">{error}</div>}

      {!loading && !error && (
        <div className="space-y-4">
          {items.map((h) => {
            const active = hoveredHotelId === h.id;
            const selected = selectedHotelId === h.id;
            const photos = (h as any).photos as string[] | undefined;
            return (
              <article
                key={h.id}
                id={`hotel-${h.id}`}
                onMouseEnter={() => onHoverHotel(h.id)}
                onMouseLeave={() => onHoverHotel(null)}
                className={clsx(
                  "bg-white rounded-2xl overflow-hidden ring-1 transition-shadow",
                  selected || active
                    ? "ring-sky-500 shadow-2xl"
                    : "ring-black/5 shadow-lg hover:shadow-xl"
                )}
              >
                <div className="grid sm:grid-cols-[240px_1fr_220px]">
                  <div className="relative">
                    <HotelImage src={h.img} alt={h.name} photos={photos} />
                    <div className="absolute top-3 left-3">
                      <button
                        type="button"
                        className="h-10 w-10 rounded-full bg-white/90 ring-1 ring-black/10 grid place-items-center hover:bg-white"
                        aria-label="Yêu thích"
                      >
                        ♡
                      </button>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="text-lg font-semibold text-slate-900 leading-snug line-clamp-2">{h.name}</div>
                    <div className="mt-1 text-sm text-slate-600 line-clamp-1">{h.city || ""}</div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {typeof h.rating10 === "number" ? (
                        <div className="inline-flex items-center gap-2">
                          <span className="inline-flex h-7 px-2 items-center rounded-lg bg-slate-900 text-white text-sm font-semibold">
                            {h.rating10.toFixed(1)}
                          </span>
                          <span className="text-sm font-medium text-slate-900">Rất tốt</span>
                          {typeof h.reviews === "number" ? (
                            <span className="text-sm text-slate-600">{h.reviews.toLocaleString("vi-VN")} đánh giá</span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-600">Chưa có đánh giá</span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 sm:border-l border-slate-100 flex flex-col justify-between">
                    <div>
                      <div className="text-xs text-slate-500">Giá từ</div>
                      <div className="mt-1 text-3xl font-extrabold text-slate-900 tracking-tight">
                        {h.priceText ? h.priceText.replace("/đêm", "") : "—"}
                      </div>
                      <div className="text-sm text-slate-500">một đêm</div>
                      {h.strikeText ? <div className="mt-1 text-sm text-rose-600 line-through">{h.strikeText}</div> : null}
                    </div>

                    <button
                      type="button"
                      onMouseEnter={() => onHoverHotel(h.id)}
                      onMouseLeave={() => onHoverHotel(null)}
                      onClick={() => onOpenDeal(h.linkId)}
                      className="mt-4 h-11 rounded-xl bg-slate-900 text-white font-semibold shadow-sm ring-1 ring-black/10 hover:brightness-110 active:scale-[0.99] transition"
                    >
                      Truy cập
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          {items.length === 0 && <div className="text-slate-600">Không có kết quả phù hợp.</div>}

          {/* Pagination */}
          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-2 py-2">
              <button
                type="button"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className={clsx(
                  "min-w-10 h-10 px-3 rounded-lg ring-1 ring-black/10 bg-white",
                  page <= 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-50"
                )}
              >
                ‹
              </button>

              {buildPages(page, totalPages).map((p, idx) =>
                p === "…" ? (
                  <span key={`e-${idx}`} className="px-2 text-slate-500">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onPageChange(p)}
                    className={clsx(
                      "min-w-10 h-10 px-3 rounded-lg ring-1 ring-black/10",
                      p === page ? "bg-slate-900 text-white" : "bg-white hover:bg-slate-50"
                    )}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className={clsx(
                  "min-w-10 h-10 px-3 rounded-lg ring-1 ring-black/10 bg-white",
                  page >= totalPages ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-50"
                )}
              >
                ›
              </button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
