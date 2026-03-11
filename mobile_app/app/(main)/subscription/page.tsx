// mobile_app\app\(main)\subscription\page.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Zap,
  Crown,
  Building2,
  ChevronRight,
  ArrowLeft,
  Lock,
  CreditCard,
  Shield,
  Star,
  MessageSquare,
  FileText,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  Bell,
  TrendingUp,
  BarChart2,
  Sparkles,
  X,
  Moon,
  Sun,
  Wifi,
  Phone,
  Globe,
  Navigation,
  Eye,
  Award,
  Infinity,
  ChevronDown,
} from "lucide-react";

/* ═══════════════════════════════════════════
   TYPES
═══════════════════════════════════════════ */
type Screen = "plans" | "checkout" | "success" | "failed";
type PlanId = "starter" | "pro" | "agency";
type Cycle = "monthly" | "yearly";

interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  color: string;
  accentDark: string;
  gradient: string;
  glowColor: string;
  badge?: string;
  icon: React.ReactNode;
  features: { text: string; highlight?: boolean }[];
  locationsLabel: string;
  postsLabel: string;
}

/* ═══════════════════════════════════════════
   PLAN DATA
═══════════════════════════════════════════ */
const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Perfect for single-location businesses",
    monthlyPrice: 999,
    yearlyPrice: 799,
    color: "#3b82f6",
    accentDark: "#60a5fa",
    gradient: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
    glowColor: "rgba(59,130,246,0.35)",
    icon: <Zap size={16} />,
    locationsLabel: "1 location",
    postsLabel: "5 posts/mo",
    features: [
      { text: "1 Google Business location" },
      { text: "30-day analytics history" },
      { text: "Review monitoring" },
      { text: "5 posts per month" },
      { text: "Basic AI insights" },
      { text: "Email support" },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For growing multi-location brands",
    monthlyPrice: 2499,
    yearlyPrice: 1999,
    color: "#3b82f6",
    accentDark: "#93c5fd",
    gradient: "linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)",
    glowColor: "rgba(37,99,235,0.45)",
    badge: "Most Popular",
    icon: <Crown size={16} />,
    locationsLabel: "3 locations",
    postsLabel: "Unlimited posts",
    features: [
      { text: "3 Google Business locations" },
      { text: "90-day analytics history" },
      { text: "AI-powered review replies", highlight: true },
      { text: "Unlimited posts" },
      { text: "Competitor analysis", highlight: true },
      { text: "CSV & PDF export" },
      { text: "Priority support" },
    ],
  },
  {
    id: "agency",
    name: "Agency",
    tagline: "Unlimited scale for agencies",
    monthlyPrice: 5999,
    yearlyPrice: 4799,
    color: "#1d4ed8",
    accentDark: "#bfdbfe",
    gradient: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%)",
    glowColor: "rgba(29,78,216,0.5)",
    badge: "Best Value",
    icon: <Building2 size={16} />,
    locationsLabel: "Unlimited locations",
    postsLabel: "Unlimited posts",
    features: [
      { text: "Unlimited locations", highlight: true },
      { text: "Unlimited history" },
      { text: "White-label reports", highlight: true },
      { text: "AI post generator" },
      { text: "Multi-user access", highlight: true },
      { text: "API access" },
      { text: "Dedicated account manager", highlight: true },
    ],
  },
];

/* ═══════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════ */
const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const gst = (n: number) => Math.round(n * 0.18);

/* ═══════════════════════════════════════════
   VARIANTS
═══════════════════════════════════════════ */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.36, ease: [0.34, 1.2, 0.64, 1] },
  },
};
const slideIn = (dir: "left" | "right") => ({
  hidden: { opacity: 0, x: dir === "left" ? -28 : 28 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    x: dir === "left" ? 28 : -28,
    transition: { duration: 0.22 },
  },
});

