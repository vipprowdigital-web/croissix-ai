// mobile_app\app\(main)\reviews\google\page.tsx

// mobile_app/app/(main)/reviews/google/page.tsx

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import { useUser } from "@/features/user/hook/useUser";
import {
  Star, Sparkles, Send, ThumbsUp, Flag, RefreshCw, Filter,
  Search, ChevronDown, CheckCircle2, Clock, TrendingUp,
  MessageSquare, AlertCircle, Copy, Check, WifiOff,
  Building2, X, Zap, Brain, Shield, BarChart2, Target,
  Award, ChevronRight,
} from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { getAuthHeader } from "@/lib/token";

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
interface GoogleReview {
  name: string; reviewId: string;
  reviewer: { displayName: string; profilePhotoUrl?: string };
  starRating: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
  comment?: string; createTime: string; updateTime: string;
  reviewReply?: { comment: string; updateTime: string };
}
interface Review {
  name: string; id: string; author: string; initials: string;
  rating: number; date: string; text: string; replied: boolean;
  reply?: string; helpful: number;
  sentiment: "positive" | "neutral" | "negative"; flagged: boolean;
}
type FilterType = "all" | "replied" | "unreplied" | "positive" | "negative";
type SortType = "newest" | "oldest" | "rating_high" | "rating_low";
interface AIItem {
  reviewId: string; author: string; rating: number; text: string;
  status: "pending" | "thinking" | "writing" | "posting" | "done" | "failed";
  reply?: string;
}

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
const STAR: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
const toSentiment = (r: number): Review["sentiment"] => r >= 4 ? "positive" : r === 3 ? "neutral" : "negative";
const mkInitials = (n: string) => n.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
const normalise = (g: GoogleReview): Review => {
  const rating = STAR[g.starRating] ?? 3;
  return {
    name: g.name, id: g.reviewId, author: g.reviewer.displayName,
    initials: mkInitials(g.reviewer.displayName), rating,
    date: new Date(g.createTime).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    text: g.comment ?? "", replied: !!g.reviewReply, reply: g.reviewReply?.comment,
    helpful: 0, sentiment: toSentiment(rating), flagged: false,
  };
};

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("accessToken") : null; }

/* ══════════════════════════════════════════════════════════
   AI REPLY MODAL
══════════════════════════════════════════════════════════ */
const SEO_PHASES = [
  "Analysing review sentiment…", "Identifying SEO keywords…",
  "Crafting authentic tone…", "Optimising for local search…",
  "Personalising response…", "Adding trust signals…",
  "Reviewing for compliance…", "Finalising reply…",
];

