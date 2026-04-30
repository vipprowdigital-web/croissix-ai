"use client";

// mobile_app/components/auth/SubscriptionGuard.tsx

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Zap,
  Shield,
  Check,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Bell,
  Lock,
  AlertCircle,
  Tag,
  X,
} from "lucide-react";
import { getToken } from "@/lib/token";
import { useSubscription } from "@/features/subscription/hook/useSubscription";
import { useSubscriptionActions } from "@/features/subscription/hook/useSubscriptionActions";
import { useUser } from "@/features/user/hook/useUser";

/* ══════════════════════════════════════════════════
   PLAN IDs — hardcoded directly (most reliable)
   Using process.env inside object literals at module
   scope is unreliable in Next.js client components.
   Hardcode the IDs here. Change them when plans change.
══════════════════════════════════════════════════ */
const PLAN_IDS = {
  AGENCY: "plan_STqnnDW7k5vdqH",
  PRO: "plan_STqmjxYrqcIhVl",
  STARTER: "plan_SR7GH5Kj45UJsP",
  croissix_payment: "plan_SjC7KUi6bOWHDW",
};

const RZP_KEY =
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "rzp_live_placeholder";
// const RZP_KEY =
//   process.env.NEXT_PUBLIC_RAZORPAY_TEST_KEY_ID ?? "rzp_live_placeholder";
// console.log("key id: ", RZP_KEY);

/* ══════════════════════════════════════════════════
   PLAN
══════════════════════════════════════════════════ */
// const PLAN = {
//   name: "Agency",
//   // planId: PLAN_IDS.AGENCY,
//   // price: 5999,
//   color: "#f59e0b",
//   gradient: "linear-gradient(135deg,#d97706,#f59e0b)",
//   features: [
//     { text: "Unlimited GBP Profiles", bold: true },
//     { text: "Full analytics suite", bold: true },
//     { text: "AI auto-review replies", bold: false },
//     { text: "Unlimited posts", bold: false },
//     { text: "Advanced AI + automation", bold: true },
//     { text: "Account manager", bold: false },
//     { text: "Full competitor analysis", bold: true },
//     { text: "24/7 priority support", bold: true },
//   ],
// };

