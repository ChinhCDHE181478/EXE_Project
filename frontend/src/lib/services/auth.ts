import { apiFetch, tokenStore } from "../apiClient";

export const authService = {
  async login(body: { email: string; password: string }) {
    const data = await apiFetch<{ accessToken: string; refreshToken: string }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify(body) },
      { auth: false }
    );
    tokenStore.setTokens(data.accessToken, data.refreshToken);
    return data;
  },

  async logout() {
    // nếu backend yêu cầu token thì giữ auth:true (mặc định)
    await apiFetch<void>("/auth/logout", { method: "POST" });
    tokenStore.clearTokens();
  },

  async verify() {
    return apiFetch<any>("/auth/verify", { method: "POST" });
  },

  async otpRegister(body: any) {
    return apiFetch<any>(
      "/auth/otp-register",
      { method: "POST", body: JSON.stringify(body) },
      { auth: false }
    );
  },

  async otpVerify(body: any) {
    const data = await apiFetch<{
      accessToken: string;
      refreshToken?: string;
      user?: any;
    }>(
      "/auth/otp-verify",
      { method: "POST", body: JSON.stringify(body) },
      { auth: false }
    );

    // nếu server trả token
    if (data?.accessToken)
      tokenStore.setTokens(data.accessToken, data.refreshToken);

    return data;
  },
};
