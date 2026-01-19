import axios from "axios";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, res: NextResponse) {
  const cookiesStore = cookies();
  const refreshToken = (await cookiesStore).get("refresh_token")?.value;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const header = new Headers(res.headers);
  if (!refreshToken) {
    return NextResponse.json(
      {
        message: "Unable to get refresh token",
      },
      { status: 401 }
    );
  }
  console.log(refreshToken);
  try {
    const result = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}` + "/auth/logout",
      {
        refreshToken: refreshToken,
      }
    );
    (await cookies()).delete("access_token");
    (await cookies()).delete("refresh_token");

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("logout"));
    }

    return NextResponse.json(result.data, {
      status: result.status,
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    (await cookies()).delete("access_token");
    (await cookies()).delete("refresh_token");

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("logout"));
    }

    return NextResponse.json(
      {
        message: "Invalid refreshToken",
      },
      { status: 401 }
    );
  }
}
