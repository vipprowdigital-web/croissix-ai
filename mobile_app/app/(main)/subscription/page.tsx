// mobile_app\app\(main)\subscription\page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
  Check,
  Zap,
  Crown,
  Building2,
  ChevronRight,
  ArrowLeft,
  Shield,
  MessageSquare,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  Bell,
  TrendingUp,
  BarChart2,
  Sparkles,
  Star,
  Lock,
  AlertCircle,
} from "lucide-react";

/* ═══════════════════════════════════════════
   TYPES
═══════════════════════════════════════════ */
type Screen = "plans" | "processing" | "success" | "failed";
type PlanId = "starter" | "pro" | "agency";
type Cycle = "monthly" | "yearly";

interface Plan {
  id: PlanId;
  name: string;
  monthlyPrice: number; // in paise
  yearlyPrice: number; // in paise (per month, billed yearly)
  color: string;
  gradient: string;
  badge?: string;
  icon: React.ReactNode;
  features: { text: string; highlight?: boolean }[];
  locationsLabel: string;
  postsLabel: string;
  razorpayMonthlyPlanId: string; // your Razorpay plan IDs
  razorpayYearlyPlanId: string;
}

/* ═══════════════════════════════════════════
   PLAN DATA  — swap in your Razorpay plan IDs
═══════════════════════════════════════════ */
const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 99900,
    yearlyPrice: 79900,
    color: "#3b82f6",
    gradient: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
    icon: <Zap size={16} />,
    locationsLabel: "1 location",
    postsLabel: "5 posts/mo",
    razorpayMonthlyPlanId: "plan_starter_monthly",
    razorpayYearlyPlanId: "plan_starter_yearly",
    features: [
      { text: "1 Google Business location" },
      { text: "30-day analytics" },
      { text: "Review monitoring" },
      { text: "5 posts / month" },
      { text: "Basic AI insights" },
      { text: "Email support" },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 249900,
    yearlyPrice: 199900,
    color: "#2563eb",
    gradient: "linear-gradient(135deg,#1e40af,#2563eb,#3b82f6)",
    badge: "Most Popular",
    icon: <Crown size={16} />,
    locationsLabel: "3 locations",
    postsLabel: "Unlimited posts",
    razorpayMonthlyPlanId: "plan_pro_monthly",
    razorpayYearlyPlanId: "plan_pro_yearly",
    features: [
      { text: "3 Google Business locations" },
      { text: "90-day analytics" },
      { text: "AI review replies", highlight: true },
      { text: "Unlimited posts" },
      { text: "Competitor analysis", highlight: true },
      { text: "CSV & PDF export" },
      { text: "Priority support" },
    ],
  },
  {
    id: "agency",
    name: "Agency",
    monthlyPrice: 599900,
    yearlyPrice: 479900,
    color: "#1d4ed8",
    gradient: "linear-gradient(135deg,#0f172a,#1e3a8a,#1d4ed8)",
    badge: "Best Value",
    icon: <Building2 size={16} />,
    locationsLabel: "Unlimited locations",
    postsLabel: "Unlimited posts",
    razorpayMonthlyPlanId: "plan_agency_monthly",
    razorpayYearlyPlanId: "plan_agency_yearly",
    features: [
      { text: "Unlimited locations", highlight: true },
      { text: "Unlimited history" },
      { text: "White-label reports", highlight: true },
      { text: "AI post generator" },
      { text: "Multi-user access", highlight: true },
      { text: "API access" },
      { text: "Dedicated manager", highlight: true },
    ],
  },
];

/* ═══════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════ */
const fmtRupees = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN")}`;

/* ═══════════════════════════════════════════
   RAZORPAY SUBSCRIPTION HOOK
═══════════════════════════════════════════ */
declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) return resolve(true);
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

interface UseRazorpayOpts {
  planRazorpayId: string;
  planName: string;
  amountPaise: number;
  onSuccess: (subscriptionId: string, paymentId: string) => void;
  onFail: (reason: string) => void;
  onDismiss: () => void;
}

