"use server";

import { cookies } from "next/headers";

interface StoreTokenRequest {
  accessToken: string;
  refreshToken: string;
}

export async function storeToken(
  request: StoreTokenRequest,
  rememberMe: boolean
) {
  (await cookies()).set({
    name: "access_token",
    value: request.accessToken,
    httpOnly: true,
  });

  if (rememberMe) {
    (await cookies()).set({
      name: "refresh_token",
      value: request.refreshToken,
      maxAge: 60 * 60 * 24 * 30,
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
