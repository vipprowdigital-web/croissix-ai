// app/(main)/comments/facebook/page.tsx
// Web port of the mobile FacebookCommentsScreen.
// Theme matches the existing Google Reviews web page exactly:
//   cards: #131c2d (dark) / white (light)
//   inputs: #182236 (dark)
//   accent blue: #1d4ed8 → #3b82f6
//   accent green: #16a34a → #22c55e
//   font: -apple-system, SF Pro Text/Display
//
// Key differences from mobile:
//   - ReplyComposer is inline (card expands), not a modal — same pattern as Google Reviews
//   - AIBulkReplyModal is a full-screen overlay — same pattern as Google Reviews AIReplyModal
//   - BulkReplyModal is a centered dialog overlay
//   - Layout: stat grid 4-col, comment grid 1→2→3-col

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import {
  MessageCircle,
  CornerDownRight,
  RefreshCw,
  BarChart3,
  CheckCircle2,
  TrendingUp,
  Send,
  CheckSquare,
  Square,
  X,
  Zap,
  Brain,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
  WifiOff,
  FileText,
  Clock,
  Trash2,
} from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { getAuthHeader, getToken } from "@/lib/token";

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
interface CommentReply {
  id: string;
  message: string;
  createdAt: string;
}
interface FacebookComment {
  commentId: string;
  commentText: string;
  commentedBy: string;
  commenterId: string | null;
  commentCreatedAt: string;
  postId: string;
  postMessage: string;
  replies?: CommentReply[];
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
  commentedBy: string;
  commentText: string;
  status: AIItemStatus;
  reply?: string;
}
type FilterType = "all" | "unreplied" | "replied";

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
function mkInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const AV_COLORS = [
  "#1877F2",
  "#8b5cf6",
  "#ec4899",
  "#10b981",
  "#f59e0b",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
];
function avColor(name: string) {
  return AV_COLORS[name.charCodeAt(0) % AV_COLORS.length];
}

function FacebookLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════
   STAT CARD  (matches Google Reviews StatCard exactly)
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
   REPLY RATE BAR  (web version of mobile ReplyRateBar)
