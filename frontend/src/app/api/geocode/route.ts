import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json({ found: false, error: "Missing q" }, { status: 400 });
  }

  const url =
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&addressdetails=0`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "VivuPlanChatbox/1.0",
        "Accept": "application/json",
      },
      next: { revalidate: 60 * 60 * 24 }, // cache 1 ngày
    });

    if (!res.ok) {
      return NextResponse.json(
        { found: false, error: `Upstream ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ found: false });
    }

    const lat = Number(data[0].lat);
    const lng = Number(data[0].lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ found: false, error: "Invalid lat/lng" }, { status: 502 });
    }

    return NextResponse.json({
      found: true,
      lat, // number
      lng, // number
      display_name: String(data[0].display_name ?? ""),
    });
  } catch {
    return NextResponse.json({ found: false, error: "Geocode failed" }, { status: 502 });
  }
}
