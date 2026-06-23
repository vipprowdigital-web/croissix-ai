"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, KeyRound, Eye, EyeOff, ShieldCheck } from "lucide-react";
import api from "@/lib/api";
import { saveAuth, getAdminToken } from "@/lib/auth";

function Spinner() {
  return (
    <svg className="animate-spin" width="17" height="17" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2.5" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export default function LoginPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
    if (getAdminToken()) router.replace("/dashboard");
  }, [router]);

  const isDark = mounted && resolvedTheme === "dark";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      const { data } = await api.post("/admin/login", { email, password });
      saveAuth(data.token, data.admin);
      router.replace("/dashboard");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-10 transition-colors duration-300"
      style={{ background: isDark ? "#0d1421" : "#eef2fb" }}
    >
      <div className="w-full max-w-[420px]">
        {/* logo / badge */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%)", boxShadow: "0 8px 24px rgba(37,99,235,0.4)" }}
          >
            <ShieldCheck size={28} color="white" strokeWidth={1.8} />
          </div>
          <h1
            className="text-2xl font-black mb-1"
            style={{
              color: isDark ? "#fff" : "#0f172a",
              letterSpacing: "-0.04em",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
            }}
          >
            Croissix Console
          </h1>
          <p className="text-sm" style={{ color: isDark ? "#64748b" : "#64748b" }}>
            Sign in to your admin account
          </p>
        </div>

        {/* card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-[22px] p-6 flex flex-col gap-4"
          style={{
            background: isDark ? "#131c2d" : "#fff",
            border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.05)",
            boxShadow: isDark ? "0 20px 60px rgba(0,0,0,0.5)" : "0 8px 32px rgba(37,99,235,0.08)",
          }}
        >
          {/* email */}
          <Field label="Email" isDark={isDark}>
            <FieldInput
              type="email" value={email} onChange={setEmail}
              placeholder="admin@example.com" autoComplete="email" isDark={isDark}
              leftIcon={<Mail size={15} strokeWidth={1.8} />}
            />
          </Field>

          {/* password */}
          <Field label="Password" isDark={isDark}>
            <FieldInput
              type={showPass ? "text" : "password"} value={password} onChange={setPassword}
              placeholder="••••••••" autoComplete="current-password" isDark={isDark}
              leftIcon={<KeyRound size={15} strokeWidth={1.8} />}
              rightEl={
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-90"
                  style={{ color: isDark ? "#64748b" : "#94a3b8" }}
                >
                  {showPass ? <EyeOff size={15} strokeWidth={1.8} /> : <Eye size={15} strokeWidth={1.8} />}
                </button>
              }
            />
          </Field>

          {error && <p className="text-[12px] font-medium text-red-400">{error}</p>}

          <button
            type="submit" disabled={loading}
            className="w-full h-[48px] rounded-[13px] flex items-center justify-center gap-2 text-[14px] font-bold text-white transition-all duration-150 active:scale-[0.97] disabled:opacity-60 cursor-pointer mt-1"
            style={{ background: "linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%)", boxShadow: "0 4px 18px rgba(37,99,235,0.4)" }}
          >
            {loading ? <Spinner /> : "Sign In"}
          </button>
        </form>

        <p className="text-center text-[13px] mt-6" style={{ color: isDark ? "#64748b" : "#64748b" }}>
          Don&apos;t have an admin account?{" "}
          <Link href="/register" className="font-semibold text-blue-500 hover:text-blue-400 transition-colors">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

/* ── tiny sub-components ── */
function Field({ label, isDark, children }: { label: string; isDark: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-[10px] font-semibold tracking-[0.08em] uppercase"
        style={{ color: isDark ? "#64748b" : "#64748b", fontFamily: "-apple-system, sans-serif" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function FieldInput({
  type, value, onChange, placeholder, autoComplete, isDark, leftIcon, rightEl,
}: {
  type: string; value: string; onChange: (v: string) => void;
  placeholder: string; autoComplete?: string; isDark: boolean;
  leftIcon: React.ReactNode; rightEl?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className="relative flex items-center h-[46px] rounded-[13px] border transition-all duration-200"
      style={{
        background: isDark ? "#182236" : "rgba(248,250,252,0.8)",
        borderColor: focused
          ? isDark ? "rgba(59,130,246,0.6)" : "rgba(37,99,235,0.5)"
          : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
        boxShadow: focused
          ? isDark ? "0 0 0 3px rgba(59,130,246,0.15)" : "0 0 0 3px rgba(37,99,235,0.1)"
          : "none",
      }}
    >
      <span className="absolute left-3.5 pointer-events-none" style={{ color: focused ? (isDark ? "#60a5fa" : "#2563eb") : "#94a3b8" }}>
        {leftIcon}
      </span>
      <input
        type={type} value={value} placeholder={placeholder} autoComplete={autoComplete}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className="w-full h-full pl-10 pr-10 bg-transparent outline-none text-[14px] font-medium placeholder:font-normal"
        style={{
          color: isDark ? "#fff" : "#0f172a",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
        }}
      />
      {rightEl && <span className="absolute right-1">{rightEl}</span>}
    </div>
  );
}
