// mobile_app\app\(main)\subscription\page.tsx

"use client";

// mobile_app/app/(main)/subscription/page.tsx
// Fully wired to useSubscription + useSubscriptionActions hooks

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
  Check,
  Zap,
  Shield,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Bell,
  Lock,
  AlertCircle,
  ArrowLeft,
  Star,
} from "lucide-react";
import { useUser } from "@/features/user/hook/useUser";
import { useSubscriptionActions } from "@/features/subscription/hook/useSubscriptionActions";
import { useSubscription } from "@/features/subscription/hook/useSubscription";

/* ══════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════ */
type Screen = "plans" | "processing" | "success" | "failed";

/* ══════════════════════════════════════════════════
   PLAN CONFIG — uses NEXT_PUBLIC_ env var
══════════════════════════════════════════════════ */
const PLAN = {
  id: "starter",
  name: "Starter",
  razorpayPlanId: process.env.NEXT_PUBLIC_RAZORPAY_PLAN_ID ?? "",
  priceMonthly: 49900, // paise
  features: [
    { text: "1 Google Business Profile", highlight: true },
    { text: "Analytics dashboard", highlight: true },
    { text: "Review monitoring", highlight: false },
    { text: "5 posts / month", highlight: false },
    { text: "AI insights", highlight: true },
    { text: "Email support", highlight: false },
  ],
  unlocked: [
    { label: "Analytics", icon: "📊", color: "#3b82f6" },
    { label: "AI Insights", icon: "✨", color: "#2563eb" },
    { label: "Reviews", icon: "⭐", color: "#f59e0b" },
    { label: "Competitor", icon: "📈", color: "#22c55e" },
  ],
  testimonials: [
    {
      name: "Rahul M.",
      biz: "Restaurant, Mumbai",
      text: "Reviews went up 3× in the first month!",
      rating: 5,
    },
    {
      name: "Priya K.",
      biz: "Salon, Bangalore",
      text: "My GBP ranking jumped to top 3 locally.",
      rating: 5,
    },
    {
      name: "Amit S.",
      biz: "Clinic, Delhi",
      text: "AI insights saved me hours every week.",
      rating: 5,
    },
  ],
};

/* ══════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════ */
const fmt = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

/** Inject Razorpay checkout.js once */
function loadRzpScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("rzp-script")) return resolve(true);
    const s = document.createElement("script");
    s.id = "rzp-script";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

