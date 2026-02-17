"use client";

import Link from "next/link";

export default function PaymentCancelPage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-100 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
                <div className="flex justify-center mb-6">
                    <svg className="w-20 h-20 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>

                <h1 className="text-3xl font-bold text-gray-800 mb-3">
                    Thanh toán đã bị hủy
                </h1>

                <p className="text-gray-600 mb-8">
                    Giao dịch của bạn chưa được hoàn tất. Bạn có thể thử lại bất cứ lúc nào.
                </p>

                <div className="space-y-3">
                    <Link
                        href="/"
                        className="block w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-200 shadow-md"
                    >
                        Về trang chủ
                    </Link>
                </div>
            </div>
        </main>
    );
}
