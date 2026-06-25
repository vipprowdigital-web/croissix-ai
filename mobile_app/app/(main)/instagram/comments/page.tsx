"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
  RefreshCw,
  MessageCircle,
  CornerDownRight,
  Send,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  WifiOff,
  ExternalLink,
  X,
  Loader2,
  Search,
  Brain,
  Sparkles,
  Copy,
  Check,
  Clock,
  AlertCircle,
  Zap,
  CheckSquare,
  Square,
  Pencil,
} from "lucide-react";
import { API } from "@/lib/axiosClient";
import { getAuthHeader } from "@/lib/token";

/* ═══════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════ */
interface IgReply {
  id: string;
  text: string;
  username: string;
  timestamp: string;
}

interface IgComment {
  commentId: string;
  commentText: string;
  username: string;
  timestamp: string;
  mediaId: string;
  mediaCaption: string;
  mediaUrl: string | null;
  mediaPermalink: string;
  mediaType: string;
  replies: IgReply[];
}

interface CommentsResponse {
  success: boolean;
  count: number;
  nextMediaCursor: string | null;
  hasMoreMedia: boolean;
  data: IgComment[];
}

type AIItemStatus =
  | "pending"
  | "thinking"
  | "writing"
  | "posting"
  | "done"
  | "failed";

interface AICommentItem {
  commentId: string;
  username: string;
  commentText: string;
  status: AIItemStatus;
  reply?: string;
}

/* ═══════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════ */
const IG_GRADIENT =
  "linear-gradient(135deg, #833ab4 0%, #C13584 45%, #fd1d1d 80%, #fcb045 100%)";
const IG_ACCENT = "#C13584";
const MEDIA_BATCH = 6;

const AI_PHASES = [
  "Analysing comment sentiment…",
  "Identifying tone & intent…",
  "Crafting a personalised reply…",
  "Reviewing for professionalism…",
  "Adding engagement hooks…",
  "Finalising response…",
];

/* ═══════════════════════════════════════════════════════
   API
═══════════════════════════════════════════════════════ */
async function fetchComments(
  mediaLimit: number,
  mediaCursor?: string | null,
): Promise<CommentsResponse> {
  const res = await API.get("/instagram/comments", {
    params: {
      mediaLimit,
      commentLimit: 50,
      ...(mediaCursor ? { mediaCursor } : {}),
    },
  });
  if (!res.data.success)
    throw new Error(res.data.message ?? "Failed to fetch comments");
  return res.data;
}

async function postReply(commentId: string, message: string): Promise<void> {
  const res = await API.post("/instagram/comments/reply", {
    commentId,
    message,
  });
  if (!res.data.success)
    throw new Error(res.data.message ?? "Failed to post reply");
}

async function deleteComment(commentId: string): Promise<void> {
  const res = await API.delete(`/instagram/comments/${commentId}`);
  if (!res.data.success)
    throw new Error(res.data.message ?? "Failed to delete comment");
}

/* ═══════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════ */
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const AV_COLORS = [
  "#833ab4",
  "#C13584",
  "#fd1d1d",
  "#fcb045",
  "#6366f1",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
];
function avColor(name: string) {
  return AV_COLORS[name.charCodeAt(0) % AV_COLORS.length];
}
function mkInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ═══════════════════════════════════════════════════════
   SKELETON
