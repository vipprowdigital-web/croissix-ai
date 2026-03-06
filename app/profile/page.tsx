"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

/* ── Icons ─────────────────────────────────────────────────── */
const Icon = {
  chevron: (
    <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
      <path
        d="M1 1l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  qr: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="14"
        y="3"
        width="7"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="3"
        y="14"
        width="7"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect x="14" y="14" width="3" height="3" fill="currentColor" />
      <rect x="18" y="14" width="3" height="3" fill="currentColor" />
      <rect x="14" y="18" width="3" height="3" fill="currentColor" />
      <rect x="18" y="18" width="3" height="3" fill="currentColor" />
      <rect x="5" y="5" width="3" height="3" fill="currentColor" />
      <rect x="16" y="5" width="3" height="3" fill="currentColor" />
      <rect x="5" y="16" width="3" height="3" fill="currentColor" />
    </svg>
  ),

  google_profile_management: (
    <svg
      width="20"
      height="20"
      viewBox="-3 0 262 262"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid"
    >
      <path
        d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
        fill="#4285F4"
      />
      <path
        d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
        fill="#34A853"
      />
      <path
        d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
        fill="#FBBC05"
      />
      <path
        d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
        fill="#EB4335"
      />
    </svg>
  ),
  notification: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  privacy: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect
        x="5"
        y="11"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 11V7a4 4 0 1 1 8 0v4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  security: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3L4 7v5c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V7L12 3z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  chats: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  storage: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <ellipse
        cx="12"
        cy="5"
        rx="9"
        ry="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M21 12c0 1.66-4.03 3-9 3S3 13.66 3 12"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  ),
  help: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle
        cx="12"
        cy="17"
        r="0.5"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  ),
  invite: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="16 6 12 2 8 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="12"
        y1="2"
        x2="12"
        y2="15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  theme: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  logout: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="16 17 21 12 16 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="21"
        y1="12"
        x2="9"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  camera: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="4" stroke="white" strokeWidth="1.8" />
    </svg>
  ),
  edit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

/* ── Section row ────────────────────────────────────────────── */
function Row({
  icon,
  iconBg,
  label,
  value,
  destructive = false,
  isDark,
  onClick,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value?: string;
  destructive?: boolean;
  isDark: boolean;
  onClick?: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const rowBg = pressed
    ? isDark
      ? "rgba(255,255,255,0.06)"
      : "rgba(0,0,0,0.05)"
    : "transparent";
  const labelClr = destructive ? "#ef4444" : isDark ? "#f0f6ff" : "#0f172a";
  const valClr = isDark ? "#64748b" : "#94a3b8";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "11px 16px",
        background: rowBg,
        cursor: "pointer",
        transition: "background .12s",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {/* icon bubble */}
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: destructive ? "#ef4444" : "white",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      {/* label */}
      <span
        style={{
          flex: 1,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
          fontSize: 16,
          fontWeight: 400,
          color: labelClr,
          letterSpacing: "-0.01em",
        }}
      >
        {label}
      </span>

      {/* value + chevron */}
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        {value && (
          <span
            style={{
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              fontSize: 14,
              color: valClr,
            }}
          >
            {value}
          </span>
        )}
        <span style={{ color: isDark ? "#3f4f6a" : "#c7d2dc" }}>
          {Icon.chevron}
        </span>
      </div>
    </div>
  );
}

