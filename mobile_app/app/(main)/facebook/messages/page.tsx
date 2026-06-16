// app/(main)/messages/facebook/page.tsx
// Web port of mobile FacebookMessagesScreen + AIBulkMessageModal + BulkMessageModal.
// Theme matches the existing Facebook Comments web page exactly:
//   cards:  #131c2d (dark) / white (light)
//   inputs: #182236 (dark)
//   accent: #1d4ed8 → #3b82f6
//   font:   -apple-system, SF Pro Text
//
// Differences from mobile:
//   - Modals are centered dialogs (not bottom-sheets)
//   - AI modal is a full-screen overlay — same pattern as AIBulkReplyModal in Comments
//   - Layout: 3-col stats row, conversation list full-width

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
  Mail,
  WifiOff,
  Brain,
  Zap,
  X,
  CheckCircle2,
  CheckSquare,
  Square,
  Sparkles,
  RefreshCw,
  Clock,
  MessageCircle,
  Circle,
  Send,
  ArrowLeft,
} from "lucide-react";
import { getAuthHeader } from "@/lib/token";

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */

interface Conversation {
  conversationId: string;
  sender: string;
  senderId: string | null;
  preview: string;
  time: string;
  unreadCount: number;
  unread: boolean;
}

interface MessagesResponse {
  success: boolean;
  data: {
    conversations: Conversation[];
    total: number;
    unreadCount: number;
  };
}

type AIItemStatus =
  | "pending"
  | "thinking"
  | "writing"
  | "posting"
  | "done"
  | "failed";

