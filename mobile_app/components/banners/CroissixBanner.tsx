// mobile_app\components\banners\CroissixBanner.tsx
"use client";

// mobile_app/components/banners/CroissixBanner.tsx
//
// Marketing banner for Croissix — opens WhatsApp on click.
// Drop anywhere in your app: <CroissixBanner />
// Optional props:
//   whatsappNumber  — defaults to your number (edit below)
//   dismissible     — show an × close button (default: true)

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import {
  X,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  Target,
  Zap,
} from "lucide-react";

/* ── CONFIG — edit your WhatsApp number here ── */
const DEFAULT_WA_NUMBER = "919669932121"; // format: countrycode + number, no +
const WA_MESSAGE = encodeURIComponent(
  "Hi Croissix! I'd like to learn more about growing my business with your platform.",
);

/* ══════════════════════════════════════════════════
   WHATSAPP ICON
══════════════════════════════════════════════════ */
function WAIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════
   ANIMATED COUNTER
══════════════════════════════════════════════════ */
function AnimCounter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const dur = 1200;
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / dur, 1);
          const ease = 1 - Math.pow(1 - t, 3);
          setVal(Math.round(ease * to));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [to]);

  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}

/* ══════════════════════════════════════════════════
   MAIN BANNER
══════════════════════════════════════════════════ */
interface CroissixBannerProps {
  whatsappNumber?: string;
  dismissible?: boolean;
  className?: string;
}

