"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

/* ── icons ──────────────────────────────────────────────── */
const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"
      fill={active ? "currentColor" : "none"}
      fillOpacity={active ? 0.18 : 0}
      stroke="currentColor"
      strokeWidth={active ? 1.6 : 1.8}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
    {active && (
      <path d="M9 21V15H15V21" fill="currentColor" fillOpacity={0.25} stroke="none"/>
    )}
  </svg>
);

const AnalysisIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="12" width="4" height="9" rx="1.5"
      fill={active ? "currentColor" : "none"}
      fillOpacity={active ? 0.2 : 0}
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <rect x="10" y="7" width="4" height="14" rx="1.5"
      fill={active ? "currentColor" : "none"}
      fillOpacity={active ? 0.2 : 0}
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <rect x="17" y="3" width="4" height="18" rx="1.5"
      fill={active ? "currentColor" : "none"}
      fillOpacity={active ? 0.2 : 0}
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const PostIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="4"
      fill={active ? "currentColor" : "none"}
      fillOpacity={active ? 0.12 : 0}
      stroke="currentColor" strokeWidth="1.8"/>
    <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const ReviewsIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2l2.4 4.8 5.6.8-4 3.9.9 5.5L12 14.5 7.1 17l.9-5.5L4 7.6l5.6-.8L12 2z"
      fill={active ? "currentColor" : "none"}
      fillOpacity={active ? 0.18 : 0}
      stroke="currentColor" strokeWidth="1.8"
      strokeLinejoin="round" strokeLinecap="round"/>
  </svg>
);

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="3.5"
      fill={active ? "currentColor" : "none"}
      fillOpacity={active ? 0.18 : 0}
      stroke="currentColor" strokeWidth="1.8"/>
    <path d="M4.5 20.5c0-4 3.4-7 7.5-7s7.5 3 7.5 7"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

/* ── nav config ─────────────────────────────────────────── */
const NAV = [
  { href: "/",              label: "Home",     Icon: HomeIcon     },
  { href: "/analysis",      label: "Analysis", Icon: AnalysisIcon },
  { href: "/post",          label: "Post",     Icon: PostIcon      },
  { href: "/reviews/google",label: "Reviews",  Icon: ReviewsIcon  },
  { href: "/profile",       label: "Profile",  Icon: ProfileIcon  },
] as const;

/* ══════════════════════════════════════════════════════════ */
export default function Footer() {
  const pathname               = usePathname();
  const { resolvedTheme }      = useTheme();
  const [mounted, setMounted]  = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <>
      {/* body spacer so content isn't hidden behind fixed bar */}
      <div className="h-[84px] md:h-0" />

      <footer className="fixed bottom-0 left-0 right-0 z-50 md:hidden">

        {/* glass shell */}
        <div
          className="mx-3 mb-3 rounded-[26px] overflow-hidden"
          style={{
            background: isDark
              ? "rgba(13, 18, 30, 0.82)"
              : "rgba(255, 255, 255, 0.78)",
            backdropFilter: "blur(28px) saturate(200%)",
            WebkitBackdropFilter: "blur(28px) saturate(200%)",
            border: isDark
              ? "1px solid rgba(255,255,255,0.08)"
              : "1px solid rgba(0,0,0,0.07)",
            boxShadow: isDark
              ? "0 8px 40px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.04) inset"
              : "0 8px 32px rgba(0,0,0,0.10), 0 1px 0 rgba(255,255,255,0.9) inset",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          <nav className="flex items-center justify-around px-1 pt-2 pb-2">
            {NAV.map(({ href, label, Icon }) => {
              const active = href === "/" ? pathname === "/" : pathname?.startsWith(href);

              return (
                <a
                  key={href}
                  href={href}
                  className="flex flex-col items-center gap-[3px] min-w-[58px] select-none"
                  style={{ textDecoration: "none", WebkitTapHighlightColor: "transparent" }}
                >
                  {/* pill */}
                  <span
                    className="flex items-center justify-center transition-all duration-200"
                    style={{
                      width: 46,
                      height: 30,
                      borderRadius: 15,
                      background: active
                        ? isDark
                          ? "rgba(96,165,250,0.18)"
                          : "rgba(37,99,235,0.1)"
                        : "transparent",
                      color: active
                        ? isDark ? "#60a5fa" : "#2563eb"
                        : isDark ? "rgba(148,163,184,0.7)" : "rgba(100,116,139,0.8)",
                      transform: active ? "scale(1)" : "scale(0.96)",
                    }}
                  >
                    <Icon active={active} />
                  </span>

                  {/* label */}
                  <span
                    className="transition-all duration-200"
                    style={{
                      fontSize: 10,
                      fontWeight: active ? 700 : 400,
                      letterSpacing: active ? "-0.01em" : "0",
                      color: active
                        ? isDark ? "#60a5fa" : "#2563eb"
                        : isDark ? "rgba(100,116,139,0.8)" : "rgba(100,116,139,0.9)",
                      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
                      lineHeight: 1.2,
                    }}
                  >
                    {label}
                  </span>

                  {/* active dot */}
                  <span
                    className="transition-all duration-300"
                    style={{
                      width: active ? 4 : 0,
                      height: 4,
                      borderRadius: "50%",
                      background: isDark ? "#60a5fa" : "#2563eb",
                      opacity: active ? 1 : 0,
                      marginTop: 1,
                      boxShadow: active
                        ? isDark
                          ? "0 0 6px rgba(96,165,250,0.8)"
                          : "0 0 6px rgba(37,99,235,0.5)"
                        : "none",
                    }}
                  />
                </a>
              );
            })}
          </nav>
        </div>

      </footer>
    </>
  );
}