interface AIMessageItem {
  conversationId: string;
  sender: string;
  preview: string;
  senderId: string;
  status: AIItemStatus;
  reply?: string;
}

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function formatTime(isoTime: string): string {
  const date = new Date(isoTime);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

const AV_COLORS = [
  "#8B5CF6",
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#1877F2",
  "#EC4899",
  "#06B6D4",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AV_COLORS[Math.abs(hash) % AV_COLORS.length];
}

function FacebookLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════
   STAT CARD  (matches Comments page StatCard exactly)
══════════════════════════════════════════════════════════ */

function StatCard({
  label,
  value,
  sub,
  icon,
  color,
  isDark,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  isDark: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-4 flex flex-col gap-2 border
      ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05] shadow-sm"}`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-[10px] font-semibold uppercase tracking-[0.07em]
          ${isDark ? "text-slate-500" : "text-slate-400"}`}
        >
          {label}
        </span>
        <span className="p-1.5 rounded-lg" style={{ background: `${color}18` }}>
          <span style={{ color }}>{icon}</span>
        </span>
      </div>
      <div>
        <div
          className={`text-2xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
          style={{ letterSpacing: "-0.04em" }}
        >
          {value}
        </div>
        {sub && (
          <div
            className={`text-[11px] mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CONVERSATION ROW
══════════════════════════════════════════════════════════ */

function ConversationRow({
  conv,
  isDark,
  isRead,
  isReplied,
  onClick,
}: {
  conv: Conversation;
  isDark: boolean;
  isRead: boolean;
  isReplied: boolean;
  onClick: () => void;
}) {
  const avatarColor = getAvatarColor(conv.sender);

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 p-4 rounded-2xl border text-left transition-all duration-150 active:scale-[0.99]
        ${
          isRead
            ? isDark
              ? "bg-[#131c2d] border-white/[0.06] hover:bg-[#1a2540]"
              : "bg-white border-black/[0.05] hover:bg-slate-50 shadow-sm"
            : isDark
              ? "bg-[#1877F2]/[0.05] border-[#1877F2]/30 hover:bg-[#1877F2]/[0.08]"
              : "bg-[#1877F2]/[0.04] border-[#1877F2]/25 hover:bg-[#1877F2]/[0.07]"
        }
        ${isReplied ? (isDark ? "border-blue-500/30" : "border-blue-300/50") : ""}`}
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[15px] font-black shrink-0"
        style={{ background: avatarColor }}
      >
        {conv.sender.charAt(0).toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span
            className={`text-[14px] truncate
              ${
                isRead
                  ? isDark
                    ? "text-slate-300 font-semibold"
                    : "text-slate-700 font-semibold"
                  : isDark
                    ? "text-white font-black"
                    : "text-slate-900 font-black"
              }`}
          >
            {conv.sender}
          </span>
          <span
            className={`text-[10px] shrink-0 ${isDark ? "text-slate-600" : "text-slate-400"}`}
          >
            {formatTime(conv.time)}
          </span>
        </div>

        <p
          className={`text-[12.5px] leading-relaxed line-clamp-2
            ${
              isRead
                ? isDark
                  ? "text-slate-500 font-normal"
                  : "text-slate-400 font-normal"
                : isDark
                  ? "text-slate-300 font-semibold"
                  : "text-slate-600 font-semibold"
            }`}
        >
          {conv.preview}
        </p>

        {/* Replied badge */}
        {isReplied && (
          <div className="flex items-center gap-1 mt-1.5">
            <CheckCircle2 size={10} className="text-blue-500" />
            <span className="text-[10px] font-bold text-blue-500">Replied</span>
          </div>
        )}
      </div>

      {/* Unread dot */}
      {!isRead && !isReplied && (
        <div className="shrink-0 mt-1.5">
          <div className="w-2 h-2 rounded-full bg-[#1877F2]" />
        </div>
      )}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════
   CONVERSATION SKELETON
══════════════════════════════════════════════════════════ */

function ConversationSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-4 flex items-start gap-3
      ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05]"}`}
    >
      <div
        className={`w-10 h-10 rounded-full shrink-0 animate-pulse ${isDark ? "bg-white/[0.07]" : "bg-slate-100"}`}
      />
      <div className="flex-1">
        <div
          className={`h-3.5 w-32 rounded mb-2 animate-pulse ${isDark ? "bg-white/[0.07]" : "bg-slate-100"}`}
        />
        <div
          className={`h-2.5 w-full rounded mb-1.5 animate-pulse ${isDark ? "bg-white/[0.07]" : "bg-slate-100"}`}
        />
        <div
          className={`h-2.5 w-3/4 rounded animate-pulse ${isDark ? "bg-white/[0.07]" : "bg-slate-100"}`}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   AI BULK MESSAGE MODAL  (full-screen overlay — matches AIBulkReplyModal in Comments)
══════════════════════════════════════════════════════════ */

const AI_PHASES = [
  "Analysing message context…",
  "Identifying customer intent…",
  "Crafting a personalised reply…",
  "Reviewing tone & clarity…",
  "Adding engagement hooks…",
  "Finalising response…",
];

function AIBulkMessageModal({
  items,
  isDark,
  onClose,
  isComplete,
}: {
  items: AIMessageItem[];
  isDark: boolean;
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
              background: "#1877F2",
              opacity: p.o,
              animation: `float-${i % 4} ${p.d}s ease-in-out infinite alternate`,
            }}
          />
        ))}
        <style>{`
          @keyframes float-0{0%{transform:translate(0,0)}100%{transform:translate(12px,-18px)}}
          @keyframes float-1{0%{transform:translate(0,0)}100%{transform:translate(-10px,14px)}}
          @keyframes float-2{0%{transform:translate(0,0)}100%{transform:translate(16px,10px)}}
          @keyframes float-3{0%{transform:translate(0,0)}100%{transform:translate(-8px,-12px)}}
          @keyframes spin-slow{from{transform:rotate(0)}to{transform:rotate(360deg)}}
          @keyframes pulse-ring{0%{transform:scale(1);opacity:0.6}100%{transform:scale(1.6);opacity:0}}
          @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}
          @keyframes bounce-dot{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        `}</style>
      </div>

      {/* Panel */}
      <div
        className="relative w-full md:max-w-lg md:rounded-3xl rounded-t-[28px] overflow-hidden max-h-[90vh] flex flex-col"
        style={{
          background: isDark ? "#070f1f" : "#fff",
          boxShadow:
            "0 -24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(24,119,242,0.2)",
        }}
      >
        {/* Blue shimmer top line */}
        <div
          className="h-[1.5px]"
          style={{
            background:
              "linear-gradient(90deg,transparent,#1877F2,#60a5fa,transparent)",
          }}
        />

        {/* Handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1">
          <div
            className={`w-9 h-1 rounded-full ${isDark ? "bg-white/20" : "bg-slate-200"}`}
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
                  className="absolute inset-0 rounded-full border border-blue-500/40"
                  style={{
                    animation: `pulse-ring ${1.4 + i * 0.5}s ease-out infinite`,
                    animationDelay: `${i * 0.4}s`,
                  }}
                />
              ))}
            <div
              className="absolute inset-0 rounded-full border-2 border-dashed border-blue-500/30"
              style={{
                animation: isComplete ? "none" : "spin-slow 8s linear infinite",
              }}
            />
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: isComplete
                  ? "linear-gradient(135deg,#16a34a,#22c55e)"
                  : "linear-gradient(135deg,#1d4ed8,#1877F2)",
                boxShadow: isComplete
                  ? "0 0 24px rgba(34,197,94,0.5)"
                  : "0 0 24px rgba(24,119,242,0.5)",
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
                className={`text-[17px] font-black ${isDark ? "text-white" : "text-slate-900"}`}
                style={{ letterSpacing: "-0.03em" }}
              >
                {isComplete ? "All Done!" : "AI Auto-Reply"}
              </p>
              {!isComplete && (
                <div
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(24,119,242,0.12)",
                    border: "1px solid rgba(24,119,242,0.25)",
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-wide">
                    Live
                  </span>
                </div>
              )}
            </div>
            <p
              className={`text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              {isComplete
                ? `${done} messages sent · ${failed > 0 ? `${failed} failed` : "all successful"}`
                : `Generating replies · ${done}/${items.length} done`}
            </p>
          </div>

          {isComplete && (
            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0
              ${isDark ? "bg-white/[0.08]" : "bg-slate-100"}`}
            >
              <X
                size={14}
                className={isDark ? "text-slate-400" : "text-slate-600"}
              />
            </button>
          )}
        </div>

        {/* Progress */}
        <div className="px-5 mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span
              className={`text-[10px] font-black uppercase tracking-widest ${isDark ? "text-slate-600" : "text-slate-400"}`}
            >
              Progress
            </span>
            <span
              className={`text-[11px] font-black ${isDark ? "text-white" : "text-slate-900"}`}
            >
              {Math.round(barWidth)}%
            </span>
          </div>
          <div
            className={`h-2.5 rounded-full overflow-hidden ${isDark ? "bg-white/[0.06]" : "bg-slate-100"}`}
          >
            <div
              className="h-full rounded-full relative overflow-hidden"
              style={{
                width: `${barWidth}%`,
                background: isComplete
                  ? "linear-gradient(90deg,#16a34a,#22c55e)"
                  : "linear-gradient(90deg,#1d4ed8,#1877F2,#60a5fa)",
                boxShadow: isComplete
                  ? "0 0 10px rgba(34,197,94,0.5)"
                  : "0 0 10px rgba(24,119,242,0.6)",
                transition: "width 0.3s ease",
              }}
            >
              {!isComplete && (
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.25) 50%,transparent 100%)",
                    animation: "shimmer 1.5s linear infinite",
                  }}
                />
              )}
            </div>
          </div>
          <div className="flex gap-3 mt-2">
            {[
              { label: "Total", value: items.length, color: "#1877F2" },
              { label: "Done", value: done, color: "#22c55e" },
              { label: "Queue", value: pending.length, color: "#f59e0b" },
              { label: "Failed", value: failed, color: "#ef4444" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-1">
                <span
                  className="text-[13px] font-black"
                  style={{ color: s.color }}
                >
                  {s.value}
                </span>
                <span
                  className={`text-[9.5px] font-bold ${isDark ? "text-slate-600" : "text-slate-400"}`}
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
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border
              ${isDark ? "bg-blue-500/[0.06] border-blue-900/50" : "bg-blue-50 border-blue-200/60"}`}
            >
              <div className="flex gap-0.5 shrink-0">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-blue-400"
                    style={{
                      animation: `bounce-dot 1s ease-in-out infinite`,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
              <p
                className={`text-[11.5px] font-semibold flex-1 ${isDark ? "text-blue-300" : "text-blue-700"}`}
              >
                {AI_PHASES[phaseIdx]}
              </p>
              <div className="flex items-center gap-1 shrink-0">
                <Sparkles size={10} className="text-blue-400" />
                <span className="text-[9px] font-black text-blue-400">
                  AI Agent
                </span>
              </div>
            </div>
          </div>
        )}

        <div
          className={`h-px mx-5 mb-3 ${isDark ? "bg-white/[0.05]" : "bg-slate-100"}`}
        />

        {/* List */}
        <div
          className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-2.5"
          style={{ scrollbarWidth: "none" }}
        >
          {/* Currently processing */}
          {active && (
            <div className="mb-1">
              <p
                className={`text-[9.5px] font-black uppercase tracking-widest mb-2 ${isDark ? "text-slate-600" : "text-slate-400"}`}
              >
                Currently Processing
              </p>
              <div
                className={`rounded-2xl border overflow-hidden ${isDark ? "bg-[#0d1c36] border-blue-900/50" : "bg-blue-50 border-blue-200/60"}`}
                style={{ boxShadow: "0 0 20px rgba(24,119,242,0.12)" }}
              >
                <div
                  className="h-[1.5px]"
                  style={{
                    background:
                      "linear-gradient(90deg,transparent,#1877F2,transparent)",
                    animation: "shimmer 1.5s linear infinite",
                  }}
                />
                <div className="p-3.5">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-black shrink-0"
                      style={{ background: getAvatarColor(active.sender) }}
                    >
                      {active.sender.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-[12px] font-bold mb-0.5 ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {active.sender}
                      </p>
                      <p
                        className={`text-[10.5px] leading-relaxed line-clamp-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                      >
                        {active.preview}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-xl ${isDark ? "bg-white/[0.04]" : "bg-white/60"}`}
                  >
                    <div className="flex gap-0.5">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1 h-1 rounded-full bg-blue-400"
                          style={{
                            animation: `bounce-dot 1s ease-in-out infinite`,
                            animationDelay: `${i * 0.12}s`,
                          }}
                        />
                      ))}
                    </div>
                    <p
                      className={`text-[11px] font-semibold ${isDark ? "text-blue-300" : "text-blue-600"}`}
                    >
                      {active.status === "thinking" && "Analysing message…"}
                      {active.status === "writing" && "Generating AI reply…"}
                      {active.status === "posting" && "Sending via Messenger…"}
                    </p>
                  </div>
                  {active.reply && (
                    <div
                      className={`mt-2 px-3 py-2 rounded-xl border-l-2 border-blue-500 ${isDark ? "bg-white/[0.03]" : "bg-white/50"}`}
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-blue-400">
                        Reply Preview
                      </p>
                      <p
                        className={`text-[11px] leading-relaxed line-clamp-3 ${isDark ? "text-slate-300" : "text-slate-700"}`}
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
                className={`text-[9.5px] font-black uppercase tracking-widest mb-2 ${isDark ? "text-slate-600" : "text-slate-400"}`}
              >
                Completed ({completed.length})
              </p>
              <div className="flex flex-col gap-2">
                {[...completed].reverse().map((item) => (
                  <div
                    key={item.conversationId}
                    className={`flex items-start gap-3 px-3.5 py-3 rounded-2xl border
                    ${isDark ? "bg-white/[0.025] border-white/[0.05]" : "bg-white border-slate-100"}`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-black shrink-0"
                      style={{
                        background: getAvatarColor(item.sender),
                        opacity: 0.85,
                      }}
                    >
                      {item.sender.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-[11.5px] font-bold truncate ${isDark ? "text-slate-300" : "text-slate-700"}`}
                      >
                        {item.sender}
                      </p>
                      {item.reply && (
                        <p
                          className={`text-[10px] leading-relaxed line-clamp-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}
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
                className={`text-[9.5px] font-black uppercase tracking-widest mb-2 ${isDark ? "text-slate-600" : "text-slate-400"}`}
              >
                Queue ({pending.length})
              </p>
              <div className="flex flex-col gap-1.5">
                {pending.slice(0, 4).map((item) => (
                  <div
                    key={item.conversationId}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl ${isDark ? "bg-white/[0.015]" : "bg-slate-50"}`}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0"
                      style={{
                        background: getAvatarColor(item.sender),
                        opacity: 0.5,
                      }}
                    >
                      {item.sender[0]?.toUpperCase()}
                    </div>
                    <p
                      className={`text-[10.5px] flex-1 truncate ${isDark ? "text-slate-600" : "text-slate-400"}`}
                    >
                      {item.sender}
                    </p>
                    <Clock
                      size={10}
                      className={isDark ? "text-slate-700" : "text-slate-300"}
                    />
                  </div>
                ))}
                {pending.length > 4 && (
                  <p
                    className={`text-[10px] text-center font-medium ${isDark ? "text-slate-700" : "text-slate-400"}`}
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
              className={`rounded-2xl border p-5 flex flex-col items-center text-center
              ${isDark ? "bg-emerald-500/[0.06] border-emerald-900/40" : "bg-emerald-50 border-emerald-200/60"}`}
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
                className={`text-[14px] font-black mb-1 ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
              >
                {done} messages sent successfully!
              </p>
              <p
                className={`text-[11px] mb-4 ${isDark ? "text-emerald-400/60" : "text-emerald-600"}`}
              >
                {failed > 0
                  ? `${failed} failed — see details above.`
                  : "All conversations have been replied to."}
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

/* ══════════════════════════════════════════════════════════
   BULK MESSAGE MODAL  (centered dialog — matches Comments BulkReplyModal)
══════════════════════════════════════════════════════════ */

function BulkMessageModal({
  conversations,
  isDark,
  onClose,
  onSuccess,
}: {
  conversations: Conversation[];
  isDark: boolean;
  onClose: () => void;
  onSuccess: (succeeded: { conversationId: string; message: string }[]) => void;
}) {
  const replyable = conversations.filter((c) => c.senderId !== null);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    new Set(replyable.map((c) => c.conversationId)),
  );
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<
    {
      conversationId: string;
      sender: string;
      success: boolean;
      error?: string;
    }[]
  >([]);
  const [showResults, setShowResults] = useState(false);

  const toggleAll = () => {
    if (selected.size === replyable.length) setSelected(new Set());
    else setSelected(new Set(replyable.map((c) => c.conversationId)));
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
    const text = message.trim();
    const succeeded: { conversationId: string; message: string }[] = [];
    const resultList: typeof results = [];

    for (const conv of replyable.filter((c) =>
      selected.has(c.conversationId),
    )) {
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/facebook/messages/send`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: getAuthHeader() ?? "",
            },
            body: JSON.stringify({ recipientId: conv.senderId, message: text }),
          },
        );
        succeeded.push({ conversationId: conv.conversationId, message: text });
        resultList.push({
          conversationId: conv.conversationId,
          sender: conv.sender,
          success: true,
        });
      } catch (err: any) {
        resultList.push({
          conversationId: conv.conversationId,
          sender: conv.sender,
          success: false,
          error: err?.message || "Failed",
        });
      }
    }

    setResults(resultList);
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
        className={`relative w-full max-w-lg rounded-3xl border overflow-hidden flex flex-col max-h-[85vh]
        ${isDark ? "bg-[#0d1421] border-white/[0.08]" : "bg-white border-black/[0.06]"}`}
        style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }}
      >
        {/* Blue accent top */}
        <div
          className="h-[2px]"
          style={{
            background:
              "linear-gradient(90deg,transparent,#1877F2,transparent)",
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <Zap size={16} style={{ color: "#1877F2" }} />
            <h3
              className={`text-[15px] font-black ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Bulk Message
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`w-7 h-7 rounded-full flex items-center justify-center ${isDark ? "bg-white/[0.08] text-slate-400" : "bg-slate-100 text-slate-500"}`}
          >
            <X size={13} />
          </button>
        </div>

        <div
          className={`h-px mx-5 mb-3 ${isDark ? "bg-white/[0.06]" : "bg-slate-100"}`}
        />

        <div
          className="overflow-y-auto flex-1 px-5 pb-5"
          style={{ scrollbarWidth: "none" }}
        >
          {showResults ? (
            <>
              <p
                className={`text-[10px] font-black uppercase tracking-widest mb-3 ${isDark ? "text-slate-600" : "text-slate-400"}`}
              >
                Results
              </p>
              <div className="flex flex-col gap-2 mb-4">
                {results.map((r) => (
                  <div
                    key={r.conversationId}
                    className={`flex items-start gap-3 px-3 py-2.5 rounded-xl border
                    ${
                      r.success
                        ? isDark
                          ? "bg-emerald-500/[0.06] border-emerald-500/20"
                          : "bg-emerald-50 border-emerald-200/60"
                        : isDark
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
                        className={`text-[12px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {r.sender}
                      </p>
                      {!r.success && (
                        <p className="text-[11px] text-red-400 mt-0.5">
                          {r.error}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={onClose}
                className="w-full h-10 rounded-2xl text-white text-[13px] font-bold"
                style={{
                  background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
                }}
              >
                Done
              </button>
            </>
          ) : (
            <>
              <p
                className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}
              >
                Message
              </p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Type a message to send to all selected conversations…"
                className={`w-full rounded-xl p-3 text-[13.5px] resize-none outline-none border mb-1 transition-all
                ${
                  isDark
                    ? "bg-[#182236] text-white placeholder:text-slate-600 border-white/[0.07] focus:border-blue-500/50"
                    : "bg-white text-slate-900 placeholder:text-slate-400 border-black/[0.07] focus:border-blue-500/40"
                }`}
              />
              <p
                className={`text-[10px] text-right mb-4 ${isDark ? "text-slate-600" : "text-slate-400"}`}
              >
                {message.length}/2000
              </p>

              <div className="flex items-center justify-between mb-2">
                <p
                  className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}
                >
                  Select Conversations ({selected.size}/{replyable.length})
                </p>
                <button
                  onClick={toggleAll}
                  className="text-[12px] font-bold text-blue-500"
                >
                  {selected.size === replyable.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              </div>

              <div className="flex flex-col gap-1.5 mb-4">
                {replyable.map((c) => {
                  const isSel = selected.has(c.conversationId);
                  return (
                    <button
                      key={c.conversationId}
                      onClick={() => toggleOne(c.conversationId)}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all
                      ${
                        isSel
                          ? isDark
                            ? "bg-blue-500/[0.08] border-blue-500/40"
                            : "bg-blue-50 border-blue-200"
                          : isDark
                            ? "bg-white/[0.02] border-white/[0.05]"
                            : "bg-white border-slate-100"
                      }`}
                    >
                      {isSel ? (
                        <CheckSquare
                          size={16}
                          className="text-blue-500 shrink-0 mt-0.5"
                        />
                      ) : (
                        <Square
                          size={16}
                          className={`shrink-0 mt-0.5 ${isDark ? "text-slate-600" : "text-slate-300"}`}
                        />
                      )}
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-black shrink-0"
                        style={{ background: getAvatarColor(c.sender) }}
                      >
                        {c.sender.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-[12px] font-bold truncate ${isDark ? "text-slate-200" : "text-slate-800"}`}
                        >
                          {c.sender}
                        </p>
                        <p
                          className={`text-[11px] line-clamp-1 mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                        >
                          {c.preview}
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
                  background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
                  boxShadow: "0 4px 16px rgba(37,99,235,0.4)",
                }}
              >
                {sending ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Zap size={14} />
                )}
                {sending
                  ? "Sending…"
                  : `Send to ${selected.size} Conversation${selected.size !== 1 ? "s" : ""}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════ */

interface BulkReplyResult {
  conversationId: string;
  message: string;
}

export default function FacebookMessagesPage() {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  // ── Data state ───────────────────────────────────────────────────────────
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [fetching, setFetching] = useState(false);
  const [fetchErr, setFetchErr] = useState("");

  // ── Local optimistic tracking ────────────────────────────────────────────
  // localReadIds: conversations the user has opened in this session
  const [localReadIds, setLocalReadIds] = useState<Set<string>>(new Set());
  // repliedIds: conversations that have been replied to (bulk or AI)
  const [repliedIds, setRepliedIds] = useState<Set<string>>(new Set());

  // ── Modal state ──────────────────────────────────────────────────────────
  const [showAIModal, setShowAIModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [aiItems, setAiItems] = useState<AIMessageItem[]>([]);
  const [aiComplete, setAiComplete] = useState(false);

  // ── Helpers ──────────────────────────────────────────────────────────────
  //   const isRead = (conv: Conversation) =>
  //     localReadIds.has(conv.conversationId) || !conv.unread;
  const isRead = (conv: Conversation): boolean =>
    localReadIds.has(conv.conversationId) ||
    repliedIds.has(conv.conversationId) || // ← added
    !conv.unread;
  const isReplied = (conv: Conversation): boolean =>
    repliedIds.has(conv.conversationId);

  const liveUnreadCount = conversations.filter((c) => !isRead(c)).length;

  // Replyable = unread + not replied yet in this session
  const replyableConversations: Conversation[] = conversations.filter(
    (c) =>
      c.senderId !== null && !isRead(c) && !repliedIds.has(c.conversationId),
  );

  // ── Fetch conversations ──────────────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    setFetching(true);
    setFetchErr("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/facebook/messages`,
        {
          headers: { Authorization: getAuthHeader() ?? "" },
        },
      );
      const json: MessagesResponse = await res.json();
      if (!json.success)
        throw new Error((json as any).message ?? "Failed to load messages");
      setConversations(json.data.conversations);
    } catch (e: any) {
      setFetchErr(e.message ?? "Error loading messages");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // ── Navigate to conversation thread ─────────────────────────────────────
  // Opens the thread page — uses Next.js router push with query params
  const openConversation = (conv: Conversation) => {
    // Mark as read locally
    setLocalReadIds((prev) => new Set([...prev, conv.conversationId]));
    // Navigate to thread page
    window.location.href = `/facebook/messages/${conv.conversationId}?senderName=${encodeURIComponent(conv.sender)}&senderId=${conv.senderId ?? ""}`;
  };

  // ── Mark bulk replied ────────────────────────────────────────────────────
  const markBulkReplied = (
    succeeded: { conversationId: string; message: string }[],
  ) => {
    const ids = succeeded.map((s) => s.conversationId);
    setRepliedIds((prev) => new Set([...prev, ...ids]));
    setLocalReadIds((prev) => new Set([...prev, ...ids]));
  };

  // ── AI bulk run ──────────────────────────────────────────────────────────
  const runBulkAI = async () => {
    if (replyableConversations.length === 0) return;

    const seed: AIMessageItem[] = replyableConversations
      .filter((c) => c.senderId !== null)
      .map((c) => ({
        conversationId: c.conversationId,
        sender: c.sender,
        preview: c.preview,
        senderId: c.senderId!,
        status: "pending",
      }));

    setAiItems(seed);
    setAiComplete(false);
    setShowAIModal(true);

    const setItemStatus = (
      conversationId: string,
      patch: Partial<AIMessageItem>,
    ) => {
      setAiItems((prev) =>
        prev.map((i) =>
          i.conversationId === conversationId ? { ...i, ...patch } : i,
        ),
      );
    };

    const succeeded: { conversationId: string; message: string }[] = [];

    for (const item of seed) {
      setItemStatus(item.conversationId, { status: "thinking" });
      await delay(500);

      try {
        setItemStatus(item.conversationId, { status: "writing" });

        // Call your AI endpoint — no base URL prefix (Next.js API route)
        const aiRes = await fetch("/api/ai/facebook-message-reply", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: getAuthHeader() ?? "",
          },
          body: JSON.stringify({
            messageText: item.preview,
            senderName: item.sender,
          }),
        });
        const aiJson = await aiRes.json();
        const replyText: string = aiJson.reply ?? aiJson.message ?? "";
        if (!replyText) throw new Error("Empty AI reply");

        setItemStatus(item.conversationId, { reply: replyText });
        await delay(400);

        setItemStatus(item.conversationId, { status: "posting" });

        // Send the reply via your backend
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/facebook/messages/send`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: getAuthHeader() ?? "",
            },
            body: JSON.stringify({
              recipientId: item.senderId,
              message: replyText,
            }),
          },
        );
        await delay(600);

        setItemStatus(item.conversationId, {
          status: "done",
          reply: replyText,
        });
        succeeded.push({
          conversationId: item.conversationId,
          message: replyText,
        });
      } catch {
        setItemStatus(item.conversationId, { status: "failed" });
      }

      await delay(800);
    }

    // Mark every conversation the AI processed as read — succeeded or failed
    setLocalReadIds(
      (prev) => new Set([...prev, ...seed.map((s) => s.conversationId)]),
    );
    if (succeeded.length > 0) markBulkReplied(succeeded);
    setAiComplete(true);
  };

  const isLoading = fetching && conversations.length === 0;

  return (
    <div
      className="w-full"
      style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}
    >
      {/* AI Modal */}
      {showAIModal && (
        <AIBulkMessageModal
          items={aiItems}
          isDark={isDark}
          isComplete={aiComplete}
          onClose={() => {
            setShowAIModal(false);
            setAiItems([]);
            setAiComplete(false);
          }}
        />
      )}

      {/* Bulk Message Modal */}
      {showBulkModal && (
        <BulkMessageModal
          conversations={replyableConversations}
          isDark={isDark}
          onClose={() => setShowBulkModal(false)}
          onSuccess={(s) => {
            markBulkReplied(s);
            setShowBulkModal(false);
          }}
        />
      )}

      {/* ── Header ── */}
      <div className="pt-2 pb-4">
        <div className="flex items-center justify-between gap-2">
          {/* Left: back arrow + title */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => router.back()}
              className={`w-8 h-8 flex items-center justify-center rounded-xl shrink-0 transition-all active:scale-90
              ${isDark ? "bg-white/[0.07] text-slate-300" : "bg-white text-slate-600 border border-slate-200"}`}
            >
              <ArrowLeft size={16} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                <FacebookLogo />
                <h1
                  className={`text-[18px] font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
                  style={{ letterSpacing: "-0.03em" }}
                >
                  Messages
                </h1>
                {conversations.length > 0 && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${isDark ? "bg-white/[0.08] text-slate-400" : "bg-slate-100 text-slate-500"}`}
                  >
                    {conversations.length}
                  </span>
                )}
                {liveUnreadCount > 0 && (
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white shrink-0"
                    style={{ background: "#1877F2" }}
                  >
                    {liveUnreadCount} unread
                  </span>
                )}
              </div>
              {liveUnreadCount < 0 && (
                <p
                  className={`text-[12px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
                >
                  {/* {liveUnreadCount > 0
                  ? `${liveUnreadCount} unread messages`
                  : "All caught up!"} */}
                  All Caught Up!
                </p>
              )}
            </div>
          </div>

          {/* Right: action buttons — shrink-0 so they never overflow */}
          <div className="flex items-center gap-1.5 shrink-0">
            {replyableConversations.length > 0 && (
              <>
                <button
                  onClick={runBulkAI}
                  className="h-8 px-2.5 rounded-xl flex items-center gap-1 text-[11px] font-semibold text-white transition-all active:scale-[0.97] relative overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg,#1d4ed8,#1877F2)",
                    boxShadow: "0 4px 14px rgba(24,119,242,0.4)",
                  }}
                >
                  <Brain size={12} />
                  <span className="hidden sm:inline">AI Reply</span>
                  <span
                    className="text-[9px] font-black px-1 py-0.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.2)" }}
                  >
                    {replyableConversations.length}
                  </span>
                </button>
                <button
                  onClick={() => setShowBulkModal(true)}
                  className={`h-8 px-2.5 rounded-xl flex items-center gap-1 text-[11px] font-semibold border transition-all active:scale-[0.97]
                  ${isDark ? "bg-white/[0.06] border-white/[0.08] text-slate-300 hover:bg-white/[0.10]" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                >
                  <Zap size={12} style={{ color: "#1877F2" }} />
                  <span className="hidden sm:inline">Bulk</span>
                </button>
              </>
            )}
            <button
              onClick={fetchMessages}
              disabled={fetching}
              className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all active:scale-90 disabled:opacity-50
              ${isDark ? "bg-white/[0.07] text-slate-400" : "bg-white text-slate-500 border border-slate-200"}`}
            >
              <RefreshCw size={14} className={fetching ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Error ── */}
      {fetchErr && (
        <div
          className={`rounded-2xl p-4 flex items-start gap-3 border mb-4
          ${isDark ? "bg-red-500/[0.08] border-red-500/20" : "bg-red-50 border-red-200"}`}
        >
          <WifiOff size={16} className="text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-red-400 mb-0.5">
              Failed to load messages
            </p>
            <p
              className={`text-[12px] ${isDark ? "text-red-500/70" : "text-red-400"}`}
            >
              {fetchErr}
            </p>
            <button
              onClick={fetchMessages}
              className="mt-2 text-[12px] font-semibold text-blue-500"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* ── Skeleton ── */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3 mb-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`rounded-2xl p-4 border h-24 animate-pulse
                ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05]"}`}
              />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {[...Array(5)].map((_, i) => (
              <ConversationSkeleton key={i} isDark={isDark} />
            ))}
          </div>
        </div>
      )}

      {!isLoading && conversations.length > 0 && (
        <>
          {/* ── Stats ── */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <StatCard
              label="Total"
              value={conversations.length}
              sub="conversations"
              icon={<MessageCircle size={14} />}
              color="#1877F2"
              isDark={isDark}
            />
            <StatCard
              label="Unread"
              value={liveUnreadCount}
              sub="new messages"
              icon={<Circle size={14} />}
              color="#f59e0b"
              isDark={isDark}
            />
            <StatCard
              label="Read"
              value={conversations.length - liveUnreadCount}
              sub="seen"
              icon={<CheckCircle2 size={14} />}
              color="#22c55e"
              isDark={isDark}
            />
          </div>

          {/* ── AI banner — shown when there are unread replyable conversations ── */}
          {replyableConversations.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <button
                onClick={runBulkAI}
                className="flex-1 h-14 rounded-[14px] flex items-center justify-center gap-2.5 text-[13.5px] font-bold text-white transition-all active:scale-[0.97] relative overflow-hidden p-4"
                style={{
                  background: "linear-gradient(135deg,#1d4ed8,#1877F2,#60a5fa)",
                  boxShadow: "0 6px 20px rgba(24,119,242,0.42)",
                }}
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.12) 50%,transparent 100%)",
                    animation: "shimmer 2.5s linear infinite",
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
                    AI Auto-Reply {replyableConversations.length} Conversation
                    {replyableConversations.length !== 1 ? "s" : ""}
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
              <button
                onClick={() => setShowBulkModal(true)}
                className={`h-14 px-5 rounded-[14px] flex items-center gap-2 text-[13px] font-semibold border transition-all active:scale-[0.97]
                ${isDark ? "bg-white/[0.06] border-white/[0.08] text-slate-300 hover:bg-white/[0.10]" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                <Zap size={15} style={{ color: "#1877F2" }} />
                Bulk Reply
              </button>
            </div>
          )}

          {/* ── Conversation list ── */}
          <div className="flex flex-col gap-2">
            {conversations.map((conv) => (
              <ConversationRow
                key={conv.conversationId}
                conv={conv}
                isDark={isDark}
                isRead={isRead(conv)}
                isReplied={isReplied(conv)}
                onClick={() => openConversation(conv)}
              />
            ))}
          </div>

          {/* ── Messenger note ── */}
          <div
            className={`mt-4 rounded-2xl p-3.5 border flex items-center gap-3
            ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05]"}`}
          >
            <Send size={14} style={{ color: "#1877F2" }} className="shrink-0" />
            <p
              className={`text-[11.5px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
            >
              Click any conversation to open the full thread. Replies are sent
              via Messenger — the 24-hour window applies.
            </p>
          </div>
        </>
      )}

      {/* ── Empty state ── */}
      {!isLoading && !fetchErr && conversations.length === 0 && (
        <div
          className={`rounded-2xl p-10 text-center border
          ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05]"}`}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "#1877F215" }}
          >
            <Mail size={28} style={{ color: "#1877F2" }} />
          </div>
          <p
            className={`text-[15px] font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            No messages yet
          </p>
          <p
            className={`text-[13px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
          >
            Messages from your Facebook Page will appear here.
          </p>
        </div>
      )}

      <style>{`
        @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}
        @keyframes bounce-dot{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
      `}</style>
    </div>
  );
}
