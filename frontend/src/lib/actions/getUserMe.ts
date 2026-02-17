"use server";

import { cookies } from "next/headers";
import axios from "axios";

export interface UserResponse {
    id: string;
    email: string;
}

export interface BaseJsonResponse {
    status: string;
    code: string;
    message: string;
    result: UserResponse;
}

async function refreshAccessToken(): Promise<string | null> {
    try {
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get("refresh_token")?.value;

        if (!refreshToken) {
            return null;
        }

        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

        // Call backend to refresh token
        const response = await axios.post(`${backendUrl}/auth/refresh`, {
            refreshToken
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Update cookies with new tokens
        cookieStore.set({
            name: "access_token",
            value: accessToken,
            maxAge: 60 * 60 * 24, // 1 day
            httpOnly: true,
        });

        if (newRefreshToken) {
            cookieStore.set({
                name: "refresh_token",
                value: newRefreshToken,
                maxAge: 60 * 60 * 24 * 7, // 7 days
                httpOnly: true,
            });
        }

        return accessToken;
    } catch (error) {
        console.error("Error refreshing token:", error);
        return null;
    }
}

export async function getUserMe(): Promise<UserResponse | null> {
    try {
        const cookieStore = await cookies();
        let accessToken = cookieStore.get("access_token")?.value;

        if (!accessToken) {
            return null;
        }

        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

        try {
            // Try with current access token
            const response = await axios.get<BaseJsonResponse>(`${backendUrl}/user/getme`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (response.data && response.data.result) {
                return response.data.result;
            }

            return null;
        } catch (error: any) {
            // If 401, try to refresh token and retry
            if (error.response && error.response.status === 401) {
                console.log("Access token expired, attempting refresh...");

                const newAccessToken = await refreshAccessToken();

                if (!newAccessToken) {
                    return null;
                }

                // Retry with new token
                const retryResponse = await axios.get<BaseJsonResponse>(`${backendUrl}/user/getme`, {
                    headers: {
                        Authorization: `Bearer ${newAccessToken}`,
                    },
                });

                if (retryResponse.data && retryResponse.data.result) {
                    return retryResponse.data.result;
                }
            }

            throw error;
        }
    } catch (error) {
        console.error("Error fetching user me:", error);
        return null;
    }
}
