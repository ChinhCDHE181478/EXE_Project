export default function HowToFindDeals() {
  const items = [
    { title: "Đặt ngay, huỷ sau", body: "Nhiều lựa chọn chính sách đặt xe linh hoạt và cho phép huỷ miễn phí. Bạn có thể đổi kế hoạch vào phút chót nếu cần.", icon: "🚘" },
    { title: "Không còn phải xếp hàng nữa", body: "Một số đối tác cung cấp dịch vụ nhận xe không cần lấy chia khoá hoặc tự phục vụ, giúp bạn tiết kiệm thời gian.", icon: "✅" },
    { title: "Thuê xe nguyên tháng tại Hà Nội", body: "Nếu thuê dài hạn, chi phí mỗi lần nhận xe sẽ giảm. Hãy chọn 30 ngày để xem mức giá tiết kiệm hơn.", icon: "📅" },
    { title: "Đi xe bảo vệ môi trường", body: "Hãy cân nhắc xe điện/xe lai để giảm phát thải. Nhiều điểm nhận có trạm sạc sẵn sàng.", icon: "🌱" },
    { title: "So sánh chính sách nhiên liệu", body: "Tìm ưu đãi có chính sách 'nhận xe đầy bình, trả xe đầy bình' để chủ động và tiết kiệm.", icon: "⛽" },
    { title: "Mở rộng phạm vi tìm kiếm", body: "Nếu có ngăn cách địa lý/giờ cao điểm, thử các điểm nhận lân cận để có giá tốt hơn.", icon: "📍" },
  ];

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-semibold mb-1">
          Cách tìm ưu đãi thuê xe ô tô tốt nhất
        </h2>
        <p className="text-slate-600 max-w-3xl text-[15px] leading-snug">
          Chúng tôi thường xuyên được ghi nhận là trang web tìm kiếm thông tin
          du lịch đáng tin cậy. Dưới đây là vài mẹo nhanh để bạn tối ưu chi phí
          thuê xe.
        </p>

        <div className="mt-4 grid md:grid-cols-2 gap-5">
          {items.map((it, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="text-xl select-none">{it.icon}</div>
              <div className="leading-snug">
                <div className="font-semibold text-[16px]">{it.title}</div>
                <p className="text-slate-700 text-[14px]">{it.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
