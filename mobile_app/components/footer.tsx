"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const navItems = [
  {
    href: "/",
    label: "Home",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"
          fill={active ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={active ? 0 : 1.8}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/explore",
    label: "Explore",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle
          cx="11" cy="11" r="7.5"
          stroke="currentColor" strokeWidth="1.8"
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? 0.15 : 0}
        />
        <path d="M17 17L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        {active && <circle cx="11" cy="11" r="3" fill="currentColor" />}
      </svg>
    ),
  },
  {
    href: "/notifications",
    label: "Alerts",
    badge: 3,
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
          stroke="currentColor" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round"
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? 0.15 : 0}
        />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"
          fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0} />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8"
          strokeLinecap="round" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.1 : 0} />
      </svg>
    ),
  },
];

export default function Footer() {
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <>
      {/* Spacer */}
      <div className="h-20 md:h-0" />

      <footer
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          /* Switch CSS vars by toggling a data attribute so all tokens update at once */
          ...(mounted && isDark
            ? {
                "--color-nav-bg":        "var(--color-nav-bg-dark)",
                "--color-nav-border":    "var(--color-nav-border-dark)",
                "--color-nav-active":    "var(--color-nav-active-dark)",
                "--color-nav-active-bg": "var(--color-nav-active-bg-dark)",
                "--color-nav-inactive":  "var(--color-nav-inactive-dark)",
                "--color-nav-shadow":    "var(--color-nav-shadow-dark)",
                "--color-badge-border":  "var(--color-badge-border-dark)",
              }
            : {}),
          background: "var(--color-nav-bg)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderTop: "1px solid var(--color-nav-border)",
          paddingBottom: "env(safe-area-inset-bottom)",
          boxShadow: "0 -4px 32px var(--color-nav-shadow)",
          transition: "background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
        } as React.CSSProperties}
      >
        <nav className="flex items-center justify-around px-2 pt-2 pb-1">
          {navItems.map(({ href, label, icon, badge }) => {
            const active = href === "/" ? pathname === "/" : pathname?.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-0.5 min-w-[60px] relative"
                style={{ textDecoration: "none" }}
              >
                {/* Icon pill */}
                <span
                  style={{
                    width: 44,
                    height: 32,
                    borderRadius: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    background: active ? "var(--color-nav-active-bg)" : "transparent",
                    color: active ? "var(--color-nav-active)" : "var(--color-nav-inactive)",
                    transition: "background 0.2s ease, color 0.2s ease",
                  }}
                >
                  {icon(!!active)}

                  {badge && (
                    <span
                      style={{
                        position: "absolute",
                        top: 2,
                        right: 4,
                        background: "#ef4444",
                        color: "white",
                        fontSize: 10,
                        fontWeight: 700,
                        lineHeight: 1,
                        borderRadius: 10,
                        minWidth: 16,
                        height: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 4px",
                        border: "2px solid var(--color-badge-border)",
                        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                        transition: "border-color 0.3s ease",
                      }}
                    >
                      {badge}
                    </span>
                  )}
                </span>

                {/* Label */}
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: active ? 600 : 400,
                    letterSpacing: "0.01em",
                    color: active ? "var(--color-nav-active)" : "var(--color-nav-inactive)",
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', var(--font-sans)",
                    transition: "color 0.2s ease",
                    lineHeight: 1.2,
                  }}
                >
                  {label}
                </span>

                {/* Active dot */}
                {active && (
                  <span
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: "var(--color-nav-active)",
                      marginTop: 2,
                    }}
                  />
                )}
              </Link>
            );
          })}

        </nav>
      </footer>
    </>
  );
}