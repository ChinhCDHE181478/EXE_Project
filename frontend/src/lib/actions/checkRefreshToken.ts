"use server";

import { cookies } from "next/headers";

export async function checkRefreshToken(): Promise<boolean> {
    try {
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get("refresh_token")?.value;
        return !!refreshToken;
    } catch (error) {
        return false;
    }
}
