const bestHanoi = [
  {
    name: "Hạng trung",
    price: "4.208.930 ₫",
    spec: "Xe tải chở khách",
    seats: 5,
    doors: 4,
    img: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070",
  },
  {
    name: "Kích cỡ đầy đủ",
    price: "5.226.885 ₫",
    spec: "4–5 cửa",
    seats: 5,
    doors: 4,
    img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1400&auto=format&fit=crop",
  },
];

export default function BestDealsHanoi() {
  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-semibold">
          Tìm ưu đãi thuê xe tốt nhất ở Hà Nội
        </h2>
        <p className="text-slate-600 mt-1 text-sm">
          Dưới đây là các loại xe cho thuê phổ biến nhất mà bạn có thể nhận ở
          một địa điểm gần đây trong 30 ngày tiếp theo.
        </p>

        <div className="mt-3 grid md:grid-cols-2 gap-4">
          {bestHanoi.map((v, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden ring-1 ring-black/5 bg-white hover:shadow transition"
            >
              <img src={v.img} alt={v.name} className="h-44 w-full object-cover" />
              <div className="p-4">
                <div className="text-base font-semibold">{v.name}</div>
                <div className="text-xs text-slate-600">{v.spec}</div>
                <div className="mt-2 text-xl font-bold">
                  {v.price} <span className="text-xs font-normal text-slate-600">/ trên ngày</span>
                </div>
                <div className="mt-1.5 flex items-center gap-4 text-sm">
                  <span className="inline-flex items-center gap-1">👤 {v.seats}</span>
                  <span className="inline-flex items-center gap-1">🚪 {v.doors}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="mt-3 px-4 py-2 rounded-lg font-semibold text-[#0891b2] hover:bg-[#0891b2]/10">
          Xem tất cả ưu đãi →
        </button>

        <div className="mt-3 text-xs md:text-sm text-slate-600 rounded-xl bg-slate-50 p-3 ring-1 ring-black/5">
          Chúng tôi kiểm tra giá thuê xe trong 30 ngày tới và hiển thị mức rẻ
          nhất của các loại xe phổ biến.
        </div>
      </div>
    </section>
  );
}
