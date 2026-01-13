import { apiFetch } from "../apiClient";

export const flightService = {
  searchDestination(q: string) {
    return apiFetch<any>(`/flight/search-destination?q=${encodeURIComponent(q)}`, { method: "GET" });
  },

  search(params: Record<string, string | number | boolean>) {
    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    );
    return apiFetch<any>(`/flight/search?${qs.toString()}`, { method: "GET" });
  },
};
