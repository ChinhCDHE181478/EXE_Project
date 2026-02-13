"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HeroSearch() {
  const [inputValue, setInputValue] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const router = useRouter();

  // Danh sách các câu gợi ý để chạy hiệu ứng Typewriter ở Placeholder
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
    let timeout: NodeJS.Timeout;

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
        typeSpeed = 2000; // Nghỉ sau khi gõ xong
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
    // Chuyển hướng sang chatbox kèm theo nội dung đã nhập
    router.push(`/chatbox?prompt=${encodeURIComponent(inputValue.trim())}`);
  };

  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url("/path-to-your-forest-image.jpg")', 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-[#0891b2]/20" />
      </div>

      <div className="container relative z-10 mx-auto px-6 text-center animate-fade-in-up">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
          Tạo Lộ Trình Hoàn Hảo. <br />
          <span className="text-cyan-400">Trải Nghiệm Độc Đáo</span> Của Riêng Bạn.
        </h1>

        <p className="max-w-2xl mx-auto text-slate-200 text-lg mb-10 leading-relaxed">
          VivuPlan là trợ lý du lịch AI giúp bạn thiết kế chuyến đi mơ ước, 
          tối ưu hóa mọi chi tiết, chỉ trong vài giây.
        </p>

        {/* Ô Search thực thụ */}
        <div className="max-w-3xl mx-auto bg-white/95 backdrop-blur-sm p-2 rounded-full shadow-2xl flex items-center border border-white/20 focus-within:ring-2 focus-within:ring-cyan-500 transition-all">
          <div className="pl-6 pr-2 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
          
          <input 
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-none outline-none text-slate-700 text-lg py-3 px-2 placeholder:italic placeholder:text-slate-400"
          />

          <button 
            onClick={handleSearch}
            className="bg-cyan-600 hover:bg-cyan-500 text-white p-3 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </section>
  );
}