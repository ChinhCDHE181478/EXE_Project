"use client";
import Link from "next/link";

function IconHotel() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M3 4h14a2 2 0 012 2v8h2v6h-2v-2H5v2H3V4zm2 2v10h14V6H5zm2 2h4v3H7V8zm6 0h4v3h-4V8z" />
    </svg>
  );
}
function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm7.9 9h-3.3a15.7 15.7 0 00-1.3-5 8.04 8.04 0 014.6 5zM12 4c1.2 1.6 2.1 3.9 2.4 7H9.6c.3-3.1 1.2-5.4 2.4-7zM4.4 11A8.04 8.04 0 019 6a15.7 15.7 0 00-1.3 5H4.4zm0 2h3.3a15.7 15.7 0 001.3 5 8.04 8.04 0 01-4.6-5zm7.6 7c-1.2-1.6-2.1-3.9-2.4-7h4.8c-.3 3.1-1.2 5.4-2.4 7zm2.6-2a15.7 15.7 0 001.3-5h3.3a8.04 8.04 0 01-4.6 5z" />
    </svg>
  );
}

export default function NavTiles() {
  return (
    <section className="container mx-auto px-4 mt-8">
      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/pages/hotels"
          className="rounded-xl bg-[#0891b2]/10 hover:bg-[#0891b2]/15 p-6 text-center font-medium flex items-center justify-center gap-2"
        >
          <IconHotel /> Khách sạn
        </Link>
        <Link
          href="/pages/flights"
          className="rounded-xl bg-[#0891b2]/10 hover:bg-[#0891b2]/15 p-6 text-center font-medium flex items-center justify-center gap-2"
        >
          <IconGlobe /> Chuyến bay
        </Link>
      </div>
    </section>
  );
}
