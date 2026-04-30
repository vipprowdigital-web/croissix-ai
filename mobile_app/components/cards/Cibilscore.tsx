"use client";

// mobile_app/components/CibilScore.tsx
//
// Fully dynamic — no hardcoded props.
// Fetches a real Google Business Profile health score from /api/google/accounts/profile-score.
//
// Usage in page.tsx:
//   <CibilScore />

import { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/features/user/hook/useUser";
import ImproveScoreButton from "../buttons/ImproveScoreButton";

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
interface ProfileScoreData {
  success: boolean;
  score: number;
  maxScore: number;
  change: number;
  meta: {
    locationName: string;
    avgRating: number;
    totalReviews: number;
    replyRate: number;
    postsLast30d: number;
    isVerified: boolean;
    isOpen: boolean;
  };
  missing: string[];
  breakdown: {
    completeness: { score: number; max: number };
    reputation: { score: number; max: number };
    activity: { score: number; max: number };
  };
}

/* ══════════════════════════════════════════════════════════
   ARC GEOMETRY
══════════════════════════════════════════════════════════ */
const ARC_START = 252;
const ARC_SWEEP = 217;

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcD(cx: number, cy: number, r: number, a0: number, a1: number) {
  const s = polar(cx, cy, r, a0);
  const e = polar(cx, cy, r, a1);
  const lg = (a1 - a0) % 360 > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${lg} 1 ${e.x} ${e.y}`;
}

/* ══════════════════════════════════════════════════════════
   COLOR INTERPOLATION
══════════════════════════════════════════════════════════ */
const STOPS = [
  { p: 0, hex: "#ef4444" },
  { p: 0.25, hex: "#f97316" },
  { p: 0.5, hex: "#eab308" },
  { p: 0.75, hex: "#84cc16" },
  { p: 1.0, hex: "#22c55e" },
];

function hexRgb(h: string) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
}

function colorAt(p: number) {
  for (let i = 1; i < STOPS.length; i++) {
    if (p <= STOPS[i].p) {
      const t = (p - STOPS[i - 1].p) / (STOPS[i].p - STOPS[i - 1].p);
      const [ar, ag, ab] = hexRgb(STOPS[i - 1].hex);
      const [br, bg, bb] = hexRgb(STOPS[i].hex);
      return `rgb(${Math.round(ar + (br - ar) * t)},${Math.round(ag + (bg - ag) * t)},${Math.round(ab + (bb - ab) * t)})`;
    }
  }
  return STOPS[STOPS.length - 1].hex;
}

/* ══════════════════════════════════════════════════════════
   SCORE LABEL
══════════════════════════════════════════════════════════ */
function getMeta(score: number, max = 1000) {
  const p = score / max;
  if (p < 0.3)
    return { label: "Poor", color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
  if (p < 0.5)
    return { label: "Fair", color: "#f97316", bg: "rgba(249,115,22,0.1)" };
  if (p < 0.65)
    return { label: "Good", color: "#eab308", bg: "rgba(234,179,8,0.1)" };
  if (p < 0.8)
    return { label: "Very Good", color: "#84cc16", bg: "rgba(132,204,22,0.1)" };
  return { label: "Excellent", color: "#22c55e", bg: "rgba(34,197,94,0.1)" };
}

/* ══════════════════════════════════════════════════════════
   BAND LABELS  (0–1000 scale)
══════════════════════════════════════════════════════════ */
const BANDS = [
  { label: "Poor", from: 0, to: 299 },
  { label: "Fair", from: 300, to: 499 },
  { label: "Good", from: 500, to: 649 },
  { label: "Very Good", from: 650, to: 799 },
  { label: "Excellent", from: 800, to: 1000 },
];

/* ══════════════════════════════════════════════════════════
   SKELETON
══════════════════════════════════════════════════════════ */
function Skeleton({ isDark }: { isDark: boolean }) {
  const pulse = isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0";
  const bg = isDark ? "#0f1624" : "#fff";
  return (
    <div
      style={{
        width: 340,
        borderRadius: 28,
        padding: "24px 20px 20px",
        background: bg,
        border: isDark
          ? "1px solid rgba(255,255,255,0.06)"
          : "1px solid rgba(37,99,235,0.07)",
        boxShadow: isDark
          ? "0 24px 60px rgba(0,0,0,.6)"
          : "0 16px 48px rgba(37,99,235,.12)",
        display: "flex",
        flexDirection: "column" as const,
        gap: 16,
        fontFamily:
          "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              width: 80,
              height: 10,
              borderRadius: 6,
              background: pulse,
              marginBottom: 6,
            }}
          />
          <div
            style={{
              width: 140,
              height: 14,
              borderRadius: 6,
              background: pulse,
            }}
          />
        </div>
        <div
          style={{ width: 72, height: 28, borderRadius: 12, background: pulse }}
        />
      </div>
      <div
        style={{
          width: "100%",
          height: 200,
          borderRadius: 16,
          background: pulse,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            border: `3px solid ${isDark ? "rgba(255,255,255,0.07)" : "#e2e8f0"}`,
          }}
        />
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            style={{ flex: 1, height: 36, borderRadius: 8, background: pulse }}
          />
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   NOT CONNECTED
══════════════════════════════════════════════════════════ */
function NotConnected({ isDark }: { isDark: boolean }) {
  const bg = isDark ? "#0f1624" : "#fff";
  const titleClr = isDark ? "#f0f6ff" : "#0f172a";
  const subClr = isDark ? "#64748b" : "#94a3b8";
  return (
    <div
      style={{
        width: 340,
        borderRadius: 28,
        padding: "36px 20px",
        background: bg,
        border: isDark
          ? "1px solid rgba(255,255,255,0.06)"
          : "1px solid rgba(37,99,235,0.07)",
        boxShadow: isDark
          ? "0 24px 60px rgba(0,0,0,.6)"
          : "0 16px 48px rgba(37,99,235,.12)",
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        gap: 8,
        textAlign: "center" as const,
        fontFamily: "-apple-system,BlinkMacSystemFont,sans-serif",
      }}
    >
      <div style={{ fontSize: 36, marginBottom: 4 }}>🔗</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: titleClr }}>
        No Google Business Linked
      </div>
      <div
        style={{ fontSize: 12, color: subClr, maxWidth: 220, lineHeight: 1.6 }}
      >
        Connect your Google Business Profile in the Profile page to see your
        health score.
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function CibilScore() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  const { data: user, isLoading: userLoading } = useUser();

  function getToken() {
    return typeof window !== "undefined"
      ? localStorage.getItem("accessToken")
      : null;
  }

  const { data, isLoading } = useQuery<ProfileScoreData>({
    queryKey: ["profile-score", user?.googleLocationId],
    queryFn: async () => {
      const res = await fetch(
        `/api/google/accounts/profile-score?locationId=${user!.googleLocationId}`,
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed");
      return json;
    },
    enabled: !!user?.googleLocationId,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const score = data?.score ?? 0;
  const maxScore = data?.maxScore ?? 1000;
  const change = data?.change ?? 0;

  /* ── count-up ── */
  useEffect(() => {
    if (!data) return;
    cancelAnimationFrame(rafRef.current);
    const dur = 1600,
      t0 = performance.now(),
      from = displayed,
      to = score;
    const tick = (now: number) => {
      const t = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(from + (to - from) * e));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    const id = setTimeout(() => {
      rafRef.current = requestAnimationFrame(tick);
    }, 350);
    return () => {
      clearTimeout(id);
      cancelAnimationFrame(rafRef.current);
    };
  }, [score]);

  /* ── design tokens ── */
  const card = isDark ? "#0f1624" : "#ffffff";
  const cardShadow = isDark
    ? "0 24px 60px rgba(0,0,0,.6)"
    : "0 16px 48px rgba(37,99,235,.12)";
  const trackBg = isDark ? "#1e2a42" : "#f1f5f9";
  const titleClr = isDark ? "#f0f6ff" : "#0f172a";
  const subClr = isDark ? "#64748b" : "#94a3b8";
  const divider = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const labelBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";
  const labelClr = isDark ? "#94a3b8" : "#64748b";
  const ff = "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif";

  /* ── early returns ── */
  if (!mounted || userLoading) return <Skeleton isDark={false} />;
  if (!user?.googleLocationId) return <NotConnected isDark={isDark} />;
  if (isLoading) return <Skeleton isDark={isDark} />;

  const meta = getMeta(score, maxScore);
  const scorePct = Math.min(Math.max(score / maxScore, 0), 1);
  const animPct = Math.min(Math.max(displayed / maxScore, 0), 1);
  const activeClr = colorAt(scorePct);
  const SEGS = 140;
  const cx = 160,
    cy = 158,
    r = 118,
    SW = 15;
  const animAng = ARC_START + animPct * ARC_SWEEP;
  const tip = polar(cx, cy, r, animAng);

  /* segments */
  const filled: React.ReactNode[] = [];
  for (let i = 0; i < SEGS; i++) {
    const p0 = i / SEGS,
      p1 = (i + 1) / SEGS;
    if (p1 > animPct) break;
    const a0 = ARC_START + p0 * ARC_SWEEP,
      a1 = ARC_START + p1 * ARC_SWEEP;
    const s = polar(cx, cy, r, a0),
      e = polar(cx, cy, r, a1);
    filled.push(
      <path
        key={i}
        d={`M ${s.x} ${s.y} A ${r} ${r} 0 0 1 ${e.x} ${e.y}`}
        fill="none"
        stroke={colorAt((p0 + p1) / 2)}
        strokeWidth={SW}
        strokeLinecap="butt"
      />,
    );
  }
  const faded: React.ReactNode[] = [];
  for (let i = 0; i < SEGS; i++) {
    const p0 = i / SEGS,
      p1 = (i + 1) / SEGS;
    if (p0 < animPct) continue;
    const a0 = ARC_START + p0 * ARC_SWEEP,
      a1 = ARC_START + p1 * ARC_SWEEP;
    const s = polar(cx, cy, r, a0),
      e = polar(cx, cy, r, a1);
    faded.push(
      <path
        key={`f${i}`}
        d={`M ${s.x} ${s.y} A ${r} ${r} 0 0 1 ${e.x} ${e.y}`}
        fill="none"
        stroke={colorAt((p0 + p1) / 2)}
        strokeWidth={SW}
        strokeLinecap="butt"
        opacity={isDark ? "0.12" : "0.15"}
      />,
    );
  }

  const subScores = data?.breakdown
    ? [
        {
          label: "Profile",
          score: data.breakdown.completeness.score,
          max: data.breakdown.completeness.max,
          color: "#3b82f6",
        },
        {
          label: "Reputation",
          score: data.breakdown.reputation.score,
          max: data.breakdown.reputation.max,
          color: "#f59e0b",
        },
        {
          label: "Activity",
          score: data.breakdown.activity.score,
          max: data.breakdown.activity.max,
          color: "#22c55e",
        },
      ]
    : [];

  return (
    <div
      style={{
        background: card,
        boxShadow: cardShadow,
        borderRadius: 28,
        width: 340,
        padding: "24px 20px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        transition: "background .3s, box-shadow .3s",
        border: isDark
          ? "1px solid rgba(255,255,255,0.06)"
          : "1px solid rgba(37,99,235,0.07)",
        fontFamily: ff,
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase" as const,
              color: subClr,
            }}
          >
            Profile Score
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: titleClr,
              lineHeight: 1.2,
              maxWidth: 180,
              overflow: "hidden",
              whiteSpace: "nowrap" as const,
              textOverflow: "ellipsis",
            }}
          >
            {data?.meta.locationName ?? "Google Business Profile"}
          </div>
        </div>
        <div
          style={{
            background: meta.bg,
            border: `1.5px solid ${meta.color}40`,
            borderRadius: 12,
            padding: "5px 12px",
            display: "flex",
            alignItems: "center",
            gap: 5,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: meta.color,
            }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: meta.color,
              letterSpacing: "0.02em",
            }}
          >
            {meta.label}
          </span>
        </div>
      </div>

      {/* ── Gauge ── */}
      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <svg width="320" height="200" viewBox="0 0 320 195">
          <path
            d={arcD(cx, cy, r, ARC_START, ARC_START + ARC_SWEEP)}
            fill="none"
            stroke={trackBg}
            strokeWidth={SW}
            strokeLinecap="round"
          />
          {faded}
          {filled}
          <circle
            cx={tip.x}
            cy={tip.y}
            r={SW / 2 + 16}
            fill={activeClr}
            opacity="0.2"
          />
          <circle
            cx={tip.x}
            cy={tip.y}
            r={SW / 2 + 4}
            fill={isDark ? "#0f1624" : "white"}
            stroke={activeClr}
            strokeWidth="2.5"
          />
          <circle cx={tip.x} cy={tip.y} r={4.5} fill={activeClr} />
        </svg>

        {/* center overlay */}
        <div
          style={{
            position: "absolute",
            bottom: 22,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {change !== 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                background:
                  change > 0 ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                border: `1px solid ${change > 0 ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
                borderRadius: 20,
                padding: "2px 8px",
                marginBottom: 4,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                {change > 0 ? (
                  <path
                    d="M12 19V5M5 12l7-7 7 7"
                    stroke="#22c55e"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : (
                  <path
                    d="M12 5v14M5 12l7 7 7-7"
                    stroke="#ef4444"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: change > 0 ? "#22c55e" : "#ef4444",
                }}
              >
                {change > 0 ? "+" : ""}
                {change} pts
              </span>
            </div>
          )}

          <span
            style={{
              fontSize: 52,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: "-0.05em",
              color: titleClr,
              transition: "color .3s",
            }}
          >
            {displayed}
          </span>
          <span
            style={{
              fontSize: 11,
              color: subClr,
              marginTop: 2,
              fontWeight: 500,
              letterSpacing: "0.02em",
            }}
          >
            out of {maxScore}
          </span>
        </div>
      </div>

      {/* ── Band labels ── */}
      <div style={{ display: "flex", gap: 4, marginTop: 10, marginBottom: 16 }}>
        {BANDS.map((b, i) => {
          const active = score >= b.from && score <= b.to;
          const c = STOPS[i].hex;
          return (
            <div
              key={b.label}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "4px 0",
                borderRadius: 8,
                background: active ? `${c}20` : labelBg,
                border: active ? `1px solid ${c}50` : "1px solid transparent",
                transition: "all .3s",
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 3,
                  borderRadius: 2,
                  background: c,
                  opacity: active ? 1 : isDark ? 0.25 : 0.3,
                  margin: "0 auto 3px",
                }}
              />
              <span
                style={{
                  fontSize: 9,
                  fontWeight: active ? 700 : 500,
                  color: active ? c : labelClr,
                  letterSpacing: "0.01em",
                }}
              >
                {b.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: divider, marginBottom: 14 }} />

      {/* ── Sub-score breakdown ── */}
      {subScores.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginBottom: 14,
          }}
        >
          {subScores.map((s) => {
            const pct = Math.round((s.score / s.max) * 100);
            return (
              <div
                key={s.label}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: subClr,
                    width: 68,
                    flexShrink: 0,
                  }}
                >
                  {s.label}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 5,
                    borderRadius: 999,
                    background: isDark ? "rgba(255,255,255,0.07)" : "#e2e8f0",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      borderRadius: 999,
                      background: s.color,
                      width: `${pct}%`,
                      transition: "width 1s ease",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: titleClr,
                    width: 36,
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  {s.score}/{s.max}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Quick meta stats ── */}
      {data?.meta && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[
            {
              label: "Rating",
              value: data.meta.avgRating > 0 ? `${data.meta.avgRating}★` : "—",
            },
            { label: "Reviews", value: String(data.meta.totalReviews) },
            { label: "Posts/mo", value: String(data.meta.postsLast30d) },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                flex: 1,
                textAlign: "center",
                background: labelBg,
                borderRadius: 12,
                padding: "8px 4px",
                border: `1px solid ${divider}`,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: titleClr,
                  letterSpacing: "-0.01em",
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: 9.5,
                  color: subClr,
                  marginTop: 1,
                  fontWeight: 500,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Top missing item hint ── */}
      {data?.missing && data.missing.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            background: isDark
              ? "rgba(251,191,36,0.08)"
              : "rgba(251,191,36,0.1)",
            border: "1px solid rgba(251,191,36,0.25)",
            borderRadius: 12,
            padding: "9px 12px",
            marginBottom: 14,
          }}
        >
          <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>💡</span>
          <span
            style={{
              fontSize: 11,
              color: isDark ? "#fbbf24" : "#92400e",
              lineHeight: 1.45,
              fontWeight: 500,
            }}
          >
            {data.missing[0]}
          </span>
        </div>
      )}

      {/* ── Divider ── */}
      <div style={{ height: 1, background: divider, marginBottom: 14 }} />

      {/* ── Improve button ── */}
      <ImproveScoreButton />
    </div>
  );
}
