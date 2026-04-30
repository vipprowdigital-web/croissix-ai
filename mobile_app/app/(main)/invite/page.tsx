// mobile_app\app\(main)\Invite\page.tsx
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Gift,
  Copy,
  Check,
  Share2,
  Users,
  Twitter,
  Mail,
  MessageCircle,
  Sparkles,
} from "lucide-react";

const REFERRAL_CODE = "VIPPROW-XJ9K2";
const REFERRAL_LINK = `https://vipprow.com/join?ref=${REFERRAL_CODE}`;

const PERKS = [
  {
    emoji: "🎁",
    title: "You get 1 month free",
    sub: "Added to your plan when they subscribe",
  },
  { emoji: "⚡", title: "They get 20% off", sub: "On their first 3 months" },
  { emoji: "♾️", title: "No limit", sub: "Invite as many as you want" },
];

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, delay, ease: [0.22, 1, 0.36, 1] as any },
  },
});

export default function InvitePage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";
  const router = useRouter();

  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  function copy(type: "code" | "link") {
    navigator.clipboard?.writeText(
      type === "code" ? REFERRAL_CODE : REFERRAL_LINK,
    );
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  function share() {
    if (navigator.share) {
      navigator.share({
        title: "Join Vipprow",
        text: "Get 20% off with my referral!",
        url: REFERRAL_LINK,
      });
    } else {
      copy("link");
    }
  }

  const bg = dark
    ? "linear-gradient(150deg,#050d1a,#080f1e)"
    : "linear-gradient(150deg,#eef4ff,#f0f5ff)";

  const card = {
    borderRadius: 20,
    background: dark ? "#0f1a2e" : "#fff",
    border: `1.5px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(203,213,225,0.5)"}`,
    boxShadow: dark ? "none" : "0 1px 8px rgba(0,0,0,0.04)",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: bg,
        fontFamily: "-apple-system,'SF Pro Text',sans-serif",
      }}
    >
      <div style={{ maxWidth: 440, margin: "0 auto", padding: "0 16px" }}>
        {/* Header */}
        <motion.div
          {...fade()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            paddingTop: 16,
            paddingBottom: 20,
          }}
        >
          <motion.button
            onClick={() => router.back()}
            whileTap={{ scale: 0.88 }}
            style={{
              width: 34,
              height: 34,
              borderRadius: 11,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
              color: dark ? "#94a3b8" : "#64748b",
            }}
          >
            <ArrowLeft size={15} />
          </motion.button>
          <h1
            style={{
              fontSize: 17,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              margin: 0,
              color: dark ? "#fff" : "#0f172a",
            }}
          >
            Invite a Friend
          </h1>
        </motion.div>

        {/* Hero illustration */}
        <motion.div
          {...fade(0.05)}
          style={{
            ...card,
            padding: "28px 20px 24px",
            textAlign: "center",
            marginBottom: 14,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* glow */}
          <div
            style={{
              position: "absolute",
              top: -40,
              left: "50%",
              transform: "translateX(-50%)",
              width: 260,
              height: 260,
              borderRadius: "50%",
              background:
                "radial-gradient(circle,rgba(37,99,235,0.14) 0%,transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{
              fontSize: 52,
              marginBottom: 14,
              display: "block",
              position: "relative",
            }}
          >
            🎁
          </motion.div>

          <h2
            style={{
              fontSize: 20,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              color: dark ? "#fff" : "#0f172a",
              margin: "0 0 8px",
            }}
          >
            Share & earn free months
          </h2>
          <p
            style={{
              fontSize: 13,
              color: dark ? "#64748b" : "#64748b",
              fontWeight: 500,
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Every friend who subscribes gives you a free month — and them a head
            start.
          </p>
        </motion.div>

        {/* Perks */}
        <motion.div
          {...fade(0.1)}
          style={{ ...card, padding: "14px 16px", marginBottom: 14 }}
        >
          {PERKS.map((p, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "10px 0",
                borderBottom:
                  i < 2
                    ? `1px solid ${dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)"}`
                    : "none",
              }}
            >
              <span style={{ fontSize: 22, flexShrink: 0 }}>{p.emoji}</span>
              <div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: dark ? "#e2e8f0" : "#1e293b",
                    margin: 0,
                  }}
                >
                  {p.title}
                </p>
                <p
                  style={{
                    fontSize: 11.5,
                    color: dark ? "#475569" : "#94a3b8",
                    fontWeight: 500,
                    margin: "1px 0 0",
                  }}
                >
                  {p.sub}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Referral Code */}
        <motion.div {...fade(0.15)} style={{ marginBottom: 10 }}>
          <p
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: dark ? "#334155" : "#94a3b8",
              margin: "0 0 7px",
            }}
          >
            Your referral code
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <div
              style={{
                flex: 1,
                padding: "13px 15px",
                borderRadius: 14,
                background: dark
                  ? "rgba(37,99,235,0.1)"
                  : "rgba(219,234,254,0.6)",
                border: `1.5px solid ${dark ? "rgba(59,130,246,0.2)" : "rgba(147,197,253,0.5)"}`,
              }}
            >
              <span
                style={{
                  fontSize: 17,
                  fontWeight: 900,
                  letterSpacing: "0.1em",
                  color: dark ? "#93c5fd" : "#1d4ed8",
                  fontFamily: "monospace",
                }}
              >
                {REFERRAL_CODE}
              </span>
            </div>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => copy("code")}
              style={{
                width: 50,
                borderRadius: 14,
                border: "none",
                cursor: "pointer",
                background:
                  copied === "code"
                    ? "#22c55e"
                    : dark
                      ? "rgba(59,130,246,0.15)"
                      : "rgba(219,234,254,0.8)",
                color: copied === "code" ? "#fff" : "#3b82f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s",
              }}
            >
              <AnimatePresence mode="wait">
                {copied === "code" ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Check size={16} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Copy size={16} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.div>

        {/* Referral Link */}
        <motion.div {...fade(0.18)} style={{ marginBottom: 18 }}>
          <p
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: dark ? "#334155" : "#94a3b8",
              margin: "0 0 7px",
            }}
          >
            Or share your link
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <div
              style={{
                flex: 1,
                padding: "11px 13px",
                borderRadius: 14,
                background: dark ? "rgba(255,255,255,0.04)" : "#f8fafc",
                border: `1.5px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(203,213,225,0.6)"}`,
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: dark ? "#475569" : "#94a3b8",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "block",
                }}
              >
                {REFERRAL_LINK}
              </span>
            </div>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => copy("link")}
              style={{
                width: 50,
                borderRadius: 14,
                border: "none",
                cursor: "pointer",
                background:
                  copied === "link"
                    ? "#22c55e"
                    : dark
                      ? "rgba(255,255,255,0.07)"
                      : "rgba(0,0,0,0.06)",
                color:
                  copied === "link" ? "#fff" : dark ? "#64748b" : "#94a3b8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s",
              }}
            >
              <AnimatePresence mode="wait">
                {copied === "link" ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Check size={16} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Copy size={16} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.div>

        {/* Share buttons */}
        <motion.div
          {...fade(0.22)}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 10,
            marginBottom: 24,
          }}
        >
          {[
            {
              icon: <Share2 size={16} />,
              label: "Share",
              action: share,
              color: "#3b82f6",
              bg: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
            },
            {
              icon: <Mail size={16} />,
              label: "Email",
              action: () =>
                window.open(
                  `mailto:?subject=Join Vipprow&body=Use my link: ${REFERRAL_LINK}`,
                ),
              color: "#8b5cf6",
              bg: "linear-gradient(135deg,#7c3aed,#8b5cf6)",
            },
            {
              icon: <MessageCircle size={16} />,
              label: "WhatsApp",
              action: () =>
                window.open(
                  `https://wa.me/?text=Join Vipprow and get 20% off! ${REFERRAL_LINK}`,
                ),
              color: "#22c55e",
              bg: "linear-gradient(135deg,#16a34a,#22c55e)",
            },
          ].map((btn, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.95 }}
              onClick={btn.action}
              style={{
                padding: "13px 8px",
                borderRadius: 16,
                border: "none",
                cursor: "pointer",
                background: btn.bg,
                color: "#fff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                boxShadow: `0 6px 20px ${btn.color}30`,
              }}
            >
              {btn.icon}
              <span style={{ fontSize: 11.5, fontWeight: 800 }}>
                {btn.label}
              </span>
            </motion.button>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div
          {...fade(0.26)}
          style={{ ...card, padding: "14px 16px", marginBottom: 32 }}
        >
          <p
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: dark ? "#334155" : "#94a3b8",
              margin: "0 0 12px",
            }}
          >
            Your referrals
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 4,
            }}
          >
            {[
              { n: "0", l: "Invited" },
              { n: "0", l: "Joined" },
              { n: "0 mo", l: "Earned" },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  textAlign: "center",
                  padding: "10px 6px",
                  borderRadius: 12,
                  background: dark
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(248,250,252,1)",
                }}
              >
                <p
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    letterSpacing: "-0.04em",
                    color: dark ? "#fff" : "#0f172a",
                    margin: 0,
                  }}
                >
                  {s.n}
                </p>
                <p
                  style={{
                    fontSize: 10.5,
                    color: dark ? "#334155" : "#94a3b8",
                    fontWeight: 600,
                    margin: "2px 0 0",
                  }}
                >
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
