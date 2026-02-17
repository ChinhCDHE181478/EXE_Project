import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const accessToken = (await cookies()).get("access_token")?.value;
    return NextResponse.json(
        {
            accessToken: accessToken,
        },
        { status: 200 }
    );
}
