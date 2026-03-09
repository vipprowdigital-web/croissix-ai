// mobile_app\app\(main)\analysis\google\page.tsx

"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useTheme } from "next-themes";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from "recharts";
import { useUser } from "@/features/user/hook/useUser";
import {
  TrendingUp, TrendingDown, Eye, Phone, Globe, Navigation,
  Star, MessageSquare, FileText, RefreshCw, Download,
  Calendar, Filter, ChevronDown, Building2, WifiOff,
  Minus, ArrowUpRight, BarChart2, PieChart as PieIcon,
  Monitor, Smartphone, MapPin, Search, Users, Activity,
  CheckCircle2, Clock, AlertCircle, Zap, Share2,
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

interface ImpressionDay   { date: string; desktop: number; mobile: number }
interface ActionDay        { date: string; calls: number; website: number; directions: number }
interface SeriesPoint      { date: string; value: number }
interface ImpressionBreak  { desktopMaps: number; desktopSearch: number; mobileMaps: number; mobileSearch: number }

interface AnalysisData {
  success: boolean;
  range: string;
  startDate: string;
  endDate: string;
  summary: AnalysisSummary;
  charts: {
    impressionsByDay:    ImpressionDay[];
    actionsByDay:        ActionDay[];
    impressionBreakdown: ImpressionBreak;
    ratingDistribution:  Record<number, number>;
    callSeries:          SeriesPoint[];
    websiteSeries:       SeriesPoint[];
    directionSeries:     SeriesPoint[];
  };
  recentReviews: { author: string; rating: number; comment: string; date: string; replied: boolean }[];
}

/* ══════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════ */
const RANGES: { id: RangeKey; label: string }[] = [
  { id: "7d",  label: "7 Days"  },
  { id: "30d", label: "30 Days" },
  { id: "90d", label: "90 Days" },
];

const PIE_COLORS = ["#3b82f6", "#6366f1", "#06b6d4", "#8b5cf6"];

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
function getToken() { return typeof window !== "undefined" ? localStorage.getItem("accessToken") : null; }

async function fetchAnalysis(locationId: string, range: RangeKey): Promise<AnalysisData> {
  const res  = await fetch(`/api/google/analysis?locationId=${locationId}&range=${range}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Failed to load analysis");
  return json;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function fmtDateShort(s: string): string {
  const d = new Date(s);
  return `${d.getDate()} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()]}`;
}

function pct(a: number, b: number) {
  if (!b) return "0%";
  return Math.round((a / b) * 100) + "%";
}

function trendIcon(val: number, isDark: boolean) {
  if (val > 0)  return <TrendingUp  size={12} className="text-green-400"/>;
  if (val < 0)  return <TrendingDown size={12} className="text-red-400"/>;
  return <Minus size={12} className={isDark ? "text-slate-500" : "text-slate-400"}/>;
}

/* ══════════════════════════════════════════════════════════
   ATOMS
══════════════════════════════════════════════════════════ */
function GoogleLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M21.805 10.023H12v3.977h5.617c-.245 1.36-1.017 2.514-2.164 3.29v2.73h3.503C20.938 18.202 22 15.298 22 12c0-.66-.069-1.305-.195-1.977z" fill="#4285F4"/>
      <path d="M12 22c2.97 0 5.46-.984 7.28-2.668l-3.503-2.73c-.984.66-2.245 1.05-3.777 1.05-2.9 0-5.36-1.958-6.24-4.59H2.15v2.817C3.96 19.983 7.7 22 12 22z" fill="#34A853"/>
      <path d="M5.76 13.062A6.05 6.05 0 0 1 5.44 12c0-.37.063-.73.163-1.062V8.121H2.15A9.987 9.987 0 0 0 2 12c0 1.61.387 3.13 1.07 4.477l3.69-2.817z" fill="#FBBC05"/>
      <path d="M12 5.958c1.637 0 3.105.563 4.26 1.667l3.195-3.195C17.455 2.693 14.965 1.6 12 1.6 7.7 1.6 3.96 3.617 2.15 7.12l3.61 2.817C6.64 7.305 9.1 5.958 12 5.958z" fill="#EA4335"/>
    </svg>
  );
}

function Spin({ size = 16 }: { size?: number }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

function Sk({ isDark, className = "" }: { isDark: boolean; className?: string }) {
  return <div className={`animate-pulse rounded-xl ${isDark ? "bg-white/[0.07]" : "bg-slate-200/70"} ${className}`}/>;
}

/* ══════════════════════════════════════════════════════════
   STAT CARD
══════════════════════════════════════════════════════════ */
function StatCard({ label, value, icon, color, sub, trend, isDark }: {
  label: string; value: string | number; icon: React.ReactNode;
  color: string; sub?: string; trend?: number; isDark: boolean;
}) {
  return (
    <div className={`rounded-2xl p-4 border flex flex-col gap-2 relative overflow-hidden
      ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05] shadow-sm"}`}>
      {/* glow */}
      <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-[0.06] blur-xl"
        style={{ background: color }}/>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          {label}
        </span>
        <span className="p-2 rounded-xl" style={{ background: `${color}18` }}>
          <span style={{ color }}>{icon}</span>
        </span>
      </div>
      <div className="flex items-end gap-2">
        <span className={`text-[26px] font-black leading-none ${isDark ? "text-white" : "text-slate-900"}`}
          style={{ fontFamily: "-apple-system,'SF Pro Display',sans-serif", letterSpacing: "-0.04em" }}>
          {typeof value === "number" ? fmt(value) : value}
        </span>
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 mb-0.5 text-[11px] font-semibold
            ${trend > 0 ? "text-green-400" : trend < 0 ? "text-red-400" : isDark ? "text-slate-500" : "text-slate-400"}`}>
            {trendIcon(trend, isDark)}
            {trend !== 0 && `${Math.abs(trend)}%`}
          </div>
        )}
      </div>
      {sub && <span className={`text-[11px] ${isDark ? "text-slate-600" : "text-slate-400"}`}>{sub}</span>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CHART CARD
══════════════════════════════════════════════════════════ */
function ChartCard({ title, subtitle, children, isDark, action }: {
  title: string; subtitle?: string; children: React.ReactNode;
  isDark: boolean; action?: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border overflow-hidden
      ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05] shadow-sm"}`}>
      <div className={`flex items-start justify-between px-4 pt-4 pb-3 border-b
        ${isDark ? "border-white/[0.05]" : "border-slate-100"}`}>
        <div>
          <p className={`text-[13px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{title}</p>
          {subtitle && <p className={`text-[11px] mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CUSTOM TOOLTIP
══════════════════════════════════════════════════════════ */
function CustomTooltip({ active, payload, label, isDark }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className={`rounded-xl border px-3 py-2 shadow-xl text-[12px]
      ${isDark ? "bg-[#1e2a42] border-white/[0.1]" : "bg-white border-slate-200"}`}>
      <p className={`font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }}/>
          <span className={isDark ? "text-slate-400" : "text-slate-500"}>{p.name}:</span>
          <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SKELETON
══════════════════════════════════════════════════════════ */
function PageSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      {/* stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {[...Array(6)].map((_,i) => (
          <div key={i} className={`rounded-2xl p-4 h-24 border ${isDark?"bg-[#131c2d] border-white/[0.06]":"bg-white border-black/[0.05]"}`}>
            <Sk isDark={isDark} className="h-2.5 w-20 mb-3"/>
            <Sk isDark={isDark} className="h-7 w-16"/>
          </div>
        ))}
      </div>
      {/* chart */}
      <div className={`rounded-2xl border h-56 ${isDark?"bg-[#131c2d] border-white/[0.06]":"bg-white border-black/[0.05]"}`}>
        <div className="p-4"><Sk isDark={isDark} className="h-3 w-32 mb-2"/><Sk isDark={isDark} className="h-2 w-20"/></div>
        <div className="px-4 pb-4"><Sk isDark={isDark} className="h-32 w-full rounded-xl"/></div>
      </div>
      {/* chart 2 */}
      <div className={`rounded-2xl border h-56 ${isDark?"bg-[#131c2d] border-white/[0.06]":"bg-white border-black/[0.05]"}`}>
        <div className="p-4"><Sk isDark={isDark} className="h-3 w-28 mb-2"/><Sk isDark={isDark} className="h-2 w-24"/></div>
        <div className="px-4 pb-4"><Sk isDark={isDark} className="h-32 w-full rounded-xl"/></div>
      </div>
    </div>
  );
}
/* ══════════════════════════════════════════════════════════
   STAR ROW
══════════════════════════════════════════════════════════ */
function StarRow({ rating, count, max, isDark }: { rating: number; count: number; max: number; isDark: boolean }) {
  const w = max ? Math.round((count / max) * 100) : 0;
  const colors = ["#ef4444","#f97316","#eab308","#84cc16","#22c55e"];
  return (
    <div className="flex items-center gap-2">
      <span className={`text-[11px] font-bold w-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}>{rating}</span>
      <Star size={10} className={`shrink-0`} style={{ color: colors[rating - 1], fill: colors[rating - 1] }}/>
      <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? "bg-white/[0.07]" : "bg-slate-100"}`}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${w}%`, background: colors[rating - 1] }}/>
      </div>
      <span className={`text-[10px] font-medium w-6 text-right ${isDark ? "text-slate-500" : "text-slate-400"}`}>
        {count}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   REVIEW CARD
