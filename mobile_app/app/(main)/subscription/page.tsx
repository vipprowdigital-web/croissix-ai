// mobile_app\app\(main)\subscription\page.tsx

"use client";

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
  BarChart2,
  MessageSquare,
  Star,
  TrendingUp,
  Lock,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { useUser } from "@/features/user/hook/useUser";

/* ═══════════════════════════════════════════
   TYPES
═══════════════════════════════════════════ */
type Screen = "plans" | "processing" | "success" | "failed";

/* ═══════════════════════════════════════════
   PLAN CONFIG  — single Razorpay plan
═══════════════════════════════════════════ */
const PLAN = {
  id: "starter",
  name: "Starter",
  razorpayPlanId: "plan_SR7GH5Kj45UJsP",
  priceMonthly: 49900, // ₹499 in paise
  description: "1 Google Business location, 4 posts/day, 30-day analytics",
  features: [
    { text: "1 Google Business Profile", highlight: true },
    { text: "Analytics dashboard", highlight: true },
    { text: "Review Monitoring", highlight: true },
    { text: "5 Posts/Day", highlight: true },
    { text: "AI insights", highlight: true },
    { text: "Report Support", highlight: true },
  ],
  unlocked: [
    { icon: <BarChart2 size={13} />, label: "Analytics", color: "#3b82f6" },
    {
      icon: <MessageSquare size={13} />,
      label: "AI Insights",
      color: "#2563eb",
    },
    { icon: <Star size={13} />, label: "Reviews", color: "#f59e0b" },
    { icon: <TrendingUp size={13} />, label: "Competitor", color: "#22c55e" },
  ],
};

const fmtRupees = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN")}`;

/* ═══════════════════════════════════════════
   RAZORPAY HELPERS
═══════════════════════════════════════════ */
declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) return resolve(true);
    const s = document.createElement("script");
    s.id = "razorpay-script";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

interface CheckoutOpts {
  user?: { name?: string; email?: string; phone?: string };
  onSuccess: (subscriptionId: string) => void;
  onFail: (reason: string) => void;
  onDismiss: () => void;
}

async function openRazorpayCheckout(opts: CheckoutOpts) {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    opts.onFail("Failed to load payment SDK");
    return;
  }

  let subscriptionId: string;
  try {
    const res = await fetch("/api/razorpay/create-subscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
      body: JSON.stringify({ planId: PLAN.razorpayPlanId }),
    });
    const json = await res.json();
    if (!json.subscriptionId)
      throw new Error(json.error ?? "Could not create subscription");
    subscriptionId = json.subscriptionId;
  } catch (e: any) {
    opts.onFail(e.message);
    return;
  }

  const rzp = new window.Razorpay({
    key: process.env.RAZORPAY_KEY_ID,
    subscription_id: subscriptionId,
    name: "Vipprow",
    description: `${PLAN.name} Plan · ${fmtRupees(PLAN.priceMonthly)}/mo`,
    image: "/logo.png",
    prefill: {
      name: opts.user?.name ?? "",
      email: opts.user?.email ?? "",
      contact: opts.user?.phone ?? "",
    },
    theme: { color: "#2563eb" },
    handler: async (response: any) => {
      const verify = await fetch("/api/razorpay/verify-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_subscription_id: response.razorpay_subscription_id,
          razorpay_signature: response.razorpay_signature,
        }),
      });
      const data = await verify.json();
      if (data.success) opts.onSuccess(response.razorpay_subscription_id);
      else opts.onFail("Payment verification failed");
    },
    modal: {
      ondismiss() {
        opts.onDismiss();
      },
    },
  });
  rzp.open();
  rzp.on("payment.failed", (resp: any) =>
    opts.onFail(resp.error?.description ?? "Payment failed"),
  );
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
              width: i === step ? 22 : 8,
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

