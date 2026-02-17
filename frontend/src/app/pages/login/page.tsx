"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/lib/services/auth";
import { storeToken } from "@/lib/actions/storeToken";

function SocialBtn({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 hover:bg-slate-50 active:scale-[.99] transition"
    >
      {children}
    </button>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextParam = searchParams.get("next");
  const nextPath =
    nextParam && nextParam.startsWith("/") ? nextParam : "/";

  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  const validEmail = /.+@.+/.test(email);
  const canSubmit = step === "email" ? validEmail : otp.trim().length >= 6;

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  /**
   * UI-only resend countdown (prevents spamming OTP requests)
   */
  const startCountdown = () => {
    setResendIn(30);
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setResendIn((s) => {
        if (s <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  /**
   * Step 1: request OTP
   * Backend: POST /auth/otp-login/{email}
   */
  const handleSendOtp = async () => {
    setErr("");
    setLoading(true);
    try {
      await authService.otpLoginSend(email);
      setStep("otp");
      startCountdown();
    } catch (e: any) {
      setErr(e?.message || "Gửi OTP thất bại");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 2: verify OTP -> login -> persist tokens
   * Backend: POST /auth/otp-login/verify
   */
  const handleVerifyOtp = async () => {
    setErr("");
    setLoading(true);
    try {
      const data = await authService.otpLoginVerify({ email, otp });


      storeToken(data, true);

      // ✅ Redirect về đúng nơi gọi login
      router.replace(nextPath);
    } catch (e: any) {
      setErr(e?.message || "OTP không đúng hoặc đã hết hạn");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    if (step === "email") await handleSendOtp();
    else await handleVerifyOtp();
  };

  const resendOTP = async () => {
    if (resendIn > 0 || loading) return;
    await handleSendOtp();
  };

  return (
    <main
      className="
        min-h-[calc(100vh-140px)]
        bg-gradient-to-b
        from-[#0891b2]/8 via-white/85 to-white
        supports-[backdrop-filter]:backdrop-blur-[2px]
        pb-10
        pt-[calc(env(safe-area-inset-top)+16px)]
        md:pt-10
      "
    >
      <div className="container mx-auto px-4 h-full mt-40">
        <div className="mt-4 md:mt-0">
          <div className="mx-auto grid max-w-6xl overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5 md:grid-cols-2">
            {/* LEFT */}
            <div className="relative block">
              <div className="h-[170px] sm:h-[220px] md:h-full">
                <img
                  src="https://images.unsplash.com/photo-1526772662000-3f88f10405ff?q=80&w=1600&auto=format&fit=crop"
                  alt="VivuPlan - travel login"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="absolute inset-0 bg-gradient-to-tr from-black/55 via-black/25 to-transparent" />

              <div className="absolute bottom-4 left-4 right-4 text-white drop-shadow">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                    <path d="M2 12l7 2 4 8 2-6 6 2 1-2-6-4 3-8-2-1-6 7-9 2z" />
                  </svg>
                </div>
                <h3 className="mt-2 text-xl sm:text-2xl font-semibold">
                  Chào mừng trở lại
                </h3>
                <p className="text-white/90 text-sm sm:text-base">
                  Đăng nhập để đồng bộ chuyến bay, khách sạn của bạn.
                </p>
              </div>
            </div>

            {/* RIGHT */}
            <div className="p-5 sm:p-8 md:p-10">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Đăng nhập
              </h1>
              <p className="mt-1 text-slate-600">
                Chỉ cần email — hệ thống sẽ gửi mã OTP để xác thực nhanh.
              </p>

              {err && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {err}
                </div>
              )}

              {/* {/* Social demo */}
              {/* <div className="mt-6 flex gap-3">
                <SocialBtn onClick={() => alert("Google login (demo)")}>
                  <svg viewBox="0 0 24 24" className="h-5 w-5">
                    <path
                      fill="#EA4335"
                      d="M12 10.2v3.8h5.4c-.24 1.4-1.64 4-5.4 4a6.3 6.3 0 110-12.6c1.8 0 3 .7 3.7 1.3l2.5-2.4C16.8 3.3 14.6 2.5 12 2.5a9.5 9.5 0 100 19 9 9 0 009-9c0-.6-.1-1-.2-1.6H12z"
                    />
                  </svg>
                  Google
                </SocialBtn>

                <SocialBtn onClick={() => alert("Apple login (demo)")}>
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-black">
                    <path d="M16.365 1.43c0 1.14-.456 2.197-1.293 3.01-.833.81-2.01 1.39-3.22 1.31-.14-1.09.39-2.26 1.22-3.08.83-.82 2.29-1.41 3.29-1.24zM21 17.08c-.39.9-.86 1.78-1.43 2.61-.77 1.1-1.4 1.86-2.26 1.86-.8 0-1.34-.53-2.33-.53-.99 0-1.59.52-2.38.52-.96 0-1.68-.86-2.44-1.94C8 18.24 6.9 15.71 6.9 13.36c0-2.45 1.43-3.74 2.84-3.74 1.01 0 1.74.6 2.31.6.55 0 1.52-.62 2.64-.62.45 0 1.98.05 2.87 1.5-.08.05-1.74 1.02-1.72 3.05.02 2.44 2.13 3.25 2.17 3.27z" />
                  </svg>
                  Apple
                </SocialBtn>

                <SocialBtn onClick={() => alert("Facebook login (demo)")}>
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-[#1877F2]">
                    <path d="M22 12.07C22 6.52 17.52 2 12 2S2 6.52 2 12.07c0 5.02 3.66 9.18 8.44 9.93v-7.02H7.9v-2.9h2.54V9.41c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.62.77-1.62 1.55v1.86h2.76l-.44 2.9h-2.32V22c4.78-.75 8.44-4.91 8.44-9.93z" />
                  </svg>
                  Facebook
                </SocialBtn>
              </div>

              <div className="my-6 flex items-center gap-3 text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                hoặc
                <span className="h-px flex-1 bg-slate-200" />
              </div> */}

              {/* Email -> OTP */}
              <form onSubmit={handleContinue} className="space-y-4">
                {step === "email" ? (
                  <>
                    <div>
                      <label className="text-[12px] uppercase tracking-wide text-slate-600">
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nhap@email.com"
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-[#0891b2]"
                      />
                    </div>

                    <button
                      disabled={!validEmail || loading}
                      className="w-full h-11 rounded-lg bg-[#0891b2] text-white font-semibold shadow ring-1 ring-black/5 hover:brightness-110 disabled:opacity-50"
                    >
                      {loading ? "Đang gửi OTP..." : "Tiếp tục"}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <label className="text-[12px] uppercase tracking-wide text-slate-600">
                        Mã OTP
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setStep("email");
                          setOtp("");
                          setErr("");
                        }}
                        className="text-sm text-[#0891b2] hover:underline"
                      >
                        Đổi email
                      </button>
                    </div>

                    <input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Nhập mã 6 số"
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 tracking-[0.3em] text-center outline-none focus:border-[#0891b2]"
                    />

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">
                        Đã gửi tới <strong>{email}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={resendOTP}
                        disabled={resendIn > 0 || loading}
                        className={`${resendIn > 0 || loading
                          ? "text-slate-400"
                          : "text-[#0891b2] hover:underline"
                          }`}
                      >
                        {resendIn > 0 ? `Gửi lại (${resendIn}s)` : "Gửi lại mã"}
                      </button>
                    </div>

                    <button
                      disabled={!canSubmit || loading}
                      className="w-full h-11 rounded-lg bg-[#0891b2] text-white font-semibold shadow ring-1 ring-black/5 hover:brightness-110 disabled:opacity-50"
                    >
                      {loading ? "Đang xác thực..." : "Đăng nhập"}
                    </button>
                  </>
                )}
              </form>

              {/* <p className="mt-6 text-xs text-slate-500">
                Khi tiếp tục, bạn đồng ý với{" "}
                <a className="underline" href="#">
                  Điều khoản sử dụng
                </a>{" "}
                &{" "}
                <a className="underline" href="#">
                  Chính sách bảo mật
                </a>{" "}
                của VivuPlan.
              </p> */}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