function AIReplyModal({ items, isDark, onClose, isComplete }: {
  items: AIItem[]; isDark: boolean; onClose: () => void; isComplete: boolean;
}) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [barWidth, setBarWidth] = useState(0);
  const [particles, setParticles] = useState<{ x: number; y: number; s: number; d: number; o: number }[]>([]);

  const done = items.filter(i => i.status === "done").length;
  const failed = items.filter(i => i.status === "failed").length;
  const total = items.length;
  const active = items.find(i => i.status === "thinking" || i.status === "writing" || i.status === "posting");
  const pct = total > 0 ? Math.round(((done + failed) / total) * 100) : 0;
  const pending = items.filter(i => i.status === "pending");
  const completed = items.filter(i => i.status === "done" || i.status === "failed");

  useEffect(() => {
    setParticles(Array.from({ length: 22 }, () => ({
      x: Math.random() * 100, y: Math.random() * 100,
      s: 2 + Math.random() * 3, d: 4 + Math.random() * 8, o: 0.2 + Math.random() * 0.4,
    })));
  }, []);

  useEffect(() => {
    const target = isComplete ? 100 : pct;
    const interval = setInterval(() => {
      setBarWidth(prev => Math.abs(prev - target) < 0.5 ? target : prev + (target - prev) * 0.08);
    }, 40);
    return () => clearInterval(interval);
  }, [pct, isComplete]);

  useEffect(() => {
    if (isComplete) return;
    const id = setInterval(() => setPhaseIdx(p => (p + 1) % SEO_PHASES.length), 1800);
    return () => clearInterval(id);
  }, [isComplete]);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-end md:justify-center"
      style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-xl" />

      {/* particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p, i) => (
          <div key={i} className="absolute rounded-full"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s, background: "#3b82f6", opacity: p.o,
              animation: `float-${i % 4} ${p.d}s ease-in-out infinite alternate` }} />
        ))}
        <style>{`
          @keyframes float-0{0%{transform:translate(0,0)}100%{transform:translate(12px,-18px)}}
          @keyframes float-1{0%{transform:translate(0,0)}100%{transform:translate(-10px,14px)}}
          @keyframes float-2{0%{transform:translate(0,0)}100%{transform:translate(16px,10px)}}
          @keyframes float-3{0%{transform:translate(0,0)}100%{transform:translate(-8px,-12px)}}
          @keyframes spin-slow{from{transform:rotate(0)}to{transform:rotate(360deg)}}
          @keyframes pulse-ring{0%{transform:scale(1);opacity:0.6}100%{transform:scale(1.6);opacity:0}}
          @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}
          @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        `}</style>
      </div>

      {/* panel — bottom sheet on mobile, centered card on desktop */}
      <div className={`relative w-full md:max-w-lg md:rounded-3xl rounded-t-[28px] overflow-hidden max-h-[90vh] flex flex-col`}
        style={{ background: isDark ? "#070f1f" : "#fff",
          boxShadow: "0 -24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(59,130,246,0.2)" }}>
        <div className="h-[1.5px]"
          style={{ background: "linear-gradient(90deg,transparent,#3b82f6,#60a5fa,transparent)" }} />

        <div className="flex justify-center pt-3 pb-1">
          <div className={`w-9 h-1 rounded-full ${isDark ? "bg-white/20" : "bg-slate-200"}`} />
        </div>

        {/* header */}
        <div className="px-5 pt-2 pb-4 flex items-start gap-4">
          <div className="relative shrink-0 flex items-center justify-center" style={{ width: 64, height: 64 }}>
            {!isComplete && [1, 2].map(i => (
              <div key={i} className="absolute inset-0 rounded-full border border-blue-500/40"
                style={{ animation: `pulse-ring ${1.4 + i * 0.5}s ease-out infinite`, animationDelay: `${i * 0.4}s` }} />
            ))}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-blue-500/30"
              style={{ animation: isComplete ? "none" : "spin-slow 8s linear infinite" }} />
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: isComplete ? "linear-gradient(135deg,#16a34a,#22c55e)" : "linear-gradient(135deg,#1e40af,#3b82f6)",
                boxShadow: isComplete ? "0 0 24px rgba(34,197,94,0.5)" : "0 0 24px rgba(59,130,246,0.5)" }}>
              {isComplete ? <CheckCircle2 size={26} className="text-white" /> : <Brain size={26} className="text-white" />}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className={`text-[17px] font-black ${isDark ? "text-white" : "text-slate-900"}`}
                style={{ letterSpacing: "-0.03em" }}>
                {isComplete ? "All Done!" : "SEO AI Agent"}
              </p>
              {!isComplete && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)" }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-wide">Live</span>
                </div>
              )}
            </div>
            <p className={`text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {isComplete
                ? `${done} replies posted · ${failed > 0 ? `${failed} failed` : "all successful"}`
                : `Crafting SEO-optimised replies · ${done}/${total} done`}
            </p>
          </div>

          {isComplete && (
            <button onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDark ? "bg-white/[0.08]" : "bg-slate-100"}`}>
              <X size={14} className={isDark ? "text-slate-400" : "text-slate-600"} />
            </button>
          )}
        </div>

        {/* progress */}
        <div className="px-5 mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? "text-slate-600" : "text-slate-400"}`}>Progress</span>
            <span className={`text-[11px] font-black ${isDark ? "text-white" : "text-slate-900"}`}>{Math.round(barWidth)}%</span>
          </div>
          <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? "bg-white/[0.06]" : "bg-slate-100"}`}>
            <div className="h-full rounded-full relative overflow-hidden"
              style={{ width: `${barWidth}%`,
                background: isComplete ? "linear-gradient(90deg,#16a34a,#22c55e)" : "linear-gradient(90deg,#1d4ed8,#3b82f6,#60a5fa)",
                boxShadow: isComplete ? "0 0 10px rgba(34,197,94,0.5)" : "0 0 10px rgba(59,130,246,0.6)",
                transition: "width 0.3s ease" }}>
              {!isComplete && (
                <div className="absolute inset-0"
                  style={{ background: "linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.25) 50%,transparent 100%)",
                    animation: "shimmer 1.5s linear infinite" }} />
              )}
            </div>
          </div>
          <div className="flex gap-3 mt-2">
            {[{ label: "Total", value: total, color: "#3b82f6" }, { label: "Done", value: done, color: "#22c55e" },
              { label: "Pending", value: pending.length, color: "#f59e0b" }, { label: "Failed", value: failed, color: "#ef4444" }].map((s, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="text-[13px] font-black" style={{ color: s.color }}>{s.value}</span>
                <span className={`text-[9.5px] font-bold ${isDark ? "text-slate-600" : "text-slate-400"}`}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SEO phase label */}
        {!isComplete && (
          <div className="px-5 mb-3">
            <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border
              ${isDark ? "bg-blue-500/[0.06] border-blue-900/50" : "bg-blue-50 border-blue-200/60"}`}>
              <div className="flex gap-0.5 shrink-0">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400"
                    style={{ animation: "bounce 1s ease-in-out infinite", animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <p className={`text-[11.5px] font-semibold flex-1 ${isDark ? "text-blue-300" : "text-blue-700"}`}>
                {SEO_PHASES[phaseIdx]}
              </p>
              <div className="flex items-center gap-1 shrink-0">
                <Zap size={10} className="text-blue-400" />
                <span className="text-[9px] font-black text-blue-400">SEO Expert</span>
              </div>
            </div>
          </div>
        )}

        {!isComplete && (
          <div className="px-5 mb-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {[
              { icon: <Target size={9} />, label: "Keyword Targeting", color: "#3b82f6" },
              { icon: <BarChart2 size={9} />, label: "Local SEO Boost", color: "#8b5cf6" },
              { icon: <Shield size={9} />, label: "Trust Signals", color: "#22c55e" },
              { icon: <Award size={9} />, label: "Brand Voice", color: "#f59e0b" },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-1 px-2.5 py-1.5 rounded-full shrink-0"
                style={{ background: `${b.color}15`, border: `1px solid ${b.color}25` }}>
                <span style={{ color: b.color }}>{b.icon}</span>
                <span className="text-[9px] font-black" style={{ color: b.color }}>{b.label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="h-px mx-5 mb-3" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }} />

        {/* scrollable list */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-2.5" style={{ scrollbarWidth: "none" }}>
          {active && (
            <div className="mb-1">
              <p className={`text-[9.5px] font-black uppercase tracking-widest mb-2 ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                Currently Processing
              </p>
              <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-[#0d1c36] border-blue-900/50" : "bg-blue-50 border-blue-200/60"}`}
                style={{ boxShadow: "0 0 20px rgba(59,130,246,0.12)" }}>
                <div className="h-[1.5px]"
                  style={{ background: "linear-gradient(90deg,transparent,#3b82f6,transparent)", animation: "shimmer 1.5s linear infinite" }} />
                <div className="p-3.5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-black shrink-0"
                      style={{ background: `hsl(${active.author.charCodeAt(0) * 40},65%,50%)` }}>
                      {active.author.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`text-[12px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{active.author}</p>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star key={i} size={9} strokeWidth={0} fill={i < active.rating ? "#FBBF24" : "#374151"} />
                          ))}
                        </div>
                      </div>
                      {active.text && (
                        <p className={`text-[10.5px] leading-relaxed line-clamp-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                          {active.text}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-xl ${isDark ? "bg-white/[0.04]" : "bg-white/60"}`}>
                    <div className="flex gap-0.5">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-1 h-1 rounded-full bg-blue-400"
                          style={{ animation: "bounce 1s ease-in-out infinite", animationDelay: `${i * 0.12}s` }} />
                      ))}
                    </div>
                    <p className={`text-[11px] font-semibold ${isDark ? "text-blue-300" : "text-blue-600"}`}>
                      {active.status === "thinking" && "Analysing review & identifying SEO keywords…"}
                      {active.status === "writing" && "Writing personalised SEO-optimised reply…"}
                      {active.status === "posting" && "Posting reply to Google Business Profile…"}
                    </p>
                  </div>
                  {active.reply && (
                    <div className={`mt-2 px-3 py-2 rounded-xl border-l-2 border-blue-500 ${isDark ? "bg-white/[0.03]" : "bg-white/50"}`}>
                      <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-blue-400">Reply Preview</p>
                      <p className={`text-[11px] leading-relaxed line-clamp-3 ${isDark ? "text-slate-300" : "text-slate-700"}`}>{active.reply}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <p className={`text-[9.5px] font-black uppercase tracking-widest mb-2 ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                Completed ({completed.length})
              </p>
              <div className="flex flex-col gap-2">
                {[...completed].reverse().map(item => (
                  <div key={item.reviewId}
                    className={`flex items-start gap-3 px-3.5 py-3 rounded-2xl border
                      ${isDark ? "bg-white/[0.025] border-white/[0.05]" : "bg-white border-slate-100"}`}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-black shrink-0"
                      style={{ background: `hsl(${item.author.charCodeAt(0) * 40},55%,55%)`, opacity: 0.85 }}>
                      {item.author.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-[11.5px] font-bold truncate ${isDark ? "text-slate-300" : "text-slate-700"}`}>{item.author}</p>
                        <div className="flex gap-0.5 shrink-0">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star key={i} size={8} strokeWidth={0} fill={i < item.rating ? "#FBBF24" : "#374151"} />
                          ))}
                        </div>
                      </div>
                      {item.reply && (
                        <p className={`text-[10px] leading-relaxed line-clamp-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{item.reply}</p>
                      )}
                    </div>
                    <div className="shrink-0 mt-0.5">
                      {item.status === "done"
                        ? <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center"><CheckCircle2 size={12} className="text-emerald-400" /></div>
                        : <div className="w-5 h-5 rounded-full bg-red-500/15 flex items-center justify-center"><X size={10} className="text-red-400" /></div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pending.length > 0 && !isComplete && (
            <div className="mt-1">
              <p className={`text-[9.5px] font-black uppercase tracking-widest mb-2 ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                Queue ({pending.length})
              </p>
              <div className="flex flex-col gap-1.5">
                {pending.slice(0, 4).map(item => (
                  <div key={item.reviewId} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl ${isDark ? "bg-white/[0.015]" : "bg-slate-50"}`}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0"
                      style={{ background: `hsl(${item.author.charCodeAt(0) * 40},45%,50%)`, opacity: 0.5 }}>
                      {item.author.slice(0, 1).toUpperCase()}
                    </div>
                    <p className={`text-[10.5px] flex-1 truncate ${isDark ? "text-slate-600" : "text-slate-400"}`}>{item.author}</p>
                    <Clock size={10} className={isDark ? "text-slate-700" : "text-slate-300"} />
                  </div>
                ))}
                {pending.length > 4 && (
                  <p className={`text-[10px] text-center font-medium ${isDark ? "text-slate-700" : "text-slate-400"}`}>
                    +{pending.length - 4} more in queue
                  </p>
                )}
              </div>
            </div>
          )}

          {isComplete && (
            <div className={`rounded-2xl border p-4 flex flex-col items-center text-center
              ${isDark ? "bg-emerald-500/[0.06] border-emerald-900/40" : "bg-emerald-50 border-emerald-200/60"}`}>
              <div className="flex gap-3 mb-3">
                {[
                  { icon: <Target size={11} />, label: "SEO Optimised", color: "#3b82f6" },
                  { icon: <Shield size={11} />, label: "Trust Signals", color: "#22c55e" },
                  { icon: <BarChart2 size={11} />, label: "Ranking Boost", color: "#8b5cf6" },
                ].map((b, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: `${b.color}15`, color: b.color }}>{b.icon}</div>
                    <span className="text-[8.5px] font-bold" style={{ color: b.color }}>{b.label}</span>
                  </div>
                ))}
              </div>
              <p className={`text-[13px] font-black mb-1 ${isDark ? "text-emerald-300" : "text-emerald-700"}`}>
                {done} SEO replies posted successfully!
              </p>
              <p className={`text-[10.5px] ${isDark ? "text-emerald-400/60" : "text-emerald-600"}`}>
                All replies are keyword-rich and optimised for local search ranking.
              </p>
              <button onClick={onClose}
                className="mt-4 px-8 py-3 rounded-2xl text-white text-[13px] font-black transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg,#16a34a,#22c55e)", boxShadow: "0 8px 24px rgba(34,197,94,0.35)" }}>
                View Results
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ATOMS
══════════════════════════════════════════════════════════ */
function StarRow({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size} strokeWidth={0} fill={i <= rating ? "#FBBF24" : "#374151"} />
      ))}
    </div>
  );
}

