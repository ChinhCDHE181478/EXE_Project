export default function ReadyToPlan() {
  return (
    <section className="py-6">
      <div className="container mx-auto px-4">
        <h3 className="text-2xl font-semibold mb-2">
          Bạn đã sẵn sàng lên kế hoạch cho chuyến đi?
        </h3>
        <div className="max-w-xl divide-y rounded-2xl ring-1 ring-black/5 bg-white">
          {[
            { icon: "🛏️", text: "Khách sạn", href: "/hotels" },
            { icon: "✈️", text: "Chuyến bay", href: "/" },
          ].map((row, idx) => (
            <a
              key={idx}
              href={row.href}
              className="flex items-center justify-between px-4 py-4 hover:bg-slate-50"
            >
              <span className="flex items-center gap-3">
                <span className="text-lg">{row.icon}</span>
                <span className="text-[15px] font-medium">{row.text}</span>
              </span>
              <span className="text-slate-400">›</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
