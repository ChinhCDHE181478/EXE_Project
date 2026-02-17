"use client";

import Link from "next/link";

export default function PaymentSuccessPage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
                <div className="flex justify-center mb-6">
                    <svg className="w-20 h-20 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>

                <h1 className="text-3xl font-bold text-gray-800 mb-3">
                    Thanh toán thành công!
                </h1>

                <p className="text-gray-600 mb-8">
                    Cảm ơn bạn đã gia hạn gói subscription. Tài khoản của bạn đã được cập nhật thành công.
                </p>

                <div className="space-y-3">
                    <Link
                        href="/"
                        className="block w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md"
                    >
                        Về trang chủ
                    </Link>

                    <Link
                        href="/pages/profile"
                        className="block w-full border-2 border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 transition-all duration-200"
                    >
                        Xem thông tin tài khoản
                    </Link>
                </div>
            </div>
        </main>
    );
}
