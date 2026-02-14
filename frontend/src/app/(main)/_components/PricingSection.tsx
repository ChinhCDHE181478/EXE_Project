"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Crown, Zap, Compass, Loader2 } from "lucide-react";

// --- CẤU HÌNH API ---
const SPRING_BOOT_API = process.env.NEXT_PUBLIC_API_URL!;

// --- HELPER FUNCTIONS ---
function getTokenFromStorage() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token") || localStorage.getItem("token");
}

function getStoredUserId(): string | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem("vivuplan_user");
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.id || parsed?.userId || parsed?.user_id || null;
    } catch {
        return null;
    }
}

async function fetchJsonSafe(url: string, options?: RequestInit) {
    try {
        const res = await fetch(url, options);
        const text = await res.text();
        let json: any = null;
        try {
            json = text ? JSON.parse(text) : null;
        } catch {
            json = null;
        }
        return { res, text, json };
    } catch (e) {
        return { res: { ok: false } as Response, text: "", json: null };
    }
}

export default function PricingSection() {
    const router = useRouter();
    const [loadingPkg, setLoadingPkg] = useState<string | null>(null);

    // State kiểm tra đăng nhập để render nút "Miễn phí" đúng logic
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        // Chỉ chạy ở client
        if (typeof window !== "undefined") {
            setIsLoggedIn(!!getTokenFromStorage());
        }
    }, []);

    // --- HÀM MUA GÓI ---
    const handlePurchase = async (pkgId: string, packageCode: string) => {
        // 1. Xử lý gói miễn phí (Basic)
        if (pkgId === "basic") {
            if (!isLoggedIn) {
                // Chưa đăng nhập -> Chuyển sang đăng ký/đăng nhập
                router.push("/pages/login");
            }
            // Nếu đã đăng nhập -> Không làm gì cả (nút đã bị disable ở giao diện)
            return;
        }

        setLoadingPkg(pkgId);

        try {
            // 2. Kiểm tra đăng nhập
            const token = getTokenFromStorage();
            const uid = getStoredUserId();

            if (!token || !uid) {
                alert("Vui lòng đăng nhập để mua gói dịch vụ.");
                router.push("/pages/login?next=/");
                return;
            }

            // 3. Gọi API tạo link thanh toán
            const { res, json } = await fetchJsonSafe(`${SPRING_BOOT_API}/subscriptions/purchase`, {
                method: "POST",
                headers: { "Content-Type": "application/json", accept: "*/*" },
                body: JSON.stringify({ userId: uid, packageCode: packageCode }),
            });

            if (!res.ok) {
                alert(json?.message || "Lỗi tạo giao dịch. Vui lòng thử lại.");
                return;
            }

            if (json?.status !== "success" || !json?.result?.checkoutUrl) {
                alert(json?.message || "Không lấy được link thanh toán.");
                return;
            }

            // 4. Mở trang thanh toán
            window.location.href = json.result.checkoutUrl;

        } catch (error) {
            console.error(error);
            alert("Có lỗi xảy ra. Vui lòng kiểm tra kết nối.");
        } finally {
            setLoadingPkg(null);
        }
    };

    const plans = [
        {
            id: "basic",
            packageCode: "basic",
            name: "Thành Viên",
            price: "Miễn phí",
            period: "/trọn đời",
            description: "Dành cho người chỉ có nhu cầu đặt vé & phòng.",
            icon: <Compass size={24} />,
            highlight: false,
            features: [
                { name: "Tìm & Đặt Vé máy bay", included: true },
                { name: "Tìm & Đặt Khách sạn", included: true },
                { name: "Thanh toán bảo mật", included: true },
                { name: "Lên lịch trình bằng AI", included: false },
                { name: "Bản đồ lịch trình thông minh", included: false },
                { name: "Lưu lịch sử chuyến đi", included: false },
            ],
            // Logic nút bấm riêng cho gói Basic
            cta: isLoggedIn ? "Đang sử dụng" : "Đăng nhập ngay",
            buttonStyle: isLoggedIn
                ? "bg-slate-100 text-slate-400 cursor-default" // Style khi đã active
                : "bg-slate-100 text-slate-600 hover:bg-slate-200", // Style khi chưa active
            disabled: isLoggedIn // Disable nút nếu đã login
        },
        {
            id: "day",
            packageCode: "day",
            name: "Gói 1 Ngày",
            price: "10.000đ",
            period: "/24 giờ",
            description: "Mở khóa AI cho một chuyến đi ngắn hạn.",
            icon: <Zap size={24} />,
            highlight: false,
            features: [
                { name: "Tất cả tính năng Cơ bản", included: true },
                { name: "Tìm & Đặt Khách sạn", included: true },
                { name: "Thanh toán bảo mật", included: true },
                { name: "Lên lịch trình bằng AI (24h)", included: true },
                { name: "Bản đồ lịch trình thông minh", included: true },
                { name: "Lưu lịch sử chuyến đi", included: true },
            ],
            cta: "Mua gói ngày",
            buttonStyle: "bg-cyan-100 text-cyan-700 hover:bg-cyan-200",
            disabled: false
        },
        {
            id: "month",
            packageCode: "month",
            name: "Gói 30 Ngày",
            price: "49.000đ",
            period: "/tháng",
            description: "Thoải mái lên kế hoạch, tiết kiệm tối đa.",
            icon: <Crown size={24} />,
            highlight: true,
            features: [
                { name: "Tất cả tính năng Cơ bản", included: true },
                { name: "Tìm & Đặt Khách sạn", included: true },
                { name: "Thanh toán bảo mật", included: true },
                { name: "Lên lịch trình bằng AI (30 ngày)", included: true },
                { name: "Bản đồ lịch trình thông minh", included: true },
                { name: "Lưu lịch sử chuyến đi", included: true },
            ],
            cta: "Đăng ký gói tháng",
            buttonStyle: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg hover:shadow-cyan-500/40",
            disabled: false
        },
    ];

    return (
        <section className="py-24 bg-slate-50 relative overflow-hidden" id="pricing">
            {/* Background Decor */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />

            <div className="container mx-auto px-6 relative z-10">

                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in-up">
                    <h2 className="text-2xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">
                        Lựa Chọn Gói Dịch Vụ
                    </h2>
                    <p className="text-slate-600 text-lg">
                        Bạn chỉ cần đặt vé? Dùng gói miễn phí. <br className="hidden md:block" />
                        Muốn AI lên lịch trình chi tiết? Hãy chọn gói Ngày hoặc Tháng.
                    </p>
                </div>

                {/* Grid 3 Cột */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`
                relative p-8 rounded-[2rem] border flex flex-col transition-all duration-300 group h-full
                ${plan.highlight
                                    ? "bg-white border-cyan-500 shadow-2xl shadow-cyan-200/50 scale-100 md:scale-110 z-10"
                                    : "bg-white/80 border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 z-0"
                                }
              `}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md flex items-center gap-1">
                                    <Crown size={12} fill="currentColor" /> Phổ biến
                                </div>
                            )}

                            {/* Icon & Name */}
                            <div className="mb-6 flex flex-col items-center text-center">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${plan.highlight ? 'bg-cyan-100 text-cyan-600' : 'bg-slate-100 text-slate-500'}`}>
                                    {plan.icon}
                                </div>
                                <h3 className="text-lg font-black uppercase tracking-wider text-slate-900">
                                    {plan.name}
                                </h3>
                                <p className="text-slate-500 text-xs mt-2 px-2 h-8">
                                    {plan.description}
                                </p>
                            </div>

                            {/* Price */}
                            <div className="flex items-center justify-center gap-1 text-slate-900 border-b border-slate-100 pb-8 mb-8">
                                <span className={`font-black tracking-tighter ${plan.highlight ? 'text-4xl text-cyan-600' : 'text-3xl'}`}>
                                    {plan.price}
                                </span>
                                {plan.price !== "Miễn phí" && (
                                    <span className="text-slate-400 font-bold text-xs self-end mb-1.5">{plan.period}</span>
                                )}
                            </div>

                            {/* Features List */}
                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className={`flex items-start gap-3 ${!feature.included ? "opacity-40" : ""}`}>
                                        {feature.included ? (
                                            <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${plan.highlight ? "bg-cyan-500 text-white" : "bg-slate-200 text-slate-600"}`}>
                                                <Check size={10} strokeWidth={4} />
                                            </div>
                                        ) : (
                                            <div className="mt-0.5 w-4 h-4 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center shrink-0">
                                                <X size={10} strokeWidth={3} />
                                            </div>
                                        )}
                                        <span className={`text-sm font-bold ${feature.included ? "text-slate-700" : "text-slate-400 line-through decoration-slate-300"}`}>
                                            {feature.name}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA Button */}
                            <button
                                onClick={() => handlePurchase(plan.id, plan.packageCode)}
                                // Disabled nếu đang loading HOẶC nếu là gói basic mà đã login
                                disabled={loadingPkg !== null || (plan.id === "basic" && isLoggedIn)}
                                className={`
                  w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all transform flex items-center justify-center gap-2
                  ${plan.buttonStyle}
                  ${(loadingPkg !== null && loadingPkg !== plan.id) ? "opacity-50 cursor-not-allowed" : ""}
                  ${plan.id !== "basic" || !isLoggedIn ? "active:scale-95" : ""}
                `}
                            >
                                {loadingPkg === plan.id ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" /> Đang xử lý...
                                    </>
                                ) : (
                                    plan.cta
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}