"use client";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import FlightSearchCard, { FlightSearchValue } from "./FlightSearchCard";

export default function BannerSection() {
  const router = useRouter();

  const defaultValue = useMemo<FlightSearchValue>(
    () => ({
      tripType: "ONEWAY",
      from: "",
      to: "",
      fromId: "",
      toId: "",
      departDate: new Date().toISOString().slice(0, 10),
      adults: 1,
      currency_code: "VND",
    }),
    []
  );

  return (
    <section
      className="relative w-full"
      style={{
        backgroundImage:
          "url(https://img2.thuthuat123.com/uploads/2020/05/12/hinh-anh-canh-may-bay_111631657.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="bg-gradient-to-b from-black/40 via-black/25 to-white/70">
        <div className="container mx-auto px-4 py-20 md:py-28">
          {/* Title */}
          <div className="text-center font-sans">
            <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
              Khám phá thế giới cùng chúng tôi
            </h1>
            <p className="mt-4 text-white/90 text-lg font-medium drop-shadow-md">
              Tìm kiếm hàng triệu chuyến bay và khách sạn
            </p>
          </div>

          {/* Search card */}
          <FlightSearchCard
            value={defaultValue}
            onSearch={(next) => {
              const qs = new URLSearchParams({
                from: next.from,
                to: next.to,
                fromId: next.fromId || next.from,
                toId: next.toId || next.to,
                departDate: next.departDate,
                page: "1",
                adults: String(next.adults),
                currency_code: next.currency_code,
              });
              if (next.tripType === "ROUND" && next.returnDate) qs.set("returnDate", next.returnDate);
              if (next.childrenAge) qs.set("childrenAge", next.childrenAge);
              if (next.cabinClass) qs.set("cabinClass", next.cabinClass);
              router.push(`/pages/flights-result?${qs.toString()}`);
            }}
          />
          {/* /Search card */}
        </div>
      </div>
    </section>
  );
}
