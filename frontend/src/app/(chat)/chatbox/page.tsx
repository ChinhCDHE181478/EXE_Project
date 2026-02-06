"use client";

import React, { useEffect, useMemo, useState } from "react";
import { 
  Utensils, Car, Calendar, Download, Send, ArrowLeft, X, Star, 
  CreditCard, Maximize2, ArrowRight, Sun, Sunset, Moon, MapPin, Menu, Clock, Wallet, History, MessageSquare, PlusCircle
} from "lucide-react";
import PlacesMapPane, { UiPlace } from "./PlacesMapPane";

const API_BASE = "http://localhost:4000/v1";

export default function VivuplanPremiumApp() {
  const [mounted, setMounted] = useState(false);
  const [activeId, setActiveId] = useState<string>("");
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [itineraryData, setItineraryData] = useState<any>(null);
  const [hotelData, setHotelData] = useState<any>(null);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);

  useEffect(() => { setMounted(true); }, []);

  const getBannerPhoto = (name: string) => {
    return `https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&q=60&w=1200&sig=${encodeURIComponent(name)}`;
  };

  const totalCost = useMemo(() => {
    if (!itineraryData?.itinerary) return 0;
    return itineraryData.itinerary.reduce((sum: number, day: any) => sum + (day.estimated_cost?.max || 0), 0);
  }, [itineraryData]);

  const loadHistory = async () => {
    try {
      const resH = await fetch(`${API_BASE}/conversation/history/1?page=1&page_size=10`);
      const dataH = await resH.json();
      if (dataH?.data) setChatHistory(dataH.data);
    } catch (e) { console.error(e); }
  };

  const handleSelectChat = async (sid: string) => {
    try {
      setActiveId(sid);
      const resD = await fetch(`${API_BASE}/conversation/${sid}`);
      const dataD = await resD.json();
      setMessages((dataD?.messages || []).map((m: any) => ({
        role: m.role === "user" ? "user" : "ai",
        content: m.parts?.[0]?.text || "",
      })));
      if (dataD?.itinerary) setItineraryData(dataD.itinerary);
      if (dataD?.hotel_recommendation) setHotelData(dataD.hotel_recommendation);
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    } catch (e) { console.error(e); }
  };

  // HÀM TẠO ĐOẠN CHAT MỚI
  const handleNewChat = () => {
    setActiveId("");
    setMessages([]);
    setItineraryData(null);
    setHotelData(null);
    setInputText("");
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  useEffect(() => {
    if (!mounted) return;
    loadHistory();
    const loadInitial = async () => {
      try {
        const resH = await fetch(`${API_BASE}/conversation/history/1?page=1&page_size=1`);
        const dataH = await resH.json();
        if (dataH?.data?.length) {
          handleSelectChat(dataH.data[0].session_id);
        }
      } catch (e) { console.error("Lỗi tải dữ liệu:", e); }
    };
    loadInitial();
  }, [mounted]);

  const places: UiPlace[] = useMemo(() => {
    if (!itineraryData?.itinerary) return [];
    const out: UiPlace[] = [];
    itineraryData.itinerary.forEach((day: any) => {
      const items = [...(day.attraction_recommendations || []), ...(day.restaurant_recommendations || [])];
      items.forEach(item => {
        let shortName = item.reason?.split('.')[0] || "Địa điểm";
        shortName = shortName.split(/ mang | là | giúp | lý | có | được /)[0].trim();
        out.push({
          id: item.place_id, 
          place_id: item.place_id,
          name: shortName,
          kind: item.reason?.toLowerCase().includes("ăn") ? "restaurant" : "attraction",
          day: day.date_, 
          lat: 20.25 + (Math.random() * 0.1), 
          lng: 105.97 + (Math.random() * 0.1),
          reason: item.reason
        });
      });
    });
    return out;
  }, [itineraryData]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    setMessages(prev => [...prev, { role: "user", content: inputText }]);
    setInputText("");
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#FDFDFD] text-slate-900 font-sans flex flex-col md:flex-row overflow-hidden">
      
      {/* MOBILE HEADER - z-[100] */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b z-[100] shrink-0 h-[64px]">
        <img src="/brand/logo.png" className="h-6 w-auto" alt="Vivuplan" />
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-slate-100 rounded-lg">
          <Menu size={20} />
        </button>
      </div>

      {/* SIDEBAR CHAT */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-[110] w-[320px] h-full bg-white border-r border-slate-100 shadow-2xl flex flex-col transition-transform duration-300
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <header className="p-6 border-b border-slate-50 flex justify-between items-center shrink-0">
          <img src="/brand/logo.png" className="h-8 w-auto" alt="Vivuplan" />
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-400"><X size={20} /></button>
        </header>
        
        {/* NÚT TẠO ĐOẠN CHAT MỚI */}
        <div className="px-4 pt-4 shrink-0">
          <button 
            onClick={handleNewChat}
            className="w-full py-3 bg-blue-600 text-white rounded-xl text-[11px] font-black flex items-center justify-center gap-2 hover:bg-blue-700 transition-all uppercase tracking-widest shadow-lg shadow-blue-100"
          >
            <PlusCircle size={18} /> Tạo đoạn chat mới
          </button>
        </div>

        {/* LỊCH SỬ CHAT */}
        <div className="h-32 border-b border-slate-50 overflow-y-auto p-4 space-y-1 shrink-0 bg-slate-50/30 mt-2 mx-4 rounded-xl">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><History size={12}/> Lịch sử</p>
            {chatHistory.map((chat) => (
                <button 
                  key={chat.session_id} 
                  onClick={() => handleSelectChat(chat.session_id)}
                  className={`w-full text-left p-2 rounded-lg text-[11px] truncate flex items-center gap-2 transition-colors ${activeId === chat.session_id ? 'bg-blue-600 text-white font-bold' : 'hover:bg-white text-slate-600'}`}
                >
                    <MessageSquare size={12} className="shrink-0" /> Trip {chat.session_id.substring(0,8)}...
                </button>
            ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50/30 custom-scrollbar scroll-smooth">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-[12px] shadow-sm ${m.role === 'user' ? 'bg-[#0056D2] text-white rounded-tr-none' : 'bg-white text-slate-700 border rounded-tl-none font-medium'}`}>
                {m.content.replace(/\{"type":.*?\}/g, "")}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
          <div className="relative group flex items-center gap-2">
            <textarea value={inputText} onChange={e => setInputText(e.target.value)} className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs h-11 resize-none outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium" placeholder="Nhắn tin cho Vivuplan..." />
            <button onClick={handleSend} className="w-11 h-11 bg-black text-white rounded-xl flex items-center justify-center hover:bg-[#0056D2] transition-colors"><Send size={16}/></button>
          </div>
        </div>
      </aside>

      <div className="flex-1 h-full flex flex-col overflow-hidden relative bg-[#F8FAFB]">
        <main className={`flex-1 overflow-y-auto custom-scrollbar p-4 md:p-10 space-y-10 md:space-y-12 pb-32 relative transition-all duration-700 ${selectedDayIdx !== null ? 'md:pr-[450px]' : ''}`}>
          
          <section className="relative h-[220px] md:h-[350px] rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl shrink-0 group">
            <img 
              src={getBannerPhoto(itineraryData?.trip_summary?.destinations[0] || "NINH BÌNH")} 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
              alt="banner chính"
              onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1599708153386-62bf3f035978?auto=format&fit=crop&w=1400"; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <h1 className="absolute bottom-6 left-6 md:bottom-8 md:left-10 text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter leading-none">
              KHÁM PHÁ {itineraryData?.trip_summary?.destinations[0] || "NINH BÌNH"}
            </h1>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white p-2 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border h-96 md:h-[500px] relative overflow-hidden group">
               <PlacesMapPane places={places} />
               <button onClick={() => setIsMapModalOpen(true)} className="absolute bottom-6 right-6 px-6 py-3 bg-white/95 backdrop-blur rounded-full text-[9px] md:text-[11px] font-black shadow-lg text-[#0056D2] flex items-center gap-2 uppercase tracking-widest hover:bg-[#0056D2] hover:text-white transition-all z-10">
                 <Maximize2 size={16} /> XEM BẢN ĐỒ
               </button>
            </div>

            <div className="bg-[#0056D2] p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl text-white flex flex-col justify-center relative overflow-hidden group">
               <div className="absolute -right-10 -top-10 opacity-10 group-hover:scale-110 transition-transform"><Wallet size={200} /></div>
               <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2 font-black italic">Tổng dự chi chuyến đi</p>
               <h2 className="text-4xl font-black italic tracking-tighter mb-4">{totalCost.toLocaleString()}đ</h2>
               <div className="pt-4 border-t border-white/20"><p className="text-[11px] font-medium opacity-80 leading-relaxed italic font-bold">Lịch trình tối ưu bởi AI</p></div>
            </div>
          </div>

          <section className="space-y-6">
            <h2 className="text-base md:text-lg font-black italic tracking-widest text-[#0056D2] px-2 flex items-center gap-3 uppercase font-black italic"><Calendar size={20}/> LỘ TRÌNH CHI TIẾT</h2>
            <div className="space-y-4">
              {itineraryData?.itinerary?.map((day: any, idx: number) => (
                <div key={idx} onClick={() => setSelectedDayIdx(idx)} className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-slate-50 flex flex-col md:flex-row gap-4 md:gap-8 items-start md:items-center cursor-pointer hover:shadow-xl transition-all group">
                   <div className="w-full md:w-48 h-32 bg-slate-100 rounded-[1.2rem] md:rounded-[1.5rem] overflow-hidden flex-shrink-0 relative">
                      <img src={getBannerPhoto(day.location)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="day banner" />
                      <div className="absolute top-2 right-2 bg-[#0056D2] text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg">Ngày {idx+1}</div>
                   </div>
                   <div className="flex-1">
                      <span className="text-[10px] font-bold text-cyan-800 block mb-1 border-l-3 border-cyan-500 pl-3 uppercase font-bold">{day.date_}</span>
                      <h3 className="text-base md:text-lg font-black italic uppercase group-hover:text-[#0056D2] transition-colors leading-tight font-black italic">KHÁM PHÁ {day.location}</h3>
                      <p className="text-[12px] text-slate-500 mt-2 line-clamp-2 md:line-clamp-1 italic font-medium">"{day.morning}"</p>
                   </div>
                   <div className="hidden md:flex w-10 h-10 bg-[#0056D2] rounded-full items-center justify-center text-white shadow-xl group-hover:scale-110 transition-all"><ArrowRight size={20} /></div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-8 pt-10 border-t border-slate-100 pb-10">
            <h2 className="text-lg md:text-xl text-[#0056D2] px-2 italic uppercase tracking-tighter font-black font-black italic">NƠI LƯU TRÚ ĐỀ XUẤT</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {hotelData?.recommended_hotels?.map((h: any, i: number) => (
                <div key={i} className="bg-white p-4 md:p-6 rounded-[2rem] md:rounded-[3rem] shadow-sm border border-slate-100 group hover:shadow-2xl transition-all flex flex-col">
                  <div className="h-44 md:h-56 bg-slate-100 rounded-[1.5rem] md:rounded-[2rem] mb-5 overflow-hidden relative shadow-inner">
                    <img src={`https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=60&w=800&sig=${i}`} className="w-full h-full object-cover group-hover:scale-110 duration-1000" alt="hotel" />
                    <div className="absolute top-4 left-4 bg-cyan-700 text-white px-3 py-1.5 rounded-full text-[9px] font-black shadow-xl z-10 border border-white/20 uppercase tracking-widest font-black italic"><Star size={10} fill="white" className="mr-1 inline" /> ĐỀ XUẤT</div>
                  </div>
                  <h4 className="text-base md:text-lg font-black mb-1 group-hover:text-[#0056D2] transition-colors uppercase italic text-slate-800 truncate font-black italic">{h.hotel_id.slice(-5)} Luxury Hotel</h4>
                  <p className="text-[11px] text-slate-600 italic line-clamp-2 mb-6 leading-relaxed normal-case">{h.reasoning}</p>
                  <div className="mt-auto flex justify-between items-center pt-5 border-t border-slate-100 font-black italic">
                    <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Giá tham khảo</p><p className="text-xl font-black text-[#0056D2]">{h.hotel_id.slice(0,1)},500,000đ</p></div>
                    <button className="bg-slate-900 text-white px-6 py-3 rounded-full text-[9px] font-black hover:bg-[#0056D2] transition-all uppercase italic shadow-lg">ĐẶT PHÒNG</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* MODAL MAP TOÀN MÀN HÌNH - Sửa khoảng cách Header Mobile */}
        {isMapModalOpen && (
          <div className="fixed inset-0 z-[500] bg-white flex flex-col">
            {/* NÚT X ĐÓNG MAP: Sử dụng fixed và z-[600] để chắc chắn nằm trên cùng */}
            <button 
                onClick={() => setIsMapModalOpen(false)} 
                className="fixed top-20 right-8 z-[600] w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-red-600 transition-all"
            >
                <X size={28} strokeWidth={3} />
            </button>
            <div className="flex-1 w-full h-full relative">
              <PlacesMapPane places={places} />
            </div>
          </div>
        )}

        {/* Cột Map bên phải (Desktop khi chọn ngày) */}
        {selectedDayIdx !== null && (
          <aside className="hidden md:block fixed right-0 top-0 bottom-0 w-[450px] bg-white border-l border-slate-100 z-50 shadow-2xl animate-in slide-in-from-right duration-500">
             <PlacesMapPane places={places.filter(p => p.day === itineraryData.itinerary[selectedDayIdx].date_)} />
             <div className="absolute top-10 left-10 bg-white/95 px-6 py-3 rounded-full shadow-2xl border border-slate-100 flex items-center gap-3 z-50 font-bold uppercase italic text-[10px] tracking-widest font-black italic">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" /> BẢN ĐỒ NGÀY {selectedDayIdx+1}
             </div>
          </aside>
        )}

        {/* Overlay Chi tiết ngày - pt-24 để tránh dính Header Mobile */}
        {selectedDayIdx !== null && (
          <div className="fixed inset-0 bg-white z-[120] md:z-[55] pt-24 md:pt-28 p-4 md:p-16 overflow-y-auto animate-in slide-in-from-bottom md:slide-in-from-right duration-500 md:left-[320px] md:right-[450px] border-r border-slate-100 shadow-inner">
             <div className="max-w-2xl mx-auto pb-48 font-black italic uppercase tracking-widest font-black italic">
                <button onClick={() => setSelectedDayIdx(null)} className="mb-8 flex items-center gap-2 text-[10px] font-black text-[#0056D2] border-2 border-blue-50 px-5 py-2.5 rounded-full bg-white hover:bg-blue-50 transition-all uppercase tracking-widest font-black italic"><ArrowLeft size={14} /> QUAY LẠI LỘ TRÌNH</button>
                <div className="flex flex-col gap-2 mb-12"><h2 className="text-4xl md:text-6xl font-black text-[#0056D2] italic tracking-tighter uppercase opacity-90 leading-tight italic font-black italic">NGÀY {selectedDayIdx + 1}</h2><p className="text-base md:text-lg font-bold uppercase tracking-[0.2em] italic text-slate-400 font-black italic">{itineraryData.itinerary[selectedDayIdx].location}</p></div>
                <div className="space-y-12">
                   <div className="space-y-5">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] px-6 italic border-l-4 border-cyan-500 font-black italic"># CHI TIẾT TRẢI NGHIỆM</h4>
                      <div className="space-y-4">
                         {["morning", "afternoon", "evening"].map((session, sIdx) => (
                           <div key={sIdx} className="flex gap-5 items-start p-6 bg-slate-50 rounded-[2rem] border border-transparent hover:border-slate-200 hover:bg-white transition-all font-black italic">
                             <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-500 shrink-0 shadow-sm">{sIdx === 0 ? <Sun size={28}/> : sIdx === 1 ? <Sunset size={28}/> : <Moon size={28}/>}</div>
                             <div><p className="text-[9px] font-black text-slate-400 uppercase italic mb-1 tracking-widest">{session.toUpperCase()}</p><p className="text-sm md:text-base font-bold italic text-slate-700 leading-relaxed normal-case font-black italic font-medium italic">"{itineraryData.itinerary[selectedDayIdx][session]}"</p></div>
                           </div>
                         ))}
                      </div>
                   </div>
                   <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 font-black italic">
                      <div className="flex items-center gap-4"><div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#0056D2]"><Car size={24} /></div><div><p className="text-[9px] font-black text-slate-300 italic uppercase">DI CHUYỂN</p><p className="text-sm font-bold text-slate-700 italic uppercase">{itineraryData.itinerary[selectedDayIdx].transportation}</p></div></div>
                      <div className="text-center md:text-right"><p className="text-[9px] font-black text-slate-300 italic uppercase">DỰ CHI CỦA NGÀY</p><p className="text-3xl font-black text-[#0056D2] italic tracking-tighter">{itineraryData.itinerary[selectedDayIdx].estimated_cost.max.toLocaleString()}đ</p></div>
                   </div>
                   <div className="bg-[#0A0F1A] p-10 md:p-16 rounded-[4rem] text-white relative overflow-hidden shadow-2xl font-black italic">
                       <div className="absolute top-0 right-0 p-10 opacity-5"><Utensils size={150} /></div>
                       <h4 className="text-[10px] font-black text-[#4ECDC4] uppercase tracking-[0.5em] mb-10 italic flex items-center gap-4 relative z-10"><Utensils size={20} /> ẨM THỰC ĐỊA PHƯƠNG</h4>
                       <div className="grid grid-cols-1 gap-10 relative z-10">{itineraryData.itinerary[selectedDayIdx].meals.map((meal: string, i: number) => { const [time, dish] = meal.split(':'); return ( <div key={i} className="group pl-6 border-l border-white/10 hover:border-[#4ECDC4] transition-all"><span className="text-[9px] font-black text-slate-500 uppercase block mb-2 italic tracking-[0.2em] group-hover:text-[#4ECDC4]">{time?.toUpperCase()}</span><p className="text-base font-bold text-slate-100 italic tracking-tight uppercase">{dish}</p></div> ); })}</div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div> 

      {/* Backdrop for mobile sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-[105] md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
    </div> 
  );
}