/* ═══════════════════════════════════════════
   PLAN SCREEN
═══════════════════════════════════════════ */
function PlanScreen({ dark, onStart }: { dark: boolean; onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
        paddingBottom: 130,
      }}
    >
      {/* HERO */}
      <div className="pt-4">
        <h1
          style={{
            fontSize: 24,
            fontWeight: 900,
            letterSpacing: "-0.045em",
            lineHeight: 1.15,
            margin: "0 0 8px",
            color: dark ? "#fff" : "#0f172a",
            textAlign: "center",
          }}
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
          style={{
            textAlign: "center",
            fontSize: 13,
            margin: 0,
            fontWeight: 500,
            color: dark ? "#64748b" : "#64748b",
          }}
        >
          AI-powered GBP analytics — one simple plan
        </p>
      </div>

      {/* PLAN CARD */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        style={{
          borderRadius: 24,
          overflow: "hidden",
          border: `2px solid ${dark ? "rgba(59,130,246,0.3)" : "rgba(59,130,246,0.25)"}`,
          background: dark ? "rgba(37,99,235,0.06)" : "rgba(239,246,255,0.7)",
          boxShadow: dark
            ? "0 0 0 4px rgba(59,130,246,0.08), 0 16px 48px rgba(37,99,235,0.18)"
            : "0 0 0 4px rgba(59,130,246,0.06), 0 8px 40px rgba(37,99,235,0.12)",
        }}
      >
        {/* top gradient bar */}
        <div
          style={{
            height: 4,
            background: "linear-gradient(90deg,#1d4ed8,#3b82f6,#60a5fa)",
          }}
        />

        {/* header */}
        <div style={{ padding: "18px 18px 0" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
                  boxShadow: "0 6px 20px rgba(37,99,235,0.35)",
                }}
              >
                <Zap size={20} color="#fff" />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 900,
                      letterSpacing: "-0.03em",
                      color: dark ? "#fff" : "#0f172a",
                    }}
                  >
                    {PLAN.name}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 900,
                      padding: "2px 8px",
                      borderRadius: 99,
                      background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
                      color: "#fff",
                      letterSpacing: "0.04em",
                    }}
                  >
                    POPULAR
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 11,
                    margin: "2px 0 0",
                    fontWeight: 500,
                    color: dark ? "#475569" : "#64748b",
                  }}
                >
                  1 location · 4 posts/day · 30-day data
                </p>
              </div>
            </div>

            {/* price */}
            <div style={{ textAlign: "right" }}>
              <div
                style={{ display: "flex", alignItems: "flex-start", gap: 2 }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    marginTop: 4,
                    color: dark ? "#93c5fd" : "#2563eb",
                  }}
                >
                  ₹
                </span>
                <span
                  style={{
                    fontSize: 32,
                    fontWeight: 900,
                    letterSpacing: "-0.05em",
                    lineHeight: 1,
                    color: dark ? "#fff" : "#0f172a",
                  }}
                >
                  499
                </span>
              </div>
              <p
                style={{
                  fontSize: 10,
                  margin: "2px 0 0",
                  fontWeight: 700,
                  color: dark ? "#475569" : "#94a3b8",
                }}
              >
                per month
              </p>
            </div>
          </div>
        </div>

        {/* divider */}
        <div
          style={{
            height: 1,
            margin: "16px 18px 0",
            background: dark
              ? "rgba(255,255,255,0.05)"
              : "rgba(59,130,246,0.1)",
          }}
        />

        {/* features */}
        <div style={{ padding: "14px 18px 18px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px 12px",
            }}
          >
            {PLAN.features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                style={{ display: "flex", alignItems: "center", gap: 7 }}
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
                  style={{
                    fontSize: 11,
                    lineHeight: 1.3,
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

      {/* TRUST ROW */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        style={{ display: "flex", flexDirection: "column", gap: 8 }}
      >
        <div
          style={{
            borderRadius: 14,
            padding: "11px 14px",
            display: "flex",
            alignItems: "center",
            gap: 9,
            background: dark ? "rgba(37,99,235,0.07)" : "rgba(219,234,254,0.5)",
            border: `1px solid ${dark ? "rgba(59,130,246,0.12)" : "rgba(147,197,253,0.4)"}`,
          }}
        >
          <Shield size={13} style={{ color: "#3b82f6", flexShrink: 0 }} />
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              margin: 0,
              color: dark ? "#93c5fd" : "#1d4ed8",
            }}
          >
            <strong>AI Powered</strong> · Scale with us.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
          }}
        >
          {[
            { icon: "🔒", text: "Secured by Razorpay" },
            { icon: "🔄", text: "Cancel anytime" },
          ].map((t, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 10px",
                borderRadius: 12,
                background: dark
                  ? "rgba(255,255,255,0.02)"
                  : "rgba(255,255,255,0.8)",
                border: `1px solid ${dark ? "rgba(255,255,255,0.05)" : "rgba(203,213,225,0.5)"}`,
              }}
            >
              <span style={{ fontSize: 13 }}>{t.icon}</span>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: dark ? "#475569" : "#64748b",
                }}
              >
                {t.text}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* STICKY CTA */}
      <div
        style={{
          position: "relative",
          bottom: 10,
          left: 0,
          right: 0,
          padding: "12px 16px 28px",
          background: dark
            ? "linear-gradient(to top,#050d1a 55%,transparent)"
            : "linear-gradient(to top,#eef4ff 55%,transparent)",
        }}
      >
        <div style={{ maxWidth: 440, margin: "0 auto" }}>
          <motion.button
            onClick={onStart}
            whileTap={{ scale: 0.975 }}
            style={{
              width: "100%",
              padding: "15px 20px",
              borderRadius: 18,
              border: "none",
              cursor: "pointer",
              color: "#fff",
              fontSize: 14,
              fontWeight: 900,
              letterSpacing: "-0.01em",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: "linear-gradient(135deg,#1d4ed8,#2563eb,#3b82f6)",
              boxShadow: "0 10px 32px rgba(37,99,235,0.38)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* shimmer */}
            <motion.div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)",
              }}
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
            />
            <Zap size={15} style={{ position: "relative" }} />
            <span style={{ position: "relative" }}>
              Start Free Trial · {fmtRupees(PLAN.priceMonthly)}/Monthly
            </span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   PROCESSING SCREEN
