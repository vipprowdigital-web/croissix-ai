// mobile_app\app\(auth)\verify-otp\page.tsx

"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useVerifyOtp, useForgotPassword } from "@/features/auth/hook/useAuth";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

/* ─── Spinner ────────────────────────────────────────────── */
function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="white"
        strokeWidth="2.5"
        strokeOpacity="0.25"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ─── OTP digit input ────────────────────────────────────── */
function OtpInput({
  digits,
  onChange,
  isDark,
}: {
  digits: string[];
  onChange: (v: string[]) => void;
  isDark: boolean;
}) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    onChange(next);
    if (digit && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((d, i) => (next[i] = d));
    onChange(next);
    inputsRef.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  return (
    <div className="flex justify-between gap-2">
      {Array.from({ length: OTP_LENGTH }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={`
            w-full h-[52px] text-center text-lg font-bold rounded-[13px] border outline-none
            transition-all duration-200
            ${
              isDark
                ? "bg-[#182236] border-white/[0.07] text-white focus:border-blue-500/60 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
                : "bg-slate-50/80 border-black/[0.08] text-slate-900 focus:border-blue-500/50 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
            }
          `}
        />
      ))}
    </div>
  );
}

/* ─── Inner form — uses useSearchParams ──────────────────── */
function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const email = searchParams.get("email") || "";
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const verifyOtpMutation = useVerifyOtp();
  const forgotPasswordMutation = useForgotPassword();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!email) router.replace("/forgot-password");
  }, [email, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const isDark = mounted && resolvedTheme === "dark";
  const otp = digits.join("");

  const handleSubmit = () => {
    setError("");
    if (otp.length !== OTP_LENGTH) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    verifyOtpMutation.mutate(
      { email, otp },
      {
        onSuccess: (data) => {
          if (data?.resetToken) {
            sessionStorage.setItem("resetToken", data.resetToken);
          }
          router.push("/reset-password");
        },
        onError: (err: any) => {
          setError(err?.response?.data?.message || "Invalid or expired OTP.");
        },
      },
    );
  };

  const handleResend = () => {
    if (cooldown > 0 || !email) return;
    setError("");
    forgotPasswordMutation.mutate(
      { email },
      {
        onSuccess: () => setCooldown(RESEND_COOLDOWN),
        onError: (err: any) => {
          setError(err?.response?.data?.message || "Failed to resend code.");
        },
      },
    );
  };

  if (!email) return null;

  return (
    <div
      className={`
        flex-1 flex flex-col items-center justify-center
        min-h-screen px-5 py-10 transition-colors duration-300
        ${isDark ? "bg-[#0d1421]" : "bg-[#eef2fb]"}
      `}
    >
      <div className="w-full max-w-[420px]">
        {/* heading */}
        <div className="mb-6 text-center">
          <h1
            className={`text-xl font-black leading-tight mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
            style={{
              letterSpacing: "-0.04em",
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
            }}
          >
            Enter verification code
          </h1>
          <p
            className={`text-sm ${isDark ? "text-slate-500" : "text-slate-600"}`}
          >
            We sent a 6-digit code to{" "}
            <span
              className={`font-semibold ${isDark ? "text-slate-300" : "text-slate-800"}`}
            >
              {email}
            </span>
          </p>
        </div>

        {/* form card */}
        <div
          className={`
            rounded-[22px] p-5 md:p-7 flex flex-col gap-4
            ${
              isDark
                ? "bg-[#131c2d] border border-white/[0.06] shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
                : "bg-white border border-black/[0.05] shadow-[0_8px_32px_rgba(37,99,235,0.08)]"
            }
          `}
        >
          <OtpInput digits={digits} onChange={setDigits} isDark={isDark} />

          {error && (
            <p className="text-[12px] font-medium text-red-400 -mt-1">
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={verifyOtpMutation.isPending}
            className={`
              w-full h-[48px] rounded-[13px] flex items-center justify-center gap-2
              text-[14px] font-bold text-white transition-all duration-150
              active:scale-[0.97] disabled:opacity-60
              ${verifyOtpMutation.isPending ? "cursor-wait" : "cursor-pointer"}
            `}
            style={{
              letterSpacing: "-0.01em",
              background: "linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%)",
              boxShadow: "0 4px 18px rgba(37,99,235,0.4)",
            }}
          >
            {verifyOtpMutation.isPending ? <Spinner /> : "Verify code"}
          </button>

          <button
            onClick={handleResend}
            disabled={cooldown > 0 || forgotPasswordMutation.isPending}
            className={`
              text-[12px] font-semibold transition-colors disabled:cursor-not-allowed
              ${isDark ? "text-blue-400 hover:text-blue-300 disabled:text-slate-600" : "text-blue-600 hover:text-blue-500 disabled:text-slate-400"}
            `}
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
        </div>

        <p
          className={`text-center text-[13px] mt-6 ${isDark ? "text-slate-500" : "text-slate-600"}`}
        >
          <Link
            href="/forgot-password"
            className="font-semibold text-blue-500 hover:text-blue-400 transition-colors"
          >
            Use a different email
          </Link>
        </p>
      </div>
    </div>
  );
}

/* ─── Page export — wraps VerifyOtpForm in Suspense ──────── */
export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <VerifyOtpForm />
    </Suspense>
  );
}
