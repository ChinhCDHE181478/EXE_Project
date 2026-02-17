"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logout() {
  const cookieStore = await cookies();
  
  // Clear cookies
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  
  // Optional: Call backend to invalidate token if needed
  // try {
  //   const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
  //   await fetch(`${backendUrl}/auth/logout`, { method: "POST" });
  // } catch (e) { console.error(e); }

  // Redirect to home or login
  redirect("/");
}