/* ══════════════════════════════════════════════════
   STEP DOTS
══════════════════════════════════════════════════ */
function StepDots({ step, dark }: { step: number; dark: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-1">
          <motion.div
            animate={{
              width: i === step ? 22 : 8,
              background:
                i <= step
                  ? "#3b82f6"
                  : dark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.1)",
            }}
            transition={{ duration: 0.28, ease: [0.34, 1.2, 0.64, 1] }}
            style={{ height: 8, borderRadius: 99 }}
          />
          {i < 2 && (
            <div
              style={{
                width: 8,
                height: 2,
                borderRadius: 99,
                background:
                  i < step
                    ? "#3b82f6"
                    : dark
                      ? "rgba(255,255,255,0.07)"
                      : "rgba(0,0,0,0.07)",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PLAN SCREEN
══════════════════════════════════════════════════ */
function PlanScreen({
  dark,
  onStart,
  alreadyActive,
  loading,
}: {
  dark: boolean;
  onStart: () => void;
  alreadyActive: boolean;
  loading: boolean;
}) {
  const textP = dark ? "#fff" : "#0f172a";
  const textS = dark ? "#64748b" : "#64748b";
  const cardBg = dark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.9)";
  const cardBd = dark ? "rgba(255,255,255,0.05)" : "rgba(203,213,225,0.5)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      {/* Desktop 2-col / mobile single */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start">
        {/* ── LEFT ── */}
        <div className="flex flex-col gap-5">
          {/* Hero */}
          <div className="pt-2 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.05,
                duration: 0.4,
                ease: [0.34, 1.3, 0.64, 1],
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3"
              style={{
                background: dark
                  ? "rgba(59,130,246,0.12)"
                  : "rgba(219,234,254,0.8)",
                border: `1px solid ${dark ? "rgba(59,130,246,0.2)" : "rgba(147,197,253,0.5)"}`,
              }}
            >
              <Zap size={11} style={{ color: "#3b82f6" }} />
              <span
                className="text-[10.5px] font-extrabold uppercase tracking-[0.06em]"
                style={{ color: "#3b82f6" }}
              >
                7-day free trial
              </span>
            </motion.div>
            <h1
              className="text-[26px] md:text-[30px] lg:text-[34px] font-black leading-[1.12] mb-2"
              style={{ letterSpacing: "-0.045em", color: textP }}
            >
              Grow your Google
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg,#1d4ed8,#3b82f6,#60a5fa)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Business ranking
              </span>
            </h1>
            <p
              className="text-[13px] md:text-[14px] font-medium"
              style={{ color: textS }}
            >
              AI-powered GBP analytics — one simple plan
            </p>
          </div>

          {/* Active banner */}
          {alreadyActive && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-3 flex items-center gap-2.5"
              style={{
                background: dark
                  ? "rgba(34,197,94,0.08)"
                  : "rgba(220,252,231,0.7)",
                border: `1px solid ${dark ? "rgba(34,197,94,0.2)" : "rgba(134,239,172,0.5)"}`,
              }}
            >
              <CheckCircle2
                size={14}
                style={{ color: "#22c55e", flexShrink: 0 }}
              />
              <p
                className="text-[11.5px] font-bold m-0"
                style={{ color: dark ? "#4ade80" : "#15803d" }}
              >
                You already have an active Starter subscription
              </p>
            </motion.div>
          )}

          {/* Plan card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl overflow-hidden"
            style={{
              border: `2px solid ${dark ? "rgba(59,130,246,0.3)" : "rgba(59,130,246,0.25)"}`,
              background: dark
                ? "rgba(37,99,235,0.06)"
                : "rgba(239,246,255,0.7)",
              boxShadow: dark
                ? "0 0 0 4px rgba(59,130,246,0.08),0 16px 48px rgba(37,99,235,0.18)"
                : "0 0 0 4px rgba(59,130,246,0.06),0 8px 40px rgba(37,99,235,0.12)",
            }}
          >
            <div
              style={{
                height: 4,
                background: "linear-gradient(90deg,#1d4ed8,#3b82f6,#60a5fa)",
              }}
            />
            <div className="p-4 md:p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-[14px] flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
                      boxShadow: "0 6px 20px rgba(37,99,235,0.35)",
                    }}
                  >
                    <Zap size={20} color="#fff" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[18px] font-black"
                        style={{ letterSpacing: "-0.03em", color: textP }}
                      >
                        {PLAN.name}
                      </span>
                      <span
                        className="text-[9px] font-black px-2 py-0.5 rounded-full text-white uppercase tracking-wide"
                        style={{
                          background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
                        }}
                      >
                        POPULAR
                      </span>
                    </div>
                    <p
                      className="text-[11px] mt-0.5 font-medium"
                      style={{ color: textS }}
                    >
                      1 location · 5 posts/mo · 30-day data
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-start gap-0.5">
                    <span
                      className="text-[12px] font-extrabold mt-1"
                      style={{ color: dark ? "#93c5fd" : "#2563eb" }}
                    >
                      ₹
                    </span>
                    <span
                      className="text-[32px] md:text-[36px] font-black leading-none"
                      style={{ letterSpacing: "-0.05em", color: textP }}
                    >
                      499
                    </span>
                  </div>
                  <p
                    className="text-[10px] font-bold mt-0.5"
                    style={{ color: textS }}
                  >
                    per month
                  </p>
                </div>
              </div>

              <div
                className="h-px mb-4"
                style={{
                  background: dark
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(59,130,246,0.1)",
                }}
              />

              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                {PLAN.features.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.05 }}
                    className="flex items-center gap-2"
                  >
                    <div
                      className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center"
                      style={{
                        background: f.highlight
                          ? "linear-gradient(135deg,#1d4ed8,#3b82f6)"
                          : dark
                            ? "rgba(59,130,246,0.15)"
                            : "rgba(59,130,246,0.1)",
                      }}
                    >
                      <Check
                        size={9}
                        color={f.highlight ? "#fff" : "#3b82f6"}
                        strokeWidth={3}
                      />
                    </div>
                    <span
                      className="text-[11px] leading-snug"
                      style={{
                        fontWeight: f.highlight ? 700 : 500,
                        color: dark
                          ? f.highlight
                            ? "#bfdbfe"
                            : "#94a3b8"
                          : f.highlight
                            ? "#1d4ed8"
                            : "#64748b",
                      }}
                    >
                      {f.text}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="flex flex-col gap-2"
          >
            <div
              className="rounded-2xl p-3 flex items-center gap-2.5"
              style={{
                background: dark
                  ? "rgba(37,99,235,0.07)"
                  : "rgba(219,234,254,0.5)",
                border: `1px solid ${dark ? "rgba(59,130,246,0.12)" : "rgba(147,197,253,0.4)"}`,
              }}
            >
              <Shield size={13} style={{ color: "#3b82f6", flexShrink: 0 }} />
              <p
                className="text-[11px] font-semibold m-0"
                style={{ color: dark ? "#93c5fd" : "#1d4ed8" }}
              >
                <strong>7-day free trial</strong> · Cancel anytime · No setup
                fees
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: "🔒", text: "Secured by Razorpay" },
                { icon: "🔄", text: "Cancel anytime" },
              ].map((t, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: cardBg, border: `1px solid ${cardBd}` }}
                >
                  <span className="text-[13px]">{t.icon}</span>
                  <span
                    className="text-[10.5px] font-semibold"
                    style={{ color: textS }}
                  >
                    {t.text}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── RIGHT (desktop only) ── */}
        <div className="hidden lg:flex flex-col gap-5">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { val: "3×", label: "More reviews", color: "#f59e0b" },
              { val: "47%", label: "SEO boost", color: "#3b82f6" },
              { val: "5h", label: "Saved/week", color: "#22c55e" },
              { val: "500+", label: "Businesses", color: "#8b5cf6" },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.06 }}
                className="rounded-2xl p-4 text-center"
                style={{
                  background: cardBg,
                  border: `1px solid ${cardBd}`,
                  boxShadow: dark ? "none" : "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  className="text-[28px] font-black leading-none mb-1"
                  style={{ color: s.color, letterSpacing: "-0.04em" }}
                >
                  {s.val}
                </div>
                <div
                  className="text-[11px] font-semibold"
                  style={{ color: textS }}
                >
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Testimonials */}
          <p
            className="text-[11px] font-black uppercase tracking-widest"
            style={{ color: textS }}
          >
            What businesses say
          </p>
          {PLAN.testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.08 }}
              className="rounded-2xl p-4"
              style={{
                background: cardBg,
                border: `1px solid ${cardBd}`,
                boxShadow: dark ? "none" : "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white text-[14px] font-bold"
                  style={{
                    background: `hsl(${t.name.charCodeAt(0) * 40},60%,50%)`,
                  }}
                >
                  {t.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    {Array.from({ length: t.rating }, (_, j) => (
                      <Star key={j} size={11} fill="#f59e0b" strokeWidth={0} />
                    ))}
                  </div>
                  <p
                    className="text-[12.5px] leading-relaxed mb-1.5"
                    style={{ color: dark ? "#e2e8f0" : "#1e293b" }}
                  >
                    "{t.text}"
                  </p>
                  <p
                    className="text-[10.5px] font-semibold"
                    style={{ color: textS }}
                  >
                    {t.name} · {t.biz}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Unlock chips */}
          <div className="grid grid-cols-2 gap-2">
            {PLAN.unlocked.map((u, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.93 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="flex items-center gap-2.5 px-3.5 py-3 rounded-2xl"
                style={{
                  background: dark
                    ? "rgba(59,130,246,0.05)"
                    : "rgba(239,246,255,0.8)",
                  border: `1px solid ${dark ? "rgba(59,130,246,0.08)" : "rgba(147,197,253,0.25)"}`,
                }}
              >
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-sm"
                  style={{ background: `${u.color}18` }}
                >
                  {u.icon}
                </div>
                <span
                  className="text-[12px] font-bold"
                  style={{ color: dark ? "#e2e8f0" : "#1e293b" }}
                >
                  {u.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA — always full width, below the grid */}
      <div className="mt-6">
        <div className="max-w-lg mx-auto lg:max-w-none">
          <motion.button
            onClick={onStart}
            whileTap={{ scale: 0.975 }}
            disabled={alreadyActive || loading}
            className="w-full py-4 rounded-[18px] text-white text-[14px] font-black flex items-center justify-center gap-2 relative overflow-hidden"
            style={{
              cursor: alreadyActive || loading ? "not-allowed" : "pointer",
              background: alreadyActive
                ? "rgba(59,130,246,0.4)"
                : "linear-gradient(135deg,#1d4ed8,#2563eb,#3b82f6)",
              boxShadow: alreadyActive
                ? "none"
                : "0 10px 32px rgba(37,99,235,0.38)",
              opacity: alreadyActive ? 0.6 : 1,
              letterSpacing: "-0.01em",
            }}
          >
            {!alreadyActive && (
              <motion.div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)",
                }}
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
              />
            )}
            {loading ? (
              <RefreshCw size={15} className="animate-spin relative" />
            ) : (
              <Zap size={15} className="relative" />
            )}
            <span className="relative">
              {alreadyActive
                ? "Plan Active ✓"
                : loading
                  ? "Loading…"
                  : `Start Free Trial · ${fmt(PLAN.priceMonthly)}/mo`}
            </span>
          </motion.button>
          {!alreadyActive && !loading && (
            <p
              className="text-center text-[10px] mt-1.5 font-medium"
              style={{ color: dark ? "#2d3f58" : "#94a3b8" }}
            >
              Free for 7 days · then {fmt(PLAN.priceMonthly)}/month · cancel
              anytime
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════
   PROCESSING SCREEN
══════════════════════════════════════════════════ */
function ProcessingScreen({ dark }: { dark: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-[50vh] gap-5 text-center"
    >
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="absolute rounded-full border-2 border-blue-500"
          style={{ inset: -18 }}
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full flex items-center justify-center"
          style={{
            width: 52,
            height: 52,
            background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
            boxShadow: "0 8px 28px rgba(37,99,235,0.35)",
          }}
        >
          <RefreshCw size={22} color="#fff" />
        </motion.div>
      </div>
      <div>
        <p
          className="text-[16px] font-extrabold mb-1.5"
          style={{ color: dark ? "#fff" : "#0f172a" }}
        >
          Opening secure checkout…
        </p>
        <p
          className="text-[12px] font-medium"
          style={{ color: dark ? "#64748b" : "#94a3b8" }}
        >
          Setting up your Starter subscription
        </p>
      </div>
      <div
        className="flex items-center gap-1.5 px-4 py-2 rounded-full"
        style={{
          background: dark ? "rgba(59,130,246,0.08)" : "rgba(219,234,254,0.6)",
          border: `1px solid ${dark ? "rgba(59,130,246,0.15)" : "rgba(147,197,253,0.4)"}`,
        }}
      >
        <Lock size={11} style={{ color: "#3b82f6" }} />
        <span
          className="text-[10.5px] font-bold"
          style={{ color: dark ? "#93c5fd" : "#2563eb" }}
        >
          Secured by Razorpay
        </span>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════
   SUCCESS SCREEN
══════════════════════════════════════════════════ */
function SuccessScreen({
  dark,
  subscriptionId,
  onDone,
}: {
  dark: boolean;
  subscriptionId: string;
  onDone: () => void;
}) {
  const textP = dark ? "#fff" : "#0f172a";
  const textS = dark ? "#64748b" : "#64748b";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center text-center pb-8 max-w-lg mx-auto"
    >
      {/* Animated orb */}
      <motion.div
        style={{
          position: "relative",
          margin: "28px 0 24px",
          width: 100,
          height: 100,
        }}
      >
        {[68, 86, 104].map((size, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.12 + i * 0.07,
              duration: 0.4,
              ease: [0.34, 1.3, 0.64, 1],
            }}
            style={{
              position: "absolute",
              borderRadius: "50%",
              border: `1.5px solid rgba(59,130,246,${0.28 - i * 0.07})`,
              width: size,
              height: size,
              top: (104 - size) / 2,
              left: (104 - size) / 2,
            }}
          />
        ))}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.45, ease: [0.34, 1.5, 0.64, 1] }}
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            width: 76,
            height: 76,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
            boxShadow: "0 12px 44px rgba(37,99,235,0.42)",
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.3,
              duration: 0.35,
              ease: [0.34, 1.5, 0.64, 1],
            }}
          >
            <CheckCircle2 size={34} color="#fff" strokeWidth={1.8} />
          </motion.div>
        </motion.div>
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos((i / 8) * Math.PI * 2) * 58,
              y: Math.sin((i / 8) * Math.PI * 2) * 58,
              opacity: 0,
              scale: 0,
            }}
            transition={{ delay: 0.28, duration: 0.6, ease: "easeOut" }}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 5,
              height: 5,
              borderRadius: "50%",
              marginTop: -2.5,
              marginLeft: -2.5,
              background: i % 2 === 0 ? "#3b82f6" : "#60a5fa",
            }}
          />
        ))}
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="text-[24px] md:text-[28px] font-black mb-1.5"
        style={{ letterSpacing: "-0.04em", color: textP }}
      >
        You're all set! 🎉
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.17 }}
        className="text-[13px] font-medium mb-5"
        style={{ color: textS }}
      >
        Starter plan activated successfully
      </motion.p>

      {/* Subscription ID */}
      {subscriptionId && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="w-full rounded-2xl p-3.5 mb-3 text-left"
          style={{
            background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
            border: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
          }}
        >
          <p
            className="text-[9.5px] font-extrabold uppercase tracking-[0.08em] mb-1"
            style={{ color: dark ? "#334155" : "#94a3b8" }}
          >
            Subscription ID
          </p>
          <p
            className="text-[11px] font-bold m-0 break-all"
            style={{
              fontFamily: "monospace",
              color: dark ? "#60a5fa" : "#2563eb",
            }}
          >
            {subscriptionId}
          </p>
        </motion.div>
      )}

      {/* Unlock grid */}
      <div className="w-full grid grid-cols-2 gap-2 mb-4">
        {PLAN.unlocked.map((u, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.93 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.28 + i * 0.05 }}
            className="flex items-center gap-2.5 px-3.5 py-3 rounded-2xl"
            style={{
              background: dark
                ? "rgba(59,130,246,0.05)"
                : "rgba(239,246,255,0.8)",
              border: `1px solid ${dark ? "rgba(59,130,246,0.08)" : "rgba(147,197,253,0.25)"}`,
            }}
          >
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center text-sm shrink-0"
              style={{ background: `${u.color}18` }}
            >
              {u.icon}
            </div>
            <span
              className="text-[12px] font-bold"
              style={{ color: dark ? "#e2e8f0" : "#1e293b" }}
            >
              {u.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Trial countdown */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.32 }}
        className="w-full rounded-2xl p-3.5 flex items-center gap-3 text-left mb-6"
        style={{
          background: dark ? "rgba(34,197,94,0.07)" : "rgba(220,252,231,0.6)",
          border: `1.5px solid ${dark ? "rgba(34,197,94,0.14)" : "rgba(134,239,172,0.4)"}`,
        }}
      >
        <Clock size={14} style={{ color: "#22c55e", flexShrink: 0 }} />
        <div>
          <p
            className="text-[12.5px] font-extrabold m-0"
            style={{ color: dark ? "#4ade80" : "#15803d" }}
          >
            Trial ends in 7 days
          </p>
          <p
            className="text-[10.5px] font-medium mt-0.5 m-0"
            style={{ color: dark ? "#16a34a" : "#16a34a" }}
          >
            First charge on{" "}
            {new Date(Date.now() + 7 * 86400000).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
            })}{" "}
            · Cancel anytime
          </p>
        </div>
      </motion.div>

      <motion.button
        onClick={onDone}
        whileTap={{ scale: 0.975 }}
        className="w-full py-4 rounded-[18px] text-white text-[14px] font-black relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg,#1d4ed8,#2563eb,#3b82f6)",
          boxShadow: "0 10px 32px rgba(37,99,235,0.38)",
          letterSpacing: "-0.01em",
        }}
      >
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)",
          }}
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
        />
        <span className="relative">Go to Dashboard →</span>
      </motion.button>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════
   FAILED SCREEN