const PLAN = {
  name: "Croissix",
  // planId: PLAN_IDS.croissix_payment,
  // planId: process.env.NEXT_PUBLIC_RAZORPAY_PLAN_ID_TEST,
  planId: process.env.NEXT_PUBLIC_RAZORPAY_PLAN_ID_CROISSIX,
  price: 599,
  // price: 1,
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

// console.log("plan id: ", process.env.NEXT_PUBLIC_RAZORPAY_TEST_PLAN_ID);

/* ══════════════════════════════════════════════════
   COUPONS — planId stored directly, no env lookup
══════════════════════════════════════════════════ */
interface CouponData {
  planId: string; // direct Razorpay plan ID
  price: number;
  originalPrice: number;
  savings: number;
}

const COUPON_MAP: Record<string, CouponData> = {
  VIPPROW499: {
    planId: PLAN_IDS.STARTER, // bills at ₹499
    price: 499,
    originalPrice: 5999,
    savings: 5500,
  },
  VIPPROW999: {
    planId: PLAN_IDS.PRO, // bills at ₹999
    price: 999,
    originalPrice: 5999,
    savings: 5000,
  },
};

/* ══════════════════════════════════════════════════
   MISC
══════════════════════════════════════════════════ */
const EXEMPT = ["/subscription", "/profile"];
const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-IN", { day: "numeric", month: "long" });

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRzp(): Promise<boolean> {
  return new Promise((res) => {
    if (document.getElementById("rzp-sg")) return res(true);
    const s = document.createElement("script");
    s.id = "rzp-sg";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => res(true);
    s.onerror = () => res(false);
    document.body.appendChild(s);
  });
}

type Screen = "plans" | "processing" | "success" | "failed";

/* ── Skeleton ── */
function AppSkeleton({ dark }: { dark: boolean }) {
  return (
    <div className="flex-1 min-h-screen p-6 flex flex-col gap-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-14 rounded-2xl animate-pulse"
          style={{
            background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)",
            animationDelay: `${i * 80}ms`,
          }}
        />
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
    const data = COUPON_MAP[code];
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
   SUBSCRIPTION GATE
══════════════════════════════════════════════════ */
function SubscriptionGate({ dark }: { dark: boolean }) {
  const [screen, setScreen] = useState<Screen>("plans");
  const [coupon, setCoupon] = useState<{
    code: string;
    data: CouponData;
  } | null>(null);
  const [failMsg, setFailMsg] = useState("");

  const { data: user } = useUser();
  const { createSubscription, verifySubscription, loading } =
    useSubscriptionActions();
  const { refetchSubscription } = useSubscription();

  // useEffect(() => {
  //   if (isActive) {
  //     setScreen("success");
  //   }
  // }, [isActive]);
  // console.log("Is Active: ", isActive);

  const textP = dark ? "#f1f5f9" : "#0f172a";
  const textS = dark ? "#64748b" : "#94a3b8";
  const pageBg = dark
    ? "linear-gradient(150deg,#050d1a 0%,#080f1e 100%)"
    : "linear-gradient(150deg,#eef4ff 0%,#f0f5ff 100%)";
  const cardBg = dark ? "rgba(37,99,235,0.06)" : "rgba(254,249,232,0.7)";

  // Effective values — coupon.planId overrides PLAN.planId
  // const effectivePlanId = coupon ? coupon.data.planId : PLAN.planId;
  // const effectivePrice = coupon ? coupon.data.price : PLAN.price;
  const effectivePlanId = PLAN.planId;
  const effectivePrice = PLAN.price;

  async function handleSubscribe() {
    setScreen("processing");
    const loaded = await loadRzp();
    if (!loaded) {
      setFailMsg("Failed to load payment SDK.");
      setScreen("failed");
      return;
    }

    // Use whichever planId is active (coupon or default)
    // const planId = coupon ? coupon.data.planId : PLAN.planId;

    // Default plan Id only
    const planId = PLAN.planId ?? "";
    console.log("Plan id: ", planId);

    let rzSubId: string;
    try {
      const data = await createSubscription(planId);
      rzSubId = data.subscriptionId;
      console.log("Subscription Ids: ", rzSubId);
      if (!rzSubId) throw new Error("No subscription ID returned.");
    } catch (err: any) {
      setFailMsg(
        err?.response?.data?.message ??
          err?.message ??
          "Could not create subscription.",
      );
      setScreen("failed");
      return;
    }

    // console.log("Subscription id: ", rzSubId);

    const rzp = new window.Razorpay({
      key: RZP_KEY,
      subscription_id: rzSubId,
      name: "Vipprow",
      description: `Croissix Plan · ${fmt(effectivePrice)}/mo`,
      image: "/logo.png",
      prefill: {
        name: user?.name ?? "",
        email: user?.email ?? "",
        contact: user?.phone ?? "",
      },
      theme: { color: "#f59e0b" },
      handler: async (resp: any) => {
        try {
          await verifySubscription({
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_subscription_id: resp.razorpay_subscription_id,
            razorpay_signature: resp.razorpay_signature,
            planId,
          });
          console.log("Verified successfullyy..");
          setScreen("success");
          await refetchSubscription();
          // ---------------------------
          // FOR THE MOBILE APP
          // Check if came from mobile app
          // const params = new URLSearchParams(window.location.search);
          // const callback = params.get("callback");

          // if (callback) {
          //   // Redirect straight back to app — no button tap needed
          //   console.log("Came from mobile app redirecting back....");
          //   window.location.href = decodeURIComponent(callback);
          //   setScreen("success");
          // } else {
          //   // Normal web flow
          // setScreen("success");
          // }
          // FOR THE MOBILE APP
          // ---------------------------
        } catch (err: any) {
          setFailMsg(
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
    rzp.on("payment.failed", (r: any) => {
      setFailMsg(r?.error?.description ?? "Payment failed.");
      setScreen("failed");
    });
  }

  return (
    <div
      className="flex-1 flex flex-col min-h-screen overflow-y-auto"
      style={{
        background: pageBg,
        fontFamily: "-apple-system,'SF Pro Text',sans-serif",
      }}
    >
      <div
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[480px] h-[480px] rounded-full opacity-25 z-0"
        style={{
          background:
            "radial-gradient(circle,rgba(245,158,11,0.12) 0%,transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md mx-auto px-4 py-8 flex flex-col gap-5">
        <AnimatePresence mode="wait">
          {/* ══ PLANS ══ */}
          {screen === "plans" && (
            <motion.div
              key="plans"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-5"
            >
              {/* Header */}
              <div className="text-center pt-2">
                <div
                  className="flex items-center justify-center w-14 h-14 rounded-2xl mx-auto mb-4"
                  style={{
                    background: PLAN.gradient,
                    boxShadow: "0 8px 28px rgba(217,119,6,0.4)",
                  }}
                >
                  <Zap size={22} color="#fff" />
                </div>
                {/* <div
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
                    3-day free trial
                  </span>
                </div> */}
                <h1
                  className="text-[24px] font-black leading-tight mb-1.5"
                  style={{ letterSpacing: "-0.04em", color: textP }}
                >
                  Unlock Croissix
                </h1>
                <p className="text-[13px] font-medium" style={{ color: textS }}>
                  Everything you need to dominate local search.
                </p>
              </div>

              {/* Plan card */}
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
                            Croissix
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
                    <div
                      className="text-right shrink-0 ml-2"
                      style={{ minWidth: 80 }}
                    >
                      <AnimatePresence mode="wait">
                        {coupon ? (
                          <motion.div
                            key="disc"
                            initial={{ opacity: 0, y: -8, scale: 0.88 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.88 }}
                            transition={{
                              duration: 0.22,
                              ease: [0.34, 1.2, 0.64, 1],
                            }}
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
                              <span
                                className="text-[32px] font-black leading-none"
                                style={{
                                  letterSpacing: "-0.05em",
                                  color: textP,
                                }}
                              >
                                {coupon.data.price.toLocaleString("en-IN")}
                              </span>
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
                            transition={{
                              duration: 0.22,
                              ease: [0.34, 1.2, 0.64, 1],
                            }}
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
                                style={{
                                  letterSpacing: "-0.05em",
                                  color: textP,
                                }}
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
                          {coupon.code} — save {fmt(coupon.data.savings)}/month
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
                onApply={(code, data) => setCoupon({ code, data })}
                onRemove={() => setCoupon(null)}
              /> */}

              {/* Trust */}
              {/* <div
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
                  <strong>3-day free trial</strong> · Cancel anytime · Secured
                  by Razorpay
                </p>
              </div> */}

              {/* CTA */}
              <div>
                <motion.button
                  onClick={handleSubscribe}
                  disabled={loading}
                  whileTap={{ scale: 0.975 }}
                  className="w-full py-4 rounded-[18px] text-white text-[14.5px] font-black flex items-center justify-center gap-2 relative overflow-hidden disabled:opacity-60"
                  style={{
                    background: PLAN.gradient,
                    boxShadow: "0 10px 32px rgba(217,119,6,0.45)",
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
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  {loading ? (
                    <RefreshCw size={16} className="animate-spin relative" />
                  ) : (
                    <Zap size={16} className="relative" />
                  )}
                  <span className="relative">
                    {loading ? "Loading…" : `Pay Now ${fmt(effectivePrice)}/mo`}
                    {/* : `Start Free Trial · ${fmt(effectivePrice)}/mo`} */}
                  </span>
                </motion.button>
                {/* <p
                  className="text-center text-[10.5px] mt-1.5 font-medium"
                  style={{ color: dark ? "#2d3f58" : "#94a3b8" }}
                >
                  Free for 7 days · then {fmt(effectivePrice)}/month · cancel
                  anytime
                </p> */}
              </div>
            </motion.div>
          )}

          {/* ══ PROCESSING ══ */}
          {screen === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center"
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
                  background: dark
                    ? "rgba(59,130,246,0.08)"
                    : "rgba(219,234,254,0.6)",
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
          )}

          {/* ══ SUCCESS ══ */}
          {screen === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center text-center pt-10 gap-4"
            >
              <motion.div
                style={{
                  position: "relative",
                  width: 100,
                  height: 100,
                  marginBottom: 8,
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
                className="text-[26px] font-black"
                style={{ letterSpacing: "-0.04em", color: textP }}
              >
                You're in! 🎉
              </h1>
              <p className="text-[13px] font-medium" style={{ color: textS }}>
                Croissix plan activated. Welcome to Croissix!
              </p>
              {/* <div
                className="w-full rounded-2xl p-3.5 flex items-center gap-3 text-left"
                style={{
                  background: dark
                    ? "rgba(34,197,94,0.07)"
                    : "rgba(220,252,231,0.6)",
                  border: `1.5px solid ${dark ? "rgba(34,197,94,0.14)" : "rgba(134,239,172,0.4)"}`,
                }}
              >
                <Clock size={14} style={{ color: "#22c55e", flexShrink: 0 }} />
                <div>
                  <p
                    className="text-[12.5px] font-extrabold m-0"
                    style={{ color: dark ? "#4ade80" : "#15803d" }}
                  >
                    Trial active — 7 days free
                  </p>
                  <p
                    className="text-[10.5px] mt-0.5 m-0"
                    style={{ color: dark ? "#16a34a" : "#16a34a" }}
                  >
                    First charge on{" "}
                    {fmtDate(new Date(Date.now() + 7 * 86400000))} · Cancel
                    anytime
                  </p>
                </div>
              </div> */}
              <motion.button
                // onClick={() => window.location.reload()}
                onClick={async () => {
                  await refetchSubscription();
                  // If still on gate, the isActive check in the guard will now pass
                  // and render children automatically — no reload needed
                }}
                whileTap={{ scale: 0.975 }}
                className="w-full py-4 rounded-[18px] text-white text-[15px] font-black relative overflow-hidden mt-1"
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
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                <span className="relative">Enter Croissix →</span>
              </motion.button>
            </motion.div>
          )}

          {/* ══ FAILED ══ */}
          {screen === "failed" && (
            <motion.div
              key="failed"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.32 }}
              className="flex flex-col items-center text-center pt-10 gap-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, x: [0, -5, 5, -2, 2, 0] }}
                transition={{
                  scale: { duration: 0.42, ease: [0.34, 1.4, 0.64, 1] },
                  x: { delay: 0.45, duration: 0.4 },
                }}
                className="rounded-full flex items-center justify-center"
                style={{
                  width: 72,
                  height: 72,
                  background: dark
                    ? "rgba(239,68,68,0.1)"
                    : "rgba(254,226,226,0.8)",
                  border: "2px solid rgba(239,68,68,0.25)",
                }}
              >
                <XCircle
                  size={34}
                  style={{ color: "#ef4444" }}
                  strokeWidth={1.8}
                />
              </motion.div>
              <h1
                className="text-[24px] font-black"
                style={{ letterSpacing: "-0.04em", color: textP }}
              >
                Payment Failed
              </h1>
              <p
                className="text-[13px] font-medium"
                style={{ color: textS, maxWidth: 260 }}
              >
                No charges were made.
              </p>
              {failMsg && (
                <div
                  className="w-full rounded-2xl p-3.5 flex items-start gap-2.5 text-left"
                  style={{
                    background: dark
                      ? "rgba(239,68,68,0.07)"
                      : "rgba(254,226,226,0.5)",
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
                    {failMsg}
                  </p>
                </div>
              )}
              <div
                className="w-full rounded-2xl p-3.5 flex items-center gap-2.5 text-left"
                style={{
                  background: dark
                    ? "rgba(37,99,235,0.07)"
                    : "rgba(219,234,254,0.5)",
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
              <div className="w-full flex flex-col gap-2.5 mt-1">
                <button
                  onClick={handleSubscribe}
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
                  onClick={() => setScreen("plans")}
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
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   GUARD
══════════════════════════════════════════════════ */
export default function SubscriptionGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setAuthed(true);
  }, [router]);

  const { isActive, isLoading: subLoading, subscription } = useSubscription();
  const isExempt = EXEMPT.some((p) => pathname?.startsWith(p));
  console.log(
    "Subscription is active: ",
    isActive,
    " subcription: ",
    subscription,
  );

  if (!authed) return null;
  if (subLoading) return <AppSkeleton dark={dark} />;
  if (isActive || isExempt) return <>{children}</>;
  return <SubscriptionGate dark={dark} />;
}
