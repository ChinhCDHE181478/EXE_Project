"use client";

import { useEffect, useRef, useState } from "react";
import { authService } from "@/lib/services/auth";

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

export default function RegisterModal({
  open,
  onClose,
  defaultEmail = "",
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  defaultEmail?: string;
  onSuccess: (displayName: string) => void;
}) {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState(defaultEmail);
  const [otp, setOtp] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const validEmail = /.+@.+/.test(email);
  const canSubmit = step === "email" ? validEmail : otp.trim().length >= 6;

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep("email");
    setEmail(defaultEmail || "");
    setOtp("");
    setResendIn(0);
    setLoading(false);
    setErr("");
  }, [open, defaultEmail]);

  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

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

  const saveUserForHeader = (
    emailValue: string,
    displayName?: string,
    userId?: string | number | null
  ) => {
    const name = displayName || emailValue.split("@")[0] || emailValue;
    let resolvedId: string | number | null = userId ?? null;
    try {
      const raw = localStorage.getItem("vivuplan_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        resolvedId = resolvedId ?? parsed?.id ?? parsed?.userId ?? parsed?.user_id ?? null;
      }
    } catch { }

    const sessionData: Record<string, any> = { displayName: name, email: emailValue };
    if (resolvedId != null) sessionData.id = resolvedId;

    localStorage.setItem("vivuplan_user", JSON.stringify(sessionData));
    return name;
  };

  const sendOtpRegister = async () => {
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

  const verifyOtpRegister = async () => {
    setErr("");
    setLoading(true);
    try {
      const data = await authService.otpLoginVerify({ email, otp });

      // lưu user/token
      const displayName = data?.user?.displayName || data?.user?.name;
      const userId = data?.user?.id ?? data?.user?.userId ?? data?.user?.user_id ?? null;
      const name = saveUserForHeader(email, displayName, userId);

      onSuccess(name);
    } catch (e: any) {
      setErr(e?.message || "OTP không đúng hoặc đã hết hạn");
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    if (step === "email") await sendOtpRegister();
    else await verifyOtpRegister();
  };

  const resendOTP = async () => {
    if (resendIn > 0 || loading) return;
    await sendOtpRegister();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/35"
        type="button"
      />

      <div className="absolute inset-0 flex items-end sm:items-center justify-center p-3">
        <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white shadow-xl ring-1 ring-black/10 overflow-hidden">
          <div className="p-5 sm:p-6 border-b bg-slate-50 flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-slate-900">
                Tạo tài khoản
              </div>
              <div className="text-sm text-slate-600">
                Chỉ cần email — xác thực bằng OTP.
              </div>
            </div>

            <button
              onClick={onClose}
              className="h-9 w-9 rounded-lg hover:bg-slate-100 grid place-items-center"
              aria-label="Đóng"
              type="button"
            >
              ✕
            </button>
          </div>

          <div className="p-5 sm:p-6">
            {err && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {err}
              </div>
            )}

            <div className="flex gap-3">
              <SocialBtn onClick={() => alert("Google register (demo)")}>
                <svg viewBox="0 0 24 24" className="h-5 w-5">
                  <path
                    fill="#EA4335"
                    d="M12 10.2v3.8h5.4c-.24 1.4-1.64 4-5.4 4a6.3 6.3 0 110-12.6c1.8 0 3 .7 3.7 1.3l2.5-2.4C16.8 3.3 14.6 2.5 12 2.5a9.5 9.5 0 100 19 9 9 0 009-9c0-.6-.1-1-.2-1.6H12z"
                  />
                </svg>
                Google
              </SocialBtn>

              <SocialBtn onClick={() => alert("Apple register (demo)")}>
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-black">
                  <path d="M16.365 1.43c0 1.14-.456 2.197-1.293 3.01-.833.81-2.01 1.39-3.22 1.31-.14-1.09.39-2.26 1.22-3.08.83-.82 2.29-1.41 3.29-1.24zM21 17.08c-.39.9-.86 1.78-1.43 2.61-.77 1.1-1.4 1.86-2.26 1.86-.8 0-1.34-.53-2.33-.53-.99 0-1.59.52-2.38.52-.96 0-1.68-.86-2.44-1.94C8 18.24 6.9 15.71 6.9 13.36c0-2.45 1.43-3.74 2.84-3.74 1.01 0 1.74.6 2.31.6.55 0 1.52-.62 2.64-.62.45 0 1.98.05 2.87 1.5-.08.05-1.74 1.02-1.72 3.05.02 2.44 2.13 3.25 2.17 3.27z" />
                </svg>
                Apple
              </SocialBtn>

              <SocialBtn onClick={() => alert("Facebook register (demo)")}>
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-[#1877F2]">
                  <path d="M22 12.07C22 6.52 17.52 2 12 2S2 6.52 2 12.07c0 5.02 3.66 9.18 8.44 9.93v-7.02H7.9v-2.9h2.54V9.41c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.62.77-1.62 1.55v1.86h2.76l-.44 2.9h-2.32V22c4.78-.75 8.44-4.91 8.44-9.93z" />
                </svg>
                Facebook
              </SocialBtn>
            </div>

            <div className="my-5 flex items-center gap-3 text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              hoặc
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <form onSubmit={submit} className="space-y-4">
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
                    {loading ? "Đang xác thực..." : "Đăng ký"}
                  </button>
                </>
              )}
            </form>

            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full h-11 rounded-lg border border-slate-200 text-slate-800 hover:bg-slate-50"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