═══════════════════════════════════════════ */
function ProcessingScreen({ dark }: { dark: boolean }) {
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
        gap: 18,
        textAlign: "center",
      }}
    >
      <div style={{ position: "relative" }}>
        {/* pulsing ring */}
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: -18,
            borderRadius: "50%",
            border: "2px solid #3b82f6",
          }}
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
            boxShadow: "0 8px 28px rgba(37,99,235,0.35)",
          }}
        >
          <RefreshCw size={22} color="#fff" />
        </motion.div>
      </div>
      <div>
        <p
          style={{
            fontSize: 16,
            fontWeight: 800,
            margin: "0 0 5px",
            color: dark ? "#fff" : "#0f172a",
          }}
        >
          Opening secure checkout…
        </p>
        <p
          style={{
            fontSize: 12,
            fontWeight: 500,
            margin: 0,
            color: dark ? "#64748b" : "#94a3b8",
          }}
        >
          Setting up your Starter subscription
        </p>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 14px",
          borderRadius: 99,
          background: dark ? "rgba(59,130,246,0.08)" : "rgba(219,234,254,0.6)",
          border: `1px solid ${dark ? "rgba(59,130,246,0.15)" : "rgba(147,197,253,0.4)"}`,
        }}
      >
        <Lock size={11} style={{ color: "#3b82f6" }} />
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: dark ? "#93c5fd" : "#2563eb",
          }}
        >
          Secured by Razorpay
        </span>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   SUCCESS SCREEN
