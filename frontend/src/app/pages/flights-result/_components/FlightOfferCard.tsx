"use client";

function formatCurrency(amount: any, code: string) {
  const n = Math.round(Number(amount));
  return `${new Intl.NumberFormat("vi-VN").format(n)} đ`;
}

export default function FlightOfferCard({ offer }: { offer: any }) {
  const seg = offer?.segments?.[0];
  const legs = seg?.legs ?? [];
  const primaryCarrier = legs[0]?.carriersData?.[0];

  const currency = offer?.priceBreakdown?.totalRounded?.currencyCode || "VND";
  const priceUnits = offer?.priceBreakdown?.totalRounded?.units || 0;

  return (
    <div className="group rounded-xl bg-white ring-1 ring-slate-200 hover:ring-blue-300 shadow-sm transition-all overflow-hidden mb-4">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_200px]">
        {/* Nội dung hành trình */}
        <div className="p-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 bg-slate-50 rounded-lg p-1 border border-slate-100 flex items-center justify-center overflow-hidden">
               {primaryCarrier?.logo ? (
                 <img src={primaryCarrier.logo} alt={primaryCarrier.name} className="h-full object-contain" />
               ) : (
                 <span className="text-[8px] font-bold">AIR</span>
               )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-700 leading-none">{primaryCarrier?.name}</span>
              <span className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">Đơn vị khai thác: {primaryCarrier?.name}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="text-center min-w-[60px]">
              <div className="text-xl font-bold text-slate-800 tracking-tighter">
                {seg?.departureTime ? seg.departureTime.split('T')[1].slice(0,5) : "--:--"}
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase">{seg?.departureAirport?.code}</div>
            </div>
            
            <div className="flex-1 flex flex-col items-center">
              <div className="text-[10px] text-emerald-600 font-bold mb-1">Bay thẳng</div>
              <div className="w-full h-[1px] bg-slate-200 relative flex items-center justify-center">
                 {/* Biểu tượng máy bay SVG mới của bạn - Đã đổi fill sang màu đen */}
                 <div className="absolute bg-white px-2">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 12 12" 
                      className="h-3 w-3" 
                      aria-hidden="true"
                    >
                      <path 
                        fill="black" 
                        d="M3.922 12h.499a.52.52 0 0 0 .444-.247L7.949 6.8l3.233-.019A.8.8 0 0 0 12 6a.8.8 0 0 0-.818-.781L7.949 5.2 4.866.246A.53.53 0 0 0 4.421 0h-.499a.523.523 0 0 0-.489.71L5.149 5.2H2.296l-.664-1.33a.52.52 0 0 0-.436-.288L0 3.509 1.097 6 0 8.491l1.196-.073a.52.52 0 0 0 .436-.288l.664-1.33h2.853l-1.716 4.49a.523.523 0 0 0 .489.71"
                      />
                    </svg>
                 </div>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">1g 20</div>
            </div>

            <div className="text-center min-w-[60px]">
              <div className="text-xl font-bold text-slate-800 tracking-tighter">
                {seg?.arrivalTime ? seg.arrivalTime.split('T')[1].slice(0,5) : "--:--"}
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase">{seg?.arrivalAirport?.code}</div>
            </div>
          </div>
        </div>

        {/* Nội dung giá tiền (Bên phải) */}
        <div className="bg-slate-50/50 border-l border-slate-100 p-5 flex flex-col justify-center items-end">
          <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Tùy chọn từ</div>
          <div className="text-xl font-black text-slate-900 mb-4">
            {formatCurrency(priceUnits, currency)}
          </div>
          <a
            href={offer?.linkFFFlight || "#"}
            target="_blank"
            className="w-full bg-slate-900 text-white text-center py-2.5 rounded-lg font-bold text-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group-hover:gap-3"
          >
            Chọn vé <span>→</span>
          </a>
        </div>
      </div>
    </div>
  );
}