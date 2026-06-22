"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  Heart,
  MessageCircle,
  Image as ImageIcon,
  Video,
  LayoutGrid,
  ArrowLeft,
  ExternalLink,
  WifiOff,
  Play,
  Copy,
  CheckCircle2,
  Search,
  X,
  Loader2,
  Plus,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { API } from "@/lib/axiosClient";

/* ═══════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════ */
type MediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
type FilterType = "ALL" | "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";

interface IgChild {
  mediaUrl: string | null;
  mediaType: string;
  thumbnailUrl: string | null;
}

interface IgPost {
  id: string;
  caption: string;
  mediaType: MediaType;
  mediaProductType: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  permalink: string;
  timestamp: string;
  likeCount: number;
  commentsCount: number;
  children: IgChild[];
}

interface FeedResponse {
  success: boolean;
  igUserId: string;
  count: number;
  nextCursor: string | null;
  hasMore: boolean;
  data: IgPost[];
}

/* ═══════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════ */
const IG_GRADIENT =
  "linear-gradient(135deg, #833ab4 0%, #C13584 45%, #fd1d1d 80%, #fcb045 100%)";
const IG_ACCENT = "#C13584";
const PAGE_SIZE = 12;

const FILTERS: { id: FilterType; label: string; icon: React.ReactNode }[] = [
  { id: "ALL", label: "All", icon: <LayoutGrid size={11} /> },
  { id: "IMAGE", label: "Photos", icon: <ImageIcon size={11} /> },
  { id: "VIDEO", label: "Videos", icon: <Video size={11} /> },
  { id: "CAROUSEL_ALBUM", label: "Carousels", icon: <Copy size={11} /> },
];

/* ═══════════════════════════════════════════════════════
   API
═══════════════════════════════════════════════════════ */
async function fetchIgFeed(
  limit: number,
  after?: string | null,
): Promise<FeedResponse> {
  const res = await API.get("/instagram/feed", {
    params: { limit, ...(after ? { after } : {}) },
  });
  if (!res.data.success)
    throw new Error(res.data.message ?? "Failed to fetch feed");
  return res.data;
}