══════════════════════════════════════════════════════════ */
function ReviewCard({ review, isDark }: {
  review: { author: string; rating: number; comment: string; date: string; replied: boolean };
  isDark: boolean;
}) {
  const [exp, setExp] = useState(false);
  return (
    <div className={`p-3.5 rounded-2xl border ${isDark ? "bg-[#182236] border-white/[0.05]" : "bg-slate-50 border-slate-100"}`}>
      <div className="flex items-start gap-2.5 mb-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
          <span className="text-white text-[11px] font-bold">{review.author[0]?.toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[12.5px] font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}>{review.author}</p>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_,i) => (
                <Star key={i} size={9} style={{
                  color:  i < review.rating ? "#f59e0b" : (isDark ? "#334155" : "#e2e8f0"),
                  fill:   i < review.rating ? "#f59e0b" : (isDark ? "#334155" : "#e2e8f0"),
                }}/>
              ))}
            </div>
            <span className={`text-[10px] ${isDark ? "text-slate-600" : "text-slate-400"}`}>
              {fmtDate(review.date)}
            </span>
          </div>
        </div>
        {review.replied && (
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0
            ${isDark ? "bg-green-500/15 text-green-400" : "bg-green-50 text-green-600"}`}>
            Replied
          </span>
        )}
      </div>
      {review.comment && (
        <p className={`text-[12px] leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          {exp || review.comment.length <= 80
            ? review.comment
            : review.comment.slice(0, 80) + "…"}
          {review.comment.length > 80 && (
            <button onClick={() => setExp(v => !v)} className="ml-1 text-blue-500 text-[11px] font-medium">
              {exp ? "Less" : "More"}
            </button>
          )}
        </p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   IMPRESSION PIE LABELS
══════════════════════════════════════════════════════════ */
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, value, isDark }: any) {
  const RADIAN = Math.PI / 180;
  const r  = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x  = cx + r * Math.cos(-midAngle * RADIAN);
  const y  = cy + r * Math.sin(-midAngle * RADIAN);
  if (value < 2) return null; // skip tiny slices
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={10} fontWeight={700}>{fmt(value)}</text>
  );
}

