// web_app/app/(main)/facebook/posts/page.tsx
//
// Facebook Posts Page — lists posts from the connected Facebook Page
// Theme: matches FacebookAnalytics page (#050d1a dark / #eef4ff light, #1877F2 blue)
// Data: calls /api/v1/facebook/feed-performance (same controller as analytics)
// Features: post cards, search, type filter, create button, delete, load more

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  RefreshCw,
  Trash2,
  Edit3,
  Clock,
  CheckCircle2,
  WifiOff,
  MoreVertical,
  FileText,
  X,
  Heart,
  MessageCircleMore,
  Share2,
  Eye,
  TrendingUp,
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
  NotebookText,
  Clapperboard,
  ChevronRight,
  AlertTriangle,
  Loader2,
  Unplug,
} from "lucide-react";
import { getToken } from "@/lib/token";

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
type ContentType = "Video" | "Image" | "Link" | "Text";
type FilterType = "ALL" | "Video" | "Image" | "Link" | "Text";

interface PostMetrics {
  likes: string;
  comments: string;
  shares: string;
  reactions: string;
  reach: string;
  impressions: string;
  videoViews: string | null;
  engagementRate: string;
  totalEngagements: string;
}

interface FacebookPost {
  id: string;
  title: string;
  dateString: string;
  contentType: ContentType;
  mediaUrl: string | null;
  targetUrl: string | null;
  metrics: PostMetrics;
}

interface AnalyticsResponse {
  success: boolean;
  posts: FacebookPost[];
  pageOverview: Record<string, string> | null;
  pageProfile: {
    name: string;
    pictureUrl: string | null;
    category: string;
    fans: string;
    followers: string;
  } | null;
  topPost: FacebookPost | null;
}

/* ══════════════════════════════════════════════════════════
   CONTENT TYPE CONFIG
══════════════════════════════════════════════════════════ */
const CONTENT_TYPE_CFG: Record<
  ContentType,
  { icon: React.ReactNode; color: string }
> = {
  Video: { icon: <Clapperboard size={12} />, color: "#EF4444" },
  Image: { icon: <ImageIcon size={12} />, color: "#8B5CF6" },
  Link: { icon: <LinkIcon size={12} />, color: "#F59E0B" },
  Text: { icon: <NotebookText size={12} />, color: "#1877F2" },
};

const FILTERS: { id: FilterType; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "Image", label: "Images" },
  { id: "Video", label: "Videos" },
  { id: "Link", label: "Links" },
  { id: "Text", label: "Text" },
];

