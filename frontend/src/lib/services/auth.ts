import { apiFetch, tokenStore } from "../apiClient";

/**
 * Standard API envelope used by backend
 * Example:
 * {
 *   status: "SUCCESS",
 *   message: "...",
 *   result: { ... }
 * }
 */
type BaseJsonResponse<T = any> = {
  status: string | number;
  message?: string;
  result?: T;
};

/**
 * Login payload returned in BaseJsonResponse.result
 * from POST /auth/otp-login/verify
 */
type LoginResponse = {
  id?: string | number;
  email?: string;
  firstName?: string;
  lastName?: string;
  accessToken: string;
  refreshToken: string;
  user?: any;
};

export const authService = {
  /**
   * Legacy username/password login (optional - keep if still used somewhere else)
   */
  async login(body: { email: string; password: string }) {
    const data = await apiFetch<{ accessToken: string; refreshToken: string }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify(body) },
      { auth: false }
    );

    tokenStore.setTokens(data.accessToken, data.refreshToken);
    return data;
  },

  /**
   * Request OTP for login
   * Backend: POST /auth/otp-login/{email}
   */
  async otpLoginSend(email: string) {
    const safeEmail = encodeURIComponent(email.trim());

    const res = await apiFetch<BaseJsonResponse>(
      `/auth/otp-login/${safeEmail}`,
      { method: "POST" },
      { auth: false }
    );

    if (!res || String(res.status).toUpperCase() !== "SUCCESS") {
      throw new Error(res?.message || "Unable to send OTP");
    }

    return res.result;
  },

  /**
   * Verify OTP and retrieve tokens
   * Backend: POST /auth/otp-login/verify
   */
  async otpLoginVerify(body: { email: string; otp: string }) {
    const res = await apiFetch<BaseJsonResponse<LoginResponse>>(
      "/auth/otp-login/verify",
      {
        method: "POST",
        body: JSON.stringify({
          email: body.email.trim(),
          otp: body.otp.trim(),
        }),
      },
      { auth: false }
    );

    if (!res || String(res.status).toUpperCase() !== "SUCCESS") {
      throw new Error(res?.message || "OTP verification failed");
    }

    const data = res.result;

    if (!data?.accessToken || !data?.refreshToken) {
      throw new Error("Token payload missing in login response");
    }

    tokenStore.setTokens(data.accessToken, data.refreshToken);

    const backendUser = data.user ?? {};
    const resolvedId =
      backendUser.id ??
      backendUser.userId ??
      backendUser.user_id ??
      data.id ??
      null;
    const resolvedEmail = backendUser.email ?? data.email ?? body.email?.trim() ?? "";
    const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ").trim();
    const resolvedDisplayName =
      backendUser.displayName ??
      (fullName || (resolvedEmail ? resolvedEmail.split("@")[0] : "Thanh vien VivuPlan"));

    if (typeof window !== "undefined") {
      const userSession = {
        id: resolvedId,
        displayName: resolvedDisplayName,
        email: resolvedEmail,
      };
      localStorage.setItem("vivuplan_user", JSON.stringify(userSession));
    }

    return {
      ...data,
      user: {
        ...backendUser,
        id: resolvedId,
        email: resolvedEmail,
        displayName: resolvedDisplayName,
      },
    };
  },

  /**
   * Logout
   * Backend currently expects a LogoutRequest body.
   * If your backend requires refreshToken, you can extend this later.
   */
  async logout() {
    try {
      await apiFetch<void>("/auth/logout", { method: "POST" });
    } finally {
      tokenStore.clearTokens();
      if (typeof window !== "undefined") {
        localStorage.removeItem("vivuplan_user");
      }
    }
  },

  /**
   * Verify token validity
   * Backend: POST /auth/verify with body { accessToken }
   */
  async verify(accessToken: string) {
    return apiFetch<any>(
      "/auth/verify",
      { method: "POST", body: JSON.stringify({ accessToken }) },
      { auth: false }
    );
  },
};
