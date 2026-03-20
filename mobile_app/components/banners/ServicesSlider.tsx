// mobile_app\components\banners\ServicesSlider.tsx
"use client";

// mobile_app/components/banners/ServicesSlider.tsx
//
// Auto-playing service card slider with touch/drag support.
// Each card has a rich illustrated background, feature list, and a WhatsApp CTA.
//
// Usage:
//   <ServicesSlider />
//   <ServicesSlider whatsappNumber="919876543210" autoPlayInterval={4000} />

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  TrendingUp,
  Code2,
  Globe,
  Search,
  Megaphone,
  BarChart3,
  Smartphone,
  Palette,
  ShoppingCart,
  Cloud,
} from "lucide-react";

/* ══════════════════════════════════════════════════
   CONFIG
══════════════════════════════════════════════════ */
const DEFAULT_WA = "919669932121";

/* ══════════════════════════════════════════════════
   SERVICE DATA
══════════════════════════════════════════════════ */
interface Service {
  id: string;
  title: string;
  tagline: string;
  description: string;
  icon: React.ReactNode;
  accent: string; // primary color
  accentB: string; // secondary for gradient
  features: string[];
  badge: string;
  waMessage: string;
  pattern: "dots" | "grid" | "circles" | "lines" | "hexagons" | "waves";
}

const SERVICES: Service[] = [
  {
    id: "digital-marketing",
    title: "Digital Marketing",
    tagline: "Reach millions. Convert them.",
    description:
      "Full-funnel campaigns across Google, Meta, and more — built to drive real ROI.",
    icon: <Megaphone size={22} />,
    accent: "#f97316",
    accentB: "#ea580c",
    features: [
      "Google Ads Management",
      "Meta & Instagram Ads",
      "Email Campaigns",
      "Conversion Optimisation",
    ],
    badge: "Most Popular",
    waMessage:
      "Hi! I'm interested in Digital Marketing services from Croissix.",
    pattern: "dots",
  },
  {
    id: "software-dev",
    title: "Software Development",
    tagline: "Built to scale. Built to last.",
    description:
      "Custom web apps, APIs, and platforms engineered for performance and growth.",
    icon: <Code2 size={22} />,
    accent: "#3b82f6",
    accentB: "#1d4ed8",
    features: [
      "Custom Web Applications",
      "REST & GraphQL APIs",
      "Cloud Architecture",
      "DevOps & CI/CD",
    ],
    badge: "Enterprise",
    waMessage:
      "Hi! I'm interested in Software Development services from Croissix.",
    pattern: "grid",
  },
  {
    id: "website-dev",
    title: "Website Development",
    tagline: "Websites that work as hard as you.",
    description:
      "Fast, beautiful, responsive websites that turn visitors into loyal customers.",
    icon: <Globe size={22} />,
    accent: "#8b5cf6",
    accentB: "#6d28d9",
    features: [
      "Landing Pages & Portfolios",
      "E-Commerce Stores",
      "CMS Integration",
      "Performance Optimised",
    ],
    badge: "Most Requested",
    waMessage:
      "Hi! I'm interested in Website Development services from Croissix.",
    pattern: "circles",
  },
  {
    id: "seo",
    title: "SEO & Local SEO",
    tagline: "Rank #1. Stay there.",
    description:
      "Technical SEO, content strategy, and Google Business optimisation to dominate search.",
    icon: <Search size={22} />,
    accent: "#22c55e",
    accentB: "#15803d",
    features: [
      "Google Business Profile",
      "On-Page & Technical SEO",
      "Link Building",
      "Local Search Ranking",
    ],
    badge: "High ROI",
    waMessage: "Hi! I'm interested in SEO services from Croissix.",
    pattern: "lines",
  },
  {
    id: "branding",
    title: "Branding & Design",
    tagline: "Identity that commands attention.",
    description:
      "Logo, brand guidelines, social kits, and visuals that make your brand unforgettable.",
    icon: <Palette size={22} />,
    accent: "#ec4899",
    accentB: "#be185d",
    features: [
      "Logo & Identity Design",
      "Brand Guidelines",
      "Social Media Creatives",
      "Print & Packaging",
    ],
    badge: "Creative",
    waMessage:
      "Hi! I'm interested in Branding & Design services from Croissix.",
    pattern: "hexagons",
  },
  {
    id: "ecommerce",
    title: "E-Commerce Solutions",
    tagline: "Sell more. Sell smarter.",
    description:
      "End-to-end e-commerce platforms with payment gateways, inventory, and automation.",
    icon: <ShoppingCart size={22} />,
    accent: "#f59e0b",
    accentB: "#d97706",
    features: [
      "Shopify & WooCommerce",
      "Payment Integration",
      "Inventory Management",
      "Abandoned Cart Recovery",
    ],
    badge: "Revenue Driver",
    waMessage: "Hi! I'm interested in E-Commerce solutions from Croissix.",
    pattern: "waves",
  },
  {
    id: "analytics",
    title: "Analytics & Insights",
    tagline: "Data that tells the whole story.",
    description:
      "Custom dashboards, Google Analytics setup, and actionable reporting that drives decisions.",
    icon: <BarChart3 size={22} />,
    accent: "#06b6d4",
    accentB: "#0891b2",
    features: [
      "Google Analytics 4",
      "Custom Dashboards",
      "Competitor Analysis",
      "Monthly Reports",
    ],
    badge: "Data-Driven",
    waMessage: "Hi! I'm interested in Analytics services from Croissix.",
    pattern: "dots",
  },
  {
    id: "app-dev",
    title: "Mobile App Development",
    tagline: "Apps your users will love.",
    description:
      "Cross-platform iOS & Android apps with polished UX and robust backends.",
    icon: <Smartphone size={22} />,
    accent: "#6366f1",
    accentB: "#4338ca",
    features: [
      "React Native & Flutter",
      "iOS & Android",
      "Push Notifications",
      "App Store Optimisation",
    ],
    badge: "Cross-Platform",
    waMessage: "Hi! I'm interested in Mobile App Development from Croissix.",
    pattern: "circles",
  },
];

