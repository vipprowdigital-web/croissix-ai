// mobile_app\components\desktop_sidebar.tsx

"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import Image from "next/image";
import croissix_logo from "@/public/assets/images/logo/croissix.png";

/* ── AI Sparkle (reused from MobileNavbar) ───────────────── */
function AISparkle() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className="overflow-visible"
    >
      <style>{`
        @keyframes gemini-star {
          0%,100% { transform: scale(1) rotate(0deg); filter: brightness(1); }
          25%      { transform: scale(1.2) rotate(12deg); filter: brightness(1.4); }
          50%      { transform: scale(0.85) rotate(0deg); filter: brightness(0.9); }
          75%      { transform: scale(1.15) rotate(-10deg); filter: brightness(1.3); }
        }
        @keyframes gemini-shimmer {
          0%,100% { stop-color: white; stop-opacity: 0.9; }
          33%      { stop-color: #a5f3fc; stop-opacity: 1; }
          66%      { stop-color: #c4b5fd; stop-opacity: 1; }
        }
        .g-star2 { transform-origin:12px 11px; animation: gemini-star 2.8s ease-in-out infinite; }
        .g-s1 { animation: gemini-shimmer 2.8s ease-in-out infinite; }
        .g-s2 { animation: gemini-shimmer 2.8s ease-in-out infinite 0.9s; }
        .g-s3 { animation: gemini-shimmer 2.8s ease-in-out infinite 1.8s; }
      `}</style>
      <defs>
        <linearGradient
          id="gGrad2"
          x1="3"
          y1="2"
          x2="21"
          y2="20"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            className="g-s1"
            stopColor="white"
            stopOpacity="0.9"
          />
          <stop
            offset="50%"
            className="g-s2"
            stopColor="#a5f3fc"
            stopOpacity="1"
          />
          <stop
            offset="100%"
            className="g-s3"
            stopColor="#c4b5fd"
            stopOpacity="1"
          />
        </linearGradient>
      </defs>
      <path
        className="g-star2"
        d="M12 2L13.8 9.2L21 11L13.8 12.8L12 20L10.2 12.8L3 11L10.2 9.2L12 2Z"
        stroke="url(#gGrad2)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="url(#gGrad2)"
        fillOpacity="0.3"
      />
    </svg>
  );
}

/* ── Icons ───────────────────────────────────────────────── */
const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"
      fill={active ? "currentColor" : "none"}
      fillOpacity={active ? 0.18 : 0}
      stroke="currentColor"
      strokeWidth={active ? 1.6 : 1.8}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
);

const AnalysisIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect
      x="3"
      y="12"
      width="4"
      height="9"
      rx="1.5"
      fill={active ? "currentColor" : "none"}
      fillOpacity={active ? 0.2 : 0}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <rect
      x="10"
      y="7"
      width="4"
      height="14"
      rx="1.5"
      fill={active ? "currentColor" : "none"}
      fillOpacity={active ? 0.2 : 0}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <rect
      x="17"
      y="3"
      width="4"
      height="18"
      rx="1.5"
      fill={active ? "currentColor" : "none"}
      fillOpacity={active ? 0.2 : 0}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const PostIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="4"
      fill={active ? "currentColor" : "none"}
      fillOpacity={active ? 0.12 : 0}
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M12 8v8M8 12h8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const ReviewsIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2l2.4 4.8 5.6.8-4 3.9.9 5.5L12 14.5 7.1 17l.9-5.5L4 7.6l5.6-.8L12 2z"
      fill={active ? "currentColor" : "none"}
      fillOpacity={active ? 0.18 : 0}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
);

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle
      cx="12"
      cy="8"
      r="3.5"
      fill={active ? "currentColor" : "none"}
      fillOpacity={active ? 0.18 : 0}
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M4.5 20.5c0-4 3.4-7 7.5-7s7.5 3 7.5 7"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const NAV = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/analysis/google", label: "Analysis", Icon: AnalysisIcon },
  { href: "/post", label: "Post", Icon: PostIcon },
  { href: "/reviews/google", label: "Reviews", Icon: ReviewsIcon },
  { href: "/profile", label: "Profile", Icon: ProfileIcon },
] as const;

