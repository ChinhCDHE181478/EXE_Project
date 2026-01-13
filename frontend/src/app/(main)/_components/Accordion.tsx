"use client";

export default function Accordion({
  items,
}: {
  items: { title: string; content: string }[];
}) {
  return (
    <div className="rounded-2xl bg-white shadow-sm">
      {items.map((it, i) => (
        <details
          key={i}
          className={`group px-5 py-4 ${
            i !== items.length - 1 ? "border-b border-slate-200" : ""
          }`}
        >
          <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
            <span className="font-medium">{it.title}</span>
            <span className="transition-transform group-open:rotate-180">
              ⌃
            </span>
          </summary>
          <div className="mt-3 text-slate-700 leading-relaxed">
            {it.content}
          </div>
        </details>
      ))}
    </div>
  );
}
