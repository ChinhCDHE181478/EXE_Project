"use server";
import { cookies } from "next/headers";

export async function getRefreshToken() {
  const refreshToken = (await cookies()).get("refresh_token")?.value;
  return { refreshToken };
}
