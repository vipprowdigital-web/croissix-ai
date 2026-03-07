"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";

/*
  Dark palette anchored to rgb(13, 20, 33):
  ─────────────────────────────────────────
  Page bg   : rgb(13,  20,  33)   ← exact brand dark
  Card bg   : rgb(19,  28,  45)   ← +6/8/12 lift
  Surface   : rgb(24,  34,  54)   ← +11/14/21 lift
  Border    : rgba(255,255,255,0.06)
*/

const D = {
  pageBg: "rgb(13, 20, 33)",
  cardBg: "rgb(19, 28, 45)",
  surface: "rgb(24, 34, 54)",
  border: "rgba(255,255,255,0.06)",
  border2: "rgba(255,255,255,0.04)",
  text: "#eef2ff",
  sub: "#64748b",
  muted: "#94a3b8",
  divider: "rgba(255,255,255,0.05)",
  pressed: "rgba(255,255,255,0.05)",
};

const L = {
  pageBg: "#f2f2f7",
  cardBg: "#ffffff",
  surface: "#f8fafc",
  border: "rgba(0,0,0,0.06)",
  border2: "rgba(0,0,0,0.04)",
  text: "#0f172a",
  sub: "#8e8e93",
  muted: "#6b7280",
  divider: "rgba(0,0,0,0.06)",
  pressed: "rgba(0,0,0,0.05)",
};

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
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
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
  notification: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
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
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
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
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
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
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
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
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
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
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
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
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
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
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
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
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
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
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
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
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
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

/* ── Row ─────────────────────────────────────────────────────── */
function Row({
  icon,
  iconBg,
  label,
  value,
  destructive = false,
  t,
  onClick,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value?: string;
  destructive?: boolean;
  t: typeof D;
  onClick?: () => void;
}) {
  const [pressed, setPressed] = useState(false);
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
        gap: 13,
        padding: "12px 16px",
        background: pressed ? t.pressed : "transparent",
        cursor: "pointer",
        transition: "background .1s",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: iconBg,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: destructive ? "#ef4444" : "white",
        }}
      >
        {icon}
      </div>

      <span
        style={{
          flex: 1,
          fontSize: 15.5,
          fontWeight: 400,
          color: destructive ? "#ef4444" : t.text,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
          letterSpacing: "-0.01em",
        }}
      >
        {label}
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        {value && (
          <span
            style={{
              fontSize: 13.5,
              color: t.sub,
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            }}
          >
            {value}
          </span>
        )}
        <span style={{ color: t === D ? "#2d3f58" : "#c7d2dc" }}>
          {Icon.chevron}
        </span>
      </div>
    </div>
  );
}

