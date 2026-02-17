"use server";

import { cookies } from "next/headers";

interface StoreTokenRequest {
  accessToken: string;
  refreshToken: string;
}

export async function storeToken(
  request: any,
  rememberMe: boolean
) {
  (await cookies()).set({
    name: "access_token",
    value: request.accessToken,
    maxAge: 60 * 60 * 24 * 1,  // 1 day
    httpOnly: true,
  });

  if (rememberMe) {
    (await cookies()).set({
      name: "refresh_token",
      value: request.refreshToken,
      maxAge: 60 * 60 * 24 * 7,  // 1 week
      httpOnly: true,
    });
  } else {
    (await cookies()).set({
      name: "refresh_token",
      value: request.refreshToken,
      httpOnly: true,
    });
  }
}
