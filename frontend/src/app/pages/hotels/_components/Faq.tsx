import { faqs } from "./_data";

export default function Faq() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-semibold mb-4">Câu hỏi thường gặp</h2>
        <div className="divide-y divide-black/5 rounded-2xl ring-1 ring-black/5 bg-white">
          {faqs.map((f, i) => (
            <details key={i} className="p-4 group">
              <summary className="flex cursor-pointer items-center justify-between gap-2 font-medium">
                {f.q}
                <span className="text-slate-400 group-open:rotate-180 transition">▾</span>
              </summary>
              <p className="mt-2 text-slate-600">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
