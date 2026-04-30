// mobile_app\app\(main)\analysis\google\page.tsx

// mobile_app\app\(main)\analysis\google\page.tsx

"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useTheme } from "next-themes";
import { useQuery } from "@tanstack/react-query";
import {
  motion,
  AnimatePresence,
  useInView,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { useUser } from "@/features/user/hook/useUser";
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Phone,
  Globe,
  Navigation,
  Star,
  MessageSquare,
  FileText,
  RefreshCw,
  Download,
  Calendar,
  Filter,
  ChevronDown,
  Building2,
  WifiOff,
  Minus,
  ArrowUpRight,
  BarChart2,
  PieChart as PieIcon,
  Monitor,
  Smartphone,
  MapPin,
  Search,
  Users,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  Zap,
  Share2,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
type RangeKey = "7d" | "30d" | "90d";

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
interface ImpressionDay {
  date: string;
  desktop: number;
  mobile: number;
}
interface ActionDay {
  date: string;
  calls: number;
  website: number;
  directions: number;
}
interface SeriesPoint {
  date: string;
  value: number;
}
interface ImpressionBreak {
  desktopMaps: number;
  desktopSearch: number;
  mobileMaps: number;
  mobileSearch: number;
}

interface AnalysisData {
  success: boolean;
  range: string;
  startDate: string;
  endDate: string;
  summary: AnalysisSummary;
  charts: {
    impressionsByDay: ImpressionDay[];
    actionsByDay: ActionDay[];
    impressionBreakdown: ImpressionBreak;
    ratingDistribution: Record<number, number>;
    callSeries: SeriesPoint[];
    websiteSeries: SeriesPoint[];
    directionSeries: SeriesPoint[];
  };
  recentReviews: {
    author: string;
    rating: number;
    comment: string;
    date: string;
    replied: boolean;
  }[];
}

/* ══════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════ */
const RANGES: { id: RangeKey; label: string }[] = [
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "90d", label: "90 Days" },
];
const PIE_COLORS = ["#3b82f6", "#6366f1", "#06b6d4", "#8b5cf6"];

