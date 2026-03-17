// mobile_app\app\(main)\page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/features/user/hook/useUser";
import {
  motion,
  AnimatePresence,
  useInView,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  Eye,
  Phone,
  Navigation,
  Globe,
  Star,
  MessageSquare,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Settings,
  BarChart2,
  RefreshCw,
  ArrowUpRight,
  Building2,
  AlertCircle,
  Users,
  Target,
  Award,
  Plus,
  WifiOff,
  Lock,
  Bell,
  Zap,
  Heart,
  ThumbsUp,
  Video,
  Bookmark,
  PlayCircle,
  Hash,
  ImageIcon,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import CibilScore from "@/components/cards/Cibilscore";

/* ═══════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════ */
interface AnalysisSummary {
  totalImpressions: number;
  totalCalls: number;
  totalWebsite: number;
  totalDirections: number;
  totalConversations: number;
  totalReviews: number;
  avgRating: number;
  replyRate: number;
  totalPosts: number;
}
interface AnalysisData {
  success: boolean;
  summary: AnalysisSummary;
  charts: {
    impressionsByDay: { date: string; desktop: number; mobile: number }[];
  };
  recentReviews: {
    author: string;
    rating: number;
    comment: string;
    date: string;
    replied: boolean;
  }[];
}
interface MetricCardData {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
  sparkData?: number[];
}
interface Competitor {
  name: string;
  rating: number;
  reviews: number;
  position: number;
}
/* ═══════════════════════════════════════════════════════════════
   FRAMER MOTION VARIANTS
═══════════════════════════════════════════════════════════════ */
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.45, ease: [0.34, 1.3, 0.64, 1] },
  },
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 16, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.34, 1.26, 0.64, 1] },
  },
};

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */
const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

async function fetchHomeAnalysis(locationId: string): Promise<AnalysisData> {
  const res = await fetch(
    `/api/google/analysis?locationId=${locationId}&range=30d`,
    {
      headers: { Authorization: `Bearer ${getToken()}` },
    },
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Failed");
  return json;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n ?? 0);
}

function greet() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

const getInitials = (n: string) =>
  n
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function generateCompetitors(r: number): Competitor[] {
  return [
    {
      name: "DigiEdge Pro",
      rating: Math.min(5, +(r + 0.3).toFixed(1)),
      reviews: 312,
      position: 1,
    },
    {
      name: "LocalBoost Co",
      rating: Math.min(5, +(r + 0.1).toFixed(1)),
      reviews: 198,
      position: 2,
    },
    { name: "Your Business", rating: r, reviews: 0, position: 3 },
    {
      name: "CityMarket",
      rating: Math.max(1, +(r - 0.2).toFixed(1)),
      reviews: 145,
      position: 4,
    },
    {
      name: "NearShop Plus",
      rating: Math.max(1, +(r - 0.5).toFixed(1)),
      reviews: 89,
      position: 5,
    },
  ];
}