/* ══════════════════════════════════════════════════════════
   API
══════════════════════════════════════════════════════════ */
async function fetchPosts(): Promise<AnalyticsResponse> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/facebook/feed-performance`,
    { headers: { Authorization: `Bearer ${getToken()}` } },
  );
  const json = await res.json();
  if (!res.ok || !json.success)
    throw new Error(json.message ?? "Failed to fetch posts");
  return json;
}

async function deletePost(postId: string): Promise<void> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/facebook/posts/${postId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    },
  );
  const json = await res.json();
  if (!res.ok || !json.success)
    throw new Error(json.message ?? "Delete failed");
}

/* ══════════════════════════════════════════════════════════
   SKELETON
══════════════════════════════════════════════════════════ */
function PostCardSkeleton({ dark }: { dark: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${dark ? "bg-[#0a1020] border-blue-900/30" : "bg-white border-blue-100/80"}`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`w-16 h-16 rounded-xl shrink-0 animate-pulse ${dark ? "bg-white/[0.06]" : "bg-blue-100/60"}`}
        />
        <div className="flex-1">
          <div
            className={`h-3 w-20 rounded-lg mb-2 animate-pulse ${dark ? "bg-white/[0.06]" : "bg-blue-100/60"}`}
          />
          <div
            className={`h-2.5 w-full rounded-lg mb-1.5 animate-pulse ${dark ? "bg-white/[0.06]" : "bg-blue-100/60"}`}
          />
          <div
            className={`h-2.5 w-3/4 rounded-lg animate-pulse ${dark ? "bg-white/[0.06]" : "bg-blue-100/60"}`}
          />
        </div>
      </div>
      <div
        className="grid grid-cols-3 gap-3 pt-3 border-t"
        style={{
          borderColor: dark ? "rgba(30,58,138,0.2)" : "rgba(219,234,254,0.8)",
        }}
      >
        {[...Array(3)].map((_, i) => (
          <div key={i}>
            <div
              className={`h-2 w-12 rounded mb-1.5 animate-pulse ${dark ? "bg-white/[0.06]" : "bg-blue-100/60"}`}
            />
            <div
              className={`h-3.5 w-16 rounded animate-pulse ${dark ? "bg-white/[0.06]" : "bg-blue-100/60"}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   STAT CARD (mini — 4 across header)
══════════════════════════════════════════════════════════ */
function MiniStatCard({
  label,
  value,
  icon,
  color,
  dark,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  dark: boolean;
}) {
  return (
    <div
      className={`p-3 rounded-2xl border relative overflow-hidden
        ${dark ? "bg-[#0a1020] border-blue-900/30" : "bg-white border-blue-100/80 shadow-sm"}`}
    >
      <div
        className="absolute top-2.5 right-2.5 w-7 h-7 rounded-xl flex items-center justify-center border"
        style={{
          backgroundColor: color + "20",
          borderColor: color + "50",
          color,
        }}
      >
        {icon}
      </div>
      <p
        className="text-[20px] font-black leading-none mt-1 mb-5"
        style={{ color, letterSpacing: "-0.03em" }}
      >
        {value}
      </p>
      <p
        className="text-[9px] font-black uppercase tracking-widest"
        style={{ color: dark ? "#475569" : "#94a3b8" }}
      >
        {label}
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   DELETE MODAL
══════════════════════════════════════════════════════════ */
function DeleteModal({
  post,
  dark,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  post: FacebookPost;
  dark: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onCancel();
      }}
    >
      <div
        className={`w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border
          ${dark ? "bg-[#0a1020] border-blue-900/50" : "bg-white border-blue-100"}`}
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
            className={`text-[17px] font-black mb-1.5 ${dark ? "text-white" : "text-slate-900"}`}
            style={{ letterSpacing: "-0.03em" }}
          >
            Delete Post?
          </h3>
          <p
            className={`text-[12px] leading-relaxed mb-2 ${dark ? "text-slate-400" : "text-slate-500"}`}
          >
            This will permanently remove the post from your Facebook Page.
          </p>
          <p
            className={`text-[11px] font-medium line-clamp-1 ${dark ? "text-slate-600" : "text-slate-400"}`}
          >
            "{post.title.slice(0, 60)}
            {post.title.length > 60 ? "…" : ""}"
          </p>
        </div>
        <div
          className={`px-4 pb-5 flex gap-2.5 border-t pt-4 ${dark ? "border-white/[0.06]" : "border-slate-100"}`}
        >
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className={`flex-1 h-11 rounded-2xl text-[13px] font-semibold transition-all active:scale-95 disabled:opacity-50
              ${dark ? "bg-white/[0.07] text-slate-300" : "bg-slate-100 text-slate-600"}`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 h-11 rounded-2xl text-[13px] font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg,#dc2626,#ef4444)",
              boxShadow: "0 4px 14px rgba(220,38,38,0.38)",
            }}
          >
            {isDeleting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Deleting…
              </>
            ) : (
              <>
                <Trash2 size={14} /> Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   POST CARD
══════════════════════════════════════════════════════════ */
function PostCard({
  post,
  dark,
  onDelete,
  isDeleting,
  priority,
}: {
  post: FacebookPost;
  dark: boolean;
  onDelete: (p: FacebookPost) => void;
  isDeleting: boolean;
  priority?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const typeConfig =
    CONTENT_TYPE_CFG[post.contentType] ?? CONTENT_TYPE_CFG.Text;
  const green = "#10B981";
  const cardText = dark ? "#93C5FD" : "#2563EB";

  const erValue = parseFloat(post.metrics.engagementRate) || 0;
  const erBarPct = Math.min(erValue * 8, 100);
  const needsTrunc = post.title.length > 120;

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-all duration-200
        ${dark ? "bg-[#0a1020] border-blue-900/30" : "bg-white border-blue-100/80 shadow-sm"}
        ${isDeleting ? "opacity-40 pointer-events-none" : ""}`}
    >
      {/* Thumbnail strip */}
      {post.mediaUrl && (
        <div className="relative h-44 overflow-hidden">
          <img
            src={post.mediaUrl}
            alt=""
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute top-2.5 right-2.5">
            <div
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9.5px] font-black uppercase tracking-wide"
              style={{
                backgroundColor: typeConfig.color + "20",
                borderColor: typeConfig.color + "50",
                color: typeConfig.color,
                backdropFilter: "blur(6px)",
                background: typeConfig.color + "25",
              }}
            >
              {typeConfig.icon} {post.contentType}
            </div>
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          {/* Icon / thumb placeholder */}
          {/* {!post.mediaUrl && (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: typeConfig.color + "15",
                borderColor: typeConfig.color + "30",
                color: typeConfig.color,
              }}
            >
              {typeConfig.icon}
            </div>
          )} */}

          <div className="flex-1 min-w-0">
            {/* Badge row */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {!post.mediaUrl && (
                <div
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9.5px] font-black uppercase tracking-wide"
                  style={{
                    backgroundColor: typeConfig.color + "18",
                    borderColor: typeConfig.color + "50",
                    color: typeConfig.color,
                  }}
                >
                  {typeConfig.icon} {post.contentType}
                </div>
              )}
            </div>
            <span
              className="text-[10px] ml-auto shrink-0"
              style={{ color: dark ? "#475569" : "#94a3b8" }}
            >
              {post.dateString}
            </span>

            <p
              className={`text-[13px] leading-5 ${dark ? "text-white" : "text-slate-900"}`}
            >
              {needsTrunc && !expanded
                ? post.title.slice(0, 120) + "…"
                : post.title}
              {needsTrunc && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="ml-1 text-purple-500 text-[11px] font-medium hover:text-blue-400 transition-colors"
                >
                  {expanded ? "Less" : "More"}
                </button>
              )}
            </p>
          </div>

          {/* 3-dot menu */}
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className={`w-7 h-7 flex items-center justify-center rounded-xl transition-all active:scale-90
                ${dark ? "text-slate-500 hover:bg-white/[0.06] hover:text-slate-300" : "text-slate-400 hover:bg-blue-50"}`}
            >
              <MoreVertical size={15} />
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  className={`absolute right-0 top-8 z-20 rounded-2xl border overflow-hidden shadow-xl min-w-[140px]
                    ${dark ? "bg-[#0d1728] border-blue-900/50" : "bg-white border-blue-100"}`}
                >
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(post);
                    }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[12.5px] transition-colors
                      ${dark ? "text-red-400 hover:bg-red-500/[0.08]" : "text-red-500 hover:bg-red-50"}`}
                  >
                    <Trash2 size={12} /> Delete Post
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ER bar */}
        {erValue > 0 && (
          <div
            className="h-1 rounded-full mb-3 overflow-hidden"
            style={{
              backgroundColor: dark ? "rgba(30,58,138,0.25)" : "#f1f5f9",
            }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${erBarPct}%`, backgroundColor: green }}
            />
          </div>
        )}

        {/* 6-metric grid */}
        <div
          className="grid grid-cols-3 gap-y-3 pt-3 border-t justify-items-center"
          style={{
            borderColor: dark ? "rgba(30,58,138,0.3)" : "rgba(219,234,254,0.8)",
          }}
        >
          {/* Reach */}
          <div>
            <p
              className="text-[9px] font-black uppercase tracking-wider"
              style={{ color: dark ? "#475569" : "#94a3b8" }}
            >
              Reach
            </p>
            <p
              className="font-semibold text-[13px] mt-0.5 text-center"
              style={{ color: cardText }}
            >
              {post.metrics.reach}
            </p>
          </div>
          {/* Impressions */}
          <div>
            <p
              className="text-[9px] font-black uppercase tracking-wider"
              style={{ color: dark ? "#475569" : "#94a3b8" }}
            >
              Impressions
            </p>
            <p
              className="font-semibold text-[13px] mt-0.5 text-center"
              style={{ color: cardText }}
            >
              {post.metrics.impressions}
            </p>
          </div>
          {/* ER */}
          <div>
            <p
              className="text-[9px] font-black uppercase tracking-wider"
              style={{ color: dark ? "#475569" : "#94a3b8" }}
            >
              ER %
            </p>
            <p
              className="font-semibold text-[13px] mt-0.5 text-center"
              style={{ color: green }}
            >
              {post.metrics.engagementRate}
            </p>
          </div>
          {/* Reactions */}
          <div>
            <div className="flex items-center gap-1">
              <Heart size={20} style={{ color: "#EF4444" }} />
              {/* <p
                className="text-[9px] font-medium"
                style={{ color: dark ? "#475569" : "#94a3b8" }}
              >
                Reactions
              </p> */}
              <p
                className="font-bold text-[12px] mt-0.5"
                style={{ color: dark ? "#cbd5e1" : "#475569" }}
              >
                {post.metrics.reactions}
              </p>
            </div>
          </div>
          {/* Comments */}
          <div>
            <div className="flex items-center gap-1">
              <MessageCircleMore
                size={20}
                style={{ color: dark ? "#cbd5e1" : "#64748b" }}
              />
              {/* <p
                className="text-[9px] font-medium"
                style={{ color: dark ? "#475569" : "#94a3b8" }}
              >
                Comments
              </p> */}
              <p
                className="font-bold text-[12px] mt-0.5"
                style={{ color: dark ? "#cbd5e1" : "#475569" }}
              >
                {post.metrics.comments}
              </p>
            </div>
          </div>
          {/* Video views or shares */}
          <div>
            {post.metrics.videoViews ? (
              <>
                <div className="flex items-center gap-1">
                  <Video size={20} style={{ color: "#1877F2" }} />
                  {/* <p
                    className="text-[9px] font-medium"
                    style={{ color: dark ? "#475569" : "#94a3b8" }}
                  >
                    Views
                  </p> */}
                  <p
                    className="font-bold text-[12px] mt-0.5"
                    style={{ color: dark ? "#cbd5e1" : "#475569" }}
                  >
                    {post.metrics.videoViews}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1">
                  <Share2 size={20} style={{ color: cardText }} />
                  {/* <p
                    className="text-[9px] font-medium"
                    style={{ color: dark ? "#475569" : "#94a3b8" }}
                  >
                    Shares
                  </p> */}
                  <p
                    className="font-bold text-[12px] mt-0.5"
                    style={{ color: dark ? "#cbd5e1" : "#475569" }}
                  >
                    {post.metrics.shares}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer action row */}
        {/* <div
          className="flex items-center gap-2 mt-3 pt-3 border-t"
          style={{
            borderColor: dark ? "rgba(30,58,138,0.2)" : "rgba(219,234,254,0.6)",
          }}
        >
          <button
            onClick={() => onDelete(post)}
            className={`flex items-center gap-1.5 h-7 px-3 rounded-xl text-[11.5px] font-semibold transition-all active:scale-95
              ${dark ? "text-slate-500 hover:text-red-400 hover:bg-red-500/10" : "text-slate-400 hover:text-red-500 hover:bg-red-50"}`}
          >
            <Trash2 size={11} /> Delete
          </button>
          <span
            className="ml-auto text-[10px] flex items-center gap-1"
            style={{ color: dark ? "#334155" : "#cbd5e1" }}
          >
            <Clock size={9} /> {post.dateString}
          </span>
        </div> */}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════ */
export default function FacebookPostsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";

  const router = useRouter();
  const qc = useQueryClient();

  // Local post list so we can optimistically remove deleted posts
  const [posts, setPosts] = useState<FacebookPost[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [deleteTarget, setDeleteTarget] = useState<FacebookPost | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const showToast = (msg: string) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(""), 3000);
  };

  // ── Data fetch ──
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["facebook-posts"],
    queryFn: fetchPosts,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (data?.posts) setPosts(data.posts);
  }, [data]);

  // ── Delete mutation ──
  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: (_, postId) => {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setDeleteTarget(null);
      showToast("Post deleted successfully");
      qc.invalidateQueries({ queryKey: ["facebook-posts"] });
    },
    onError: (e: any) => {
      showToast(e.message ?? "Delete failed");
      setDeleteTarget(null);
    },
  });

  // ── Derived stats ──
  const totalEngagements = posts.reduce(
    (sum, p) =>
      sum + (parseInt(p.metrics.totalEngagements.replace(/,/g, "")) || 0),
    0,
  );
  const totalReach = posts.reduce(
    (sum, p) =>
      sum +
      (p.metrics.reach !== "N/A"
        ? parseInt(p.metrics.reach.replace(/,/g, "")) || 0
        : 0),
    0,
  );
  const avgER =
    posts.length > 0
      ? (
          posts.reduce(
            (sum, p) => sum + (parseFloat(p.metrics.engagementRate) || 0),
            0,
          ) / posts.length
        ).toFixed(2)
      : "0.00";

  // ── Filtered view ──
  const visible = posts.filter((p) => {
    const matchFilter = filter === "ALL" ? true : p.contentType === filter;
    const matchSearch =
      !search || p.title.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const facebookBlue = "#1877F2";

  return (
    <div
      className={`min-h-screen transition-colors ${dark ? "bg-[#050d1a]" : "bg-[#eef4ff]"}`}
      style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}
    >
      {/* Dot grid background — same as analytics page */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.018] z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-3 pb-28 pt-6">
        {/* ── HEADER ── */}
        <div className="flex items-start justify-between mb-6 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {/* Facebook "f" icon pill */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9.5px] font-black uppercase tracking-widest
                  ${dark ? "bg-blue-500/10 border-blue-700/60 text-blue-400" : "bg-blue-50 border-blue-300 text-blue-600"}`}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: facebookBlue,
                    animation: "pulse 2s infinite",
                  }}
                />
                Facebook
              </div>
            </div>
            <h1
              className={`text-[26px] font-black leading-tight ${dark ? "text-white" : "text-slate-900"}`}
              style={{ letterSpacing: "-0.04em" }}
            >
              Posts
            </h1>
            <p
              className="text-[12px] mt-0.5"
              style={{ color: dark ? "#475569" : "rgba(59,130,246,0.8)" }}
            >
              {isLoading ? "Loading…" : `${posts.length} posts on your page`}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className={`w-9 h-9 flex items-center justify-center rounded-2xl transition-all active:scale-90 border disabled:opacity-50
                ${dark ? "bg-white/[0.04] border-white/[0.06] text-slate-400" : "bg-white border-blue-100 text-slate-500 shadow-sm"}`}
            >
              <RefreshCw
                size={14}
                className={isFetching ? "animate-spin" : ""}
              />
            </button>
            <button
              onClick={() => router.push("/facebook/posts/create")}
              className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-[13px] font-bold text-white transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg,#1d4ed8,#1877F2)",
                boxShadow: "0 3px 12px rgba(24,119,242,0.4)",
              }}
            >
              <Plus size={15} /> New Post
            </button>
          </div>
        </div>

        {/* ── SKELETON ── */}
        {isLoading && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`h-20 rounded-2xl animate-pulse border
                    ${dark ? "bg-[#0a1020] border-blue-900/30" : "bg-white border-blue-100"}`}
                />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <PostCardSkeleton key={i} dark={dark} />
              ))}
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {isError && (
          <div
            className={`rounded-2xl border p-6 flex items-start gap-3 mb-5
              ${dark ? "bg-red-500/[0.07] border-red-500/20" : "bg-red-50 border-red-200/60"}`}
          >
            <WifiOff size={16} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-red-400 mb-0.5">
                Failed to load posts
              </p>
              <p
                className={`text-[11.5px] mb-2 ${dark ? "text-red-500/70" : "text-red-400"}`}
              >
                {(error as any)?.message}
              </p>
              <button
                onClick={() => refetch()}
                className="text-[12px] font-semibold text-blue-400"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* ── MAIN CONTENT ── */}
        {!isLoading && !isError && (
          <>
            {/* ── Mini stats row ── */}
            {posts.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <MiniStatCard
                  label="Total Posts"
                  value={String(posts.length)}
                  icon={<FileText size={13} />}
                  color={facebookBlue}
                  dark={dark}
                />
                <MiniStatCard
                  label="Total Reach"
                  value={totalReach > 0 ? totalReach.toLocaleString() : "N/A"}
                  icon={<Eye size={13} />}
                  color="#10B981"
                  dark={dark}
                />
                <MiniStatCard
                  label="Total Engagements"
                  value={totalEngagements.toLocaleString()}
                  icon={<TrendingUp size={13} />}
                  color="#8B5CF6"
                  dark={dark}
                />
                <MiniStatCard
                  label="Avg. Eng. Rate"
                  value={`${avgER}%`}
                  icon={<Heart size={13} />}
                  color="#EF4444"
                  dark={dark}
                />
              </div>
            )}

            {/* ── Search + filter row ── */}
            {posts.length > 0 && (
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-5">
                {/* Search */}
                <div
                  className={`flex items-center gap-2.5 h-[42px] px-3.5 rounded-[13px] border flex-1
                    ${dark ? "bg-[#0a1020] border-blue-900/40" : "bg-white border-blue-100"}`}
                >
                  <Search
                    size={13}
                    style={{ color: dark ? "#334155" : "#94a3b8" }}
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search posts…"
                    className={`flex-1 bg-transparent outline-none py-4 text-[13px]
                      ${dark ? "text-white placeholder:text-slate-700" : "text-slate-900 placeholder:text-slate-400"}`}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className={`text-[11px] font-medium flex items-center gap-0.5 ${dark ? "text-slate-600" : "text-slate-400"}`}
                    >
                      <X size={11} /> Clear
                    </button>
                  )}
                </div>

                {/* Filter tabs */}
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5 md:pb-0 shrink-0">
                  {FILTERS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFilter(f.id)}
                      className={`h-8 px-3 rounded-xl text-[11.5px] font-semibold whitespace-nowrap shrink-0 transition-all active:scale-95 border
                        ${
                          filter === f.id
                            ? "text-white border-transparent"
                            : dark
                              ? "bg-white/[0.04] border-blue-900/40 text-slate-400 hover:bg-white/[0.07]"
                              : "bg-white border-blue-100 text-slate-500 hover:bg-blue-50"
                        }`}
                      style={
                        filter === f.id
                          ? {
                              background:
                                "linear-gradient(135deg,#1d4ed8,#1877F2)",
                            }
                          : {}
                      }
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Empty — no posts ── */}
            {posts.length === 0 && (
              <div
                className={`rounded-2xl border p-12 text-center
                  ${dark ? "bg-[#0a1020] border-blue-900/30" : "bg-white border-blue-100/80 shadow-sm"}`}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{
                    background: "rgba(24,119,242,0.1)",
                    border: "1px solid rgba(24,119,242,0.2)",
                  }}
                >
                  <FileText size={26} style={{ color: facebookBlue }} />
                </div>
                <p
                  className={`text-[15px] font-bold mb-1.5 ${dark ? "text-white" : "text-slate-900"}`}
                >
                  No Posts Yet
                </p>
                <p
                  className="text-[12.5px] mb-5"
                  style={{ color: dark ? "#475569" : "#94a3b8" }}
                >
                  Create your first Facebook post to start engaging your
                  audience.
                </p>
                <button
                  onClick={() => router.push("/facebook/posts/create")}
                  className="h-10 px-6 rounded-xl text-[13px] font-bold text-white transition-all active:scale-95"
                  style={{
                    background: "linear-gradient(135deg,#1d4ed8,#1877F2)",
                    boxShadow: "0 3px 14px rgba(24,119,242,0.4)",
                  }}
                >
                  <span className="flex items-center gap-1.5">
                    <Plus size={14} /> Create First Post
                  </span>
                </button>
              </div>
            )}

            {/* ── No search results ── */}
            {posts.length > 0 && visible.length === 0 && (
              <div
                className={`rounded-2xl border p-8 text-center
                  ${dark ? "bg-[#0a1020] border-blue-900/30" : "bg-white border-blue-100/80"}`}
              >
                <Search
                  size={22}
                  className="mx-auto mb-2"
                  style={{ color: dark ? "#334155" : "#cbd5e1" }}
                />
                <p
                  className="text-[13px]"
                  style={{ color: dark ? "#475569" : "#94a3b8" }}
                >
                  No posts match your filter
                </p>
              </div>
            )}

            {/* ── Post grid ── */}
            {visible.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {visible.map((p, i) => (
                  <PostCard
                    key={p.id}
                    post={p}
                    dark={dark}
                    onDelete={setDeleteTarget}
                    priority={i < 3}
                    isDeleting={
                      deleteMutation.isPending &&
                      deleteMutation.variables === p.id
                    }
                  />
                ))}
              </div>
            )}

            {/* ── End marker ── */}
            {visible.length > 0 && (
              <div className="flex items-center gap-3 py-4 mt-2">
                <div
                  className="flex-1 h-px"
                  style={{
                    backgroundColor: dark
                      ? "rgba(30,58,138,0.25)"
                      : "rgba(219,234,254,0.8)",
                  }}
                />
                <p
                  className="text-[11.5px] font-medium"
                  style={{ color: dark ? "#334155" : "#cbd5e1" }}
                >
                  {visible.length} of {posts.length} posts shown
                </p>
                <div
                  className="flex-1 h-px"
                  style={{
                    backgroundColor: dark
                      ? "rgba(30,58,138,0.25)"
                      : "rgba(219,234,254,0.8)",
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
          post={deleteTarget}
          dark={dark}
          isDeleting={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ── TOAST ── */}
      {toastMsg && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-semibold text-white shadow-2xl"
          style={{
            background: "rgba(10,16,32,0.92)",
            backdropFilter: "blur(12px)",
          }}
        >
          <CheckCircle2 size={13} className="text-green-400 shrink-0" />
          {toastMsg}
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .no-scrollbar::-webkit-scrollbar { display:none }
        .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none }
      `}</style>
    </div>
  );
}
