// src/app/_components/Footer.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // ⬇️ Ẩn footer mặc định trên các trang admin
  if (pathname?.startsWith("/admin")) return null;
  if (pathname?.startsWith("/chatbox")) return null;

  return (
    <footer className="bg-[#0891b2]/10">
      <div className="container mx-auto px-4 py-10 grid md:grid-cols-4 gap-8">
        <div>
          <Link href="/" className="inline-flex items-center">
            <img
              src="/brand/logo.png"
              alt="VivuPlan"
              className="h-24 w-auto object-contain"
            />
          </Link>

          <p className="mt-3 text-slate-700">
            Nền tảng du lịch giúp bạn tìm kiếm và đặt chuyến bay, khách sạn tốt nhất.
          </p>
        </div>

        <div>
          <div className="font-medium text-slate-900">Công ty</div>
          <ul className="mt-3 space-y-2 text-slate-700">
            <li>Về chúng tôi</li>
            <li>Nghề nghiệp</li>
            <li>Báo chí</li>
            <li>Blog</li>
          </ul>
        </div>

        <div>
          <div className="font-medium text-slate-900">Hỗ trợ</div>
          <ul className="mt-3 space-y-2 text-slate-700">
            <li>Trung tâm trợ giúp</li>
            <li>Liên hệ</li>
            <li>Chính sách huỷ</li>
            <li>Điều khoản</li>
          </ul>
        </div>

        {/* Kết nối */}
        <div>
          <div className="font-medium text-slate-900">
            Kết nối với chúng tôi
          </div>
          <div className="mt-3 flex items-center gap-4">
            <a className="group" href="#" aria-label="Facebook">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 text-slate-700 group-hover:text-[#0891b2]"
                fill="currentColor"
              >
                <path d="M22 12a10 10 0 10-11.6 9.9v-7H7.7V12h2.7V9.8c0-2.7 1.6-4.2 4-4.2 1.2 0 2.5.2 2.5.2v2.7h-1.4c-1.4 0-1.8.9-1.8 1.8V12h3l-.5 2.9h-2.5v7A10 10 0 0022 12z" />
              </svg>
            </a>
            <a className="group" href="#" aria-label="Instagram">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 text-slate-700 group-hover:text-[#0891b2]"
                fill="currentColor"
              >
                <path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm10 2H7a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3zm-5 3.5a5.5 5.5 0 110 11 5.5 5.5 0 010-11zm0 2a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm5.8-.9a1.1 1.1 0 11-2.2 0 1.1 1.1 0 012.2 0z" />
              </svg>
            </a>
            <a className="group" href="#" aria-label="Twitch">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 text-slate-700 group-hover:text-[#0891b2]"
                fill="currentColor"
              >
                <path d="M4 3h16v10l-4 4h-4l-3 3H7v-3H4V3zm14 2H6v10h3v3l3-3h4l2-2V5zm-3 2h2v5h-2V7zm-4 0h2v5h-2V7z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 text-center text-sm text-slate-600 py-4">
        © {new Date().getFullYear()} VivuPlan.
      </div>
    </footer>
  );
}
