import { apiFetch } from "../apiClient";

export const flightService = {
  searchDestination(query: string, languagecode = "vi") {
    // BE: /api/v1/flight/search-destination?query=...&languagecode=vi
    const qs = new URLSearchParams({ query, languagecode });
    return apiFetch<any>(`/flight/search-destination?${qs.toString()}`, { method: "GET" });
  },

  search(params: Record<string, string | number | boolean>) {
    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    );
    return apiFetch<any>(`/flight/search?${qs.toString()}`, { method: "GET" });
  },
};
