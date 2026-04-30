// mobile_app\app\register\page.tsx

// mobile_app\app\register\page.tsx

"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { KeyRound, Mail, Eye, EyeOff, User, Phone } from "lucide-react";
import { useRegister } from "@/features/auth/hook/useAuth";
import { useRouter } from "next/navigation";

/* ─── Google G ───────────────────────────────────────────── */
function GoogleG() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
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

/* ─── Password strength ──────────────────────────────────── */
function getStrength(pw: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: "", color: "bg-transparent" },
    { label: "Weak", color: "bg-red-500" },
    { label: "Fair", color: "bg-orange-400" },
    { label: "Good", color: "bg-yellow-400" },
    { label: "Strong", color: "bg-green-500" },
  ];
  return { score, ...map[score] };
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
  error?: string;
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
  error,
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
          error
            ? "border-red-500/60 shadow-[0_0_0_3px_rgba(239,68,68,0.12)]"
            : focused
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
          absolute left-3.5 flex items-center pointer-events-none
          transition-colors duration-200
          ${
            error
              ? "text-red-400"
              : focused
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
            w-full h-full pl-10 bg-transparent outline-none
            text-[14px] font-medium placeholder:font-normal
            ${rightElement ? "pr-10" : "pr-4"}
            ${
              isDark
                ? "text-white placeholder:text-slate-600"
                : "text-slate-900 placeholder:text-slate-400"
            }
          `}
          style={{
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
          }}
        />

        {rightElement && (
          <span className="absolute right-1 flex items-center">
            {rightElement}
          </span>
        )}
      </div>

      {error && (
        <p className="text-[11px] font-medium text-red-400 ml-0.5">{error}</p>
      )}
    </div>
  );
}

/* ─── Validation ─────────────────────────────────────────── */
function validate(fields: {
  name: string;
  phone: string;
  email: string;
  password: string;
  confirm: string;
}) {
  const errs: Record<string, string> = {};
  if (!fields.name.trim()) errs.name = "Name is required.";
  if (!/^\+?[\d\s\-]{8,}$/.test(fields.phone))
    errs.phone = "Enter a valid phone number.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))
    errs.email = "Enter a valid email.";
  if (fields.password.length < 8) errs.password = "Minimum 8 characters.";
  if (fields.confirm !== fields.password)
    errs.confirm = "Passwords don't match.";
  return errs;
}

/* ═══════════════════════════════════════════════════════════ */
export default function RegisterPage() {
  const router = useRouter();
  const registerMutation = useRegister();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  const strength = getStrength(password);

  const eyeBtn = (show: boolean, toggle: () => void, label: string) => (
    <button
      type="button"
      onClick={toggle}
      className={`
        w-8 h-8 flex items-center justify-center rounded-lg
        transition-all duration-150 active:scale-90
        ${isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}
      `}
      aria-label={label}
    >
      {show ? (
        <EyeOff size={15} strokeWidth={1.8} />
      ) : (
        <Eye size={15} strokeWidth={1.8} />
      )}
    </button>
  );

  const handleSubmit = () => {
    const errs = validate({ name, phone, email, password, confirm });
    setErrors(errs);

    if (Object.keys(errs).length) return;

    registerMutation.mutate(
      { name, email, phone, password },
      {
        onSuccess: () => {
          alert("Account created successfully");
          router.push("/login");
        },
        onError: (err: any) => {
          console.error(err);
        },
      },
    );
  };

  return (
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
            className={`text-xl font-bold leading-tight mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Create account
          </h1>
          <p
            className={`text-sm ${isDark ? "text-slate-500" : "text-slate-500"}`}
          >
            Fill in the details below to get started
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
          {/* name + phone — side by side on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Full Name"
              type="text"
              value={name}
              onChange={setName}
              placeholder="Alex Johnson"
              isDark={isDark}
              autoComplete="name"
              leftIcon={<User size={15} strokeWidth={1.8} />}
              error={errors.name}
            />
            <InputField
              label="Phone Number"
              type="tel"
              value={phone}
              onChange={setPhone}
              placeholder="+91 98765 43210"
              isDark={isDark}
              autoComplete="tel"
              leftIcon={<Phone size={15} strokeWidth={1.8} />}
              error={errors.phone}
            />
          </div>

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
            error={errors.email}
          />

          {/* password */}
          <div className="flex flex-col gap-1.5">
            <InputField
              label="Password"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={setPassword}
              placeholder="Min. 8 characters"
              isDark={isDark}
              autoComplete="new-password"
              leftIcon={<KeyRound size={15} strokeWidth={1.8} />}
              rightElement={eyeBtn(
                showPass,
                () => setShowPass((v) => !v),
                showPass ? "Hide" : "Show",
              )}
              error={errors.password}
            />

            {/* strength bar */}
            {password.length > 0 && (
              <div className="flex items-center gap-2 px-0.5">
                <div className="flex gap-1 flex-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`
                        h-1 flex-1 rounded-full transition-all duration-300
                        ${i <= strength.score ? strength.color : isDark ? "bg-white/10" : "bg-slate-200"}
                      `}
                    />
                  ))}
                </div>
                {strength.label && (
                  <span
                    className={`text-[10px] font-semibold shrink-0 ${
                      strength.score === 1
                        ? "text-red-400"
                        : strength.score === 2
                          ? "text-orange-400"
                          : strength.score === 3
                            ? "text-yellow-400"
                            : "text-green-500"
                    }`}
                  >
                    {strength.label}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* confirm password */}
          <InputField
            label="Confirm Password"
            type={showConf ? "text" : "password"}
            value={confirm}
            onChange={setConfirm}
            placeholder="Repeat your password"
            isDark={isDark}
            autoComplete="new-password"
            leftIcon={<KeyRound size={15} strokeWidth={1.8} />}
            rightElement={eyeBtn(
              showConf,
              () => setShowConf((v) => !v),
              showConf ? "Hide" : "Show",
            )}
            error={errors.confirm}
          />

          {/* submit */}
          <button
            onClick={handleSubmit}
            disabled={registerMutation.isPending}
            className={`
              w-full h-[48px] rounded-[13px] mt-1
              flex items-center justify-center gap-2
              text-[14px] font-bold text-white
              transition-all duration-150
              active:scale-[0.97] disabled:opacity-60
              ${registerMutation.isPending ? "cursor-wait" : "cursor-pointer"}
            `}
            style={{
              letterSpacing: "-0.01em",
              background: "linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%)",
              boxShadow: "0 4px 18px rgba(37,99,235,0.4)",
            }}
          >
            {registerMutation.isPending ? <Spinner /> : "Create Account"}
          </button>
        </div>

        {/* divider */}
        <div className="flex items-center gap-3 my-5">
          <div
            className={`flex-1 h-px ${isDark ? "bg-white/[0.07]" : "bg-slate-200"}`}
          />
          <span
            className={`text-[11px] font-semibold ${isDark ? "text-slate-600" : "text-slate-400"}`}
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
          Sign up with Google
        </button>

        {/* sign in link */}
        <p
          className={`text-center text-[13px] mt-6 ${isDark ? "text-slate-500" : "text-slate-500"}`}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-blue-500 hover:text-blue-400 transition-colors"
          >
            Sign in
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
  );
}
