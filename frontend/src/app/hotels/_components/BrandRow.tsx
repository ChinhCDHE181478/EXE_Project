export default function BrandRow() {
  const brands = [
    { name: "Booking.com", url: "https://logo.clearbit.com/booking.com" },
    { name: "Trip.com", url: "https://logo.clearbit.com/trip.com" },
    { name: "Hotels.com", url: "https://logo.clearbit.com/hotels.com" },
    { name: "HYATT", url: "https://logo.clearbit.com/hyatt.com" },
    { name: "Expedia", url: "https://logo.clearbit.com/expedia.com" },
    { name: "InterContinental", url: "https://logo.clearbit.com/ihg.com" },
  ];

  return (
    <section className="py-10">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-semibold">
          So sánh khách sạn theo thương hiệu bạn yêu thích
        </h2>
        <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-4">
          {brands.map((b) => (
            <img key={b.name} src={b.url} alt={b.name} className="h-7 md:h-9 object-contain" loading="lazy" />
          ))}
        </div>
      </div>
    </section>
  );
}
