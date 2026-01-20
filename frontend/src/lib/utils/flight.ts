export function pickIata(input: string): string {
  const raw = (input ?? "").trim();
  if (!raw) return "";

  // (HAN) -> HAN
  const inParen = raw.match(/\(([A-Z0-9]{3})\)/i);
  if (inParen?.[1]) return inParen[1].toUpperCase();

  // Find any 3-letter IATA code in string (e.g. "Bangkok BKK")
  const code = raw.match(/\b([A-Z0-9]{3})\b/i);
  if (code?.[1]) return code[1].toUpperCase();

  // If user typed exactly 3 chars
  if (raw.length === 3) return raw.toUpperCase();

  // Fallback: keep raw (BE might accept city names)
  return raw;
}

export function formatTime(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function dayOffsetSuffix(startIso?: string, endIso?: string): string {
  if (!startIso || !endIso) return "";
  const s = new Date(startIso);
  const e = new Date(endIso);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "";
  // Compare local dates
  const sDay = new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime();
  const eDay = new Date(e.getFullYear(), e.getMonth(), e.getDate()).getTime();
  const diff = Math.round((eDay - sDay) / (24 * 60 * 60 * 1000));
  return diff > 0 ? `+${diff}` : "";
}

export function formatDuration(startIso?: string, endIso?: string): string {
  if (!startIso || !endIso) return "";
  const s = new Date(startIso);
  const e = new Date(endIso);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "";
  let mins = Math.round((e.getTime() - s.getTime()) / 60000);
  if (mins < 0) mins += 24 * 60; // very defensive
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}g ${m.toString().padStart(2, "0")}`;
}

export function formatVnd(units?: string | number, nanos?: string | number): string {
  const u = units == null ? 0 : Number(units);
  const n = nanos == null ? 0 : Number(nanos);
  const value = (Number.isFinite(u) ? u : 0) + (Number.isFinite(n) ? n / 1_000_000_000 : 0);
  return new Intl.NumberFormat("vi-VN").format(Math.round(value));
}
