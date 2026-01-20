"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import FlightSearchCard, { FlightSearchValue } from "@/app/pages/flights/_components/FlightSearchCard";
import FlightResultsPane from "./_components/FlightResultsPane";
import { flightService } from "@/lib/services/flight";
import { pickIata } from "@/lib/utils/flight";

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

export default function FlightResultsPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const initial: FlightSearchValue = useMemo(
    () => {
      const from = pickIata(str(sp.get("from"), "HAN"));
      const to = pickIata(str(sp.get("to"), "SGN"));
      const departDate = str(sp.get("departDate"), new Date().toISOString().slice(0, 10));
      const returnDate = str(sp.get("returnDate"), "");
      const tripType = returnDate ? "ROUND" : "ONEWAY";
      return {
        tripType,
        from,
        to,
        departDate,
        returnDate: returnDate || undefined,
        adults: num(sp.get("adults"), 1),
        childrenAge: str(sp.get("childrenAge"), "") || undefined,
        cabinClass: str(sp.get("cabinClass"), "") || undefined,
        currency_code: str(sp.get("currency_code"), "VND"),
        budget: num(sp.get("budget"), 2000000),
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sp]
  );

  const page = useMemo(() => num(sp.get("page"), 1), [sp]);

  const [offers, setOffers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  const apiParams = useMemo(() => {
    const p: Record<string, string> = {
      from: initial.from,
      to: initial.to,
      departDate: initial.departDate,
      page: String(page),
      adults: String(initial.adults),
      currency_code: initial.currency_code,
    };
    if (initial.tripType === "ROUND" && initial.returnDate) p.returnDate = initial.returnDate;
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

        const result = res?.result ?? res; // depending on apiFetch wrapper
        const list = result?.flightOffers ?? result?.result?.flightOffers ?? [];
        setOffers(Array.isArray(list) ? list : []);

        const tp =
          result?.totalPages ??
          result?.pageCount ??
          result?.pagination?.totalPages ??
          result?.result?.totalPages ??
          result?.result?.pagination?.totalPages ??
          1;
        setTotalPages(Number(tp) || 1);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ? String(e.message) : "Không thể tải danh sách chuyến bay.");
        setOffers([]);
        setTotalPages(1);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [apiParams]);

  const buildHref = (nextPage: number) => {
    const base: Record<string, string> = {
      from: initial.from,
      to: initial.to,
      departDate: initial.departDate,
      page: String(nextPage),
      adults: String(initial.adults),
      currency_code: initial.currency_code,
      budget: String(initial.budget),
    };
    if (initial.tripType === "ROUND" && initial.returnDate) base.returnDate = initial.returnDate;
    if (initial.childrenAge) base.childrenAge = initial.childrenAge;
    if (initial.cabinClass) base.cabinClass = initial.cabinClass;
    return `/pages/flights-result?${buildQueryString(base)}`;
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Search header - must match Flights banner style */}
      <div className="w-full bg-[#0891b2]/10">
        <div className="container mx-auto px-4 py-5">
          <FlightSearchCard
            value={initial}
            variant="compact"
            onSearch={(next) => {
              const qs: Record<string, string> = {
                from: next.from,
                to: next.to,
                departDate: next.departDate,
                page: "1",
                adults: String(next.adults),
                currency_code: next.currency_code,
                budget: String(next.budget),
              };
              if (next.tripType === "ROUND" && next.returnDate) qs.returnDate = next.returnDate;
              if (next.childrenAge) qs.childrenAge = next.childrenAge;
              if (next.cabinClass) qs.cabinClass = next.cabinClass;
              router.push(`/pages/flights-result?${buildQueryString(qs)}`);
            }}
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <FlightResultsPane
          offers={offers}
          isLoading={isLoading}
          error={error}
          currentPage={page}
          totalPages={totalPages}
          buildHref={buildHref}
        />
      </div>
    </main>
  );
}
