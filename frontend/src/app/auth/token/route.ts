import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(req: NextRequest, res: NextResponse) {
  const accessToken = (await cookies()).get("access_token")?.value;
  return NextResponse.json(
    {
      accessToken: accessToken,
    },
    { status: 200 }
  );
}