══════════════════════════════════════════════════════════ */
function ReplyRateBar({
  replyRate,
  repliedCount,
  pendingCount,
  total,
  isDark,
}: {
  replyRate: number;
  repliedCount: number;
  pendingCount: number;
  total: number;
  isDark: boolean;
}) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    // Animate in after mount — CSS transition does the work
    const t = setTimeout(() => setWidth(replyRate), 300);
    return () => clearTimeout(t);
  }, [replyRate]);

  const barColor =
    replyRate >= 70 ? "#22c55e" : replyRate >= 40 ? "#f59e0b" : "#3b82f6";

  return (
    <div
      className={`rounded-2xl p-4 border ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05] shadow-sm"}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="p-1.5 rounded-lg"
            style={{ background: "#1877F215" }}
          >
            <BarChart3 size={14} style={{ color: "#1877F2" }} />
          </span>
          <span
            className={`text-[11px] font-black uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}
          >
            Reply Rate
          </span>
        </div>
        <span
          className={`text-2xl font-black ${isDark ? "text-white" : "text-slate-900"}`}
          style={{ letterSpacing: "-0.04em" }}
        >
          {Math.round(replyRate)}
          <span
            className={`text-sm font-bold ${isDark ? "text-slate-500" : "text-slate-400"}`}
          >
            %
          </span>
        </span>
      </div>
      <div
        className={`h-3 rounded-full overflow-hidden mb-2 ${isDark ? "bg-white/[0.06]" : "bg-slate-100"}`}
      >
        <div
          className="h-full rounded-full transition-all duration-[1100ms] ease-out"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, #1877F2, ${barColor})`,
            boxShadow: `0 0 8px ${barColor}60`,
          }}
        />
      </div>
      <div className="flex justify-between">
        <span className="text-xs font-bold text-emerald-500">
          {repliedCount} replied
        </span>
        <span
          className={`text-xs font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}
        >
          {pendingCount} pending · {total} total
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   POSTS BREAKDOWN  (bar chart per post)
══════════════════════════════════════════════════════════ */
function PostsBreakdown({
  comments,
  isDark,
}: {
  comments: FacebookComment[];
  isDark: boolean;
}) {
  const postMap = comments.reduce<
    Record<string, { count: number; label: string }>
  >((acc, c) => {
    if (!acc[c.postId]) acc[c.postId] = { count: 0, label: c.postMessage };
    acc[c.postId].count++;
    return acc;
  }, {});
  const entries = Object.entries(postMap)
    .map(([id, { count, label }]) => ({ id, count, label }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const max = entries[0]?.count ?? 1;
  const unique = Object.keys(postMap).length;
  const avg = unique > 0 ? (comments.length / unique).toFixed(1) : "0";

  return (
    <div
      className={`rounded-2xl p-4 border ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05] shadow-sm"}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="p-1.5 rounded-lg"
            style={{ background: "#1877F215" }}
          >
            <FileText size={14} style={{ color: "#1877F2" }} />
          </span>
          <span
            className={`text-[11px] font-black uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}
          >
            Posts Breakdown
          </span>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <div
              className={`text-sm font-black ${isDark ? "text-white" : "text-slate-900"}`}
            >
              {unique}
            </div>
            <div
              className={`text-[9px] font-semibold uppercase ${isDark ? "text-slate-600" : "text-slate-400"}`}
            >
              Posts
            </div>
          </div>
          <div className="text-right">
            <div
              className={`text-sm font-black ${isDark ? "text-white" : "text-slate-900"}`}
            >
              {avg}
            </div>
            <div
              className={`text-[9px] font-semibold uppercase ${isDark ? "text-slate-600" : "text-slate-400"}`}
            >
              Avg/Post
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {entries.map((p) => (
          <div key={p.id}>
            <div className="flex justify-between mb-1">
              <span
                className={`text-xs font-medium truncate max-w-[70%] ${isDark ? "text-slate-300" : "text-slate-700"}`}
              >
                {p.label}
              </span>
              <span
                className={`text-xs font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                {p.count}
              </span>
            </div>
            <div
              className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-white/[0.07]" : "bg-slate-100"}`}
            >
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-700"
                style={{ width: `${(p.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
        {unique > 5 && (
          <p
            className={`text-[10px] text-center font-medium mt-1 ${isDark ? "text-slate-600" : "text-slate-400"}`}
          >
            +{unique - 5} more posts
          </p>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   REPLY COMPOSER  (inline expand — mirrors Google Reviews ReplyComposer)
══════════════════════════════════════════════════════════ */
function ReplyComposer({
  comment,
  isDark,
  onSend,
  onClose,
  initialText = "",
  isEdit = false,
}: {
  comment: FacebookComment;
  isDark: boolean;
  onSend: (text: string) => Promise<void>;
  onClose: () => void;
  initialText?: string;
  isEdit?: boolean;
}) {
  const [text, setText] = useState(initialText);
  const [generating, setGenerating] = useState(false);
  const [posting, setPosting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [apiError, setApiError] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const MAX = 1000;

  const generateAI = async () => {
    try {
      setGenerating(true);
      setApiError("");
      const res = await fetch("/api/ai/facebook-comment-reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: getAuthHeader() ?? "",
        },
        body: JSON.stringify({
          commentText: comment.commentText,
          commenterName: comment.commentedBy,
        }),
      });
      const json = await res.json();
      if (!json.success && !json.reply)
        throw new Error(json.error || "AI generation failed");
      setText(json.reply ?? json.message ?? "");
      taRef.current?.focus();
    } catch (e: any) {
      setApiError(e.message || "Failed to generate AI reply");
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!text.trim() || text.length > MAX) return;
    setPosting(true);
    setApiError("");
    try {
      await onSend(text.trim());
    } catch (e: any) {
      setApiError(e.message ?? "Failed to post reply.");
    } finally {
      setPosting(false);
    }
  };

  const remaining = MAX - text.length;
  const overLimit = remaining < 0;

  return (
    <div
      className={`mt-3 rounded-2xl p-4 border ${isDark ? "bg-[#0d1421] border-white/[0.08]" : "bg-slate-50 border-black/[0.06]"}`}
    >
      {/* AI button row */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <button
          onClick={generateAI}
          disabled={generating}
          className={`flex items-center gap-1.5 h-8 px-3 rounded-xl text-[12px] font-semibold transition-all active:scale-95 disabled:opacity-60
            ${isDark ? "bg-blue-500/15 text-blue-400 border border-blue-500/25" : "bg-blue-50 text-blue-600 border border-blue-200"}`}
        >
          {generating ? (
            <>
              <RefreshCw size={12} className="animate-spin" /> Generating…
            </>
          ) : (
            <>
              <Sparkles size={12} /> AI Reply
            </>
          )}
        </button>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          ref={taRef}
          value={text}
          rows={5}
          onChange={(e) => {
            setText(e.target.value);
            setApiError("");
          }}
          placeholder={isEdit ? "Edit your reply…" : "Write your reply… or tap AI Reply to generate one."}
          className={`w-full rounded-xl p-3 text-[13.5px] resize-none outline-none border transition-all duration-200
            ${
              overLimit
                ? "border-red-500/50"
                : isDark
                  ? "border-white/[0.07] focus:border-blue-500/50"
                  : "border-black/[0.07] focus:border-blue-500/40"
            }
            ${
              isDark
                ? "bg-[#182236] text-white placeholder:text-slate-600"
                : "bg-white text-slate-900 placeholder:text-slate-400"
            }`}
        />
        {text.length > 0 && (
          <button
            onClick={() => {
              navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className={`absolute top-2 right-2 p-1.5 rounded-lg ${isDark ? "text-slate-500" : "text-slate-400"}`}
          >
            {copied ? (
              <Check size={13} className="text-green-500" />
            ) : (
              <Copy size={13} />
            )}
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 px-0.5">
        <div>
          {apiError && (
            <span className="flex items-center gap-1 text-[11px] text-red-400 font-medium">
              <AlertCircle size={11} />
              {apiError}
            </span>
          )}
          {!apiError && overLimit && (
            <span className="text-[11px] text-red-400 font-medium">
              {Math.abs(remaining)} over limit
            </span>
          )}
          {!apiError && !overLimit && remaining < 150 && text.length > 0 && (
            <span className="text-[11px] text-orange-400 font-medium">
              {remaining} chars left
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className={`h-8 px-3 rounded-xl text-[12px] font-semibold transition-all
              ${isDark ? "text-slate-500" : "text-slate-400"}`}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!text.trim() || overLimit || posting}
            className="h-8 px-4 rounded-xl text-[12px] font-bold text-white flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
              boxShadow: "0 3px 12px rgba(37,99,235,0.35)",
            }}
          >
            {posting ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              <>
                <Send size={12} /> {isEdit ? "Update Reply" : "Post Reply"}
              </>
            )}
          </button>
        </div>
      </div>
      <p
        className={`text-[10.5px] mt-2.5 ${isDark ? "text-slate-700" : "text-slate-400"}`}
      >
        Replies appear publicly on Facebook as your Page.
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   COMMENT CARD
══════════════════════════════════════════════════════════ */
function CommentCard({
  comment,
  isDark,
  isReplied,
  onSend,
  onEdit,
  onDelete,
}: {
  comment: FacebookComment;
  isDark: boolean;
  isReplied: boolean;
  onSend: (text: string) => Promise<void>;
  onEdit: (replyId: string, message: string) => Promise<void>;
  onDelete: (replyId: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const needsTrunc = comment.commentText.length > 150;

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-all duration-200 flex flex-col
      ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05] shadow-sm"}
      ${isReplied ? (isDark ? "border-emerald-500/20" : "border-emerald-200/60") : ""}`}
    >
      <div className="p-4 flex-1">
        {/* Post label */}
        <p
          className={`text-[10px] font-bold uppercase tracking-wider mb-2 truncate ${isDark ? "text-slate-600" : "text-slate-400"}`}
        >
          on: {comment.postMessage}
        </p>

        {/* Author row */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0"
            style={{ background: avColor(comment.commentedBy) }}
          >
            {mkInitials(comment.commentedBy)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-[14px] font-semibold truncate ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {comment.commentedBy}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-[11px] ${isDark ? "text-slate-600" : "text-slate-400"}`}
                >
                  {formatRelativeTime(comment.commentCreatedAt)}
                </span>
                {isReplied && (
                  <span
                    className={`text-[10px] font-bold border rounded-full px-2 py-0.5
                    ${
                      isDark
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    Replied
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comment text */}
        <p
          className={`text-[13.5px] leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700"}`}
        >
          {needsTrunc && !expanded
            ? comment.commentText.slice(0, 150) + "…"
            : comment.commentText}
          {needsTrunc && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="ml-1 text-blue-500 text-[12px] font-medium"
            >
              {expanded ? "Less" : "More"}
            </button>
          )}
        </p>

        {/* Reply preview */}
        {isReplied && comment.replies && comment.replies.length > 0 && (
          <div
            className={`mt-3 rounded-xl p-3 border-l-2 border-blue-500
            ${isDark ? "bg-blue-500/[0.07]" : "bg-blue-50/60"}`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-blue-500" />
                <span className="text-[10px] font-bold uppercase tracking-wide text-blue-500">
                  Your Reply
                </span>
              </div>
              <button
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true);
                  try {
                    await onDelete(comment.replies![0].id);
                  } finally {
                    setDeleting(false);
                  }
                }}
                className={`p-1 rounded-lg transition-all disabled:opacity-40
                  ${isDark ? "text-red-400/60 hover:text-red-400" : "text-red-400/70 hover:text-red-500"}`}
              >
                {deleting ? (
                  <RefreshCw size={11} className="animate-spin" />
                ) : (
                  <Trash2 size={11} />
                )}
              </button>
            </div>
            <p
              className={`text-[12.5px] leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}
            >
              {comment.replies[0].message}
            </p>
          </div>
        )}

        {/* Action bar */}
        <div
          className={`flex items-center gap-1 mt-3 pt-3 border-t ${isDark ? "border-white/[0.05]" : "border-slate-100"}`}
        >
          <button
            onClick={() => {
              if (open) {
                setOpen(false);
              } else {
                setIsEditMode(isReplied);
                setOpen(true);
              }
            }}
            className={`flex items-center gap-1.5 h-7 px-3 rounded-xl text-[12px] font-semibold transition-all active:scale-95
              ${
                open
                  ? "bg-blue-500 text-white"
                  : isDark
                    ? "bg-white/[0.07] text-slate-300 hover:bg-white/[0.12]"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
          >
            <CornerDownRight size={12} />
            {isReplied ? "Edit Reply" : "Reply"}
          </button>
        </div>
      </div>

      {/* Inline ReplyComposer */}
      {open && (
        <div
          className={`px-4 pb-4 border-t ${isDark ? "border-white/[0.05]" : "border-slate-100"}`}
        >
          <ReplyComposer
            comment={comment}
            isDark={isDark}
            initialText={isEditMode ? (comment.replies?.[0]?.message ?? "") : ""}
            isEdit={isEditMode}
            onSend={async (text) => {
              if (isEditMode && comment.replies?.[0]?.id) {
                await onEdit(comment.replies[0].id, text);
              } else {
                await onSend(text);
              }
              setOpen(false);
            }}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

function CommentSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05]"}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-full shrink-0 animate-pulse ${isDark ? "bg-white/[0.07]" : "bg-slate-100"}`}
        />
        <div className="flex-1">
          <div
            className={`h-3.5 w-28 rounded mb-2 animate-pulse ${isDark ? "bg-white/[0.07]" : "bg-slate-100"}`}
          />
          <div
            className={`h-2.5 w-20 rounded animate-pulse ${isDark ? "bg-white/[0.07]" : "bg-slate-100"}`}
          />
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <div
          className={`h-2.5 w-full rounded animate-pulse ${isDark ? "bg-white/[0.07]" : "bg-slate-100"}`}
        />
        <div
          className={`h-2.5 w-3/4 rounded animate-pulse ${isDark ? "bg-white/[0.07]" : "bg-slate-100"}`}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   BULK REPLY MODAL  (manual — centered dialog)
══════════════════════════════════════════════════════════ */
function BulkReplyModal({
  comments,
  isDark,
  onClose,
  onSuccess,
}: {
  comments: FacebookComment[];
  isDark: boolean;
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
    try {
      const replies = Array.from(selected).map((commentId) => ({
        commentId,
        message: message.trim(),
      }));
      const res = await fetch("/api/facebook/comments/reply/bulk", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: getAuthHeader() ?? "",
        },
        body: JSON.stringify({ replies }),
      });
      const json = await res.json();
      const resultData = json.results as {
        commentId: string;
        success: boolean;
        error?: string;
      }[];
      setResults(resultData);
      setShowResults(true);
      const succeeded = resultData
        .filter((r) => r.success)
        .map((r) => ({ commentId: r.commentId, message: message.trim() }));
      if (succeeded.length > 0) onSuccess(succeeded);
    } catch (e: any) {
      alert(e.message || "Bulk reply failed.");
    } finally {
      setSending(false);
    }
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
        {/* Blue top accent */}
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
              Bulk Reply
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
                {results.map((r) => {
                  const c = comments.find((c) => c.commentId === r.commentId);
                  return (
                    <div
                      key={r.commentId}
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
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5
                        ${r.success ? "bg-emerald-500" : "bg-red-500"}`}
                      >
                        <span className="text-white text-[10px] font-black">
                          {r.success ? "✓" : "✕"}
                        </span>
                      </div>
                      <div>
                        <p
                          className={`text-[12px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                        >
                          {c?.commentedBy ?? r.commentId}
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
                Reply Message
              </p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="Type a reply to send to all selected comments…"
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
                {message.length}/1000
              </p>

              <div className="flex items-center justify-between mb-2">
                <p
                  className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}
                >
                  Select Comments ({selected.size}/{comments.length})
                </p>
                <button
                  onClick={toggleAll}
                  className="text-[12px] font-bold text-blue-500"
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
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-[12px] font-bold truncate ${isDark ? "text-slate-200" : "text-slate-800"}`}
                        >
                          {c.commentedBy}
                        </p>
                        <p
                          className={`text-[11px] line-clamp-1 mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}
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
                  : `Reply to ${selected.size} Comment${selected.size !== 1 ? "s" : ""}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   AI BULK REPLY MODAL  (full-screen overlay — mirrors Google Reviews AIReplyModal)
══════════════════════════════════════════════════════════ */
const AI_PHASES = [
  "Analysing comment sentiment…",
  "Identifying tone & intent…",
  "Crafting a personalised reply…",
  "Reviewing for professionalism…",
  "Adding engagement hooks…",
  "Finalising response…",
];

function AIBulkReplyModal({
  items,
  isDark,
  onClose,
  isComplete,
}: {
  items: AICommentItem[];
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
                ? `${done} replies posted · ${failed > 0 ? `${failed} failed` : "all successful"}`
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
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-1">
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
          {/* Active */}
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
                      style={{ background: avColor(active.commentedBy) }}
                    >
                      {mkInitials(active.commentedBy)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-[12px] font-bold mb-0.5 ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {active.commentedBy}
                      </p>
                      {active.commentText && (
                        <p
                          className={`text-[10.5px] leading-relaxed line-clamp-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                        >
                          {active.commentText}
                        </p>
                      )}
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
                      {active.status === "thinking" && "Analysing comment…"}
                      {active.status === "writing" && "Generating AI reply…"}
                      {active.status === "posting" && "Posting to Facebook…"}
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
                    key={item.commentId}
                    className={`flex items-start gap-3 px-3.5 py-3 rounded-2xl border
                      ${isDark ? "bg-white/[0.025] border-white/[0.05]" : "bg-white border-slate-100"}`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-black shrink-0"
                      style={{
                        background: avColor(item.commentedBy),
                        opacity: 0.85,
                      }}
                    >
                      {mkInitials(item.commentedBy)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-[11.5px] font-bold truncate ${isDark ? "text-slate-300" : "text-slate-700"}`}
                      >
                        {item.commentedBy}
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
                    key={item.commentId}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl ${isDark ? "bg-white/[0.015]" : "bg-slate-50"}`}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0"
                      style={{
                        background: avColor(item.commentedBy),
                        opacity: 0.5,
                      }}
                    >
                      {item.commentedBy[0]?.toUpperCase()}
                    </div>
                    <p
                      className={`text-[10.5px] flex-1 truncate ${isDark ? "text-slate-600" : "text-slate-400"}`}
                    >
                      {item.commentedBy}
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
                {done} replies posted successfully!
              </p>
              <p
                className={`text-[11px] mb-4 ${isDark ? "text-emerald-400/60" : "text-emerald-600"}`}
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

/* ══════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════ */
export default function FacebookCommentsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  // Data
  const [comments, setComments] = useState<FacebookComment[]>([]);
  const [fetching, setFetching] = useState(false);
  const [fetchErr, setFetchErr] = useState("");
  const [repliedIds, setRepliedIds] = useState<Set<string>>(new Set());

  // UI state
  const [filter, setFilter] = useState<FilterType>("all");
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiItems, setAiItems] = useState<AICommentItem[]>([]);
  const [aiComplete, setAiComplete] = useState(false);

  const token = getToken();

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchComments = useCallback(async () => {
    setFetching(true);
    setFetchErr("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/facebook/comments`,
        {
          headers: { Authorization: getAuthHeader() ?? "" },
        },
      );
      const json = await res.json();
      if (!json.success)
        throw new Error(json.message ?? "Failed to load comments");
      const data: FacebookComment[] = json.data;
      setComments(data);
      // Seed replied IDs from API (backend now returns replies per comment)
      const apiReplied = new Set(
        data
          .filter((c) => c.replies && c.replies.length > 0)
          .map((c) => c.commentId),
      );
      setRepliedIds((prev) => new Set([...prev, ...apiReplied]));
    } catch (e: any) {
      setFetchErr(e.message ?? "Error loading comments");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // ── Stats ────────────────────────────────────────────────────────────────
  const totalComments = comments.length;
  const repliedCount = comments.filter((c) =>
    repliedIds.has(c.commentId),
  ).length;
  const pendingCount = totalComments - repliedCount;
  const replyRate =
    totalComments > 0 ? (repliedCount / totalComments) * 100 : 0;
  const unrepliedComments = comments.filter(
    (c) => !repliedIds.has(c.commentId),
  );

  // ── Optimistic updates ───────────────────────────────────────────────────
  const markReplied = (commentId: string, replyMessage: string) => {
    setRepliedIds((prev) => new Set([...prev, commentId]));
    setComments((prev) =>
      prev.map((c) =>
        c.commentId === commentId
          ? {
              ...c,
              replies: [
                {
                  id: "",
                  message: replyMessage,
                  createdAt: new Date().toISOString(),
                },
                ...(c.replies ?? []),
              ],
            }
          : c,
      ),
    );
  };
  const markBulkReplied = (
    succeeded: { commentId: string; message: string }[],
  ) => {
    const ids = succeeded.map((s) => s.commentId);
    setRepliedIds((prev) => new Set([...prev, ...ids]));
    setComments((prev) =>
      prev.map((c) => {
        const match = succeeded.find((s) => s.commentId === c.commentId);
        if (!match) return c;
        return {
          ...c,
          replies: [
            {
              id: "",
              message: match.message,
              createdAt: new Date().toISOString(),
            },
            ...(c.replies ?? []),
          ],
        };
      }),
    );
  };

  // ── Single reply via ReplyComposer ───────────────────────────────────────
  const postReply = async (commentId: string, message: string) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/facebook/comments/reply`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: getAuthHeader() ?? "",
        },
        body: JSON.stringify({ commentId, message }),
      },
    );
    const json = await res.json();
    if (!json.success) throw new Error(json.message ?? "Reply failed");
    markReplied(commentId, message);
  };

  const editReply = async (commentId: string, replyId: string, message: string) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/facebook/comments/${replyId}`,
      {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: getAuthHeader() ?? "",
        },
        body: JSON.stringify({ message }),
      },
    );
    const json = await res.json();
    if (!json.success) throw new Error(json.message ?? "Update failed");
    setComments((prev) =>
      prev.map((c) =>
        c.commentId === commentId
          ? {
              ...c,
              replies: c.replies?.map((r) =>
                r.id === replyId ? { ...r, message } : r,
              ),
            }
          : c,
      ),
    );
  };

  const deleteReply = async (commentId: string, replyId: string) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/facebook/comments/${replyId}`,
      {
        method: "DELETE",
        credentials: "include",
        headers: { Authorization: getAuthHeader() ?? "" },
      },
    );
    const json = await res.json();
    if (!json.success) throw new Error(json.message ?? "Delete failed");
    setComments((prev) =>
      prev.map((c) =>
        c.commentId === commentId
          ? { ...c, replies: c.replies?.filter((r) => r.id !== replyId) }
          : c,
      ),
    );
    setRepliedIds((prev) => {
      const next = new Set(prev);
      next.delete(commentId);
      return next;
    });
  };

  // ── AI bulk reply ─────────────────────────────────────────────────────────
  const runBulkAI = async () => {
    if (unrepliedComments.length === 0) return;
    const seed: AICommentItem[] = unrepliedComments.map((c) => ({
      commentId: c.commentId,
      commentedBy: c.commentedBy,
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
    const succeeded: { commentId: string; message: string }[] = [];

    for (const item of seed) {
      setItemStatus(item.commentId, { status: "thinking" });
      await delay(500);
      try {
        setItemStatus(item.commentId, { status: "writing" });
        const aiRes = await fetch("/ai/facebook-comment-reply", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: getAuthHeader() ?? "",
          },
          body: JSON.stringify({
            commentText: item.commentText,
            commenterName: item.commentedBy,
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
        succeeded.push({ commentId: item.commentId, message: replyText });
      } catch {
        setItemStatus(item.commentId, { status: "failed" });
      }
      await delay(800);
    }

    if (succeeded.length > 0) markBulkReplied(succeeded);
    setAiComplete(true);
  };

  // ── Filter ───────────────────────────────────────────────────────────────
  const visible = comments.filter((c) => {
    if (filter === "unreplied") return !repliedIds.has(c.commentId);
    if (filter === "replied") return repliedIds.has(c.commentId);
    return true;
  });

  const isLoading = fetching && comments.length === 0;

  return (
    <div
      className="w-full"
      style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}
    >
      {/* AI Modal */}
      {showAIModal && (
        <AIBulkReplyModal
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

      {/* Bulk Reply Modal */}
      {showBulkModal && (
        <BulkReplyModal
          comments={unrepliedComments}
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
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <FacebookLogo />
              <h1
                className={`text-[18px] font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
                style={{ letterSpacing: "-0.03em" }}
              >
                Comments
              </h1>
              {totalComments > 0 && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full
                  ${isDark ? "bg-white/[0.08] text-slate-400" : "bg-slate-100 text-slate-500"}`}
                >
                  {totalComments}
                </span>
              )}
            </div>
            <p
              className={`text-[12px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
            >
              {pendingCount > 0
                ? `${pendingCount} awaiting reply`
                : "All caught up!"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchComments}
              disabled={fetching}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90 disabled:opacity-50
                ${isDark ? "bg-white/[0.07] text-slate-400" : "bg-white text-slate-500 border border-slate-200"}`}
            >
              <RefreshCw size={15} className={fetching ? "animate-spin" : ""} />
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
              Failed to load comments
            </p>
            <p
              className={`text-[12px] ${isDark ? "text-red-500/70" : "text-red-400"}`}
            >
              {fetchErr}
            </p>
            <button
              onClick={fetchComments}
              className="mt-2 text-[12px] font-semibold text-blue-500"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* ── Skeletons ── */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-1">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`rounded-2xl p-4 border h-24 animate-pulse
                ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05]"}`}
              />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <CommentSkeleton key={i} isDark={isDark} />
            ))}
          </div>
        </div>
      )}

      {!isLoading && comments.length > 0 && (
        <>
          {/* ── Stat grid ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <StatCard
              label="Total"
              value={totalComments}
              sub="across all posts"
              icon={<MessageCircle size={14} />}
              color="#1877F2"
              isDark={isDark}
            />
            <StatCard
              label="Reply Rate"
              value={`${Math.round(replyRate)}%`}
              sub={`${repliedCount} of ${totalComments} replied`}
              icon={<BarChart3 size={14} />}
              color="#3b82f6"
              isDark={isDark}
            />
            <StatCard
              label="Replied"
              value={repliedCount}
              sub="comments answered"
              icon={<CheckCircle2 size={14} />}
              color="#22c55e"
              isDark={isDark}
            />
            <StatCard
              label="Needs Reply"
              value={pendingCount}
              sub="awaiting response"
              icon={<Clock size={14} />}
              color="#f97316"
              isDark={isDark}
            />
          </div>

          {/* ── Rate bar + Posts breakdown side by side on wide screens ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <ReplyRateBar
              replyRate={replyRate}
              repliedCount={repliedCount}
              pendingCount={pendingCount}
              total={totalComments}
              isDark={isDark}
            />
            <PostsBreakdown comments={comments} isDark={isDark} />
          </div>

          {/* ── AI banner + action buttons ── */}
          {unrepliedComments.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              {/* AI auto-reply CTA */}
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
                  <span>AI Auto-Reply {unrepliedComments.length} Comments</span>
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
                className={`h-14 px-5 rounded-[14px] flex items-center gap-2 text-[13px] font-semibold border transition-all active:scale-[0.97]
                  ${
                    isDark
                      ? "bg-white/[0.06] border-white/[0.08] text-slate-300 hover:bg-white/[0.10]"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <Zap size={15} style={{ color: "#1877F2" }} />
                Bulk Reply
              </button>
            </div>
          )}

          {/* ── Filter tabs ── */}
          <div className="flex items-center gap-2 mb-4">
            <div
              className="flex gap-1.5 overflow-x-auto"
              style={{ scrollbarWidth: "none" }}
            >
              {(["all", "unreplied", "replied"] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`h-8 px-3 rounded-xl text-[12px] font-semibold whitespace-nowrap shrink-0 transition-all active:scale-95
                    ${
                      filter === f
                        ? "bg-blue-500 text-white"
                        : isDark
                          ? "bg-white/[0.07] text-slate-400 hover:bg-white/[0.12]"
                          : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                    }`}
                >
                  {f === "all"
                    ? `All (${totalComments})`
                    : f === "unreplied"
                      ? `Unreplied (${pendingCount})`
                      : `Replied (${repliedCount})`}
                </button>
              ))}
            </div>
          </div>

          {/* ── Comment grid ── */}
          {visible.length === 0 ? (
            <div
              className={`rounded-2xl p-8 text-center border
              ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05]"}`}
            >
              <MessageCircle
                size={26}
                className="mx-auto mb-2 text-slate-400"
              />
              <p
                className={`text-[13px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
              >
                No comments match this filter
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {visible.map((c) => (
                <CommentCard
                  key={c.commentId}
                  comment={c}
                  isDark={isDark}
                  isReplied={repliedIds.has(c.commentId)}
                  onSend={(text) => postReply(c.commentId, text)}
                  onEdit={(replyId, message) => editReply(c.commentId, replyId, message)}
                  onDelete={(replyId) => deleteReply(c.commentId, replyId)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Empty state (no comments at all) ── */}
      {!isLoading && !fetchErr && comments.length === 0 && (
        <div
          className={`rounded-2xl p-10 text-center border
          ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05]"}`}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "#1877F215" }}
          >
            <MessageCircle size={28} style={{ color: "#1877F2" }} />
          </div>
          <p
            className={`text-[15px] font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            No comments yet
          </p>
          <p
            className={`text-[13px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
          >
            Comments on your Facebook posts will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
