import { redirect } from "next/navigation";

// Backward-compat route: keep old /pages/results working
export default function ResultsRedirectPage() {
  redirect("/pages/hotel-results");
}
