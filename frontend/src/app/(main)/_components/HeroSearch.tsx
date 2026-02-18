"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HeroSearch() {
  const [inputValue, setInputValue] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const router = useRouter();

  const VIDEO_SRC = "https://videos.pexels.com/video-files/16298299/16298299-hd_1920_1080_30fps.mp4";

  const suggestions = [
    "Lên kế hoạch đi Đà Lạt 3 ngày 2 đêm...",
    "Tìm các khách sạn tại Phú Quốc...",
    "Gợi ý lịch trình trekking Hà Giang...",
    "Khám phá ẩm thực Hội An với 2 triệu đồng..."
  ];

  useEffect(() => {
    let currentIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let timeout: ReturnType<typeof setTimeout>;

    const type = () => {
      const currentFullText = suggestions[currentIdx];

      if (isDeleting) {
        setPlaceholder(currentFullText.substring(0, charIdx - 1));
        charIdx--;
      } else {
        setPlaceholder(currentFullText.substring(0, charIdx + 1));
        charIdx++;
      }

      let typeSpeed = isDeleting ? 50 : 100;

      if (!isDeleting && charIdx === currentFullText.length) {
        typeSpeed = 2000;
        isDeleting = true;
      } else if (isDeleting && charIdx === 0) {
        isDeleting = false;
        currentIdx = (currentIdx + 1) % suggestions.length;
        typeSpeed = 500;
      }

      timeout = setTimeout(type, typeSpeed);
    };

    type();
    return () => clearTimeout(timeout);
  }, []);

  const handleSearch = () => {
    if (!inputValue.trim()) return;
    router.push(`/chatbox?prompt=${encodeURIComponent(inputValue.trim())}`);
  };

  return (
    <section className="relative w-full h-screen min-h-[600px] flex items-center justify-center overflow-hidden bg-slate-900">

      {/* BACKGROUND VIDEO LAYER */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-black/20" />
      </div>

      {/* CONTENT LAYER */}
      {/* Thêm px-4 để tránh nội dung sát lề màn hình mobile */}
      <div className="container relative z-10 mx-auto px-4 text-center animate-fade-in-up pt-16 md:pt-20">
        
        {/* Responsive Text Size: text-3xl trên mobile, text-6xl trên PC */}
        <h1 className="text-3xl md:text-6xl font-bold text-white mb-4 md:mb-6 tracking-tight drop-shadow-2xl">
          Tạo Lộ Trình Hoàn Hảo. <br />
          <span className="text-cyan-300">Trải Nghiệm Độc Đáo</span> Của Riêng Bạn.
        </h1>

        <p className="max-w-2xl mx-auto text-slate-100 text-sm md:text-lg mb-8 md:mb-10 leading-relaxed font-medium drop-shadow-md px-2">
          VivuPlan là trợ lý du lịch AI giúp bạn thiết kế chuyến đi mơ ước,
          tối ưu hóa mọi chi tiết, chỉ trong vài giây.
        </p>

        {/* --- SEARCH BOX CONTAINER --- */}
        <div className="max-w-3xl mx-auto relative group w-full">

          {/* Lớp Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur opacity-0 group-hover:opacity-40 transition duration-500"></div>

          {/* Khung Search */}
          {/* FIXED: 
              1. Giảm padding container (p-1 trên mobile, p-2 trên md)
              2. Đổi px-6 thành pl-3 md:pl-6 cho icon
          */}
          <div className="relative bg-white/10 backdrop-blur-md p-1 md:p-2 rounded-full shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] flex items-center border border-white/20 focus-within:bg-white/20 transition-all duration-300 w-full">
            
            <div className="pl-3 pr-2 md:pl-6 md:pr-2 text-slate-200 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </div>

            {/* FIXED INPUT:
               1. min-w-0: Ngăn input bị tràn khỏi flex container
               2. text-base: Chữ nhỏ hơn trên mobile để hiển thị được nhiều placeholder hơn
               3. py-2: Giảm chiều cao trên mobile
            */}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={placeholder}
              className="flex-1 bg-transparent border-none outline-none text-white text-base md:text-lg py-2 md:py-3 px-2 placeholder:italic placeholder:text-slate-300 font-medium min-w-0 truncate"
            />

            {/* FIXED BUTTON:
               1. p-2: Nút nhỏ hơn trên mobile
               2. shrink-0: Đảm bảo nút không bị bóp méo khi input quá dài
            */}
            <button
              onClick={handleSearch}
              className="bg-cyan-500 hover:bg-cyan-400 text-white p-2 md:p-3 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg border border-cyan-400/50 shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}