/* ══════════════════════════════════════════════════════════
   DOWNLOAD CSV
══════════════════════════════════════════════════════════ */
function downloadCSV(data: AnalysisData, range: RangeKey) {
  const rows: string[][] = [];

  // summary
  rows.push(["=== SUMMARY ===", ""]);
  rows.push(["Metric", "Value"]);
  const s = data.summary;
  rows.push(["Total Impressions",     String(s.totalImpressions)]);
  rows.push(["Total Calls",           String(s.totalCalls)]);
  rows.push(["Website Clicks",        String(s.totalWebsite)]);
  rows.push(["Direction Requests",    String(s.totalDirections)]);
  rows.push(["Conversations",         String(s.totalConversations)]);
  rows.push(["Total Reviews",         String(s.totalReviews)]);
  rows.push(["Avg Rating",            String(s.avgRating)]);
  rows.push(["Reply Rate %",          String(s.replyRate)]);
  rows.push(["", ""]);

  // impressions
  rows.push(["=== DAILY IMPRESSIONS ===", "", ""]);
  rows.push(["Date", "Desktop", "Mobile"]);
  for (const d of data.charts.impressionsByDay) {
    rows.push([d.date, String(d.desktop), String(d.mobile)]);
  }
  rows.push(["", "", ""]);

  // actions
  rows.push(["=== DAILY ACTIONS ===", "", "", ""]);
  rows.push(["Date", "Calls", "Website Clicks", "Directions"]);
  for (const d of data.charts.actionsByDay) {
    rows.push([d.date, String(d.calls), String(d.website), String(d.directions)]);
  }

  const csv = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `google-analysis-${range}-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ══════════════════════════════════════════════════════════
   DOWNLOAD PDF (print-based)
══════════════════════════════════════════════════════════ */
function downloadReport(data: AnalysisData, range: RangeKey, locationName: string) {
  const s = data.summary;
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Google Business Report – ${locationName}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:800px;margin:0 auto;padding:32px;color:#0f172a}
  h1{font-size:22px;font-weight:900;letter-spacing:-0.04em;margin-bottom:4px}
  h2{font-size:15px;font-weight:800;margin:24px 0 10px;border-bottom:2px solid #e2e8f0;padding-bottom:6px}
  p.sub{color:#64748b;font-size:13px;margin:0 0 20px}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}
  .card{background:#f8fafc;border-radius:12px;padding:16px;border:1px solid #e2e8f0}
  .card .val{font-size:26px;font-weight:900;letter-spacing:-0.04em;color:#1e293b}
  .card .lbl{font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;font-weight:700}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{background:#f1f5f9;padding:8px 10px;text-align:left;font-weight:700;font-size:10px;text-transform:uppercase;color:#64748b}
  td{padding:7px 10px;border-bottom:1px solid #f1f5f9}
  tr:last-child td{border-bottom:none}
  .badge{display:inline-flex;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700}
  .green{background:#dcfce7;color:#16a34a} .red{background:#fee2e2;color:#dc2626}
  .footer{margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8}
  @media print{body{padding:20px}.no-print{display:none}}
</style>
</head>
<body>
<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M21.805 10.023H12v3.977h5.617c-.245 1.36-1.017 2.514-2.164 3.29v2.73h3.503C20.938 18.202 22 15.298 22 12c0-.66-.069-1.305-.195-1.977z" fill="#4285F4"/>
    <path d="M12 22c2.97 0 5.46-.984 7.28-2.668l-3.503-2.73c-.984.66-2.245 1.05-3.777 1.05-2.9 0-5.36-1.958-6.24-4.59H2.15v2.817C3.96 19.983 7.7 22 12 22z" fill="#34A853"/>
    <path d="M5.76 13.062A6.05 6.05 0 0 1 5.44 12c0-.37.063-.73.163-1.062V8.121H2.15A9.987 9.987 0 0 0 2 12c0 1.61.387 3.13 1.07 4.477l3.69-2.817z" fill="#FBBC05"/>
    <path d="M12 5.958c1.637 0 3.105.563 4.26 1.667l3.195-3.195C17.455 2.693 14.965 1.6 12 1.6 7.7 1.6 3.96 3.617 2.15 7.12l3.61 2.817C6.64 7.305 9.1 5.958 12 5.958z" fill="#EA4335"/>
  </svg>
  <h1>Google Business Report</h1>
</div>
<p class="sub">${locationName} &nbsp;·&nbsp; Last ${range} &nbsp;·&nbsp; Generated ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>

<h2>Performance Summary</h2>
<div class="grid">
  <div class="card"><div class="lbl">Impressions</div><div class="val">${fmt(s.totalImpressions)}</div></div>
  <div class="card"><div class="lbl">Calls</div><div class="val">${fmt(s.totalCalls)}</div></div>
  <div class="card"><div class="lbl">Website Clicks</div><div class="val">${fmt(s.totalWebsite)}</div></div>
  <div class="card"><div class="lbl">Directions</div><div class="val">${fmt(s.totalDirections)}</div></div>
  <div class="card"><div class="lbl">Avg Rating</div><div class="val">${s.avgRating} ⭐</div></div>
  <div class="card"><div class="lbl">Reply Rate</div><div class="val">${s.replyRate}%</div></div>
</div>

<h2>Daily Impressions</h2>
<table>
  <thead><tr><th>Date</th><th>Desktop</th><th>Mobile</th><th>Total</th></tr></thead>
  <tbody>
    ${data.charts.impressionsByDay.slice(-14).map(d =>
      `<tr><td>${fmtDateShort(d.date)}</td><td>${d.desktop}</td><td>${d.mobile}</td><td><strong>${d.desktop + d.mobile}</strong></td></tr>`
    ).join("")}
  </tbody>
</table>

<h2>Daily Actions</h2>
<table>
  <thead><tr><th>Date</th><th>Calls</th><th>Website</th><th>Directions</th></tr></thead>
  <tbody>
    ${data.charts.actionsByDay.slice(-14).map(d =>
      `<tr><td>${fmtDateShort(d.date)}</td><td>${d.calls}</td><td>${d.website}</td><td>${d.directions}</td></tr>`
    ).join("")}
  </tbody>
</table>

<h2>Recent Reviews</h2>
<table>
  <thead><tr><th>Author</th><th>Rating</th><th>Comment</th><th>Status</th></tr></thead>
  <tbody>
    ${data.recentReviews.map(r =>
      `<tr><td>${r.author}</td><td>${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</td><td>${r.comment.slice(0, 60)}${r.comment.length > 60 ? "…" : ""}</td><td><span class="badge ${r.replied ? "green" : "red"}">${r.replied ? "Replied" : "Pending"}</span></td></tr>`
    ).join("")}
  </tbody>
</table>

<div class="footer">Generated by Google Business Analytics · ${new Date().toISOString()}</div>
</body>
</html>`;

  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
  }
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

  const [range,       setRange]       = useState<RangeKey>("30d");
  const [activeChart, setActiveChart] = useState<"area" | "bar">("area");
  const [showDl,      setShowDl]      = useState(false);
  const dlRef = useRef<HTMLDivElement>(null);

  /* close dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dlRef.current && !dlRef.current.contains(e.target as Node)) setShowDl(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<AnalysisData>({
    queryKey:  ["google-analysis", user?.googleLocationId, range],
    queryFn:   () => fetchAnalysis(user!.googleLocationId!, range),
    enabled:   !!user?.googleLocationId,
    staleTime: 5 * 60_000,
  });

  /* chart data */
  const impData = useMemo(() =>
    (data?.charts.impressionsByDay ?? []).map(d => ({
      name: fmtDateShort(d.date), desktop: d.desktop, mobile: d.mobile, total: d.desktop + d.mobile,
    })),
  [data]);

  const actData = useMemo(() =>
    (data?.charts.actionsByDay ?? []).map(d => ({
      name: fmtDateShort(d.date), Calls: d.calls, Website: d.website, Directions: d.directions,
    })),
  [data]);

  const pieData = useMemo(() => {
    const b = data?.charts.impressionBreakdown;
    if (!b) return [];
    return [
      { name: "Desktop Maps",   value: b.desktopMaps   },
      { name: "Desktop Search", value: b.desktopSearch },
      { name: "Mobile Maps",    value: b.mobileMaps    },
      { name: "Mobile Search",  value: b.mobileSearch  },
    ].filter(d => d.value > 0);
  }, [data]);

  const ratingMax = useMemo(() => {
    if (!data) return 1;
    return Math.max(...Object.values(data.charts.ratingDistribution), 1);
  }, [data]);

  const gridColor     = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  const axisColor     = isDark ? "#334155" : "#cbd5e1";
  const axisLblColor  = isDark ? "#475569" : "#94a3b8";
  const s             = data?.summary;
  const isInitial     = userLoading || (isLoading && !data);
  const locationName  = user?.googleLocationName ?? "Your Business";

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-[#0d1421]" : "bg-[#eef2fb]"}`}
      style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}>
      <div className="max-w-lg mx-auto px-4 pb-28">

        {/* ══ HEADER ══ */}
        <div className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <GoogleLogo size={16}/>
                <h1 className={`text-[18px] font-black ${isDark ? "text-white" : "text-slate-900"}`}
                  style={{ fontFamily: "-apple-system,'SF Pro Display',sans-serif", letterSpacing: "-0.03em" }}>
                  Analytics
                </h1>
                {isFetching && !isLoading && <Spin size={13}/>}
              </div>
              <div className="flex items-center gap-1.5">
                <Building2 size={11} className={isDark ? "text-slate-600" : "text-slate-400"}/>
                <span className={`text-[12px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>{locationName}</span>
              </div>
            </div>

            {/* actions */}
            <div className="flex items-center gap-2">
              <button onClick={() => refetch()} disabled={isFetching}
                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90 disabled:opacity-40
                  ${isDark ? "bg-white/[0.07] text-slate-400 hover:bg-white/[0.12]" : "bg-white text-slate-500 border border-slate-200"}`}>
                <RefreshCw size={14} className={isFetching ? "animate-spin" : ""}/>
              </button>

              {/* download dropdown */}
              <div className="relative" ref={dlRef}>
                <button onClick={() => setShowDl(v => !v)} disabled={!data}
                  className={`flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12px] font-bold transition-all active:scale-95 disabled:opacity-30
                    ${isDark ? "bg-white/[0.07] text-slate-300 hover:bg-white/[0.12]" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"}`}>
                  <Download size={13}/>
                  Report
                  <ChevronDown size={12} className={`transition-transform ${showDl ? "rotate-180" : ""}`}/>
                </button>
                {showDl && data && (
                  <div className={`absolute right-0 top-11 z-[100] rounded-2xl border overflow-hidden shadow-2xl min-w-[160px]
                    ${isDark ? "bg-[#1e2a42] border-white/[0.08]" : "bg-white border-black/[0.07]"}`}>
                    <button onClick={() => { downloadCSV(data, range); setShowDl(false); }}
                      className={`w-full flex items-center gap-2.5 px-4 py-3 text-[13px] transition-colors
                        ${isDark ? "text-slate-300 hover:bg-white/[0.06]" : "text-slate-700 hover:bg-slate-50"}`}>
                      <FileText size={13} className="text-blue-500"/> Export CSV
                    </button>
                    <div className={`h-px mx-3 ${isDark ? "bg-white/[0.06]" : "bg-slate-100"}`}/>
                    <button onClick={() => { downloadReport(data, range, locationName); setShowDl(false); }}
                      className={`w-full flex items-center gap-2.5 px-4 py-3 text-[13px] transition-colors
                        ${isDark ? "text-slate-300 hover:bg-white/[0.06]" : "text-slate-700 hover:bg-slate-50"}`}>
                      <Download size={13} className="text-purple-500"/> PDF Report
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* range filters */}
          <div className="flex gap-1.5 mt-3">
            {RANGES.map(r => (
              <button key={r.id} onClick={() => setRange(r.id)}
                className={`h-8 px-4 rounded-xl text-[12px] font-semibold transition-all active:scale-95
                  ${range === r.id
                    ? "bg-blue-500 text-white shadow-sm"
                    : isDark ? "bg-white/[0.07] text-slate-400 hover:bg-white/[0.12]"
                             : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"}`}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* ══ NOT CONNECTED ══ */}
        {!userLoading && !user?.googleLocationId && (
          <div className={`rounded-2xl p-10 text-center border
            ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05]"}`}>
            <Building2 size={32} className={`mx-auto mb-3 ${isDark ? "text-slate-600" : "text-slate-300"}`}/>
            <p className={`text-[14px] font-bold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>
              No Google Business Linked
            </p>
            <p className={`text-[12.5px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              Link your Google Business Profile in the Profile page.
            </p>
          </div>
        )}

        {/* ══ ERROR ══ */}
        {isError && (
          <div className={`rounded-2xl p-4 flex items-start gap-3 border mb-4
            ${isDark ? "bg-red-500/[0.08] border-red-500/20" : "bg-red-50 border-red-200"}`}>
            <WifiOff size={16} className="text-red-400 mt-0.5 shrink-0"/>
            <div>
              <p className="text-[13px] font-semibold text-red-400 mb-0.5">Failed to load analytics</p>
              <p className={`text-[12px] ${isDark ? "text-red-500/70" : "text-red-400"}`}>{(error as any)?.message}</p>
              <button onClick={() => refetch()} className="mt-1.5 text-[12px] font-semibold text-blue-500">Retry</button>
            </div>
          </div>
        )}

        {/* ══ SKELETON ══ */}
        {isInitial && user?.googleLocationId && <PageSkeleton isDark={isDark}/>}

        {/* ══ MAIN CONTENT ══ */}
        {data && s && (
          <div className="flex flex-col gap-4">

            {/* date range badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl self-start text-[11px] font-semibold border
              ${isDark ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-600"}`}>
              <Calendar size={11}/>
              {fmtDate(data.startDate)} – {fmtDate(data.endDate)}
            </div>

            {/* ── STAT GRID ── */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Impressions"   value={s.totalImpressions}    icon={<Eye size={14}/>}         color="#3b82f6" isDark={isDark}/>
              <StatCard label="Calls"         value={s.totalCalls}           icon={<Phone size={14}/>}       color="#22c55e" isDark={isDark}/>
              <StatCard label="Website Clicks" value={s.totalWebsite}        icon={<Globe size={14}/>}       color="#8b5cf6" isDark={isDark}/>
              <StatCard label="Directions"    value={s.totalDirections}      icon={<Navigation size={14}/>}  color="#f97316" isDark={isDark}/>
              <StatCard label="Avg Rating"    value={`${s.avgRating} ★`}     icon={<Star size={14}/>}        color="#f59e0b"
                sub={`${s.totalReviews} reviews`} isDark={isDark}/>
              <StatCard label="Reply Rate"    value={`${s.replyRate}%`}       icon={<MessageSquare size={14}/>} color="#06b6d4"
                sub="Reviews replied" isDark={isDark}/>
            </div>

            {/* ── IMPRESSIONS CHART ── */}
            <ChartCard title="Impressions Over Time"
              subtitle={`Desktop + Mobile · ${range}`}
              isDark={isDark}
              action={
                <div className="flex gap-1">
                  {(["area","bar"] as const).map(t => (
                    <button key={t} onClick={() => setActiveChart(t)}
                      className={`h-7 px-2.5 rounded-lg text-[11px] font-semibold transition-all
                        ${activeChart === t ? "bg-blue-500 text-white" : isDark ? "bg-white/[0.07] text-slate-400" : "bg-slate-100 text-slate-500"}`}>
                      {t === "area" ? "Area" : "Bar"}
                    </button>
                  ))}
                </div>
              }>
              <ResponsiveContainer width="100%" height={180}>
                {activeChart === "area" ? (
                  <AreaChart data={impData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gDesktop" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="gMobile" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false}/>
                    <XAxis dataKey="name" tick={{ fill: axisLblColor, fontSize: 10 }} tickLine={false} axisLine={false}
                      interval={Math.floor(impData.length / 6)}/>
                    <YAxis tick={{ fill: axisLblColor, fontSize: 10 }} tickLine={false} axisLine={false}
                      tickFormatter={fmt}/>
                    <Tooltip content={<CustomTooltip isDark={isDark}/>}/>
                    <Legend iconType="circle" iconSize={8}
                      formatter={(v) => <span style={{ fontSize: 11, color: axisLblColor }}>{v}</span>}/>
                    <Area type="monotone" dataKey="desktop" name="Desktop" stroke="#3b82f6"
                      strokeWidth={2} fill="url(#gDesktop)" dot={false}/>
                    <Area type="monotone" dataKey="mobile"  name="Mobile"  stroke="#06b6d4"
                      strokeWidth={2} fill="url(#gMobile)"  dot={false}/>
                  </AreaChart>
                ) : (
                  <BarChart data={impData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false}/>
                    <XAxis dataKey="name" tick={{ fill: axisLblColor, fontSize: 10 }} tickLine={false} axisLine={false}
                      interval={Math.floor(impData.length / 6)}/>
                    <YAxis tick={{ fill: axisLblColor, fontSize: 10 }} tickLine={false} axisLine={false}
                      tickFormatter={fmt}/>
                    <Tooltip content={<CustomTooltip isDark={isDark}/>}/>
                    <Legend iconType="circle" iconSize={8}
                      formatter={(v) => <span style={{ fontSize: 11, color: axisLblColor }}>{v}</span>}/>
                    <Bar dataKey="desktop" name="Desktop" fill="#3b82f6" radius={[4,4,0,0]} maxBarSize={12}/>
                    <Bar dataKey="mobile"  name="Mobile"  fill="#06b6d4" radius={[4,4,0,0]} maxBarSize={12}/>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </ChartCard>

            {/* ── ACTIONS CHART ── */}
            <ChartCard title="Customer Actions" subtitle={`Calls · Website · Directions · ${range}`} isDark={isDark}>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={actData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false}/>
                  <XAxis dataKey="name" tick={{ fill: axisLblColor, fontSize: 10 }} tickLine={false} axisLine={false}
                    interval={Math.floor(actData.length / 6)}/>
                  <YAxis tick={{ fill: axisLblColor, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={fmt}/>
                  <Tooltip content={<CustomTooltip isDark={isDark}/>}/>
                  <Legend iconType="circle" iconSize={8}
                    formatter={(v) => <span style={{ fontSize: 11, color: axisLblColor }}>{v}</span>}/>
                  <Line type="monotone" dataKey="Calls"      stroke="#22c55e" strokeWidth={2} dot={false}/>
                  <Line type="monotone" dataKey="Website"    stroke="#8b5cf6" strokeWidth={2} dot={false}/>
                  <Line type="monotone" dataKey="Directions" stroke="#f97316" strokeWidth={2} dot={false}/>
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* ── IMPRESSION SOURCE PIE + BREAKDOWN ── */}
            {pieData.length > 0 && (
              <ChartCard title="Impression Sources" subtitle="Where customers found you" isDark={isDark}>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70}
                          paddingAngle={3} dataKey="value" labelLine={false} label={<PieLabel isDark={isDark}/>}>
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip isDark={isDark}/>}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {pieData.map((d, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0"
                          style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}/>
                        <div>
                          <p className={`text-[10px] font-semibold leading-tight ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                            {d.name}
                          </p>
                          <p className={`text-[11px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                            {fmt(d.value)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* icon grid breakdown */}
                <div className={`grid grid-cols-2 gap-2 mt-3 pt-3 border-t ${isDark ? "border-white/[0.05]" : "border-slate-100"}`}>
                  {[
                    { label: "Desktop Maps",   icon: <Monitor size={11}/>,    color: "#3b82f6", val: data.charts.impressionBreakdown.desktopMaps },
                    { label: "Desktop Search", icon: <Search size={11}/>,     color: "#6366f1", val: data.charts.impressionBreakdown.desktopSearch },
                    { label: "Mobile Maps",    icon: <Smartphone size={11}/>, color: "#06b6d4", val: data.charts.impressionBreakdown.mobileMaps },
                    { label: "Mobile Search",  icon: <Search size={11}/>,     color: "#8b5cf6", val: data.charts.impressionBreakdown.mobileSearch },
                  ].map((row, i) => (
                    <div key={i} className={`flex items-center gap-2 p-2.5 rounded-xl ${isDark ? "bg-white/[0.03]" : "bg-slate-50"}`}>
                      <span className="p-1.5 rounded-lg" style={{ background: `${row.color}20`, color: row.color }}>
                        {row.icon}
                      </span>
                      <div>
                        <p className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>{row.label}</p>
                        <p className={`text-[13px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{fmt(row.val)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ChartCard>
            )}

            {/* ── REVIEWS BREAKDOWN ── */}
            <ChartCard title="Review Analysis" subtitle={`${s.totalReviews} total · ${s.avgRating}★ avg`} isDark={isDark}>
              {/* rating ring visual */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-20 h-20 shrink-0">
                  <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                    <circle cx="40" cy="40" r="32" fill="none"
                      stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} strokeWidth="8"/>
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#f59e0b" strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(s.avgRating / 5) * 201} 201`}/>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-[18px] font-black leading-none ${isDark ? "text-white" : "text-slate-900"}`}
                      style={{ letterSpacing: "-0.04em" }}>{s.avgRating}</span>
                    <span className={`text-[9px] font-semibold ${isDark ? "text-slate-500" : "text-slate-400"}`}>/ 5.0</span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
                  {[5,4,3,2,1].map(n => (
                    <StarRow key={n} rating={n}
                      count={data.charts.ratingDistribution[n] ?? 0}
                      max={ratingMax} isDark={isDark}/>
                  ))}
                </div>
              </div>

              {/* reply rate */}
              <div className={`flex items-center justify-between p-3 rounded-xl mb-4 ${isDark ? "bg-white/[0.04]" : "bg-slate-50"}`}>
                <div className="flex items-center gap-2">
                  <MessageSquare size={13} className="text-cyan-500"/>
                  <span className={`text-[12px] font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>Reply Rate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-24 h-2 rounded-full overflow-hidden ${isDark ? "bg-white/[0.07]" : "bg-slate-200"}`}>
                    <div className="h-full rounded-full bg-cyan-500 transition-all duration-700"
                      style={{ width: `${s.replyRate}%` }}/>
                  </div>
                  <span className={`text-[12px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{s.replyRate}%</span>
                </div>
              </div>

              {/* recent reviews */}
              {data.recentReviews.length > 0 && (
                <>
                  <p className={`text-[11px] font-bold uppercase tracking-wide mb-2.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    Recent Reviews
                  </p>
                  <div className="flex flex-col gap-2.5">
                    {data.recentReviews.map((r, i) => (
                      <ReviewCard key={i} review={r} isDark={isDark}/>
                    ))}
                  </div>
                </>
              )}
            </ChartCard>

            {/* ── ENGAGEMENT SUMMARY CARD ── */}
            <ChartCard title="Engagement Summary" subtitle="Total actions this period" isDark={isDark}>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Phone Calls",          value: s.totalCalls,           icon: <Phone size={14}/>,         color: "#22c55e", pctOf: s.totalImpressions },
                  { label: "Website Visits",        value: s.totalWebsite,         icon: <Globe size={14}/>,         color: "#8b5cf6", pctOf: s.totalImpressions },
                  { label: "Direction Requests",    value: s.totalDirections,      icon: <Navigation size={14}/>,    color: "#f97316", pctOf: s.totalImpressions },
                  { label: "Conversations",         value: s.totalConversations,   icon: <MessageSquare size={14}/>, color: "#06b6d4", pctOf: s.totalImpressions },
                ].map((row, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl
                    ${isDark ? "bg-white/[0.03] hover:bg-white/[0.05]" : "bg-slate-50 hover:bg-slate-100"} transition-colors`}>
                    <span className="p-2 rounded-xl" style={{ background: `${row.color}18`, color: row.color }}>
                      {row.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[12px] font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                          {row.label}
                        </span>
                        <span className={`text-[12px] font-black ${isDark ? "text-white" : "text-slate-900"}`}>
                          {fmt(row.value)}
                        </span>
                      </div>
                      <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-white/[0.07]" : "bg-slate-200"}`}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: pct(row.value, row.pctOf), background: row.color }}/>
                      </div>
                      <p className={`text-[10px] mt-0.5 ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                        {pct(row.value, row.pctOf)} of impressions
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>

            {/* ── POSTS STAT ── */}
            {s.totalPosts > 0 && (
              <div className={`flex items-center justify-between p-4 rounded-2xl border
                ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05] shadow-sm"}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                    ${isDark ? "bg-blue-500/15" : "bg-blue-50"}`}>
                    <FileText size={16} className={isDark ? "text-blue-400" : "text-blue-500"}/>
                  </div>
                  <div>
                    <p className={`text-[13px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                      Active Posts
                    </p>
                    <p className={`text-[11px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                      Published on Google Business
                    </p>
                  </div>
                </div>
                <span className={`text-[22px] font-black ${isDark ? "text-white" : "text-slate-900"}`}
                  style={{ letterSpacing: "-0.04em" }}>{s.totalPosts}</span>
              </div>
            )}

            {/* footer note */}
            <p className={`text-[10.5px] text-center leading-relaxed ${isDark ? "text-slate-700" : "text-slate-400"}`}>
              Data sourced from Google Business Profile Performance API.
              Insights may have a 24–48 hour delay.
            </p>

          </div>
        )}
      </div>
    </div>
  );
}