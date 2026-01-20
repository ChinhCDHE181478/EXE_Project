export const CITY_IMAGES: Record<string, string> = {
  "Hà Nội":
    "https://images.unsplash.com/photo-1544989164-31dc3c645987?q=80&w=1600&auto=format&fit=crop",
  "Đà Nẵng":
    "https://media.istockphoto.com/id/1156033272/photo/view-of-dragon-bridge.jpg?s=612x612&w=0&k=20&c=AWjPA35U5_LMjUx-FT6T36qOU8JC_aPANTSPaOmoQM8=",
  "Phú Quốc":
    "https://images.unsplash.com/photo-1693294603830-f44c9511d643?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1933",
  "Nha Trang":
    "https://images.unsplash.com/photo-1654930453993-bf69bbb3a00d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070",
  "Đà Lạt":
    "https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=1600&auto=format&fit=crop",
  "TP.HCM":
    "https://images.unsplash.com/photo-1583417319070-4a69db38a482?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070",
};

export const topCityHotels = [
  {
    city: "Đà Nẵng",
    name: "Ocean Bay Resort",
    rating: 4.7,
    reviews: 921,
    img: CITY_IMAGES["Đà Nẵng"],
  },
  {
    city: "Phú Quốc",
    name: "Sunrise Island Hotel",
    rating: 4.6,
    reviews: 615,
    img: CITY_IMAGES["Phú Quốc"],
  },
  {
    city: "Nha Trang",
    name: "Seaview Movenpick",
    rating: 4.8,
    reviews: 1997,
    img: CITY_IMAGES["Nha Trang"],
  },
];

export const domesticTabs = [
  "Phú Quốc",
  "TP.HCM",
  "Hà Nội",
  "Đà Nẵng",
  "Đà Lạt",
];

export const faqs = [
  {
    q: "VivuPlan xếp hạng khách sạn như thế nào?",
    a: "Chúng tôi tổng hợp từ đối tác và đánh giá người dùng, sau đó hiển thị theo mức độ phù hợp với bộ lọc của bạn.",
  },
  {
    q: "Tôi có đặt phòng trực tiếp với VivuPlan không?",
    a: "Bạn sẽ được chuyển sang đối tác (ví dụ Booking.com…) để hoàn tất đặt phòng.",
  },
  {
    q: "Làm sao để giữ mức giá tốt nhất?",
    a: "Đặt sớm, linh hoạt ngày nhận/trả phòng và theo dõi ưu đãi theo mùa.",
  },
];