/* ══════════════════════════════════════════════════════════
   ANIMATION VARIANTS
══════════════════════════════════════════════════════════ */
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};
const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.35 } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.34, 1.2, 0.64, 1] },
  },
};
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.34, 1.26, 0.64, 1] },
  },
};
const slideInLeft = {
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
function getToken() {
  return typeof window !== "undefined"
    ? localStorage.getItem("accessToken")
    : null;
}

async function fetchAnalysis(
  locationId: string,
  range: RangeKey,
): Promise<AnalysisData> {
  const res = await fetch(
    `/api/google/analysis?locationId=${locationId}&range=${range}`,
    {
      headers: { Authorization: `Bearer ${getToken()}` },
    },
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Failed to load analysis");
  return json;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}
function fmtDateShort(s: string): string {
  const d = new Date(s);
  return `${d.getDate()} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()]}`;
}
function pct(a: number, b: number) {
  if (!b) return "0%";
  return Math.round((a / b) * 100) + "%";
}
function trendIcon(val: number, isDark: boolean) {
  if (val > 0) return <TrendingUp size={12} className="text-green-400" />;
  if (val < 0) return <TrendingDown size={12} className="text-red-400" />;
  return (
    <Minus size={12} className={isDark ? "text-slate-500" : "text-slate-400"} />
  );
}

/* ══════════════════════════════════════════════════════════
   ANIMATED NUMBER
══════════════════════════════════════════════════════════ */
function AnimatedNumber({
  value,
  className,
  style,
}: {
  value: string | number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const str = String(value);
  const suffix = str.endsWith("M")
    ? "M"
    : str.endsWith("K")
      ? "K"
      : str.endsWith("%")
        ? "%"
        : str.includes("★")
          ? "★"
          : "";
  const raw = parseFloat(str.replace(/[KM%★ ]/g, ""));
  const isNum = !isNaN(raw);

  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10px" });
  const spring = useSpring(0, { stiffness: 50, damping: 18 });
  const display = useTransform(spring, (v) => {
    if (suffix === "M") return (v / 1_000_000).toFixed(1) + "M";
    if (suffix === "K") return (v / 1_000).toFixed(1) + "K";
    if (suffix === "%") return Math.round(v) + "%";
    if (suffix === "★") return v.toFixed(1) + " ★";
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

/* ══════════════════════════════════════════════════════════
   ATOMS
══════════════════════════════════════════════════════════ */
function GoogleLogo({ size = 16 }: { size?: number }) {
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

function Spin({ size = 16 }: { size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeOpacity="0.25"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </motion.svg>
  );
}

function Sk({
  isDark,
  className = "",
}: {
  isDark: boolean;
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-xl ${isDark ? "bg-white/[0.07]" : "bg-slate-200/70"} ${className}`}
    />
  );
}

/* ══════════════════════════════════════════════════════════
   STAT CARD
══════════════════════════════════════════════════════════ */
function StatCard({
  label,
  value,
  icon,
  color,
  sub,
  trend,
  isDark,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  sub?: string;
  trend?: number;
  isDark: boolean;
}) {
  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -2, transition: { duration: 0.18 } }}
      whileTap={{ scale: 0.97 }}
      className={`rounded-2xl p-4 border flex flex-col gap-2 relative overflow-hidden
        ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05] shadow-sm"}`}
    >
      <motion.div
        className="absolute -top-4 -right-4 w-16 h-16 rounded-full blur-xl"
        style={{ background: color, opacity: 0.06 }}
        animate={{ scale: [1, 1.4, 1], opacity: [0.06, 0.12, 0.06] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="flex items-center justify-between">
        <span
          className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}
        >
          {label}
        </span>
        <motion.span
          className="p-2 rounded-xl"
          style={{ background: `${color}18` }}
          whileHover={{ rotate: 12, scale: 1.1 }}
        >
          <span style={{ color }}>{icon}</span>
        </motion.span>
      </div>
      <div className="flex items-end gap-2">
        <AnimatedNumber
          value={typeof value === "number" ? fmt(value) : value}
          className={`text-[26px] font-black leading-none ${isDark ? "text-white" : "text-slate-900"}`}
          style={{
            fontFamily: "-apple-system,'SF Pro Display',sans-serif",
            letterSpacing: "-0.04em",
          }}
        />
        {trend !== undefined && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className={`flex items-center gap-0.5 mb-0.5 text-[12px] font-semibold
              ${trend > 0 ? "text-green-400" : trend < 0 ? "text-red-400" : isDark ? "text-slate-500" : "text-slate-400"}`}
          >
            {trendIcon(trend, isDark)}
            {trend !== 0 && `${Math.abs(trend)}%`}
          </motion.div>
        )}
      </div>
      {sub && (
        <span
          className={`text-[12px] ${isDark ? "text-slate-600" : "text-slate-400"}`}
        >
          {sub}
        </span>
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   CHART CARD
══════════════════════════════════════════════════════════ */
function ChartCard({
  title,
  subtitle,
  children,
  isDark,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  isDark: boolean;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-20px" }}
      className={`rounded-2xl border overflow-hidden
        ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05] shadow-sm"}`}
    >
      <div
        className={`flex items-start justify-between px-4 pt-4 pb-3 border-b
        ${isDark ? "border-white/[0.05]" : "border-slate-100"}`}
      >
        <div>
          <p
            className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}
          >
            {title}
          </p>
          {subtitle && (
            <p
              className={`text-[12px] mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}
            >
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   CUSTOM TOOLTIP
══════════════════════════════════════════════════════════ */
function CustomTooltip({ active, payload, label, isDark }: any) {
  if (!active || !payload?.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`rounded-xl border px-3 py-2 shadow-xl text-[12px]
        ${isDark ? "bg-[#1e2a42] border-white/[0.1]" : "bg-white border-slate-200"}`}
    >
      <p
        className={`font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-600"}`}
      >
        {label}
      </p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className={isDark ? "text-slate-400" : "text-slate-500"}>
            {p.name}:
          </span>
          <span
            className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}
          >
            {fmt(p.value)}
          </span>
        </div>
      ))}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   SKELETON — responsive 2-col on desktop
══════════════════════════════════════════════════════════ */
function PageSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <motion.div
      className="flex flex-col gap-4"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      {/* stat grid: 2-col mobile, 3-col desktop */}
      <motion.div
        variants={fadeUp}
        className="grid grid-cols-2 md:grid-cols-3 gap-3"
      >
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`rounded-2xl p-4 h-24 border ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05]"}`}
          >
            <Sk isDark={isDark} className="h-2.5 w-20 mb-3" />
            <Sk isDark={isDark} className="h-7 w-16" />
          </div>
        ))}
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            variants={fadeUp}
            className={`rounded-2xl border h-56 ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05]"}`}
          >
            <div className="p-4">
              <Sk isDark={isDark} className="h-3 w-32 mb-2" />
              <Sk isDark={isDark} className="h-2 w-20" />
            </div>
            <div className="px-4 pb-4">
              <Sk isDark={isDark} className="h-32 w-full rounded-xl" />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   STAR ROW
══════════════════════════════════════════════════════════ */
function StarRow({
  rating,
  count,
  max,
  isDark,
}: {
  rating: number;
  count: number;
  max: number;
  isDark: boolean;
}) {
  const w = max ? Math.round((count / max) * 100) : 0;
  const colors = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];
  return (
    <div className="flex items-center gap-2">
      <span
        className={`text-[12px] font-bold w-3 ${isDark ? "text-slate-500" : "text-slate-400"}`}
      >
        {rating}
      </span>
      <Star
        size={10}
        className="shrink-0"
        style={{ color: colors[rating - 1], fill: colors[rating - 1] }}
      />
      <div
        className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? "bg-white/[0.07]" : "bg-slate-100"}`}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: colors[rating - 1] }}
          initial={{ width: 0 }}
          whileInView={{ width: `${w}%` }}
          transition={{
            duration: 0.9,
            ease: "easeOut",
            delay: (5 - rating) * 0.08,
          }}
          viewport={{ once: true }}
        />
      </div>
      <span
        className={`text-[10px] font-medium w-6 text-right ${isDark ? "text-slate-500" : "text-slate-400"}`}
      >
        {count}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   REVIEW CARD
══════════════════════════════════════════════════════════ */
function ReviewCard({
  review,
  isDark,
  index,
}: {
  review: {
    author: string;
    rating: number;
    comment: string;
    date: string;
    replied: boolean;
  };
  isDark: boolean;
  index: number;
}) {
  const [exp, setExp] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.36 }}
      viewport={{ once: true }}
      whileHover={{ x: 2, transition: { duration: 0.18 } }}
      className={`p-3.5 rounded-2xl border ${isDark ? "bg-[#182236] border-white/[0.05]" : "bg-slate-50 border-slate-100"}`}
    >
      <div className="flex items-start gap-2.5 mb-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
          <span className="text-white text-[12px] font-bold">
            {review.author[0]?.toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`text-[12.5px] font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}
          >
            {review.author}
          </p>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{
                    delay: 0.15 + i * 0.04,
                    type: "spring",
                    stiffness: 260,
                  }}
                  viewport={{ once: true }}
                >
                  <Star
                    size={9}
                    style={{
                      color:
                        i < review.rating
                          ? "#f59e0b"
                          : isDark
                            ? "#334155"
                            : "#e2e8f0",
                      fill:
                        i < review.rating
                          ? "#f59e0b"
                          : isDark
                            ? "#334155"
                            : "#e2e8f0",
                    }}
                  />
                </motion.div>
              ))}
            </div>
            <span
              className={`text-[10px] ${isDark ? "text-slate-600" : "text-slate-400"}`}
            >
              {fmtDate(review.date)}
            </span>
          </div>
        </div>
        <AnimatePresence>
          {review.replied && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 280 }}
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0
                ${isDark ? "bg-green-500/15 text-green-400" : "bg-green-50 text-green-600"}`}
            >
              Replied
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      {review.comment && (
        <p
          className={`text-[12px] leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}
        >
          {exp || review.comment.length <= 80
            ? review.comment
            : review.comment.slice(0, 80) + "…"}
          {review.comment.length > 80 && (
            <motion.button
              onClick={() => setExp((v) => !v)}
              whileTap={{ scale: 0.9 }}
              className="ml-1 text-blue-500 text-[12px] font-medium"
            >
              {exp ? "Less" : "More"}
            </motion.button>
          )}
        </p>
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   PIE LABEL
══════════════════════════════════════════════════════════ */
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, value }: any) {
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  if (value < 2) return null;
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={10}
      fontWeight={700}
    >
      {fmt(value)}
    </text>
  );
}

