"use client";
import Accordion from "./Accordion";

export default function Faq() {
  return (
    <section className="container mx-auto px-4 my-10">
      <Accordion
        items={[
          {
            title: "VivuPlan hoạt động như thế nào?",
            content:
              "VivuPlan là công cụ so sánh giúp bạn tìm vé máy bay/khách sạn giá tốt trên toàn thế giới. Bạn đặt trực tiếp tại nơi cung cấp sau khi chọn.",
          },
          {
            title: "Có thể tìm khách sạn và vé máy bay trên VivuPlan không?",
            content:
              "Có.Vào tab Khách sạn hoặc Vé máy bay để tìm kiếm nhanh, nhiều bộ lọc, chính sách hủy linh hoạt.",
          },
          {
            title: "Khi nào nên đặt vé?",
            content:
              "Nếu bạn linh hoạt, hãy thử xem 'Tháng rẻ nhất'. Còn khi đã chốt lịch, đặt sớm để có nhiều lựa chọn hơn.",
          },
        ]}
      />
    </section>
  );
}
