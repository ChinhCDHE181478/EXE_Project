import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  try {
    if (refreshToken) {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        refreshToken,
      });
    }
  } catch {
    // Continue clearing cookies even if upstream logout fails.
  }

  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");

  return NextResponse.json(
    {
      message: "Logged out",
    },
    { status: 200 }
  );
}