/* ══════════════════════════════════════════════════════════
   DOWNLOAD HELPERS
══════════════════════════════════════════════════════════ */
function downloadCSV(data: AnalysisData, range: RangeKey) {
  const rows: string[][] = [];
  rows.push(["=== SUMMARY ===", ""]);
  rows.push(["Metric", "Value"]);
  const s = data.summary;
  rows.push(["Total Impressions", String(s.totalImpressions)]);
  rows.push(["Total Calls", String(s.totalCalls)]);
  rows.push(["Website Clicks", String(s.totalWebsite)]);
  rows.push(["Direction Requests", String(s.totalDirections)]);
  rows.push(["Conversations", String(s.totalConversations)]);
  rows.push(["Total Reviews", String(s.totalReviews)]);
  rows.push(["Avg Rating", String(s.avgRating)]);
  rows.push(["Reply Rate %", String(s.replyRate)]);
  rows.push(["", ""]);
  rows.push(["=== DAILY IMPRESSIONS ===", "", ""]);
  rows.push(["Date", "Desktop", "Mobile"]);
  for (const d of data.charts.impressionsByDay)
    rows.push([d.date, String(d.desktop), String(d.mobile)]);
  rows.push(["", "", ""]);
  rows.push(["=== DAILY ACTIONS ===", "", "", ""]);
  rows.push(["Date", "Calls", "Website Clicks", "Directions"]);
  for (const d of data.charts.actionsByDay)
    rows.push([
      d.date,
      String(d.calls),
      String(d.website),
      String(d.directions),
    ]);
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `google-analysis-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadReport(
  data: AnalysisData,
  range: RangeKey,
  locationName: string,
) {
  const s = data.summary;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Google Business Report – ${locationName}</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:800px;margin:0 auto;padding:32px;color:#0f172a}h1{font-size:22px;font-weight:900;letter-spacing:-0.04em;margin-bottom:4px}h2{font-size:15px;font-weight:800;margin:24px 0 10px;border-bottom:2px solid #e2e8f0;padding-bottom:6px}p.sub{color:#64748b;font-size:13px;margin:0 0 20px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}.card{background:#f8fafc;border-radius:12px;padding:16px;border:1px solid #e2e8f0}.card .val{font-size:26px;font-weight:900;letter-spacing:-0.04em;color:#1e293b}.card .lbl{font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;font-weight:700}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#f1f5f9;padding:8px 10px;text-align:left;font-weight:700;font-size:10px;text-transform:uppercase;color:#64748b}td{padding:7px 10px;border-bottom:1px solid #f1f5f9}tr:last-child td{border-bottom:none}.badge{display:inline-flex;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700}.green{background:#dcfce7;color:#16a34a}.red{background:#fee2e2;color:#dc2626}.footer{margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8}@media print{body{padding:20px}.no-print{display:none}}</style></head>
<body><h1>Google Business Report</h1><p class="sub">${locationName} · Last ${range} · Generated ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
<h2>Performance Summary</h2><div class="grid">
<div class="card"><div class="lbl">Impressions</div><div class="val">${fmt(s.totalImpressions)}</div></div>
<div class="card"><div class="lbl">Calls</div><div class="val">${fmt(s.totalCalls)}</div></div>
<div class="card"><div class="lbl">Website Clicks</div><div class="val">${fmt(s.totalWebsite)}</div></div>
<div class="card"><div class="lbl">Directions</div><div class="val">${fmt(s.totalDirections)}</div></div>
<div class="card"><div class="lbl">Avg Rating</div><div class="val">${s.avgRating} ⭐</div></div>
<div class="card"><div class="lbl">Reply Rate</div><div class="val">${s.replyRate}%</div></div></div>
<div class="footer">Generated by Google Business Analytics · ${new Date().toISOString()}</div></body></html>`;
  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
  }
}

