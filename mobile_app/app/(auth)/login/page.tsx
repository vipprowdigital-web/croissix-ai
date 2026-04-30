// mobile_app\app\login\page.tsx

// mobile_app\app\login\page.tsx

"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { KeyRound, Mail, Eye, EyeOff, Sun, Moon } from "lucide-react";
import { useLogin } from "@/features/auth/hook/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import GuestGuard from "@/components/auth/GuestGuard";

/* ─── Google G ───────────────────────────────────────────── */
function GoogleG() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M21.805 10.023H12v3.977h5.617c-.245 1.36-1.017 2.514-2.164 3.29v2.73h3.503C20.938 18.202 22 15.298 22 12c0-.66-.069-1.305-.195-1.977z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.97 0 5.46-.984 7.28-2.668l-3.503-2.73c-.984.66-2.245 1.05-3.777 1.05-2.9 0-5.36-1.958-6.24-4.59H2.15v2.817C3.96 19.983 7.7 22 12 22z"
        fill="#34A853"
      />
      <path
        d="M5.76 13.062A6.05 6.05 0 0 1 5.44 12c0-.37.063-.73.163-1.062V8.121H2.15A9.987 9.987 0 0 0 2 12c0 1.61.387 3.13 1.07 4.477l3.69-2.817-.001-.598z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.958c1.637 0 3.105.563 4.26 1.667l3.195-3.195C17.455 2.693 14.965 1.6 12 1.6 7.7 1.6 3.96 3.617 2.15 7.12l3.61 2.817C6.64 7.305 9.1 5.958 12 5.958z"
        fill="#EA4335"
      />
    </svg>
  );
}

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
  rightElement?: React.ReactNode;
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
  rightElement,
  autoComplete,
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label
        className={`
        text-[10px] font-semibold tracking-[0.08em] uppercase
        ${isDark ? "text-slate-500" : "text-slate-600"}
      `}
        style={{
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
        }}
      >
        {label}
      </label>

      <div
        className={`
        relative flex items-center h-[46px] rounded-[13px]
        border transition-all duration-200
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
        {/* left icon */}
        <span
          className={`
          absolute left-3.5 flex items-center pointer-events-none
          transition-colors duration-200
          ${
            focused
              ? isDark
                ? "text-blue-400"
                : "text-blue-500"
              : isDark
                ? "text-slate-600"
                : "text-slate-600"
          }
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
            w-full h-full pl-10 pr-${rightElement ? "10" : "4"}
            bg-transparent outline-none
            text-[14px] font-medium
            placeholder:font-normal
            ${
              isDark
                ? "text-white placeholder:text-slate-600"
                : "text-slate-900 placeholder:text-slate-600"
            }
          `}
          style={{
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
          }}
        />

        {/* right element */}
        {rightElement && (
          <span className="absolute right-1 flex items-center">
            {rightElement}
          </span>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const loginMutation = useLogin();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  const searchParams = useSearchParams();

  console.log("login page.....");

  const handleSubmit = () => {
    console.log("Inside handle submit");
    setError("");

    if (!email || !password) {
      console.log("email: ", email, " password: ", password);

      setError("Please fill in all fields.");
      return;
    }

    loginMutation.mutate(
      { email, password },
      {
        onSuccess: () => {
          setTimeout(() => {
            // router.replace("/");
            // ✅ Carry callback back after successful login
            const callback = searchParams.get("callback");
            if (callback) {
              router.replace(`/?callback=${encodeURIComponent(callback)}`);
            } else {
              router.replace("/");
            }
          }, 50);
        },
        onError: () => {
          setError("Invalid email or password");
        },
      },
    );
  };

  return (
    <GuestGuard>
      <div
        className={`
          flex-1 flex flex-col items-center justify-center
          min-h-screen px-5 py-10
          transition-colors duration-300
          ${isDark ? "bg-[#0d1421]" : "bg-[#eef2fb]"}
        `}
      >
        {/* ── content — constrained max-width on desktop ── */}
        <div className="w-full max-w-[420px]">
          {/* heading */}
          <div className="mb-6 text-center">
            <h1
              className={`
                text-xl font-black leading-tight mb-1
                ${isDark ? "text-white" : "text-slate-900"}
              `}
              style={{
                letterSpacing: "-0.04em",
                fontFamily:
                  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
              }}
            >
              Welcome back 👋
            </h1>
            <p
              className={`text-sm ${isDark ? "text-slate-500" : "text-slate-600"}`}
            >
              Sign in to continue
            </p>
          </div>

          {/* ── form card ── */}
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
            {/* email */}
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

            {/* password */}
            <InputField
              label="Password"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              isDark={isDark}
              autoComplete="current-password"
              leftIcon={<KeyRound size={15} strokeWidth={1.8} />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className={`
                    w-8 h-8 flex items-center justify-center rounded-lg
                    transition-all duration-150 active:scale-90
                    ${
                      isDark
                        ? "text-slate-500 hover:text-slate-300"
                        : "text-slate-600 hover:text-slate-600"
                    }
                  `}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? (
                    <EyeOff size={15} strokeWidth={1.8} />
                  ) : (
                    <Eye size={15} strokeWidth={1.8} />
                  )}
                </button>
              }
            />

            {/* forgot */}
            <div className="flex justify-end -mt-2">
              <Link
                href="/forgot-password"
                className="text-[12px] font-semibold text-blue-500 hover:text-blue-400 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* error */}
            {error && (
              <p className="text-[12px] font-medium text-red-400 -mt-1">
                {error}
              </p>
            )}

            {/* submit */}
            <button
              onClick={handleSubmit}
              disabled={loginMutation.isPending}
              className={`
                w-full h-[48px] rounded-[13px]
                flex items-center justify-center gap-2
                text-[14px] font-bold text-white
                transition-all duration-150
                active:scale-[0.97] disabled:opacity-60
                ${loading ? "cursor-wait" : "cursor-pointer"}
              `}
              style={{
                letterSpacing: "-0.01em",
                background: "linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%)",
                boxShadow: "0 4px 18px rgba(37,99,235,0.4)",
              }}
            >
              {loginMutation.isPending ? <Spinner /> : "Sign In"}
            </button>
          </div>

          {/* divider */}
          <div className="flex items-center gap-3 my-5">
            <div
              className={`flex-1 h-px ${isDark ? "bg-white/[0.07]" : "bg-slate-200"}`}
            />
            <span
              className={`text-[11px] font-semibold ${isDark ? "text-slate-600" : "text-slate-600"}`}
            >
              or
            </span>
            <div
              className={`flex-1 h-px ${isDark ? "bg-white/[0.07]" : "bg-slate-200"}`}
            />
          </div>

          {/* Google */}
          <button
            className={`
              w-full h-[48px] rounded-[13px]
              flex items-center justify-center gap-2.5
              text-[14px] font-semibold border
              transition-all duration-150 active:scale-[0.97]
              ${
                isDark
                  ? "bg-[#131c2d] border-white/[0.08] text-white hover:bg-[#182236]"
                  : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
              }
            `}
            style={{
              letterSpacing: "-0.01em",
              boxShadow: isDark
                ? "0 2px 12px rgba(0,0,0,0.3)"
                : "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <GoogleG />
            Continue with Google
          </button>

          {/* sign up */}
          <p
            className={`text-center text-[13px] mt-6 ${isDark ? "text-slate-500" : "text-slate-600"}`}
          >
            Don't have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-blue-500 hover:text-blue-400 transition-colors"
            >
              Sign up
            </Link>
          </p>

          {/* terms */}
          <p
            className={`text-center text-[11px] mt-4 leading-relaxed ${isDark ? "text-slate-700" : "text-slate-500"}`}
          >
            By signing in you agree to our{" "}
            <Link
              href="/terms"
              className={`underline ${isDark ? "text-slate-500" : "text-slate-600"}`}
            >
              Terms
            </Link>
            {" & "}
            <Link
              href="/privacy"
              className={`underline ${isDark ? "text-slate-500" : "text-slate-600"}`}
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </GuestGuard>
  );
}
