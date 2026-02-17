"use server";

import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

export interface UserSession {
    id: string;
    email: string;
    role: string;
}

interface DecodedToken {
    sub: string; // usually email or id
    iss: string;
    exp: number;
    iat: number;
    scope: string;
    jti: string;
    // backend might put other fields directly
    id?: string;
    email?: string;
    role?: string;
}

export async function getSession(): Promise<UserSession | null> {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    // 1. Check if user is theoretically logged in (has refresh token)
    if (!refreshToken) {
        return null;
    }

    let accessToken = cookieStore.get("access_token")?.value;
    let user: UserSession | null = null;

    // 2. Try to extract from existing access token
    if (accessToken) {
        try {
            const decoded = jwtDecode<DecodedToken>(accessToken);
            const currentTime = Date.now() / 1000;

            if (decoded.exp > currentTime) {
                // Token is valid
                user = {
                    id: decoded.id || decoded.sub, // adjust based on actual token structure
                    email: decoded.email || decoded.sub,
                    role: decoded.scope || decoded.role || "USER",
                };
                return user;
            }
            // Token expired, fall through to refresh
        } catch (error) {
            // Invalid token, fall through to refresh
            console.error("Error decoding existing access token:", error);
        }
    }

    // 3. Refresh and Extract
    // 3. Refresh and Extract
    try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

        const response = await axios.post(`${backendUrl}/auth/refresh`, {
            refreshToken
        }, {
            headers: { "Content-Type": "application/json" }
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.result || response.data; // adjust based on actual response structure

        if (newAccessToken) {
            // Update cookies
            cookieStore.set({
                name: "access_token",
                value: newAccessToken,
                maxAge: 60 * 60 * 24, // 1 day (adjust as needed)
                httpOnly: true,
                path: "/",
            });

            if (newRefreshToken) {
                cookieStore.set({
                    name: "refresh_token",
                    value: newRefreshToken,
                    maxAge: 60 * 60 * 24 * 7, // 7 days (adjust as needed)
                    httpOnly: true,
                    path: "/",
                });
            }

            // Decode new token
            const decoded = jwtDecode<DecodedToken>(newAccessToken);
            const newUser: UserSession = {
                id: decoded.id || decoded.sub,
                email: decoded.email || decoded.sub,
                role: decoded.scope || decoded.role || "USER",
            };
            return newUser;
        }
    } catch (error) {
        // If refresh fails (e.g. 400 Bad Request due to invalid token), clear cookies to stop the loop
        // console.error("Session refresh failed:", error); 
        cookieStore.delete("access_token");
        cookieStore.delete("refresh_token");
        return null;
    }

    return null;
}