/* ═══════════════════════════════════════════
   THEME TOGGLE
═══════════════════════════════════════════ */
function ThemeToggle({
  dark,
  onToggle,
}: {
  dark: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.88 }}
      className="w-9 h-9 rounded-2xl flex items-center justify-center transition-colors"
      style={{
        background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
      }}
    >
      <AnimatePresence mode="wait">
        {dark ? (
          <motion.div
            key="sun"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Sun size={15} style={{ color: "#93c5fd" }} />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Moon size={15} style={{ color: "#3b82f6" }} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* ═══════════════════════════════════════════
   STEP INDICATOR
═══════════════════════════════════════════ */
function StepDots({ step, dark }: { step: number; dark: boolean }) {
  const labels = ["Plans", "Checkout", "Done"];
  return (
    <div className="flex items-center gap-0">
      {labels.map((label, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <motion.div
                animate={{
                  width: active ? 24 : 8,
                  background: done
                    ? "#3b82f6"
                    : active
                      ? "#3b82f6"
                      : dark
                        ? "rgba(255,255,255,0.12)"
                        : "rgba(0,0,0,0.12)",
                }}
                transition={{ duration: 0.3, ease: [0.34, 1.2, 0.64, 1] }}
                style={{ height: 8, borderRadius: 99 }}
              />
            </div>
            {i < labels.length - 1 && (
              <div
                style={{
                  width: 16,
                  height: 2,
                  borderRadius: 99,
                  margin: "0 4px",
                  marginBottom: 0,
                  background: done
                    ? "#3b82f6"
                    : dark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.08)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════
   ████  PLANS SCREEN  ████
═══════════════════════════════════════════ */
function PlansScreen({
  dark,
  onSelect,
}: {
  dark: boolean;
  onSelect: (plan: PlanId, cycle: Cycle) => void;
}) {
  const [cycle, setCycle] = useState<Cycle>("yearly");
  const [active, setActive] = useState<PlanId>("pro");
  const activePlan = PLANS.find((p) => p.id === active)!;
  const price =
    cycle === "yearly" ? activePlan.yearlyPrice : activePlan.monthlyPrice;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-4 pb-36"
    >
      {/* HERO */}
      <motion.div variants={fadeUp} className="pt-1 pb-2">
        <h1
          style={{
            fontFamily: "'SF Pro Display', -apple-system, sans-serif",
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            color: dark ? "#fff" : "#0f172a",
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
            color: dark ? "rgba(148,163,184,1)" : "rgba(100,116,139,1)",
            fontWeight: 500,
          }}
        >
          Grow smarter with AI-powered Google Business insights
        </p>
      </motion.div>

      {/* BILLING TOGGLE */}
      <motion.div
        variants={fadeUp}
        className="flex items-center self-center gap-3 px-4 py-2 rounded-2xl"
        style={{
          background: dark ? "rgba(255,255,255,0.05)" : "rgba(59,130,246,0.06)",
          border: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(59,130,246,0.12)"}`,
        }}
      >
        <button
          onClick={() => setCycle("monthly")}
          style={{
            fontSize: 12,
            fontWeight: 700,
            padding: "4px 10px",
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            transition: "all 0.2s",
            background:
              cycle === "monthly"
                ? dark
                  ? "rgba(59,130,246,0.25)"
                  : "rgba(59,130,246,0.15)"
                : "transparent",
            color:
              cycle === "monthly" ? "#3b82f6" : dark ? "#64748b" : "#94a3b8",
          }}
        >
          Monthly
        </button>
        <motion.div
          onClick={() =>
            setCycle((c) => (c === "monthly" ? "yearly" : "monthly"))
          }
          style={{
            width: 40,
            height: 22,
            borderRadius: 99,
            cursor: "pointer",
            position: "relative",
            background:
              cycle === "yearly"
                ? "#3b82f6"
                : dark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.1)",
          }}
        >
          <motion.div
            animate={{ x: cycle === "yearly" ? 20 : 2 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            style={{
              position: "absolute",
              top: 3,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "#fff",
              boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            }}
          />
        </motion.div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCycle("yearly")}
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s",
              background:
                cycle === "yearly"
                  ? dark
                    ? "rgba(59,130,246,0.25)"
                    : "rgba(59,130,246,0.15)"
                  : "transparent",
              color:
                cycle === "yearly" ? "#3b82f6" : dark ? "#64748b" : "#94a3b8",
            }}
          >
            Yearly
          </button>
          <motion.span
            animate={cycle === "yearly" ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 0.35 }}
            style={{
              fontSize: 9,
              fontWeight: 900,
              padding: "2px 7px",
              borderRadius: 99,
              background: "#22c55e",
              color: "#fff",
            }}
          >
            −20%
          </motion.span>
        </div>
      </motion.div>

      {/* PLAN CARDS */}
      <motion.div variants={stagger} className="flex flex-col gap-3">
        {PLANS.map((plan) => {
          const isActive = active === plan.id;
          const planPrice =
            cycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
          const origPrice = plan.monthlyPrice;

          return (
            <motion.div
              key={plan.id}
              variants={item}
              onClick={() => setActive(plan.id)}
              whileTap={{ scale: 0.985 }}
              style={{
                borderRadius: 24,
                cursor: "pointer",
                overflow: "hidden",
                position: "relative",
                border: isActive
                  ? `2px solid ${plan.color}`
                  : `2px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                background: isActive
                  ? dark
                    ? `rgba(37,99,235,0.1)`
                    : `rgba(219,234,254,0.5)`
                  : dark
                    ? "#0f1a2e"
                    : "#fff",
                boxShadow: isActive
                  ? `0 0 0 4px ${plan.glowColor}, 0 16px 48px ${plan.glowColor}`
                  : dark
                    ? "none"
                    : "0 1px 4px rgba(0,0,0,0.05)",
                transition: "all 0.25s ease",
              }}
            >
              {/* animated glow BG */}
              {isActive && (
                <motion.div
                  style={{
                    position: "absolute",
                    top: -40,
                    right: -40,
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${plan.glowColor}, transparent 70%)`,
                    pointerEvents: "none",
                  }}
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              )}

              <div style={{ padding: "16px 16px 0 16px" }}>
                {/* header row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    {/* radio dot */}
                    <motion.div
                      animate={{
                        borderColor: isActive
                          ? plan.color
                          : dark
                            ? "#334155"
                            : "#cbd5e1",
                        background: isActive ? plan.color : "transparent",
                      }}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        border: "2px solid",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 420 }}
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#fff",
                          }}
                        />
                      )}
                    </motion.div>

                    {/* icon */}
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
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
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 15,
                            fontWeight: 900,
                            letterSpacing: "-0.02em",
                            color: dark ? "#fff" : "#0f172a",
                          }}
                        >
                          {plan.name}
                        </span>
                        {plan.badge && (
                          <motion.span
                            animate={{ scale: [1, 1.04, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{
                              fontSize: 9,
                              fontWeight: 900,
                              padding: "2px 8px",
                              borderRadius: 99,
                              background: plan.gradient,
                              color: "#fff",
                            }}
                          >
                            {plan.badge}
                          </motion.span>
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: 10.5,
                          color: dark ? "#475569" : "#94a3b8",
                          marginTop: 1,
                          fontWeight: 500,
                        }}
                      >
                        {plan.locationsLabel} · {plan.postsLabel}
                      </p>
                    </div>
                  </div>

                  {/* price */}
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 1,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: dark ? "#64748b" : "#94a3b8",
                          marginBottom: 2,
                        }}
                      >
                        ₹
                      </span>
                      <span
                        style={{
                          fontSize: 22,
                          fontWeight: 900,
                          letterSpacing: "-0.04em",
                          color: dark ? "#fff" : "#0f172a",
                        }}
                      >
                        {planPrice.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 9.5,
                        color: dark ? "#475569" : "#94a3b8",
                        fontWeight: 600,
                      }}
                    >
                      {cycle === "yearly" ? "mo · billed yearly" : "/ month"}
                    </p>
                    {cycle === "yearly" && (
                      <p
                        style={{
                          fontSize: 9,
                          color: dark ? "#334155" : "#cbd5e1",
                          textDecoration: "line-through",
                          fontWeight: 500,
                        }}
                      >
                        ₹{origPrice.toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* expanded features */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div
                      style={{
                        padding: "0 16px 16px",
                        borderTop: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(59,130,246,0.1)"}`,
                        marginTop: 0,
                        paddingTop: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "7px 8px",
                        }}
                      >
                        {plan.features.map((f, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.035 }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 7,
                            }}
                          >
                            <div
                              style={{
                                width: 16,
                                height: 16,
                                borderRadius: 8,
                                flexShrink: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: f.highlight
                                  ? plan.gradient
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
                              style={{
                                fontSize: 11,
                                color: dark
                                  ? f.highlight
                                    ? "#bfdbfe"
                                    : "#94a3b8"
                                  : f.highlight
                                    ? "#1d4ed8"
                                    : "#64748b",
                                fontWeight: f.highlight ? 700 : 500,
                                lineHeight: 1.3,
                              }}
                            >
                              {f.text}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>

      {/* TRUST STRIP */}
      <motion.div
        variants={fadeUp}
        style={{
          borderRadius: 18,
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: dark ? "rgba(37,99,235,0.08)" : "rgba(219,234,254,0.6)",
          border: `1px solid ${dark ? "rgba(59,130,246,0.15)" : "rgba(147,197,253,0.5)"}`,
        }}
      >
        <Shield size={14} style={{ color: "#3b82f6", flexShrink: 0 }} />
        <p
          style={{
            fontSize: 11.5,
            color: dark ? "#93c5fd" : "#1d4ed8",
            fontWeight: 600,
            lineHeight: 1.4,
          }}
        >
          <strong>7-day free trial</strong> · Cancel anytime · No setup fees ·
          GST inclusive
        </p>
      </motion.div>

      {/* STICKY CTA */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "12px 16px 28px",
          background: dark
            ? "linear-gradient(to top, #080f1e 55%, transparent)"
            : "linear-gradient(to top, #f0f5ff 55%, transparent)",
        }}
      >
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <motion.button
            onClick={() => onSelect(active, cycle)}
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            style={{
              width: "100%",
              padding: "16px 20px",
              borderRadius: 20,
              border: "none",
              background: activePlan.gradient,
              color: "#fff",
              fontSize: 15,
              fontWeight: 900,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: `0 12px 40px ${activePlan.glowColor}`,
              position: "relative",
              overflow: "hidden",
              letterSpacing: "-0.01em",
            }}
          >
            <motion.div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)",
                opacity: 0.8,
              }}
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
            />
            <span style={{ position: "relative" }}>
              Start {activePlan.name} · {fmt(price)}/mo
            </span>
            <ChevronRight size={16} style={{ position: "relative" }} />
          </motion.button>
          <p
            style={{
              textAlign: "center",
              fontSize: 10,
              marginTop: 7,
              color: dark ? "#334155" : "#94a3b8",
              fontWeight: 500,
            }}
          >
            Billed{" "}
            {cycle === "yearly"
              ? `₹${(price * 12).toLocaleString("en-IN")} yearly`
              : "monthly"}{" "}
            · Start free for 7 days
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   ████  CHECKOUT SCREEN  ████
═══════════════════════════════════════════ */
function CheckoutScreen({
  dark,
  planId,
  cycle,
  onSuccess,
  onFail,
}: {
  dark: boolean;
  planId: PlanId;
  cycle: Cycle;
  onSuccess: () => void;
  onFail: () => void;
}) {
  const plan = PLANS.find((p) => p.id === planId)!;
  const basePrice = cycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
  const totalBase = cycle === "yearly" ? basePrice * 12 : basePrice;
  const tax = gst(totalBase);
  const total = totalBase + tax;

  const [method, setMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [upiId, setUpiId] = useState("");
  const [cardNum, setCardNum] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [loading, setLoading] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [showCoupon, setShowCoupon] = useState(false);
  const discount = couponApplied ? Math.round(totalBase * 0.1) : 0;
  const finalTotal = total - discount;

  function fmtCard(v: string) {
    return v
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  }
  function fmtExp(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
  }

  async function pay() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2400));
    setLoading(false);
    const fail =
      upiId.toLowerCase().includes("fail") || cardNum.startsWith("4111");
    fail ? onFail() : onSuccess();
  }

  const inp = {
    width: "100%",
    padding: "13px 14px",
    borderRadius: 16,
    fontSize: 13,
    fontWeight: 600,
    border: `1.5px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(203,213,225,0.8)"}`,
    background: dark ? "rgba(255,255,255,0.05)" : "#fff",
    color: dark ? "#e2e8f0" : "#1e293b",
    outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "-apple-system, sans-serif",
  };

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-4 pb-40"
    >
      {/* ORDER SUMMARY CARD */}
      <motion.div
        variants={fadeUp}
        style={{
          borderRadius: 24,
          overflow: "hidden",
          border: `1.5px solid ${dark ? "rgba(59,130,246,0.2)" : "rgba(147,197,253,0.5)"}`,
          background: dark
            ? "linear-gradient(135deg, rgba(30,58,138,0.25), rgba(29,78,216,0.1))"
            : "linear-gradient(135deg, rgba(219,234,254,0.8), rgba(239,246,255,0.9))",
        }}
      >
        <div style={{ padding: 16 }}>
          {/* plan row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: plan.gradient,
                flexShrink: 0,
              }}
            >
              <span style={{ color: "#fff" }}>{plan.icon}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  color: dark ? "#fff" : "#0f172a",
                }}
              >
                {plan.name} Plan
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: dark ? "#4b6cb7" : "#60a5fa",
                  fontWeight: 600,
                  marginTop: 1,
                }}
              >
                Billed {cycle === "yearly" ? "annually" : "monthly"}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  color: dark ? "#fff" : "#0f172a",
                }}
              >
                {fmt(basePrice)}
              </p>
              <p
                style={{
                  fontSize: 10,
                  color: dark ? "#475569" : "#94a3b8",
                  fontWeight: 600,
                }}
              >
                /month
              </p>
            </div>
          </div>

          {/* line items */}
          <div
            style={{
              borderTop: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(147,197,253,0.3)"}`,
              paddingTop: 12,
            }}
          >
            {[
              {
                label:
                  cycle === "yearly" ? "Annual subtotal" : "Monthly subtotal",
                val: fmt(totalBase),
              },
              { label: "GST (18%)", val: fmt(tax) },
              couponApplied
                ? {
                    label: "Coupon LAUNCH10 🎉",
                    val: `−${fmt(discount)}`,
                    green: true,
                  }
                : null,
            ]
              .filter(Boolean)
              .map((row: any, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 7,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: dark ? "#64748b" : "#64748b",
                      fontWeight: 500,
                    }}
                  >
                    {row.label}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: row.green
                        ? "#22c55e"
                        : dark
                          ? "#94a3b8"
                          : "#475569",
                    }}
                  >
                    {row.val}
                  </span>
                </div>
              ))}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderTop: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(147,197,253,0.3)"}`,
                paddingTop: 10,
                marginTop: 4,
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 900,
                  color: dark ? "#fff" : "#0f172a",
                  letterSpacing: "-0.02em",
                }}
              >
                Total due today
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 900,
                  color: "#3b82f6",
                  letterSpacing: "-0.02em",
                }}
              >
                {fmt(finalTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* trial banner */}
        <div
          style={{
            padding: "10px 16px",
            background: dark ? "rgba(34,197,94,0.08)" : "rgba(220,252,231,0.7)",
            borderTop: `1px solid ${dark ? "rgba(34,197,94,0.12)" : "rgba(134,239,172,0.4)"}`,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Sparkles size={12} style={{ color: "#22c55e", flexShrink: 0 }} />
          <p
            style={{
              fontSize: 11.5,
              color: dark ? "#4ade80" : "#15803d",
              fontWeight: 600,
            }}
          >
            7-day free trial · You won't be charged until{" "}
            {new Date(Date.now() + 7 * 86400000).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>
      </motion.div>

      {/* COUPON */}
      <motion.div variants={fadeUp}>
        <button
          onClick={() => setShowCoupon((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            color: "#3b82f6",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <Award size={13} />
          {showCoupon ? "Hide" : "Have a coupon code?"}
          <motion.div animate={{ rotate: showCoupon ? 180 : 0 }}>
            <ChevronDown size={12} />
          </motion.div>
        </button>
        <AnimatePresence>
          {showCoupon && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.24 }}
              style={{
                display: "flex",
                gap: 8,
                marginTop: 10,
                overflow: "hidden",
              }}
            >
              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                placeholder="LAUNCH10"
                style={{ ...inp, flex: 1 }}
              />
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => {
                  if (coupon === "LAUNCH10") setCouponApplied(true);
                }}
                style={{
                  padding: "13px 16px",
                  borderRadius: 16,
                  background: couponApplied ? "#22c55e" : plan.gradient,
                  color: "#fff",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  flexShrink: 0,
                  boxShadow: `0 4px 16px ${plan.glowColor}`,
                }}
              >
                {couponApplied ? <Check size={14} /> : "Apply"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* PAYMENT METHOD */}
      <motion.div
        variants={fadeUp}
        style={{
          borderRadius: 24,
          padding: 16,
          background: dark ? "#0f1a2e" : "#fff",
          border: `1.5px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(203,213,225,0.6)"}`,
          boxShadow: dark ? "none" : "0 2px 12px rgba(0,0,0,0.04)",
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: dark ? "#334155" : "#94a3b8",
            marginBottom: 12,
          }}
        >
          Payment Method
        </p>

        {/* tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {(["upi", "card", "netbanking"] as const).map((m) => (
            <motion.button
              key={m}
              onClick={() => setMethod(m)}
              whileTap={{ scale: 0.93 }}
              style={{
                flex: 1,
                padding: "9px 4px",
                borderRadius: 14,
                border: "1.5px solid",
                borderColor:
                  method === m
                    ? "#3b82f6"
                    : dark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(203,213,225,0.6)",
                background:
                  method === m
                    ? dark
                      ? "rgba(37,99,235,0.18)"
                      : "rgba(219,234,254,0.6)"
                    : dark
                      ? "transparent"
                      : "transparent",
                color: method === m ? "#3b82f6" : dark ? "#475569" : "#94a3b8",
                fontSize: 11.5,
                fontWeight: 800,
                cursor: "pointer",
                transition: "all 0.18s",
              }}
            >
              {m === "upi" ? "UPI" : m === "card" ? "Card" : "Net Banking"}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* UPI */}
          {method === "upi" && (
            <motion.div
              key="upi"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <div style={{ position: "relative" }}>
                <input
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="username@upi"
                  style={inp}
                />
                <span
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 9.5,
                    fontWeight: 800,
                    padding: "3px 8px",
                    borderRadius: 8,
                    background: dark
                      ? "rgba(59,130,246,0.15)"
                      : "rgba(219,234,254,0.8)",
                    color: "#3b82f6",
                  }}
                >
                  UPI
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                {["GPay", "PhonePe", "Paytm", "BHIM"].map((app) => (
                  <motion.button
                    key={app}
                    onClick={() => setUpiId(`user@${app.toLowerCase()}`)}
                    whileTap={{ scale: 0.93 }}
                    style={{
                      padding: "10px 8px",
                      borderRadius: 14,
                      border: "1.5px solid",
                      borderColor: upiId.includes(app.toLowerCase())
                        ? "#3b82f6"
                        : dark
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(203,213,225,0.5)",
                      background: upiId.includes(app.toLowerCase())
                        ? dark
                          ? "rgba(37,99,235,0.18)"
                          : "rgba(219,234,254,0.5)"
                        : "transparent",
                      color: upiId.includes(app.toLowerCase())
                        ? "#3b82f6"
                        : dark
                          ? "#64748b"
                          : "#94a3b8",
                      fontSize: 11.5,
                      fontWeight: 800,
                      cursor: "pointer",
                      transition: "all 0.18s",
                    }}
                  >
                    {app}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* CARD */}
          {method === "card" && (
            <motion.div
              key="card"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              <div style={{ position: "relative" }}>
                <input
                  value={cardNum}
                  onChange={(e) => setCardNum(fmtCard(e.target.value))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  style={inp}
                />
                <CreditCard
                  size={14}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: dark ? "#334155" : "#cbd5e1",
                  }}
                />
              </div>
              <input
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="Name on card"
                style={inp}
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <input
                  value={expiry}
                  onChange={(e) => setExpiry(fmtExp(e.target.value))}
                  placeholder="MM / YY"
                  maxLength={5}
                  style={inp}
                />
                <input
                  value={cvv}
                  onChange={(e) =>
                    setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))
                  }
                  placeholder="CVV"
                  maxLength={3}
                  type="password"
                  style={inp}
                />
              </div>
            </motion.div>
          )}

          {/* NET BANKING */}
          {method === "netbanking" && (
            <motion.div
              key="nb"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              {["SBI", "HDFC", "ICICI", "Axis", "Kotak", "Yes Bank"].map(
                (bank) => (
                  <motion.button
                    key={bank}
                    whileTap={{ scale: 0.93 }}
                    style={{
                      padding: "13px 10px",
                      borderRadius: 14,
                      border: `1.5px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(203,213,225,0.5)"}`,
                      background: dark ? "rgba(255,255,255,0.02)" : "#f8fafc",
                      color: dark ? "#94a3b8" : "#64748b",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {bank}
                  </motion.button>
                ),
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* SECURITY BADGES */}
      <motion.div
        variants={fadeUp}
        style={{ display: "flex", justifyContent: "center", gap: 20 }}
      >
        {[
          { icon: <Lock size={11} />, label: "256-bit SSL" },
          { icon: <Shield size={11} />, label: "PCI DSS" },
          { icon: <CheckCircle2 size={11} />, label: "Razorpay" },
        ].map((b, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              color: dark ? "#334155" : "#94a3b8",
            }}
          >
            {b.icon}
            <span style={{ fontSize: 10, fontWeight: 700 }}>{b.label}</span>
          </div>
        ))}
      </motion.div>

      {/* STICKY PAY BUTTON */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "12px 16px 28px",
          background: dark
            ? "linear-gradient(to top, #080f1e 55%, transparent)"
            : "linear-gradient(to top, #f0f5ff 55%, transparent)",
        }}
      >
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <motion.button
            onClick={pay}
            disabled={loading}
            whileTap={!loading ? { scale: 0.97 } : {}}
            style={{
              width: "100%",
              padding: "16px 20px",
              borderRadius: 20,
              border: "none",
              background:
                "linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 900,
              cursor: loading ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              boxShadow: "0 12px 40px rgba(37,99,235,0.4)",
              position: "relative",
              overflow: "hidden",
              opacity: loading ? 0.85 : 1,
              transition: "opacity 0.2s",
              letterSpacing: "-0.01em",
            }}
          >
            <motion.div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)",
              }}
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    position: "relative",
                  }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <RefreshCw size={15} />
                  </motion.div>
                  Processing…
                </motion.div>
              ) : (
                <motion.div
                  key="pay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    position: "relative",
                  }}
                >
                  <Lock size={14} />
                  Pay {fmt(finalTotal)} Securely
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   ████  SUCCESS SCREEN  ████
═══════════════════════════════════════════ */
function SuccessScreen({
  dark,
  planId,
  cycle,
  onDone,
}: {
  dark: boolean;
  planId: PlanId;
  cycle: Cycle;
  onDone: () => void;
}) {
  const plan = PLANS.find((p) => p.id === planId)!;
  const price = cycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

  const unlocked = [
    {
      icon: <BarChart2 size={14} />,
      label: "Analytics",
      sublabel: "Live & historical",
      color: "#3b82f6",
    },
    {
      icon: <MessageSquare size={14} />,
      label: "AI Insights",
      sublabel: "Powered by GPT-4",
      color: "#8b5cf6",
    },
    {
      icon: <Star size={14} />,
      label: "Reviews",
      sublabel: "Monitor & reply",
      color: "#f59e0b",
    },
    {
      icon: <TrendingUp size={14} />,
      label: "Competitor",
      sublabel: "Track rankings",
      color: "#22c55e",
    },
  ];

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        paddingBottom: 140,
      }}
    >
      {/* SUCCESS ICON */}
      <motion.div
        variants={{
          hidden: { opacity: 0, scale: 0.5 },
          show: {
            opacity: 1,
            scale: 1,
            transition: { duration: 0.6, ease: [0.34, 1.5, 0.64, 1] },
          },
        }}
        style={{ position: "relative", margin: "24px 0 28px" }}
      >
        {/* rings */}
        {[72, 92, 114].map((size, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.3 + i * 0.1,
              duration: 0.5,
              ease: [0.34, 1.3, 0.64, 1],
            }}
            style={{
              position: "absolute",
              borderRadius: "50%",
              border: `1.5px solid`,
              borderColor: `rgba(59,130,246,${0.35 - i * 0.1})`,
              width: size,
              height: size,
              top: (114 - size) / 2,
              left: (114 - size) / 2,
            }}
          />
        ))}

        {/* main circle */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.55, ease: [0.34, 1.4, 0.64, 1] }}
          style={{
            width: 90,
            height: 90,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
            boxShadow:
              "0 0 0 0 rgba(59,130,246,0.4), 0 16px 60px rgba(37,99,235,0.5)",
            position: "relative",
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.35,
              duration: 0.4,
              ease: [0.34, 1.5, 0.64, 1],
            }}
          >
            <CheckCircle2 size={42} color="#fff" strokeWidth={1.8} />
          </motion.div>
        </motion.div>

        {/* particle burst */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{
              x: Math.cos((i / 8) * Math.PI * 2) * 65,
              y: Math.sin((i / 8) * Math.PI * 2) * 65,
              scale: 0,
              opacity: 0,
            }}
            transition={{ delay: 0.3, duration: 0.65, ease: "easeOut" }}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: i % 2 === 0 ? 6 : 4,
              height: i % 2 === 0 ? 6 : 4,
              borderRadius: "50%",
              marginTop: -3,
              marginLeft: -3,
              background:
                i % 3 === 0 ? "#60a5fa" : i % 3 === 1 ? "#3b82f6" : "#93c5fd",
            }}
          />
        ))}
      </motion.div>

      {/* TITLE */}
      <motion.h1
        variants={fadeUp}
        style={{
          fontSize: 28,
          fontWeight: 900,
          letterSpacing: "-0.04em",
          lineHeight: 1.1,
          color: dark ? "#fff" : "#0f172a",
          fontFamily: "'SF Pro Display',-apple-system,sans-serif",
          marginBottom: 8,
        }}
      >
        You're all set! 🎉
      </motion.h1>

      <motion.p
        variants={fadeUp}
        style={{
          fontSize: 14,
          color: dark ? "#64748b" : "#64748b",
          fontWeight: 500,
          marginBottom: 6,
        }}
      >
        {plan.name} plan activated successfully
      </motion.p>

      <motion.div
        variants={fadeUp}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 28,
        }}
      >
        <span
          style={{
            padding: "4px 12px",
            borderRadius: 99,
            fontSize: 11.5,
            fontWeight: 900,
            background: plan.gradient,
            color: "#fff",
          }}
        >
          {plan.name}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: dark ? "#475569" : "#94a3b8",
          }}
        >
          {fmt(price)}/mo ·{" "}
          {cycle === "yearly" ? "Yearly billing" : "Monthly billing"}
        </span>
      </motion.div>

      {/* UNLOCKED GRID */}
      <motion.div
        variants={stagger}
        style={{
          width: "100%",
          borderRadius: 24,
          padding: 16,
          background: dark ? "#0f1a2e" : "#fff",
          border: `1.5px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(203,213,225,0.6)"}`,
          boxShadow: dark ? "none" : "0 2px 16px rgba(0,0,0,0.05)",
          marginBottom: 14,
          textAlign: "left",
        }}
      >
        <p
          style={{
            fontSize: 10.5,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: dark ? "#334155" : "#94a3b8",
            marginBottom: 12,
          }}
        >
          Now active on your account
        </p>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          {unlocked.map((u, i) => (
            <motion.div
              key={i}
              variants={item}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 16,
                background: dark
                  ? `rgba(59,130,246,0.06)`
                  : `rgba(239,246,255,0.8)`,
                border: `1px solid ${dark ? "rgba(59,130,246,0.1)" : "rgba(147,197,253,0.3)"}`,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 10,
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
              <div>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: dark ? "#e2e8f0" : "#1e293b",
                  }}
                >
                  {u.label}
                </p>
                <p
                  style={{
                    fontSize: 10,
                    color: dark ? "#475569" : "#94a3b8",
                    fontWeight: 500,
                  }}
                >
                  {u.sublabel}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* TRIAL INFO */}
      <motion.div
        variants={fadeUp}
        style={{
          width: "100%",
          borderRadius: 20,
          padding: "12px 14px",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: dark ? "rgba(34,197,94,0.07)" : "rgba(220,252,231,0.7)",
          border: `1.5px solid ${dark ? "rgba(34,197,94,0.15)" : "rgba(134,239,172,0.5)"}`,
        }}
      >
        <Clock size={16} style={{ color: "#22c55e", flexShrink: 0 }} />
        <div style={{ textAlign: "left" }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: dark ? "#4ade80" : "#15803d",
            }}
          >
            Trial ends in 7 days
          </p>
          <p
            style={{
              fontSize: 11,
              color: dark ? "#16a34a" : "#16a34a",
              fontWeight: 500,
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
          padding: "12px 16px 28px",
          background: dark
            ? "linear-gradient(to top, #080f1e 55%, transparent)"
            : "linear-gradient(to top, #f0f5ff 55%, transparent)",
        }}
      >
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <motion.button
            onClick={onDone}
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            style={{
              width: "100%",
              padding: "16px 20px",
              borderRadius: 20,
              border: "none",
              background: plan.gradient,
              color: "#fff",
              fontSize: 15,
              fontWeight: 900,
              cursor: "pointer",
              boxShadow: `0 12px 40px ${plan.glowColor}`,
              position: "relative",
              overflow: "hidden",
              letterSpacing: "-0.01em",
            }}
          >
            <motion.div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)",
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
   ████  FAILED SCREEN  ████
