"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";

/* ── Dark / Light token maps ─────────────────────────────── */
const D = {
  pageBg:   "#0d1421",
  cardBg:   "#131c2d",
  surface:  "#182236",
  raised:   "#1e2a42",
  border:   "rgba(255,255,255,0.06)",
  divider:  "rgba(255,255,255,0.05)",
  text:     "#eef2ff",
  sub:      "#64748b",
  muted:    "#94a3b8",
  pressed:  "rgba(255,255,255,0.05)",
  chevClr:  "#2d3f58",
};
const L = {
  pageBg:   "#f2f2f7",
  cardBg:   "#ffffff",
  surface:  "#f8fafc",
  raised:   "#f1f5f9",
  border:   "rgba(0,0,0,0.06)",
  divider:  "rgba(0,0,0,0.06)",
  text:     "#0f172a",
  sub:      "#8e8e93",
  muted:    "#6b7280",
  pressed:  "rgba(0,0,0,0.04)",
  chevClr:  "#c7d2dc",
};
type Theme = typeof D;

/* ── Google G icon ───────────────────────────────────────── */
const GoogleG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M21.805 10.023H12v3.977h5.617c-.245 1.36-1.017 2.514-2.164 3.29v2.73h3.503C20.938 18.202 22 15.298 22 12c0-.66-.069-1.305-.195-1.977z" fill="#4285F4"/>
    <path d="M12 22c2.97 0 5.46-.984 7.28-2.668l-3.503-2.73c-.984.66-2.245 1.05-3.777 1.05-2.9 0-5.36-1.958-6.24-4.59H2.15v2.817C3.96 19.983 7.7 22 12 22z" fill="#34A853"/>
    <path d="M5.76 13.062A6.05 6.05 0 0 1 5.44 12c0-.37.063-.73.163-1.062V8.121H2.15A9.987 9.987 0 0 0 2 12c0 1.61.387 3.13 1.07 4.477l3.69-2.817-.001-.598z" fill="#FBBC05"/>
    <path d="M12 5.958c1.637 0 3.105.563 4.26 1.667l3.195-3.195C17.455 2.693 14.965 1.6 12 1.6 7.7 1.6 3.96 3.617 2.15 7.12l3.61 2.817C6.64 7.305 9.1 5.958 12 5.958z" fill="#EA4335"/>
  </svg>
);