/* ═══════════════════════════════════════════════════════════════
   ANIMATED NUMBER (spring counter)
═══════════════════════════════════════════════════════════════ */
function AnimatedNumber({
  value,
  className,
  style,
}: {
  value: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const suffix = value.endsWith("M")
    ? "M"
    : value.endsWith("K")
      ? "K"
      : value.endsWith("%")
        ? "%"
        : "";
  const raw = parseFloat(value.replace(/[KM%]/g, ""));
  const isNum = !isNaN(raw);

  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10px" });
  const spring = useSpring(0, { stiffness: 55, damping: 20 });
  const display = useTransform(spring, (v) => {
    if (suffix === "M") return (v / 1_000_000).toFixed(1) + "M";
    if (suffix === "K") return (v / 1_000).toFixed(1) + "K";
    if (suffix === "%") return Math.round(v) + "%";
    return String(Math.round(v));
  });

  useEffect(() => {
    if (!inView || !isNum) return;
    const target =
      suffix === "M" ? raw * 1_000_000 : suffix === "K" ? raw * 1_000 : raw;
    spring.set(target);
  }, [inView]);

  if (!isNum)
    return (
      <span ref={ref} className={className} style={style}>
        {value}
      </span>
    );

  return (
    <span ref={ref} className={className} style={style}>
      {inView ? <motion.span>{display}</motion.span> : value}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SPARKLINE (with draw-on animation)
═══════════════════════════════════════════════════════════════ */
function Sparkline({
  data,
  color,
  height = 32,
}: {
  data: number[];
  color: string;
  height?: number;
}) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1),
    min = Math.min(...data, 0);
  const W = 64,
    H = height;
  const pts = data.map(
    (v, i) =>
      `${(i / (data.length - 1)) * W},${H - ((v - min) / (max - min + 0.001)) * H}`,
  );
  const id = color.replace(/[^a-z0-9]/gi, "x");
  const polyRef = useRef<SVGPolylineElement>(null);

  useEffect(() => {
    const el = polyRef.current;
    if (!el) return;
    const len = el.getTotalLength?.() ?? 200;
    el.style.strokeDasharray = String(len);
    el.style.strokeDashoffset = String(len);
    requestAnimationFrame(() => {
      el.style.transition =
        "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1) 0.4s";
      el.style.strokeDashoffset = "0";
    });
  }, [data]);

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`M0,${H} L${pts[0]} L${pts.join(" L")} L${W},${H} Z`}
        fill={`url(#g${id})`}
      />
      <polyline
        ref={polyRef}
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SKELETON
═══════════════════════════════════════════════════════════════ */
function Sk({
  isDark,
  className = "",
}: {
  isDark: boolean;
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-xl ${isDark ? "bg-white/[0.07]" : "bg-slate-200/80"} ${className}`}
    />
  );
}
function HomeSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <motion.div
      className="flex flex-col gap-5 pb-32"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div key={i} variants={fadeUp}>
          <Sk
            isDark={isDark}
            className={`${i === 1 ? "h-44" : i === 0 ? "h-12" : "h-28"} w-full rounded-3xl`}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BRAND LOGOS
═══════════════════════════════════════════════════════════════ */
function GoogleLogo({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M21.805 10.023H12v3.977h5.617c-.245 1.36-1.017 2.514-2.164 3.29v2.73h3.503C20.938 18.202 22 15.298 22 12c0-.66-.069-1.305-.195-1.977z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.97 0 5.46-.984 7.28-2.668l-3.503-2.73c-.984.66-2.245 1.05-3.777 1.05-2.9 0-5.36-1.958-6.24-4.59H2.15v2.817C3.96 19.983 7.7 22 12 22z"
        fill="#34A853"
      />
      <path
        d="M5.76 13.062A6.05 6.05 0 0 1 5.44 12c0-.37.063-.73.163-1.062V8.121H2.15A9.987 9.987 0 0 0 2 12c0 1.61.387 3.13 1.07 4.477l3.69-2.817z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.958c1.637 0 3.105.563 4.26 1.667l3.195-3.195C17.455 2.693 14.965 1.6 12 1.6 7.7 1.6 3.96 3.617 2.15 7.12l3.61 2.817C6.64 7.305 9.1 5.958 12 5.958z"
        fill="#EA4335"
      />
    </svg>
  );
}
function FacebookLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#1877F2" />
      <path
        d="M16.5 3H14c-2.761 0-5 2.239-5 5v2H7v3.5h2V21h3.5v-7.5H15l.5-3.5h-3V8c0-.828.672-1.5 1.5-1.5h2V3z"
        fill="white"
      />
    </svg>
  );
}
function InstagramLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <radialGradient id="igg" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#igg)" />
      <rect
        x="7"
        y="7"
        width="10"
        height="10"
        rx="3"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="12" cy="12" r="2.5" stroke="white" strokeWidth="1.5" />
      <circle cx="17" cy="7.5" r="1" fill="white" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION HEADER
═══════════════════════════════════════════════════════════════ */
function SectionHeader({
  title,
  subtitle,
  action,
  isDark,
}: {
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
  isDark: boolean;
}) {
  return (
    <motion.div
      className="flex items-center justify-between mb-3"
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-20px" }}
    >
      <div>
        <h2
          className={`text-[14px] font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
          style={{ letterSpacing: "-0.03em" }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className={`text-[11px] mt-0.5 ${isDark ? "text-slate-500" : "text-slate-500"}`}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <motion.button
          onClick={action.onClick}
          whileTap={{ scale: 0.9 }}
          whileHover={{ x: 2 }}
          className={`flex items-center gap-1 text-[12px] font-semibold ${isDark ? "text-blue-400" : "text-blue-600"}`}
        >
          {action.label} <ChevronRight size={13} />
        </motion.button>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PLATFORMS STRIP
═══════════════════════════════════════════════════════════════ */
function PlatformsStrip({
  isDark,
  onScrollTo,
}: {
  isDark: boolean;
  onScrollTo: (id: string) => void;
}) {
  const platforms = [
    {
      id: "google",
      name: "Google",
      logo: <GoogleLogo size={18} />,
      bg: isDark ? "rgba(66,133,244,0.18)" : "rgba(66,133,244,0.1)",
      live: true,
    },
    {
      id: "facebook",
      name: "Facebook",
      logo: <FacebookLogo size={18} />,
      bg: isDark ? "rgba(24,119,242,0.18)" : "rgba(24,119,242,0.1)",
      live: false,
    },
    {
      id: "instagram",
      name: "Instagram",
      logo: <InstagramLogo size={18} />,
      bg: isDark ? "rgba(225,48,108,0.18)" : "rgba(225,48,108,0.1)",
      live: false,
    },
  ];
  return (
    <motion.div
      className="flex gap-2.5"
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-20px" }}
    >
      {platforms.map((p) => (
        <motion.button
          key={p.id}
          variants={staggerItem}
          onClick={() => onScrollTo(p.id)}
          whileTap={{ scale: 0.92 }}
          whileHover={{ y: -2, transition: { duration: 0.18 } }}
          className={`flex-1 rounded-2xl border p-3 flex flex-col items-center gap-1.5
            ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-slate-100 shadow-sm"}`}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: p.bg }}
          >
            {p.logo}
          </div>
          <p
            className={`text-[10.5px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}
          >
            {p.name}
          </p>
          <div className="flex items-center gap-1">
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: p.live ? "#22c55e" : "#f59e0b",
                boxShadow: p.live ? "0 0 5px #22c55e" : "none",
              }}
              animate={
                p.live ? { scale: [1, 1.7, 1], opacity: [1, 0.4, 1] } : {}
              }
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span
              className="text-[9px] font-bold"
              style={{ color: p.live ? "#22c55e" : "#f59e0b" }}
            >
              {p.live ? "Live" : "Soon"}
            </span>
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GOOGLE HERO CARD
═══════════════════════════════════════════════════════════════ */
function HeroCard({
  summary,
  sparkData,
  isDark,
  onTap,
}: {
  summary: AnalysisSummary;
  sparkData: number[];
  isDark: boolean;
  onTap: () => void;
}) {
  const leads =
    summary.totalCalls + summary.totalDirections + summary.totalConversations;
  return (
    <motion.div
      onClick={onTap}
      variants={scaleIn}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-20px" }}
      whileTap={{ scale: 0.97 }}
      className="relative rounded-3xl overflow-hidden cursor-pointer"
      style={{
        background: isDark
          ? "linear-gradient(135deg,#0f1f3d,#1a2d4a,#0d1421)"
          : "linear-gradient(135deg,#1d4ed8,#2563eb,#1e40af)",
        boxShadow: isDark
          ? "0 20px 60px rgba(37,99,235,0.2),0 0 0 1px rgba(255,255,255,0.06)"
          : "0 20px 60px rgba(37,99,235,0.3)",
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 28px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 28px)",
        }}
      />
      <motion.div
        className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle,#60a5fa,transparent 70%)",
        }}
        animate={{ scale: [1, 1.18, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
              <GoogleLogo size={26} />
            </div>
            <div>
              <p className="text-white text-[12px] font-semibold uppercase tracking-widest">
                Google Business
              </p>
              <p className="text-white text-[12px]">Last 30 days</p>
            </div>
          </div>
          <motion.div
            className="flex items-center gap-1 bg-green-400/20 px-2 py-1 rounded-full"
            animate={{ opacity: [1, 0.65, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-green-200 text-[10px] font-bold">Live</span>
          </motion.div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-2 mb-0.5">
              <AnimatedNumber
                value={fmt(summary.totalImpressions)}
                className="text-[38px] font-black text-white leading-none"
                style={{ letterSpacing: "-0.05em" }}
              />
              <span className="text-white text-[13px] font-medium mb-1">
                views
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-white">
                <span className="text-green-300 font-bold">{fmt(leads)}</span>{" "}
                leads
              </span>
              <span className="text-[12px] text-white">
                <span className="text-yellow-300 font-bold">
                  {summary.avgRating}★
                </span>
              </span>
              <span className="text-[12px] text-white">
                <span className="text-blue-300 font-bold">
                  {summary.totalReviews}
                </span>{" "}
                reviews
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Sparkline data={sparkData} color="#93c5fd" height={36} />
            <motion.div
              className="flex items-center gap-1 text-[10px] text-green-400 font-semibold"
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowUpRight size={10} /> View details
            </motion.div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 border-t border-white/[0.08]">
        {[
          {
            label: "Calls",
            value: fmt(summary.totalCalls),
            icon: <Phone size={11} />,
          },
          {
            label: "Website",
            value: fmt(summary.totalWebsite),
            icon: <Globe size={11} />,
          },
          {
            label: "Directions",
            value: fmt(summary.totalDirections),
            icon: <Navigation size={11} />,
          },
          {
            label: "Posts",
            value: String(summary.totalPosts),
            icon: <FileText size={11} />,
          },
        ].map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 + i * 0.07, duration: 0.3 }}
            viewport={{ once: true }}
            className={`flex flex-col items-center py-3 gap-0.5 ${i < 3 ? "border-r border-white/[0.08]" : ""}`}
          >
            <span className="text-white">{m.icon}</span>
            <AnimatedNumber
              value={m.value}
              className="text-white text-[14px] font-black leading-none py-1"
            />
            <span className="text-white text-[9px] font-semibold uppercase tracking-wide">
              {m.label}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   METRICS SCROLL STRIP
═══════════════════════════════════════════════════════════════ */
function MetricScrollStrip({
  metrics,
  isDark,
}: {
  metrics: MetricCardData[];
  isDark: boolean;
}) {
  return (
    <motion.div
      className="flex gap-3 overflow-x-auto no-scrollbar pb-1"
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-20px" }}
    >
      {metrics.map((m, i) => (
        <motion.div
          key={i}
          variants={staggerItem}
          whileHover={{ y: -3, transition: { duration: 0.18 } }}
          whileTap={{ scale: 0.95 }}
          className={`shrink-0 rounded-2xl border p-3.5 flex flex-col gap-2 min-w-[130px]
            ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-slate-100"}`}
          style={{ boxShadow: isDark ? "none" : "0 2px 12px rgba(0,0,0,0.05)" }}
        >
          <div className="flex items-center justify-between">
            <motion.span
              className="p-1.5 rounded-xl"
              style={{ background: `${m.color}18` }}
              whileHover={{ rotate: 12, scale: 1.1 }}
            >
              <span style={{ color: m.color }}>{m.icon}</span>
            </motion.span>
            {m.sparkData && m.sparkData.length > 1 && (
              <Sparkline data={m.sparkData} color={m.color} height={22} />
            )}
          </div>
          <div>
            <AnimatedNumber
              value={m.value}
              className={`text-[22px] font-black leading-none mb-0.5 block ${isDark ? "text-white" : "text-slate-900"}`}
              style={{ letterSpacing: "-0.04em" }}
            />
            <p
              className={`text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-slate-500" : "text-slate-500"}`}
            >
              {m.label}
            </p>
            <p
              className={`text-[10px] mt-0.5 ${isDark ? "text-slate-600" : "text-slate-500"}`}
            >
              {m.sub}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   QUICK ACTIONS GRID
═══════════════════════════════════════════════════════════════ */
function QuickActionsGrid({
  isDark,
  onNavigate,
}: {
  isDark: boolean;
  onNavigate: (r: string) => void;
}) {
  const actions = [
    {
      label: "New Post",
      icon: <Plus size={18} />,
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.12)",
      route: "/post/create",
    },
    {
      label: "Reviews",
      icon: <MessageSquare size={18} />,
      color: "#22c55e",
      bg: "rgba(34,197,94,0.12)",
      route: "/reviews/google",
    },
    {
      label: "Photos",
      icon: <ImageIcon size={18} />,
      color: "#06b6d4",
      bg: "rgba(6,182,212,0.12)",
      route: "/photos",
    },
    {
      label: "Analytics",
      icon: <BarChart2 size={18} />,
      color: "#8b5cf6",
      bg: "rgba(139,92,246,0.12)",
      route: "/analysis/google",
    },
    {
      label: "My Posts",
      icon: <FileText size={18} />,
      color: "#f97316",
      bg: "rgba(249,115,22,0.12)",
      route: "/post",
    },
  ];
  return (
    <motion.div
      className="grid grid-cols-5 gap-2"
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-20px" }}
    >
      {actions.map((a, i) => (
        <motion.button
          key={i}
          variants={staggerItem}
          onClick={() => onNavigate(a.route)}
          whileTap={{ scale: 0.86 }}
          whileHover={{ y: -2 }}
          className={`flex flex-col items-center gap-2 py-3 rounded-2xl border
            ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-slate-100 shadow-sm"}`}
        >
          <motion.span
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: a.bg }}
            whileTap={{
              rotate: [0, -12, 12, 0],
              transition: { duration: 0.3 },
            }}
          >
            <span style={{ color: a.color }}>{a.icon}</span>
          </motion.span>
          <span
            className={`text-[9.5px] font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}
          >
            {a.label}
          </span>
        </motion.button>
      ))}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   REVIEW HEALTH CARD
═══════════════════════════════════════════════════════════════ */
function ReviewHealthCard({
  summary,
  isDark,
  onNavigate,
}: {
  summary: AnalysisSummary;
  isDark: boolean;
  onNavigate: () => void;
}) {
  const score = Math.round(
    (summary.avgRating / 5) * 40 +
      (summary.replyRate / 100) * 30 +
      Math.min(summary.totalReviews / 100, 1) * 30,
  );
  const sc = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const circRef = useRef<HTMLDivElement>(null);
  const inView = useInView(circRef, { once: true, margin: "-20px" });
  const circumference = 163;

  return (
    <motion.div
      ref={circRef}
      onClick={onNavigate}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-20px" }}
      whileTap={{ scale: 0.98 }}
      className={`rounded-2xl border p-4 cursor-pointer ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-slate-100 shadow-sm"}`}
    >
      <div className="flex items-center justify-between mb-3">
        <p
          className={`text-[13px] font-black ${isDark ? "text-white" : "text-slate-900"}`}
          style={{ letterSpacing: "-0.02em" }}
        >
          Review Health
        </p>
        <motion.div whileHover={{ x: 3 }}>
          <ChevronRight
            size={14}
            className={isDark ? "text-slate-500" : "text-slate-500"}
          />
        </motion.div>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
              strokeWidth="6"
            />
            <motion.circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke={sc}
              strokeWidth="6"
              strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={
                inView
                  ? {
                      strokeDasharray: `${(score / 100) * circumference} ${circumference}`,
                    }
                  : {}
              }
              transition={{ duration: 1.3, ease: "easeOut", delay: 0.25 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`text-[16px] font-black leading-none ${isDark ? "text-white" : "text-slate-900"}`}
            >
              {score}
            </span>
            <span className="text-[8px] font-semibold" style={{ color: sc }}>
              {score >= 75 ? "Great" : score >= 50 ? "Good" : "Low"}
            </span>
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-2">
          {[
            {
              label: "Avg Rating",
              value: `${summary.avgRating}/5.0`,
              pct: (summary.avgRating / 5) * 100,
              color: "#f59e0b",
            },
            {
              label: "Reply Rate",
              value: `${summary.replyRate}%`,
              pct: summary.replyRate,
              color: "#06b6d4",
            },
            {
              label: "Reviews",
              value: String(summary.totalReviews),
              pct: Math.min(summary.totalReviews, 100),
              color: "#8b5cf6",
            },
          ].map((row, i) => (
            <div key={i}>
              <div className="flex justify-between mb-0.5">
                <span
                  className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-500"}`}
                >
                  {row.label}
                </span>
                <span
                  className={`text-[10px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {row.value}
                </span>
              </div>
              <div
                className={`h-1 rounded-full overflow-hidden ${isDark ? "bg-white/[0.07]" : "bg-slate-100"}`}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: row.color }}
                  initial={{ width: 0 }}
                  animate={inView ? { width: `${row.pct}%` } : { width: 0 }}
                  transition={{
                    duration: 1,
                    ease: "easeOut",
                    delay: 0.4 + i * 0.1,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COMPETITOR CARDS
═══════════════════════════════════════════════════════════════ */
function CompetitorCard({
  comp,
  myRating,
  isDark,
}: {
  comp: Competitor;
  myRating: number;
  isDark: boolean;
}) {
  const diff = +(comp.rating - myRating).toFixed(1);
  const isAhead = diff < 0,
    isTied = diff === 0;
  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      className={`shrink-0 rounded-2xl border p-4 min-w-[180px] flex flex-col gap-3
      ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-slate-100 shadow-sm"}`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-[10px] font-black px-2 py-0.5 rounded-full
          ${comp.position === 1 ? "bg-yellow-500/20 text-yellow-400" : isDark ? "bg-white/[0.07] text-slate-500" : "bg-slate-100 text-slate-500"}`}
        >
          #{comp.position}
        </span>
        <span
          className={`text-[10px] font-bold flex items-center gap-0.5
          ${isAhead ? "text-green-400" : isTied ? (isDark ? "text-slate-500" : "text-slate-500") : "text-red-400"}`}
        >
          {isAhead ? (
            <TrendingDown size={10} />
          ) : isTied ? (
            <Minus size={10} />
          ) : (
            <TrendingUp size={10} />
          )}
          {isTied ? "Tied" : `${Math.abs(diff)}★`}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-black text-white shrink-0"
          style={{
            background: `hsl(${(comp.name.charCodeAt(0) * 37) % 360},60%,45%)`,
          }}
        >
          {comp.name[0]}
        </div>
        <div className="min-w-0">
          <p
            className={`text-[12.5px] font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}
          >
            {comp.name}
          </p>
          <p
            className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-500"}`}
          >
            {comp.reviews.toLocaleString()} reviews
          </p>
        </div>
      </div>
      <div>
        <div className="flex justify-between mb-1">
          <span
            className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-500"}`}
          >
            Rating
          </span>
          <span
            className={`text-[12px] font-black ${isDark ? "text-white" : "text-slate-900"}`}
          >
            {comp.rating}★
          </span>
        </div>
        <div
          className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-white/[0.07]" : "bg-slate-100"}`}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: isAhead ? "#22c55e" : isTied ? "#f59e0b" : "#ef4444",
            }}
            initial={{ width: 0 }}
            whileInView={{ width: `${(comp.rating / 5) * 100}%` }}
            transition={{ duration: 0.85, ease: "easeOut", delay: 0.15 }}
            viewport={{ once: true }}
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SMART INSIGHT TIP
═══════════════════════════════════════════════════════════════ */
function InsightTip({
  summary,
  isDark,
  onAction,
}: {
  summary: AnalysisSummary;
  isDark: boolean;
  onAction: (r: string) => void;
}) {
  const tips = [
    ...(summary.replyRate < 50
      ? [
          {
            icon: <MessageSquare size={14} />,
            color: "#06b6d4",
            title: "Low Reply Rate",
            desc: `Only ${summary.replyRate}% of reviews have been replied. Boost trust by responding.`,
            cta: "Reply Now",
            route: "/reviews/google",
          },
        ]
      : []),
    ...(summary.totalPosts === 0
      ? [
          {
            icon: <FileText size={14} />,
            color: "#8b5cf6",
            title: "No Posts This Month",
            desc: "Businesses that post regularly get 4× more views.",
            cta: "Create Post",
            route: "/post/create",
          },
        ]
      : []),
    {
      icon: <BarChart2 size={14} />,
      color: "#3b82f6",
      title: "Analytics Available",
      desc: `${fmt(summary.totalImpressions)} impressions in 30 days. See the full breakdown.`,
      cta: "View Analytics",
      route: "/analysis/google",
    },
  ];
  const tip = tips[0];
  if (!tip) return null;
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-20px" }}
      className={`rounded-2xl border p-4 flex items-start gap-3
      ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-slate-100 shadow-sm"}`}
    >
      <motion.span
        className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: `${tip.color}18`, color: tip.color }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {tip.icon}
      </motion.span>
      <div className="flex-1">
        <p
          className={`text-[12.5px] font-bold mb-0.5 ${isDark ? "text-white" : "text-slate-900"}`}
        >
          {tip.title}
        </p>
        <p
          className={`text-[11.5px] leading-relaxed ${isDark ? "text-slate-500" : "text-slate-500"}`}
        >
          {tip.desc}
        </p>
        <motion.button
          onClick={() => onAction(tip.route)}
          className="mt-2 flex items-center gap-1 text-[11px] font-bold"
          style={{ color: tip.color }}
          whileTap={{ scale: 0.92 }}
          whileHover={{ x: 4, transition: { duration: 0.18 } }}
        >
          {tip.cta} <ChevronRight size={11} />
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RECENT REVIEWS FEED
═══════════════════════════════════════════════════════════════ */
function ActivityFeed({
  reviews,
  isDark,
}: {
  reviews: {
    author: string;
    rating: number;
    comment: string;
    date: string;
    replied: boolean;
  }[];
  isDark: boolean;
}) {
  const rc = ["", "#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];
  if (!reviews?.length) return null;
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-20px" }}
      className={`rounded-2xl border overflow-hidden ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-slate-100 shadow-sm"}`}
    >
      <div
        className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? "border-white/[0.05]" : "border-slate-100"}`}
      >
        <div className="flex items-center gap-2">
          <Star
            size={13}
            className="text-yellow-400"
            style={{ fill: "#facc15" }}
          />
          <p
            className={`text-[13px] font-black ${isDark ? "text-white" : "text-slate-900"}`}
            style={{ letterSpacing: "-0.02em" }}
          >
            Recent Reviews
          </p>
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDark ? "bg-white/[0.07] text-slate-500" : "bg-slate-100 text-slate-500"}`}
        >
          {reviews.length}
        </span>
      </div>
      {reviews.slice(0, 3).map((r, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -18 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1, duration: 0.36 }}
          viewport={{ once: true }}
          className={`flex items-start gap-3 px-4 py-3 ${i < 2 ? `border-b ${isDark ? "border-white/[0.04]" : "border-slate-50"}` : ""}`}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black text-white shrink-0"
            style={{
              background: `hsl(${(r.author.charCodeAt(0) * 73) % 360},55%,45%)`,
            }}
          >
            {r.author[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p
                className={`text-[12px] font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {r.author}
              </p>
              <div className="flex gap-0.5 shrink-0 ml-2">
                {[...Array(5)].map((_, j) => (
                  <motion.div
                    key={j}
                    initial={{ scale: 0, rotate: -20 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    transition={{
                      delay: 0.2 + j * 0.04,
                      type: "spring",
                      stiffness: 260,
                    }}
                    viewport={{ once: true }}
                  >
                    <Star
                      size={9}
                      style={{
                        fill:
                          j < r.rating
                            ? rc[r.rating]
                            : isDark
                              ? "#1e2a42"
                              : "#e2e8f0",
                        color:
                          j < r.rating
                            ? rc[r.rating]
                            : isDark
                              ? "#1e2a42"
                              : "#e2e8f0",
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
            <p
              className={`text-[11.5px] mt-0.5 line-clamp-1 ${isDark ? "text-slate-500" : "text-slate-600"}`}
            >
              {r.comment || "No comment"}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-[9.5px] ${isDark ? "text-slate-600" : "text-slate-500"}`}
              >
                {new Date(r.date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
              <AnimatePresence>
                {r.replied && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 280 }}
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isDark ? "bg-green-500/15 text-green-400" : "bg-green-50 text-green-600"}`}
                  >
                    Replied
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FACEBOOK COMING SOON
═══════════════════════════════════════════════════════════════ */
function FacebookComingSoonCard({ isDark }: { isDark: boolean }) {
  const [notified, setNotified] = useState(false);
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-20px" }}
      className={`rounded-3xl overflow-hidden border ${isDark ? "border-[#1877F2]/20" : "border-[#1877F2]/15"}`}
      style={{
        boxShadow: isDark
          ? "0 8px 40px rgba(24,119,242,0.1)"
          : "0 8px 40px rgba(24,119,242,0.08)",
      }}
    >
      <div
        className="relative p-5 overflow-hidden"
        style={{
          background: isDark
            ? "linear-gradient(135deg,#0b1826 0%,#0f2244 55%,#0b1826 100%)"
            : "linear-gradient(135deg,#eef4ff 0%,#dbeafe 55%,#eff6ff 100%)",
        }}
      >
        <motion.div
          className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle,rgba(24,119,242,0.15),transparent 70%)",
          }}
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle,rgba(66,183,42,0.1),transparent 70%)",
          }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        <div className="relative flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{
                background: isDark
                  ? "rgba(24,119,242,0.22)"
                  : "rgba(24,119,242,0.12)",
              }}
            >
              <FacebookLogo size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[16px] font-black ${isDark ? "text-white" : "text-slate-900"}`}
                  style={{ letterSpacing: "-0.03em" }}
                >
                  Facebook
                </span>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#1877F2] text-white tracking-widest">
                  SOON
                </span>
              </div>
              <p
                className={`text-[11px] mt-0.5 ${isDark ? "text-slate-500" : "text-slate-500"}`}
              >
                Pages · Ads · Insights · Messenger
              </p>
            </div>
          </div>
          <div
            className={`text-center px-3 py-2 rounded-2xl border ${isDark ? "bg-[#1877F2]/10 border-[#1877F2]/20" : "bg-[#1877F2]/08 border-[#1877F2]/15"}`}
          >
            <p className="text-[9px] font-bold text-blue-400 uppercase tracking-wide">
              ETA
            </p>
            <p
              className={`text-[12px] font-black ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Q3 2026
            </p>
          </div>
        </div>
        <div className="relative">
          <div className="blur-[6px] select-none pointer-events-none">
            <div className="flex items-baseline gap-2 mb-1">
              <span
                className={`text-[36px] font-black leading-none ${isDark ? "text-white" : "text-slate-900"}`}
                style={{ letterSpacing: "-0.05em" }}
              >
                24.8K
              </span>
              <span
                className={`text-[13px] mb-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}
              >
                page reach
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[12px] text-green-400 font-bold">
                +12% growth
              </span>
              <span
                className={`text-[12px] ${isDark ? "text-slate-500" : "text-slate-500"}`}
              >
                1.2K likes · 340 shares
              </span>
            </div>
          </div>
          <div className="absolute inset-0 flex items-center">
            <div
              className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-[11.5px] font-bold border
              ${isDark ? "bg-[#1877F2]/15 text-blue-300 border-[#1877F2]/25" : "bg-[#1877F2]/10 text-blue-700 border-[#1877F2]/20"}`}
            >
              <Lock size={11} /> Connect Facebook to unlock
            </div>
          </div>
        </div>
      </div>
      <div
        className={`grid grid-cols-4 border-b ${isDark ? "bg-[#0d1829] border-white/[0.05]" : "bg-[#f7faff] border-slate-100"}`}
      >
        {[
          {
            label: "Page Likes",
            icon: <ThumbsUp size={12} />,
            color: "#1877F2",
          },
          { label: "Post Reach", icon: <Eye size={12} />, color: "#42b72a" },
          { label: "Engagement", icon: <Heart size={12} />, color: "#f02849" },
          {
            label: "Ads Spend",
            icon: <ShoppingBag size={12} />,
            color: "#f59e0b",
          },
        ].map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            viewport={{ once: true }}
            className={`flex flex-col items-center py-3.5 gap-1 ${i < 3 ? `border-r ${isDark ? "border-white/[0.05]" : "border-slate-100"}` : ""}`}
          >
            <span style={{ color: m.color }} className="opacity-50">
              {m.icon}
            </span>
            <span
              className={`text-[14px] font-black ${isDark ? "text-white/20" : "text-slate-200"}`}
            >
              —
            </span>
            <span
              className={`text-[9px] font-semibold text-center uppercase tracking-wide leading-tight ${isDark ? "text-slate-600" : "text-slate-500"}`}
            >
              {m.label}
            </span>
          </motion.div>
        ))}
      </div>
      <div className={`p-4 ${isDark ? "bg-[#0d1421]" : "bg-white"}`}>
        <p
          className={`text-[10.5px] font-bold uppercase tracking-widest mb-3 ${isDark ? "text-slate-500" : "text-slate-500"}`}
        >
          Features coming
        </p>
        <motion.div
          className="grid grid-cols-2 gap-2 mb-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {[
            {
              icon: <ThumbsUp size={11} />,
              label: "Page Management",
              color: "#1877F2",
            },
            {
              icon: <BarChart2 size={11} />,
              label: "Post Analytics",
              color: "#42b72a",
            },
            {
              icon: <ShoppingBag size={11} />,
              label: "Ads Performance",
              color: "#f59e0b",
            },
            {
              icon: <MessageSquare size={11} />,
              label: "Inbox & Comments",
              color: "#06b6d4",
            },
            {
              icon: <Users size={11} />,
              label: "Audience Insights",
              color: "#8b5cf6",
            },
            {
              icon: <Zap size={11} />,
              label: "AI Post Generator",
              color: "#f97316",
            },
          ].map((f, i) => (
            <motion.div
              key={i}
              variants={staggerItem}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isDark ? "bg-white/[0.04] border border-white/[0.05]" : "bg-slate-50 border border-slate-100"}`}
            >
              <span style={{ color: f.color }}>{f.icon}</span>
              <span
                className={`text-[10.5px] font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}
              >
                {f.label}
              </span>
            </motion.div>
          ))}
        </motion.div>
        <motion.button
          onClick={() => setNotified(true)}
          whileTap={{ scale: 0.96 }}
          className={`w-full py-3 rounded-2xl text-[13px] font-black flex items-center justify-center gap-2
            ${notified ? (isDark ? "bg-green-500/15 text-green-400 border border-green-500/20" : "bg-green-50 text-green-600 border border-green-200") : "text-white"}`}
          style={
            notified
              ? {}
              : { background: "linear-gradient(135deg,#1877F2,#0d65d9)" }
          }
        >
          <AnimatePresence mode="wait">
            {notified ? (
              <motion.span
                key="done"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 280 }}
                className="flex items-center gap-2"
              >
                <span>✓</span> You'll be notified!
              </motion.span>
            ) : (
              <motion.span
                key="cta"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Bell size={14} /> Notify Me When Live
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   INSTAGRAM COMING SOON
═══════════════════════════════════════════════════════════════ */
function InstagramComingSoonCard({ isDark }: { isDark: boolean }) {
  const [notified, setNotified] = useState(false);
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-20px" }}
      className={`rounded-3xl overflow-hidden border ${isDark ? "border-[#e1306c]/20" : "border-[#e1306c]/15"}`}
      style={{
        boxShadow: isDark
          ? "0 8px 40px rgba(225,48,108,0.1)"
          : "0 8px 40px rgba(225,48,108,0.07)",
      }}
    >
      <div
        className="relative p-5 overflow-hidden"
        style={{
          background: isDark
            ? "linear-gradient(135deg,#1a0b1a 0%,#220d1f 55%,#0d0d1f 100%)"
            : "linear-gradient(135deg,#fdf2f9 0%,#fce7f3 50%,#f0ebff 100%)",
        }}
      >
        <motion.div
          className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle,rgba(225,48,108,0.18),transparent 70%)",
          }}
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-28 h-28 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle,rgba(252,175,69,0.1),transparent 70%)",
          }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5,
          }}
        />
        <div className="relative flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{
                background: isDark
                  ? "rgba(225,48,108,0.2)"
                  : "rgba(225,48,108,0.1)",
              }}
            >
              <InstagramLogo size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[16px] font-black ${isDark ? "text-white" : "text-slate-900"}`}
                  style={{ letterSpacing: "-0.03em" }}
                >
                  Instagram
                </span>
                <span
                  className="text-[9px] font-black px-2 py-0.5 rounded-full text-white tracking-widest"
                  style={{
                    background:
                      "linear-gradient(90deg,#833ab4,#fd5949,#fcaf45)",
                  }}
                >
                  SOON
                </span>
              </div>
              <p
                className={`text-[11px] mt-0.5 ${isDark ? "text-slate-500" : "text-slate-500"}`}
              >
                Feed · Reels · Stories · Shopping
              </p>
            </div>
          </div>
          <div
            className={`text-center px-3 py-2 rounded-2xl border ${isDark ? "bg-[#e1306c]/10 border-[#e1306c]/20" : "bg-[#e1306c]/07 border-[#e1306c]/15"}`}
          >
            <p
              className="text-[9px] font-bold uppercase tracking-wide"
              style={{ color: "#e1306c" }}
            >
              ETA
            </p>
            <p
              className={`text-[12px] font-black ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Q3 2026
            </p>
          </div>
        </div>
        <div className="relative">
          <div className="blur-[6px] select-none pointer-events-none">
            <div className="flex items-baseline gap-2 mb-1">
              <span
                className={`text-[36px] font-black leading-none ${isDark ? "text-white" : "text-slate-900"}`}
                style={{ letterSpacing: "-0.05em" }}
              >
                8.3K
              </span>
              <span
                className={`text-[13px] mb-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}
              >
                followers
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[12px] text-green-400 font-bold">
                +23% this month
              </span>
              <span
                className={`text-[12px] ${isDark ? "text-slate-500" : "text-slate-500"}`}
              >
                4.2% engagement
              </span>
            </div>
          </div>
          <div className="absolute inset-0 flex items-center">
            <div
              className="flex items-center gap-2 px-3.5 py-2 rounded-full text-[11.5px] font-bold border"
              style={
                isDark
                  ? {
                      background: "rgba(225,48,108,0.15)",
                      color: "#f472b6",
                      borderColor: "rgba(225,48,108,0.25)",
                    }
                  : {
                      background: "rgba(225,48,108,0.08)",
                      color: "#be185d",
                      borderColor: "rgba(225,48,108,0.2)",
                    }
              }
            >
              <Lock size={11} /> Connect Instagram to unlock
            </div>
          </div>
        </div>
      </div>
      <div
        className={`grid grid-cols-4 border-b ${isDark ? "bg-[#140a14] border-white/[0.05]" : "bg-[#fef8fc] border-slate-100"}`}
      >
        {[
          { label: "Followers", icon: <Users size={12} />, color: "#e1306c" },
          { label: "Reach", icon: <Eye size={12} />, color: "#fd5949" },
          { label: "Likes", icon: <Heart size={12} />, color: "#833ab4" },
          { label: "Saves", icon: <Bookmark size={12} />, color: "#fcaf45" },
        ].map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            viewport={{ once: true }}
            className={`flex flex-col items-center py-3.5 gap-1 ${i < 3 ? `border-r ${isDark ? "border-white/[0.05]" : "border-slate-100"}` : ""}`}
          >
            <span style={{ color: m.color }} className="opacity-50">
              {m.icon}
            </span>
            <span
              className={`text-[14px] font-black ${isDark ? "text-white/20" : "text-slate-200"}`}
            >
              —
            </span>
            <span
              className={`text-[9px] font-semibold uppercase tracking-wide ${isDark ? "text-slate-600" : "text-slate-500"}`}
            >
              {m.label}
            </span>
          </motion.div>
        ))}
      </div>
      <div className={`p-4 ${isDark ? "bg-[#0d1421]" : "bg-white"}`}>
        <p
          className={`text-[10.5px] font-bold uppercase tracking-widest mb-3 ${isDark ? "text-slate-500" : "text-slate-500"}`}
        >
          Features coming
        </p>
        <motion.div
          className="grid grid-cols-2 gap-2 mb-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {[
            {
              icon: <PlayCircle size={11} />,
              label: "Reels Analytics",
              color: "#e1306c",
            },
            {
              icon: <Hash size={11} />,
              label: "Hashtag Tracker",
              color: "#fd5949",
            },
            {
              icon: <Users size={11} />,
              label: "Follower Growth",
              color: "#833ab4",
            },
            {
              icon: <Heart size={11} />,
              label: "Engagement Rate",
              color: "#fcaf45",
            },
            {
              icon: <Video size={11} />,
              label: "Story Insights",
              color: "#f97316",
            },
            {
              icon: <Zap size={11} />,
              label: "AI Caption Writer",
              color: "#8b5cf6",
            },
          ].map((f, i) => (
            <motion.div
              key={i}
              variants={staggerItem}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isDark ? "bg-white/[0.04] border border-white/[0.05]" : "bg-slate-50 border border-slate-100"}`}
            >
              <span style={{ color: f.color }}>{f.icon}</span>
              <span
                className={`text-[10.5px] font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}
              >
                {f.label}
              </span>
            </motion.div>
          ))}
        </motion.div>
        <motion.button
          onClick={() => setNotified(true)}
          whileTap={{ scale: 0.96 }}
          className={`w-full py-3 rounded-2xl text-[13px] font-black flex items-center justify-center gap-2
            ${notified ? (isDark ? "bg-green-500/15 text-green-400 border border-green-500/20" : "bg-green-50 text-green-600 border border-green-200") : "text-white"}`}
          style={
            notified
              ? {}
              : {
                  background: "linear-gradient(135deg,#833ab4,#fd5949,#fcaf45)",
                }
          }
        >
          <AnimatePresence mode="wait">
            {notified ? (
              <motion.span
                key="done"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 280 }}
                className="flex items-center gap-2"
              >
                <span>✓</span> You'll be notified!
              </motion.span>
            ) : (
              <motion.span key="cta" className="flex items-center gap-2">
                <Bell size={14} /> Notify Me When Live
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NOT CONNECTED BANNER
═══════════════════════════════════════════════════════════════ */
function NotConnectedBanner({
  isDark,
  onGo,
}: {
  isDark: boolean;
  onGo: () => void;
}) {
  return (
    <motion.div
      onClick={onGo}
      variants={fadeUp}
      initial="hidden"
      animate="show"
      whileTap={{ scale: 0.97 }}
      className={`rounded-2xl border p-4 flex items-center gap-3 cursor-pointer
        ${isDark ? "bg-yellow-500/[0.07] border-yellow-500/20" : "bg-yellow-50 border-yellow-200"}`}
    >
      <motion.div
        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${isDark ? "bg-yellow-500/15" : "bg-yellow-100"}`}
        animate={{ rotate: [0, -6, 6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <AlertCircle size={18} className="text-yellow-500" />
      </motion.div>
      <div className="flex-1">
        <p
          className={`text-[13px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}
        >
          Connect Google Business
        </p>
        <p
          className={`text-[11.5px] ${isDark ? "text-slate-500" : "text-slate-500"}`}
        >
          Link your profile to unlock live analytics
        </p>
      </div>
      <motion.div whileHover={{ x: 4, transition: { duration: 0.2 } }}>
        <ChevronRight
          size={15}
          className={isDark ? "text-slate-500" : "text-slate-500"}
        />
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  const router = useRouter();
  const fbRef = useRef<HTMLDivElement>(null);
  const igRef = useRef<HTMLDivElement>(null);

  const { data: user, isLoading: userLoading } = useUser();

  const {
    data: analytics,
    isLoading: analyticsLoading,
    isError,
    refetch,
  } = useQuery<AnalysisData>({
    queryKey: ["home-analytics", user?.googleLocationId],
    queryFn: () => fetchHomeAnalysis(user!.googleLocationId!),
    enabled: !!user?.googleLocationId,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const isLoading = userLoading || (analyticsLoading && !analytics);
  const sparkData =
    analytics?.charts?.impressionsByDay?.map((d) => d.desktop + d.mobile) ?? [];
  const s = analytics?.summary;
  const competitors = s ? generateCompetitors(s.avgRating) : [];

  const metrics: MetricCardData[] = s
    ? [
        {
          label: "Views",
          value: fmt(s.totalImpressions),
          sub: "Impressions",
          icon: <Eye size={14} />,
          color: "#3b82f6",
          sparkData: sparkData.slice(-14),
        },
        {
          label: "Calls",
          value: fmt(s.totalCalls),
          sub: "Call clicks",
          icon: <Phone size={14} />,
          color: "#22c55e",
        },
        {
          label: "Website",
          value: fmt(s.totalWebsite),
          sub: "Link clicks",
          icon: <Globe size={14} />,
          color: "#8b5cf6",
        },
        {
          label: "Directions",
          value: fmt(s.totalDirections),
          sub: "Map requests",
          icon: <Navigation size={14} />,
          color: "#f97316",
        },
        {
          label: "Leads",
          value: fmt(s.totalCalls + s.totalDirections + s.totalConversations),
          sub: "Total leads",
          icon: <Target size={14} />,
          color: "#06b6d4",
        },
        {
          label: "Reviews",
          value: String(s.totalReviews),
          sub: `${s.avgRating}★ avg`,
          icon: <Star size={14} />,
          color: "#f59e0b",
        },
      ]
    : [];

  function scrollTo(id: string) {
    const m: Record<string, React.RefObject<HTMLDivElement | null>> = {
      facebook: fbRef,
      instagram: igRef,
    };
    m[id]?.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-[#0d1421]" : "bg-[#eef2fb]"}`}
      style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}
    >
      <div className="max-w-lg mx-auto px-4 pb-32">
        {/* ─── HEADER ─── */}
        <motion.div
          className="pt-4 pb-5 flex items-center justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div>
            {userLoading ? (
              <>
                <Sk isDark={isDark} className="h-4 w-28 mb-1.5" />
                <Sk isDark={isDark} className="h-3 w-24" />
              </>
            ) : (
              <>
                <motion.p
                  className={`text-[13px] font-medium ${isDark ? "text-slate-500" : "text-slate-500"}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.18 }}
                >
                  {greet()} 👋
                </motion.p>
                <motion.h1
                  className={`text-[20px] font-black leading-tight ${isDark ? "text-white" : "text-slate-900"}`}
                  style={{ letterSpacing: "-0.04em" }}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.22,
                    duration: 0.4,
                    type: "spring",
                    stiffness: 200,
                  }}
                >
                  {user?.name?.split(" ")[0] ?? "Welcome"}
                </motion.h1>
                {user?.googleLocationName && (
                  <motion.div
                    className="flex items-center gap-1 mt-0.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.32 }}
                  >
                    <span className={`text-[11px] text-slate-500`}>
                      - {user.googleLocationName}
                    </span>
                  </motion.div>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {analytics && (
              <motion.button
                onClick={() => refetch()}
                whileTap={{ scale: 0.85, rotate: 180 }}
                className={`w-9 h-9 flex items-center justify-center rounded-2xl
                  ${isDark ? "bg-white/[0.07] text-slate-500" : "bg-white text-slate-500 border border-slate-200"}`}
              >
                <motion.div
                  animate={analyticsLoading ? { rotate: 360 } : {}}
                  transition={
                    analyticsLoading
                      ? { duration: 0.9, repeat: Infinity, ease: "linear" }
                      : {}
                  }
                >
                  <RefreshCw size={14} />
                </motion.div>
              </motion.button>
            )}
            <motion.button
              onClick={() => router.push("/profile")}
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.06 }}
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-[13px] font-black text-white overflow-hidden shrink-0"
              style={{ background: "linear-gradient(135deg,#2563eb,#4f46e5)" }}
            >
              {user?.name ? getInitials(user.name) : <Settings size={16} />}
            </motion.button>
          </div>
        </motion.div>

        {/* CIBIL SCORE */}
        <motion.div
          className="pb-4 flex items-center justify-center"
          variants={scaleIn}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.2 }}
        >
          <CibilScore />
        </motion.div>

        {isLoading && <HomeSkeleton isDark={isDark} />}

        {!isLoading && (
          <motion.div
            className="flex flex-col gap-6"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            <AnimatePresence>
              {!user?.googleLocationId && (
                <NotConnectedBanner
                  isDark={isDark}
                  onGo={() => router.push("/profile")}
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isError && user?.googleLocationId && (
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, height: 0 }}
                  className={`rounded-2xl border p-4 flex items-center gap-3
                  ${isDark ? "bg-red-500/[0.08] border-red-500/20" : "bg-red-50 border-red-200"}`}
                >
                  <WifiOff size={16} className="text-red-400 shrink-0" />
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-red-400">
                      Failed to load analytics
                    </p>
                    <motion.button
                      onClick={() => refetch()}
                      whileTap={{ scale: 0.93 }}
                      className="text-[11px] font-semibold text-blue-500 mt-0.5"
                    >
                      Tap to retry
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* PLATFORMS */}
            <motion.div variants={fadeUp}>
              <SectionHeader
                title="Your Platforms"
                subtitle="All channels in one place"
                isDark={isDark}
              />
              <PlatformsStrip isDark={isDark} onScrollTo={scrollTo} />
            </motion.div>

            {/* GOOGLE HERO */}
            {s && (
              <motion.div variants={fadeUp}>
                <SectionHeader
                  title="Google Business"
                  subtitle="Live · Last 30 days"
                  isDark={isDark}
                  action={{
                    label: "Full report",
                    onClick: () => router.push("/analysis/google"),
                  }}
                />
                <HeroCard
                  summary={s}
                  sparkData={sparkData}
                  isDark={isDark}
                  onTap={() => router.push("/analysis/google")}
                />
              </motion.div>
            )}

            {/* QUICK ACTIONS */}
            <motion.div variants={fadeUp}>
              <SectionHeader title="Quick Actions" isDark={isDark} />
              <QuickActionsGrid
                isDark={isDark}
                onNavigate={(r) => router.push(r)}
              />
            </motion.div>

            {/* METRICS SCROLL */}
            {metrics.length > 0 && (
              <motion.div variants={fadeUp}>
                <SectionHeader
                  title="Google Performance"
                  subtitle="Last 30 days"
                  isDark={isDark}
                  action={{
                    label: "Full report",
                    onClick: () => router.push("/analysis/google"),
                  }}
                />
                <MetricScrollStrip metrics={metrics} isDark={isDark} />
              </motion.div>
            )}

            {/* REVIEW HEALTH */}
            {s && (
              <motion.div variants={fadeUp}>
                <SectionHeader title="Review Health" isDark={isDark} />
                <ReviewHealthCard
                  summary={s}
                  isDark={isDark}
                  onNavigate={() => router.push("/reviews/google")}
                />
              </motion.div>
            )}

            {/* SMART INSIGHTS */}
            {s && (
              <motion.div variants={fadeUp}>
                <SectionHeader
                  title="Smart Insights"
                  subtitle="AI-powered recommendations"
                  isDark={isDark}
                />
                <InsightTip
                  summary={s}
                  isDark={isDark}
                  onAction={(r) => router.push(r)}
                />
              </motion.div>
            )}

            {/* COMPETITOR ANALYSIS */}
            {s && (
              <motion.div variants={fadeUp}>
                <SectionHeader
                  title="Competitor Analysis"
                  subtitle="Nearby businesses · Google Maps"
                  isDark={isDark}
                  action={{
                    label: "See all",
                    onClick: () => router.push("/dashboard/competitors"),
                  }}
                />
                <motion.div
                  className={`rounded-2xl border px-4 py-3 mb-3 flex items-center gap-3
                  ${isDark ? "bg-blue-500/[0.08] border-blue-500/20" : "bg-blue-50 border-blue-200"}`}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                  viewport={{ once: true }}
                >
                  <motion.div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? "bg-blue-500/20" : "bg-blue-100"}`}
                    animate={{ rotate: [0, -6, 6, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <Award
                      size={16}
                      className={isDark ? "text-blue-400" : "text-blue-600"}
                    />
                  </motion.div>
                  <div>
                    <p
                      className={`text-[12.5px] font-bold ${isDark ? "text-blue-300" : "text-blue-800"}`}
                    >
                      You rank #3 in your area
                    </p>
                    <p
                      className={`text-[11px] ${isDark ? "text-blue-400/70" : "text-blue-600/70"}`}
                    >
                      0.3★ behind the top competitor
                    </p>
                  </div>
                  <span
                    className="ml-auto text-[20px] font-black"
                    style={{ color: isDark ? "#60a5fa" : "#2563eb" }}
                  >
                    #3
                  </span>
                </motion.div>
                <motion.div
                  className="flex gap-3 overflow-x-auto no-scrollbar pb-1"
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-20px" }}
                >
                  {competitors.map((c, i) => (
                    <CompetitorCard
                      key={i}
                      comp={c}
                      myRating={s.avgRating}
                      isDark={isDark}
                    />
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* RECENT REVIEWS */}
            {(analytics?.recentReviews?.length ?? 0) > 0 && (
              <motion.div variants={fadeUp}>
                <SectionHeader
                  title="Recent Reviews"
                  isDark={isDark}
                  action={{
                    label: "All reviews",
                    onClick: () => router.push("/reviews/google"),
                  }}
                />
                <ActivityFeed
                  reviews={analytics!.recentReviews}
                  isDark={isDark}
                />
              </motion.div>
            )}

            {/* BOTTOM STATS */}
            {s && (
              <motion.div
                variants={fadeUp}
                className={`rounded-2xl border grid grid-cols-3 overflow-hidden
                ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-slate-100 shadow-sm"}`}
              >
                {[
                  {
                    label: "Conversations",
                    value: fmt(s.totalConversations),
                    color: "#06b6d4",
                  },
                  {
                    label: "Posts Live",
                    value: String(s.totalPosts),
                    color: "#8b5cf6",
                  },
                  {
                    label: "Reply Rate",
                    value: `${s.replyRate}%`,
                    color: "#22c55e",
                  },
                ].map((row, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.35 }}
                    viewport={{ once: true }}
                    className={`flex flex-col items-center py-4 gap-1
                    ${i < 2 ? `border-r ${isDark ? "border-white/[0.06]" : "border-slate-100"}` : ""}`}
                  >
                    <AnimatedNumber
                      value={row.value}
                      className="text-[20px] font-black block"
                      style={{ color: row.color }}
                    />
                    <span
                      className={`text-[10px] font-semibold ${isDark ? "text-slate-500" : "text-slate-500"}`}
                    >
                      {row.label}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* SOCIAL DIVIDER */}
            <motion.div
              className="flex items-center gap-3 py-2"
              variants={fadeUp}
            >
              <div
                className={`h-px flex-1 ${isDark ? "bg-white/[0.07]" : "bg-slate-200"}`}
              />
              <motion.div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest
                ${isDark ? "bg-white/[0.04] border-white/[0.08] text-slate-500" : "bg-white border-slate-200 text-slate-500"}`}
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles size={10} className="text-purple-400" />
                </motion.div>
                Social Media
                <span
                  className="px-1.5 py-0.5 rounded-full text-white text-[8px]"
                  style={{
                    background: "linear-gradient(90deg,#8b5cf6,#ec4899)",
                  }}
                >
                  SOON
                </span>
              </motion.div>
              <div
                className={`h-px flex-1 ${isDark ? "bg-white/[0.07]" : "bg-slate-200"}`}
              />
            </motion.div>

            {/* FACEBOOK */}
            <motion.div ref={fbRef} variants={fadeUp}>
              <SectionHeader
                title="Facebook"
                subtitle="Pages · Ads · Messenger analytics"
                isDark={isDark}
              />
              <FacebookComingSoonCard isDark={isDark} />
            </motion.div>

            {/* INSTAGRAM */}
            <motion.div ref={igRef} className="mt-1" variants={fadeUp}>
              <SectionHeader
                title="Instagram"
                subtitle="Feed · Reels · Stories analytics"
                isDark={isDark}
              />
              <InstagramComingSoonCard isDark={isDark} />
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
