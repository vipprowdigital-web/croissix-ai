// mobile_app\app\(auth)\forgot-password\page.tsx

"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForgotPassword } from "@/features/auth/hook/useAuth";

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

/* ─── Input field ────────────────────────────────────────── */
interface InputFieldProps {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  isDark: boolean;
  leftIcon: React.ReactNode;
  autoComplete?: string;
}

function InputField({
  label,
  type,
  value,
  onChange,
  placeholder,
  isDark,
  leftIcon,
  autoComplete,
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label
        className={`text-[10px] font-semibold tracking-[0.08em] uppercase ${isDark ? "text-slate-500" : "text-slate-600"}`}
        style={{
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
        }}
      >
        {label}
      </label>

      <div
        className={`
          relative flex items-center h-[46px] rounded-[13px] border transition-all duration-200
          ${
            focused
              ? isDark
                ? "border-blue-500/60 shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
                : "border-blue-500/50 shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
              : isDark
                ? "border-white/[0.07]"
                : "border-black/[0.08]"
          }
          ${isDark ? "bg-[#182236]" : "bg-slate-50/80"}
        `}
      >
        <span
          className={`
            absolute left-3.5 flex items-center pointer-events-none transition-colors duration-200
            ${focused ? (isDark ? "text-blue-400" : "text-blue-500") : isDark ? "text-slate-600" : "text-slate-600"}
          `}
        >
          {leftIcon}
        </span>

        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`
            w-full h-full pl-10 pr-4
            bg-transparent outline-none text-[14px] font-medium placeholder:font-normal
            ${isDark ? "text-white placeholder:text-slate-600" : "text-slate-900 placeholder:text-slate-600"}
          `}
          style={{
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
          }}
        />
      </div>
    </div>
  );
}

/* ─── Form ───────────────────────────────────────────────── */
function ForgotPasswordForm() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const forgotPasswordMutation = useForgotPassword();

  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  const handleSubmit = () => {
    setError("");
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    forgotPasswordMutation.mutate(
      { email: trimmedEmail },
      {
        onSuccess: () => {
          router.push(`/verify-otp?email=${encodeURIComponent(trimmedEmail)}`);
        },
        onError: (err: any) => {
          setError(
            err?.response?.data?.message ||
              "Something went wrong. Please try again.",
          );
        },
      },
    );
  };

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
            Forgot password?
          </h1>
          <p
            className={`text-sm ${isDark ? "text-slate-500" : "text-slate-600"}`}
          >
            Enter your email and we'll send you a verification code.
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
          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            isDark={isDark}
            autoComplete="email"
            leftIcon={<Mail size={15} strokeWidth={1.8} />}
          />

          {error && (
            <p className="text-[12px] font-medium text-red-400 -mt-1">
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={forgotPasswordMutation.isPending}
            className={`
              w-full h-[48px] rounded-[13px] flex items-center justify-center gap-2
              text-[14px] font-bold text-white transition-all duration-150
              active:scale-[0.97] disabled:opacity-60
              ${forgotPasswordMutation.isPending ? "cursor-wait" : "cursor-pointer"}
            `}
            style={{
              letterSpacing: "-0.01em",
              background: "linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%)",
              boxShadow: "0 4px 18px rgba(37,99,235,0.4)",
            }}
          >
            {forgotPasswordMutation.isPending ? <Spinner /> : "Send code"}
          </button>
        </div>

        <p
          className={`flex items-center justify-center gap-1.5 text-center text-[13px] mt-6 ${isDark ? "text-slate-500" : "text-slate-600"}`}
        >
          <Link
            href="/login"
            className="flex items-center gap-1.5 font-semibold text-blue-500 hover:text-blue-400 transition-colors"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}

/* ─── Page export ────────────────────────────────────────── */
export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