function useRazorpay() {
  // Call this to open the Razorpay checkout
  async function openCheckout(opts: UseRazorpayOpts) {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      opts.onFail("Failed to load payment SDK");
      return;
    }

    // 1. Create a subscription on your backend
    let subscriptionId: string;
    try {
      const res = await fetch("/api/razorpay/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ planId: opts.planRazorpayId }),
      });
      const json = await res.json();
      if (!json.subscriptionId)
        throw new Error(json.error ?? "Could not create subscription");
      subscriptionId = json.subscriptionId;
    } catch (e: any) {
      opts.onFail(e.message);
      return;
    }

    // 2. Open Razorpay modal
    const rzp = new window.Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      subscription_id: subscriptionId,
      name: "Your App Name",
      description: `${opts.planName} Plan Subscription`,
      image: "/logo.png",
      theme: { color: "#2563eb" },
      handler(response: any) {
        opts.onSuccess(subscriptionId, response.razorpay_payment_id);
      },
      modal: {
        ondismiss() {
          opts.onDismiss();
        },
      },
    });
    rzp.open();

    rzp.on("payment.failed", (resp: any) => {
      opts.onFail(resp.error?.description ?? "Payment failed");
    });
  }

  return { openCheckout };
}

/* ═══════════════════════════════════════════
   STEP DOTS
═══════════════════════════════════════════ */
function StepDots({ step, dark }: { step: number; dark: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <motion.div
            animate={{
              width: i === step ? 20 : 8,
              background:
                i < step
                  ? "#3b82f6"
                  : i === step
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
                width: 12,
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

/* ═══════════════════════════════════════════
   PLANS SCREEN
═══════════════════════════════════════════ */
function PlansScreen({
  dark,
  onSelect,
}: {
  dark: boolean;
  onSelect: (plan: Plan, cycle: Cycle) => void;
}) {
  const [cycle, setCycle] = useState<Cycle>("yearly");
  const [active, setActive] = useState<PlanId>("pro");
  const activePlan = PLANS.find((p) => p.id === active)!;
  const price =
    cycle === "yearly" ? activePlan.yearlyPrice : activePlan.monthlyPrice;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        paddingBottom: 120,
      }}
    >
      {/* HERO */}
      <div style={{ paddingTop: 4 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1.15,
            color: dark ? "#fff" : "#0f172a",
            margin: 0,
          }}
        >
          Unlock the full
          <br />
          <span style={{ color: "#3b82f6" }}>analytics suite</span>
        </h1>
        <p
          style={{
            fontSize: 13,
            marginTop: 6,
            color: dark ? "#64748b" : "#64748b",
            fontWeight: 500,
            margin: "6px 0 0",
          }}
        >
          AI-powered Google Business insights
        </p>
      </div>

      {/* BILLING TOGGLE */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={() => setCycle("monthly")}
          style={{
            fontSize: 12,
            fontWeight: 700,
            padding: "5px 12px",
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            background:
              cycle === "monthly"
                ? dark
                  ? "rgba(59,130,246,0.2)"
                  : "rgba(59,130,246,0.1)"
                : "transparent",
            color:
              cycle === "monthly" ? "#3b82f6" : dark ? "#475569" : "#94a3b8",
          }}
        >
          Monthly
        </button>

        <motion.div
          onClick={() =>
            setCycle((c) => (c === "monthly" ? "yearly" : "monthly"))
          }
          style={{
            width: 38,
            height: 20,
            borderRadius: 99,
            cursor: "pointer",
            position: "relative",
            flexShrink: 0,
            background:
              cycle === "yearly"
                ? "#3b82f6"
                : dark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.1)",
          }}
        >
          <motion.div
            animate={{ x: cycle === "yearly" ? 19 : 2 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            style={{
              position: "absolute",
              top: 2,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "#fff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }}
          />
        </motion.div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={() => setCycle("yearly")}
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: "5px 12px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              background:
                cycle === "yearly"
                  ? dark
                    ? "rgba(59,130,246,0.2)"
                    : "rgba(59,130,246,0.1)"
                  : "transparent",
              color:
                cycle === "yearly" ? "#3b82f6" : dark ? "#475569" : "#94a3b8",
            }}
          >
            Yearly
          </button>
          <span
            style={{
              fontSize: 9,
              fontWeight: 900,
              padding: "2px 6px",
              borderRadius: 99,
              background: "#22c55e",
              color: "#fff",
            }}
          >
            −20%
          </span>
        </div>
      </div>

      {/* PLAN CARDS */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {PLANS.map((plan, idx) => {
          const isActive = active === plan.id;
          const planPrice =
            cycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.3 }}
              onClick={() => setActive(plan.id)}
              whileTap={{ scale: 0.99 }}
              style={{
                borderRadius: 20,
                cursor: "pointer",
                overflow: "hidden",
                position: "relative",
                border: `2px solid ${isActive ? plan.color : dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)"}`,
                background: isActive
                  ? dark
                    ? "rgba(37,99,235,0.08)"
                    : "rgba(219,234,254,0.4)"
                  : dark
                    ? "#0f1a2e"
                    : "#fff",
                boxShadow: isActive
                  ? `0 0 0 3px rgba(59,130,246,0.15), 0 8px 32px rgba(37,99,235,0.15)`
                  : dark
                    ? "none"
                    : "0 1px 4px rgba(0,0,0,0.04)",
                transition:
                  "border-color 0.2s, background 0.2s, box-shadow 0.2s",
              }}
            >
              <div style={{ padding: "14px 14px 0" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    {/* radio */}
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: `2px solid ${isActive ? plan.color : dark ? "#334155" : "#cbd5e1"}`,
                        background: isActive ? plan.color : "transparent",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.18s",
                      }}
                    >
                      {isActive && (
                        <div
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: "#fff",
                          }}
                        />
                      )}
                    </div>

                    {/* icon */}
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        background: isActive
                          ? plan.gradient
                          : dark
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(59,130,246,0.08)",
                      }}
                    >
                      <span style={{ color: isActive ? "#fff" : plan.color }}>
                        {plan.icon}
                      </span>
                    </div>

                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 800,
                            letterSpacing: "-0.02em",
                            color: dark ? "#fff" : "#0f172a",
                          }}
                        >
                          {plan.name}
                        </span>
                        {plan.badge && (
                          <span
                            style={{
                              fontSize: 8.5,
                              fontWeight: 900,
                              padding: "2px 7px",
                              borderRadius: 99,
                              background: plan.gradient,
                              color: "#fff",
                            }}
                          >
                            {plan.badge}
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: 10,
                          color: dark ? "#475569" : "#94a3b8",
                          fontWeight: 500,
                          margin: "1px 0 0",
                        }}
                      >
                        {plan.locationsLabel} · {plan.postsLabel}
                      </p>
                    </div>
                  </div>

                  {/* price */}
                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        fontSize: 20,
                        fontWeight: 900,
                        letterSpacing: "-0.04em",
                        color: dark ? "#fff" : "#0f172a",
                      }}
                    >
                      {fmtRupees(planPrice)}
                    </span>
                    <p
                      style={{
                        fontSize: 9,
                        color: dark ? "#475569" : "#94a3b8",
                        fontWeight: 600,
                        margin: "1px 0 0",
                      }}
                    >
                      {cycle === "yearly" ? "mo · yearly" : "/ mo"}
                    </p>
                    {cycle === "yearly" && (
                      <p
                        style={{
                          fontSize: 8.5,
                          color: dark ? "#2d3f58" : "#cbd5e1",
                          textDecoration: "line-through",
                          margin: 0,
                        }}
                      >
                        {fmtRupees(plan.monthlyPrice)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* expanded features */}
              <AnimatePresence initial={false}>
                {isActive && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div
                      style={{
                        padding: "10px 14px 14px",
                        borderTop: `1px solid ${dark ? "rgba(255,255,255,0.05)" : "rgba(59,130,246,0.08)"}`,
                        marginTop: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "6px 10px",
                        }}
                      >
                        {plan.features.map((f, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <div
                              style={{
                                width: 14,
                                height: 14,
                                borderRadius: 7,
                                flexShrink: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: f.highlight
                                  ? plan.gradient
                                  : dark
                                    ? "rgba(59,130,246,0.18)"
                                    : "rgba(59,130,246,0.1)",
                              }}
                            >
                              <Check
                                size={8}
                                color={f.highlight ? "#fff" : "#3b82f6"}
                                strokeWidth={3}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: 10.5,
                                lineHeight: 1.3,
                                color: dark
                                  ? f.highlight
                                    ? "#bfdbfe"
                                    : "#94a3b8"
                                  : f.highlight
                                    ? "#1d4ed8"
                                    : "#64748b",
                                fontWeight: f.highlight ? 700 : 500,
                              }}
                            >
                              {f.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* TRUST */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          borderRadius: 16,
          padding: "11px 14px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: dark ? "rgba(37,99,235,0.07)" : "rgba(219,234,254,0.5)",
          border: `1px solid ${dark ? "rgba(59,130,246,0.12)" : "rgba(147,197,253,0.4)"}`,
        }}
      >
        <Shield size={13} style={{ color: "#3b82f6", flexShrink: 0 }} />
        <p
          style={{
            fontSize: 11,
            color: dark ? "#93c5fd" : "#1d4ed8",
            fontWeight: 600,
            margin: 0,
          }}
        >
          <strong>7-day free trial</strong> · Cancel anytime · No setup fees
        </p>
      </motion.div>

      {/* STICKY CTA */}
      <div
        style={{
          position: "fixed",
          bottom: 45,
          left: 0,
          right: 0,
          padding: "10px 16px 24px",
          background: dark
            ? "linear-gradient(to top,#080f1e 60%,transparent)"
            : "linear-gradient(to top,#eef4ff 60%,transparent)",
        }}
      >
        <div style={{ maxWidth: 440, margin: "0 auto" }}>
          <motion.button
            onClick={() => onSelect(activePlan, cycle)}
            whileTap={{ scale: 0.975 }}
            style={{
              width: "100%",
              padding: "15px 20px",
              borderRadius: 18,
              border: "none",
              background: activePlan.gradient,
              color: "#fff",
              fontSize: 14,
              fontWeight: 900,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 8px 28px rgba(37,99,235,0.32)",
              letterSpacing: "-0.01em",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <motion.div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)",
              }}
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            />
            <span style={{ position: "relative" }}>
              Start {activePlan.name} · {fmtRupees(price)}/mo
            </span>
            <ChevronRight size={15} style={{ position: "relative" }} />
          </motion.button>
          <p
            style={{
              textAlign: "center",
              fontSize: 10,
              marginTop: 6,
              color: dark ? "#2d3f58" : "#94a3b8",
              fontWeight: 500,
            }}
          >
            Billed{" "}
            {cycle === "yearly" ? `${fmtRupees(price * 12)} yearly` : "monthly"}{" "}
            · Free for first 7 days
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   PROCESSING SCREEN  (while Razorpay is open)
═══════════════════════════════════════════ */
function ProcessingScreen({
  dark,
  planName,
}: {
  dark: boolean;
  planName: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: 16,
        textAlign: "center",
      }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <RefreshCw size={28} style={{ color: "#3b82f6" }} />
      </motion.div>
      <div>
        <p
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: dark ? "#fff" : "#0f172a",
            margin: "0 0 4px",
          }}
        >
          Opening Razorpay…
        </p>
        <p
          style={{
            fontSize: 12,
            color: dark ? "#64748b" : "#94a3b8",
            fontWeight: 500,
            margin: 0,
          }}
        >
          Setting up your {planName} subscription
        </p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   SUCCESS SCREEN
═══════════════════════════════════════════ */
function SuccessScreen({
  dark,
  plan,
  cycle,
  subscriptionId,
  onDone,
}: {
  dark: boolean;
  plan: Plan;
  cycle: Cycle;
  subscriptionId: string;
  onDone: () => void;
}) {
  const price = cycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

  const unlocked = [
    { icon: <BarChart2 size={13} />, label: "Analytics", color: "#3b82f6" },
    {
      icon: <MessageSquare size={13} />,
      label: "AI Insights",
      color: "#2563eb",
    },
    { icon: <Star size={13} />, label: "Reviews", color: "#f59e0b" },
    { icon: <TrendingUp size={13} />, label: "Competitor", color: "#22c55e" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        paddingBottom: 120,
      }}
    >
      {/* CHECK CIRCLE */}
      <motion.div style={{ position: "relative", margin: "28px 0 24px" }}>
        {[64, 82, 100].map((size, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.15 + i * 0.08,
              duration: 0.4,
              ease: [0.34, 1.3, 0.64, 1],
            }}
            style={{
              position: "absolute",
              borderRadius: "50%",
              border: `1.5px solid rgba(59,130,246,${0.3 - i * 0.08})`,
              width: size,
              height: size,
              top: (100 - size) / 2,
              left: (100 - size) / 2,
            }}
          />
        ))}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.45, ease: [0.34, 1.4, 0.64, 1] }}
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
            boxShadow: "0 12px 40px rgba(37,99,235,0.4)",
            position: "relative",
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
            <CheckCircle2 size={36} color="#fff" strokeWidth={1.8} />
          </motion.div>
        </motion.div>
        {/* particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{
              x: Math.cos((i / 6) * Math.PI * 2) * 52,
              y: Math.sin((i / 6) * Math.PI * 2) * 52,
              opacity: 0,
              scale: 0,
            }}
            transition={{ delay: 0.25, duration: 0.55, ease: "easeOut" }}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 5,
              height: 5,
              borderRadius: "50%",
              marginTop: -2.5,
              marginLeft: -2.5,
              background: "#3b82f6",
            }}
          />
        ))}
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          fontSize: 24,
          fontWeight: 900,
          letterSpacing: "-0.04em",
          color: dark ? "#fff" : "#0f172a",
          margin: "0 0 6px",
        }}
      >
        You're all set! 🎉
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        style={{
          fontSize: 13,
          color: dark ? "#64748b" : "#64748b",
          fontWeight: 500,
          margin: "0 0 6px",
        }}
      >
        {plan.name} plan activated
      </motion.p>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 24,
        }}
      >
        <span
          style={{
            padding: "3px 10px",
            borderRadius: 99,
            fontSize: 11,
            fontWeight: 900,
            background: plan.gradient,
            color: "#fff",
          }}
        >
          {plan.name}
        </span>
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: dark ? "#475569" : "#94a3b8",
          }}
        >
          {fmtRupees(price)}/mo · {cycle === "yearly" ? "Yearly" : "Monthly"}
        </span>
      </motion.div>

      {/* SUBSCRIPTION ID */}
      {subscriptionId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          style={{
            width: "100%",
            borderRadius: 14,
            padding: "10px 14px",
            marginBottom: 12,
            background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
            border: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
          }}
        >
          <p
            style={{
              fontSize: 10,
              color: dark ? "#334155" : "#94a3b8",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              margin: "0 0 3px",
            }}
          >
            Subscription ID
          </p>
          <p
            style={{
              fontSize: 11,
              fontFamily: "monospace",
              color: dark ? "#60a5fa" : "#2563eb",
              fontWeight: 700,
              margin: 0,
              wordBreak: "break-all",
            }}
          >
            {subscriptionId}
          </p>
        </motion.div>
      )}

      {/* UNLOCKED */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          width: "100%",
          borderRadius: 20,
          padding: 14,
          background: dark ? "#0f1a2e" : "#fff",
          border: `1.5px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(203,213,225,0.5)"}`,
          boxShadow: dark ? "none" : "0 2px 12px rgba(0,0,0,0.04)",
          marginBottom: 12,
          textAlign: "left",
        }}
      >
        <p
          style={{
            fontSize: 10,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: dark ? "#334155" : "#94a3b8",
            margin: "0 0 10px",
          }}
        >
          Now active
        </p>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
        >
          {unlocked.map((u, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 + i * 0.05 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 10px",
                borderRadius: 12,
                background: dark
                  ? "rgba(59,130,246,0.05)"
                  : "rgba(239,246,255,0.8)",
                border: `1px solid ${dark ? "rgba(59,130,246,0.08)" : "rgba(147,197,253,0.25)"}`,
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 9,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `${u.color}18`,
                  color: u.color,
                }}
              >
                {u.icon}
              </div>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: dark ? "#e2e8f0" : "#1e293b",
                }}
              >
                {u.label}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* TRIAL */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          width: "100%",
          borderRadius: 16,
          padding: "11px 14px",
          marginBottom: 4,
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: dark ? "rgba(34,197,94,0.07)" : "rgba(220,252,231,0.6)",
          border: `1.5px solid ${dark ? "rgba(34,197,94,0.14)" : "rgba(134,239,172,0.4)"}`,
        }}
      >
        <Clock size={14} style={{ color: "#22c55e", flexShrink: 0 }} />
        <div style={{ textAlign: "left" }}>
          <p
            style={{
              fontSize: 12.5,
              fontWeight: 800,
              color: dark ? "#4ade80" : "#15803d",
              margin: 0,
            }}
          >
            Trial ends in 7 days
          </p>
          <p
            style={{
              fontSize: 10.5,
              color: dark ? "#16a34a" : "#16a34a",
              fontWeight: 500,
              margin: "2px 0 0",
            }}
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

      {/* CTA */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "10px 16px 24px",
          background: dark
            ? "linear-gradient(to top,#080f1e 60%,transparent)"
            : "linear-gradient(to top,#eef4ff 60%,transparent)",
        }}
      >
        <div style={{ maxWidth: 440, margin: "0 auto" }}>
          <motion.button
            onClick={onDone}
            whileTap={{ scale: 0.975 }}
            style={{
              width: "100%",
              padding: "15px 20px",
              borderRadius: 18,
              border: "none",
              background: plan.gradient,
              color: "#fff",
              fontSize: 14,
              fontWeight: 900,
              cursor: "pointer",
              boxShadow: "0 8px 28px rgba(37,99,235,0.32)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <motion.div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)",
              }}
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            />
            <span style={{ position: "relative" }}>Go to Dashboard →</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   FAILED SCREEN
