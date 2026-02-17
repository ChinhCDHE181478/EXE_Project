export default function BenefitsStrip() {
  const items = [
    { icon: "％", title: "Ưu đãi khách sạn hấp dẫn", desc: "Chúng tôi tìm ưu đãi của những khách sạn hàng đầu thế giới, sau đó chia sẻ kết quả tìm kiếm với bạn." },
    { icon: "🔔", title: "Giá mới nhất", desc: "Luôn hiển thị thông tin tổng quan về giá mới nhất để bạn có kỳ vọng rõ ràng." },
    { icon: "⚖️", title: "Tìm kiếm chính xác", desc: "Linh hoạt – đúng tiêu chí bạn cần." },
  ];

  return (
    <section className="container mx-auto px-4 my-10">
      <div className="rounded-3xl bg-[#0891b2]/10 p-6 md:p-10 ring-1 ring-black/5">
        <div className="grid md:grid-cols-3 gap-8">
          {items.map((it, i) => (
            <div key={i} className="text-center">
              <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-3 bg-[#0891b2] text-white text-3xl ring-1 ring-black/5">
                <span className="select-none">{it.icon}</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{it.title}</h3>
              <p className="mt-2 text-slate-700 leading-relaxed">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
