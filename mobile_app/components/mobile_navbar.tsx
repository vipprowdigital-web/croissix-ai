"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { useTheme } from "next-themes";
import { Logo } from "@/components/icons";

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M17 17L22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function AISparkle() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L13.8 9.2L21 11L13.8 12.8L12 20L10.2 12.8L3 11L10.2 9.2L12 2Z"
        stroke="white"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="white"
        fillOpacity="0.25"
      />
      <circle cx="19.5" cy="4.5" r="1.2" fill="white" fillOpacity="0.7" />
      <circle cx="4.5"  cy="19"  r="1"   fill="white" fillOpacity="0.5" />
    </svg>
  );
}

export const MobileNavbar = () => {
  const { resolvedTheme } = useTheme();
  const [mounted,  setMounted]  = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  /* ── design tokens ── */
  const bg          = isDark ? "rgba(10,14,26,0.92)"    : "rgba(255,255,255,0.88)";
  const border      = isDark ? "rgba(255,255,255,0.07)" : "rgba(37,99,235,0.12)";
  const iconBg      = isDark ? "rgba(96,165,250,0.12)"  : "rgba(37,99,235,0.08)";
  const iconColor   = isDark ? "#60a5fa"                : "#2563eb";
  const titleColor  = isDark ? "#f0f4ff"                : "#0f172a";
  const tagColor    = isDark ? "#60a5fa"                : "#2563eb";

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 md:hidden"
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          background: bg,
          backdropFilter:       "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderBottom: `1px solid ${scrolled ? border : "transparent"}`,
          boxShadow: scrolled
            ? isDark ? "0 2px 24px rgba(0,0,0,0.45)" : "0 2px 16px rgba(37,99,235,0.07)"
            : "none",
          transition: "border-color .25s ease, box-shadow .25s ease, background .3s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            minHeight: 56,
          }}
        >

          {/* ══ LEFT: icon + name ══ */}
          <NextLink
            href="/"
            style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
          >
            {/* rounded app icon */}
            <span
              style={{
                width: 36, height: 36,
                borderRadius: 10,
                background: isDark
                  ? "linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)"
                  : "linear-gradient(135deg,#2563eb 0%,#60a5fa 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff",
                flexShrink: 0,
                boxShadow: isDark
                  ? "0 2px 10px rgba(37,99,235,0.45)"
                  : "0 2px 10px rgba(37,99,235,0.28)",
              }}
            >
              <Logo />
            </span>

            {/* name + tagline stack */}
            <span style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', var(--font-sans)",
                  fontSize: 17,
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: titleColor,
                  lineHeight: 1.15,
                  transition: "color .3s",
                }}
              >
                Croissix
              </span>
              <span
                style={{
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', var(--font-sans)",
                  fontSize: 10.5,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: tagColor,
                  lineHeight: 1,
                  opacity: 0.9,
                  transition: "color .3s",
                }}
              >
                AI-Powered
              </span>
            </span>
          </NextLink>

          {/* ══ RIGHT: search + AI ══ */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

            {/* Search */}
            {/* <button
              aria-label="Search"
              style={{
                width: 36, height: 36,
                borderRadius: 11,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: iconBg,
                border: "none",
                cursor: "pointer",
                color: iconColor,
                WebkitTapHighlightColor: "transparent",
                transition: "background .2s, transform .12s",
              }}
              onPointerDown={e => (e.currentTarget.style.transform = "scale(0.91)")}
              onPointerUp={e   => (e.currentTarget.style.transform = "scale(1)")}
              onPointerLeave={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              <SearchIcon />
            </button> */}

            {/* AI */}
            <button
              aria-label="AI Assistant"
              style={{
                height: 36,
                paddingInline: 13,
                borderRadius: 11,
                display: "flex", alignItems: "center", gap: 5,
                background: isDark
                  ? "linear-gradient(135deg,rgba(30,58,138,.85) 0%,rgba(37,99,235,.85) 100%)"
                  : "linear-gradient(135deg,#2563eb 0%,#60a5fa 100%)",
                border: "none",
                cursor: "pointer",
                color: "#fff",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', var(--font-sans)",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                boxShadow: isDark
                  ? "0 2px 14px rgba(37,99,235,0.4)"
                  : "0 2px 14px rgba(37,99,235,0.32)",
                WebkitTapHighlightColor: "transparent",
                transition: "opacity .2s, transform .12s",
              }}
              onPointerDown={e => (e.currentTarget.style.transform = "scale(0.93)")}
              onPointerUp={e   => (e.currentTarget.style.transform = "scale(1)")}
              onPointerLeave={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              <AISparkle />
              <span>Ask AI</span>
            </button>

          </div>
        </div>
      </header>

      {/* Spacer */}
      <div
        className="md:hidden"
        style={{ height: "calc(env(safe-area-inset-top, 0px) + 56px)" }}
      />
    </>
  );
};