/* ── Small icons ─────────────────────────────────────────── */
const ChevronRight = () => (
  <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
    <path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const ChevronDown = () => (
  <svg width="12" height="7" viewBox="0 0 12 7" fill="none">
    <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
  </svg>
);
const ExternalLink = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="15 3 21 3 21 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

/* ── GMB links data ──────────────────────────────────────── */
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
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
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
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
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
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/>
        <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.8"/>
        <polyline points="21 15 16 10 5 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
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
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <line x1="18" y1="20" x2="18" y2="10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="12" y1="20" x2="12" y2="4"  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="6"  y1="20" x2="6"  y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
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
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
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
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
        <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

/* ── Link sub-row ─────────────────────────────────────────── */
function LinkRow({ link, t, delay }: { link: GmbLink; t: Theme; delay: number }) {
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
        gap: 12,
        padding: "11px 16px 11px 20px",
        background: pressed ? t.pressed : "transparent",
        textDecoration: "none",
        cursor: "pointer",
        transition: "background .1s",
        WebkitTapHighlightColor: "transparent",
        animation: `slideIn 0.22s ease both`,
        animationDelay: `${delay}ms`,
      }}
    >
      {/* color accent bar */}
      <div style={{
        width: 3, height: 32, borderRadius: 2,
        background: link.color, flexShrink: 0, marginLeft: 8,
      }} />

      {/* icon */}
      <div style={{
        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
        background: `${link.color}18`,
        border: `1px solid ${link.color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: link.color,
      }}>
        {link.icon()}
      </div>

      {/* text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14.5, fontWeight: 500, color: t.text,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {link.label}
        </div>
        <div style={{
          fontSize: 12, color: t.sub, marginTop: 1,
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
        }}>
          {link.desc}
        </div>
      </div>

      {/* + Link button */}
      <div style={{
        display: "flex", alignItems: "center", gap: 4,
        background: `${link.color}15`,
        border: `1px solid ${link.color}35`,
        borderRadius: 20, padding: "4px 10px",
        color: link.color,
        flexShrink: 0,
      }}>
        <PlusIcon />
        <span style={{
          fontSize: 12, fontWeight: 600,
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          letterSpacing: "0.01em",
        }}>
          Link
        </span>
        <ExternalLink />
      </div>
    </Link>
  );
}

/* ── Main expandable row ─────────────────────────────────── */
function GoogleProfileRow({ t, isDark }: { t: Theme; isDark: boolean }) {
  const [open, setOpen] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <div style={{
      background: t.cardBg,
      borderRadius: 16,
      overflow: "hidden",
      border: `1px solid ${t.border}`,
      transition: "box-shadow .2s",
      marginTop:"2rem",
      boxShadow: open
        ? isDark
          ? "0 8px 32px rgba(0,0,0,0.45)"
          : "0 8px 28px rgba(66,133,244,0.12)"
        : "none",
    }}>

      {/* ── Header row ── */}
      <div
        role="button" tabIndex={0}
        onClick={() => setOpen(o => !o)}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        style={{
          display: "flex", alignItems: "center", gap: 13,
          padding: "13px 16px",
          background: pressed ? t.pressed : "transparent",
          cursor: "pointer", transition: "background .1s",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {/* Google G icon bubble */}
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: isDark ? "#1e2a42" : "#f1f5f9",
          border: `1px solid ${t.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <GoogleG />
        </div>

        {/* label */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 15.5, fontWeight: 500, color: t.text,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
            letterSpacing: "-0.01em",
          }}>
            Google Profile Manager
          </div>
          {open && (
            <div style={{
              fontSize: 11.5, color: t.sub, marginTop: 1,
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            }}>
              {GMB_LINKS.length} quick links available
            </div>
          )}
        </div>

        {/* chevron */}
        <span style={{
          color: t.chevClr,
          transform: open ? "rotate(0deg)" : "rotate(-90deg)",
          transition: "transform .22s cubic-bezier(.4,0,.2,1)",
          display: "flex",
        }}>
          <ChevronDown />
        </span>
      </div>

      {/* ── Expanded link rows ── */}
      {open && (
        <>
          <div style={{ height: 1, background: t.divider }} />

          {/* sub-header */}
          <div style={{
            padding: "8px 20px 6px",
            fontSize: 11, fontWeight: 600,
            color: "#4285F4",
            letterSpacing: "0.06em", textTransform: "uppercase",
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          }}>
            Quick Access
          </div>

          {GMB_LINKS.map((link, i) => (
            <div key={link.id}>
              <LinkRow link={link} t={t} delay={i * 35} />
              {i < GMB_LINKS.length - 1 && (
                <div style={{ height: 1, marginLeft: 72, background: t.divider }} />
              )}
            </div>
          ))}

          {/* footer */}
          <div style={{
            padding: "10px 20px 14px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <a
              href="https://business.google.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 13, fontWeight: 600, color: "#4285F4",
                textDecoration: "none",
                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              }}
            >
              Open Google Business
              <ExternalLink />
            </a>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────── */
export default function GoogleProfilePage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const t = isDark ? D : L;

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: t.pageBg,
        transition: "background .3s",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
      }}>
        <div style={{ maxWidth: 430, margin: "0 auto", padding: "16px 16px 100px" }}>

          {/* Page label */}
          <div style={{
            fontSize: 13, fontWeight: 600, color: t.sub,
            letterSpacing: "0.05em", textTransform: "uppercase",
            padding: "4px 4px 10px",
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          }}>
            Business Tools
          </div>

          <GoogleProfileRow t={t} isDark={isDark} />

        </div>
      </div>
    </>
  );
}