═══════════════════════════════════════════════════════ */
function CommentSkeleton({ dark }: { dark: boolean }) {
  const shimmer = dark ? "bg-white/[0.05]" : "bg-pink-100/50";
  return (
    <div
      className={`rounded-2xl border p-4 ${dark ? "bg-[#130820] border-pink-900/30" : "bg-white border-pink-100/80"}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-8 h-8 rounded-full shrink-0 animate-pulse ${shimmer}`}
        />
        <div className="flex-1">
          <div className={`h-2.5 w-24 rounded mb-2 animate-pulse ${shimmer}`} />
          <div
            className={`h-2 w-full rounded mb-1.5 animate-pulse ${shimmer}`}
          />
          <div className={`h-2 w-3/4 rounded animate-pulse ${shimmer}`} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DELETE MODAL
═══════════════════════════════════════════════════════ */
function DeleteModal({
  dark,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  dark: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(10px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onCancel();
      }}
    >
      <div
        className={`w-full max-w-sm rounded-3xl overflow-hidden border shadow-2xl ${dark ? "bg-[#130820] border-pink-900/40" : "bg-white border-pink-100"}`}
      >
        <div
          className="h-1 w-full"
          style={{ background: "linear-gradient(90deg,#ef4444,#f87171)" }}
        />
        <div className="p-6 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <Trash2 size={22} className="text-red-400" />
          </div>
          <h3
            className={`text-[17px] font-black mb-1 ${dark ? "text-white" : "text-slate-900"}`}
          >
            Delete Comment?
          </h3>
          <p
            className={`text-[12px] mb-5 ${dark ? "text-slate-400" : "text-slate-500"}`}
          >
            This will permanently remove the comment from Instagram.
          </p>
          <div className="flex gap-2.5">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className={`flex-1 py-3 rounded-2xl text-[13px] font-bold border transition-all active:scale-95 ${dark ? "bg-white/[0.04] border-white/[0.08] text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"}`}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 py-3 rounded-2xl text-[13px] font-black text-white flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg,#dc2626,#ef4444)",
                boxShadow: "0 6px 20px rgba(239,68,68,0.35)",
              }}
            >
              {isDeleting ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Deleting…
                </>
              ) : (
                <>
                  <Trash2 size={13} /> Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   AI BULK REPLY MODAL
═══════════════════════════════════════════════════════ */
function AIBulkReplyModal({
  items,
  dark,
  onClose,
  isComplete,
}: {
  items: AICommentItem[];
  dark: boolean;
  onClose: () => void;
  isComplete: boolean;
}) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [barWidth, setBarWidth] = useState(0);
  const [particles, setParticles] = useState<
    { x: number; y: number; s: number; d: number; o: number }[]
  >([]);

  const done = items.filter((i) => i.status === "done").length;
  const failed = items.filter((i) => i.status === "failed").length;
  const pending = items.filter((i) => i.status === "pending");
  const completed = items.filter(
    (i) => i.status === "done" || i.status === "failed",
  );
  const active = items.find((i) =>
    ["thinking", "writing", "posting"].includes(i.status),
  );
  const pct =
    items.length > 0 ? Math.round(((done + failed) / items.length) * 100) : 0;

  useEffect(() => {
    setParticles(
      Array.from({ length: 18 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        s: 2 + Math.random() * 3,
        d: 4 + Math.random() * 8,
        o: 0.15 + Math.random() * 0.35,
      })),
    );
  }, []);

  useEffect(() => {
    const target = isComplete ? 100 : pct;
    const interval = setInterval(() => {
      setBarWidth((prev) =>
        Math.abs(prev - target) < 0.5 ? target : prev + (target - prev) * 0.08,
      );
    }, 40);
    return () => clearInterval(interval);
  }, [pct, isComplete]);

  useEffect(() => {
    if (isComplete) return;
    const id = setInterval(
      () => setPhaseIdx((p) => (p + 1) % AI_PHASES.length),
      1800,
    );
    return () => clearInterval(id);
  }, [isComplete]);

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-end md:justify-center"
      style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-xl" />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.s,
              height: p.s,
              background: IG_ACCENT,
              opacity: p.o,
              animation: `ig-float-${i % 4} ${p.d}s ease-in-out infinite alternate`,
            }}
          />
        ))}
        <style>{`
          @keyframes ig-float-0{0%{transform:translate(0,0)}100%{transform:translate(12px,-18px)}}
          @keyframes ig-float-1{0%{transform:translate(0,0)}100%{transform:translate(-10px,14px)}}
          @keyframes ig-float-2{0%{transform:translate(0,0)}100%{transform:translate(16px,10px)}}
          @keyframes ig-float-3{0%{transform:translate(0,0)}100%{transform:translate(-8px,-12px)}}
          @keyframes ig-spin-slow{from{transform:rotate(0)}to{transform:rotate(360deg)}}
          @keyframes ig-pulse-ring{0%{transform:scale(1);opacity:0.6}100%{transform:scale(1.6);opacity:0}}
          @keyframes ig-shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}
          @keyframes ig-bounce-dot{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        `}</style>
      </div>

      {/* Panel */}
      <div
        className="relative w-full md:max-w-lg md:rounded-3xl rounded-t-[28px] overflow-hidden max-h-[90vh] flex flex-col"
        style={{
          background: dark ? "#0d0814" : "#fff",
          boxShadow:
            "0 -24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(193,53,132,0.2)",
        }}
      >
        {/* IG shimmer top line */}
        <div className="h-[1.5px]" style={{ background: IG_GRADIENT }} />

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div
            className={`w-9 h-1 rounded-full ${dark ? "bg-white/20" : "bg-slate-200"}`}
          />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-4 flex items-start gap-4">
          <div
            className="relative shrink-0 flex items-center justify-center"
            style={{ width: 64, height: 64 }}
          >
            {!isComplete &&
              [1, 2].map((i) => (
                <div
                  key={i}
                  className="absolute inset-0 rounded-full border border-pink-500/40"
                  style={{
                    animation: `ig-pulse-ring ${1.4 + i * 0.5}s ease-out infinite`,
                    animationDelay: `${i * 0.4}s`,
                  }}
                />
              ))}
            <div
              className="absolute inset-0 rounded-full border-2 border-dashed border-pink-500/30"
              style={{
                animation: isComplete
                  ? "none"
                  : "ig-spin-slow 8s linear infinite",
              }}
            />
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: isComplete
                  ? "linear-gradient(135deg,#16a34a,#22c55e)"
                  : IG_GRADIENT,
                boxShadow: isComplete
                  ? "0 0 24px rgba(34,197,94,0.5)"
                  : "0 0 24px rgba(193,53,132,0.5)",
              }}
            >
              {isComplete ? (
                <CheckCircle2 size={26} className="text-white" />
              ) : (
                <Brain size={26} className="text-white" />
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p
                className={`text-[17px] font-black ${dark ? "text-white" : "text-slate-900"}`}
                style={{ letterSpacing: "-0.03em" }}
              >
                {isComplete ? "All Done!" : "AI Auto-Reply"}
              </p>
              {!isComplete && (
                <div
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(193,53,132,0.12)",
                    border: "1px solid rgba(193,53,132,0.25)",
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                  <span className="text-[9px] font-black text-pink-400 uppercase tracking-wide">
                    Live
                  </span>
                </div>
              )}
            </div>
            <p
              className={`text-[11px] font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}
            >
              {isComplete
                ? `${done} replies posted · ${failed > 0 ? `${failed} failed` : "all successful"}`
                : `Generating replies · ${done}/${items.length} done`}
            </p>
          </div>

          {isComplete && (
            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${dark ? "bg-white/[0.08]" : "bg-slate-100"}`}
            >
              <X
                size={14}
                className={dark ? "text-slate-400" : "text-slate-600"}
              />
            </button>
          )}
        </div>

        {/* Progress */}
        <div className="px-5 mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span
              className={`text-[10px] font-black uppercase tracking-widest ${dark ? "text-slate-600" : "text-slate-400"}`}
            >
              Progress
            </span>
            <span
              className={`text-[11px] font-black ${dark ? "text-white" : "text-slate-900"}`}
            >
              {Math.round(barWidth)}%
            </span>
          </div>
          <div
            className={`h-2.5 rounded-full overflow-hidden ${dark ? "bg-white/[0.06]" : "bg-slate-100"}`}
          >
            <div
              className="h-full rounded-full relative overflow-hidden"
              style={{
                width: `${barWidth}%`,
                background: isComplete
                  ? "linear-gradient(90deg,#16a34a,#22c55e)"
                  : "linear-gradient(90deg,#833ab4,#C13584,#fd1d1d)",
                boxShadow: isComplete
                  ? "0 0 10px rgba(34,197,94,0.5)"
                  : "0 0 10px rgba(193,53,132,0.6)",
                transition: "width 0.3s ease",
              }}
            >
              {!isComplete && (
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.25) 50%,transparent 100%)",
                    animation: "ig-shimmer 1.5s linear infinite",
                  }}
                />
              )}
            </div>
          </div>
          <div className="flex gap-3 mt-2">
            {[
              { label: "Total", value: items.length, color: IG_ACCENT },
              { label: "Done", value: done, color: "#22c55e" },
              { label: "Queue", value: pending.length, color: "#f59e0b" },
              { label: "Failed", value: failed, color: "#ef4444" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-1">
                <span
                  className="text-[13px] font-black"
                  style={{ color: s.color }}
                >
                  {s.value}
                </span>
                <span
                  className={`text-[9.5px] font-bold ${dark ? "text-slate-600" : "text-slate-400"}`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Phase label */}
        {!isComplete && (
          <div className="px-5 mb-3">
            <div
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border ${dark ? "bg-pink-500/[0.06] border-pink-900/50" : "bg-pink-50 border-pink-200/60"}`}
            >
              <div className="flex gap-0.5 shrink-0">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-pink-400"
                    style={{
                      animation: "ig-bounce-dot 1s ease-in-out infinite",
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
              <p
                className={`text-[11.5px] font-semibold flex-1 ${dark ? "text-pink-300" : "text-pink-700"}`}
              >
                {AI_PHASES[phaseIdx]}
              </p>
              <div className="flex items-center gap-1 shrink-0">
                <Sparkles size={10} className="text-pink-400" />
                <span className="text-[9px] font-black text-pink-400">
                  AI Agent
                </span>
              </div>
            </div>
          </div>
        )}

        <div
          className={`h-px mx-5 mb-3 ${dark ? "bg-white/[0.05]" : "bg-slate-100"}`}
        />

        {/* List */}
        <div
          className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-2.5"
          style={{ scrollbarWidth: "none" }}
        >
          {/* Active */}
          {active && (
            <div className="mb-1">
              <p
                className={`text-[9.5px] font-black uppercase tracking-widest mb-2 ${dark ? "text-slate-600" : "text-slate-400"}`}
              >
                Currently Processing
              </p>
              <div
                className={`rounded-2xl border overflow-hidden ${dark ? "bg-[#1a0a2e] border-pink-900/50" : "bg-pink-50 border-pink-200/60"}`}
                style={{ boxShadow: "0 0 20px rgba(193,53,132,0.12)" }}
              >
                <div
                  className="h-[1.5px]"
                  style={{
                    background: IG_GRADIENT,
                    animation: "ig-shimmer 1.5s linear infinite",
                  }}
                />
                <div className="p-3.5">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-black shrink-0"
                      style={{ background: avColor(active.username) }}
                    >
                      {mkInitials(active.username)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-[12px] font-bold mb-0.5 ${dark ? "text-white" : "text-slate-900"}`}
                      >
                        @{active.username}
                      </p>
                      {active.commentText && (
                        <p
                          className={`text-[10.5px] leading-relaxed line-clamp-2 ${dark ? "text-slate-400" : "text-slate-600"}`}
                        >
                          {active.commentText}
                        </p>
                      )}
                    </div>
                  </div>
                  <div
                    className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-xl ${dark ? "bg-white/[0.04]" : "bg-white/60"}`}
                  >
                    <div className="flex gap-0.5">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1 h-1 rounded-full bg-pink-400"
                          style={{
                            animation: "ig-bounce-dot 1s ease-in-out infinite",
                            animationDelay: `${i * 0.12}s`,
                          }}
                        />
                      ))}
                    </div>
                    <p
                      className={`text-[11px] font-semibold ${dark ? "text-pink-300" : "text-pink-600"}`}
                    >
                      {active.status === "thinking" && "Analysing comment…"}
                      {active.status === "writing" && "Generating AI reply…"}
                      {active.status === "posting" && "Posting to Instagram…"}
                    </p>
                  </div>
                  {active.reply && (
                    <div
                      className={`mt-2 px-3 py-2 rounded-xl border-l-2 border-pink-500 ${dark ? "bg-white/[0.03]" : "bg-white/50"}`}
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-pink-400">
                        Reply Preview
                      </p>
                      <p
                        className={`text-[11px] leading-relaxed line-clamp-3 ${dark ? "text-slate-300" : "text-slate-700"}`}
                      >
                        {active.reply}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <div>
              <p
                className={`text-[9.5px] font-black uppercase tracking-widest mb-2 ${dark ? "text-slate-600" : "text-slate-400"}`}
              >
                Completed ({completed.length})
              </p>
              <div className="flex flex-col gap-2">
                {[...completed].reverse().map((item) => (
                  <div
                    key={item.commentId}
                    className={`flex items-start gap-3 px-3.5 py-3 rounded-2xl border ${dark ? "bg-white/[0.025] border-white/[0.05]" : "bg-white border-slate-100"}`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-black shrink-0"
                      style={{
                        background: avColor(item.username),
                        opacity: 0.85,
                      }}
                    >
                      {mkInitials(item.username)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-[11.5px] font-bold truncate ${dark ? "text-slate-300" : "text-slate-700"}`}
                      >
                        @{item.username}
                      </p>
                      {item.reply && (
                        <p
                          className={`text-[10px] leading-relaxed line-clamp-2 ${dark ? "text-slate-500" : "text-slate-400"}`}
                        >
                          {item.reply}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 mt-0.5">
                      {item.status === "done" ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center">
                          <CheckCircle2
                            size={12}
                            className="text-emerald-400"
                          />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-red-500/15 flex items-center justify-center">
                          <X size={10} className="text-red-400" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Queue */}
          {pending.length > 0 && !isComplete && (
            <div className="mt-1">
              <p
                className={`text-[9.5px] font-black uppercase tracking-widest mb-2 ${dark ? "text-slate-600" : "text-slate-400"}`}
              >
                Queue ({pending.length})
              </p>
              <div className="flex flex-col gap-1.5">
                {pending.slice(0, 4).map((item) => (
                  <div
                    key={item.commentId}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl ${dark ? "bg-white/[0.015]" : "bg-slate-50"}`}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0"
                      style={{
                        background: avColor(item.username),
                        opacity: 0.5,
                      }}
                    >
                      {item.username[0]?.toUpperCase()}
                    </div>
                    <p
                      className={`text-[10.5px] flex-1 truncate ${dark ? "text-slate-600" : "text-slate-400"}`}
                    >
                      @{item.username}
                    </p>
                    <Clock
                      size={10}
                      className={dark ? "text-slate-700" : "text-slate-300"}
                    />
                  </div>
                ))}
                {pending.length > 4 && (
                  <p
                    className={`text-[10px] text-center font-medium ${dark ? "text-slate-700" : "text-slate-400"}`}
                  >
                    +{pending.length - 4} more in queue
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Complete state */}
          {isComplete && (
            <div
              className={`rounded-2xl border p-5 flex flex-col items-center text-center ${dark ? "bg-emerald-500/[0.06] border-emerald-900/40" : "bg-emerald-50 border-emerald-200/60"}`}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                style={{
                  background: "linear-gradient(135deg,#16a34a,#22c55e)",
                  boxShadow: "0 8px 24px rgba(34,197,94,0.35)",
                }}
              >
                <CheckCircle2 size={28} className="text-white" />
              </div>
              <p
                className={`text-[14px] font-black mb-1 ${dark ? "text-emerald-300" : "text-emerald-700"}`}
              >
                {done} replies posted successfully!
              </p>
              <p
                className={`text-[11px] mb-4 ${dark ? "text-emerald-400/60" : "text-emerald-600"}`}
              >
                {failed > 0
                  ? `${failed} failed — see details above.`
                  : "All comments have been replied to."}
              </p>
              <button
                onClick={onClose}
                className="px-8 py-2.5 rounded-2xl text-white text-[13px] font-black transition-all active:scale-95"
                style={{
                  background: "linear-gradient(135deg,#16a34a,#22c55e)",
                  boxShadow: "0 8px 24px rgba(34,197,94,0.35)",
                }}
              >
                View Results
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   BULK REPLY MODAL
═══════════════════════════════════════════════════════ */
function BulkReplyModal({
  comments,
  dark,
  onClose,
  onSuccess,
}: {
  comments: IgComment[];
  dark: boolean;
  onClose: () => void;
  onSuccess: (succeeded: { commentId: string; message: string }[]) => void;
}) {
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    new Set(comments.map((c) => c.commentId)),
  );
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<
    { commentId: string; success: boolean; error?: string }[]
  >([]);
  const [showResults, setShowResults] = useState(false);

  const toggleAll = () => {
    if (selected.size === comments.length) setSelected(new Set());
    else setSelected(new Set(comments.map((c) => c.commentId)));
  };
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    if (!message.trim() || selected.size === 0) return;
    setSending(true);
    const resultData: {
      commentId: string;
      success: boolean;
      error?: string;
    }[] = [];
    const succeeded: { commentId: string; message: string }[] = [];

    await Promise.allSettled(
      Array.from(selected).map(async (commentId) => {
        try {
          await postReply(commentId, message.trim());
          resultData.push({ commentId, success: true });
          succeeded.push({ commentId, message: message.trim() });
        } catch (e: any) {
          resultData.push({
            commentId,
            success: false,
            error: e.message ?? "Failed",
          });
        }
      }),
    );

    setResults(resultData);
    setShowResults(true);
    if (succeeded.length > 0) onSuccess(succeeded);
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative w-full max-w-lg rounded-3xl border overflow-hidden flex flex-col max-h-[85vh] ${dark ? "bg-[#0d0814] border-pink-900/40" : "bg-white border-pink-100"}`}
        style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }}
      >
        {/* IG top accent */}
        <div className="h-[2px]" style={{ background: IG_GRADIENT }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <Zap size={16} style={{ color: IG_ACCENT }} />
            <h3
              className={`text-[15px] font-black ${dark ? "text-white" : "text-slate-900"}`}
            >
              Bulk Reply
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`w-7 h-7 rounded-full flex items-center justify-center ${dark ? "bg-white/[0.08] text-slate-400" : "bg-slate-100 text-slate-500"}`}
          >
            <X size={13} />
          </button>
        </div>

        <div
          className={`h-px mx-5 mb-3 ${dark ? "bg-pink-900/30" : "bg-pink-50"}`}
        />

        <div
          className="overflow-y-auto flex-1 px-5 pb-5"
          style={{ scrollbarWidth: "none" }}
        >
          {showResults ? (
            <>
              <p
                className={`text-[10px] font-black uppercase tracking-widest mb-3 ${dark ? "text-slate-600" : "text-slate-400"}`}
              >
                Results
              </p>
              <div className="flex flex-col gap-2 mb-4">
                {results.map((r) => {
                  const c = comments.find((c) => c.commentId === r.commentId);
                  return (
                    <div
                      key={r.commentId}
                      className={`flex items-start gap-3 px-3 py-2.5 rounded-xl border ${
                        r.success
                          ? dark
                            ? "bg-emerald-500/[0.06] border-emerald-500/20"
                            : "bg-emerald-50 border-emerald-200/60"
                          : dark
                            ? "bg-red-500/[0.06] border-red-500/20"
                            : "bg-red-50 border-red-200/60"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${r.success ? "bg-emerald-500" : "bg-red-500"}`}
                      >
                        <span className="text-white text-[10px] font-black">
                          {r.success ? "✓" : "✕"}
                        </span>
                      </div>
                      <div>
                        <p
                          className={`text-[12px] font-bold ${dark ? "text-white" : "text-slate-900"}`}
                        >
                          @{c?.username ?? r.commentId}
                        </p>
                        {!r.success && (
                          <p className="text-[11px] text-red-400 mt-0.5">
                            {r.error}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={onClose}
                className="w-full h-10 rounded-2xl text-white text-[13px] font-bold"
                style={{ background: IG_GRADIENT }}
              >
                Done
              </button>
            </>
          ) : (
            <>
              <p
                className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${dark ? "text-slate-500" : "text-slate-400"}`}
              >
                Reply Message
              </p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="Type a reply to send to all selected comments…"
                className={`w-full rounded-xl p-3 text-[13.5px] resize-none outline-none border mb-1 transition-all ${
                  dark
                    ? "bg-[#1a0a2e] text-white placeholder:text-slate-600 border-pink-900/40 focus:border-pink-500/50"
                    : "bg-pink-50/50 text-slate-900 placeholder:text-slate-400 border-pink-100 focus:border-pink-300"
                }`}
              />
              <p
                className={`text-[10px] text-right mb-4 ${dark ? "text-slate-600" : "text-slate-400"}`}
              >
                {message.length}/1000
              </p>

              <div className="flex items-center justify-between mb-2">
                <p
                  className={`text-[11px] font-bold uppercase tracking-widest ${dark ? "text-slate-500" : "text-slate-400"}`}
                >
                  Select Comments ({selected.size}/{comments.length})
                </p>
                <button
                  onClick={toggleAll}
                  className="text-[12px] font-bold"
                  style={{ color: IG_ACCENT }}
                >
                  {selected.size === comments.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              </div>

              <div className="flex flex-col gap-1.5 mb-4">
                {comments.map((c) => {
                  const isSel = selected.has(c.commentId);
                  return (
                    <button
                      key={c.commentId}
                      onClick={() => toggleOne(c.commentId)}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                        isSel
                          ? dark
                            ? "bg-pink-500/[0.08] border-pink-500/40"
                            : "bg-pink-50 border-pink-200"
                          : dark
                            ? "bg-white/[0.02] border-white/[0.05]"
                            : "bg-white border-slate-100"
                      }`}
                    >
                      {isSel ? (
                        <CheckSquare
                          size={16}
                          style={{ color: IG_ACCENT }}
                          className="shrink-0 mt-0.5"
                        />
                      ) : (
                        <Square
                          size={16}
                          className={`shrink-0 mt-0.5 ${dark ? "text-slate-600" : "text-slate-300"}`}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-[12px] font-bold truncate ${dark ? "text-slate-200" : "text-slate-800"}`}
                        >
                          @{c.username}
                        </p>
                        <p
                          className={`text-[11px] line-clamp-1 mt-0.5 ${dark ? "text-slate-500" : "text-slate-400"}`}
                        >
                          {c.commentText}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleSend}
                disabled={!message.trim() || selected.size === 0 || sending}
                className="w-full h-11 rounded-2xl text-white text-[13px] font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-40"
                style={{
                  background: IG_GRADIENT,
                  boxShadow: "0 4px 16px rgba(193,53,132,0.4)",
                }}
              >
                {sending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    <Zap size={14} /> Reply to {selected.size} Comment
                    {selected.size !== 1 ? "s" : ""}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   COMMENT CARD
═══════════════════════════════════════════════════════ */
function CommentCard({
  comment,
  dark,
  onDelete,
  onReplySuccess,
  isReplied,
  onReplyPosted,
}: {
  comment: IgComment;
  dark: boolean;
  onDelete: (id: string) => void;
  onReplySuccess: () => void;
  isReplied: boolean;
  onReplyPosted: (commentId: string) => void;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [copied, setCopied] = useState(false);

  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [isEditSaving, setIsEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [deletingReplyId, setDeletingReplyId] = useState<string | null>(null);
  const [isDeletingReply, setIsDeletingReply] = useState(false);

  const replyMut = useMutation({
    mutationFn: ({
      commentId,
      message,
    }: {
      commentId: string;
      message: string;
    }) => postReply(commentId, message),
    onSuccess: () => {
      onReplyPosted(comment.commentId);
      setReplyText("");
      setReplyOpen(false);
      onReplySuccess();
    },
  });

  const generateAIReply = async () => {
    try {
      setAiGenerating(true);
      setAiError("");
      const res = await fetch("/api/ai/instagram-comment-reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: getAuthHeader() ?? "",
        },
        body: JSON.stringify({
          commentText: comment.commentText,
          commenterName: comment.username,
        }),
      });
      const json = await res.json();
      if (!json.success && !json.reply)
        throw new Error(json.error || "AI generation failed");
      setReplyText(json.reply ?? json.message ?? "");
    } catch (e: any) {
      setAiError(e.message || "Failed to generate AI reply");
    } finally {
      setAiGenerating(false);
    }
  };

  const sendReply = () => {
    if (replyText.trim())
      replyMut.mutate({
        commentId: comment.commentId,
        message: replyText.trim(),
      });
  };

  const startEditReply = (reply: IgReply) => {
    setEditingReplyId(reply.id);
    setEditText(reply.text);
    setEditError("");
  };

  const cancelEditReply = () => {
    setEditingReplyId(null);
    setEditText("");
    setEditError("");
  };

  const saveEditReply = async (reply: IgReply) => {
    if (!editText.trim() || editText.trim() === reply.text) {
      cancelEditReply();
      return;
    }
    try {
      setIsEditSaving(true);
      setEditError("");
      await deleteComment(reply.id);
      await postReply(comment.commentId, editText.trim());
      cancelEditReply();
      onReplySuccess();
    } catch (e: any) {
      setEditError(e.message || "Failed to update reply");
    } finally {
      setIsEditSaving(false);
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    try {
      setIsDeletingReply(true);
      await deleteComment(replyId);
      setDeletingReplyId(null);
      onReplySuccess();
    } catch {
      setDeletingReplyId(null);
    } finally {
      setIsDeletingReply(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border overflow-hidden ${dark ? "bg-[#130820] border-pink-900/30" : "bg-white border-pink-100/80 shadow-sm"} ${isReplied ? (dark ? "border-emerald-500/20" : "border-emerald-200/60") : ""}`}
    >
      {/* Media thumbnail */}
      {comment.mediaUrl && (
        <div className="relative h-24 overflow-hidden">
          <img
            src={comment.mediaUrl!}
            alt=""
            className="w-full h-full object-cover opacity-70"
            onError={(e) => {
              (e.currentTarget.parentElement as HTMLElement).style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-2 left-3 right-10">
            <p className="text-white text-[10px] line-clamp-1">
              {comment.mediaCaption || "Post"}
            </p>
          </div>
          <a
            href={comment.mediaPermalink}
            target="_blank"
            rel="noreferrer"
            className="absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={10} className="text-white" />
          </a>
        </div>
      )}

      <div className="py-4 px-2">
        <div className="flex items-start gap-3 mb-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-[12px] font-black"
            style={{ background: avColor(comment.username) }}
          >
            {mkInitials(comment.username)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <div className="flex flex-col gap-1">
                <p
                  className="text-[10px] sm:text-[12.5px] font-black"
                  style={{ color: IG_ACCENT }}
                >
                  @{comment.username}
                </p>
                <p
                  className="text-[8px] sm:text-[10px]"
                  style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}
                >
                  {formatDate(comment.timestamp)}
                </p>
              </div>
              {isReplied && (
                <span
                  className={`text-[9px] font-bold border rounded-full px-2 py-0.5 ${dark ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}
                >
                  Replied
                </span>
              )}
            </div>
            <p
              className={`text-[10px] sm:text-[12px] leading-relaxed ${dark ? "text-slate-200" : "text-slate-800"}`}
            >
              {comment.commentText}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => {
                setReplyOpen((v) => !v);
                setAiError("");
              }}
              title="Reply"
              className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all active:scale-90 ${dark ? "text-slate-500 hover:text-pink-400 hover:bg-pink-500/10" : "text-slate-400 hover:text-pink-500 hover:bg-pink-50"}`}
            >
              <CornerDownRight size={13} />
            </button>
            <button
              onClick={() => onDelete(comment.commentId)}
              title="Delete"
              className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all active:scale-90 ${dark ? "text-slate-600 hover:text-red-400 hover:bg-red-500/10" : "text-slate-300 hover:text-red-500 hover:bg-red-50"}`}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Existing replies */}
        {comment.replies.length > 0 && (
          <div className="ml-5 space-y-2 mb-3">
            {comment.replies.map((reply) => (
              <div
                key={reply.id}
                className={`rounded-xl p-2.5 border ${dark ? "bg-white/[0.03] border-pink-900/20" : "bg-pink-50/40 border-pink-100/60"}`}
              >
                {editingReplyId === reply.id ? (
                  <div>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                      autoFocus
                      className={`w-full rounded-lg p-2 text-[12px] resize-none outline-none border mb-2 ${
                        dark
                          ? "bg-white/[0.05] text-white placeholder:text-slate-600 border-pink-900/40 focus:border-pink-500/50"
                          : "bg-white text-slate-900 placeholder:text-slate-400 border-pink-200 focus:border-pink-300"
                      }`}
                    />
                    {editError && (
                      <p className="text-[10.5px] text-red-400 mb-1.5 flex items-center gap-1">
                        <AlertCircle size={10} /> {editError}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEditReply(reply)}
                        disabled={isEditSaving || !editText.trim()}
                        className="flex items-center gap-1 h-6 px-3 rounded-lg text-[11px] font-bold text-white disabled:opacity-50 transition-all active:scale-95"
                        style={{ background: IG_GRADIENT }}
                      >
                        {isEditSaving ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : (
                          <Check size={10} />
                        )}
                        Save
                      </button>
                      <button
                        onClick={cancelEditReply}
                        disabled={isEditSaving}
                        className={`flex items-center gap-1 h-6 px-3 rounded-lg text-[11px] font-bold border transition-all active:scale-95 ${dark ? "bg-white/[0.05] border-white/[0.08] text-slate-400" : "bg-white border-slate-200 text-slate-500"}`}
                      >
                        <X size={10} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : deletingReplyId === reply.id ? (
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-[9px] sm:text-[11px] font-semibold ${dark ? "text-red-400" : "text-red-500"}`}
                    >
                      Delete this reply?
                    </p>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => handleDeleteReply(reply.id)}
                        disabled={isDeletingReply}
                        className="flex items-center gap-1 h-6 px-2.5 rounded-lg text-[11px] font-bold text-white disabled:opacity-50 transition-all active:scale-95"
                        style={{
                          background: "linear-gradient(135deg,#dc2626,#ef4444)",
                        }}
                      >
                        {isDeletingReply ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : (
                          <Trash2 size={10} />
                        )}
                        Delete
                      </button>
                      <button
                        onClick={() => setDeletingReplyId(null)}
                        disabled={isDeletingReply}
                        className={`flex items-center gap-1 h-6 px-2.5 rounded-lg text-[11px] font-bold border transition-all active:scale-95 ${dark ? "bg-white/[0.05] border-white/[0.08] text-slate-400" : "bg-white border-slate-200 text-slate-500"}`}
                      >
                        <X size={10} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex flex-col">
                        <p
                          className="text-[10px] sm:text-[11px] font-black"
                          style={{ color: IG_ACCENT }}
                        >
                          @{reply.username}
                        </p>
                        <p
                          className="text-[9.5px]"
                          style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}
                        >
                          {formatDate(reply.timestamp)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditReply(reply)}
                          title="Edit reply"
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-all active:scale-90 ${dark ? "text-slate-600 hover:text-pink-400 hover:bg-pink-500/10" : "text-slate-300 hover:text-pink-500 hover:bg-pink-50"}`}
                        >
                          <Pencil size={10} />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingReplyId(reply.id);
                            cancelEditReply();
                          }}
                          title="Delete reply"
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-all active:scale-90 ${dark ? "text-slate-600 hover:text-red-400 hover:bg-red-500/10" : "text-slate-300 hover:text-red-500 hover:bg-red-50"}`}
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                    <p
                      className={`text-[10px] sm:text-[12px] ${dark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      {reply.text}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Reply composer */}
        {replyOpen && (
          <div className="ml-11">
            {/* AI Reply button row */}
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={generateAIReply}
                disabled={aiGenerating}
                className={`flex items-center gap-1.5 h-7 px-3 rounded-xl text-[11.5px] font-semibold transition-all active:scale-95 disabled:opacity-60 border
                  ${dark ? "bg-pink-500/15 text-pink-400 border-pink-500/25" : "bg-pink-50 text-pink-600 border-pink-200"}`}
              >
                {aiGenerating ? (
                  <>
                    <RefreshCw size={11} className="animate-spin" /> Generating…
                  </>
                ) : (
                  <>
                    <Sparkles size={11} /> AI Reply
                  </>
                )}
              </button>
              {replyText && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(replyText);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${dark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}`}
                >
                  {copied ? (
                    <Check size={12} className="text-emerald-400" />
                  ) : (
                    <Copy size={12} />
                  )}
                </button>
              )}
            </div>

            {aiError && (
              <div
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl mb-2 border text-[11px] ${dark ? "bg-red-500/[0.07] border-red-900/40 text-red-400" : "bg-red-50 border-red-200/60 text-red-600"}`}
              >
                <AlertCircle size={11} className="shrink-0" /> {aiError}
              </div>
            )}

            <div
              className={`flex items-center gap-2 rounded-xl border px-3 py-1 ${dark ? "bg-white/[0.04] border-pink-900/30" : "bg-pink-50/50 border-pink-200/60"}`}
            >
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply… or tap AI Reply"
                className={`flex-1 bg-transparent outline-none  text-[10px] sm:text-[12.5px] ${dark ? "text-white placeholder:text-slate-600" : "text-slate-800 placeholder:text-slate-400"}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && replyText.trim()) {
                    e.preventDefault();
                    sendReply();
                  }
                }}
                autoFocus
              />
              <button
                onClick={sendReply}
                disabled={!replyText.trim() || replyMut.isPending}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white transition-all active:scale-90 disabled:opacity-40"
                style={{ background: IG_GRADIENT }}
              >
                {replyMut.isPending ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Send size={12} />
                )}
              </button>
              <button
                onClick={() => {
                  setReplyOpen(false);
                  setReplyText("");
                  setAiError("");
                }}
              >
                <X size={13} style={{ color: dark ? "#6b4f7a" : "#94a3b8" }} />
              </button>
            </div>
            {replyMut.isError && (
              <p className="text-[10.5px] text-red-400 mt-1 ml-1">
                {(replyMut.error as Error)?.message ?? "Failed to post reply"}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════ */
export default function InstagramCommentsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";

  const router = useRouter();
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  // Data state
  const [allComments, setAllComments] = useState<IgComment[]>([]);
  const [nextMediaCursor, setNextMediaCursor] = useState<string | null>(null);
  const [hasMoreMedia, setHasMoreMedia] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Replied tracking
  const [repliedIds, setRepliedIds] = useState<Set<string>>(new Set());

  // AI modal state
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiItems, setAiItems] = useState<AICommentItem[]>([]);
  const [aiComplete, setAiComplete] = useState(false);

  // Bulk reply modal state
  const [showBulkModal, setShowBulkModal] = useState(false);

  // UI state
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(""), 3000);
  };

  const seedRepliedIds = (comments: IgComment[]) => {
    const replied = new Set(
      comments.filter((c) => c.replies.length > 0).map((c) => c.commentId),
    );
    setRepliedIds(replied);
  };

  const markReplied = (commentId: string) => {
    setRepliedIds((prev) => new Set([...prev, commentId]));
  };

  const markBulkReplied = (
    succeeded: { commentId: string; message: string }[],
  ) => {
    setRepliedIds(
      (prev) => new Set([...prev, ...succeeded.map((s) => s.commentId)]),
    );
  };

  const load = useCallback(async (cursor: string | null, replace: boolean) => {
    if (replace) setIsLoading(true);
    else setIsLoadingMore(true);
    setFetchError(null);
    try {
      const data = await fetchComments(MEDIA_BATCH, cursor);
      if (replace) {
        setAllComments(data.data);
        seedRepliedIds(data.data);
      } else {
        setAllComments((prev) => [...prev, ...data.data]);
      }
      setNextMediaCursor(data.nextMediaCursor);
      setHasMoreMedia(data.hasMoreMedia);
    } catch (e: any) {
      setFetchError(e.message ?? "Failed to load comments");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsFetching(true);
    setFetchError(null);
    try {
      const data = await fetchComments(MEDIA_BATCH, null);
      setAllComments(data.data);
      seedRepliedIds(data.data);
      setNextMediaCursor(data.nextMediaCursor);
      setHasMoreMedia(data.hasMoreMedia);
    } catch (e: any) {
      setFetchError(e.message ?? "Failed to refresh");
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    load(null, true);
  }, [load]);

  const deleteMut = useMutation({
    mutationFn: deleteComment,
    onSuccess: (_, commentId) => {
      setAllComments((prev) => prev.filter((c) => c.commentId !== commentId));
      setRepliedIds((prev) => {
        const n = new Set(prev);
        n.delete(commentId);
        return n;
      });
      setDeleteTarget(null);
      showToast("Comment deleted");
    },
    onError: (e: Error) => {
      showToast(e.message ?? "Delete failed");
      setDeleteTarget(null);
    },
  });

  // ── AI bulk reply ──────────────────────────────────────────────────────────
  const unrepliedComments = allComments.filter(
    (c) => !repliedIds.has(c.commentId),
  );

  const runBulkAI = async () => {
    if (unrepliedComments.length === 0) return;
    const seed: AICommentItem[] = unrepliedComments.map((c) => ({
      commentId: c.commentId,
      username: c.username,
      commentText: c.commentText,
      status: "pending",
    }));
    setAiItems(seed);
    setAiComplete(false);
    setShowAIModal(true);

    const setItemStatus = (
      commentId: string,
      patch: Partial<AICommentItem>,
    ) => {
      setAiItems((prev) =>
        prev.map((i) => (i.commentId === commentId ? { ...i, ...patch } : i)),
      );
    };

    for (const item of seed) {
      setItemStatus(item.commentId, { status: "thinking" });
      await delay(500);
      try {
        setItemStatus(item.commentId, { status: "writing" });
        const aiRes = await fetch("/api/ai/instagram-comment-reply", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: getAuthHeader() ?? "",
          },
          body: JSON.stringify({
            commentText: item.commentText,
            commenterName: item.username,
          }),
        });
        const aiJson = await aiRes.json();
        const replyText = aiJson.reply ?? aiJson.message ?? "";
        if (!replyText) throw new Error("Empty AI reply");

        setItemStatus(item.commentId, { reply: replyText });
        await delay(400);

        setItemStatus(item.commentId, { status: "posting" });
        await postReply(item.commentId, replyText);
        await delay(600);

        setItemStatus(item.commentId, { status: "done", reply: replyText });
        markReplied(item.commentId);
      } catch {
        setItemStatus(item.commentId, { status: "failed" });
      }
      await delay(800);
    }

    setAiComplete(true);
    refresh();
  };

  // Client-side search
  const q = search.trim().toLowerCase();
  const visible = q
    ? allComments.filter(
        (c) =>
          c.username.toLowerCase().includes(q) ||
          c.commentText.toLowerCase().includes(q),
      )
    : allComments;

  const totalReplies = allComments.reduce((s, c) => s + c.replies.length, 0);

  return (
    <div
      className="min-h-screen transition-colors"
      style={{
        backgroundColor: dark ? "#0d0814" : "#fdf0ff",
        fontFamily: "-apple-system,'SF Pro Text',sans-serif",
      }}
    >
      {/* AI Modal */}
      {showAIModal && (
        <AIBulkReplyModal
          items={aiItems}
          dark={dark}
          isComplete={aiComplete}
          onClose={() => {
            setShowAIModal(false);
            setAiItems([]);
            setAiComplete(false);
          }}
        />
      )}

      {/* Bulk Reply Modal */}
      {showBulkModal && (
        <BulkReplyModal
          comments={unrepliedComments}
          dark={dark}
          onClose={() => setShowBulkModal(false)}
          onSuccess={(s) => {
            markBulkReplied(s);
            setShowBulkModal(false);
            showToast(`${s.length} repl${s.length !== 1 ? "ies" : "y"} posted`);
          }}
        />
      )}

      <div
        className="fixed inset-0 pointer-events-none opacity-[0.018] z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #C13584 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-3 pb-28 pt-6">
        {/* ── HEADER ── */}
        <div className="flex items-start justify-between mb-5 gap-3">
          <div>
            <button
              onClick={() => router.push("/instagram")}
              className="flex items-center gap-1 text-[11px] font-bold mb-1"
              style={{ color: IG_ACCENT }}
            >
              <ArrowLeft size={12} /> Instagram
            </button>
            <h1
              className={`text-[26px] font-black leading-tight ${dark ? "text-white" : "text-slate-900"}`}
              style={{ letterSpacing: "-0.04em" }}
            >
              Comments
            </h1>
            <p
              className="text-[12px] mt-0.5"
              style={{ color: dark ? "#6b4f7a" : "rgba(193,53,132,0.7)" }}
            >
              {isLoading
                ? "Loading…"
                : `${allComments.length} comments · ${unrepliedComments.length} awaiting reply`}
            </p>
          </div>

          <button
            onClick={refresh}
            disabled={isFetching || isLoading}
            className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all active:scale-90 border shrink-0 ${dark ? "bg-white/[0.04] border-white/[0.06] text-slate-400" : "bg-white border-pink-100 text-slate-500 shadow-sm"}`}
          >
            <RefreshCw
              size={14}
              className={isFetching || isLoading ? "animate-spin" : ""}
            />
          </button>
        </div>

        {/* ── STATS ── */}
        {!isLoading && !fetchError && allComments.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              {
                label: "Total Comments",
                value: String(allComments.length),
                color: "#C13584",
                icon: <MessageCircle size={13} />,
              },
              {
                label: "Total Replies",
                value: String(totalReplies),
                color: "#833ab4",
                icon: <CornerDownRight size={13} />,
              },
              {
                label: "Replied",
                value: String(repliedIds.size),
                color: "#22c55e",
                icon: <CheckCircle2 size={13} />,
              },
              {
                label: "Needs Reply",
                value: String(unrepliedComments.length),
                color: "#f59e0b",
                icon: <Clock size={13} />,
              },
            ].map((s) => (
              <div
                key={s.label}
                className={`p-3 rounded-2xl border relative overflow-hidden ${dark ? "bg-[#130820] border-pink-900/30" : "bg-white border-pink-100/80 shadow-sm"}`}
              >
                <div
                  className="absolute top-2.5 right-2.5 w-7 h-7 rounded-xl flex items-center justify-center border"
                  style={{
                    backgroundColor: s.color + "20",
                    borderColor: s.color + "50",
                    color: s.color,
                  }}
                >
                  {s.icon}
                </div>
                <p
                  className="text-[20px] font-black leading-none mt-1 mb-4"
                  style={{ color: s.color, letterSpacing: "-0.03em" }}
                >
                  {s.value}
                </p>
                <p
                  className="text-[9px] font-black uppercase tracking-widest"
                  style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}
                >
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── ACTION BUTTONS ── */}
        {!isLoading && !fetchError && unrepliedComments.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            {/* AI auto-reply */}
            <button
              onClick={runBulkAI}
              className="flex-1 py-2 px-2.4 rounded-[14px] flex items-center justify-center gap-2.5 text-[13.5px] font-bold text-white transition-all active:scale-[0.97] relative overflow-hidden"
              style={{
                background: IG_GRADIENT,
                boxShadow: "0 6px 20px rgba(193,53,132,0.42)",
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.12) 50%,transparent 100%)",
                  animation: "ig-shimmer 2.5s linear infinite",
                }}
              />
              <div className="relative flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.18)" }}
                >
                  <Brain size={15} className="text-white" />
                </div>
                <span>
                  AI Auto-Reply {unrepliedComments.length} Comment
                  {unrepliedComments.length !== 1 ? "s" : ""}
                </span>
                <div
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.15)" }}
                >
                  <Sparkles size={9} className="text-white/80" />
                  <span className="text-[9px] font-black text-white/80 uppercase tracking-wide">
                    AI
                  </span>
                </div>
              </div>
            </button>

            {/* Manual bulk reply */}
            <button
              onClick={() => setShowBulkModal(true)}
              className={`py-3 px-5 rounded-[14px] flex items-center gap-2 text-[13px] font-semibold border transition-all active:scale-[0.97] ${
                dark
                  ? "bg-white/[0.06] border-pink-900/40 text-slate-300 hover:bg-white/[0.10]"
                  : "bg-white border-pink-100 text-slate-600 hover:bg-pink-50 shadow-sm"
              }`}
            >
              <Zap size={15} style={{ color: IG_ACCENT }} />
              Bulk Reply
            </button>
          </div>
        )}

        {/* ── SEARCH ── */}
        {!isLoading && !fetchError && allComments.length > 0 && (
          <div
            className={`flex items-center gap-2.5 h-[42px] px-3.5 rounded-[13px] border mb-5 ${dark ? "bg-[#130820] border-pink-900/40" : "bg-white border-pink-100"}`}
          >
            <Search size={13} style={{ color: dark ? "#6b4f7a" : "#94a3b8" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username or comment text…"
              className={`flex-1 bg-transparent outline-none text-[13px] ${dark ? "text-white placeholder:text-slate-700" : "text-slate-900 placeholder:text-slate-400"}`}
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <X size={13} style={{ color: dark ? "#6b4f7a" : "#94a3b8" }} />
              </button>
            )}
          </div>
        )}

        {/* ── LOADING ── */}
        {isLoading && (
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <CommentSkeleton key={i} dark={dark} />
            ))}
          </div>
        )}

        {/* ── ERROR ── */}
        {fetchError && (
          <div
            className={`rounded-2xl border p-6 flex items-start gap-3 ${dark ? "bg-red-500/[0.07] border-red-500/20" : "bg-red-50 border-red-200/60"}`}
          >
            <WifiOff size={16} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-red-400 mb-0.5">
                Failed to load comments
              </p>
              <p
                className={`text-[11.5px] mb-2 ${dark ? "text-red-500/70" : "text-red-400"}`}
              >
                {fetchError}
              </p>
              <button
                onClick={() => load(null, true)}
                className="text-[12px] font-semibold"
                style={{ color: IG_ACCENT }}
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* ── EMPTY ── */}
        {!isLoading && !fetchError && allComments.length === 0 && (
          <div
            className={`rounded-2xl border p-12 text-center ${dark ? "bg-[#130820] border-pink-900/30" : "bg-white border-pink-100/80 shadow-sm"}`}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: IG_GRADIENT }}
            >
              <MessageCircle size={26} className="text-white" />
            </div>
            <p
              className={`text-[15px] font-bold mb-1.5 ${dark ? "text-white" : "text-slate-900"}`}
            >
              No Comments Yet
            </p>
            <p
              className="text-[12.5px]"
              style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}
            >
              Comments on your recent posts will appear here.
            </p>
          </div>
        )}

        {/* ── NO SEARCH RESULTS ── */}
        {!isLoading &&
          !fetchError &&
          allComments.length > 0 &&
          visible.length === 0 && (
            <div
              className={`rounded-2xl border p-8 text-center ${dark ? "bg-[#130820] border-pink-900/30" : "bg-white border-pink-100/80"}`}
            >
              <Search
                size={22}
                className="mx-auto mb-2"
                style={{ color: dark ? "#6b4f7a" : "#cbd5e1" }}
              />
              <p
                className="text-[13px]"
                style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}
              >
                No comments match your search
              </p>
              <button
                onClick={() => setSearch("")}
                className="mt-2 text-[12px] font-semibold"
                style={{ color: IG_ACCENT }}
              >
                Clear search
              </button>
            </div>
          )}

        {/* ── COMMENT LIST ── */}
        {!isLoading && !fetchError && visible.length > 0 && (
          <>
            <div className="grid-cols-1 sm:grid sm:grid-cols-3 gap-3 space-y-3">
              {visible.map((comment) => (
                <CommentCard
                  key={comment.commentId}
                  comment={comment}
                  dark={dark}
                  isReplied={repliedIds.has(comment.commentId)}
                  onDelete={(id) => setDeleteTarget(id)}
                  onReplySuccess={refresh}
                  onReplyPosted={markReplied}
                />
              ))}
            </div>

            {/* ── LOAD MORE ── */}
            {hasMoreMedia && !search && (
              <div className="flex items-center gap-3 py-5 mt-2">
                <div
                  className="flex-1 h-px"
                  style={{
                    backgroundColor: dark
                      ? "rgba(193,53,132,0.15)"
                      : "rgba(193,53,132,0.1)",
                  }}
                />
                <button
                  onClick={() => load(nextMediaCursor, false)}
                  disabled={isLoadingMore}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-[12.5px] font-bold text-white transition-all active:scale-95 disabled:opacity-60"
                  style={{
                    background: IG_GRADIENT,
                    boxShadow: "0 3px 12px rgba(193,53,132,0.3)",
                  }}
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Loading…
                    </>
                  ) : (
                    "Load More Posts' Comments"
                  )}
                </button>
                <div
                  className="flex-1 h-px"
                  style={{
                    backgroundColor: dark
                      ? "rgba(193,53,132,0.15)"
                      : "rgba(193,53,132,0.1)",
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* ── DELETE MODAL ── */}
      {deleteTarget && (
        <DeleteModal
          dark={dark}
          isDeleting={deleteMut.isPending}
          onConfirm={() => deleteMut.mutate(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ── TOAST ── */}
      {toastMsg && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[400] flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-semibold text-white shadow-2xl"
          style={{
            background: "rgba(13,8,20,0.92)",
            backdropFilter: "blur(12px)",
          }}
        >
          <CheckCircle2 size={13} className="text-green-400 shrink-0" />
          {toastMsg}
        </div>
      )}
    </div>
  );
}
