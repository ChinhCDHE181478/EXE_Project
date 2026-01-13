import HotelsGrid from "./HotelsGrid";
import { domesticTabs, topCityHotels } from "./_data";

export default function DomesticSection() {
  return (
    <section className="py-10">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-semibold mb-4">Khách sạn trong nước</h2>
        <div className="flex flex-wrap gap-3 mb-6">
          {domesticTabs.map((t) => (
            <button
              key={t}
              className="px-3 py-1.5 rounded-full border border-black/10 hover:bg-slate-50"
            >
              {t}
            </button>
          ))}
        </div>
        <HotelsGrid items={topCityHotels} />
      </div>
    </section>
  );
}