/* ── Section container ──────────────────────────────────────── */
function Section({
  children,
  isDark,
}: {
  children: React.ReactNode;
  isDark: boolean;
}) {
  return (
    <div
      style={{
        background: isDark ? "#1a2232" : "#ffffff",
        borderRadius: 16,
        overflow: "hidden",
        border: isDark
          ? "1px solid rgba(255,255,255,0.05)"
          : "1px solid rgba(0,0,0,0.06)",
      }}
    >
      {/* dividers between rows */}
      {Array.isArray(children)
        ? (children as React.ReactNode[]).map((child, i) => (
            <div key={i}>
              {child}
              {i < (children as React.ReactNode[]).length - 1 && (
                <div
                  style={{
                    height: 1,
                    marginLeft: 64,
                    background: isDark
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.06)",
                  }}
                />
              )}
            </div>
          ))
        : children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  /* tokens */
  const pageBg = isDark ? "#0d1421" : "#f2f2f7";
  const titleClr = isDark ? "#f0f6ff" : "#0f172a";
  const subClr = isDark ? "#64748b" : "#8e8e93";
  const aboutClr = isDark ? "#94a3b8" : "#6b7280";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: pageBg,
        transition: "background .3s",
        paddingTop: "3rem",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
      }}
    >
      {/* ── scroll content ── */}
      <div style={{ maxWidth: 430, margin: "0 auto", paddingBottom: 100 }}>
        {/* ── Avatar + name card ── */}
        <div
          style={{
            background: isDark ? "#1a2232" : "#ffffff",
            padding: "28px 20px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            border: isDark
              ? "1px solid rgba(255,255,255,0.05)"
              : "1px solid rgba(0,0,0,0.06)",
            borderRadius: 20,
            margin: "12px 16px 0",
            position: "relative",
          }}
        >
          {/* Avatar */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#3b82f6 0%,#8b5cf6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
                fontWeight: 700,
                color: "white",
                boxShadow: isDark
                  ? "0 4px 24px rgba(59,130,246,0.4)"
                  : "0 4px 20px rgba(59,130,246,0.3)",
              }}
            >
              A
            </div>
            {/* camera button */}
            <button
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "#25d366",
                border: `2px solid ${isDark ? "#1a2232" : "#fff"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {Icon.camera}
            </button>
          </div>

          {/* Name + edit */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
              }}
            >
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: titleClr,
                }}
              >
                User Name
              </span>
              <span style={{ color: "#3b82f6", cursor: "pointer" }}>
                {Icon.edit}
              </span>
            </div>

            {/* Phone */}
            <div style={{ fontSize: 14, color: subClr, marginTop: 2 }}>
              +91 12345 43210
            </div>
          </div>

          {/* About */}
          <div
            style={{
              width: "100%",
              background: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc",
              borderRadius: 12,
              padding: "10px 14px",
              border: isDark
                ? "1px solid rgba(255,255,255,0.06)"
                : "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#25d366",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                marginBottom: 3,
              }}
            >
              About
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 14, color: aboutClr }}>
                Hey there! I am using Croissix 👋
              </span>
              <span
                style={{ color: "#3b82f6", cursor: "pointer", marginLeft: 8 }}
              >
                {Icon.edit}
              </span>
            </div>
          </div>

          {/* QR code row */}
          <button
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 12,
              background: isDark
                ? "rgba(37,211,102,0.1)"
                : "rgba(37,211,102,0.08)",
              border: "1px solid rgba(37,211,102,0.2)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
            }}
          >
            <span style={{ color: "#25d366" }}>{Icon.qr}</span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#25d366",
                letterSpacing: "-0.01em",
              }}
            >
              Review QR Code
            </span>
            <span
              style={{ marginLeft: "auto", color: "#25d366", opacity: 0.6 }}
            >
              {Icon.chevron}
            </span>
          </button>
        </div>

        {/* ── Settings sections ── */}
        <div
          style={{
            padding: "16px 16px 0",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* Privacy & Security */}
          <Section isDark={isDark}>
            <Row
              icon={Icon.google_profile_management}
              iconBg={isDark ? "#1e2a42" : "#f1f5f9"}
              label="Google Profile Manager"
              isDark={isDark}
            />
            <Row
              icon={Icon.notification}
              iconBg="#f97316"
              label="Notifications"
              isDark={isDark}
            />
            <Row
              icon={Icon.privacy}
              iconBg="#8b5cf6"
              label="Privacy"
              isDark={isDark}
            />
            <Row
              icon={Icon.security}
              iconBg="#3b82f6"
              label="Security"
              value="2-step off"
              isDark={isDark}
            />
          </Section>

          {/* Chats & Storage */}
          <Section isDark={isDark}>
            <Row
              icon={Icon.chats}
              iconBg="#25d366"
              label="Chats"
              isDark={isDark}
            />
            <Row
              icon={Icon.storage}
              iconBg="#06b6d4"
              label="Storage and Data"
              value="1.2 GB"
              isDark={isDark}
            />
          </Section>

          {/* Help */}
          <Section isDark={isDark}>
            <Row
              icon={Icon.help}
              iconBg="#64748b"
              label="Help"
              isDark={isDark}
            />
            <Row
              icon={Icon.invite}
              iconBg="#10b981"
              label="Invite a Friend"
              isDark={isDark}
            />
            <Row
              icon={Icon.theme}
              iconBg={isDark ? "#334155" : "#1e293b"}
              label="Theme"
              value={isDark ? "Dark" : "Light"}
              isDark={isDark}
              onClick={() => setTheme(isDark ? "light" : "dark")}
            />
          </Section>

          {/* Logout */}
          <Section isDark={isDark}>
            <Row
              icon={Icon.logout}
              iconBg="rgba(239,68,68,0.15)"
              label="Log Out"
              destructive
              isDark={isDark}
            />
          </Section>

          {/* App version footer */}
          <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
            <div style={{ fontSize: 12, color: subClr }}>
              Croissix · Version 0.1
            </div>
            <div
              style={{
                fontSize: 11,
                color: subClr,
                marginTop: 2,
                opacity: 0.6,
              }}
            >
              from Vipprow
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
