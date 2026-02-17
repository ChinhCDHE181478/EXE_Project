"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import FlightSearchCard, { FlightSearchValue } from "@/app/pages/flights/_components/FlightSearchCard";
import FlightResultsPane from "./_components/FlightResultsPane";
import { flightService } from "@/lib/services/flight";

function str(v: string | null, fallback = "") {
  return v == null || v === "" ? fallback : v;
}

function num(v: string | null, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function buildQueryString(base: Record<string, string>) {
  const qs = new URLSearchParams(base);
  return qs.toString();
}

function FlightResultsContent() {
  const router = useRouter();
  const sp = useSearchParams();

  const initial: FlightSearchValue = useMemo(() => {
    const fromId = str(sp.get("fromId"), "");
    const toId = str(sp.get("toId"), "");
    const from = str(sp.get("from"), fromId);
    const to = str(sp.get("to"), toId);
    const departDate = str(sp.get("departDate"), new Date().toISOString().slice(0, 10));
    const returnDate = str(sp.get("returnDate"), "");
    return {
      tripType: returnDate ? "ROUND" : "ONEWAY",
      from,
      to,
      fromId,
      toId,
      departDate,
      returnDate: returnDate || undefined,
      adults: num(sp.get("adults"), 1),
      childrenAge: str(sp.get("childrenAge"), "") || undefined,
      cabinClass: str(sp.get("cabinClass"), "") || undefined,
      currency_code: str(sp.get("currency_code"), "VND"),
    };
  }, [sp]);

  const page = useMemo(() => num(sp.get("page"), 1), [sp]);

  const [offers, setOffers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiParams = useMemo(() => {
    const p: Record<string, string> = {
      fromId: initial.fromId || initial.from,
      toId: initial.toId || initial.to,
      departDate: initial.departDate,
      page: String(page),
      adults: String(initial.adults),
      currency_code: initial.currency_code,
    };
    if (initial.returnDate) p.returnDate = initial.returnDate;
    if (initial.childrenAge) p.childrenAge = initial.childrenAge;
    if (initial.cabinClass) p.cabinClass = initial.cabinClass;
    return p;
  }, [initial, page]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await flightService.search(apiParams);
        if (cancelled) return;
        const data = res?.result || res;
        setOffers(Array.isArray(data?.flightOffers) ? data.flightOffers : []);
      } catch (e: any) {
        if (cancelled) return;
        setError("Hệ thống đang gặp sự cố kết nối dữ liệu.");
        setOffers([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [apiParams]);

  const goToPage = (nextPage: number) => {
    const base: Record<string, string> = { ...apiParams, page: String(nextPage) };
    if (initial.from) base.from = initial.from;
    if (initial.to) base.to = initial.to;
    router.push(`/pages/flights-result?${buildQueryString(base)}`);
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <section
        className="relative w-full"
        style={{
          backgroundImage: "url(https://img2.thuthuat123.com/uploads/2020/05/12/hinh-anh-canh-may-bay_111631657.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="bg-gradient-to-b from-black/40 via-black/25 to-white/70">
          <div className="container mx-auto px-4 py-16 md:py-20">
            <div className="text-center mb-10 mt-18 font-sans">
              <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">Khám phá thế giới cùng chúng tôi</h1>
              <p className="mt-4 text-white/90 text-lg font-medium drop-shadow-md">Tìm kiếm hàng triệu chuyến bay để có lựa chọn tốt nhất</p>
            </div>
            <div className="max-w-7xl mx-auto">
              <FlightSearchCard
                value={initial}
                onSearch={(next) => {
                  const qs: Record<string, string> = {
                    from: next.from,
                    to: next.to,
                    fromId: next.fromId || next.from,
                    toId: next.toId || next.to,
                    departDate: next.departDate,
                    page: "1",
                    adults: String(next.adults),
                    currency_code: next.currency_code || "VND",
                  };
                  if (next.tripType === "ROUND" && next.returnDate) qs.returnDate = next.returnDate;
                  if (next.childrenAge) qs.childrenAge = next.childrenAge;
                  if (next.cabinClass) qs.cabinClass = next.cabinClass;
                  router.push(`/pages/flights-result?${buildQueryString(qs)}`);
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">

          {offers.length > 0 ? (
            <>
              <FlightResultsPane
                offers={offers}
                isLoading={isLoading}
                error={error}
                currentPage={page}
                totalPages={1}
                buildHref={() => ""}
              />

              {!isLoading && (
                <div className="mt-10 flex justify-center items-center gap-3">
                  {/* NÚT QUAY LẠI - CHỈ HIỆN TỪ TRANG 2 */}
                  {page > 1 && (
                    <button
                      onClick={() => goToPage(page - 1)}
                      className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-white rounded-full text-sm font-bold shadow-md hover:bg-slate-900 transition-all active:scale-95"
                    >
                      <span>←</span> Trang trước
                    </button>
                  )}

                  {/* NÚT XEM THÊM */}
                  <button
                    onClick={() => goToPage(page + 1)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-full text-sm font-bold shadow-sm hover:bg-slate-50 hover:border-[#0891b2] hover:text-[#0891b2] transition-all active:scale-95"
                  >
                    Xem thêm kết quả (Trang {page + 1})
                    <span className="text-lg">↓</span>
                  </button>
                </div>
              )}
            </>
          ) : !isLoading && page > 1 ? (
            <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-100 text-center max-w-2xl mx-auto mt-10">
              <div className="text-5xl mb-4">📭</div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Đã hết kết quả tìm kiếm</h2>
              <p className="text-slate-500 mb-8">Bạn đã xem hết các chuyến bay có sẵn ở trang {page - 1}.</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => goToPage(page - 1)}
                  className="px-8 py-3 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-900 transition-all"
                >
                  ← QUAY LẠI TRANG {page - 1}
                </button>
                <button
                  onClick={() => goToPage(1)}
                  className="px-8 py-3 border-2 border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                >
                  VỀ TRANG ĐẦU
                </button>
              </div>
            </div>
          ) : !isLoading && offers.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl text-center border text-slate-500">Không tìm thấy chuyến bay nào phù hợp.</div>
          ) : null}

          {isLoading && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-40 bg-white animate-pulse rounded-2xl border border-slate-100" />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function FlightResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600">Đang tải...</div>
      </div>
    }>
      <FlightResultsContent />
    </Suspense>
  );
}