function Av({ initials: ini }: { initials: string }) {
  const C = ["#3b82f6","#8b5cf6","#ec4899","#10b981","#f59e0b","#06b6d4","#ef4444","#84cc16"];
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0"
      style={{ background: C[ini.charCodeAt(0) % C.length] }}>
      {ini}
    </div>
  );
}

function Spin({ size = 16, white = false }: { size?: number; white?: boolean }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={white ? "white" : "currentColor"} strokeWidth="2.5" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={white ? "white" : "currentColor"} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function sentimentCls(s: Review["sentiment"], isDark: boolean) {
  if (s === "positive") return isDark ? "bg-green-500/15 text-green-400 border-green-500/20" : "bg-green-50 text-green-700 border-green-200";
  if (s === "negative") return isDark ? "bg-red-500/15 text-red-400 border-red-500/20" : "bg-red-50 text-red-600 border-red-200";
  return isDark ? "bg-slate-500/15 text-slate-400 border-slate-500/20" : "bg-slate-50 text-slate-500 border-slate-200";
}

function GoogleLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M21.805 10.023H12v3.977h5.617c-.245 1.36-1.017 2.514-2.164 3.29v2.73h3.503C20.938 18.202 22 15.298 22 12c0-.66-.069-1.305-.195-1.977z" fill="#4285F4" />
      <path d="M12 22c2.97 0 5.46-.984 7.28-2.668l-3.503-2.73c-.984.66-2.245 1.05-3.777 1.05-2.9 0-5.36-1.958-6.24-4.59H2.15v2.817C3.96 19.983 7.7 22 12 22z" fill="#34A853" />
      <path d="M5.76 13.062A6.05 6.05 0 0 1 5.44 12c0-.37.063-.73.163-1.062V8.121H2.15A9.987 9.987 0 0 0 2 12c0 1.61.387 3.13 1.07 4.477l3.69-2.817z" fill="#FBBC05" />
      <path d="M12 5.958c1.637 0 3.105.563 4.26 1.667l3.195-3.195C17.455 2.693 14.965 1.6 12 1.6 7.7 1.6 3.96 3.617 2.15 7.12l3.61 2.817C6.64 7.305 9.1 5.958 12 5.958z" fill="#EA4335" />
    </svg>
  );
}

