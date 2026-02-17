"use client";
import Link from "next/link";

export default function ExploreBanner() {
  return (
    <section className="container mx-auto px-4 mt-8">
      <div
        className="rounded-2xl overflow-hidden relative shadow-md"
        style={{
          backgroundImage:
            'url("https://lh7-rt.googleusercontent.com/docsz/AD_4nXcqWVBJJ8x3WpV3tyiLI7dUNWOqeAcahpeOTRwg0DqGT1CbQpLE3Xn4pTNKqbTkbF_KD1bERQHKA1_QYz-5yIW9mbxxYiv4_DU_b0L4Fv7JuweBaFnDca4IXKwSCdgGIEHoa53k5A?key=gERBVwvLyyPePQBcZr2jh2ll")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "380px",
        }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative p-8 md:p-12 text-white max-w-xl">
          <div className="text-3xl md:text-4xl font-bold leading-tight">
            Khám phá điểm đến trong mơ
          </div>
          <Link
            href="/pages/explore"
            className="inline-block mt-6 px-5 py-3 rounded-lg bg-[#0891b2] hover:brightness-110 font-semibold"
          >
            Tìm vé máy bay đi Mọi nơi
          </Link>
        </div>
      </div>
    </section>
  );
}