═══════════════════════════════════════════ */
function FailedScreen({
  dark,
  planId,
  onRetry,
  onChangePlan,
}: {
  dark: boolean;
  planId: PlanId;
  onRetry: () => void;
  onChangePlan: () => void;
}) {
  const plan = PLANS.find((p) => p.id === planId)!;

  const reasons = [
    {
      icon: <CreditCard size={13} />,
      t: "Insufficient funds",
      d: "Check your account balance and try again",
    },
    {
      icon: <Lock size={13} />,
      t: "Card blocked / declined",
      d: "Your bank may have blocked this transaction",
    },
    {
      icon: <Wifi size={13} />,
      t: "Connection dropped",
      d: "Poor network during payment processing",
    },
  ];

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        paddingBottom: 160,
      }}
    >
      {/* FAIL ICON */}
      <motion.div style={{ position: "relative", margin: "24px 0 28px" }}>
        {[72, 96].map((size, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.15 + i * 0.1,
              duration: 0.5,
              ease: [0.34, 1.3, 0.64, 1],
            }}
            style={{
              position: "absolute",
              borderRadius: "50%",
              border: "1.5px solid",
              borderColor: `rgba(239,68,68,${0.3 - i * 0.12})`,
              width: size,
              height: size,
              top: (96 - size) / 2,
              left: (96 - size) / 2,
            }}
          />
        ))}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, x: [0, -5, 5, -3, 3, 0] }}
          transition={{
            scale: { duration: 0.45, ease: [0.34, 1.4, 0.64, 1] },
            x: { delay: 0.5, duration: 0.5 },
          }}
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            background: dark ? "rgba(239,68,68,0.12)" : "rgba(254,226,226,0.8)",
            border: "2px solid rgba(239,68,68,0.3)",
            boxShadow:
              "0 0 0 0 rgba(239,68,68,0.3), 0 12px 40px rgba(239,68,68,0.25)",
          }}
        >
          <XCircle size={40} style={{ color: "#ef4444" }} strokeWidth={1.8} />
        </motion.div>
      </motion.div>

      <motion.h1
        variants={fadeUp}
        style={{
          fontSize: 28,
          fontWeight: 900,
          letterSpacing: "-0.04em",
          color: dark ? "#fff" : "#0f172a",
          fontFamily: "'SF Pro Display',-apple-system,sans-serif",
          marginBottom: 8,
        }}
      >
        Payment Failed
      </motion.h1>
      <motion.p
        variants={fadeUp}
        style={{
          fontSize: 14,
          color: dark ? "#64748b" : "#64748b",
          fontWeight: 500,
          marginBottom: 28,
          maxWidth: 280,
        }}
      >
        Your transaction couldn't be completed. No charges were made.
      </motion.p>

      {/* REASONS */}
      <motion.div
        variants={stagger}
        style={{
          width: "100%",
          borderRadius: 24,
          padding: 16,
          background: dark ? "#0f1a2e" : "#fff",
          border: `1.5px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(203,213,225,0.6)"}`,
          boxShadow: dark ? "none" : "0 2px 16px rgba(0,0,0,0.05)",
          marginBottom: 14,
          textAlign: "left",
        }}
      >
        <p
          style={{
            fontSize: 10.5,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: dark ? "#334155" : "#94a3b8",
            marginBottom: 12,
          }}
        >
          Possible reasons
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {reasons.map((r, i) => (
            <motion.div
              key={i}
              variants={item}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 16,
                background: dark
                  ? "rgba(239,68,68,0.05)"
                  : "rgba(254,226,226,0.3)",
                border: `1px solid ${dark ? "rgba(239,68,68,0.1)" : "rgba(252,165,165,0.4)"}`,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 9,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: dark
                    ? "rgba(239,68,68,0.12)"
                    : "rgba(254,226,226,0.8)",
                  color: "#ef4444",
                }}
              >
                {r.icon}
              </div>
              <div>
                <p
                  style={{
                    fontSize: 12.5,
                    fontWeight: 800,
                    color: dark ? "#fca5a5" : "#991b1b",
                    marginBottom: 2,
                  }}
                >
                  {r.t}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: dark ? "#64748b" : "#94a3b8",
                    fontWeight: 500,
                  }}
                >
                  {r.d}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* SUPPORT */}
      <motion.div
        variants={fadeUp}
        style={{
          width: "100%",
          borderRadius: 18,
          padding: "11px 14px",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: dark ? "rgba(37,99,235,0.07)" : "rgba(219,234,254,0.6)",
          border: `1px solid ${dark ? "rgba(59,130,246,0.12)" : "rgba(147,197,253,0.4)"}`,
        }}
      >
        <Bell size={13} style={{ color: "#3b82f6", flexShrink: 0 }} />
        <p
          style={{
            fontSize: 11.5,
            color: dark ? "#93c5fd" : "#1d4ed8",
            fontWeight: 600,
            textAlign: "left",
          }}
        >
          Need help? Reach us at <strong>support@yourapp.com</strong>
        </p>
      </motion.div>

      {/* CTAs */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "12px 16px 28px",
          background: dark
            ? "linear-gradient(to top, #080f1e 55%, transparent)"
            : "linear-gradient(to top, #f0f5ff 55%, transparent)",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <motion.button
            onClick={onRetry}
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            style={{
              width: "100%",
              padding: "15px 20px",
              borderRadius: 20,
              border: "none",
              background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 900,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 8px 32px rgba(37,99,235,0.38)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <motion.div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)",
              }}
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <RefreshCw size={15} style={{ position: "relative" }} />
            <span style={{ position: "relative" }}>Try Again</span>
          </motion.button>
          <motion.button
            onClick={onChangePlan}
            whileTap={{ scale: 0.96 }}
            style={{
              width: "100%",
              padding: "14px 20px",
              borderRadius: 20,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              background: "transparent",
              border: `1.5px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(203,213,225,0.8)"}`,
              color: dark ? "#94a3b8" : "#64748b",
            }}
          >
            Choose a Different Plan
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   ████  ROOT  ████
═══════════════════════════════════════════ */
export default function SubscriptionFlow() {
  const [dark, setDark] = useState(true);
  const [screen, setScreen] = useState<Screen>("plans");
  const [planId, setPlanId] = useState<PlanId>("pro");
  const [cycle, setCycle] = useState<Cycle>("yearly");

  const stepIndex = screen === "plans" ? 0 : screen === "checkout" ? 1 : 2;

  const bg = dark
    ? "linear-gradient(160deg, #050d1a 0%, #080f1e 40%, #050d1a 100%)"
    : "linear-gradient(160deg, #eef4ff 0%, #f0f5ff 40%, #e8f0fe 100%)";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: bg,
        fontFamily: "-apple-system,'SF Pro Text',sans-serif",
        transition: "background 0.4s ease",
      }}
    >
      {/* ambient glow */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
          zIndex: 0,
        }}
      >
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: dark ? [0.06, 0.1, 0.06] : [0.04, 0.07, 0.04],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: -100,
            left: "50%",
            transform: "translateX(-50%)",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(37,99,235,0.6) 0%, transparent 70%)",
          }}
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: dark ? [0.03, 0.06, 0.03] : [0.02, 0.04, 0.02],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3,
          }}
          style={{
            position: "absolute",
            bottom: -150,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(96,165,250,0.5) 0%, transparent 70%)",
          }}
        />
      </div>

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
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 16,
            paddingBottom: 4,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {(screen === "checkout" || screen === "failed") && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() =>
                  screen === "checkout"
                    ? setScreen("plans")
                    : setScreen("checkout")
                }
                whileTap={{ scale: 0.88 }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 14,
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
                <ArrowLeft size={15} />
              </motion.button>
            )}
            <StepDots step={stepIndex} dark={dark} />
          </div>
          <ThemeToggle dark={dark} onToggle={() => setDark((d) => !d)} />
        </motion.div>

        {/* SCREENS */}
        <AnimatePresence mode="wait">
          {screen === "plans" && (
            <motion.div
              key="plans"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3 }}
            >
              <PlansScreen
                dark={dark}
                onSelect={(p, c) => {
                  setPlanId(p);
                  setCycle(c);
                  setScreen("checkout");
                }}
              />
            </motion.div>
          )}
          {screen === "checkout" && (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.3 }}
            >
              <CheckoutScreen
                dark={dark}
                planId={planId}
                cycle={cycle}
                onSuccess={() => setScreen("success")}
                onFail={() => setScreen("failed")}
              />
            </motion.div>
          )}
          {screen === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.36 }}
            >
              <SuccessScreen
                dark={dark}
                planId={planId}
                cycle={cycle}
                onDone={() => setScreen("plans")}
              />
            </motion.div>
          )}
          {screen === "failed" && (
            <motion.div
              key="failed"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.36 }}
            >
              <FailedScreen
                dark={dark}
                planId={planId}
                onRetry={() => setScreen("checkout")}
                onChangePlan={() => setScreen("plans")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