═══════════════════════════════════════════ */
function FailedScreen({
  dark,
  reason,
  onRetry,
  onChangePlan,
}: {
  dark: boolean;
  reason: string;
  onRetry: () => void;
  onChangePlan: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        paddingBottom: 140,
      }}
    >
      {/* X CIRCLE */}
      <motion.div style={{ position: "relative", margin: "28px 0 22px" }}>
        {[64, 84].map((size, i) => (
          <motion.div key={i} />
        ))}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, x: [0, -4, 4, -2, 2, 0] }}
          transition={{
            scale: { duration: 0.42, ease: [0.34, 1.4, 0.64, 1] },
            x: { delay: 0.45, duration: 0.4 },
          }}
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: dark ? "rgba(239,68,68,0.1)" : "rgba(254,226,226,0.8)",
            border: "2px solid rgba(239,68,68,0.25)",
          }}
        >
          <XCircle size={34} style={{ color: "#ef4444" }} strokeWidth={1.8} />
        </motion.div>
      </motion.div>

      <h1
        style={{
          fontSize: 24,
          fontWeight: 900,
          letterSpacing: "-0.04em",
          color: dark ? "#fff" : "#0f172a",
          margin: "0 0 6px",
        }}
      >
        Payment Failed
      </h1>
      <p
        style={{
          fontSize: 13,
          color: dark ? "#64748b" : "#64748b",
          fontWeight: 500,
          margin: "0 0 24px",
          maxWidth: 260,
        }}
      >
        No charges were made to your account.
      </p>

      {/* ERROR REASON */}
      {reason && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            width: "100%",
            borderRadius: 16,
            padding: "11px 14px",
            marginBottom: 14,
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            background: dark ? "rgba(239,68,68,0.07)" : "rgba(254,226,226,0.5)",
            border: `1.5px solid ${dark ? "rgba(239,68,68,0.15)" : "rgba(252,165,165,0.4)"}`,
          }}
        >
          <AlertCircle
            size={14}
            style={{ color: "#ef4444", marginTop: 1, flexShrink: 0 }}
          />
          <p
            style={{
              fontSize: 12,
              color: dark ? "#fca5a5" : "#991b1b",
              fontWeight: 600,
              margin: 0,
              textAlign: "left",
            }}
          >
            {reason}
          </p>
        </motion.div>
      )}

      {/* HELP */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        style={{
          width: "100%",
          borderRadius: 16,
          padding: "11px 14px",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: dark ? "rgba(37,99,235,0.07)" : "rgba(219,234,254,0.5)",
          border: `1px solid ${dark ? "rgba(59,130,246,0.1)" : "rgba(147,197,253,0.35)"}`,
        }}
      >
        <Bell size={13} style={{ color: "#3b82f6", flexShrink: 0 }} />
        <p
          style={{
            fontSize: 11.5,
            color: dark ? "#93c5fd" : "#1d4ed8",
            fontWeight: 600,
            margin: 0,
            textAlign: "left",
          }}
        >
          Need help? Email <strong>support@yourapp.com</strong>
        </p>
      </motion.div>

      {/* CTAs */}
      <div
        style={{
          position: "relative",
          padding: "10px 16px 24px",
          marginTop: "20px",
          width: "100%",
          background: dark
            ? "linear-gradient(to top,#080f1e 60%,transparent)"
            : "linear-gradient(to top,#eef4ff 60%,transparent)",
        }}
      >
        <div
          style={{
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <motion.button
            onClick={onRetry}
            whileTap={{ scale: 0.975 }}
            style={{
              width: "100%",
              padding: "15px 20px",
              borderRadius: 18,
              border: "none",
              background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 900,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 8px 28px rgba(37,99,235,0.32)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <motion.div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)",
              }}
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <RefreshCw size={14} style={{ position: "relative" }} />
            <span style={{ position: "relative" }}>Try Again</span>
          </motion.button>
          <motion.button
            onClick={onChangePlan}
            whileTap={{ scale: 0.975 }}
            style={{
              width: "100%",
              padding: "13px 20px",
              borderRadius: 18,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              background: "transparent",
              border: `1.5px solid ${dark ? "rgba(255,255,255,0.09)" : "rgba(203,213,225,0.7)"}`,
              color: dark ? "#64748b" : "#64748b",
            }}
          >
            Change Plan
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   ROOT PAGE
═══════════════════════════════════════════ */
export default function SubscriptionPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";

  const [screen, setScreen] = useState<Screen>("plans");
  const [selectedPlan, setSelectedPlan] = useState<Plan>(PLANS[1]);
  const [selectedCycle, setSelectedCycle] = useState<Cycle>("yearly");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [failReason, setFailReason] = useState("");

  const { openCheckout } = useRazorpay();

  const stepIndex =
    screen === "plans"
      ? 0
      : screen === "checkout" || screen === "processing"
        ? 1
        : 2;

  function handleSelectPlan(plan: Plan, cycle: Cycle) {
    setSelectedPlan(plan);
    setSelectedCycle(cycle);
    setScreen("processing");

    openCheckout({
      planRazorpayId:
        cycle === "yearly"
          ? plan.razorpayYearlyPlanId
          : plan.razorpayMonthlyPlanId,
      planName: plan.name,
      amountPaise: cycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice,
      onSuccess(subId, paymentId) {
        setSubscriptionId(subId);
        setScreen("success");
      },
      onFail(reason) {
        setFailReason(reason);
        setScreen("failed");
      },
      onDismiss() {
        // user closed modal — go back to plans
        setScreen("plans");
      },
    });
  }

  const bg = dark
    ? "linear-gradient(150deg,#050d1a 0%,#080f1e 100%)"
    : "linear-gradient(150deg,#eef4ff 0%,#f0f5ff 100%)";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: bg,
        fontFamily: "-apple-system,'SF Pro Text',sans-serif",
        transition: "background 0.35s",
      }}
    >
      {/* subtle ambient orb — just one, lightweight */}
      <div
        style={{
          position: "fixed",
          top: -80,
          left: "50%",
          transform: "translateX(-50%)",
          width: 420,
          height: 420,
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 0,
          background:
            "radial-gradient(circle,rgba(37,99,235,0.12) 0%,transparent 70%)",
        }}
      />

      <div
        style={{
          maxWidth: 440,
          margin: "0 auto",
          padding: "0 16px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* TOP BAR */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 16,
            paddingBottom: 4,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AnimatePresence>
              {screen === "failed" && (
                <motion.button
                  key="back"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  onClick={() => setScreen("plans")}
                  whileTap={{ scale: 0.88 }}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
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
          {/* security badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              color: dark ? "#334155" : "#94a3b8",
            }}
          >
            <Lock size={11} />
            <span style={{ fontSize: 10, fontWeight: 700 }}>
              Secured by Razorpay
            </span>
          </div>
        </motion.div>

        {/* SCREENS */}
        <AnimatePresence mode="wait">
          {screen === "plans" && (
            <motion.div
              key="plans"
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.28 }}
            >
              <PlansScreen dark={dark} onSelect={handleSelectPlan} />
            </motion.div>
          )}

          {screen === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              <ProcessingScreen dark={dark} planName={selectedPlan.name} />
            </motion.div>
          )}

          {screen === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32 }}
            >
              <SuccessScreen
                dark={dark}
                plan={selectedPlan}
                cycle={selectedCycle}
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
              transition={{ duration: 0.32 }}
            >
              <FailedScreen
                dark={dark}
                reason={failReason}
                onRetry={() => handleSelectPlan(selectedPlan, selectedCycle)}
                onChangePlan={() => setScreen("plans")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
