// mobile_app\app\(main)\subscription\page.tsx
"use client";

// mobile_app/app/(main)/subscription/page.tsx
// Single Agency plan · coupon animates price inline

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
  CreditCard,
  XOctagon,
  AlertTriangle,
  Tag,
  X,
} from "lucide-react";
import { useUser } from "@/features/user/hook/useUser";
import { useSubscriptionActions } from "@/features/subscription/hook/useSubscriptionActions";
import { useSubscription } from "@/features/subscription/hook/useSubscription";

/* ══════════════════════════════════════════════════
   SINGLE PLAN — Agency ₹5,999
══════════════════════════════════════════════════ */
// const PLAN = {
//   name: "Agency",
//   planId: process.env.NEXT_PUBLIC_RAZORPAY_PLAN_ID_AGENCY ?? "",
//   price: 5999,
//   color: "#f59e0b",
//   gradient: "linear-gradient(135deg,#d97706,#f59e0b)",
//   features: [
//     { text: "Unlimited GBP Profiles", bold: true },
//     { text: "Full analytics suite", bold: true },
//     { text: "AI auto-review replies", bold: false },
//     { text: "Unlimited posts", bold: false },
//     { text: "Advanced AI + automation", bold: true },
//     { text: "Dedicated account manager", bold: false },
//     { text: "Full competitor analysis", bold: true },
//     { text: "24/7 priority support", bold: true },
//   ],
// };

const PLAN = {
  name: "Croissix",
  planId: process.env.NEXT_PUBLIC_RAZORPAY_PLAN_ID_CROISSIX,
  price: 599,
  color: "#f59e0b",
  gradient: "linear-gradient(135deg,#d97706,#f59e0b)",
  features: [
    { text: "1 Google Business Profile", bold: true },
    { text: "Analytics Dashboard", bold: true },
    { text: "AI auto-review replies", bold: true },
    { text: "Review monitoring", bold: true },
    { text: "AI insights", bold: true },
    { text: "Google Photos Management", bold: true },
  ],
};

/* ══════════════════════════════════════════════════
   COUPON CONFIG
══════════════════════════════════════════════════ */
interface CouponData {
  planId: string;
  price: number;
  originalPrice: number;
  savings: number;
}

const COUPONS: Record<string, CouponData> = {
  VIPPROW499: {
    planId: process.env.NEXT_PUBLIC_RAZORPAY_PLAN_ID_STARTER ?? "",
    price: 499,
    originalPrice: 5999,
    savings: 5500,
  },
  VIPPROW999: {
    planId: process.env.NEXT_PUBLIC_RAZORPAY_PLAN_ID_PRO ?? "",
    price: 999,
    originalPrice: 5999,
    savings: 5000,
  },
};

/* ══════════════════════════════════════════════════
   STATUS CONFIG (for details view)
══════════════════════════════════════════════════ */
const STATUS_CFG: Record<string, any> = {
  active: {
    label: "Active",
    color: "#22c55e",
    bg: "rgba(220,252,231,0.7)",
    darkBg: "rgba(34,197,94,0.1)",
    icon: <CheckCircle2 size={13} />,
  },
  created: {
    label: "Pending",
    color: "#f59e0b",
    bg: "rgba(254,243,199,0.7)",
    darkBg: "rgba(245,158,11,0.1)",
    icon: <Clock size={13} />,
  },
  cancelled: {
    label: "Cancelled",
    color: "#ef4444",
    bg: "rgba(254,226,226,0.7)",
    darkBg: "rgba(239,68,68,0.1)",
    icon: <XOctagon size={13} />,
  },
  failed: {
    label: "Failed",
    color: "#ef4444",
    bg: "rgba(254,226,226,0.7)",
    darkBg: "rgba(239,68,68,0.1)",
    icon: <AlertTriangle size={13} />,
  },
  expired: {
    label: "Expired",
    color: "#94a3b8",
    bg: "rgba(241,245,249,0.7)",
    darkBg: "rgba(148,163,184,0.1)",
    icon: <XCircle size={13} />,
  },
};

type Screen = "plans" | "processing" | "success" | "failed";

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const fmtDate = (d?: string | Date) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
const daysLeft = (end?: string | Date) => {
  if (!end) return null;
  const d = Math.ceil((new Date(end).getTime() - Date.now()) / 86400000);
  return d > 0 ? d : 0;
};

