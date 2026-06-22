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

} from "lucide-react";
import { API } from "@/lib/axiosClient";

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

/* ═══════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════ */
const IG_GRADIENT = "linear-gradient(135deg, #833ab4 0%, #C13584 45%, #fd1d1d 80%, #fcb045 100%)";
const IG_ACCENT = "#C13584";
const MEDIA_BATCH = 6;

/* ═══════════════════════════════════════════════════════
   API
═══════════════════════════════════════════════════════ */
async function fetchComments(
  mediaLimit: number,
  mediaCursor?: string | null,
): Promise<CommentsResponse> {
  const res = await API.get("/instagram/comments", {
    params: { mediaLimit, commentLimit: 50, ...(mediaCursor ? { mediaCursor } : {}) },
  });
  if (!res.data.success) throw new Error(res.data.message ?? "Failed to fetch comments");
  return res.data;
}

async function postReply(commentId: string, message: string): Promise<void> {
  const res = await API.post("/instagram/comments/reply", { commentId, message });
  if (!res.data.success) throw new Error(res.data.message ?? "Failed to post reply");
}

async function deleteComment(commentId: string): Promise<void> {
  const res = await API.delete(`/instagram/comments/${commentId}`);
  if (!res.data.success) throw new Error(res.data.message ?? "Failed to delete comment");
}

/* ═══════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════ */
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
        <div className={`w-8 h-8 rounded-full shrink-0 animate-pulse ${shimmer}`} />
        <div className="flex-1">
          <div className={`h-2.5 w-24 rounded mb-2 animate-pulse ${shimmer}`} />
          <div className={`h-2 w-full rounded mb-1.5 animate-pulse ${shimmer}`} />
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
        className={`w-full max-w-sm rounded-3xl overflow-hidden border shadow-2xl
          ${dark ? "bg-[#130820] border-pink-900/40" : "bg-white border-pink-100"}`}
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
              className={`flex-1 py-3 rounded-2xl text-[13px] font-bold border transition-all active:scale-95
                ${dark ? "bg-white/[0.04] border-white/[0.08] text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"}`}
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
   COMMENT CARD
