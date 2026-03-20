// mobile_app\components\desktop_topbar.tsx

"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { Sun, Moon } from "lucide-react";

function AISparkle() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      className="overflow-visible"
    >
      <defs>
        <linearGradient
          id="gGrad3"
          x1="3"
          y1="2"
          x2="21"
          y2="20"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="white" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#a5f3fc" stopOpacity="1" />
          <stop offset="100%" stopColor="#c4b5fd" stopOpacity="1" />
        </linearGradient>
      </defs>
      <path
        d="M12 2L13.8 9.2L21 11L13.8 12.8L12 20L10.2 12.8L3 11L10.2 9.2L12 2Z"
        stroke="url(#gGrad3)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="url(#gGrad3)"
        fillOpacity="0.3"
      />
    </svg>
  );
}

/* Map hrefs → page titles */
const PAGE_TITLES: Record<string, string> = {
  "/": "Home",
  "/analysis": "Analysis",
  "/post": "Post",
  "/reviews": "Reviews",
  "/profile": "Profile",
};

function getTitle(pathname: string) {
  for (const [key, val] of Object.entries(PAGE_TITLES)) {
    if (key === "/" ? pathname === "/" : pathname.startsWith(key)) return val;
  }
  return "Croissix";
}

/* ════════════════════════════════════════════════════════════ */
export function DesktopTopbar() {
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const title = getTitle(pathname ?? "/");

  return (
    <header
      className="hidden md:flex sticky top-0 z-30 items-center justify-between h-[60px] px-6"
      style={{
        background: isDark
          ? scrolled
            ? "rgba(10,14,26,0.95)"
            : "transparent"
          : scrolled
            ? "rgba(255,255,255,0.95)"
            : "transparent",
        backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
        borderBottom: scrolled
          ? `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`
          : "1px solid transparent",
        transition:
          "background .3s ease, border-color .25s ease, backdrop-filter .3s ease",
      }}
    >
      {/* Page title */}
      <h1
        className="text-[18px] font-bold"
        style={{
          letterSpacing: "-0.03em",
          color: isDark ? "#f0f4ff" : "#0f172a",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        }}
      >
        {title}
      </h1>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 active:scale-95"
          style={{
            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
            color: isDark ? "rgba(148,163,184,0.9)" : "rgba(71,85,105,0.9)",
          }}
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun size={15} strokeWidth={1.8} />
          ) : (
            <Moon size={15} strokeWidth={1.8} />
          )}
        </button>

        {/* Ask AI */}
        <a
        href="/ai"
          className="flex items-center gap-2 h-9 px-4 rounded-xl text-white text-[13px] font-semibold transition-all duration-150 active:scale-[0.97]"
          style={{
            background: isDark
              ? "linear-gradient(135deg,rgba(30,58,138,.9) 0%,rgba(37,99,235,.9) 100%)"
              : "linear-gradient(135deg,#2563eb 0%,#60a5fa 100%)",
            boxShadow: isDark
              ? "0 2px 12px rgba(37,99,235,0.4)"
              : "0 2px 12px rgba(37,99,235,0.32)",
            letterSpacing: "-0.01em",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
          }}
        >
          <AISparkle />
          Ask AI
        </a>
      </div>
    </header>
  );
}
