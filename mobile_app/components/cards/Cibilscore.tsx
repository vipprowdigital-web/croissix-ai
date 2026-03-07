"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

interface CibilScoreProps {
  score?: number;
  change?: number;
  min?: number;
  max?: number;
}

/* ── score label / color ──────────────────────────────────── */
function getMeta(score: number) {
  if (score < 580)
    return { label: "Poor", color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
  if (score < 670)
    return { label: "Fair", color: "#f97316", bg: "rgba(249,115,22,0.1)" };
  if (score < 740)
    return { label: "Good", color: "#eab308", bg: "rgba(234,179,8,0.1)" };
  if (score < 800)
    return { label: "Very Good", color: "#84cc16", bg: "rgba(132,204,22,0.1)" };
  return { label: "Excellent", color: "#22c55e", bg: "rgba(34,197,94,0.1)" };
}

/* ── arc geometry ─────────────────────────────────────────── */
const ARC_START = 216;
const ARC_SWEEP = 252;

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

/* ── colour interpolation ─────────────────────────────────── */
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

/* ── range band labels ────────────────────────────────────── */
const BANDS = [
  { label: "Poor", from: 0, to: 400 },
  { label: "Fair", from: 401, to: 700 },
  { label: "Better", from: 701, to: 750 },
  { label: "Excellent", from: 751, to: 890 },
  { label: "Elite", from: 891, to: 950 },
];

/* ═══════════════════════════════════════════════════════════ */
export default function CibilScore({
  score = 620,
  change = 12,
  min = 300,
  max = 900,
}: CibilScoreProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [displayed, setDisplayed] = useState(min);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let raf: number;
    const dur = 1600,
      t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(min + (score - min) * e));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    const id = setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, 350);
    return () => {
      clearTimeout(id);
      cancelAnimationFrame(raf);
    };
  }, [score, min]);

  const isDark = mounted && resolvedTheme === "dark";
  const meta = getMeta(score);

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

  /* ── gauge math ── */
  const cx = 160,
    cy = 158,
    r = 118,
    SW = 15;
  const SEGS = 140;
  const animPct = Math.min(Math.max((displayed - min) / (max - min), 0), 1);
  const scorePct = Math.min(Math.max((score - min) / (max - min), 0), 1);
  const animAng = ARC_START + animPct * ARC_SWEEP;
  const tip = polar(cx, cy, r, animAng);
  const activeClr = colorAt(scorePct);

  /* filled segments */
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

  /* faded segments */
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

  /* tick marks at each band boundary */
  const ticks: React.ReactNode[] = [300, 580, 670, 740, 800, 900].map((v) => {
    const p = (v - min) / (max - min);
    const ang = ARC_START + p * ARC_SWEEP;
    const inner = polar(cx, cy, r - SW / 2 - 2, ang);
    const outer = polar(cx, cy, r + SW / 2 + 2, ang);
    return (
      <line
        key={v}
        x1={inner.x}
        y1={inner.y}
        x2={outer.x}
        y2={outer.y}
        stroke={isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    );
  });

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
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: subClr,
            }}
          >
            Profile Score
          </div>
          <div
            style={{
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: titleClr,
              lineHeight: 1.2,
            }}
          >
            GMB Report
          </div>
        </div>
        {/* Score badge */}
        <div
          style={{
            background: meta.bg,
            border: `1.5px solid ${meta.color}40`,
            borderRadius: 12,
            padding: "5px 12px",
            display: "flex",
            alignItems: "center",
            gap: 5,
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
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
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
          {/* track */}
          <path
            d={arcD(cx, cy, r, ARC_START, ARC_START + ARC_SWEEP)}
            fill="none"
            stroke={trackBg}
            strokeWidth={SW}
            strokeLinecap="round"
          />

          {/* faded color */}
          {faded}

          {/* filled color */}
          {filled}

          {/* tick marks */}
          {ticks}

          {/* glow under tip */}
          <circle
            cx={tip.x}
            cy={tip.y}
            r={SW / 2 + 8}
            fill={activeClr}
            opacity="0.2"
          />

          {/* tip circle outer */}
          <circle
            cx={tip.x}
            cy={tip.y}
            r={SW / 2 + 4}
            fill={isDark ? "#0f1624" : "white"}
            stroke={activeClr}
            strokeWidth="2.5"
          />
          {/* tip circle inner dot */}
          <circle cx={tip.x} cy={tip.y} r={4.5} fill={activeClr} />

          {/* min/max text */}
          {/* {[{ v: min, anchor: "end",   offset: -8 },
            { v: max, anchor: "start", offset:  8 }].map(({ v, anchor, offset }) => {
            const p   = (v - min) / (max - min);
            const ang = ARC_START + p * ARC_SWEEP;
            const pt  = polar(cx, cy, r + SW / 2 + 18, ang);
            return (
              <text key={v} x={pt.x + offset} y={pt.y + 4}
                textAnchor={anchor as any}
                fill={v === min ? "#ef4444" : "#22c55e"}
                fontSize="12" fontWeight="700"
                fontFamily="-apple-system, BlinkMacSystemFont, sans-serif">
                {v}
              </text>
            );
          })} */}
        </svg>

        {/* ── Center overlay ── */}
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
          {/* Change pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              background: "rgba(34,197,94,0.12)",
              border: "1px solid rgba(34,197,94,0.25)",
              borderRadius: 20,
              padding: "2px 8px",
              marginBottom: 4,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 19V5M5 12l7-7 7 7"
                stroke="#22c55e"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#22c55e",
                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              }}
            >
              +{change} pts
            </span>
          </div>

          {/* Big score */}
          <span
            style={{
              fontSize: 52,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: "-0.05em",
              color: titleClr,
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
              transition: "color .3s",
            }}
          >
            {displayed}
          </span>

          {/* out of */}
          <span
            style={{
              fontSize: 11,
              color: subClr,
              marginTop: 2,
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              fontWeight: 500,
              letterSpacing: "0.02em",
            }}
          >
            out of {max}
          </span>
        </div>
      </div>

      {/* ── Band labels row ── */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginTop: 10,
          marginBottom: 16,
        }}
      >
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
                  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
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
      <div style={{ height: 1, background: divider, marginBottom: 16 }} />

      {/* ── Stats row ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Last Updated", value: "Today" },
          { label: "Valid Till", value: "Dec 2025" },
          { label: "Bureau", value: "Report" },
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
                fontSize: 11,
                fontWeight: 700,
                color: titleClr,
                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
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
                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                fontWeight: 500,
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Download button ── */}
      <button
        style={{
          width: "100%",
          height: 50,
          borderRadius: 16,
          background: "linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%)",
          boxShadow: "0 6px 24px rgba(37,99,235,0.38)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          color: "white",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: "-0.015em",
          transition: "transform .15s, box-shadow .15s",
        }}
        onPointerDown={(e) => {
          e.currentTarget.style.transform = "scale(0.97)";
          e.currentTarget.style.boxShadow = "0 2px 12px rgba(37,99,235,0.3)";
        }}
        onPointerUp={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 6px 24px rgba(37,99,235,0.38)";
        }}
        onPointerLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 6px 24px rgba(37,99,235,0.38)";
        }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 4v12M6 12l6 6 6-6"
            stroke="white"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 20h16"
            stroke="white"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
        </svg>
        Download Full Report
      </button>
    </div>
  );
}