══════════════════════════════════════════════════ */
function FailedScreen({
  dark,
  reason,
  onRetry,
  onBack,
  loading,
}: {
  dark: boolean;
  reason: string;
  onRetry: () => void;
  onBack: () => void;
  loading: boolean;
}) {
  const textP = dark ? "#fff" : "#0f172a";
  const textS = dark ? "#64748b" : "#64748b";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.32 }}
      className="flex flex-col items-center text-center pb-8 max-w-lg mx-auto"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1, x: [0, -5, 5, -2, 2, 0] }}
        transition={{
          scale: { duration: 0.42, ease: [0.34, 1.4, 0.64, 1] },
          x: { delay: 0.45, duration: 0.4 },
        }}
        className="mt-8 mb-5 rounded-full flex items-center justify-center"
        style={{
          width: 72,
          height: 72,
          background: dark ? "rgba(239,68,68,0.1)" : "rgba(254,226,226,0.8)",
          border: "2px solid rgba(239,68,68,0.25)",
        }}
      >
        <XCircle size={34} style={{ color: "#ef4444" }} strokeWidth={1.8} />
      </motion.div>

      <h1
        className="text-[24px] font-black mb-1.5"
        style={{ letterSpacing: "-0.04em", color: textP }}
      >
        Payment Failed
      </h1>
      <p
        className="text-[13px] font-medium mb-5"
        style={{ color: textS, maxWidth: 260 }}
      >
        No charges were made to your account.
      </p>

      {reason && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full rounded-2xl p-3.5 mb-3 flex items-start gap-2.5 text-left"
          style={{
            background: dark ? "rgba(239,68,68,0.07)" : "rgba(254,226,226,0.5)",
            border: `1.5px solid ${dark ? "rgba(239,68,68,0.15)" : "rgba(252,165,165,0.4)"}`,
          }}
        >
          <AlertCircle
            size={14}
            style={{ color: "#ef4444", marginTop: 1, flexShrink: 0 }}
          />
          <p
            className="text-[12px] font-semibold m-0"
            style={{ color: dark ? "#fca5a5" : "#991b1b" }}
          >
            {reason}
          </p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="w-full rounded-2xl p-3.5 mb-6 flex items-center gap-2.5 text-left"
        style={{
          background: dark ? "rgba(37,99,235,0.07)" : "rgba(219,234,254,0.5)",
          border: `1px solid ${dark ? "rgba(59,130,246,0.1)" : "rgba(147,197,253,0.35)"}`,
        }}
      >
        <Bell size={13} style={{ color: "#3b82f6", flexShrink: 0 }} />
        <p
          className="text-[11.5px] font-semibold m-0"
          style={{ color: dark ? "#93c5fd" : "#1d4ed8" }}
        >
          Need help? Email <strong>support@vipprow.com</strong>
        </p>
      </motion.div>

      <div className="w-full flex flex-col gap-2.5">
        <motion.button
          onClick={onRetry}
          whileTap={{ scale: 0.975 }}
          disabled={loading}
          className="w-full py-4 rounded-[18px] text-white text-[14px] font-black flex items-center justify-center gap-2 relative overflow-hidden disabled:opacity-60"
          style={{
            background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
            boxShadow: "0 10px 32px rgba(37,99,235,0.38)",
          }}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)",
            }}
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          {loading ? (
            <RefreshCw size={14} className="animate-spin relative" />
          ) : (
            <RefreshCw size={14} className="relative" />
          )}
          <span className="relative">{loading ? "Loading…" : "Try Again"}</span>
        </motion.button>
        <motion.button
          onClick={onBack}
          whileTap={{ scale: 0.975 }}
          className="w-full py-3.5 rounded-[18px] text-[13px] font-bold cursor-pointer"
          style={{
            background: "transparent",
            border: `1.5px solid ${dark ? "rgba(255,255,255,0.09)" : "rgba(203,213,225,0.7)"}`,
            color: textS,
          }}
        >
          ← Back to plan
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════
   PAGE  — wired to your hooks