/* ── Section ─────────────────────────────────────────────────── */
function Section({ children, t }: { children: React.ReactNode; t: typeof D }) {
  const arr = Array.isArray(children)
    ? (children as React.ReactNode[])
    : [children];
  return (
    <div
      style={{
        background: t.cardBg,
        borderRadius: 16,
        overflow: "hidden",
        border: `1px solid ${t.border}`,
      }}
    >
      {arr.map((child, i) => (
        <div key={i}>
          {child}
          {i < arr.length - 1 && (
            <div style={{ height: 1, marginLeft: 63, background: t.divider }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Google G icon ───────────────────────────────────────── */
const GoogleG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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

const ChevronDown = () => (
  <svg width="12" height="7" viewBox="0 0 12 7" fill="none">
    <path
      d="M1 1l5 5 5-5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const PlusIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 5v14M5 12h14"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
  </svg>
);
const ExternalLinkIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
    <path
      d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <polyline
      points="15 3 21 3 21 9"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="10"
      y1="14"
      x2="21"
      y2="3"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

interface GmbLink {
  id: string;
  label: string;
  desc: string;
  url: string;
  color: string;
  icon: () => React.ReactNode;
}

const GMB_LINKS: GmbLink[] = [
  {
    id: "dashboard",
    label: "Business Dashboard",
    desc: "Manage your Google listing",
    url: "https://business.google.com",
    color: "#4285F4",
    icon: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <rect
          x="3"
          y="3"
          width="7"
          height="7"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <rect
          x="14"
          y="3"
          width="7"
          height="7"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <rect
          x="3"
          y="14"
          width="7"
          height="7"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <rect
          x="14"
          y="14"
          width="7"
          height="7"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    ),
  },
  {
    id: "reviews",
    label: "Customer Reviews",
    desc: "Reply to reviews & ratings",
    url: "https://business.google.com/reviews",
    color: "#FBBC05",
    icon: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <polygon
          points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "photos",
    label: "Photos & Media",
    desc: "Upload business photos",
    url: "https://business.google.com/photos",
    color: "#34A853",
    icon: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle
          cx="8.5"
          cy="8.5"
          r="1.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <polyline
          points="21 15 16 10 5 21"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "insights",
    label: "Insights & Analytics",
    desc: "Views, clicks & searches",
    url: "https://business.google.com/insights",
    color: "#EA4335",
    icon: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <line
          x1="18"
          y1="20"
          x2="18"
          y2="10"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <line
          x1="12"
          y1="20"
          x2="12"
          y2="4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <line
          x1="6"
          y1="20"
          x2="6"
          y2="14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "posts",
    label: "Google Posts",
    desc: "Create updates & offers",
    url: "https://business.google.com/posts",
    color: "#8b5cf6",
    icon: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points="14 2 14 8 20 8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line
          x1="16"
          y1="13"
          x2="8"
          y2="13"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <line
          x1="16"
          y1="17"
          x2="8"
          y2="17"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "info",
    label: "Business Info",
    desc: "Hours, address & contact",
    url: "https://business.google.com/edit",
    color: "#06b6d4",
    icon: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <line
          x1="12"
          y1="8"
          x2="12"
          y2="12"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <line
          x1="12"
          y1="16"
          x2="12.01"
          y2="16"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

function GmbLinkRow({
  link,
  t,
  delay,
}: {
  link: GmbLink;
  t: ReturnType<typeof getTheme>;
  delay: number;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <Link
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "10px 16px 10px 16px",
        background: pressed ? t.pressed : "transparent",
        textDecoration: "none",
        cursor: "pointer",
        transition: "background .1s",
        WebkitTapHighlightColor: "transparent",
        animation: "gmbSlideIn 0.2s ease both",
        animationDelay: `${delay}ms`,
      }}
    >
      <div
        style={{
          width: 3,
          height: 28,
          borderRadius: 2,
          background: link.color,
          flexShrink: 0,
          marginLeft: 6,
        }}
      />
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          flexShrink: 0,
          background: `${link.color}18`,
          border: `1px solid ${link.color}28`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: link.color,
        }}
      >
        {link.icon()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 500,
            color: t.text,
            letterSpacing: "-0.01em",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {link.label}
        </div>
        <div
          style={{
            fontSize: 11,
            color: t.sub,
            marginTop: 1,
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          {link.desc}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 3,
          background: `${link.color}12`,
          border: `1px solid ${link.color}30`,
          borderRadius: 20,
          padding: "3px 9px",
          color: link.color,
          flexShrink: 0,
        }}
      >
        <PlusIcon />
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          Link
        </span>
        <ExternalLinkIcon />
      </div>
    </Link>
  );
}

function getTheme(isDark: boolean) {
  return isDark ? D : L;
}

function GoogleProfileRow({
  t,
  isDark,
}: {
  t: ReturnType<typeof getTheme>;
  isDark: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <div
      style={{
        background: t.cardBg,
        borderRadius: 16,
        overflow: "hidden",
        border: `1px solid ${t.border}`,
        boxShadow: open
          ? isDark
            ? "0 8px 32px rgba(0,0,0,0.45)"
            : "0 8px 28px rgba(66,133,244,0.1)"
          : "none",
        transition: "box-shadow .2s",
      }}
    >
      {/* header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 13,
          padding: "12px 16px",
          background: pressed ? t.pressed : "transparent",
          cursor: "pointer",
          transition: "background .1s",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            flexShrink: 0,
            background: isDark ? "#1e2a42" : "#f1f5f9",
            border: `1px solid ${t.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <GoogleG />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 15.5,
              fontWeight: 400,
              color: t.text,
              letterSpacing: "-0.01em",
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
            }}
          >
            Google Profile Manager
          </div>
          {open && (
            <div
              style={{
                fontSize: 11,
                color: "#4285F4",
                marginTop: 1,
                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              }}
            >
              {GMB_LINKS.length} quick links
            </div>
          )}
        </div>
        <span
          style={{
            color: t.chevClr,
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform .22s cubic-bezier(.4,0,.2,1)",
            display: "flex",
          }}
        >
          <ChevronDown />
        </span>
      </div>

      {/* expanded */}
      {open && (
        <>
          <div style={{ height: 1, background: t.divider }} />
          <div
            style={{
              padding: "7px 20px 5px",
              fontSize: 10.5,
              fontWeight: 600,
              color: "#4285F4",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            }}
          >
            Quick Access
          </div>
          {GMB_LINKS.map((link, i) => (
            <div key={link.id}>
              <GmbLinkRow link={link} t={t} delay={i * 30} />
              {i < GMB_LINKS.length - 1 && (
                <div
                  style={{ height: 1, marginLeft: 66, background: t.divider }}
                />
              )}
            </div>
          ))}
          <div
            style={{
              padding: "8px 20px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Link
              href="https://business.google.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12.5,
                fontWeight: 600,
                color: "#4285F4",
                textDecoration: "none",
                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              }}
            >
              Open Google Business <ExternalLinkIcon />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  const t = isDark ? D : L;

  return (
    <div
      style={{
        minHeight: "100vh",
        paddingTop:"3.5rem",
        background: t.pageBg,
        transition: "background .3s",
      }}
    >
      <div style={{ maxWidth: 430, margin: "0 auto", paddingBottom: 110 }}>
        {/* ── Profile card ── */}
        <div
          style={{
            background: t.cardBg,
            margin: "12px 16px 0",
            borderRadius: 20,
            padding: "28px 20px 20px",
            border: `1px solid ${t.border}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            boxShadow: isDark
              ? "0 8px 32px rgba(0,0,0,0.4)"
              : "0 4px 20px rgba(0,0,0,0.06)",
          }}
        >
          {/* Avatar */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                width: 92,
                height: 92,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#3b82f6 0%,#8b5cf6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 38,
                fontWeight: 700,
                color: "white",
                boxShadow: isDark
                  ? "0 4px 28px rgba(59,130,246,0.45)"
                  : "0 4px 20px rgba(59,130,246,0.3)",
              }}
            >
              A
            </div>
            <button
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 29,
                height: 29,
                borderRadius: "50%",
                background: "#25d366",
                border: `2.5px solid ${t.cardBg}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {Icon.camera}
            </button>
          </div>

          {/* Name */}
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
                  color: t.text,
                  fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
                }}
              >
                Alex Johnson
              </span>
              <span style={{ color: "#3b82f6", cursor: "pointer" }}>
                {Icon.edit}
              </span>
            </div>
            <div
              style={{
                fontSize: 13.5,
                color: t.sub,
                marginTop: 3,
                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              }}
            >
              +91 98765 43210
            </div>
          </div>

          {/* About */}
          <div
            style={{
              width: "100%",
              borderRadius: 12,
              padding: "10px 14px",
              background: t.surface,
              border: `1px solid ${t.border2}`,
            }}
          >
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: "#25d366",
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                marginBottom: 4,
                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
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
              <span
                style={{
                  fontSize: 14,
                  color: t.muted,
                  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                }}
              >
                Hey there! I am using WhatsApp 👋
              </span>
              <span
                style={{ color: "#3b82f6", cursor: "pointer", marginLeft: 8 }}
              >
                {Icon.edit}
              </span>
            </div>
          </div>

          {/* QR button */}
          <button
            style={{
              width: "100%",
              padding: "11px 14px",
              borderRadius: 12,
              background: isDark
                ? "rgba(37,211,102,0.08)"
                : "rgba(37,211,102,0.07)",
              border: "1px solid rgba(37,211,102,0.18)",
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
                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              }}
            >
              View QR Code
            </span>
            <span
              style={{ marginLeft: "auto", color: "#25d366", opacity: 0.55 }}
            >
              {Icon.chevron}
            </span>
          </button>
        </div>

        {/* ── Sections ── */}
        <div
          style={{
            padding: "10px 16px 0",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >

          
          <GoogleProfileRow t={t} isDark={isDark} />
          
          <Section t={t}>
            <Row
              icon={Icon.notification}
              iconBg="#f97316"
              label="Notifications"
              t={t}
            />
            <Row icon={Icon.privacy} iconBg="#8b5cf6" label="Privacy" t={t} />
            <Row
              icon={Icon.security}
              iconBg="#2563eb"
              label="Security"
              value="2-step off"
              t={t}
            />
          </Section>

          <Section t={t}>
            <Row icon={Icon.chats} iconBg="#25d366" label="Chats" t={t} />
            <Row
              icon={Icon.storage}
              iconBg="#06b6d4"
              label="Storage and Data"
              value="1.2 GB"
              t={t}
            />
          </Section>


          <style>{`@keyframes gmbSlideIn{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}`}</style>

          <Section t={t}>
            <Row icon={Icon.help} iconBg="#64748b" label="Help" t={t} />
            <Row
              icon={Icon.invite}
              iconBg="#10b981"
              label="Invite a Friend"
              t={t}
            />
            <Row
              icon={Icon.theme}
              iconBg={isDark ? "rgb(24,34,54)" : "#1e293b"}
              label="Theme"
              value={isDark ? "Dark" : "Light"}
              t={t}
              onClick={() => setTheme(isDark ? "light" : "dark")}
            />
          </Section>

          <Section t={t}>
            <Row
              icon={Icon.logout}
              iconBg="rgba(239,68,68,0.14)"
              label="Log Out"
              destructive
              t={t}
            />
          </Section>

          <div style={{ textAlign: "center", padding: "10px 0 4px" }}>
            <div
              style={{
                fontSize: 12,
                color: t.sub,
                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              }}
            >
              Croissix · Version 0.01
            </div>
            <div
              style={{
                fontSize: 11,
                color: t.sub,
                marginTop: 1,
                opacity: 0.5,
                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
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
