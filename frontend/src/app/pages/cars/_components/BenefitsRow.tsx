export default function BenefitsRow() {
  const items = [
    {
      icon: "🚗",
      text: "Tìm dịch vụ cho thuê xe ô tô tự lái giá rẻ trong vài giây – ở bất cứ nơi nào trên thế giới",
    },
    {
      icon: "🧾",
      text: "So sánh các ưu đãi từ nhiều nhà cung cấp dịch vụ cho thuê xe ô tô đáng tin cậy, tại một nền tảng duy nhất",
    },
    {
      icon: "🏷️",
      text: "Thuê xe ô tô với chính sách đặt xe linh hoạt hoặc hủy miễn phí",
    },
  ];
  return (
    <section className="py-5">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-5">
          {items.map((it, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="text-base select-none">{it.icon}</div>
              <p className="text-[13px] md:text-[14px] text-slate-900 leading-snug">
                {it.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