/* ══════════════════════════════════════════════════
   PATTERN SVG BACKGROUNDS
══════════════════════════════════════════════════ */
function PatternBg({
  pattern,
  color,
}: {
  pattern: Service["pattern"];
  color: string;
}) {
  const op = 0.12;
  switch (pattern) {
    case "dots":
      return (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: op }}
        >
          <svg width="100%" height="100%">
            <defs>
              <pattern
                id="pd"
                x="0"
                y="0"
                width="24"
                height="24"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="3" cy="3" r="1.5" fill={color} />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pd)" />
          </svg>
        </div>
      );
    case "grid":
      return (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: op }}
        >
          <svg width="100%" height="100%">
            <defs>
              <pattern
                id="pg"
                x="0"
                y="0"
                width="28"
                height="28"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 28 0 L 0 0 0 28"
                  fill="none"
                  stroke={color}
                  strokeWidth="0.8"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pg)" />
          </svg>
        </div>
      );
    case "circles":
      return (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: op * 0.8 }}
        >
          <svg width="100%" height="100%">
            <defs>
              <pattern
                id="pc"
                x="0"
                y="0"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <circle
                  cx="20"
                  cy="20"
                  r="14"
                  fill="none"
                  stroke={color}
                  strokeWidth="1"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="6"
                  fill="none"
                  stroke={color}
                  strokeWidth="0.8"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pc)" />
          </svg>
        </div>
      );
    case "lines":
      return (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: op }}
        >
          <svg width="100%" height="100%">
            <defs>
              <pattern
                id="pl"
                x="0"
                y="0"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <path d="M 0 10 L 20 10" stroke={color} strokeWidth="0.8" />
                <path d="M 10 0 L 10 20" stroke={color} strokeWidth="0.4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pl)" />
          </svg>
        </div>
      );
    case "hexagons":
      return (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: op * 0.7 }}
        >
          <svg width="100%" height="100%">
            <defs>
              <pattern
                id="ph"
                x="0"
                y="0"
                width="30"
                height="34.64"
                patternUnits="userSpaceOnUse"
              >
                <polygon
                  points="15,2 27,9 27,23 15,30 3,23 3,9"
                  fill="none"
                  stroke={color}
                  strokeWidth="0.8"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#ph)" />
          </svg>
        </div>
      );
    case "waves":
      return (
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ opacity: op }}
        >
          <svg width="100%" height="100%" preserveAspectRatio="none">
            {Array.from({ length: 8 }, (_, i) => (
              <path
                key={i}
                d={`M 0 ${i * 30 + 10} Q 80 ${i * 30} 160 ${i * 30 + 10} T 320 ${i * 30 + 10} T 480 ${i * 30 + 10} T 640 ${i * 30 + 10}`}
                fill="none"
                stroke={color}
                strokeWidth="1"
              />
            ))}
          </svg>
        </div>
      );
    default:
      return null;
  }
}