function StatCard({ label, value, sub, icon, color, isDark }: {
  label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string; isDark: boolean;
}) {
  return (
    <div className={`rounded-2xl p-4 flex flex-col gap-2 border
      ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05] shadow-sm"}`}>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-semibold uppercase tracking-[0.07em] ${isDark ? "text-slate-500" : "text-slate-400"}`}>{label}</span>
        <span className="p-1.5 rounded-lg" style={{ background: `${color}18` }}>
          <span style={{ color }}>{icon}</span>
        </span>
      </div>
      <div>
        <div className={`text-2xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
          style={{ fontFamily: "-apple-system,'SF Pro Display',sans-serif", letterSpacing: "-0.04em" }}>
          {value}
        </div>
        {sub && <div className={`text-[11px] mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{sub}</div>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   REPLY COMPOSER
══════════════════════════════════════════════════════════ */
function ReplyComposer({ review, isDark, onSend, onClose }: {
  review: Review; isDark: boolean;
  onSend: (text: string) => Promise<void>; onClose: () => void;
}) {
  const [text, setText] = useState(review.reply ?? "");
  const [generating, setGenerating] = useState(false);
  const [posting, setPosting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [apiError, setApiError] = useState("");
  const MAX = 4096;
  const taRef = useRef<HTMLTextAreaElement>(null);
  const { data: user } = useUser();

  const generateAI = async (tone?: string) => {
    try {
      setGenerating(true); setApiError("");
      const res = await fetch("/api/ai/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review: review.text ?? "", rating: review.rating,
          reviewerName: review.author, businessName: user?.googleLocationName, tone: tone || "Professional" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "AI generation failed");
      setText(json.reply);
      taRef.current?.focus();
    } catch (e: any) { setApiError(e.message || "Failed to generate AI reply"); }
    finally { setGenerating(false); }
  };

  const handleSend = async () => {
    setApiError("");
    if (!text.trim() || text.length > MAX) return;
    setPosting(true);
    try { await onSend(text.trim()); }
    catch (e: any) { setApiError(e.message ?? "Failed to post reply."); }
    finally { setPosting(false); }
  };

  const remaining = MAX - text.length;
  const overLimit = remaining < 0;

  return (
    <div className={`mt-3 rounded-2xl p-4 border ${isDark ? "bg-[#0d1421] border-white/[0.08]" : "bg-slate-50 border-black/[0.06]"}`}>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <button onClick={() => generateAI()} disabled={generating}
          className={`flex items-center gap-1.5 h-8 px-3 rounded-xl text-[12px] font-semibold transition-all active:scale-95 disabled:opacity-60
            ${isDark ? "bg-blue-500/15 text-blue-400 border border-blue-500/25" : "bg-blue-50 text-blue-600 border border-blue-200"}`}>
          {generating ? <><RefreshCw size={12} className="animate-spin" /> Generating…</> : <><Sparkles size={12} /> AI Reply</>}
        </button>
        {["Professional", "Friendly", "Empathetic"].map(tone => (
          <button key={tone} onClick={() => generateAI(tone)} disabled={generating}
            className={`h-7 px-2.5 rounded-lg text-[11px] font-medium transition-all active:scale-95 disabled:opacity-50
              ${isDark ? "bg-white/[0.06] text-slate-400" : "bg-white text-slate-500 border border-slate-200"}`}>
            {tone}
          </button>
        ))}
      </div>
      <div className="relative">
        <textarea ref={taRef} value={text} rows={6}
          onChange={e => { setText(e.target.value); setApiError(""); }}
          placeholder="Write your reply… or tap AI Reply to generate one."
          className={`w-full rounded-xl p-3 text-[13.5px] resize-none outline-none border transition-all duration-200
            ${overLimit ? "border-red-500/50" : isDark ? "border-white/[0.07] focus:border-blue-500/50" : "border-black/[0.07] focus:border-blue-500/40"}
            ${isDark ? "bg-[#182236] text-white placeholder:text-slate-600" : "bg-white text-slate-900 placeholder:text-slate-400"}`} />
        {text.length > 0 && (
          <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className={`absolute top-2 right-2 p-1.5 rounded-lg ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
          </button>
        )}
      </div>
      <div className="flex items-center justify-between mt-2 px-0.5">
        <div>
          {apiError && <span className="flex items-center gap-1 text-[11px] text-red-400 font-medium"><AlertCircle size={11} />{apiError}</span>}
          {!apiError && overLimit && <span className="text-[11px] text-red-400 font-medium">{Math.abs(remaining)} over limit</span>}
          {!apiError && !overLimit && remaining < 200 && text.length > 0 && <span className="text-[11px] text-orange-400 font-medium">{remaining} chars left</span>}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className={`h-8 px-3 rounded-xl text-[12px] font-semibold transition-all ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            Cancel
          </button>
          <button onClick={handleSend} disabled={!text.trim() || overLimit || posting}
            className="h-8 px-4 rounded-xl text-[12px] font-bold text-white flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", boxShadow: "0 3px 12px rgba(37,99,235,0.35)" }}>
            {posting ? <Spin size={13} white /> : <><Send size={12} /> Post Reply</>}
          </button>
        </div>
      </div>
      <p className={`text-[10.5px] mt-2.5 ${isDark ? "text-slate-700" : "text-slate-400"}`}>
        Replies are public on Google. Keep responses professional and avoid sharing personal information.
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   REVIEW CARD
══════════════════════════════════════════════════════════ */
function ReviewCard({ review, isDark, onReply, onFlag, onHelpful }: {
  review: Review; isDark: boolean;
  onReply: (name: string, text: string) => Promise<void>;
  onFlag: (id: string) => void; onHelpful: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const needsTrunc = (review.text?.length ?? 0) > 120;

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all duration-200 flex flex-col
      ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05] shadow-sm"}
      ${review.flagged ? (isDark ? "border-red-500/25" : "border-red-200") : ""}`}>
      <div className="p-4 flex-1">
        <div className="flex items-start gap-3 mb-3">
          <Av initials={review.initials} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[14px] font-semibold truncate ${isDark ? "text-white" : "text-slate-900"}`}>{review.author}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                {review.flagged && (
                  <span className={`text-[10px] font-semibold border rounded-full px-2 py-0.5 ${isDark ? "bg-red-500/15 text-red-400 border-red-500/20" : "bg-red-50 text-red-500 border-red-200"}`}>
                    Flagged
                  </span>
                )}
                <span className={`text-[10px] font-semibold border rounded-full px-2 py-0.5 ${sentimentCls(review.sentiment, isDark)}`}>
                  {review.sentiment}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRow rating={review.rating} />
              <span className={`text-[11px] ${isDark ? "text-slate-600" : "text-slate-400"}`}>{review.date}</span>
            </div>
          </div>
        </div>

        {review.text ? (
          <p className={`text-[13.5px] leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700"}`}
            style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}>
            {needsTrunc && !expanded ? review.text.slice(0, 120) + "…" : review.text}
            {needsTrunc && (
              <button onClick={() => setExpanded(v => !v)} className="ml-1 text-blue-500 text-[12px] font-medium">
                {expanded ? "Less" : "More"}
              </button>
            )}
          </p>
        ) : (
          <p className={`text-[12.5px] italic ${isDark ? "text-slate-600" : "text-slate-400"}`}>No written comment</p>
        )}

        {review.replied && review.reply && (
          <div className={`mt-3 rounded-xl p-3 border-l-2 border-blue-500 ${isDark ? "bg-blue-500/[0.07]" : "bg-blue-50/60"}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 size={12} className="text-blue-500" />
              <span className="text-[10px] font-bold uppercase tracking-wide text-blue-500">Owner Reply</span>
            </div>
            <p className={`text-[12.5px] leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>{review.reply}</p>
          </div>
        )}

        <div className={`flex items-center gap-1 mt-3 pt-3 border-t ${isDark ? "border-white/[0.05]" : "border-slate-100"}`}>
          <button onClick={() => setOpen(v => !v)}
            className={`flex items-center gap-1.5 h-7 px-3 rounded-xl text-[12px] font-semibold transition-all active:scale-95
              ${open ? "bg-blue-500 text-white" : isDark ? "bg-white/[0.07] text-slate-300" : "bg-slate-100 text-slate-600"}`}>
            <MessageSquare size={12} /> {review.replied ? "Edit Reply" : "Reply"}
          </button>
          <button onClick={() => onHelpful(review.id)}
            className={`flex items-center gap-1.5 h-7 px-3 rounded-xl text-[12px] font-medium transition-all active:scale-95 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            <ThumbsUp size={12} /> {review.helpful}
          </button>
          <button onClick={() => onFlag(review.id)}
            className={`ml-auto flex items-center gap-1 h-7 px-2.5 rounded-xl text-[11px] font-medium transition-all active:scale-95
              ${review.flagged ? (isDark ? "text-red-400 bg-red-500/10" : "text-red-500 bg-red-50") : isDark ? "text-slate-600" : "text-slate-400"}`}>
            <Flag size={11} /> {review.flagged ? "Unflag" : "Flag"}
          </button>
        </div>
      </div>

      {open && (
        <div className={`px-4 pb-4 border-t ${isDark ? "border-white/[0.05]" : "border-slate-100"}`}>
          <ReplyComposer review={review} isDark={isDark}
            onSend={async (text) => { await onReply(review.name, text); setOpen(false); }}
            onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

function ReviewSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05]"}`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-full shrink-0 animate-pulse ${isDark ? "bg-white/[0.07]" : "bg-slate-100"}`} />
        <div className="flex-1">
          <div className={`h-3.5 w-28 rounded mb-2 animate-pulse ${isDark ? "bg-white/[0.07]" : "bg-slate-100"}`} />
          <div className={`h-2.5 w-20 rounded animate-pulse ${isDark ? "bg-white/[0.07]" : "bg-slate-100"}`} />
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <div className={`h-2.5 w-full rounded animate-pulse ${isDark ? "bg-white/[0.07]" : "bg-slate-100"}`} />
        <div className={`h-2.5 w-4/5 rounded animate-pulse ${isDark ? "bg-white/[0.07]" : "bg-slate-100"}`} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════ */
export default function GoogleReviewsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  const { data: user, isLoading: userLoading } = useUser();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [fetching, setFetching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchErr, setFetchErr] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");
  const [search, setSearch] = useState("");
  const [showSort, setShowSort] = useState(false);
  const [nextToken, setNextToken] = useState<string | null>(null);

  const [aiItems, setAiItems] = useState<AIItem[]>([]);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiComplete, setAiComplete] = useState(false);

  const hasMore = !!nextToken;
  const googleStats = useSelector((state: RootState) => state.google.stats);
  const totalReviewsFromAnalytics = googleStats?.totalReviews ?? totalCount;

  const fetchReviews = useCallback(async (tokenParam?: string, append = false) => {
    if (!user?.googleLocationId) return;
    append ? setLoadingMore(true) : setFetching(true);
    if (!append) setFetchErr("");
    try {
      const token = localStorage.getItem("accessToken");
      let url = `/api/google/reviews?location=accounts/me/locations/${user.googleLocationId}`;
      if (tokenParam) url += `&pageToken=${tokenParam}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed");
      const mapped = json.reviews.map(normalise);
      setReviews(prev => append ? [...prev, ...mapped] : mapped);
      setNextToken(json.nextPageToken);
      setTotalCount(json.totalReviewCount || 0);
    } catch (e: any) { setFetchErr(e.message ?? "Error"); }
    finally { append ? setLoadingMore(false) : setFetching(false); }
  }, [user?.googleLocationId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const loadMore = () => { if (!loadingMore && nextToken) fetchReviews(nextToken, true); };
  const refresh = () => { setNextToken(null); fetchReviews(); };

  const postReply = async (reviewName: string, comment: string) => {
    const authHeader = getAuthHeader();
    if (!authHeader) throw new Error("User not authenticated");
    const res = await fetch("/api/google/reply", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json", Authorization: authHeader },
      body: JSON.stringify({ reviewName, comment }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? "Reply failed");
    setReviews(prev => prev.map(r => r.name === reviewName ? { ...r, replied: true, reply: comment } : r));
  };

  const bulkAI = async () => {
    const unreplied = reviews.filter(r => !r.replied);
    if (unreplied.length === 0) return;
    const initial: AIItem[] = unreplied.map(r => ({ reviewId: r.id, author: r.author, rating: r.rating, text: r.text, status: "pending" }));
    setAiItems(initial); setAiComplete(false); setShowAIModal(true);

    for (let i = 0; i < unreplied.length; i++) {
      const r = unreplied[i];
      setAiItems(prev => prev.map(item => item.reviewId === r.id ? { ...item, status: "thinking" } : item));
      await new Promise(res => setTimeout(res, 600));
      let replyText = "";
      try {
        if (!r.text || r.text.trim() === "") {
          replyText = `Hi ${r.author.split(" ")[0]},\n\nThank you for taking the time to leave a rating for ${user?.googleLocationName}. We truly appreciate your support and are glad you chose us.\n\nWe look forward to welcoming you again.\n\nBest Regards,\n${user?.googleLocationName} Team`.trim();
        } else {
          setAiItems(prev => prev.map(item => item.reviewId === r.id ? { ...item, status: "writing" } : item));
          const aiRes = await fetch("/api/ai/reply", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ review: r.text, rating: r.rating, reviewerName: r.author, businessName: user?.googleLocationName, tone: "Professional" }),
          });
          const aiJson = await aiRes.json();
          if (!aiJson.success) throw new Error(aiJson.error ?? "AI failed");
          replyText = aiJson.reply;
          setAiItems(prev => prev.map(item => item.reviewId === r.id ? { ...item, reply: replyText } : item));
          await new Promise(res => setTimeout(res, 400));
        }
        setAiItems(prev => prev.map(item => item.reviewId === r.id ? { ...item, status: "posting", reply: replyText } : item));
        await postReply(r.name, replyText);
        await new Promise(res => setTimeout(res, 800));
        setAiItems(prev => prev.map(item => item.reviewId === r.id ? { ...item, status: "done", reply: replyText } : item));
      } catch {
        setAiItems(prev => prev.map(item => item.reviewId === r.id ? { ...item, status: "failed" } : item));
      }
      await new Promise(res => setTimeout(res, 1200));
    }
    setAiComplete(true);
  };

  const handleFlag = (id: string) => setReviews(prev => prev.map(r => r.id === id ? { ...r, flagged: !r.flagged } : r));
  const handleHelpful = (id: string) => setReviews(prev => prev.map(r => r.id === id ? { ...r, helpful: r.helpful + 1 } : r));

  const loaded = reviews.length;
  const avg = loaded ? (reviews.reduce((s, r) => s + r.rating, 0) / loaded).toFixed(1) : "—";
  const replied = reviews.filter(r => r.replied).length;
  const positive = reviews.filter(r => r.sentiment === "positive").length;
  const unreplied = reviews.filter(r => !r.replied).length;
  const ratingDist = [5, 4, 3, 2, 1].map(star => ({ star, count: reviews.filter(r => r.rating === star).length }));

  const visible = reviews
    .filter(r => {
      if (filter === "replied") return r.replied;
      if (filter === "unreplied") return !r.replied;
      if (filter === "positive") return r.sentiment === "positive";
      if (filter === "negative") return r.sentiment === "negative";
      return true;
    })
    .filter(r => !search || r.author.toLowerCase().includes(search.toLowerCase()) || r.text.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "rating_high") return b.rating - a.rating;
      if (sort === "rating_low") return a.rating - b.rating;
      return 0;
    });

  const SORT_LABELS: Record<SortType, string> = { newest: "Newest", oldest: "Oldest", rating_high: "Rating ↑", rating_low: "Rating ↓" };
  const isInitialLoad = userLoading || (fetching && reviews.length === 0);

  return (
    <div className="w-full" style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}>

      {/* AI MODAL */}
      {showAIModal && (
        <AIReplyModal items={aiItems} isDark={isDark} isComplete={aiComplete}
          onClose={() => { setShowAIModal(false); setAiItems([]); setAiComplete(false); }} />
      )}

      {/* ── HEADER ── */}
      <div className="pt-2 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <GoogleLogo />
              <h1 className={`text-[18px] font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
                style={{ fontFamily: "-apple-system,'SF Pro Display',sans-serif", letterSpacing: "-0.03em" }}>
                Google Reviews
              </h1>
              {totalReviewsFromAnalytics > 0 && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isDark ? "bg-white/[0.08] text-slate-400" : "bg-slate-100 text-slate-500"}`}>
                  {totalReviewsFromAnalytics}
                </span>
              )}
            </div>
            {user?.googleLocationName && (
              <div className="flex items-center gap-1.5">
                <Building2 size={11} className={isDark ? "text-slate-600" : "text-slate-400"} />
                <span className={`text-[12px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>{user.googleLocationName}</span>
              </div>
            )}
          </div>
          <button onClick={refresh} disabled={fetching}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90 disabled:opacity-50
              ${isDark ? "bg-white/[0.07] text-slate-400" : "bg-white text-slate-500 border border-slate-200"}`}>
            <RefreshCw size={15} className={fetching ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* initial loading */}
      {isInitialLoad && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`rounded-2xl p-4 border h-24 animate-pulse ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05]"}`} />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => <ReviewSkeleton key={i} isDark={isDark} />)}
          </div>
        </div>
      )}

      {!userLoading && !user?.googleLocationId && (
        <div className={`rounded-2xl p-8 text-center border ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05]"}`}>
          <Building2 size={32} className={`mx-auto mb-3 ${isDark ? "text-slate-600" : "text-slate-300"}`} />
          <p className={`text-[14px] font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>No Google Business Linked</p>
          <p className={`text-[12.5px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            Go to your Profile page and link your GBP to start managing reviews.
          </p>
        </div>
      )}

      {fetchErr && (
        <div className={`rounded-2xl p-4 flex items-start gap-3 border mb-4 ${isDark ? "bg-red-500/[0.08] border-red-500/20" : "bg-red-50 border-red-200"}`}>
          <WifiOff size={16} className="text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-red-400 mb-0.5">Failed to load reviews</p>
            <p className={`text-[12px] ${isDark ? "text-red-500/70" : "text-red-400"}`}>{fetchErr}</p>
            <button onClick={refresh} className="mt-2 text-[12px] font-semibold text-blue-500">Retry</button>
          </div>
        </div>
      )}

      {!isInitialLoad && reviews.length > 0 && (
        <>
          {/* stat grid: 2-col mobile → 4-col desktop */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <StatCard label="Avg Rating"     value={avg}    sub={`${totalReviewsFromAnalytics} total reviews`}  icon={<Star size={14} />}        color="#FBBF24" isDark={isDark} />
            <StatCard label="Response Rate"  value={`${Math.round((replied / loaded) * 100)}%`} sub={`${replied} of ${loaded} replied`} icon={<MessageSquare size={14} />} color="#3b82f6" isDark={isDark} />
            <StatCard label="Positive"       value={positive} sub="4–5 star reviews"            icon={<TrendingUp size={14} />}   color="#22c55e" isDark={isDark} />
            <StatCard label="Needs Reply"    value={unreplied} sub="awaiting response"          icon={<Clock size={14} />}        color="#f97316" isDark={isDark} />
          </div>

          {/* rating breakdown + AI button: side by side on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">

            {/* rating breakdown */}
            <div className={`rounded-2xl p-4 border ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05] shadow-sm"}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className={`text-[11px] font-semibold uppercase tracking-[0.07em] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    Rating Breakdown
                  </span>
                  <span className={`ml-2 text-[10px] ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                    ({loaded} of {totalReviewsFromAnalytics} loaded)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Star size={13} fill="#FBBF24" strokeWidth={0} />
                  <span className={`text-[15px] font-black ${isDark ? "text-white" : "text-slate-900"}`}
                    style={{ letterSpacing: "-0.03em" }}>{avg}</span>
                </div>
              </div>
              {ratingDist.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[11px] w-3 text-right shrink-0 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{star}</span>
                  <Star size={9} fill="#FBBF24" strokeWidth={0} className="shrink-0" />
                  <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDark ? "bg-white/[0.07]" : "bg-slate-100"}`}>
                    <div className="h-full rounded-full bg-yellow-400 transition-all duration-500"
                      style={{ width: loaded ? `${(count / loaded) * 100}%` : "0%" }} />
                  </div>
                  <span className={`text-[11px] w-4 text-right shrink-0 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{count}</span>
                </div>
              ))}
            </div>

            {/* AI button + search stacked */}
            <div className="flex flex-col gap-3">
              {unreplied > 0 && (
                <button onClick={bulkAI}
                  className="w-full h-14 rounded-[14px] flex items-center justify-center gap-2.5 text-[13.5px] font-bold text-white transition-all active:scale-[0.97] relative overflow-hidden"
                  style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6,#60a5fa)", boxShadow: "0 6px 20px rgba(37,99,235,0.42)" }}>
                  <div className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.12) 50%,transparent 100%)",
                      animation: "shimmer 2.5s linear infinite" }} />
                  <div className="relative flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.18)" }}>
                      <Brain size={15} className="text-white" />
                    </div>
                    <span>AI Auto-Reply {unreplied} Reviews</span>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(255,255,255,0.15)" }}>
                      <Sparkles size={9} className="text-white/80" />
                      <span className="text-[9px] font-black text-white/80 uppercase tracking-wide">SEO</span>
                    </div>
                  </div>
                </button>
              )}

              {/* search bar */}
              <div className={`flex items-center gap-2.5 h-[42px] px-3.5 rounded-[13px] border
                ${isDark ? "bg-[#131c2d] border-white/[0.07]" : "bg-white border-black/[0.07]"}`}>
                <Search size={14} className={isDark ? "text-slate-600" : "text-slate-400"} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reviews…"
                  className={`flex-1 bg-transparent outline-none text-[13.5px]
                    ${isDark ? "text-white placeholder:text-slate-600" : "text-slate-900 placeholder:text-slate-400"}`} />
                {search && (
                  <button onClick={() => setSearch("")}
                    className={`text-[11px] font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>Clear</button>
                )}
              </div>
            </div>
          </div>

          {/* filter + sort row */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-1.5 flex-1 overflow-x-auto no-scrollbar">
              {(["all", "unreplied", "replied", "positive", "negative"] as FilterType[]).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`h-8 px-3 rounded-xl text-[12px] font-semibold whitespace-nowrap shrink-0 transition-all active:scale-95
                    ${filter === f ? "bg-blue-500 text-white"
                      : isDark ? "bg-white/[0.07] text-slate-400" : "bg-white text-slate-500 border border-slate-200"}`}>
                  {f === "all" ? "All" : f === "unreplied" ? `Unreplied (${unreplied})` : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div className="relative shrink-0">
              <button onClick={() => setShowSort(v => !v)}
                className={`flex items-center gap-1 h-8 px-3 rounded-xl text-[12px] font-semibold transition-all active:scale-95
                  ${isDark ? "bg-white/[0.07] text-slate-400" : "bg-white text-slate-500 border border-slate-200"}`}>
                <Filter size={11} /> {SORT_LABELS[sort]}
                <ChevronDown size={11} className={`transition-transform ${showSort ? "rotate-180" : ""}`} />
              </button>
              {showSort && (
                <div className={`absolute right-0 top-10 z-20 rounded-2xl border overflow-hidden shadow-xl min-w-[140px]
                  ${isDark ? "bg-[#131c2d] border-white/[0.08]" : "bg-white border-black/[0.06]"}`}>
                  {(Object.entries(SORT_LABELS) as [SortType, string][]).map(([k, v]) => (
                    <button key={k} onClick={() => { setSort(k); setShowSort(false); }}
                      className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors
                        ${sort === k ? "text-blue-500 font-semibold" : isDark ? "text-slate-300 hover:bg-white/[0.06]" : "text-slate-700 hover:bg-slate-50"}`}>
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* review grid: 1-col mobile → 2-col desktop */}
          {visible.length === 0 ? (
            <div className={`rounded-2xl p-8 text-center border ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05]"}`}>
              <Star size={26} className="mx-auto mb-2 text-slate-400" />
              <p className={`text-[13px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>No reviews match your filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
              {visible.map(r => (
                <ReviewCard key={r.id} review={r} isDark={isDark}
                  onReply={postReply} onFlag={handleFlag} onHelpful={handleHelpful} />
              ))}
            </div>
          )}

          {/* load more */}
          <div className="mt-5">
            {loadingMore && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[...Array(2)].map((_, i) => <ReviewSkeleton key={i} isDark={isDark} />)}
              </div>
            )}
            {!loadingMore && hasMore && (
              <button onClick={loadMore}
                className={`w-full h-11 rounded-[13px] flex items-center justify-center gap-2 text-[13px] font-semibold border transition-all active:scale-[0.97]
                  ${isDark ? "bg-[#131c2d] border-white/[0.08] text-slate-300" : "bg-white border-slate-200 text-slate-600"}`}>
                Load More Reviews
              </button>
            )}
            {!loadingMore && !hasMore && loaded > 0 && (
              <div className="flex items-center gap-3 py-2">
                <div className={`flex-1 h-px ${isDark ? "bg-white/[0.06]" : "bg-slate-200"}`} />
                <p className={`text-[12px] font-medium text-center ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                  All {totalReviewsFromAnalytics} reviews loaded
                </p>
                <div className={`flex-1 h-px ${isDark ? "bg-white/[0.06]" : "bg-slate-200"}`} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}