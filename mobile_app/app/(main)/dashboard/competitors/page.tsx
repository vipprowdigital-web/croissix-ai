// mobile_app\app\(main)\dashboard\competitors\page.tsx

// mobile_app/app/(main)/dashboard/competitors/page.tsx
//
// Competitor Analysis — full page with embedded detail drawer
// Tabs: Overview | My Stats | Keywords | Competitors | Reviews
// Detail: tap any competitor → full side-by-side drilldown
//
// API: GET /api/google/competitor-analysis?locationId=&radius=

"use client";

import { useState, useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/features/user/hook/useUser";
import {
  MapPin, Star, MessageSquare, Globe, Phone,
  TrendingUp, TrendingDown, ChevronDown, ChevronUp, ChevronLeft,
  Trophy, Zap, Brain, Sparkles, RefreshCw,
  ArrowUpRight, Navigation, BarChart2,
  CheckCircle2, AlertCircle, Award, Activity,
  Search, FileText, Eye, Clock, X,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
interface BizEntry {
  placeId: string; name: string; address: string;
  rating: number; reviewCount: number; isOpen: boolean | null;
  photoRef: string | null; distance: number; compositeScore: number;
  rank: number; isOwn: boolean; lat: number; lng: number;
  primaryType: string; priceLevel: number | null;
  website: string | null; phone: string | null; hasHours: boolean;
  postsLast30d: number; totalPosts: number;
  postTypes: { standard: number; offer: number; event: number };
}
interface OwnPerf {
  impressions30d: number; impressionsMaps: number; impressionsSearch: number;
  calls30d: number; websiteClicks30d: number; directions30d: number;
  replyRate: number; ratingDistribution: Record<number, number>;
  recentReviews: { author: string; rating: number; comment: string; date: string; replied: boolean }[];
  topKeywords: { keyword: string; impressions: number }[];
}
interface CAData {
  success: boolean; own: BizEntry; ownPerf: OwnPerf;
  competitors: BizEntry[]; all: BizEntry[];
  meta: {
    searchRadius: number; totalFound: number; ownRank: number;
    ratingGap: number; reviewGap: number; scoreGap: number;
    locationName: string; category: string; searchedAt: string; hasPlacesKey: boolean;
  };
}

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
const rankColor = (r: number) => r === 1 ? "#f59e0b" : r === 2 ? "#94a3b8" : r === 3 ? "#f97316" : "#3b82f6";
const rankBg    = (r: number, d: boolean) => {
  const c = rankColor(r);
  return d ? `${c}12` : `${c}0d`;
};
const fmtDist   = (m: number) => m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
const photoUrl  = (ref: string, key: string) => `https://maps.googleapis.com/maps/api/place/photo?maxwidth=160&photo_reference=${ref}&key=${key}`;
const priceDots = (l: number | null) => l === null ? "" : "₹".repeat(l + 1);

/* ══════════════════════════════════════════════════════════
   STARS
══════════════════════════════════════════════════════════ */
function Stars({ r, sz = 11 }: { r: number; sz?: number }) {
  return (
    <span className="flex gap-0.5 items-center">
      {[0,1,2,3,4].map(i => {
        const f = Math.min(1, Math.max(0, r - i));
        const id = `s${i}${Math.round(r*10)}`;
        return (
          <svg key={i} width={sz} height={sz} viewBox="0 0 10 10">
            <defs><linearGradient id={id}>
              <stop offset={`${f*100}%`} stopColor="#f59e0b"/>
              <stop offset={`${f*100}%`} stopColor="#475569"/>
            </linearGradient></defs>
            <polygon points="5,0.5 6.5,4 10,4 7.2,6.3 8.1,9.8 5,7.8 1.9,9.8 2.8,6.3 0,4 3.5,4" fill={`url(#${id})`}/>
          </svg>
        );
      })}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════
   RANK BADGE
══════════════════════════════════════════════════════════ */
function RankBadge({ rank, lg }: { rank: number; lg?: boolean }) {
  const c = rankColor(rank);
  return (
    <div className={`flex items-center gap-1 font-black rounded-full shrink-0 ${lg ? "px-3 py-1.5 text-[13px]" : "px-2 py-0.5 text-[10px]"}`}
      style={{ background: `${c}18`, color: c, border: `1px solid ${c}30` }}>
      {rank <= 3 && <Trophy size={lg ? 13 : 9}/>}#{rank}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PROGRESS BAR
══════════════════════════════════════════════════════════ */
function Bar({ val, max, color, h = 2 }: { val: number; max: number; color: string; h?: number }) {
  const pct = max > 0 ? Math.min(100, (val / max) * 100) : 0;
  return (
    <div className="w-full rounded-full overflow-hidden bg-white/[0.07]" style={{ height: h }}>
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}50` }}/>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   STAT CHIP
══════════════════════════════════════════════════════════ */
function Chip({ label, value, color, dark }: { label: string; value: string; color: string; dark: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl border ${dark ? "bg-white/[0.03] border-white/[0.06]" : "bg-white border-slate-100 shadow-sm"}`}>
      <span className="text-[17px] font-black leading-none" style={{ color }}>{value}</span>
      <span className={`text-[9px] font-bold ${dark ? "text-slate-600" : "text-slate-400"}`}>{label}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   DETAIL DRAWER — full competitor drilldown
══════════════════════════════════════════════════════════ */
function DetailDrawer({
  biz, own, ownPerf, dark, apiKey, onClose,
}: { biz: BizEntry; own: BizEntry; ownPerf: OwnPerf; dark: boolean; apiKey: string; onClose: () => void }) {
  const color     = rankColor(biz.rank);
  const ratingDiff  = parseFloat((biz.rating   - own.rating).toFixed(1));
  const reviewDiff  = biz.reviewCount - own.reviewCount;
  const scoreDiff   = Math.round(biz.compositeScore - own.compositeScore);
  const isAhead     = biz.compositeScore > own.compositeScore;

  const metrics = [
    { label: "Rating",    own: own.rating,        them: biz.rating,        max: 5,    fmt: (v: number) => `${v.toFixed(1)}★`, color: "#f59e0b" },
    { label: "Reviews",   own: own.reviewCount,   them: biz.reviewCount,   max: Math.max(own.reviewCount, biz.reviewCount, 1), fmt: (v: number) => String(v), color: "#3b82f6" },
    { label: "Score",     own: own.compositeScore, them: biz.compositeScore, max: 100, fmt: (v: number) => String(Math.round(v)), color: "#22c55e" },
    { label: "Posts/mo",  own: own.postsLast30d,  them: 0,                 max: Math.max(own.postsLast30d, 4, 1), fmt: (v: number) => String(v), color: "#a78bfa" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}>
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>

      {/* panel */}
      <div
        className={`absolute bottom-0 left-0 right-0 rounded-t-3xl overflow-y-auto max-h-[92vh] ${dark ? "bg-[#070f1f]" : "bg-white"}`}
        style={{ maxWidth: 500, margin: "0 auto", boxShadow: "0 -20px 80px rgba(0,0,0,0.5)" }}
      >
        {/* drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className={`w-10 h-1 rounded-full ${dark ? "bg-white/20" : "bg-slate-200"}`}/>
        </div>

        {/* header */}
        <div className="px-5 pt-2 pb-4">
          <div className="flex items-start gap-3">
            {/* avatar */}
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center text-white font-black text-2xl"
                style={{ background: `${color}25`, border: `2px solid ${color}40` }}>
                {biz.photoRef && apiKey
                  ? <img src={photoUrl(biz.photoRef, apiKey)} alt="" className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}/>
                  : biz.name[0]?.toUpperCase()}
              </div>
              <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black border-2"
                style={{ background: color, color: "#fff", borderColor: dark ? "#070f1f" : "#fff" }}>
                {biz.rank}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[16px] font-black leading-tight ${dark ? "text-white" : "text-slate-900"}`} style={{ letterSpacing: "-0.03em" }}>
                {biz.name}
              </p>
              <p className={`text-[11px] mt-0.5 ${dark ? "text-slate-500" : "text-slate-400"}`}>
                {biz.address.split(",")[0]}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <RankBadge rank={biz.rank}/>
                {biz.isOpen !== null && (
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${biz.isOpen ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                    {biz.isOpen ? "Open now" : "Closed"}
                  </span>
                )}
                {biz.priceLevel !== null && (
                  <span className={`text-[10px] font-bold ${dark ? "text-slate-500" : "text-slate-400"}`}>{priceDots(biz.priceLevel)}</span>
                )}
                {isAhead
                  ? <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-red-500/12 text-red-400">Ahead of you</span>
                  : <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/12 text-emerald-400">You're ahead</span>}
              </div>
            </div>
            <button onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${dark ? "bg-white/[0.08]" : "bg-slate-100"}`}>
              <X size={14} className={dark ? "text-slate-400" : "text-slate-600"}/>
            </button>
          </div>
        </div>

        {/* divider */}
        <div className="h-px mx-5" style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}/>

        <div className="px-5 py-4 flex flex-col gap-5">

          {/* Key numbers row */}
          <div className="grid grid-cols-3 gap-2">
            <Chip label="Rating"  value={biz.rating > 0 ? `${biz.rating.toFixed(1)}★` : "—"} color={rankColor(biz.rank)} dark={dark}/>
            <Chip label="Reviews" value={biz.reviewCount.toLocaleString()} color="#3b82f6" dark={dark}/>
            <Chip label="Score"   value={`${Math.round(biz.compositeScore)}/100`} color="#22c55e" dark={dark}/>
          </div>

          {/* head-to-head comparison bars */}
          <div className={`rounded-2xl border overflow-hidden ${dark ? "bg-white/[0.03] border-white/[0.06]" : "bg-slate-50 border-slate-200/60"}`}>
            <div className={`px-4 py-2.5 flex items-center gap-2 border-b ${dark ? "border-white/[0.04]" : "border-slate-200/40"}`}>
              <BarChart2 size={12} className="text-amber-400"/>
              <p className={`text-[12px] font-black ${dark ? "text-white" : "text-slate-900"}`}>Head-to-Head</p>
              <span className={`ml-auto text-[9.5px] font-bold ${dark ? "text-slate-600" : "text-slate-400"}`}>You vs {biz.name.split(" ")[0]}</span>
            </div>
            <div className="p-4 flex flex-col gap-3.5">
              {metrics.map((m, i) => {
                const diff = m.own - m.them;
                const winning = diff >= 0;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10.5px] font-bold ${dark ? "text-slate-400" : "text-slate-600"}`}>{m.label}</span>
                      <div className="flex items-center gap-1.5">
                        {winning ? <TrendingUp size={9} className="text-emerald-400"/> : <TrendingDown size={9} className="text-red-400"/>}
                        <span className={`text-[10px] font-black ${winning ? "text-emerald-400" : "text-red-400"}`}>
                          {winning ? "+" : ""}{typeof diff === "number" && m.label === "Rating" ? diff.toFixed(1) + "★" : Math.round(diff)}
                        </span>
                      </div>
                    </div>
                    {/* you */}
                    <div className="mb-1">
                      <div className="flex justify-between mb-0.5">
                        <span className="text-[9px] font-bold text-blue-400">You</span>
                        <span className={`text-[9px] font-black ${dark ? "text-white" : "text-slate-900"}`}>{m.fmt(m.own)}</span>
                      </div>
                      <Bar val={m.own} max={m.max} color="#3b82f6" h={5}/>
                    </div>
                    {/* them */}
                    <div>
                      <div className="flex justify-between mb-0.5">
                        <span className={`text-[9px] font-bold truncate max-w-[110px] ${dark ? "text-slate-500" : "text-slate-400"}`}>
                          {biz.name.length > 14 ? biz.name.slice(0, 13) + "…" : biz.name}
                        </span>
                        <span className={`text-[9px] font-black ${dark ? "text-slate-300" : "text-slate-700"}`}>{m.fmt(m.them)}</span>
                      </div>
                      <Bar val={m.them} max={m.max} color={m.color} h={5}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* score breakdown */}
          <div className={`rounded-2xl border p-4 ${dark ? "bg-white/[0.02] border-white/[0.06]" : "bg-slate-50 border-slate-200/60"}`}>
            <p className={`text-[11px] font-black mb-3 ${dark ? "text-white" : "text-slate-900"}`}>Composite Score Breakdown</p>
            {[
              { label: "Rating (40pts)",     score: Math.round((biz.rating / 5) * 40),   max: 40, color: "#f59e0b" },
              { label: "Reviews (35pts)",    score: Math.min(35, Math.round((Math.log(biz.reviewCount + 1) / Math.log(500)) * 35)), max: 35, color: "#3b82f6" },
              { label: "Profile (25pts)",    score: (biz.website ? 8 : 0) + (biz.phone ? 7 : 0) + (biz.hasHours ? 6 : 0), max: 25, color: "#22c55e" },
            ].map((s, i) => (
              <div key={i} className="mb-2.5 last:mb-0">
                <div className="flex justify-between mb-1">
                  <span className={`text-[10px] font-bold ${dark ? "text-slate-400" : "text-slate-600"}`}>{s.label}</span>
                  <span className="text-[10px] font-black" style={{ color: s.color }}>{s.score}/{s.max}</span>
                </div>
                <Bar val={s.score} max={s.max} color={s.color} h={4}/>
              </div>
            ))}
          </div>

          {/* profile flags */}
          <div className={`rounded-2xl border p-4 ${dark ? "bg-white/[0.02] border-white/[0.06]" : "bg-white border-slate-200/60"}`}>
            <p className={`text-[11px] font-black mb-3 ${dark ? "text-white" : "text-slate-900"}`}>Profile Completeness</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Website",      has: !!biz.website },
                { label: "Phone",        has: !!biz.phone },
                { label: "Hours Set",    has: biz.hasHours },
                { label: "Reviews > 10", has: biz.reviewCount >= 10 },
                { label: "Rating ≥ 4.0", has: biz.rating >= 4.0 },
                { label: "Rating ≥ 4.5", has: biz.rating >= 4.5 },
              ].map((f, i) => (
                <div key={i} className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border ${dark ? "bg-white/[0.03] border-white/[0.05]" : "bg-slate-50 border-slate-100"}`}>
                  <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 ${f.has ? "bg-emerald-500/15" : "bg-red-500/15"}`}>
                    {f.has
                      ? <CheckCircle2 size={11} className="text-emerald-400"/>
                      : <X size={9} className="text-red-400"/>}
                  </div>
                  <span className={`text-[10px] font-semibold ${dark ? "text-slate-300" : "text-slate-700"}`}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* distance + map link */}
          <div className={`rounded-2xl border p-3 flex items-center gap-3 ${dark ? "bg-white/[0.02] border-white/[0.06]" : "bg-slate-50 border-slate-200/60"}`}>
            <Navigation size={14} className="text-blue-400 shrink-0"/>
            <div className="flex-1 min-w-0">
              <p className={`text-[11px] font-bold ${dark ? "text-white" : "text-slate-900"}`}>{fmtDist(biz.distance)} from you</p>
              <p className={`text-[9.5px] truncate ${dark ? "text-slate-500" : "text-slate-400"}`}>{biz.address}</p>
            </div>
          </div>

          {/* action buttons */}
          <div className="grid grid-cols-3 gap-2 pb-2">
            {biz.website && (
              <a href={biz.website} target="_blank" rel="noopener noreferrer"
                className={`flex flex-col items-center gap-1 py-3 rounded-2xl border transition-all active:scale-95 ${dark ? "bg-white/[0.04] border-white/[0.07] text-blue-400" : "bg-blue-50 border-blue-200/60 text-blue-600"}`}>
                <Globe size={14}/><span className="text-[9.5px] font-bold">Website</span>
              </a>
            )}
            {biz.phone && (
              <a href={`tel:${biz.phone}`}
                className={`flex flex-col items-center gap-1 py-3 rounded-2xl border transition-all active:scale-95 ${dark ? "bg-white/[0.04] border-white/[0.07] text-emerald-400" : "bg-emerald-50 border-emerald-200/60 text-emerald-600"}`}>
                <Phone size={14}/><span className="text-[9.5px] font-bold">Call</span>
              </a>
            )}
            <a href={`https://www.google.com/maps/place/?q=place_id:${biz.placeId}`} target="_blank" rel="noopener noreferrer"
              className={`flex flex-col items-center gap-1 py-3 rounded-2xl border transition-all active:scale-95 ${dark ? "bg-white/[0.04] border-white/[0.07] text-slate-400" : "bg-slate-50 border-slate-200/60 text-slate-600"}`}>
              <MapPin size={14}/><span className="text-[9.5px] font-bold">Maps</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB: OVERVIEW
══════════════════════════════════════════════════════════ */
function TabOverview({ data, dark }: { data: CAData; dark: boolean }) {
  const { own, ownPerf, meta, all } = data;
  const top1    = all[0];
  const isFirst = own.rank === 1;
  const gapAbs  = Math.abs(meta.ratingGap);

  // Insights
  const insights: { icon: React.ReactNode; color: string; title: string; text: string; tag: string }[] = [];
  if (isFirst) {
    insights.push({ icon: <Trophy size={12}/>, color: "#f59e0b", tag: "Leader",
      title: "You're #1 in your area",
      text: `You outrank all ${meta.totalFound - 1} nearby competitors. Keep posting weekly and replying to reviews within 48 hours to hold your spot.` });
  } else {
    insights.push({ icon: <TrendingUp size={12}/>, color: "#3b82f6", tag: "Gap",
      title: `${gapAbs.toFixed(1)}★ behind #1`,
      text: `${top1.name} leads at ${top1.rating.toFixed(1)}★ with ${top1.reviewCount} reviews. Each 0.1★ gain increases CTR by ~3.5%.` });
    if (meta.ratingGap < -0.3) {
      const need = Math.max(5, Math.ceil((top1.rating * top1.reviewCount - own.rating * own.reviewCount) / (5 - own.rating)));
      insights.push({ icon: <Zap size={12}/>, color: "#fb923c", tag: "Action",
        title: `${need} × 5★ reviews needed`,
        text: `Getting ${need} new 5-star reviews would push your rating past ${top1.name}'s current ${top1.rating.toFixed(1)}★.` });
    }
  }
  const noWebCount = all.filter(c => !c.isOwn && !c.website).length;
  if (noWebCount > 0 && own.website) {
    insights.push({ icon: <Globe size={12}/>, color: "#a78bfa", tag: "Advantage",
      title: `Website advantage over ${noWebCount} rival${noWebCount > 1 ? "s" : ""}`,
      text: `${noWebCount} competitor${noWebCount > 1 ? "s have" : " has"} no website, giving you an extra conversion point they lack.` });
  }
  if (ownPerf.impressions30d > 0) {
    const ctr = ownPerf.impressions30d > 0 ? ((ownPerf.calls30d + ownPerf.websiteClicks30d) / ownPerf.impressions30d * 100).toFixed(1) : "0";
    insights.push({ icon: <Eye size={12}/>, color: "#22c55e", tag: "Visibility",
      title: `${ownPerf.impressions30d.toLocaleString()} impressions this month`,
      text: `You appeared in ${ownPerf.impressions30d.toLocaleString()} searches. CTR: ${ctr}% — industry avg is 2–4%.` });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* rank hero */}
      <div className={`rounded-3xl border overflow-hidden ${dark ? "bg-[#070f1f] border-blue-900/50" : "bg-white border-blue-100 shadow-sm"}`}
        style={{ boxShadow: dark ? "0 20px 80px rgba(59,130,246,0.12)" : "0 8px 40px rgba(59,130,246,0.08)" }}>
        <div className="h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(59,130,246,0.6),transparent)" }}/>
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${dark ? "text-slate-500" : "text-slate-400"}`}>Your Position</p>
              <div className="flex items-baseline gap-2">
                <span className="text-[56px] font-black leading-none" style={{ color: rankColor(own.rank), letterSpacing: "-0.06em" }}>
                  #{own.rank}
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className={`text-[13px] font-bold ${dark ? "text-slate-300" : "text-slate-700"}`}>in your area</span>
                  <span className={`text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>out of {meta.totalFound}</span>
                </div>
              </div>
            </div>
            {isFirst ? (
              <div className="flex flex-col items-center px-3 py-2.5 rounded-2xl border"
                style={{ background: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.25)" }}>
                <Trophy size={22} className="text-amber-400 mb-1"/>
                <span className="text-[11px] font-black text-amber-400">#1 Leader</span>
              </div>
            ) : (
              <div className="flex flex-col items-center px-3 py-2.5 rounded-2xl border"
                style={{ background: "rgba(248,113,113,0.08)", borderColor: "rgba(248,113,113,0.2)" }}>
                <span className={`text-[10px] font-bold text-red-400 mb-0.5`}>Behind #1</span>
                <span className="text-[24px] font-black text-red-400 leading-none" style={{ letterSpacing: "-0.04em" }}>{gapAbs.toFixed(1)}★</span>
                <span className="text-[9px] text-red-400/60">{Math.abs(meta.reviewGap)} reviews</span>
              </div>
            )}
          </div>

          {/* podium */}
          <div className={`rounded-2xl border p-3 ${dark ? "bg-blue-950/30 border-blue-900/30" : "bg-blue-50/60 border-blue-100"}`}>
            <p className={`text-[9.5px] font-black uppercase tracking-widest mb-3 ${dark ? "text-slate-600" : "text-slate-400"}`}>Local Ranking Podium</p>
            <div className="flex items-end justify-center gap-2">
              {[{ rank: 2, h: 52 }, { rank: 1, h: 72 }, { rank: 3, h: 38 }].map(({ rank, h }) => {
                const biz = all.find(c => c.rank === rank);
                const c   = rankColor(rank);
                const me  = biz?.isOwn ?? false;
                return (
                  <div key={rank} className="flex flex-col items-center gap-1 flex-1">
                    {me && <div className="text-[8px] font-black px-1.5 py-0.5 rounded-full" style={{ background: `${c}20`, color: c, border: `1px solid ${c}40` }}>YOU</div>}
                    <div className="w-full rounded-t-xl flex items-end justify-center pb-1"
                      style={{ height: h, background: me ? c : `${c}45`, boxShadow: me ? `0 0 16px ${c}50` : "none" }}>
                      <span className="text-[8px] font-black" style={{ color: me ? "#fff" : c }}>#{rank}</span>
                    </div>
                    <p className={`text-[8px] text-center truncate w-full ${dark ? "text-slate-600" : "text-slate-400"}`}>
                      {biz ? (biz.name.length > 10 ? biz.name.slice(0, 9) + "…" : biz.name) : "—"}
                    </p>
                    <div className="flex items-center gap-0.5">
                      <Star size={7} className="text-amber-400 fill-amber-400"/>
                      <span className={`text-[8px] font-bold ${dark ? "text-slate-400" : "text-slate-600"}`}>{biz?.rating.toFixed(1) ?? "—"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* stat row */}
        <div className={`border-t grid grid-cols-4 ${dark ? "border-blue-900/30" : "border-blue-100/60"}`}>
          {[
            { label: "Rating",   value: own.rating > 0 ? `${own.rating.toFixed(1)}★` : "—", color: "#f59e0b" },
            { label: "Reviews",  value: own.reviewCount > 0 ? own.reviewCount.toLocaleString() : "—", color: "#3b82f6" },
            { label: "Posts/mo", value: own.postsLast30d > 0 ? String(own.postsLast30d) : "0", color: "#a78bfa" },
            { label: "Score",    value: `${Math.round(own.compositeScore)}`, color: "#22c55e" },
          ].map((s, i) => (
            <div key={i} className={`flex flex-col items-center py-3 gap-0.5 border-r last:border-r-0 ${dark ? "border-blue-900/30" : "border-blue-100/60"}`}>
              <span className="text-[17px] font-black leading-none" style={{ color: s.color }}>{s.value}</span>
              <span className={`text-[8.5px] font-bold ${dark ? "text-slate-600" : "text-slate-400"}`}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* you vs #1 bars — only when not first */}
      {!isFirst && top1 && (
        <div className={`rounded-2xl border overflow-hidden ${dark ? "bg-[#080f1e] border-blue-900/40" : "bg-white border-blue-100 shadow-sm"}`}>
          <div className={`px-4 py-3 flex items-center gap-2 border-b ${dark ? "border-blue-900/30" : "border-slate-100"}`}>
            <BarChart2 size={12} className="text-amber-400"/>
            <p className={`text-[13px] font-black ${dark ? "text-white" : "text-slate-900"}`}>You vs #1: {top1.name.split(" ")[0]}</p>
          </div>
          <div className="p-4 flex flex-col gap-4">
            {[
              { label: "Rating",    ownV: own.rating,        themV: top1.rating,        max: 5,    fmt: (v: number) => `${v.toFixed(1)}★`, color: "#f59e0b" },
              { label: "Reviews",   ownV: own.reviewCount,   themV: top1.reviewCount,   max: Math.max(own.reviewCount, top1.reviewCount, 1), fmt: (v: number) => v.toLocaleString(), color: "#3b82f6" },
              { label: "Score",     ownV: own.compositeScore, themV: top1.compositeScore, max: 100, fmt: (v: number) => `${Math.round(v)}`, color: "#22c55e" },
              { label: "Posts/mo",  ownV: own.postsLast30d,  themV: 0,                  max: Math.max(own.postsLast30d, 4, 1), fmt: (v: number) => String(v), color: "#a78bfa" },
            ].map((m, i) => {
              const diff = m.ownV - m.themV;
              const win  = diff >= 0;
              return (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`text-[10.5px] font-bold ${dark ? "text-slate-400" : "text-slate-600"}`}>{m.label}</span>
                    <div className="flex items-center gap-1.5">
                      {win ? <TrendingUp size={9} className="text-emerald-400"/> : <TrendingDown size={9} className="text-red-400"/>}
                      <span className={`text-[9.5px] font-black ${win ? "text-emerald-400" : "text-red-400"}`}>
                        {win ? "+" : ""}{m.label === "Rating" ? diff.toFixed(1) + "★" : Math.round(diff)}
                      </span>
                    </div>
                  </div>
                  <div className="mb-1">
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[9px] font-bold text-blue-400">You</span>
                      <span className={`text-[9px] font-black ${dark ? "text-white" : "text-slate-900"}`}>{m.fmt(m.ownV)}</span>
                    </div>
                    <Bar val={m.ownV} max={m.max} color="#3b82f6" h={5}/>
                  </div>
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className={`text-[9px] truncate max-w-[120px] ${dark ? "text-slate-500" : "text-slate-400"}`}>{top1.name.length > 14 ? top1.name.slice(0,13)+"…" : top1.name}</span>
                      <span className={`text-[9px] font-black ${dark ? "text-slate-300" : "text-slate-700"}`}>{m.fmt(m.themV)}</span>
                    </div>
                    <Bar val={m.themV} max={m.max} color={m.color} h={5}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI insights */}
      <div className={`rounded-2xl border overflow-hidden ${dark ? "bg-[#080f1e] border-blue-900/40" : "bg-white border-blue-100 shadow-sm"}`}>
        <div className={`px-4 py-3 flex items-center gap-2 border-b ${dark ? "border-blue-900/30" : "border-slate-100"}`}>
          <Brain size={12} style={{ color: "#60a5fa" }}/>
          <p className={`text-[13px] font-black ${dark ? "text-white" : "text-slate-900"}`}>AI Competitive Insights</p>
          <div className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"/>
            <span className="text-[9px] font-black text-blue-400">Live</span>
          </div>
        </div>
        <div className="p-3 flex flex-col gap-2">
          {insights.slice(0, 4).map((ins, i) => (
            <div key={i} className={`flex items-start gap-2.5 p-3 rounded-xl border ${dark ? "bg-white/[0.02] border-white/[0.04]" : "bg-slate-50/70 border-slate-100"}`}>
              <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${ins.color}15`, color: ins.color }}>{ins.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <p className={`text-[11.5px] font-bold ${dark ? "text-white" : "text-slate-900"}`}>{ins.title}</p>
                  <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ background: `${ins.color}15`, color: ins.color }}>{ins.tag}</span>
                </div>
                <p className={`text-[10.5px] leading-relaxed ${dark ? "text-slate-400" : "text-slate-600"}`}>{ins.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB: MY STATS
══════════════════════════════════════════════════════════ */
function TabMyStats({ data, dark }: { data: CAData; dark: boolean }) {
  const { own, ownPerf } = data;
  const maxImp = Math.max(ownPerf.impressionsMaps, ownPerf.impressionsSearch, 1);

  const perfCards = [
    { label: "Impressions",   value: ownPerf.impressions30d.toLocaleString(),  sub: "last 30 days",  color: "#3b82f6",  icon: <Eye size={13}/> },
    { label: "Calls",         value: ownPerf.calls30d.toLocaleString(),        sub: "click-to-call", color: "#22c55e",  icon: <Phone size={13}/> },
    { label: "Website Clicks",value: ownPerf.websiteClicks30d.toLocaleString(),sub: "last 30 days",  color: "#a78bfa",  icon: <Globe size={13}/> },
    { label: "Directions",    value: ownPerf.directions30d.toLocaleString(),   sub: "requested",     color: "#f59e0b",  icon: <Navigation size={13}/> },
    { label: "Reply Rate",    value: `${ownPerf.replyRate}%`,                  sub: "reviews answered", color: "#fb923c", icon: <MessageSquare size={13}/> },
    { label: "Posts/30d",     value: String(own.postsLast30d),                 sub: `${own.totalPosts} total posts`,    color: "#60a5fa",  icon: <FileText size={13}/> },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* perf grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {perfCards.map((c, i) => (
          <div key={i} className={`rounded-2xl border p-3.5 ${dark ? "bg-white/[0.03] border-white/[0.06]" : "bg-white border-slate-100 shadow-sm"}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: `${c.color}15`, color: c.color }}>{c.icon}</div>
              <span className={`text-[10px] font-bold ${dark ? "text-slate-400" : "text-slate-600"}`}>{c.label}</span>
            </div>
            <p className="text-[22px] font-black leading-none" style={{ color: c.color, letterSpacing: "-0.03em" }}>{c.value}</p>
            <p className={`text-[9.5px] mt-0.5 ${dark ? "text-slate-600" : "text-slate-400"}`}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* impressions split */}
      <div className={`rounded-2xl border p-4 ${dark ? "bg-white/[0.03] border-white/[0.06]" : "bg-white border-slate-100 shadow-sm"}`}>
        <p className={`text-[12px] font-black mb-3 ${dark ? "text-white" : "text-slate-900"}`}>Impressions Breakdown</p>
        {[
          { label: "Google Maps", value: ownPerf.impressionsMaps,   color: "#3b82f6" },
          { label: "Google Search", value: ownPerf.impressionsSearch, color: "#6366f1" },
        ].map((s, i) => (
          <div key={i} className="mb-3 last:mb-0">
            <div className="flex justify-between mb-1.5">
              <span className={`text-[10px] font-bold ${dark ? "text-slate-400" : "text-slate-600"}`}>{s.label}</span>
              <span className={`text-[10px] font-black ${dark ? "text-white" : "text-slate-900"}`}>{s.value.toLocaleString()}</span>
            </div>
            <Bar val={s.value} max={maxImp} color={s.color} h={6}/>
          </div>
        ))}
      </div>

      {/* post types */}
      <div className={`rounded-2xl border p-4 ${dark ? "bg-white/[0.03] border-white/[0.06]" : "bg-white border-slate-100 shadow-sm"}`}>
        <p className={`text-[12px] font-black mb-3 ${dark ? "text-white" : "text-slate-900"}`}>Post Types</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Updates",  value: own.postTypes.standard, color: "#3b82f6" },
            { label: "Offers",   value: own.postTypes.offer,    color: "#22c55e" },
            { label: "Events",   value: own.postTypes.event,    color: "#f59e0b" },
          ].map((p, i) => (
            <div key={i} className={`flex flex-col items-center py-3 rounded-2xl border ${dark ? "bg-white/[0.03] border-white/[0.06]" : "bg-slate-50 border-slate-100"}`}>
              <span className="text-[22px] font-black leading-none" style={{ color: p.color }}>{p.value}</span>
              <span className={`text-[9px] mt-0.5 font-bold ${dark ? "text-slate-600" : "text-slate-400"}`}>{p.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* rating distribution */}
      <div className={`rounded-2xl border p-4 ${dark ? "bg-white/[0.03] border-white/[0.06]" : "bg-white border-slate-100 shadow-sm"}`}>
        <div className="flex items-center justify-between mb-3">
          <p className={`text-[12px] font-black ${dark ? "text-white" : "text-slate-900"}`}>Rating Distribution</p>
          <div className="flex items-center gap-1">
            <Star size={11} className="text-amber-400 fill-amber-400"/>
            <span className={`text-[12px] font-black ${dark ? "text-white" : "text-slate-900"}`}>{own.rating.toFixed(1)}</span>
          </div>
        </div>
        {[5,4,3,2,1].map(s => {
          const count  = ownPerf.ratingDistribution[s] ?? 0;
          const total  = Object.values(ownPerf.ratingDistribution).reduce((a, b) => a + b, 0);
          const pct    = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={s} className="flex items-center gap-2 mb-2 last:mb-0">
              <div className="flex items-center gap-0.5 w-8 shrink-0">
                <span className={`text-[10px] font-bold ${dark ? "text-slate-400" : "text-slate-600"}`}>{s}</span>
                <Star size={8} className="text-amber-400 fill-amber-400"/>
              </div>
              <div className="flex-1">
                <Bar val={pct} max={100} color={s >= 4 ? "#22c55e" : s === 3 ? "#f59e0b" : "#f87171"} h={5}/>
              </div>
              <span className={`text-[9px] font-black w-7 text-right ${dark ? "text-slate-500" : "text-slate-400"}`}>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB: KEYWORDS
══════════════════════════════════════════════════════════ */
function TabKeywords({ data, dark }: { data: CAData; dark: boolean }) {
  const { ownPerf, meta } = data;
  const keywords = ownPerf.topKeywords;
  const maxImp   = keywords.length > 0 ? keywords[0].impressions : 1;
  const colors   = ["#3b82f6","#6366f1","#8b5cf6","#a78bfa","#60a5fa","#38bdf8","#22c55e","#4ade80","#f59e0b","#fb923c"];

  return (
    <div className="flex flex-col gap-4">
      {keywords.length === 0 ? (
        <div className={`rounded-2xl border p-6 flex flex-col items-center text-center ${dark ? "bg-white/[0.03] border-white/[0.06]" : "bg-white border-slate-100"}`}>
          <Search size={28} className={`mb-3 ${dark ? "text-slate-600" : "text-slate-300"}`}/>
          <p className={`text-[13px] font-bold mb-1 ${dark ? "text-slate-400" : "text-slate-600"}`}>No keyword data available</p>
          <p className={`text-[11px] ${dark ? "text-slate-600" : "text-slate-400"}`}>
            The Search Keywords API requires at least one full calendar month of data. Check back later.
          </p>
        </div>
      ) : (
        <>
          <div className={`rounded-2xl border p-4 ${dark ? "bg-white/[0.03] border-white/[0.06]" : "bg-white border-slate-100 shadow-sm"}`}>
            <div className="flex items-center gap-2 mb-3">
              <Search size={12} className="text-blue-400"/>
              <p className={`text-[12px] font-black ${dark ? "text-white" : "text-slate-900"}`}>Top Search Keywords</p>
              <span className={`ml-auto text-[9.5px] font-bold ${dark ? "text-slate-600" : "text-slate-400"}`}>by impressions</span>
            </div>
            {keywords.map((kw, i) => (
              <div key={i} className="mb-3 last:mb-0">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-black shrink-0"
                      style={{ background: `${colors[i % colors.length]}20`, color: colors[i % colors.length] }}>
                      {i + 1}
                    </div>
                    <span className={`text-[11px] font-bold truncate ${dark ? "text-white" : "text-slate-900"}`}>{kw.keyword}</span>
                  </div>
                  <span className="text-[10px] font-black shrink-0 ml-2" style={{ color: colors[i % colors.length] }}>
                    {kw.impressions.toLocaleString()}
                  </span>
                </div>
                <Bar val={kw.impressions} max={maxImp} color={colors[i % colors.length]} h={4}/>
              </div>
            ))}
          </div>

          <div className={`rounded-2xl border p-4 ${dark ? "bg-blue-950/30 border-blue-900/30" : "bg-blue-50 border-blue-100"}`}>
            <div className="flex items-start gap-2.5">
              <Brain size={13} className="text-blue-400 shrink-0 mt-0.5"/>
              <div>
                <p className={`text-[11.5px] font-bold mb-1 ${dark ? "text-white" : "text-slate-900"}`}>Keyword Strategy</p>
                <p className={`text-[10.5px] leading-relaxed ${dark ? "text-blue-300/80" : "text-blue-700"}`}>
                  Your top keyword <span className="font-black">"{keywords[0]?.keyword}"</span> drives the most visibility.
                  Include these terms in your posts, description, and replies to strengthen your relevance score on Google Search.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB: COMPETITORS
══════════════════════════════════════════════════════════ */
function TabCompetitors({ data, dark, apiKey, onSelect }: {
  data: CAData; dark: boolean; apiKey: string; onSelect: (b: BizEntry) => void;
}) {
  const { all, own } = data;
  const [sort, setSort] = useState<"rank"|"rating"|"reviews"|"distance">("rank");

  const sorted = useMemo(() => {
    const list = [...all];
    if (sort === "rank")     list.sort((a, b) => a.rank - b.rank);
    if (sort === "rating")   list.sort((a, b) => b.rating - a.rating);
    if (sort === "reviews")  list.sort((a, b) => b.reviewCount - a.reviewCount);
    if (sort === "distance") list.sort((a, b) => a.distance - b.distance);
    return list;
  }, [all, sort]);

  return (
    <div>
      {/* sort */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {(["rank","rating","reviews","distance"] as const).map(s => (
          <button key={s} onClick={() => setSort(s)}
            className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border"
            style={sort === s
              ? { background: "rgba(59,130,246,0.12)", color: "#60a5fa", borderColor: "rgba(59,130,246,0.3)" }
              : { background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", color: dark ? "#475569" : "#94a3b8", borderColor: "transparent" }}>
            {s === "distance" ? "Nearest" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        {sorted.map(biz => {
          if (biz.isOwn) {
            /* own card */
            return (
              <div key={biz.placeId} className={`rounded-2xl border px-4 py-3.5 ${dark ? "bg-blue-500/[0.08] border-blue-700/40" : "bg-blue-50 border-blue-200/70"}`}
                style={{ boxShadow: "0 0 20px rgba(59,130,246,0.1)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-[18px] shrink-0"
                    style={{ background: "linear-gradient(135deg,#1e40af,#3b82f6)", boxShadow: "0 4px 14px rgba(59,130,246,0.35)" }}>
                    {biz.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`text-[12.5px] font-black truncate ${dark ? "text-white" : "text-slate-900"}`}>{biz.name}</p>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">YOU</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Stars r={biz.rating}/>
                      <span className={`text-[10px] font-black ${dark ? "text-white" : "text-slate-900"}`}>{biz.rating.toFixed(1)}</span>
                      <span className={`text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>{biz.reviewCount} reviews</span>
                    </div>
                  </div>
                  <RankBadge rank={biz.rank} lg/>
                </div>
              </div>
            );
          }

          /* competitor card */
          const c   = rankColor(biz.rank);
          const rdiff = parseFloat((biz.rating - own.rating).toFixed(1));
          const rvdiff = biz.reviewCount - own.reviewCount;
          return (
            <div key={biz.placeId}
              className={`rounded-2xl border overflow-hidden cursor-pointer transition-all active:scale-[0.99] ${dark ? "border-white/[0.06]" : "border-slate-200/60"}`}
              style={{ background: rankBg(biz.rank, dark) }}
              onClick={() => onSelect(biz)}>
              <div className="flex items-start gap-3 px-4 py-3.5">
                {/* avatar */}
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-2xl overflow-hidden flex items-center justify-center text-white font-black text-[18px]"
                    style={{ background: `${c}25`, border: `2px solid ${c}40` }}>
                    {biz.photoRef && apiKey
                      ? <img src={photoUrl(biz.photoRef, apiKey)} alt="" className="w-full h-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}/>
                      : biz.name[0]?.toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black border-2"
                    style={{ background: c, color: "#fff", borderColor: dark ? "#050d1a" : "#fff" }}>
                    {biz.rank}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="min-w-0">
                      <p className={`text-[12.5px] font-bold truncate ${dark ? "text-white" : "text-slate-900"}`}>{biz.name}</p>
                      <p className={`text-[9.5px] truncate mt-0.5 ${dark ? "text-slate-500" : "text-slate-400"}`}>
                        {fmtDist(biz.distance)} · {biz.address ? biz.address.split(",")[0] : biz.primaryType.replace(/_/g," ")}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <RankBadge rank={biz.rank}/>
                      {biz.compositeScore > own.compositeScore && (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(248,113,113,0.12)", color: "#f87171" }}>Ahead</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1"><Stars r={biz.rating}/>
                      <span className={`text-[10px] font-black ml-0.5 ${dark ? "text-white" : "text-slate-900"}`}>{biz.rating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare size={9} className={dark ? "text-slate-500" : "text-slate-400"}/>
                      <span className={`text-[10px] font-bold ${dark ? "text-slate-400" : "text-slate-600"}`}>{biz.reviewCount.toLocaleString()}</span>
                    </div>
                    {biz.isOpen !== null && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${biz.isOpen ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                        {biz.isOpen ? "Open" : "Closed"}
                      </span>
                    )}
                    {/* vs-you diff chips */}
                    <span className={`text-[9px] font-bold ${rdiff > 0 ? "text-red-400" : "text-emerald-400"}`}>
                      {rdiff > 0 ? "+" : ""}{rdiff.toFixed(1)}★
                    </span>
                  </div>
                </div>

                <ChevronDown size={13} className={`shrink-0 mt-1 ${dark ? "text-slate-600" : "text-slate-400"}`}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB: REVIEWS
══════════════════════════════════════════════════════════ */
function TabReviews({ data, dark }: { data: CAData; dark: boolean }) {
  const { ownPerf, own } = data;
  const reviews = ownPerf.recentReviews;
  return (
    <div className="flex flex-col gap-4">
      {/* summary */}
      <div className="grid grid-cols-3 gap-2.5">
        <Chip label="Avg Rating"  value={`${own.rating.toFixed(1)}★`} color="#f59e0b" dark={dark}/>
        <Chip label="Total"       value={own.reviewCount.toLocaleString()} color="#3b82f6" dark={dark}/>
        <Chip label="Reply Rate"  value={`${ownPerf.replyRate}%`} color="#22c55e" dark={dark}/>
      </div>

      {reviews.length === 0 ? (
        <div className={`rounded-2xl border p-6 text-center ${dark ? "bg-white/[0.03] border-white/[0.06]" : "bg-white border-slate-100"}`}>
          <p className={`text-[12px] ${dark ? "text-slate-500" : "text-slate-400"}`}>No recent reviews found</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {reviews.map((rv, i) => (
            <div key={i} className={`rounded-2xl border p-3.5 ${dark ? "bg-white/[0.03] border-white/[0.06]" : "bg-white border-slate-100 shadow-sm"}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className={`text-[12px] font-bold ${dark ? "text-white" : "text-slate-900"}`}>{rv.author}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Stars r={rv.rating}/>
                    <span className={`text-[9.5px] ${dark ? "text-slate-500" : "text-slate-400"}`}>
                      {new Date(rv.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${rv.replied ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                  {rv.replied ? "Replied" : "Pending"}
                </span>
              </div>
              {rv.comment && (
                <p className={`text-[10.5px] leading-relaxed ${dark ? "text-slate-400" : "text-slate-600"}`}>
                  {rv.comment.length > 140 ? rv.comment.slice(0, 137) + "…" : rv.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SKELETON + ERROR + NOT CONNECTED
══════════════════════════════════════════════════════════ */
function Skeleton({ dark }: { dark: boolean }) {
  const p = dark ? "bg-white/[0.05]" : "bg-blue-100/60";
  return (
    <div className={`min-h-screen ${dark ? "bg-[#050d1a]" : "bg-[#eef4ff]"} px-4 pt-6 pb-32 max-w-lg mx-auto`}>
      <div className={`h-6 w-44 rounded-full ${p} mb-2`}/>
      <div className={`h-4 w-56 rounded-full ${p} mb-5`}/>
      <div className={`h-14 rounded-2xl ${p} mb-4`}/>
      <div className={`h-64 rounded-3xl ${p} mb-4`}/>
      <div className={`h-44 rounded-2xl ${p} mb-4`}/>
      {[1,2,3].map(i => <div key={i} className={`h-20 rounded-2xl ${p} mb-3`}/>)}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
const TABS = [
  { id: "overview",     label: "Overview" },
  { id: "mystats",      label: "My Stats" },
  { id: "keywords",     label: "Keywords" },
  { id: "competitors",  label: "Competitors" },
  { id: "reviews",      label: "Reviews" },
] as const;
type TabId = typeof TABS[number]["id"];

export default function CompetitorAnalysisPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted]       = useState(false);
  useEffect(() => setMounted(true), []);
  const dark   = mounted && resolvedTheme === "dark";
  const router = useRouter();

  const [radius, setRadius]           = useState(1500);
  const [tab, setTab]                 = useState<TabId>("overview");
  const [selected, setSelected]       = useState<BizEntry | null>(null);

  const { data: user, isLoading: uLoad } = useUser();
  const locationId = user?.googleLocationId ?? "";

  const getToken = () =>
    (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null) ?? "";

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery<CAData>({
    queryKey: ["competitor-analysis", locationId, radius],
    queryFn: async ({ queryKey }) => {
      const [, lid, r] = queryKey as [string, string, number];
      const res  = await fetch(`/api/google/competitor-analysis?locationId=${lid}&radius=${r}`,
        { headers: { Authorization: `Bearer ${getToken()}` }, cache: "no-store" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Competitor analysis failed");
      return json as CAData;
    },
    enabled: !!locationId,
    staleTime: 0,
    gcTime: 10 * 60_000,
    retry: 1,
  });

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";

  if (!mounted || uLoad)     return <Skeleton dark={false}/>;
  if (!locationId) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-6 ${dark ? "bg-[#050d1a]" : "bg-[#eef4ff]"}`}
        style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}>
        <div className="text-center">
          <div className="text-5xl mb-4">🗺️</div>
          <p className={`text-base font-bold mb-2 ${dark ? "text-white" : "text-slate-900"}`}>No Google Business Linked</p>
          <p className={`text-sm mb-6 ${dark ? "text-slate-400" : "text-slate-600"}`}>Connect your GBP in Settings to run competitor analysis.</p>
          <button onClick={() => router.push("/profile")} className="px-6 py-2.5 rounded-2xl text-white text-sm font-bold"
            style={{ background: "linear-gradient(135deg,#1e40af,#3b82f6)" }}>Go to Profile</button>
        </div>
      </div>
    );
  }
  if (isLoading) return <Skeleton dark={dark}/>;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${dark ? "bg-[#050d1a]" : "bg-[#eef4ff]"}`}
      style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}>

      {/* dot grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.012]"
        style={{ backgroundImage: `radial-gradient(circle at 1px 1px,${dark ? "#3b82f6" : "#2563eb"} 1px,transparent 0)`, backgroundSize: "32px 32px" }}/>

      <div className="relative max-w-lg mx-auto px-4 pb-32">

        {/* ── HEADER ── */}
        <div className="pt-5 pb-3">
          <div className="flex items-start justify-between">
            <div>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9.5px] font-black uppercase tracking-widest mb-1.5 ${dark ? "bg-blue-500/10 border-blue-700/60 text-blue-400" : "bg-blue-50 border-blue-300 text-blue-600"}`}>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"/>
                Nearby · Google Maps
              </div>
              <h1 className={`text-[20px] font-black leading-tight ${dark ? "text-white" : "text-slate-900"}`} style={{ letterSpacing: "-0.04em" }}>
                Competitor Analysis
              </h1>
              {data && (
                <p className={`text-[11.5px] mt-0.5 ${dark ? "text-slate-500" : "text-blue-700"}`}>
                  {data.meta.locationName} · {data.meta.category}
                </p>
              )}
            </div>
            <button onClick={() => refetch({ cancelRefetch: true })} disabled={isFetching}
              className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl text-white transition-all active:scale-90 shrink-0 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#1e40af,#3b82f6)", boxShadow: "0 8px 24px rgba(59,130,246,0.35)" }}>
              <RefreshCw size={18} style={{ animation: isFetching ? "spin 1s linear infinite" : "none" }}/>
              <span className="text-[8.5px] font-black uppercase tracking-wide">{isFetching ? "…" : "Refresh"}</span>
              <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
            </button>
          </div>
        </div>

        {/* radius */}
        <div className="mb-3">
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {[1000, 1500, 3000, 5000, 10000].map(r => (
              <button key={r} onClick={() => setRadius(r)}
                className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all"
                style={radius === r
                  ? { background: "rgba(59,130,246,0.12)", color: "#60a5fa", borderColor: "rgba(59,130,246,0.3)" }
                  : { background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", color: dark ? "#475569" : "#94a3b8", borderColor: "transparent" }}>
                {r >= 1000 ? `${r / 1000} km` : `${r} m`}
              </button>
            ))}
          </div>
        </div>

        {/* error */}
        {isError && (
          <div className={`rounded-2xl border p-4 mb-4 flex items-start gap-3 ${dark ? "bg-red-500/[0.07] border-red-700/30" : "bg-red-50 border-red-200/60"}`}>
            <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5"/>
            <div>
              <p className={`text-[12px] font-bold mb-0.5 ${dark ? "text-red-300" : "text-red-700"}`}>Failed to load</p>
              <p className={`text-[11px] ${dark ? "text-red-400/70" : "text-red-600"}`}>{(error as Error)?.message}</p>
            </div>
          </div>
        )}

        {/* no places key warning */}
        {data && !data.meta.hasPlacesKey && (
          <div className={`rounded-2xl border p-3.5 mb-4 flex items-start gap-2.5 ${dark ? "bg-amber-500/[0.06] border-amber-700/30" : "bg-amber-50 border-amber-200/60"}`}>
            <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5"/>
            <p className={`text-[11px] ${dark ? "text-amber-400/80" : "text-amber-700"}`}>
              Add <code className="font-mono text-[10px]">GOOGLE_MAPS_API_KEY</code> to .env for real nearby competitor data.
            </p>
          </div>
        )}

        {data && (
          <>
            {/* ── TABS ── */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 mb-5" style={{ scrollbarWidth: "none" }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className="shrink-0 px-3.5 py-2 rounded-2xl text-[11.5px] font-bold transition-all border"
                  style={tab === t.id
                    ? { background: "rgba(59,130,246,0.12)", color: "#60a5fa", borderColor: "rgba(59,130,246,0.3)" }
                    : { background: dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.8)", color: dark ? "#475569" : "#94a3b8", borderColor: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── TAB CONTENT ── */}
            {tab === "overview"    && <TabOverview data={data} dark={dark}/>}
            {tab === "mystats"     && <TabMyStats  data={data} dark={dark}/>}
            {tab === "keywords"    && <TabKeywords data={data} dark={dark}/>}
            {tab === "competitors" && <TabCompetitors data={data} dark={dark} apiKey={apiKey} onSelect={setSelected}/>}
            {tab === "reviews"     && <TabReviews  data={data} dark={dark}/>}

            {/* ── CTA ── */}
            <div className={`mt-6 rounded-3xl border p-5 relative overflow-hidden ${dark ? "bg-[#070f1f] border-blue-900/50" : "bg-white border-blue-100 shadow-sm"}`}
              style={{ boxShadow: dark ? "0 20px 60px rgba(59,130,246,0.1)" : "0 8px 40px rgba(59,130,246,0.08)" }}>
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle,rgba(59,130,246,0.1),transparent 70%)" }}/>
              <div className="h-px w-full mb-4" style={{ background: "linear-gradient(90deg,transparent,rgba(59,130,246,0.4),transparent)" }}/>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${dark ? "bg-blue-500/15" : "bg-blue-100"}`}>
                  <TrendingUp size={18} style={{ color: "#60a5fa" }}/>
                </div>
                <div>
                  <p className={`text-[14px] font-black ${dark ? "text-white" : "text-slate-900"}`}>Outrank Your Competitors</p>
                  <p className={`text-[10.5px] mt-0.5 ${dark ? "text-slate-500" : "text-blue-500"}`}>AI-powered content to push you to #1</p>
                </div>
              </div>
              <button onClick={() => router.push("/post/create")}
                className="w-full py-3.5 rounded-2xl text-[13px] font-black text-white flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                style={{ background: "linear-gradient(135deg,#1e40af,#3b82f6,#60a5fa)", boxShadow: "0 8px 28px rgba(59,130,246,0.38)" }}>
                <Sparkles size={14}/> Start AI Optimisation <ArrowUpRight size={13} className="opacity-70"/>
              </button>
            </div>
          </>
        )}

        {/* refresh toast */}
        {isFetching && !isLoading && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40">
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-full border ${dark ? "bg-[#070f1f] border-blue-900/50" : "bg-white border-blue-200 shadow-lg"}`}>
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"/>
              <span className={`text-[11px] font-bold ${dark ? "text-slate-300" : "text-slate-700"}`}>Refreshing data…</span>
            </div>
          </div>
        )}
      </div>

      {/* ── DETAIL DRAWER ── */}
      {selected && data && (
        <DetailDrawer
          biz={selected} own={data.own} ownPerf={data.ownPerf}
          dark={dark} apiKey={apiKey} onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}