export default function CroissixBanner({
  whatsappNumber = DEFAULT_WA_NUMBER,
  dismissible = false,
  className = "",
}: CroissixBannerProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => setMounted(true), []);

  if (dismissed) return null;

  const isDark = mounted && resolvedTheme === "dark";

  const waUrl = `https://wa.me/${whatsappNumber}?text=${WA_MESSAGE}`;

  const handleClick = () => {
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className={`relative w-full rounded-[22px] overflow-hidden select-none ${className}`}
      style={{
        background: isDark
          ? "linear-gradient(135deg, #0c1829 0%, #0f2347 50%, #091220 100%)"
          : "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0c1829 100%)",
        boxShadow: isDark
          ? "0 20px 60px rgba(37,99,235,0.25), 0 0 0 1px rgba(255,255,255,0.06)"
          : "0 20px 60px rgba(15,23,42,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
      }}
    >
      {/* ── Animated grid texture ── */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 32px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 32px)",
        }}
      />

      {/* ── Glow orbs ── */}
      <div
        className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20 pointer-events-none"
        style={{
          background: "radial-gradient(circle,#3b82f6,transparent 70%)",
          animation: "orb1 5s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full opacity-15 pointer-events-none"
        style={{
          background: "radial-gradient(circle,#06b6d4,transparent 70%)",
          animation: "orb2 6s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-[0.06] pointer-events-none"
        style={{
          background: "radial-gradient(circle,#60a5fa,transparent 60%)",
          animation: "orb1 8s ease-in-out infinite reverse",
        }}
      />

      <style>{`
        @keyframes orb1 { 0%,100%{transform:scale(1) translate(0,0)} 50%{transform:scale(1.25) translate(-8px,10px)} }
        @keyframes orb2 { 0%,100%{transform:scale(1) translate(0,0)} 50%{transform:scale(1.2) translate(10px,-8px)} }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.5)} }
        @keyframes slide-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── Dismiss button ── */}
      {dismissible && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDismissed(true);
          }}
          className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{
            background: "rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.6)",
          }}
          aria-label="Dismiss"
        >
          <X size={13} />
        </button>
      )}

      {/* ── Top label strip ── */}
      <div className="relative flex items-center gap-2 px-5 pt-4 pb-1">
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{
            background: "rgba(34,197,94,0.15)",
            border: "1px solid rgba(34,197,94,0.25)",
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full bg-green-400"
            style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
          />
          <span className="text-[9.5px] font-black text-green-400 uppercase tracking-[0.1em]">
            Live · Croissix
          </span>
        </div>
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded-full"
          style={{
            background: "rgba(251,191,36,0.12)",
            border: "1px solid rgba(251,191,36,0.2)",
          }}
        >
          <Sparkles size={9} className="text-yellow-400" />
          <span className="text-[9px] font-bold text-yellow-400 uppercase tracking-wide">
            AI-Powered
          </span>
        </div>
      </div>

      {/* ── Main content ── */}
      <div
        className="relative px-5 pt-3 pb-4"
        style={{ animation: "slide-in 0.5s ease-out" }}
      >
        {/* Headline */}
        <h3
          className="text-white font-black leading-tight mb-1"
          style={{
            fontSize: "clamp(18px, 4vw, 24px)",
            letterSpacing: "-0.04em",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
          }}
        >
          Grow. Scale.{" "}
          <span
            style={{
              background: "linear-gradient(90deg,#60a5fa,#34d399)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Dominate.
          </span>
        </h3>

        {/* Sub copy */}
        <p
          className="text-[13px] leading-relaxed mb-4"
          style={{
            color: "rgba(255,255,255,0.6)",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
          }}
        >
          Improve your business — focus on growth, scale your profile, and
          outrank competitors with AI.
        </p>

        {/* Stats row */}
        <div className="flex gap-3 mb-4">
          {[
            {
              icon: <TrendingUp size={11} />,
              label: "More Reviews",
              value: 3,
              suffix: "×",
              color: "#34d399",
            },
            {
              icon: <Target size={11} />,
              label: "SEO Boost",
              value: 47,
              suffix: "%",
              color: "#60a5fa",
            },
            {
              icon: <Zap size={11} />,
              label: "Avg Time Saved",
              value: 5,
              suffix: "h/wk",
              color: "#fbbf24",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="flex-1 rounded-[12px] px-2.5 py-2 flex flex-col gap-0.5"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                className="flex items-center gap-1"
                style={{ color: stat.color }}
              >
                {stat.icon}
                <span
                  className="text-[18px] font-black leading-none"
                  style={{ letterSpacing: "-0.04em" }}
                >
                  <AnimCounter to={stat.value} suffix={stat.suffix} />
                </span>
              </div>
              <span
                className="text-[9px] font-semibold"
                style={{
                  color: "rgba(255,255,255,0.4)",
                  letterSpacing: "0.03em",
                }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {[
            "Google Reviews",
            "AI Replies",
            "Post Scheduler",
            "Analytics",
            "Profile Score",
          ].map((feat) => (
            <span
              key={feat}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.65)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {feat}
            </span>
          ))}
        </div>

        {/* CTA button */}
        <button
          onClick={handleClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="w-full relative overflow-hidden flex items-center justify-center gap-2.5 rounded-2xl text-white font-black transition-all active:scale-[0.97]"
          style={{
            height: 52,
            fontSize: 14,
            letterSpacing: "-0.01em",
            background: "linear-gradient(135deg,#22c55e 0%,#16a34a 100%)",
            boxShadow: hovered
              ? "0 8px 28px rgba(34,197,94,0.55)"
              : "0 4px 18px rgba(34,197,94,0.38)",
            transform: hovered ? "scale(1.015)" : "scale(1)",
            transition: "all 0.2s cubic-bezier(0.34,1.2,0.64,1)",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
          }}
        >
          {/* shimmer */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.18) 50%,transparent 100%)",
              animation: "shimmer 2.5s linear infinite",
            }}
          />

          <span className="relative flex items-center gap-2.5">
            <span
              className="flex items-center justify-center w-7 h-7 rounded-xl"
              style={{ background: "rgba(255,255,255,0.18)" }}
            >
              <WAIcon size={16} />
            </span>
            Chat with Us on WhatsApp
            <ArrowUpRight size={15} style={{ opacity: 0.85 }} />
          </span>
        </button>

        {/* Trust note */}
        <p
          className="text-center text-[10.5px] mt-2.5"
          style={{
            color: "rgba(255,255,255,0.3)",
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          Free consultation · No commitment · Reply in &lt;5 min
        </p>
      </div>
    </div>
  );
}
