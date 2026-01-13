import HotelsGrid from "./HotelsGrid";
import { topCityHotels } from "./_data";

export default function CityBreakSection() {
  return (
    <section className="py-10">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-semibold mb-4">
          Khách sạn cho một kỳ nghỉ tuyệt vời tại thành phố
        </h2>
        <HotelsGrid items={topCityHotels} />
      </div>
    </section>
  );
}