══════════════════════════════════════════════════ */
export default function SubscriptionPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";

  const [screen, setScreen] = useState<Screen>("plans");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [failReason, setFailReason] = useState("");
  const [creating, setCreating] = useState(false);

  /* ── Your hooks ── */
  const { data: user } = useUser();
  const { isActive } = useSubscription();
  const { createSubscription, verifySubscription, loading } =
    useSubscriptionActions();

  const stepIndex = screen === "plans" ? 0 : screen === "processing" ? 1 : 2;

  /* ══════════════════════════════════════════
     handleStart — calls createSubscription
     from useSubscriptionActions (mutateAsync)
     → opens Razorpay modal
     → on payment success calls verifySubscription
  ══════════════════════════════════════════ */
  async function handleStart() {
    // 🔥 Prevent duplicate clicks
    if (isActive || loading || creating) return;

    setCreating(true);
    setScreen("processing");

    try {
      // 1. Load Razorpay SDK
      const loaded = await loadRzpScript();
      if (!loaded) {
        throw new Error(
          "Failed to load payment SDK. Please check your connection.",
        );
      }

      // 2. Create subscription
      const data = await createSubscription(PLAN.razorpayPlanId);

      const rzSubId = data?.subscriptionId;
      if (!rzSubId) {
        throw new Error("No subscriptionId returned from server");
      }

      // 3. Open Razorpay
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: rzSubId,
        name: "Vipprow",
        description: `Starter Plan · ${fmt(PLAN.priceMonthly)}/mo`,
        image: "/logo.png",

        prefill: {
          name: user?.name ?? "",
          email: user?.email ?? "",
          contact: user?.phone ?? "",
        },

        theme: { color: "#2563eb" },

        handler: async (response: any) => {
          try {
            await verifySubscription({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
              planId: PLAN.razorpayPlanId,
            });

            setSubscriptionId(response.razorpay_subscription_id);
            setScreen("success");
          } catch (err: any) {
            setFailReason(
              err?.response?.data?.message ??
                "Payment verification failed. Please contact support.",
            );
            setScreen("failed");
          }
        },

        modal: {
          ondismiss: () => {
            setScreen("plans");
          },
        },
      });

      rzp.open();

      rzp.on("payment.failed", (resp: any) => {
        setFailReason(
          resp?.error?.description ??
            resp?.error?.reason ??
            "Payment failed. Please try again.",
        );
        setScreen("failed");
      });
    } catch (err: any) {
      setFailReason(
        err?.response?.data?.message ??
          err?.message ??
          "Something went wrong. Please try again.",
      );
      setScreen("failed");
    } finally {
      // 🔥 release lock
      setCreating(false);
    }
  }

  return (
    <div
      className="w-full min-h-full pt-4 pb-10"
      style={{
        fontFamily: "-apple-system,'SF Pro Text',sans-serif",
        transition: "background 0.35s",
      }}
    >
      {/* Background glow */}
      <div
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-40"
        style={{
          background:
            "radial-gradient(circle,rgba(37,99,235,0.1) 0%,transparent 70%)",
          zIndex: 0,
        }}
      />

      <div
        className="relative max-w-5xl mx-auto px-4 md:px-6 lg:px-8"
        style={{ zIndex: 1 }}
      >
        {/* Topbar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="flex items-center justify-between pt-2 pb-4"
        >
          <div className="flex items-center gap-2.5">
            <AnimatePresence>
              {screen === "failed" && (
                <motion.button
                  key="back"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  onClick={() => setScreen("plans")}
                  whileTap={{ scale: 0.88 }}
                  className="w-8 h-8 rounded-xl border-none cursor-pointer flex items-center justify-center"
                  style={{
                    background: dark
                      ? "rgba(255,255,255,0.07)"
                      : "rgba(0,0,0,0.06)",
                    color: dark ? "#94a3b8" : "#64748b",
                  }}
                >
                  <ArrowLeft size={14} />
                </motion.button>
              )}
            </AnimatePresence>
            <StepDots step={stepIndex} dark={dark} />
          </div>
          <div
            className="flex items-center gap-1.5"
            style={{ color: dark ? "#334155" : "#94a3b8" }}
          >
            <Lock size={11} />
            <span className="text-[10px] font-extrabold">
              Secured by Razorpay
            </span>
          </div>
        </motion.div>

        {/* Screen transitions */}
        <AnimatePresence mode="wait">
          {screen === "plans" && (
            <motion.div
              key="plans"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.26 }}
            >
              <PlanScreen
                dark={dark}
                onStart={handleStart}
                alreadyActive={!!isActive}
                loading={loading || creating}
              />
            </motion.div>
          )}
          {screen === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ProcessingScreen dark={dark} />
            </motion.div>
          )}
          {screen === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <SuccessScreen
                dark={dark}
                subscriptionId={subscriptionId}
                onDone={() => router.push("/")}
              />
            </motion.div>
          )}
          {screen === "failed" && (
            <motion.div
              key="failed"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <FailedScreen
                dark={dark}
                reason={failReason}
                onRetry={handleStart}
                onBack={() => setScreen("plans")}
                loading={loading}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
