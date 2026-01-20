"use client";

import Link from "next/link";

function buildPages(current: number, total: number, windowSize = 5) {
  const pages: (number | "…")[] = [];
  if (total <= 1) return [1];

  const first = 1;
  const last = total;

  const start = Math.max(first, current - Math.floor(windowSize / 2));
  const end = Math.min(last, start + windowSize - 1);
  const start2 = Math.max(first, end - windowSize + 1);

  pages.push(first);
  if (start2 > first + 1) pages.push("…");

  for (let p = start2; p <= end; p++) {
    if (p !== first && p !== last) pages.push(p);
  }

  if (end < last - 1) pages.push("…");
  if (last !== first) pages.push(last);
  return pages;
}

export default function FlightPagination({
  currentPage,
  totalPages,
  buildHref,
}: {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (!totalPages || totalPages <= 1) return null;

  const pages = buildPages(currentPage, totalPages);

  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      <Link
        aria-label="Previous page"
        href={buildHref(Math.max(1, currentPage - 1))}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-white text-slate-700 hover:bg-slate-50 ${
          currentPage <= 1 ? "pointer-events-none opacity-50" : ""
        }`}
      >
        <span aria-hidden>‹</span>
      </Link>

      {pages.map((p, idx) =>
        p === "…" ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(p)}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-semibold ${
              p === currentPage
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {p}
          </Link>
        )
      )}

      <Link
        aria-label="Next page"
        href={buildHref(Math.min(totalPages, currentPage + 1))}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-white text-slate-700 hover:bg-slate-50 ${
          currentPage >= totalPages ? "pointer-events-none opacity-50" : ""
        }`}
      >
        <span aria-hidden>›</span>
      </Link>
    </div>
  );
}