/* ══════════════════════════════════════════════════════════
   ANIMATED PROGRESS BAR
══════════════════════════════════════════════════════════ */
function AnimatedBar({ pctValue, color }: { pctValue: string; color: string }) {
  return (
    <motion.div
      className="h-full rounded-full"
      style={{ background: color }}
      initial={{ width: 0 }}
      whileInView={{ width: pctValue }}
      transition={{ duration: 0.85, ease: "easeOut" }}
      viewport={{ once: true }}
    />
  );
}

/* ══════════════════════════════════════════════════════════
   ANIMATED RATING RING
══════════════════════════════════════════════════════════ */
function RatingRing({
  avgRating,
  isDark,
}: {
  avgRating: number;
  isDark: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });
  const circumference = 201;
  return (
    <div ref={ref} className="relative w-20 h-20 shrink-0">
      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
        <circle
          cx="40"
          cy="40"
          r="32"
          fill="none"
          stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
          strokeWidth="8"
        />
        <motion.circle
          cx="40"
          cy="40"
          r="32"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="8"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={
            inView
              ? {
                  strokeDasharray: `${(avgRating / 5) * circumference} ${circumference}`,
                }
              : {}
          }
          transition={{ duration: 1.3, ease: "easeOut", delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedNumber
          value={`${avgRating}`}
          className={`text-[18px] font-black leading-none ${isDark ? "text-white" : "text-slate-900"}`}
          style={{ letterSpacing: "-0.04em" }}
        />
        <span
          className={`text-[9px] font-semibold ${isDark ? "text-slate-500" : "text-slate-400"}`}
        >
          / 5.0
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function GoogleAnalysisPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  const { data: user, isLoading: userLoading } = useUser();

  const [range, setRange] = useState<RangeKey>("90d");
  const [activeChart, setActiveChart] = useState<"area" | "bar">("area");
  const [showDl, setShowDl] = useState(false);
  const dlRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dlRef.current && !dlRef.current.contains(e.target as Node))
        setShowDl(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data, isLoading, isError, error, refetch, isFetching } =
    useQuery<AnalysisData>({
      queryKey: ["google-analysis", user?.googleLocationId, range],
      queryFn: () => fetchAnalysis(user!.googleLocationId!, range),
      enabled: !!user?.googleLocationId,
      staleTime: 5 * 60_000,
    });

  const impData = useMemo(
    () =>
      (data?.charts.impressionsByDay ?? []).map((d) => ({
        name: fmtDateShort(d.date),
        desktop: d.desktop,
        mobile: d.mobile,
        total: d.desktop + d.mobile,
      })),
    [data],
  );

  const actData = useMemo(
    () =>
      (data?.charts.actionsByDay ?? []).map((d) => ({
        name: fmtDateShort(d.date),
        Calls: d.calls,
        Website: d.website,
        Directions: d.directions,
      })),
    [data],
  );

  const pieData = useMemo(() => {
    const b = data?.charts.impressionBreakdown;
    if (!b) return [];
    return [
      { name: "Desktop Maps", value: b.desktopMaps },
      { name: "Desktop Search", value: b.desktopSearch },
      { name: "Mobile Maps", value: b.mobileMaps },
      { name: "Mobile Search", value: b.mobileSearch },
    ].filter((d) => d.value > 0);
  }, [data]);

  const ratingMax = useMemo(() => {
    if (!data) return 1;
    return Math.max(...Object.values(data.charts.ratingDistribution), 1);
  }, [data]);

  const gridColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  const axisLblColor = isDark ? "#475569" : "#94a3b8";
  const s = data?.summary;
  const isInitial = userLoading || (isLoading && !data);
  const locationName =
    user?.googleLocationName ?? "Please connect your business.";

  return (
    <div
      className="w-full"
      style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}
    >
      {/* ══ HEADER ══ */}
      <motion.div
        className="pt-2 pb-4"
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="flex items-center justify-between">
          <div>
            <motion.div
              className="flex items-center gap-2 mb-0.5"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.38 }}
            >
              <GoogleLogo size={16} />
              <h1
                className={`text-[18px] font-black ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Google Analytics
              </h1>
              <AnimatePresence>
                {isFetching && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                  >
                    <Spin size={13} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            <motion.div
              className="flex items-center gap-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Building2
                size={11}
                className={isDark ? "text-slate-600" : "text-slate-400"}
              />
              <span
                className={`text-[12px] ${isDark ? "text-slate-500" : "text-slate-500"}`}
              >
                {locationName}
              </span>
            </motion.div>
          </div>

          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.38 }}
          >
            <motion.button
              onClick={() => refetch()}
              disabled={isFetching}
              whileTap={{ scale: 0.88, rotate: 180 }}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all disabled:opacity-40
                ${isDark ? "bg-white/[0.07] text-slate-400 hover:bg-white/[0.12]" : "bg-white text-slate-500 border border-slate-200"}`}
            >
              <motion.div
                animate={isFetching ? { rotate: 360 } : {}}
                transition={
                  isFetching
                    ? { duration: 0.9, repeat: Infinity, ease: "linear" }
                    : {}
                }
              >
                <RefreshCw size={14} />
              </motion.div>
            </motion.button>

            <div className="relative" ref={dlRef}>
              <motion.button
                onClick={() => setShowDl((v) => !v)}
                disabled={!data}
                whileTap={{ scale: 0.93 }}
                className={`flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12px] font-bold transition-all disabled:opacity-30
                  ${isDark ? "bg-white/[0.07] text-slate-300 hover:bg-white/[0.12]" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"}`}
              >
                <Download size={13} />
                Report
                <motion.div
                  animate={{ rotate: showDl ? 180 : 0 }}
                  transition={{ duration: 0.22 }}
                >
                  <ChevronDown size={12} />
                </motion.div>
              </motion.button>
              <AnimatePresence>
                {showDl && data && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -6 }}
                    transition={{ duration: 0.18, ease: [0.34, 1.2, 0.64, 1] }}
                    className={`absolute right-0 top-11 z-[100] rounded-2xl border overflow-hidden shadow-2xl min-w-[160px]
                      ${isDark ? "bg-[#1e2a42] border-white/[0.08]" : "bg-white border-black/[0.07]"}`}
                  >
                    <motion.button
                      onClick={() => {
                        downloadCSV(data, range);
                        setShowDl(false);
                      }}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.97 }}
                      className={`w-full flex items-center gap-2.5 px-4 py-3 text-[13px] transition-colors
                        ${isDark ? "text-slate-300 hover:bg-white/[0.06]" : "text-slate-700 hover:bg-slate-50"}`}
                    >
                      <FileText size={13} className="text-blue-500" /> Export
                      CSV
                    </motion.button>
                    <div
                      className={`h-px mx-3 ${isDark ? "bg-white/[0.06]" : "bg-slate-100"}`}
                    />
                    <motion.button
                      onClick={() => {
                        downloadReport(data, range, locationName);
                        setShowDl(false);
                      }}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.97 }}
                      className={`w-full flex items-center gap-2.5 px-4 py-3 text-[13px] transition-colors
                        ${isDark ? "text-slate-300 hover:bg-white/[0.06]" : "text-slate-700 hover:bg-slate-50"}`}
                    >
                      <Download size={13} className="text-purple-500" /> PDF
                      Report
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* range filters */}
        <motion.div
          className="flex gap-1.5 mt-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35 }}
        >
          {RANGES.map((r) => (
            <motion.button
              key={r.id}
              onClick={() => setRange(r.id)}
              whileTap={{ scale: 0.93 }}
              className={`h-8 px-4 rounded-xl text-[12px] font-semibold transition-all relative overflow-hidden
                ${
                  range === r.id
                    ? "bg-blue-500 text-white shadow-sm"
                    : isDark
                      ? "bg-white/[0.07] text-slate-400 hover:bg-white/[0.12]"
                      : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                }`}
            >
              {range === r.id && (
                <motion.div
                  layoutId="range-pill"
                  className="absolute inset-0 bg-blue-500 rounded-xl -z-10"
                  transition={{ type: "spring", stiffness: 280, damping: 26 }}
                />
              )}
              {r.label}
            </motion.button>
          ))}
        </motion.div>
      </motion.div>

      {/* ══ NOT CONNECTED ══ */}
      <AnimatePresence>
        {!userLoading && !user?.googleLocationId && (
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, scale: 0.95 }}
            className={`rounded-2xl p-10 text-center border
              ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05]"}`}
          >
            <motion.div
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Building2
                size={32}
                className={`mx-auto mb-3 ${isDark ? "text-slate-600" : "text-slate-300"}`}
              />
            </motion.div>
            <p
              className={`text-[14px] font-bold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              No Google Business Linked
            </p>
            <p
              className={`text-[12.5px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
            >
              Link your Google Business Profile in the Profile page.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ ERROR ══ */}
      <AnimatePresence>
        {isError && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, height: 0 }}
            className={`rounded-2xl p-4 flex items-start gap-3 border mb-4
              ${isDark ? "bg-red-500/[0.08] border-red-500/20" : "bg-red-50 border-red-200"}`}
          >
            <WifiOff size={16} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-red-400 mb-0.5">
                Failed to load analytics
              </p>
              <p
                className={`text-[12px] ${isDark ? "text-red-500/70" : "text-red-400"}`}
              >
                {(error as any)?.message}
              </p>
              <motion.button
                onClick={() => refetch()}
                whileTap={{ scale: 0.93 }}
                className="mt-1.5 text-[12px] font-semibold text-blue-500"
              >
                Retry
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ SKELETON ══ */}
      {isInitial && user?.googleLocationId && <PageSkeleton isDark={isDark} />}

      {/* ══ MAIN CONTENT ══ */}
      <AnimatePresence mode="wait">
        {data && s && (
          <motion.div
            key={range}
            className="flex flex-col gap-4"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: 10, transition: { duration: 0.2 } }}
          >
            {/* date range badge */}
            <motion.div
              variants={slideInLeft}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl self-start text-[12px] font-semibold border
                ${isDark ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-600"}`}
            >
              <motion.div
                animate={{ rotate: [0, -8, 8, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Calendar size={11} />
              </motion.div>
              {fmtDate(data.startDate)} – {fmtDate(data.endDate)}
            </motion.div>

            {/* ── STAT GRID: 2-col mobile → 3-col desktop ── */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-6 gap-3"
              variants={staggerContainer}
            >
              <StatCard
                label="Impressions"
                value={s.totalImpressions}
                icon={<Eye size={14} />}
                color="#3b82f6"
                isDark={isDark}
              />
              <StatCard
                label="Calls"
                value={s.totalCalls}
                icon={<Phone size={14} />}
                color="#22c55e"
                isDark={isDark}
              />
              <StatCard
                label="Website Clicks"
                value={s.totalWebsite}
                icon={<Globe size={14} />}
                color="#8b5cf6"
                isDark={isDark}
              />
              <StatCard
                label="Directions"
                value={s.totalDirections}
                icon={<Navigation size={14} />}
                color="#f97316"
                isDark={isDark}
              />
              <StatCard
                label="Avg Rating"
                value={`${s.avgRating} ★`}
                icon={<Star size={14} />}
                color="#f59e0b"
                sub={`${s.totalReviews} reviews`}
                isDark={isDark}
              />
              <StatCard
                label="Reply Rate"
                value={`${s.replyRate}%`}
                icon={<MessageSquare size={14} />}
                color="#06b6d4"
                sub="Reviews replied"
                isDark={isDark}
              />
            </motion.div>

            {/* ── CHARTS: stacked mobile → 2-col desktop ── */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Impressions Chart */}
              <ChartCard
                title="Impressions Over Time"
                subtitle={`Desktop + Mobile · ${range}`}
                isDark={isDark}
                action={
                  <div className="flex gap-1">
                    {(["area", "bar"] as const).map((t) => (
                      <motion.button
                        key={t}
                        onClick={() => setActiveChart(t)}
                        whileTap={{ scale: 0.9 }}
                        className={`h-7 px-2.5 rounded-lg text-[12px] font-semibold transition-all
                          ${activeChart === t ? "bg-blue-500 text-white" : isDark ? "bg-white/[0.07] text-slate-400" : "bg-slate-100 text-slate-500"}`}
                      >
                        {t === "area" ? "Area" : "Bar"}
                      </motion.button>
                    ))}
                  </div>
                }
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeChart}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ResponsiveContainer width="100%" height={180}>
                      {activeChart === "area" ? (
                        <AreaChart
                          data={impData}
                          margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="gDesktop"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#3b82f6"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor="#3b82f6"
                                stopOpacity={0}
                              />
                            </linearGradient>
                            <linearGradient
                              id="gMobile"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#06b6d4"
                                stopOpacity={0.25}
                              />
                              <stop
                                offset="95%"
                                stopColor="#06b6d4"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={gridColor}
                            vertical={false}
                          />
                          <XAxis
                            dataKey="name"
                            tick={{ fill: axisLblColor, fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            interval={Math.floor(impData.length / 5)}
                          />
                          <YAxis
                            tick={{ fill: axisLblColor, fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={fmt}
                          />
                          <Tooltip
                            content={<CustomTooltip isDark={isDark} />}
                          />
                          <Legend
                            iconType="circle"
                            iconSize={8}
                            formatter={(v) => (
                              <span
                                style={{ fontSize: 11, color: axisLblColor }}
                              >
                                {v}
                              </span>
                            )}
                          />
                          <Area
                            type="monotone"
                            dataKey="desktop"
                            name="Desktop"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fill="url(#gDesktop)"
                            dot={false}
                            animationDuration={800}
                            animationEasing="ease-out"
                          />
                          <Area
                            type="monotone"
                            dataKey="mobile"
                            name="Mobile"
                            stroke="#06b6d4"
                            strokeWidth={2}
                            fill="url(#gMobile)"
                            dot={false}
                            animationDuration={800}
                            animationEasing="ease-out"
                            animationBegin={150}
                          />
                        </AreaChart>
                      ) : (
                        <BarChart
                          data={impData}
                          margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
                          barGap={2}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={gridColor}
                            vertical={false}
                          />
                          <XAxis
                            dataKey="name"
                            tick={{ fill: axisLblColor, fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            interval={Math.floor(impData.length / 5)}
                          />
                          <YAxis
                            tick={{ fill: axisLblColor, fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={fmt}
                          />
                          <Tooltip
                            content={<CustomTooltip isDark={isDark} />}
                          />
                          <Legend
                            iconType="circle"
                            iconSize={8}
                            formatter={(v) => (
                              <span
                                style={{ fontSize: 11, color: axisLblColor }}
                              >
                                {v}
                              </span>
                            )}
                          />
                          <Bar
                            dataKey="desktop"
                            name="Desktop"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={12}
                            animationDuration={700}
                            animationEasing="ease-out"
                          />
                          <Bar
                            dataKey="mobile"
                            name="Mobile"
                            fill="#06b6d4"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={12}
                            animationDuration={700}
                            animationEasing="ease-out"
                            animationBegin={100}
                          />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </motion.div>
                </AnimatePresence>
              </ChartCard>

              {/* Actions Chart */}
              <ChartCard
                title="Customer Actions"
                subtitle={`Calls · Website · Directions · ${range}`}
                isDark={isDark}
              >
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart
                    data={actData}
                    margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={gridColor}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: axisLblColor, fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      interval={Math.floor(actData.length / 5)}
                    />
                    <YAxis
                      tick={{ fill: axisLblColor, fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={fmt}
                    />
                    <Tooltip content={<CustomTooltip isDark={isDark} />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(v) => (
                        <span style={{ fontSize: 11, color: axisLblColor }}>
                          {v}
                        </span>
                      )}
                    />
                    <Line
                      type="monotone"
                      dataKey="Calls"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                      animationDuration={800}
                      animationEasing="ease-out"
                    />
                    <Line
                      type="monotone"
                      dataKey="Website"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={false}
                      animationDuration={800}
                      animationEasing="ease-out"
                      animationBegin={100}
                    />
                    <Line
                      type="monotone"
                      dataKey="Directions"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={false}
                      animationDuration={800}
                      animationEasing="ease-out"
                      animationBegin={200}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Impression Source Pie */}
              {pieData.length > 0 && (
                <ChartCard
                  title="Impression Sources"
                  subtitle="Where customers found you"
                  isDark={isDark}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                            labelLine={false}
                            label={<PieLabel />}
                            animationBegin={100}
                            animationDuration={900}
                            animationEasing="ease-out"
                          >
                            {pieData.map((_, i) => (
                              <Cell
                                key={i}
                                fill={PIE_COLORS[i % PIE_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            content={<CustomTooltip isDark={isDark} />}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <motion.div
                      className="flex flex-col gap-2 shrink-0"
                      variants={staggerContainer}
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true }}
                    >
                      {pieData.map((d, i) => (
                        <motion.div
                          key={i}
                          variants={staggerItem}
                          className="flex items-center gap-1.5"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{
                              background: PIE_COLORS[i % PIE_COLORS.length],
                            }}
                          />
                          <div>
                            <p
                              className={`text-[10px] font-semibold leading-tight ${isDark ? "text-slate-400" : "text-slate-500"}`}
                            >
                              {d.name}
                            </p>
                            <p
                              className={`text-[12px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                            >
                              {fmt(d.value)}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>

                  <motion.div
                    className={`grid grid-cols-2 gap-2 mt-3 pt-3 border-t ${isDark ? "border-white/[0.05]" : "border-slate-100"}`}
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                  >
                    {[
                      {
                        label: "Desktop Maps",
                        icon: <Monitor size={11} />,
                        color: "#3b82f6",
                        val: data.charts.impressionBreakdown.desktopMaps,
                      },
                      {
                        label: "Desktop Search",
                        icon: <Search size={11} />,
                        color: "#6366f1",
                        val: data.charts.impressionBreakdown.desktopSearch,
                      },
                      {
                        label: "Mobile Maps",
                        icon: <Smartphone size={11} />,
                        color: "#06b6d4",
                        val: data.charts.impressionBreakdown.mobileMaps,
                      },
                      {
                        label: "Mobile Search",
                        icon: <Search size={11} />,
                        color: "#8b5cf6",
                        val: data.charts.impressionBreakdown.mobileSearch,
                      },
                    ].map((row, i) => (
                      <motion.div
                        key={i}
                        variants={staggerItem}
                        whileHover={{ y: -2, transition: { duration: 0.18 } }}
                        className={`flex items-center gap-2 p-2.5 rounded-xl ${isDark ? "bg-white/[0.03]" : "bg-slate-50"}`}
                      >
                        <motion.span
                          className="p-1.5 rounded-lg"
                          style={{
                            background: `${row.color}20`,
                            color: row.color,
                          }}
                          whileHover={{ rotate: 10 }}
                        >
                          {row.icon}
                        </motion.span>
                        <div>
                          <p
                            className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
                          >
                            {row.label}
                          </p>
                          <AnimatedNumber
                            value={fmt(row.val)}
                            className={`text-[13px] font-bold block ${isDark ? "text-white" : "text-slate-900"}`}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </ChartCard>
              )}

              {/* Engagement Summary */}
              <ChartCard
                title="Engagement Summary"
                subtitle="Total actions this period"
                isDark={isDark}
              >
                <motion.div
                  className="flex flex-col gap-2"
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                >
                  {[
                    {
                      label: "Phone Calls",
                      value: s.totalCalls,
                      icon: <Phone size={14} />,
                      color: "#22c55e",
                      pctOf: s.totalImpressions,
                    },
                    {
                      label: "Website Visits",
                      value: s.totalWebsite,
                      icon: <Globe size={14} />,
                      color: "#8b5cf6",
                      pctOf: s.totalImpressions,
                    },
                    {
                      label: "Direction Requests",
                      value: s.totalDirections,
                      icon: <Navigation size={14} />,
                      color: "#f97316",
                      pctOf: s.totalImpressions,
                    },
                    {
                      label: "Conversations",
                      value: s.totalConversations,
                      icon: <MessageSquare size={14} />,
                      color: "#06b6d4",
                      pctOf: s.totalImpressions,
                    },
                  ].map((row, i) => (
                    <motion.div
                      key={i}
                      variants={staggerItem}
                      whileHover={{ x: 3, transition: { duration: 0.18 } }}
                      className={`flex items-center gap-3 p-3 rounded-xl
                        ${isDark ? "bg-white/[0.03] hover:bg-white/[0.05]" : "bg-slate-50 hover:bg-slate-100"} transition-colors`}
                    >
                      <motion.span
                        className="p-2 rounded-xl shrink-0"
                        style={{
                          background: `${row.color}18`,
                          color: row.color,
                        }}
                        whileHover={{ rotate: 8, scale: 1.1 }}
                      >
                        {row.icon}
                      </motion.span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-[12px] font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}
                          >
                            {row.label}
                          </span>
                          <AnimatedNumber
                            value={fmt(row.value)}
                            className={`text-[12px] font-black block ${isDark ? "text-white" : "text-slate-900"}`}
                          />
                        </div>
                        <div
                          className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-white/[0.07]" : "bg-slate-200"}`}
                        >
                          <AnimatedBar
                            pctValue={pct(row.value, row.pctOf)}
                            color={row.color}
                          />
                        </div>
                        <p
                          className={`text-[10px] mt-0.5 ${isDark ? "text-slate-600" : "text-slate-400"}`}
                        >
                          {pct(row.value, row.pctOf)} of impressions
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </ChartCard>
            </div>
            {/* end 2-col chart grid */}

            {/* ── REVIEWS: full width (rich content benefits from wider column) ── */}
            <ChartCard
              title="Review Analysis"
              subtitle={`${s.totalReviews} total · ${s.avgRating}★ avg`}
              isDark={isDark}
            >
              {/* On desktop: rating ring + bars side by side, reviews in 2-col grid */}
              <div className="flex items-center gap-4 mb-4">
                <RatingRing avgRating={s.avgRating} isDark={isDark} />
                <div className="flex-1 flex flex-col gap-1.5">
                  {[5, 4, 3, 2, 1].map((n) => (
                    <StarRow
                      key={n}
                      rating={n}
                      count={data.charts.ratingDistribution[n] ?? 0}
                      max={ratingMax}
                      isDark={isDark}
                    />
                  ))}
                </div>
              </div>

              {/* reply rate */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.38 }}
                viewport={{ once: true }}
                className={`flex items-center justify-between p-3 rounded-xl mb-4 ${isDark ? "bg-white/[0.04]" : "bg-slate-50"}`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare size={13} className="text-cyan-500" />
                  <span
                    className={`text-[12px] font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}
                  >
                    Reply Rate
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-24 h-2 rounded-full overflow-hidden ${isDark ? "bg-white/[0.07]" : "bg-slate-200"}`}
                  >
                    <motion.div
                      className="h-full rounded-full bg-cyan-500"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${s.replyRate}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                      viewport={{ once: true }}
                    />
                  </div>
                  <span
                    className={`text-[12px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {s.replyRate}%
                  </span>
                </div>
              </motion.div>

              {data.recentReviews.length > 0 && (
                <>
                  <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className={`text-[12px] font-bold uppercase tracking-wide mb-2.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    Recent Reviews
                  </motion.p>
                  {/* 1-col mobile, 2-col on desktop */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
                    {data.recentReviews.map((r, i) => (
                      <ReviewCard
                        key={i}
                        review={r}
                        isDark={isDark}
                        index={i}
                      />
                    ))}
                  </div>
                </>
              )}
            </ChartCard>

            {/* Posts stat */}
            {s.totalPosts > 0 && (
              <motion.div
                variants={fadeUp}
                whileHover={{ y: -2, transition: { duration: 0.18 } }}
                className={`flex items-center justify-between p-4 rounded-2xl border
                  ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05] shadow-sm"}`}
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center
                    ${isDark ? "bg-blue-500/15" : "bg-blue-50"}`}
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  >
                    <FileText
                      size={16}
                      className={isDark ? "text-blue-400" : "text-blue-500"}
                    />
                  </motion.div>
                  <div>
                    <p
                      className={`text-[13px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      Active Posts
                    </p>
                    <p
                      className={`text-[12px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      Published on Google Business
                    </p>
                  </div>
                </div>
                <AnimatedNumber
                  value={String(s.totalPosts)}
                  className={`text-[22px] font-black block ${isDark ? "text-white" : "text-slate-900"}`}
                  style={{ letterSpacing: "-0.04em" }}
                />
              </motion.div>
            )}

            <motion.p
              variants={fadeIn}
              className="text-[12px] text-center leading-relaxed text-slate-500 pb-4"
            >
              Data sourced from Google Business Profile Performance API.
              Insights may have a 24–48 hour delay.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
