"use client";
import SearchFlights from "./SearchFlights";

export default function HeroSearch() {
  return (
    <section className="bg-[#0891b2]/10">
      <div className="container mx-auto px-6 pt-14 pb-20 md:pt-14 md:pb-28">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
          Nhanh chóng tìm kiếm hàng triệu vé giá rẻ
        </h1>
        <div className="mt-6">
          <SearchFlights />
        </div>
      </div>
    </section>
  );
}
