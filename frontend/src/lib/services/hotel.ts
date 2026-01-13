// services/hotelService.ts
import { apiFetch } from "../apiClient";

export const hotelService = {
  searchDestination(q: string) {
    return apiFetch<any>(
      `/hotel/search-destination?q=${encodeURIComponent(q)}`,
      { method: "GET" },
      { auth: false }
    );
  },

  search(params: Record<string, string | number | boolean>) {
    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    );
    return apiFetch<any>(`/hotel/search?${qs.toString()}`, { method: "GET" }, { auth: false });
  },

  searchByCoordinate(lat: number, lng: number) {
    return apiFetch<any>(
      `/hotel/search-by-coordinate?lat=${lat}&lng=${lng}`,
      { method: "GET" },
      { auth: false }
    );
  },

  link(id: string) {
    return apiFetch<any>(`/hotel/link?id=${encodeURIComponent(id)}`, { method: "GET" }, { auth: false });
  },
};