═══════════════════════════════════════════════════════ */
function CommentCard({
  comment,
  dark,
  onDelete,
  onReplySuccess,
}: {
  comment: IgComment;
  dark: boolean;
  onDelete: (id: string) => void;
  onReplySuccess: () => void;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");

  const replyMut = useMutation({
    mutationFn: ({ commentId, message }: { commentId: string; message: string }) =>
      postReply(commentId, message),
    onSuccess: () => {
      setReplyText("");
      setReplyOpen(false);
      onReplySuccess();
    },
  });

  return (
    <div
      className={`rounded-2xl border overflow-hidden
        ${dark ? "bg-[#130820] border-pink-900/30" : "bg-white border-pink-100/80 shadow-sm"}`}
    >
      {/* Media thumbnail */}
      {comment.mediaUrl && (
        <div className="relative h-24 overflow-hidden">
          <img
            src={comment.mediaUrl}
            alt=""
            className="w-full h-full object-cover opacity-70"
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

      <div className="p-4">
        <div className="flex items-start gap-3 mb-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-[12px] font-black"
            style={{ background: IG_GRADIENT }}
          >
            {comment.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <p className="text-[12.5px] font-black" style={{ color: IG_ACCENT }}>
                @{comment.username}
              </p>
              <p
                className="text-[10px]"
                style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}
              >
                {formatDate(comment.timestamp)}
              </p>
            </div>
            <p
              className={`text-[13px] leading-relaxed ${dark ? "text-slate-200" : "text-slate-800"}`}
            >
              {comment.commentText}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setReplyOpen((v) => !v)}
              title="Reply"
              className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all active:scale-90
                ${dark ? "text-slate-500 hover:text-pink-400 hover:bg-pink-500/10" : "text-slate-400 hover:text-pink-500 hover:bg-pink-50"}`}
            >
              <CornerDownRight size={13} />
            </button>
            <button
              onClick={() => onDelete(comment.commentId)}
              title="Delete"
              className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all active:scale-90
                ${dark ? "text-slate-600 hover:text-red-400 hover:bg-red-500/10" : "text-slate-300 hover:text-red-500 hover:bg-red-50"}`}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Existing replies */}
        {comment.replies.length > 0 && (
          <div className="ml-11 space-y-2 mb-3">
            {comment.replies.map((reply) => (
              <div
                key={reply.id}
                className={`rounded-xl p-2.5 border
                  ${dark ? "bg-white/[0.03] border-pink-900/20" : "bg-pink-50/40 border-pink-100/60"}`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-[11px] font-black" style={{ color: IG_ACCENT }}>
                    @{reply.username}
                  </p>
                  <p
                    className="text-[9.5px]"
                    style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}
                  >
                    {formatDate(reply.timestamp)}
                  </p>
                </div>
                <p
                  className={`text-[12px] ${dark ? "text-slate-300" : "text-slate-700"}`}
                >
                  {reply.text}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Reply composer */}
        {replyOpen && (
          <div className="ml-11">
            <div
              className={`flex items-center gap-2 rounded-xl border px-3 py-2
                ${dark ? "bg-white/[0.04] border-pink-900/30" : "bg-pink-50/50 border-pink-200/60"}`}
            >
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply…"
                className={`flex-1 bg-transparent outline-none text-[12.5px]
                  ${dark ? "text-white placeholder:text-slate-600" : "text-slate-800 placeholder:text-slate-400"}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && replyText.trim()) {
                    e.preventDefault();
                    replyMut.mutate({
                      commentId: comment.commentId,
                      message: replyText.trim(),
                    });
                  }
                }}
                autoFocus
              />
              <button
                onClick={() => {
                  if (replyText.trim())
                    replyMut.mutate({
                      commentId: comment.commentId,
                      message: replyText.trim(),
                    });
                }}
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

  // UI state
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(""), 3000);
  };

  const load = useCallback(async (cursor: string | null, replace: boolean) => {
    if (replace) setIsLoading(true);
    else setIsLoadingMore(true);
    setFetchError(null);
    try {
      const data = await fetchComments(MEDIA_BATCH, cursor);
      setAllComments((prev) => (replace ? data.data : [...prev, ...data.data]));
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
      setDeleteTarget(null);
      showToast("Comment deleted");
    },
    onError: (e: Error) => {
      showToast(e.message ?? "Delete failed");
      setDeleteTarget(null);
    },
  });

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
                : `${allComments.length} comments${hasMoreMedia ? " · more available" : ""}`}
            </p>
          </div>

          <button
            onClick={refresh}
            disabled={isFetching || isLoading}
            className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all active:scale-90 border shrink-0
              ${dark ? "bg-white/[0.04] border-white/[0.06] text-slate-400" : "bg-white border-pink-100 text-slate-500 shadow-sm"}`}
          >
            <RefreshCw
              size={14}
              className={isFetching || isLoading ? "animate-spin" : ""}
            />
          </button>
        </div>

        {/* ── STATS ── */}
        {!isLoading && !fetchError && allComments.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-5">
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
            ].map((s) => (
              <div
                key={s.label}
                className={`p-3 rounded-2xl border relative overflow-hidden
                  ${dark ? "bg-[#130820] border-pink-900/30" : "bg-white border-pink-100/80 shadow-sm"}`}
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

        {/* ── SEARCH ── */}
        {!isLoading && !fetchError && allComments.length > 0 && (
          <div
            className={`flex items-center gap-2.5 h-[42px] px-3.5 rounded-[13px] border mb-5
              ${dark ? "bg-[#130820] border-pink-900/40" : "bg-white border-pink-100"}`}
          >
            <Search size={13} style={{ color: dark ? "#6b4f7a" : "#94a3b8" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username or comment text…"
              className={`flex-1 bg-transparent outline-none text-[13px]
                ${dark ? "text-white placeholder:text-slate-700" : "text-slate-900 placeholder:text-slate-400"}`}
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
            className={`rounded-2xl border p-6 flex items-start gap-3
              ${dark ? "bg-red-500/[0.07] border-red-500/20" : "bg-red-50 border-red-200/60"}`}
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
            className={`rounded-2xl border p-12 text-center
              ${dark ? "bg-[#130820] border-pink-900/30" : "bg-white border-pink-100/80 shadow-sm"}`}
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
        {!isLoading && !fetchError && allComments.length > 0 && visible.length === 0 && (
          <div
            className={`rounded-2xl border p-8 text-center
              ${dark ? "bg-[#130820] border-pink-900/30" : "bg-white border-pink-100/80"}`}
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
            <div className="space-y-3">
              {visible.map((comment) => (
                <CommentCard
                  key={comment.commentId}
                  comment={comment}
                  dark={dark}
                  onDelete={(id) => setDeleteTarget(id)}
                  onReplySuccess={refresh}
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
          style={{ background: "rgba(13,8,20,0.92)", backdropFilter: "blur(12px)" }}
        >
          <CheckCircle2 size={13} className="text-green-400 shrink-0" />
          {toastMsg}
        </div>
      )}
    </div>
  );
}