declare global {
  interface Window {
    Razorpay: any;
  }
}
function loadRzp(): Promise<boolean> {
  return new Promise((res) => {
    if (document.getElementById("rzp-sp")) return res(true);
    const s = document.createElement("script");
    s.id = "rzp-sp";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => res(true);
    s.onerror = () => res(false);
    document.body.appendChild(s);
  });
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
                  ? "#f59e0b"
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
                    ? "#f59e0b"
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
   COUPON INPUT
══════════════════════════════════════════════════ */
function CouponInput({
  dark,
  applied,
  onApply,
  onRemove,
}: {
  dark: boolean;
  applied: { code: string; data: CouponData } | null;
  onApply: (code: string, data: CouponData) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState("");
  const [err, setErr] = useState("");
  const textP = dark ? "#f1f5f9" : "#0f172a";
  const textS = dark ? "#64748b" : "#94a3b8";
  const border = dark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.09)";

  const apply = () => {
    const code = val.trim().toUpperCase();
    if (!code) {
      setErr("Enter a coupon code");
      return;
    }
    const data = COUPONS[code];
    if (!data) {
      setErr("Invalid coupon code");
      return;
    }
    setErr("");
    onApply(code, data);
    setOpen(false);
    setVal("");
  };

  if (applied)
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl"
        style={{
          background: "rgba(34,197,94,0.09)",
          border: "1px solid rgba(34,197,94,0.28)",
        }}
      >
        <Tag size={12} style={{ color: "#22c55e", flexShrink: 0 }} />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold m-0" style={{ color: "#22c55e" }}>
            {applied.code} applied!
          </p>
          <p
            className="text-[10.5px] m-0"
            style={{ color: dark ? "#16a34a" : "#15803d" }}
          >
            You save {fmt(applied.data.savings)} — pay only{" "}
            {fmt(applied.data.price)}/mo
          </p>
        </div>
        <button
          onClick={onRemove}
          className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}
        >
          <X size={11} />
        </button>
      </motion.div>
    );

  return (
    <div className="flex flex-col gap-1.5">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-[12px] font-semibold self-start active:opacity-70"
          style={{ color: "#3b82f6" }}
        >
          <Tag size={13} /> Have a coupon code?
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex gap-2"
        >
          <input
            value={val}
            onChange={(e) => {
              setVal(e.target.value);
              setErr("");
            }}
            onKeyDown={(e) => e.key === "Enter" && apply()}
            placeholder="Enter coupon"
            className="flex-1 px-3.5 py-2.5 rounded-2xl text-[13px] outline-none uppercase"
            style={{
              background: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
              border: `1.5px solid ${err ? "rgba(239,68,68,0.5)" : border}`,
              color: textP,
              fontFamily:
                "-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif",
            }}
          />
          <button
            onClick={apply}
            className="px-4 py-2.5 rounded-2xl text-[12px] font-bold text-white shrink-0"
            style={{
              background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
              boxShadow: "0 2px 10px rgba(37,99,235,0.35)",
            }}
          >
            Apply
          </button>
          <button
            onClick={() => {
              setOpen(false);
              setErr("");
              setVal("");
            }}
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              color: textS,
            }}
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
      {err && <p className="text-[11px] text-red-400">{err}</p>}
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
  coupon,
  onCouponApply,
  onCouponRemove,
}: {
  dark: boolean;
  onStart: (planId: string) => void;
  alreadyActive: boolean;
  loading: boolean;
  coupon: { code: string; data: CouponData } | null;
  onCouponApply: (code: string, data: CouponData) => void;
  onCouponRemove: () => void;
}) {
  const textP = dark ? "#f1f5f9" : "#0f172a";
  const textS = dark ? "#64748b" : "#94a3b8";
  const cardBg = dark ? "rgba(37,99,235,0.06)" : "rgba(254,249,232,0.7)";

  // const effectivePlanId = coupon ? coupon.data.planId : PLAN.planId;
  // const effectivePrice = coupon ? coupon.data.price : PLAN.price;
  const effectivePlanId = PLAN.planId;
  const effectivePrice = PLAN.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="w-full flex flex-col gap-5"
    >
      {/* Header */}
      <div className="text-center pt-2">
        <div
          className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{
            background: PLAN.gradient,
            boxShadow: "0 8px 28px rgba(217,119,6,0.4)",
          }}
        >
          <Zap size={22} color="#fff" />
        </div>
        {/* <motion.div
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
              ? "rgba(245,158,11,0.12)"
              : "rgba(254,243,199,0.8)",
            border: `1px solid ${dark ? "rgba(245,158,11,0.22)" : "rgba(253,230,138,0.7)"}`,
          }}
        >
          <Zap size={10} style={{ color: PLAN.color }} />
          <span
            className="text-[10.5px] font-extrabold uppercase tracking-[0.06em]"
            style={{ color: PLAN.color }}
          >
            7-day free trial
          </span>
        </motion.div> */}
        <h1
          className="text-[24px] md:text-[28px] font-black leading-tight mb-1.5"
          style={{ letterSpacing: "-0.04em", color: textP }}
        >
          Unlock Croissix
        </h1>
        <p className="text-[13px] font-medium" style={{ color: textS }}>
          Everything you need to dominate local search.
        </p>
      </div>

      {/* ── PLAN CARD ── */}
      <div
        className="rounded-3xl overflow-hidden"
        style={{
          border: `2px solid ${dark ? "rgba(245,158,11,0.3)" : "rgba(245,158,11,0.25)"}`,
          background: cardBg,
          boxShadow: dark
            ? "0 0 0 4px rgba(245,158,11,0.07),0 16px 48px rgba(217,119,6,0.18)"
            : "0 0 0 4px rgba(245,158,11,0.06),0 8px 40px rgba(217,119,6,0.14)",
        }}
      >
        <div style={{ height: 4, background: PLAN.gradient }} />

        <div className="p-5">
          {/* Plan name + price row */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-[14px] flex items-center justify-center"
                style={{
                  background: PLAN.gradient,
                  boxShadow: "0 6px 20px rgba(217,119,6,0.35)",
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
                    className="text-[9px] font-black px-2 py-0.5 rounded-full text-white uppercase"
                    style={{ background: PLAN.gradient }}
                  >
                    Best Value
                  </span>
                </div>
                {/* <p
                  className="text-[11px] mt-0.5 font-medium"
                  style={{ color: textS }}
                >
                  Unlimited locations · Full AI suite
                </p> */}
              </div>
            </div>

            {/* Animated price */}
            <div className="text-right shrink-0 ml-2">
              <AnimatePresence mode="wait">
                {coupon ? (
                  <motion.div
                    key="disc"
                    initial={{ opacity: 0, y: -8, scale: 0.88 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.88 }}
                    transition={{ duration: 0.22, ease: [0.34, 1.2, 0.64, 1] }}
                  >
                    <p
                      className="text-[11px] font-semibold line-through text-right mb-0.5"
                      style={{ color: textS }}
                    >
                      {fmt(PLAN.price)}
                    </p>
                    <div className="flex items-start gap-0.5 justify-end">
                      <span
                        className="text-[12px] font-extrabold mt-0.5"
                        style={{ color: PLAN.color }}
                      >
                        ₹
                      </span>
                      {/* <span
                        className="text-[32px] font-black leading-none"
                        style={{ letterSpacing: "-0.05em", color: textP }}
                      >
                        {coupon.data.price.toLocaleString("en-IN")}
                      </span> */}
                    </div>
                    <p
                      className="text-[10px] font-bold mt-0.5"
                      style={{ color: textS }}
                    >
                      /month
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="orig"
                    initial={{ opacity: 0, y: -8, scale: 0.88 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.88 }}
                    transition={{ duration: 0.22, ease: [0.34, 1.2, 0.64, 1] }}
                  >
                    <div className="flex items-start gap-0.5">
                      <span
                        className="text-[12px] font-extrabold mt-1"
                        style={{ color: PLAN.color }}
                      >
                        ₹
                      </span>
                      <span
                        className="text-[32px] font-black leading-none"
                        style={{ letterSpacing: "-0.05em", color: textP }}
                      >
                        {PLAN.price.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <p
                      className="text-[10px] font-bold mt-0.5"
                      style={{ color: textS }}
                    >
                      /month
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Divider */}
          <div
            className="h-px mb-4"
            style={{
              background: dark
                ? "rgba(255,255,255,0.05)"
                : "rgba(245,158,11,0.12)",
            }}
          />

          {/* Features */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            {PLAN.features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 + i * 0.04 }}
                className="flex items-center gap-2"
              >
                <div
                  className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center"
                  style={{
                    background: f.bold
                      ? PLAN.gradient
                      : dark
                        ? "rgba(245,158,11,0.15)"
                        : "rgba(245,158,11,0.1)",
                  }}
                >
                  <Check
                    size={9}
                    color={f.bold ? "#fff" : PLAN.color}
                    strokeWidth={3}
                  />
                </div>
                <span
                  className="text-[11px] leading-snug"
                  style={{
                    fontWeight: f.bold ? 700 : 500,
                    color: dark
                      ? f.bold
                        ? "#fde68a"
                        : "#94a3b8"
                      : f.bold
                        ? "#92400e"
                        : "#64748b",
                  }}
                >
                  {f.text}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Savings badge */}
          {/* <AnimatePresence>
            {coupon && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.22 }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{
                  background: "rgba(34,197,94,0.09)",
                  border: "1px solid rgba(34,197,94,0.25)",
                }}
              >
                <Tag size={11} style={{ color: "#22c55e" }} />
                <span
                  className="text-[11px] font-bold"
                  style={{ color: "#22c55e" }}
                >
                  {coupon.code} — you save {fmt(coupon.data.savings)}/month
                </span>
              </motion.div>
            )}
          </AnimatePresence> */}
        </div>
      </div>

      {/* Coupon input */}
      {/* <CouponInput
        dark={dark}
        applied={coupon}
        onApply={onCouponApply}
        onRemove={onCouponRemove}
      /> */}

      {/* Trust row */}
      {/* <div
        className="rounded-2xl p-3 flex items-center gap-2.5"
        style={{
          background: dark ? "rgba(37,99,235,0.07)" : "rgba(219,234,254,0.5)",
          border: `1px solid ${dark ? "rgba(59,130,246,0.12)" : "rgba(147,197,253,0.4)"}`,
        }}
      >
        <Shield size={13} style={{ color: "#3b82f6", flexShrink: 0 }} />
        <p
          className="text-[11px] font-semibold m-0"
          style={{ color: dark ? "#93c5fd" : "#1d4ed8" }}
        >
          <strong>7-day free trial</strong> · No setup fees · Cancel anytime ·
          Secured by Razorpay
        </p>
      </div> */}

      {/* CTA */}
      <div>
        <motion.button
          onClick={() => onStart(effectivePlanId || "")}
          disabled={alreadyActive || loading || !effectivePlanId}
          whileTap={{ scale: 0.975 }}
          className="w-full py-4 rounded-[18px] text-white text-[14px] font-black flex items-center justify-center gap-2 relative overflow-hidden disabled:opacity-60"
          style={{
            cursor: alreadyActive || loading ? "not-allowed" : "pointer",
            background: alreadyActive ? "rgba(245,158,11,0.4)" : PLAN.gradient,
            boxShadow: alreadyActive
              ? "none"
              : "0 10px 32px rgba(217,119,6,0.45)",
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
                : `Subscribe now · ${fmt(effectivePrice)}/mo`}
          </span>
        </motion.button>
        {/* <p
          className="text-center text-[10px] mt-1.5 font-medium"
          style={{ color: dark ? "#2d3f58" : "#94a3b8" }}
        >
          Free for 7 days · then {fmt(effectivePrice)}/month · cancel anytime
        </p> */}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════
   SUBSCRIPTION DETAILS
══════════════════════════════════════════════════ */
function SubscriptionDetails({
  dark,
  subscription,
  onCancel,
  cancelLoading,
}: {
  dark: boolean;
  subscription: any;
  onCancel: () => void;
  cancelLoading: boolean;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const textP = dark ? "#f1f5f9" : "#0f172a";
  const textS = dark ? "#64748b" : "#94a3b8";
  const cardBg = dark ? "rgb(16,23,38)" : "#ffffff";
  const border = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";

  const status = subscription?.status ?? "created";
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.created;
  const days = daysLeft(subscription?.currentEnd);
  const prog =
    subscription?.paidCount && subscription?.totalCount
      ? Math.round((subscription.paidCount / subscription.totalCount) * 100)
      : 0;
  const isActive = status === "active";
  const isCancelled = status === "cancelled";
  const isExpired = status === "expired";

  const Row = ({
    label,
    value,
    mono = false,
  }: {
    label: string;
    value: string;
    mono?: boolean;
  }) => (
    <div
      className="flex items-start justify-between gap-4 py-3"
      style={{ borderBottom: `1px solid ${border}` }}
    >
      <span
        className="text-[12px] font-medium shrink-0"
        style={{ color: textS }}
      >
        {label}
      </span>
      <span
        className="text-[12px] font-semibold text-right break-all"
        style={{ color: textP, fontFamily: mono ? "monospace" : "inherit" }}
      >
        {value}
      </span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-2xl mx-auto flex flex-col gap-4"
    >
      {/* Hero card */}
      <div
        className="rounded-3xl overflow-hidden"
        style={{
          background: cardBg,
          border: `1px solid ${border}`,
          boxShadow: dark
            ? "0 8px 32px rgba(0,0,0,0.4)"
            : "0 4px 20px rgba(0,0,0,0.07)",
        }}
      >
        <div
          style={{
            height: 4,
            background: isActive
              ? "linear-gradient(90deg,#22c55e,#16a34a)"
              : isCancelled || isExpired
                ? "linear-gradient(90deg,#ef4444,#dc2626)"
                : "linear-gradient(90deg,#f59e0b,#d97706)",
          }}
        />
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background: isActive
                    ? PLAN.gradient
                    : "rgba(148,163,184,0.15)",
                }}
              >
                <Zap size={22} color={isActive ? "#fff" : textS} />
              </div>
              <div>
                <p
                  className="text-[16px] font-black leading-none mb-1"
                  style={{ color: textP, letterSpacing: "-0.02em" }}
                >
                  Croissix Plan
                </p>
                <p className="text-[11px] font-medium" style={{ color: textS }}>
                  ₹{subscription?.amount?.toLocaleString("en-IN") ?? "5,999"}
                  /month · INR
                </p>
              </div>
            </div>
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full shrink-0"
              style={{
                background: dark ? cfg.darkBg : cfg.bg,
                border: `1px solid ${cfg.color}30`,
              }}
            >
              <span style={{ color: cfg.color }}>{cfg.icon}</span>
              <span
                className="text-[11px] font-bold"
                style={{ color: cfg.color }}
              >
                {cfg.label}
              </span>
            </div>
          </div>

          {/* Days ring */}
          {isActive && days !== null && (
            <div
              className="flex items-center gap-4 mb-4 p-3.5 rounded-2xl"
              style={{
                background: dark
                  ? "rgba(34,197,94,0.06)"
                  : "rgba(220,252,231,0.5)",
                border: `1px solid ${dark ? "rgba(34,197,94,0.15)" : "rgba(134,239,172,0.4)"}`,
              }}
            >
              <div className="relative w-12 h-12 shrink-0">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke={
                      dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"
                    }
                    strokeWidth="4"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="4"
                    strokeDasharray={`${2 * Math.PI * 20}`}
                    strokeDashoffset={`${2 * Math.PI * 20 * (1 - Math.min(days, 30) / 30)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="text-[11px] font-black"
                    style={{ color: "#22c55e" }}
                  >
                    {days}
                  </span>
                </div>
              </div>
              <div>
                <p
                  className="text-[13px] font-bold m-0"
                  style={{ color: dark ? "#4ade80" : "#15803d" }}
                >
                  {days} day{days !== 1 ? "s" : ""} remaining
                </p>
                <p
                  className="text-[11px] m-0 mt-0.5"
                  style={{ color: dark ? "#16a34a" : "#16a34a" }}
                >
                  Renews on {fmtDate(subscription?.currentEnd)}
                </p>
              </div>
            </div>
          )}

          {/* Billing progress */}
          {subscription?.totalCount > 0 && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: textS }}
                >
                  Billing cycles
                </span>
                <span
                  className="text-[11px] font-bold"
                  style={{ color: textP }}
                >
                  {subscription.paidCount} / {subscription.totalCount} paid
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{
                  background: dark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.06)",
                }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${prog}%`,
                    background: isActive
                      ? PLAN.gradient
                      : "rgba(148,163,184,0.4)",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className="rounded-2xl p-4"
          style={{
            background: cardBg,
            border: `1px solid ${border}`,
            boxShadow: dark ? "none" : "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <p
            className="text-[10px] font-black uppercase tracking-widest mb-3"
            style={{ color: textS }}
          >
            Subscription Info
          </p>
          <Row label="Plan" value="Agency" />
          <Row label="Status" value={cfg.label} />
          <Row
            label="Amount"
            // value={`₹${(subscription?.amount ?? 5999).toLocaleString("en-IN")} / month`}
            value={`₹${(subscription?.amount ?? 599).toLocaleString("en-IN")} / month`}
          />
          <Row label="Currency" value={subscription?.currency ?? "INR"} />
          <div className="flex items-start justify-between gap-4 py-3">
            <span
              className="text-[12px] font-medium shrink-0"
              style={{ color: textS }}
            >
              Sub ID
            </span>
            <span
              className="text-[10px] font-semibold text-right break-all"
              style={{
                color: dark ? "#60a5fa" : "#2563eb",
                fontFamily: "monospace",
              }}
            >
              {subscription?.razorpaySubscriptionId ?? "—"}
            </span>
          </div>
        </div>
        <div
          className="rounded-2xl p-4"
          style={{
            background: cardBg,
            border: `1px solid ${border}`,
            boxShadow: dark ? "none" : "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <p
            className="text-[10px] font-black uppercase tracking-widest mb-3"
            style={{ color: textS }}
          >
            Billing Dates
          </p>
          <Row
            label="Period start"
            value={fmtDate(subscription?.currentStart)}
          />
          <Row label="Period end" value={fmtDate(subscription?.currentEnd)} />
          <Row
            label="Paid cycles"
            value={String(subscription?.paidCount ?? 0)}
          />
          <Row
            label="Total cycles"
            value={String(subscription?.totalCount ?? 12)}
          />
          <Row label="Subscribed on" value={fmtDate(subscription?.createdAt)} />
        </div>
      </div>

      {/* Last payment */}
      {subscription?.razorpayPaymentId && (
        <div
          className="rounded-2xl p-4"
          style={{
            background: cardBg,
            border: `1px solid ${border}`,
            boxShadow: dark ? "none" : "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <p
            className="text-[10px] font-black uppercase tracking-widest mb-3"
            style={{ color: textS }}
          >
            Last Payment
          </p>
          <div
            className="flex items-center gap-2.5 px-3.5 py-3 rounded-2xl"
            style={{
              background: dark
                ? "rgba(59,130,246,0.06)"
                : "rgba(239,246,255,0.8)",
              border: `1px solid ${dark ? "rgba(59,130,246,0.1)" : "rgba(147,197,253,0.3)"}`,
            }}
          >
            <CreditCard size={14} style={{ color: "#3b82f6", flexShrink: 0 }} />
            <div className="flex-1 min-w-0">
              <p
                className="text-[10px] font-bold uppercase tracking-wide mb-0.5"
                style={{ color: textS }}
              >
                Payment ID
              </p>
              <p
                className="text-[11px] font-bold truncate"
                style={{
                  color: dark ? "#60a5fa" : "#2563eb",
                  fontFamily: "monospace",
                }}
              >
                {subscription.razorpayPaymentId}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {isActive &&
          !isCancelled &&
          (!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full py-3.5 rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              style={{
                background: "transparent",
                border: `1.5px solid ${dark ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.2)"}`,
                color: "#ef4444",
              }}
            >
              <XOctagon size={14} /> Cancel Subscription
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-4"
              style={{
                background: dark
                  ? "rgba(239,68,68,0.07)"
                  : "rgba(254,226,226,0.5)",
                border: `1.5px solid ${dark ? "rgba(239,68,68,0.2)" : "rgba(252,165,165,0.4)"}`,
              }}
            >
              <p
                className="text-[13px] font-bold mb-1"
                style={{ color: dark ? "#fca5a5" : "#991b1b" }}
              >
                Cancel your subscription?
              </p>
              <p
                className="text-[11.5px] mb-3"
                style={{ color: dark ? "#ef4444" : "#b91c1c" }}
              >
                Access continues until {fmtDate(subscription?.currentEnd)}. This
                cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold"
                  style={{
                    background: dark
                      ? "rgba(255,255,255,0.07)"
                      : "rgba(0,0,0,0.06)",
                    color: dark ? "#94a3b8" : "#64748b",
                  }}
                >
                  Keep plan
                </button>
                <button
                  onClick={() => {
                    onCancel();
                    setShowConfirm(false);
                  }}
                  disabled={cancelLoading}
                  className="flex-1 py-2.5 rounded-xl text-[12px] font-bold text-white flex items-center justify-center gap-1.5 disabled:opacity-60"
                  style={{ background: "#ef4444" }}
                >
                  {cancelLoading ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    <XOctagon size={12} />
                  )}
                  {cancelLoading ? "Cancelling…" : "Yes, cancel"}
                </button>
              </div>
            </motion.div>
          ))}

        {(isExpired || isCancelled) && (
          <div
            className="rounded-2xl p-4 text-center"
            style={{
              background: dark
                ? "rgba(245,158,11,0.06)"
                : "rgba(254,249,232,0.7)",
              border: `1px solid ${dark ? "rgba(245,158,11,0.12)" : "rgba(253,230,138,0.4)"}`,
            }}
          >
            <p
              className="text-[13px] font-bold mb-1"
              style={{ color: dark ? "#fcd34d" : "#92400e" }}
            >
              {isCancelled ? "Subscription cancelled" : "Subscription expired"}
            </p>
            <p
              className="text-[11.5px]"
              style={{ color: dark ? "#475569" : "#64748b" }}
            >
              Contact support to reactivate your Agency plan.
            </p>
          </div>
        )}

        <div
          className="rounded-2xl p-3.5 flex items-center gap-2.5"
          style={{
            background: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
            border: `1px solid ${border}`,
          }}
        >
          <Bell size={13} style={{ color: "#3b82f6", flexShrink: 0 }} />
          <p
            className="text-[11.5px] font-medium m-0"
            style={{ color: dark ? "#64748b" : "#64748b" }}
          >
            Questions? Email <strong>support@vipprow.com</strong>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════
   PROCESSING / SUCCESS / FAILED
══════════════════════════════════════════════════ */
function ProcessingScreen({ dark }: { dark: boolean }) {
  const textP = dark ? "#fff" : "#0f172a";
  const textS = dark ? "#64748b" : "#94a3b8";
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
          className="absolute rounded-full border-2"
          style={{ inset: -18, borderColor: PLAN.color }}
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full flex items-center justify-center"
          style={{
            width: 52,
            height: 52,
            background: PLAN.gradient,
            boxShadow: "0 8px 28px rgba(217,119,6,0.35)",
          }}
        >
          <RefreshCw size={22} color="#fff" />
        </motion.div>
      </div>
      <div>
        <p
          className="text-[16px] font-extrabold mb-1.5"
          style={{ color: textP }}
        >
          Opening secure checkout…
        </p>
        <p className="text-[12px] font-medium" style={{ color: textS }}>
          Setting up your Agency subscription
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
              border: `1.5px solid rgba(245,158,11,${0.28 - i * 0.07})`,
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
            background: PLAN.gradient,
            boxShadow: "0 12px 44px rgba(217,119,6,0.42)",
          }}
        >
          <CheckCircle2 size={34} color="#fff" strokeWidth={1.8} />
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
              background: i % 2 === 0 ? PLAN.color : "#fcd34d",
            }}
          />
        ))}
      </motion.div>
      <h1
        className="text-[24px] font-black mb-1.5"
        style={{ letterSpacing: "-0.04em", color: textP }}
      >
        You're all set! 🎉
      </h1>
      <p className="text-[13px] font-medium mb-5" style={{ color: textS }}>
        Croissix plan activated successfully
      </p>
      {subscriptionId && (
        <div
          className="w-full rounded-2xl p-3.5 mb-4 text-left"
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
        </div>
      )}
      {/* <div
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
            className="text-[10.5px] mt-0.5 m-0"
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
      </div> */}
      <motion.button
        onClick={onDone}
        whileTap={{ scale: 0.975 }}
        className="w-full py-4 rounded-[18px] text-white text-[14px] font-black relative overflow-hidden"
        style={{
          background: PLAN.gradient,
          boxShadow: "0 10px 32px rgba(217,119,6,0.38)",
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
        No charges were made.
      </p>
      {reason && (
        <div
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
        </div>
      )}
      <div
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
      </div>
      <div className="w-full flex flex-col gap-2.5">
        <button
          onClick={onRetry}
          disabled={loading}
          className="w-full py-4 rounded-[18px] text-white text-[14px] font-black flex items-center justify-center gap-2 relative overflow-hidden disabled:opacity-60 active:scale-[0.975]"
          style={{
            background: PLAN.gradient,
            boxShadow: "0 10px 32px rgba(217,119,6,0.38)",
          }}
        >
          {loading ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          {loading ? "Loading…" : "Try Again"}
        </button>
        <button
          onClick={onBack}
          className="w-full py-3.5 rounded-[18px] text-[13px] font-bold active:scale-[0.975]"
          style={{
            background: "transparent",
            border: `1.5px solid ${dark ? "rgba(255,255,255,0.09)" : "rgba(203,213,225,0.7)"}`,
            color: textS,
          }}
        >
          ← Back
        </button>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════
   PAGE
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
  const [coupon, setCoupon] = useState<{
    code: string;
    data: CouponData;
  } | null>(null);

  const { data: user } = useUser();
  const { isActive, subscription, isLoading: subLoading } = useSubscription();
  const {
    createSubscription,
    verifySubscription,
    cancelSubscription,
    loading,
  } = useSubscriptionActions();

  const stepIndex = screen === "plans" ? 0 : screen === "processing" ? 1 : 2;

  const [tab, setTab] = useState<"details" | "upgrade">(
    isActive ? "details" : "upgrade",
  );
  useEffect(() => {
    if (isActive) setTab("details");
  }, [isActive]);

  async function handleStart(planId: string) {
    if (isActive || !planId) return;
    setScreen("processing");
    const loaded = await loadRzp();
    if (!loaded) {
      setFailReason("Failed to load payment SDK.");
      setScreen("failed");
      return;
    }

    let rzSubId: string;
    try {
      const data = await createSubscription(planId);
      rzSubId = data.subscriptionId;
      if (!rzSubId) throw new Error("No subscriptionId returned");
    } catch (err: any) {
      setFailReason(
        err?.response?.data?.message ??
          err?.message ??
          "Could not create subscription.",
      );
      setScreen("failed");
      return;
    }

    const rzp = new window.Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      // key: process.env.NEXT_PUBLIC_RAZORPAY_TEST_KEY_ID,
      subscription_id: rzSubId,
      name: "Vipprow",
      description: `Agency Plan`,
      image: "/logo.png",
      prefill: {
        name: user?.name ?? "",
        email: user?.email ?? "",
        contact: user?.phone ?? "",
      },
      theme: { color: "#f59e0b" },
      handler: async (response: any) => {
        try {
          await verifySubscription({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_subscription_id: response.razorpay_subscription_id,
            razorpay_signature: response.razorpay_signature,
            planId,
          });
          setSubscriptionId(response.razorpay_subscription_id);
          setScreen("success");
        } catch (err: any) {
          setFailReason(
            err?.response?.data?.message ??
              err?.message ??
              "Verification failed.",
          );
          setScreen("failed");
        }
      },
      modal: {
        ondismiss() {
          setScreen("plans");
        },
      },
    });
    rzp.open();
    rzp.on("payment.failed", (resp: any) => {
      setFailReason(resp?.error?.description ?? "Payment failed.");
      setScreen("failed");
    });
  }

  async function handleCancel() {
    if (!subscription?.razorpaySubscriptionId) return;
    try {
      await cancelSubscription(subscription.razorpaySubscriptionId);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Cancel failed. Please try again.");
    }
  }

  const textS = dark ? "#64748b" : "#94a3b8";

  return (
    <div
      className="w-full min-h-full pt-4 pb-10"
      style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}
    >
      <div
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-30"
        style={{
          background:
            "radial-gradient(circle,rgba(245,158,11,0.1) 0%,transparent 70%)",
          zIndex: 0,
        }}
      />

      <div
        className="relative max-w-2xl mx-auto px-4 md:px-6"
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

        {/* Tabs */}
        {screen === "plans" && !subLoading && (
          <div
            className="flex gap-1 mb-5 p-1 rounded-2xl w-fit"
            style={{
              background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
              border: `1px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
            }}
          >
            {subscription && (
              <button
                onClick={() => setTab("details")}
                className="px-4 py-2 rounded-xl text-[12.5px] font-semibold transition-all"
                style={{
                  background:
                    tab === "details"
                      ? dark
                        ? "rgba(255,255,255,0.1)"
                        : "white"
                      : "transparent",
                  color:
                    tab === "details" ? (dark ? "#f1f5f9" : "#0f172a") : textS,
                  boxShadow:
                    tab === "details"
                      ? dark
                        ? "none"
                        : "0 1px 6px rgba(0,0,0,0.08)"
                      : "none",
                }}
              >
                My Subscription
              </button>
            )}
            <button
              onClick={() => setTab("upgrade")}
              className="px-4 py-2 rounded-xl text-[12.5px] font-semibold transition-all"
              style={{
                background:
                  tab === "upgrade"
                    ? dark
                      ? "rgba(255,255,255,0.1)"
                      : "white"
                    : "transparent",
                color:
                  tab === "upgrade" ? (dark ? "#f1f5f9" : "#0f172a") : textS,
                boxShadow:
                  tab === "upgrade"
                    ? dark
                      ? "none"
                      : "0 1px 6px rgba(0,0,0,0.08)"
                    : "none",
              }}
            >
              {isActive ? "Plan Info" : "Get Started"}
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {screen === "plans" && (
            <motion.div
              key="plans-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AnimatePresence mode="wait">
                {tab === "details" && subscription ? (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.22 }}
                  >
                    <SubscriptionDetails
                      dark={dark}
                      subscription={subscription}
                      onCancel={handleCancel}
                      cancelLoading={loading}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="plans-view"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.22 }}
                  >
                    <PlanScreen
                      dark={dark}
                      onStart={handleStart}
                      alreadyActive={!!isActive}
                      loading={loading}
                      coupon={coupon}
                      onCouponApply={(code, data) => setCoupon({ code, data })}
                      onCouponRemove={() => setCoupon(null)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
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
                onDone={() => {
                  setTab("details");
                  setScreen("plans");
                  router.push("/");
                }}
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
                onRetry={() => setScreen("plans")}
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