═══════════════════════════════════════════ */
function SuccessScreen({
  dark,
  subscriptionId,
  onDone,
}: {
  dark: boolean;
  subscriptionId: string;
  onDone: () => void;
}) {
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
        paddingBottom: 130,
      }}
    >
      {/* CHECK CIRCLE */}
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
        {/* particles */}
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
        style={{
          fontSize: 24,
          fontWeight: 900,
          letterSpacing: "-0.04em",
          margin: "0 0 6px",
          color: dark ? "#fff" : "#0f172a",
        }}
      >
        You're all set! 🎉
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.17 }}
        style={{
          fontSize: 13,
          fontWeight: 500,
          margin: "0 0 20px",
          color: dark ? "#64748b" : "#64748b",
        }}
      >
        Starter plan activated successfully
      </motion.p>

      {/* subscription id */}
      {subscriptionId && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          style={{
            width: "100%",
            borderRadius: 14,
            padding: "10px 14px",
            marginBottom: 12,
            background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
            border: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
            textAlign: "left",
          }}
        >
          <p
            style={{
              fontSize: 9.5,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: dark ? "#334155" : "#94a3b8",
              margin: "0 0 3px",
            }}
          >
            Subscription ID
          </p>
          <p
            style={{
              fontSize: 11,
              fontFamily: "monospace",
              fontWeight: 700,
              color: dark ? "#60a5fa" : "#2563eb",
              margin: 0,
              wordBreak: "break-all",
            }}
          >
            {subscriptionId}
          </p>
        </motion.div>
      )}

      {/* unlocked features */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        style={{
          width: "100%",
          borderRadius: 20,
          padding: 14,
          marginBottom: 12,
          background: dark ? "#0f1a2e" : "#fff",
          border: `1.5px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(203,213,225,0.5)"}`,
          boxShadow: dark ? "none" : "0 2px 12px rgba(0,0,0,0.04)",
          textAlign: "left",
        }}
      >
        <p
          style={{
            fontSize: 9.5,
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
          {PLAN.unlocked.map((u, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.28 + i * 0.05 }}
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

      {/* trial notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.32 }}
        style={{
          width: "100%",
          borderRadius: 14,
          padding: "11px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: dark ? "rgba(34,197,94,0.07)" : "rgba(220,252,231,0.6)",
          border: `1.5px solid ${dark ? "rgba(34,197,94,0.14)" : "rgba(134,239,172,0.4)"}`,
          textAlign: "left",
          marginBottom: 4,
        }}
      >
        <Clock size={14} style={{ color: "#22c55e", flexShrink: 0 }} />
        <div>
          <p
            style={{
              fontSize: 12.5,
              fontWeight: 800,
              margin: 0,
              color: dark ? "#4ade80" : "#15803d",
            }}
          >
            Trial ends in 7 days
          </p>
          <p
            style={{
              fontSize: 10.5,
              fontWeight: 500,
              margin: "2px 0 0",
              color: dark ? "#16a34a" : "#16a34a",
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
            ? "linear-gradient(to top,#050d1a 55%,transparent)"
            : "linear-gradient(to top,#eef4ff 55%,transparent)",
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
              cursor: "pointer",
              color: "#fff",
              fontSize: 14,
              fontWeight: 900,
              background: "linear-gradient(135deg,#1d4ed8,#2563eb,#3b82f6)",
              boxShadow: "0 10px 32px rgba(37,99,235,0.38)",
              position: "relative",
              overflow: "hidden",
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
              transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
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
  onBack,
}: {
  dark: boolean;
  reason: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.32 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        paddingBottom: 140,
      }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1, x: [0, -5, 5, -2, 2, 0] }}
        transition={{
          scale: { duration: 0.42, ease: [0.34, 1.4, 0.64, 1] },
          x: { delay: 0.45, duration: 0.4 },
        }}
        style={{
          margin: "32px 0 20px",
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

      <h1
        style={{
          fontSize: 24,
          fontWeight: 900,
          letterSpacing: "-0.04em",
          margin: "0 0 6px",
          color: dark ? "#fff" : "#0f172a",
        }}
      >
        Payment Failed
      </h1>
      <p
        style={{
          fontSize: 13,
          fontWeight: 500,
          margin: "0 0 20px",
          maxWidth: 260,
          color: dark ? "#64748b" : "#64748b",
        }}
      >
        No charges were made to your account.
      </p>

      {reason && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            width: "100%",
            borderRadius: 14,
            padding: "11px 14px",
            marginBottom: 12,
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            background: dark ? "rgba(239,68,68,0.07)" : "rgba(254,226,226,0.5)",
            border: `1.5px solid ${dark ? "rgba(239,68,68,0.15)" : "rgba(252,165,165,0.4)"}`,
            textAlign: "left",
          }}
        >
          <AlertCircle
            size={14}
            style={{ color: "#ef4444", marginTop: 1, flexShrink: 0 }}
          />
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              margin: 0,
              color: dark ? "#fca5a5" : "#991b1b",
            }}
          >
            {reason}
          </p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        style={{
          width: "100%",
          borderRadius: 14,
          padding: "11px 14px",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: dark ? "rgba(37,99,235,0.07)" : "rgba(219,234,254,0.5)",
          border: `1px solid ${dark ? "rgba(59,130,246,0.1)" : "rgba(147,197,253,0.35)"}`,
          textAlign: "left",
        }}
      >
        <Bell size={13} style={{ color: "#3b82f6", flexShrink: 0 }} />
        <p
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            margin: 0,
            color: dark ? "#93c5fd" : "#1d4ed8",
          }}
        >
          Need help? Email <strong>support@vipprow.com</strong>
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
            ? "linear-gradient(to top,#050d1a 55%,transparent)"
            : "linear-gradient(to top,#eef4ff 55%,transparent)",
        }}
      >
        <div
          style={{
            maxWidth: 440,
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
              cursor: "pointer",
              color: "#fff",
              fontSize: 14,
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
              boxShadow: "0 10px 32px rgba(37,99,235,0.38)",
              position: "relative",
              overflow: "hidden",
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
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <RefreshCw size={14} style={{ position: "relative" }} />
            <span style={{ position: "relative" }}>Try Again</span>
          </motion.button>
          <motion.button
            onClick={onBack}
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
            ← Back to plan
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
  const [subscriptionId, setSubscriptionId] = useState("");
  const [failReason, setFailReason] = useState("");
  const { data: user } = useUser();

  const stepIndex = screen === "plans" ? 0 : screen === "processing" ? 1 : 2;

  function handleStart() {
    setScreen("processing");
    openRazorpayCheckout({
      user,
      onSuccess(subId) {
        setSubscriptionId(subId);
        setScreen("success");
      },
      onFail(reason) {
        setFailReason(reason);
        setScreen("failed");
      },
      onDismiss() {
        setScreen("plans");
      },
    });
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: dark
          ? "linear-gradient(150deg,#050d1a 0%,#080f1e 100%)"
          : "linear-gradient(150deg,#eef4ff 0%,#f0f5ff 100%)",
        fontFamily: "-apple-system,'SF Pro Text',sans-serif",
        transition: "background 0.35s",
      }}
    >
      {/* ambient orb */}
      <div
        style={{
          position: "fixed",
          top: -100,
          left: "50%",
          transform: "translateX(-50%)",
          width: 480,
          height: 480,
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 0,
          background:
            "radial-gradient(circle,rgba(37,99,235,0.1) 0%,transparent 70%)",
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
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              color: dark ? "#334155" : "#94a3b8",
            }}
          >
            <Lock size={11} />
            <span style={{ fontSize: 10, fontWeight: 800 }}>
              Secured by Razorpay
            </span>
          </div>
        </motion.div>

        {/* SCREENS */}
        <AnimatePresence mode="wait">
          {screen === "plans" && (
            <motion.div
              key="plans"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.26 }}
            >
              <PlanScreen dark={dark} onStart={handleStart} />
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
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
