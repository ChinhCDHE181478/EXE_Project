const popularRentals = [
  {
    city: "Luân Đôn",
    price: "506.998 ₫/ngày",
    img: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070",
    tag: "Kinh tế",
  },
  {
    city: "Bangkok",
    price: "537.161 ₫/ngày",
    img: "https://images.unsplash.com/photo-1547640084-1dfcc7ef3b22?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2018",
    tag: "Kinh tế",
  },
  {
    city: "Tokyo",
    price: "665.130 ₫/ngày",
    img: "https://images.unsplash.com/photo-1551322120-c697cf88fbdc?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2069",
    tag: "Kinh tế",
  },
];

export default function PopularDestinations() {
  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-semibold">
          Các điểm cho thuê xe phổ biến
        </h2>
        <div className="mt-3 grid md:grid-cols-3 gap-5">
          {popularRentals.map((c, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden ring-1 ring-black/5 bg-white hover:shadow transition"
            >
              <img src={c.img} alt={c.city} className="h-48 w-full object-cover" />
              <div className="p-4">
                <div className="text-[15px] font-semibold">
                  Dịch vụ cho thuê xe ô tô tại {c.city}
                </div>
                <div className="text-xs text-slate-600">
                  Loại xe phổ biến nhất: {c.tag}
                </div>
                <div className="mt-1.5 text-[15px] font-semibold">Từ {c.price}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs md:text-sm text-slate-600 rounded-xl bg-slate-50 p-3 ring-1 ring-black/5">
          Đây là giá ước tính để giúp bạn lựa chọn trong số nhiều phương án. Mỗi
          mức là giá trung bình dựa trên mức giá <b>thuê xe thấp nhất</b> trong
          15 ngày qua.
        </div>
      </div>
    </section>
  );
}