/* ════════════════════════════════════════════════════════════ */
export function DesktopSidebar() {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  const sidebarBg = isDark ? "rgba(10,14,26,0.97)" : "rgba(255,255,255,0.97)";
  const borderColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const titleColor = isDark ? "#f0f4ff" : "#0f172a";
  const tagColor = isDark ? "#60a5fa" : "#2563eb";

  return (
    <aside
      className="hidden md:flex flex-col w-[220px] lg:w-[240px] flex-shrink-0 fixed left-0 top-0 bottom-0 z-40"
      style={{
        background: sidebarBg,
        borderRight: `1px solid ${borderColor}`,
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
      }}
    >
      {/* ── Logo ── */}
      <div className="px-5 pt-6 pb-5">
        <NextLink href="/" className="flex items-center gap-3 no-underline">
          <span
            className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
            style={{
              background: isDark
                ? "linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)"
                : "linear-gradient(135deg,#2563eb 0%,#60a5fa 100%)",
              boxShadow: isDark
                ? "0 2px 10px rgba(37,99,235,0.45)"
                : "0 2px 10px rgba(37,99,235,0.28)",
            }}
          >
            <Image
              src={croissix_logo}
              width={36}
              height={36}
              alt="Logo"
              style={{ padding: "2px", borderRadius: 8 }}
            />
          </span>
          <span className="flex flex-col">
            <span
              className="text-[17px] font-bold leading-none"
              style={{
                letterSpacing: "-0.03em",
                color: titleColor,
                fontFamily:
                  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
              }}
            >
              Croissix
            </span>
            <span
              className="text-[10px] font-semibold uppercase mt-0.5"
              style={{
                letterSpacing: "0.06em",
                color: tagColor,
                fontFamily:
                  "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
              }}
            >
              AI-Powered{" "}
              <span
                style={{
                  color: isDark
                    ? "rgba(240,244,255,0.5)"
                    : "rgba(15,23,42,0.4)",
                }}
              >
                · Beta
              </span>
            </span>
          </span>
        </NextLink>
      </div>

      {/* ── Divider ── */}
      <div className="mx-4 mb-3 h-px" style={{ background: borderColor }} />

      {/* ── Nav items ── */}
      <nav className="flex-1 flex flex-col gap-1 px-3 overflow-y-auto">
        {NAV.map(({ href, label, Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname?.startsWith(href);
          return (
            <NextLink
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] no-underline transition-all duration-200"
              style={{
                background: active
                  ? isDark
                    ? "rgba(96,165,250,0.14)"
                    : "rgba(37,99,235,0.08)"
                  : "transparent",
                color: active
                  ? isDark
                    ? "#60a5fa"
                    : "#2563eb"
                  : isDark
                    ? "rgba(148,163,184,0.8)"
                    : "rgba(71,85,105,0.9)",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = isDark
                    ? "rgba(255,255,255,0.04)"
                    : "rgba(0,0,0,0.04)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = "transparent";
              }}
            >
              {/* Active indicator bar */}
              <span
                className="absolute left-0 rounded-r-full transition-all duration-300"
                style={{
                  width: active ? 3 : 0,
                  height: active ? 20 : 0,
                  background: isDark ? "#60a5fa" : "#2563eb",
                  opacity: active ? 1 : 0,
                  boxShadow: active
                    ? isDark
                      ? "0 0 8px rgba(96,165,250,0.7)"
                      : "0 0 8px rgba(37,99,235,0.4)"
                    : "none",
                }}
              />
              <span className="flex-shrink-0">
                <Icon active={active} />
              </span>
              <span
                className="text-[14px] transition-all duration-200"
                style={{
                  fontWeight: active ? 600 : 400,
                  letterSpacing: "-0.01em",
                  fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
                }}
              >
                {label}
              </span>
            </NextLink>
          );
        })}
      </nav>

      {/* ── Ask AI button ── */}
      <div className="px-3 pb-5 pt-3">
        <div className="h-px mb-3 mx-1" style={{ background: borderColor }} />
        <a
        href="/ai"
          className="w-full flex items-center justify-center gap-2 h-10 rounded-[12px] text-white text-[13px] font-semibold transition-all duration-150 active:scale-[0.97]"
          style={{
            background: isDark
              ? "linear-gradient(135deg,rgba(30,58,138,.9) 0%,rgba(37,99,235,.9) 100%)"
              : "linear-gradient(135deg,#2563eb 0%,#60a5fa 100%)",
            boxShadow: isDark
              ? "0 2px 14px rgba(37,99,235,0.4)"
              : "0 2px 14px rgba(37,99,235,0.32)",
            letterSpacing: "-0.01em",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
          }}
        >
          <AISparkle />
          Ask AI
        </a>
      </div>
    </aside>
  );
}