/* ══════════════════════════════════════════════════
   WHATSAPP ICON
══════════════════════════════════════════════════ */
function WAIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════
   SERVICE CARD
══════════════════════════════════════════════════ */
function ServiceCard({
  service,
  isDark,
  waNumber,
  isActive,
}: {
  service: Service;
  isDark: boolean;
  waNumber: string;
  isActive: boolean;
}) {
  const [btnHovered, setBtnHovered] = useState(false);
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(service.waMessage)}`;

  return (
    <div
      className="relative w-full rounded-[20px] overflow-hidden flex flex-col"
      style={{
        background: isDark
          ? `linear-gradient(145deg, #0d1421 0%, ${service.accent}18 60%, #0d1421 100%)`
          : `linear-gradient(145deg, #ffffff 0%, ${service.accent}0d 60%, #f8fafc 100%)`,
        border: `1px solid ${service.accent}${isDark ? "28" : "20"}`,
        boxShadow: isActive
          ? `0 20px 60px ${service.accent}30, 0 0 0 1px ${service.accent}20`
          : isDark
            ? "0 4px 20px rgba(0,0,0,0.4)"
            : "0 4px 20px rgba(0,0,0,0.08)",
        transition: "box-shadow 0.4s ease",
        minHeight: 340,
      }}
    >
      {/* Pattern background */}
      <PatternBg pattern={service.pattern} color={service.accent} />

      {/* Top glow orb */}
      <div
        className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${service.accent}30, transparent 70%)`,
          animation: isActive ? "cardOrb 4s ease-in-out infinite" : "none",
        }}
      />
      <div
        className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${service.accentB}20, transparent 70%)`,
        }}
      />

      <div className="relative flex flex-col flex-1 p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: `linear-gradient(135deg, ${service.accent}, ${service.accentB})`,
                boxShadow: `0 4px 16px ${service.accent}50`,
                color: "white",
              }}
            >
              {service.icon}
            </div>
            <div>
              <h3
                className="font-black leading-tight"
                style={{
                  fontSize: "clamp(14px, 3.5vw, 17px)",
                  letterSpacing: "-0.03em",
                  color: isDark ? "#f0f4ff" : "#0f172a",
                  fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
                }}
              >
                {service.title}
              </h3>
              <p
                className="text-[11px] font-semibold mt-0.5"
                style={{ color: service.accent }}
              >
                {service.tagline}
              </p>
            </div>
          </div>
          {/* Badge */}
          <span
            className="text-[9px] font-black px-2 py-1 rounded-full shrink-0 ml-2"
            style={{
              background: `${service.accent}20`,
              color: service.accent,
              border: `1px solid ${service.accent}35`,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            {service.badge}
          </span>
        </div>

        {/* Description */}
        <p
          className="text-[12.5px] leading-relaxed mb-4"
          style={{
            color: isDark ? "rgba(255,255,255,0.55)" : "rgba(15,23,42,0.6)",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
          }}
        >
          {service.description}
        </p>

        {/* Feature list */}
        <div className="grid grid-cols-2 gap-1.5 mb-5 flex-1">
          {service.features.map((feat) => (
            <div key={feat} className="flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: service.accent }}
              />
              <span
                className="text-[11px] font-medium truncate"
                style={{
                  color: isDark
                    ? "rgba(255,255,255,0.65)"
                    : "rgba(15,23,42,0.7)",
                }}
              >
                {feat}
              </span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div
          className="h-px mb-4"
          style={{
            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
          }}
        />

        {/* CTA */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setBtnHovered(true)}
          onMouseLeave={() => setBtnHovered(false)}
          className="flex items-center justify-center gap-2 rounded-2xl text-white font-bold no-underline transition-all active:scale-[0.97] overflow-hidden relative"
          style={{
            height: 46,
            fontSize: 13,
            letterSpacing: "-0.01em",
            background: `linear-gradient(135deg, ${service.accent}, ${service.accentB})`,
            boxShadow: btnHovered
              ? `0 8px 24px ${service.accent}55`
              : `0 3px 14px ${service.accent}38`,
            transform: btnHovered ? "scale(1.015)" : "scale(1)",
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
                "linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.15) 50%,transparent 100%)",
              animation: "shimmer 2.5s linear infinite",
            }}
          />
          <span className="relative flex items-center gap-2">
            <span
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              <WAIcon size={13} />
            </span>
            Get a Free Quote
            <ArrowUpRight size={13} style={{ opacity: 0.85 }} />
          </span>
        </a>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PROGRESS DOTS
══════════════════════════════════════════════════ */
function ProgressDots({
  total,
  active,
  onSelect,
  accent,
}: {
  total: number;
  active: number;
  onSelect: (i: number) => void;
  accent: string;
}) {
  return (
    <div className="flex items-center justify-center gap-1.5 mt-4">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className="rounded-full transition-all duration-300 active:scale-90"
          style={{
            width: i === active ? 22 : 6,
            height: 6,
            background: i === active ? accent : "rgba(255,255,255,0.2)",
            boxShadow: i === active ? `0 0 8px ${accent}80` : "none",
          }}
          aria-label={`Go to slide ${i + 1}`}
        />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════ */
interface ServicesSliderProps {
  whatsappNumber?: string;
  autoPlayInterval?: number;
  className?: string;
}

export default function ServicesSlider({
  whatsappNumber = DEFAULT_WA,
  autoPlayInterval = 4500,
  className = "",
}: ServicesSliderProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [paused, setPaused] = useState(false);

  /* touch/drag */
  const dragStart = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => setMounted(true), []);

  const total = SERVICES.length;
  const isDark = mounted && resolvedTheme === "dark";

  const goTo = useCallback(
    (idx: number, dir: "left" | "right" = "right") => {
      if (animating) return;
      setDirection(dir);
      setAnimating(true);
      setTimeout(() => {
        setCurrent(idx);
        setAnimating(false);
      }, 280);
    },
    [animating],
  );

  const next = useCallback(() => {
    goTo((current + 1) % total, "right");
  }, [current, total, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + total) % total, "left");
  }, [current, total, goTo]);

  /* Auto-play */
  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(next, autoPlayInterval);
    return () => clearTimeout(timerRef.current);
  }, [current, paused, autoPlayInterval, next]);

  /* Touch */
  const onTouchStart = (e: React.TouchEvent) => {
    dragStart.current = e.touches[0].clientX;
    setPaused(true);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (dragStart.current === null) return;
    const dx = e.changedTouches[0].clientX - dragStart.current;
    if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
    dragStart.current = null;
    setTimeout(() => setPaused(false), 2000);
  };

  /* Mouse drag */
  const onMouseDown = (e: React.MouseEvent) => {
    dragStart.current = e.clientX;
    setPaused(true);
  };
  const onMouseUp = (e: React.MouseEvent) => {
    if (dragStart.current === null) return;
    const dx = e.clientX - dragStart.current;
    if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
    dragStart.current = null;
    setTimeout(() => setPaused(false), 2000);
  };

  const activeService = SERVICES[current];

  return (
    <div className={`w-full ${className}`}>
      <style>{`
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
        @keyframes cardOrb { 0%,100%{transform:scale(1) translate(0,0)} 50%{transform:scale(1.3) translate(-6px,8px)} }
        @keyframes slideRight { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideLeft  { from{opacity:0;transform:translateX(-40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeOut    { from{opacity:1} to{opacity:0} }
        .slide-enter-right { animation: slideRight 0.28s cubic-bezier(0.34,1.1,0.64,1) forwards; }
        .slide-enter-left  { animation: slideLeft  0.28s cubic-bezier(0.34,1.1,0.64,1) forwards; }
        .slide-exit        { animation: fadeOut 0.18s ease forwards; }
      `}</style>

      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2
            className="font-black"
            style={{
              fontSize: "clamp(16px, 4vw, 20px)",
              letterSpacing: "-0.04em",
              color: isDark ? "#f0f4ff" : "#0f172a",
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
            }}
          >
            Our Services
          </h2>
          <p
            className="text-[12px] mt-0.5"
            style={{ color: isDark ? "#64748b" : "#94a3b8" }}
          >
            {total} services · Swipe to explore
          </p>
        </div>

        {/* Nav arrows */}
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
            style={{
              background: isDark
                ? "rgba(255,255,255,0.07)"
                : "rgba(0,0,0,0.05)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
              color: isDark ? "#94a3b8" : "#64748b",
            }}
            aria-label="Previous"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={next}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
            style={{
              background: `${activeService.accent}18`,
              border: `1px solid ${activeService.accent}30`,
              color: activeService.accent,
              transition: "all 0.3s ease",
            }}
            aria-label="Next"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Auto-play progress bar */}
      {!paused && (
        <div
          className="w-full h-0.5 rounded-full mb-3 overflow-hidden"
          style={{
            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
          }}
        >
          <div
            key={`${current}-bar`}
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${activeService.accent}, ${activeService.accentB})`,
              animation: `progress ${autoPlayInterval}ms linear forwards`,
            }}
          />
          <style>{`@keyframes progress { from{width:0%} to{width:100%} }`}</style>
        </div>
      )}

      {/* Card slider */}
      <div
        className="relative overflow-hidden rounded-[22px] cursor-grab active:cursor-grabbing"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => {
          dragStart.current = null;
          setPaused(false);
        }}
      >
        <div
          key={current}
          className={
            animating
              ? "slide-exit"
              : direction === "right"
                ? "slide-enter-right"
                : "slide-enter-left"
          }
        >
          <ServiceCard
            service={SERVICES[current]}
            isDark={isDark}
            waNumber={whatsappNumber}
            isActive={!animating}
          />
        </div>
      </div>

      {/* Dots */}
      <ProgressDots
        total={total}
        active={current}
        onSelect={(i) => goTo(i, i > current ? "right" : "left")}
        accent={activeService.accent}
      />

      {/* Service name pills — quick jump */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar mt-4 pb-0.5">
        {SERVICES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => {
              setPaused(true);
              goTo(i, i > current ? "right" : "left");
              setTimeout(() => setPaused(false), 2000);
            }}
            className="flex items-center gap-1.5 h-7 px-3 rounded-xl text-[11px] font-semibold whitespace-nowrap shrink-0 transition-all active:scale-95"
            style={{
              background:
                i === current
                  ? `${s.accent}20`
                  : isDark
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.04)",
              border: `1px solid ${i === current ? s.accent + "40" : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
              color: i === current ? s.accent : isDark ? "#64748b" : "#94a3b8",
              boxShadow: i === current ? `0 0 10px ${s.accent}25` : "none",
            }}
          >
            {s.title.split(" ")[0]}
          </button>
        ))}
      </div>
    </div>
  );
}