/* ═══════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════ */
function formatCount(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
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
function GridSkeleton({ dark }: { dark: boolean }) {
  const shimmer = dark ? "bg-white/[0.05]" : "bg-pink-100/50";
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className={`aspect-square rounded-2xl animate-pulse ${shimmer}`}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DELETE CONFIRM MODAL
═══════════════════════════════════════════════════════ */
function DeleteModal({
  dark,
  isDeleting,
  onConfirm,
  onCancel,
}: {
  dark: boolean;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(16px)" }}
      onClick={(e) => { if (e.target === e.currentTarget && !isDeleting) onCancel(); }}
    >
      <div
        className={`w-full max-w-sm rounded-3xl overflow-hidden border shadow-2xl ${dark ? "bg-[#130820] border-red-900/40" : "bg-white border-red-100"}`}
      >
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#ef4444,#dc2626)" }} />
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <AlertTriangle size={24} className="text-red-400" />
          </div>
          <p className={`text-[17px] font-black mb-1 ${dark ? "text-white" : "text-slate-900"}`}>
            Delete Post?
          </p>
          <p className="text-[12.5px] leading-relaxed" style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}>
            This will permanently remove the post from your Instagram profile. This action cannot be undone.
          </p>
          <div className="flex gap-3 mt-5">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className={`flex-1 h-11 rounded-2xl text-[13px] font-semibold border transition-all active:scale-95 disabled:opacity-50 ${dark ? "bg-white/[0.04] border-white/[0.08] text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 h-11 rounded-2xl text-[13px] font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", boxShadow: "0 4px 16px rgba(239,68,68,0.35)" }}
            >
              {isDeleting ? (
                <><Loader2 size={14} className="animate-spin" /> Deleting…</>
              ) : (
                <><Trash2 size={14} /> Delete Post</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   POST MODAL
═══════════════════════════════════════════════════════ */
function PostModal({
  post,
  dark,
  onClose,
  onDeleteRequest,
}: {
  post: IgPost;
  dark: boolean;
  onClose: () => void;
  onDeleteRequest: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const isVideo = post.mediaType === "VIDEO";
  const isCarousel = post.mediaType === "CAROUSEL_ALBUM";
  const displayUrl = isCarousel
    ? post.children[carouselIdx]?.mediaUrl || post.mediaUrl
    : post.mediaUrl || post.thumbnailUrl;

  const handleCopy = () => {
    navigator.clipboard.writeText(post.caption).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(14px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full max-w-lg rounded-3xl overflow-hidden border shadow-2xl
          ${dark ? "bg-[#130820] border-pink-900/40" : "bg-white border-pink-100"}`}
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        <div className="h-1 w-full" style={{ background: IG_GRADIENT }} />

        {displayUrl && (
          <div className="relative w-full aspect-square bg-black">
            {isVideo ? (
              <video
                src={post.mediaUrl ?? undefined}
                poster={post.thumbnailUrl ?? undefined}
                controls
                playsInline
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src={displayUrl ?? undefined}
                alt="Post Image"
                className="w-full h-full object-cover"
              />
            )}

            {isCarousel && post.children.length > 1 && (
              <>
                {/* Prev / Next arrows */}
                {carouselIdx > 0 && (
                  <button
                    onClick={() => setCarouselIdx((i) => i - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ background: "rgba(0,0,0,0.5)" }}
                  >
                    ‹
                  </button>
                )}
                {carouselIdx < post.children.length - 1 && (
                  <button
                    onClick={() => setCarouselIdx((i) => i + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ background: "rgba(0,0,0,0.5)" }}
                  >
                    ›
                  </button>
                )}
                {/* Dots */}
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                  {post.children.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCarouselIdx(i)}
                      className="w-1.5 h-1.5 rounded-full transition-all"
                      style={{
                        background:
                          i === carouselIdx ? "white" : "rgba(255,255,255,0.4)",
                      }}
                    />
                  ))}
                </div>
                {/* Counter */}
                <div
                  className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-white text-[10px] font-bold"
                  style={{ background: "rgba(0,0,0,0.5)" }}
                >
                  {carouselIdx + 1} / {post.children.length}
                </div>
              </>
            )}

            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white text-lg font-bold"
              style={{ background: "rgba(0,0,0,0.5)" }}
            >
              ×
            </button>
          </div>
        )}

        <div className="p-4">
          <div className="flex items-center gap-5 mb-3">
            <div
              className="flex items-center gap-1.5"
              style={{ color: "#e84393" }}
            >
              <Heart size={18} />
              <span className="text-[14px] font-black">
                {formatCount(post.likeCount)}
              </span>
            </div>
            <div
              className="flex items-center gap-1.5"
              style={{ color: dark ? "#c084fc" : "#7c3aed" }}
            >
              <MessageCircle size={18} />
              <span className="text-[14px] font-black">
                {formatCount(post.commentsCount)}
              </span>
            </div>
            <span
              className="ml-auto text-[10px] uppercase tracking-widest font-black"
              style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}
            >
              {post.mediaType === "CAROUSEL_ALBUM"
                ? "Carousel"
                : post.mediaType === "VIDEO"
                  ? "Video"
                  : "Photo"}
            </span>
          </div>

          {post.caption && (
            <div
              className={`rounded-xl p-3 mb-3 relative ${dark ? "bg-white/[0.04]" : "bg-pink-50/60"}`}
            >
              <p
                className={`text-[12px] leading-relaxed pr-6 ${dark ? "text-slate-300" : "text-slate-700"}`}
              >
                {post.caption}
              </p>
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center"
                style={{
                  color: copied ? "#10B981" : dark ? "#6b4f7a" : "#94a3b8",
                }}
              >
                {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
              </button>
            </div>
          )}

          <p
            className="text-[11px] mb-3"
            style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}
          >
            {formatDate(post.timestamp)}
          </p>

          <div className="flex gap-2">
            <a
              href={post.permalink}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold text-white transition-all active:scale-95"
              style={{
                background: IG_GRADIENT,
                boxShadow: "0 4px 16px rgba(193,53,132,0.35)",
              }}
            >
              View on Instagram <ExternalLink size={13} />
            </a>
            <button
              onClick={onDeleteRequest}
              className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[12px] font-bold border transition-all active:scale-95
                ${dark ? "bg-red-500/[0.08] border-red-500/25 text-red-400" : "bg-red-50 border-red-200 text-red-500"}`}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   GRID TILE
═══════════════════════════════════════════════════════ */
function GridTile({
  post,
  dark,
  onClick,
}: {
  post: IgPost;
  dark: boolean;
  onClick: () => void;
}) {
  const isVideo = post.mediaType === "VIDEO";
  const coverUrl = isVideo
    ? (post.thumbnailUrl || post.mediaUrl)
    : (post.mediaUrl || post.thumbnailUrl);
  const isCarousel = post.mediaType === "CAROUSEL_ALBUM";

  return (
    <button
      onClick={onClick}
      className="relative aspect-square rounded-2xl overflow-hidden group transition-all active:scale-[0.97] border"
      style={{
        borderColor: dark ? "rgba(193,53,132,0.15)" : "rgba(193,53,132,0.1)",
      }}
    >
      {coverUrl ? (
        <img
          src={coverUrl}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ background: IG_GRADIENT }}
        >
          <ImageIcon size={28} className="text-white opacity-60" />
        </div>
      )}

      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4"
        style={{ background: "rgba(0,0,0,0.5)" }}
      >
        <div className="flex items-center gap-1 text-white">
          <Heart size={15} />
          <span className="text-[11px] font-black">
            {formatCount(post.likeCount)}
          </span>
        </div>
        <div className="flex items-center gap-1 text-white">
          <MessageCircle size={15} />
          <span className="text-[11px] font-black">
            {formatCount(post.commentsCount)}
          </span>
        </div>
      </div>

      <div className="absolute top-1.5 right-1.5">
        {isVideo && (
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.6)" }}
          >
            <Play size={11} className="text-white ml-0.5" />
          </div>
        )}
        {isCarousel && (
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.6)" }}
          >
            <Copy size={10} className="text-white" />
          </div>
        )}
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════ */
export default function InstagramPostsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";

  const router = useRouter();

  // Accumulated posts across pages
  const [allPosts, setAllPosts] = useState<IgPost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [filter, setFilter] = useState<FilterType>("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<IgPost | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<IgPost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const deletePost = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      await API.delete(`/instagram/posts/${deleteTarget.id}`);
      setAllPosts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
      setSelected(null);
      showToast("Post deleted successfully.", true);
    } catch (e: any) {
      const data = e.response?.data;
      const msg = data?.permissionRequired
        ? "Permission missing. Reconnect your Facebook account to enable deletion."
        : (data?.message ?? e.message ?? "Failed to delete post.");
      showToast(msg, false);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const load = useCallback(async (cursor: string | null, replace: boolean) => {
    if (replace) setIsLoading(true);
    else setIsLoadingMore(true);
    setFetchError(null);

    try {
      const data = await fetchIgFeed(PAGE_SIZE, cursor);
      setAllPosts((prev) => (replace ? data.data : [...prev, ...data.data]));
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (e: any) {
      setFetchError(e.message ?? "Failed to load posts");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsFetching(true);
    setFetchError(null);
    try {
      const data = await fetchIgFeed(PAGE_SIZE, null);
      setAllPosts(data.data);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (e: any) {
      setFetchError(e.message ?? "Failed to refresh");
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    load(null, true);
  }, [load]);

  // Client-side filter + search
  const visible = allPosts.filter((p) => {
    const matchFilter = filter === "ALL" || p.mediaType === filter;
    const q = search.trim().toLowerCase();
    const matchSearch = !q || p.caption.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const totalLikes = allPosts.reduce((s, p) => s + p.likeCount, 0);
  const totalComments = allPosts.reduce((s, p) => s + p.commentsCount, 0);

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

      <div className="relative z-10 max-w-6xl mx-auto px-3 pb-28 pt-6">
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
              Posts
            </h1>
            <p
              className="text-[12px] mt-0.5"
              style={{ color: dark ? "#6b4f7a" : "rgba(193,53,132,0.7)" }}
            >
              {isLoading
                ? "Loading…"
                : `${allPosts.length} posts loaded${hasMore ? " · more available" : ""}`}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={refresh}
              disabled={isFetching || isLoading}
              className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all active:scale-90 border
                ${dark ? "bg-white/[0.04] border-white/[0.06] text-slate-400" : "bg-white border-pink-100 text-slate-500 shadow-sm"}`}
            >
              <RefreshCw
                size={14}
                className={isFetching || isLoading ? "animate-spin" : ""}
              />
            </button>
            <button
              onClick={() => router.push("/instagram/posts/create")}
              className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-[13px] font-bold text-white transition-all active:scale-95"
              style={{
                background: IG_GRADIENT,
                boxShadow: "0 3px 12px rgba(193,53,132,0.4)",
              }}
            >
              <Plus size={15} /> New Post
            </button>
          </div>
        </div>

        {/* ── STATS ── */}
        {!isLoading && !fetchError && allPosts.length > 0 && (
          <div className="grid grid-cols-3 gap-1 sm:gap-3 mb-5">
            {[
              {
                label: "Loaded Posts",
                value: String(allPosts.length),
                color: "#C13584",
                icon: <ImageIcon size={13} />,
              },
              {
                label: "Total Likes",
                value: formatCount(totalLikes),
                color: "#fd1d1d",
                icon: <Heart size={13} />,
              },
              {
                label: "Total Comments",
                value: formatCount(totalComments),
                color: "#833ab4",
                icon: <MessageCircle size={13} />,
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
                  className="text-[17px] sm:text-[20px] font-black leading-none mt-1 mb-4"
                  style={{ color: s.color, letterSpacing: "-0.03em" }}
                >
                  {s.value}
                </p>
                <p
                  className="text-[8px] leading-tight sm:text-[9px] font-black uppercase tracking-widest"
                  style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}
                >
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── SEARCH + FILTER ── */}
        {!isLoading && !fetchError && allPosts.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            {/* Search */}
            <div
              className={`flex items-center gap-2.5 h-[42px] px-3.5 py-2 rounded-[13px] border flex-1
                ${dark ? "bg-[#130820] border-pink-900/40" : "bg-white border-pink-100"}`}
            >
              <Search
                size={13}
                style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search captions…"
                className={`flex-1 bg-transparent outline-none text-[13px]
                  ${dark ? "text-white placeholder:text-slate-700" : "text-slate-900 placeholder:text-slate-400"}`}
              />
              {search && (
                <button onClick={() => setSearch("")}>
                  <X
                    size={13}
                    style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}
                  />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className="flex items-center gap-1.5 sm:py-2.3 py-1.5 px-3 rounded-[13px] text-[11.5px] font-semibold whitespace-nowrap shrink-0 transition-all active:scale-95 border"
                  style={
                    filter === f.id
                      ? {
                          background: IG_GRADIENT,
                          borderColor: "transparent",
                          color: "white",
                        }
                      : {
                          background: dark ? "rgba(255,255,255,0.04)" : "white",
                          borderColor: dark
                            ? "rgba(193,53,132,0.2)"
                            : "rgba(193,53,132,0.15)",
                          color: dark ? "#94a3b8" : "#64748b",
                        }
                  }
                >
                  {f.icon} {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── LOADING ── */}
        {isLoading && <GridSkeleton dark={dark} />}

        {/* ── ERROR ── */}
        {fetchError && (
          <div
            className={`rounded-2xl border p-6 flex items-start gap-3
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
        {!isLoading && !fetchError && allPosts.length === 0 && (
          <div
            className={`rounded-2xl border p-12 text-center
              ${dark ? "bg-[#130820] border-pink-900/30" : "bg-white border-pink-100/80 shadow-sm"}`}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: IG_GRADIENT }}
            >
              <ImageIcon size={26} className="text-white" />
            </div>
            <p
              className={`text-[15px] font-bold mb-1.5 ${dark ? "text-white" : "text-slate-900"}`}
            >
              No Posts Found
            </p>
            <p
              className="text-[12.5px]"
              style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}
            >
              Your Instagram posts will appear here once published.
            </p>
          </div>
        )}

        {/* ── NO SEARCH RESULTS ── */}
        {!isLoading &&
          !fetchError &&
          allPosts.length > 0 &&
          visible.length === 0 && (
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
                No posts match your search or filter
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setFilter("ALL");
                }}
                className="mt-2 text-[12px] font-semibold"
                style={{ color: IG_ACCENT }}
              >
                Clear filters
              </button>
            </div>
          )}

        {/* ── GRID ── */}
        {!isLoading && !fetchError && visible.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {visible.map((post) => (
                <GridTile
                  key={post.id}
                  post={post}
                  dark={dark}
                  onClick={() => setSelected(post)}
                />
              ))}
            </div>

            {/* ── LOAD MORE / END MARKER ── */}
            <div className="flex items-center gap-3 py-5 mt-2">
              <div
                className="flex-1 h-px"
                style={{
                  backgroundColor: dark
                    ? "rgba(193,53,132,0.15)"
                    : "rgba(193,53,132,0.1)",
                }}
              />
              {hasMore && !search && filter === "ALL" ? (
                <button
                  onClick={() => load(nextCursor, false)}
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
                    "Load More"
                  )}
                </button>
              ) : (
                <p
                  className="text-[11.5px] font-medium"
                  style={{ color: dark ? "#6b4f7a" : "#cbd5e1" }}
                >
                  {visible.length} of {allPosts.length} posts shown
                </p>
              )}
              <div
                className="flex-1 h-px"
                style={{
                  backgroundColor: dark
                    ? "rgba(193,53,132,0.15)"
                    : "rgba(193,53,132,0.1)",
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* ── POST MODAL ── */}
      {selected && (
        <PostModal
          post={selected}
          dark={dark}
          onClose={() => setSelected(null)}
          onDeleteRequest={() => setDeleteTarget(selected)}
        />
      )}

      {/* ── DELETE CONFIRM ── */}
      {deleteTarget && (
        <DeleteModal
          dark={dark}
          isDeleting={isDeleting}
          onConfirm={deletePost}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-white text-[13px] font-semibold"
          style={{
            background: toast.ok ? "rgba(22,163,74,0.95)" : "rgba(239,68,68,0.95)",
            backdropFilter: "blur(12px)",
            boxShadow: toast.ok ? "0 8px 28px rgba(34,197,94,0.35)" : "0 8px 28px rgba(239,68,68,0.35)",
            minWidth: 220,
          }}
        >
          {toast.ok ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          {toast.msg}
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display:none }
        .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none }
      `}</style>
    </div>
  );
}
