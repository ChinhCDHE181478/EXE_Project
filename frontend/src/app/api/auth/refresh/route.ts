import axios from "axios";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const accessToken = (await cookies()).get("access_token")?.value;

    if (!accessToken) {
        const refreshToken = (await cookies()).get("refresh_token")?.value;
        if (!refreshToken) {
            redirect("/auth/login");
        }
        try {
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}` + "/auth/refresh",
                { refreshToken },
                {
                    headers: { "Content-Type": "application/json" },
                }
            );
            const { accessToken } = res.data;
            (await cookies()).set({
                name: "access_token",
                value: accessToken,
                httpOnly: true,
            });
        } catch (error) {
            console.log(error);
        }
    }
    const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}` + "/auth/verify",
        {
            token: accessToken,
        },
        {
            headers: { "Content-Type": "application/json" },
        }
    );

    if (response.data === false) {
        const refreshToken = (await cookies()).get("refresh_token")?.value;
        if (!refreshToken) {
            redirect("/auth/login");
        }
        try {
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}` + "/auth/refresh",
                { refreshToken },
                {
                    headers: { "Content-Type": "application/json" },
                }
            );
            const { accessToken } = res.data;
            (await cookies()).set({
                name: "access_token",
                value: accessToken,
                httpOnly: true,
            });
        } catch (error) {
            console.log(error);
        }
    }

    const resData = {
        accessToken: (await cookies()).get("access_token")?.value,
    };
    return new Response(JSON.stringify(resData), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
        },
    });
}
