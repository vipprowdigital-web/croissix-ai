// mobile_app\app\(main)\post\page.tsx
// mobile_app\app\(main)\post\page.tsx

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/features/user/hook/useUser";
import {
  Plus,
  Search,
  RefreshCw,
  Trash2,
  Edit3,
  Calendar,
  Zap,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Building2,
  WifiOff,
  MoreVertical,
  FileText,
  X,
} from "lucide-react";
import Image from "next/image";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
type PostTopicType = "STANDARD" | "EVENT" | "OFFER";
type PostState = "LIVE" | "REJECTED" | "PROCESSING" | "DRAFT";
type FilterType = "ALL" | "STANDARD" | "EVENT" | "OFFER" | "LIVE" | "REJECTED";

interface GMBPost {
  name: string;
  languageCode: string;
  summary: string;
  topicType: PostTopicType;
  state: PostState;
  createTime: string;
  updateTime: string;
  searchUrl?: string;
  callToAction?: { actionType: string; url?: string };
  media?: { sourceUrl: string; mediaFormat: string }[];
  event?: { title: string; schedule?: any };
  offer?: { couponCode?: string };
}

interface Post {
  name: string;
  id: string;
  summary: string;
  topicType: PostTopicType;
  state: PostState;
  date: string;
  updateDate: string;
  cta?: string;
  ctaUrl?: string;
  imageUrl?: string;
  eventTitle?: string;
  couponCode?: string;
}

interface PostsResponse {
  success: boolean;
  posts: GMBPost[];
  nextPageToken?: string;
  total?: number;
  error?: string;
}

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
function normalisePost(g: GMBPost): Post {
  return {
    name: g.name,
    id: g.name.split("/").pop() ?? g.name,
    summary: g.summary ?? "",
    topicType: g.topicType ?? "STANDARD",
    state: g.state ?? "LIVE",
    date: new Date(g.createTime).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    updateDate: new Date(g.updateTime).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    cta: g.callToAction?.actionType,
    ctaUrl: g.callToAction?.url,
    imageUrl: g.media?.[0]?.sourceUrl,
    eventTitle: g.event?.title,
    couponCode: g.offer?.couponCode,
  };
}

function getToken() {
  return typeof window !== "undefined"
    ? localStorage.getItem("accessToken")
    : null;
}

/* ══════════════════════════════════════════════════════════
   API
══════════════════════════════════════════════════════════ */
async function fetchPosts(
  locationId: string,
  pageToken?: string,
): Promise<PostsResponse> {
  const params = new URLSearchParams({
    location: `accounts/me/locations/${locationId}`,
  });
  if (pageToken) params.set("pageToken", pageToken);
  const res = await fetch(`/api/google/posts?${params}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Failed to fetch posts");
  return json;
}

async function deletePost(postName: string) {
  const res = await fetch("/api/google/posts/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
    body: JSON.stringify({ postName }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Delete failed");
}

async function fetchAnalysis(locationId: string) {
  const res = await fetch(`/api/google/analysis?locationId=${locationId}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Failed to fetch analysis");
  return json;
}

/* ══════════════════════════════════════════════════════════
   ATOMS
══════════════════════════════════════════════════════════ */
function GoogleLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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

function Spin({
  size = 16,
  white = false,
}: {
  size?: number;
  white?: boolean;
}) {
  return (
    <svg
      className="animate-spin"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={white ? "white" : "currentColor"}
        strokeWidth="2.5"
        strokeOpacity="0.25"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke={white ? "white" : "currentColor"}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
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
      className={`animate-pulse rounded-xl ${isDark ? "bg-white/[0.07]" : "bg-slate-100"} ${className}`}
    />
  );
}

function typeIcon(t: PostTopicType, size = 13) {
  if (t === "EVENT") return <Calendar size={size} />;
  if (t === "OFFER") return <ShoppingBag size={size} />;
  return <Zap size={size} />;
}

function typeColor(t: PostTopicType, isDark: boolean) {
  if (t === "EVENT")
    return isDark
      ? "bg-purple-500/15 text-purple-400 border-purple-500/20"
      : "bg-purple-50 text-purple-600 border-purple-200";
  if (t === "OFFER")
    return isDark
      ? "bg-orange-500/15 text-orange-400 border-orange-500/20"
      : "bg-orange-50 text-orange-600 border-orange-200";
  return isDark
    ? "bg-blue-500/15 text-blue-400 border-blue-500/20"
    : "bg-blue-50 text-blue-600 border-blue-200";
}

function stateBadge(s: PostState, isDark: boolean) {
  if (s === "LIVE")
    return {
      cls: isDark
        ? "bg-green-500/15 text-green-400"
        : "bg-green-50 text-green-600",
      label: "Live",
    };
  if (s === "REJECTED")
    return {
      cls: isDark ? "bg-red-500/15 text-red-400" : "bg-red-50 text-red-600",
      label: "Rejected",
    };
  if (s === "PROCESSING")
    return {
      cls: isDark
        ? "bg-yellow-500/15 text-yellow-400"
        : "bg-yellow-50 text-yellow-600",
      label: "Processing",
    };
  return {
    cls: isDark
      ? "bg-slate-500/15 text-slate-400"
      : "bg-slate-50 text-slate-500",
    label: "Draft",
  };
}

/* ══════════════════════════════════════════════════════════
   POST CARD SKELETON
══════════════════════════════════════════════════════════ */
function PostCardSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05]"}`}
    >
      <div className="flex items-start gap-3">
        <Sk isDark={isDark} className="w-10 h-10 rounded-xl shrink-0" />
        <div className="flex-1">
          <Sk isDark={isDark} className="h-3.5 w-24 mb-2" />
          <Sk isDark={isDark} className="h-2.5 w-full mb-1.5" />
          <Sk isDark={isDark} className="h-2.5 w-3/4" />
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Sk isDark={isDark} className="h-7 w-16 rounded-lg" />
        <Sk isDark={isDark} className="h-7 w-16 rounded-lg" />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   DELETE MODAL
══════════════════════════════════════════════════════════ */
function DeleteModal({
  post,
  isDark,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  post: Post;
  isDark: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onCancel();
      }}
    >
      <div
        className={`w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl ${isDark ? "bg-[#131c2d]" : "bg-white"}`}
      >
        <div className="p-6 text-center">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isDark ? "bg-red-500/15" : "bg-red-50"}`}
          >
            <Trash2 size={22} className="text-red-500" />
          </div>
          <h3
            className={`text-[17px] font-black mb-1.5 ${isDark ? "text-white" : "text-slate-900"}`}
            style={{ letterSpacing: "-0.03em" }}
          >
            Delete Post?
          </h3>
          <p
            className={`text-[13px] leading-relaxed mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            This will permanently remove the post from your Google Business
            Profile.
          </p>
          <p
            className={`text-[12px] font-medium line-clamp-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
          >
            "{post.summary.slice(0, 60)}
            {post.summary.length > 60 ? "…" : ""}"
          </p>
        </div>
        <div
          className={`px-4 pb-5 flex gap-2.5 border-t ${isDark ? "border-white/[0.06]" : "border-slate-100"} pt-4`}
        >
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className={`flex-1 h-11 rounded-2xl text-[13px] font-semibold transition-all active:scale-95 disabled:opacity-50
              ${isDark ? "bg-white/[0.07] text-slate-300" : "bg-slate-100 text-slate-600"}`}
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
                <Spin size={14} white /> Deleting…
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
  isDark,
  onDelete,
  onEdit,
  isDeleting,
}: {
  post: Post;
  isDark: boolean;
  onDelete: (p: Post) => void;
  onEdit: (p: Post) => void;
  isDeleting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const needsTrunc = post.summary.length > 100;
  const { cls, label } = stateBadge(post.state, isDark);

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-all duration-200 flex flex-col
      ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05] shadow-sm"}
      ${isDeleting ? "opacity-40 pointer-events-none" : ""}`}
    >
      {/* image strip */}
      {post.imageUrl && (
        <div className="relative h-48 md:h-52 overflow-hidden">
          <Image
            src={post.imageUrl}
            alt="Post image"
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute top-2 right-2">
            <span
              className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeColor(post.topicType, isDark)}`}
            >
              {typeIcon(post.topicType, 10)} {post.topicType}
            </span>
          </div>
        </div>
      )}

      <div className="p-4 flex flex-col flex-1">
        {/* header row */}
        <div className="flex items-start gap-3 mb-2.5">
          {!post.imageUrl && (
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${typeColor(post.topicType, isDark)}`}
            >
              {typeIcon(post.topicType, 15)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              {!post.imageUrl && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeColor(post.topicType, isDark)}`}
                >
                  {post.topicType}
                </span>
              )}
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`}
              >
                {label}
              </span>
              <span
                className={`text-[10px] ml-auto shrink-0 ${isDark ? "text-slate-500" : "text-slate-400"}`}
              >
                {post.date}
              </span>
            </div>
            {post.eventTitle && (
              <p
                className={`text-[12px] font-bold mb-0.5 ${isDark ? "text-blue-400" : "text-blue-600"}`}
              >
                📅 {post.eventTitle}
              </p>
            )}
          </div>

          {/* 3-dot menu */}
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className={`w-7 h-7 flex items-center justify-center rounded-xl transition-all active:scale-90
                ${isDark ? "text-slate-500 hover:bg-white/[0.08] hover:text-slate-300" : "text-slate-400 hover:bg-slate-100"}`}
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
                  ${isDark ? "bg-[#1e2a42] border-white/[0.08]" : "bg-white border-black/[0.07]"}`}
                >
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(post);
                    }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition-colors
                      ${isDark ? "text-slate-300 hover:bg-white/[0.06]" : "text-slate-700 hover:bg-slate-50"}`}
                  >
                    <Edit3 size={13} className="text-blue-500" /> Edit Post
                  </button>
                  <div
                    className={`h-px mx-3 ${isDark ? "bg-white/[0.06]" : "bg-slate-100"}`}
                  />
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(post);
                    }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition-colors
                      ${isDark ? "text-red-400 hover:bg-red-500/[0.08]" : "text-red-500 hover:bg-red-50"}`}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* body */}
        <p
          className={`text-[13.5px] leading-relaxed flex-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
          style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}
        >
          {needsTrunc && !expanded
            ? post.summary.slice(0, 100) + "…"
            : post.summary}
          {needsTrunc && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="ml-1 text-blue-500 text-[12px] font-medium hover:text-blue-400 transition-colors"
            >
              {expanded ? "Less" : "More"}
            </button>
          )}
        </p>

        {/* coupon */}
        {post.couponCode && (
          <div
            className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold self-start
            ${isDark ? "bg-orange-500/15 text-orange-400" : "bg-orange-50 text-orange-600"}`}
          >
            🏷️ {post.couponCode}
          </div>
        )}

        {/* cta */}
        {post.cta && post.cta !== "NONE" && (
          <div
            className={`mt-2 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg self-start
            ${isDark ? "bg-blue-500/15 text-blue-400" : "bg-blue-50 text-blue-600"}`}
          >
            {post.cta.replace(/_/g, " ")}
          </div>
        )}

        {/* footer */}
        <div
          className={`flex items-center gap-2 mt-3 pt-3 border-t ${isDark ? "border-white/[0.05]" : "border-slate-100"}`}
        >
          <button
            onClick={() => onEdit(post)}
            className={`flex items-center gap-1.5 h-7 px-3 rounded-xl text-[12px] font-semibold transition-all active:scale-95
              ${isDark ? "bg-white/[0.07] text-slate-300 hover:bg-white/[0.12]" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            <Edit3 size={12} /> Edit
          </button>
          <button
            onClick={() => onDelete(post)}
            className={`flex items-center gap-1.5 h-7 px-3 rounded-xl text-[12px] font-semibold transition-all active:scale-95
              ${isDark ? "text-slate-500 hover:text-red-400 hover:bg-red-500/10" : "text-slate-400 hover:text-red-500 hover:bg-red-50"}`}
          >
            <Trash2 size={12} /> Delete
          </button>
          <span
            className={`ml-auto text-[10px] flex items-center gap-1 ${isDark ? "text-slate-600" : "text-slate-400"}`}
          >
            <Clock size={10} /> {post.updateDate}
          </span>
        </div>
      </div>
    </div>
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
  isDark,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  isDark: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-3.5 border flex flex-col gap-1.5
      ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05] shadow-sm"}`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-[10px] font-semibold uppercase tracking-wide ${isDark ? "text-slate-500" : "text-slate-400"}`}
        >
          {label}
        </span>
        <span className="p-1.5 rounded-lg" style={{ background: `${color}18` }}>
          <span style={{ color }}>{icon}</span>
        </span>
      </div>
      <span
        className={`text-[22px] font-black ${isDark ? "text-white" : "text-slate-900"}`}
        style={{
          fontFamily: "-apple-system,'SF Pro Display',sans-serif",
          letterSpacing: "-0.04em",
        }}
      >
        {value}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════ */
export default function GooglePostsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  const router = useRouter();
  const qc = useQueryClient();
  const { data: user, isLoading: userLoading } = useUser();

  const [posts, setPosts] = useState<Post[]>([]);
  const [nextToken, setNextToken] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const showToast = (msg: string) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(""), 3000);
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["google-posts", user?.googleLocationId],
    queryFn: () => fetchPosts(user!.googleLocationId!),
    enabled: !!user?.googleLocationId,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (data) {
      setPosts((data.posts ?? []).map(normalisePost));
      setNextToken(data.nextPageToken);
      setHasMore(!!data.nextPageToken);
    }
  }, [data]);

  const loadMore = async () => {
    if (!nextToken || loadingMore || !user?.googleLocationId) return;
    setLoadingMore(true);
    try {
      const more = await fetchPosts(user.googleLocationId, nextToken);
      setPosts((prev) => [...prev, ...(more.posts ?? []).map(normalisePost)]);
      setNextToken(more.nextPageToken);
      setHasMore(!!more.nextPageToken);
    } catch {
      /* silent */
    } finally {
      setLoadingMore(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: (_, postName) => {
      setPosts((prev) => prev.filter((p) => p.name !== postName));
      setDeleteTarget(null);
      showToast("Post deleted successfully");
      qc.invalidateQueries({ queryKey: ["google-posts"] });
    },
    onError: (e: any) => {
      showToast(e.message ?? "Delete failed");
      setDeleteTarget(null);
    },
  });

  const { data: analysisData } = useQuery({
    queryKey: ["google-analysis", user?.googleLocationId],
    queryFn: () => fetchAnalysis(user!.googleLocationId!),
    enabled: !!user?.googleLocationId,
    staleTime: 60_000,
  });

  const stats = analysisData?.stats;
  const total = stats?.totalPosts ?? posts.length;
  const liveCount = stats?.livePosts ?? 0;
  const evtCount = stats?.eventPosts ?? 0;
  const ofrCount = stats?.offerPosts ?? 0;
  const updCount = stats?.updatePosts ?? 0;
  const rejectedCount = posts.filter((p) => p.state === "REJECTED").length;

  const FILTERS: { id: FilterType; label: string }[] = [
    { id: "ALL", label: `All (${total})` },
    { id: "LIVE", label: `Live (${liveCount})` },
    { id: "STANDARD", label: `Updates (${updCount})` },
    { id: "EVENT", label: `Events (${evtCount})` },
    { id: "OFFER", label: `Offers (${ofrCount})` },
    { id: "REJECTED", label: `Rejected (${rejectedCount})` },
  ];

  const visible = posts.filter((p) => {
    const matchFilter =
      filter === "ALL"
        ? true
        : filter === "LIVE"
          ? p.state === "LIVE"
          : filter === "REJECTED"
            ? p.state === "REJECTED"
            : p.topicType === filter;
    const matchSearch =
      !search ||
      p.summary.toLowerCase().includes(search.toLowerCase()) ||
      p.eventTitle?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const isInitial = userLoading || (isLoading && posts.length === 0);

  return (
    <div
      className="w-full"
      style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}
    >
      {/* ── HEADER ── */}
      <div className="pt-2 pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <GoogleLogo />
            <h1
              className={`text-[18px] font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
              style={{ letterSpacing: "-0.03em" }}
            >
              My Posts
            </h1>
          </div>
          {user?.googleLocationName && (
            <div className="flex items-center gap-1.5">
              <Building2
                size={11}
                className={isDark ? "text-slate-600" : "text-slate-400"}
              />
              <span
                className={`text-[12px] ${isDark ? "text-slate-500" : "text-slate-500"}`}
              >
                {user.googleLocationName}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90 disabled:opacity-50
              ${isDark ? "bg-white/[0.07] text-slate-400 hover:bg-white/[0.12]" : "bg-white text-slate-500 border border-slate-200"}`}
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => router.push("/post/create")}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-[13px] font-bold text-white transition-all active:scale-95"
            style={{
              background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
              boxShadow: "0 3px 12px rgba(37,99,235,0.38)",
            }}
          >
            <Plus size={15} /> New Post
          </button>
        </div>
      </div>

      {/* ── INITIAL SKELETON ── */}
      {isInitial && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-1">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`rounded-2xl p-4 h-20 animate-pulse border
                ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05]"}`}
              />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <PostCardSkeleton key={i} isDark={isDark} />
            ))}
          </div>
        </div>
      )}

      {/* ── NOT LINKED ── */}
      {!userLoading && !user?.googleLocationId && (
        <div
          className={`rounded-2xl p-8 text-center border
          ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05]"}`}
        >
          <Building2
            size={32}
            className={`mx-auto mb-3 ${isDark ? "text-slate-600" : "text-slate-300"}`}
          />
          <p
            className={`text-[14px] font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            No Google Business Linked
          </p>
          <p
            className={`text-[12.5px] mb-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
          >
            Go to your Profile page and link your Google Business Profile.
          </p>
          <button
            onClick={() => router.push("/profile")}
            className="h-9 px-5 rounded-xl text-[13px] font-bold text-white transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}
          >
            Go to Profile
          </button>
        </div>
      )}

      {/* ── ERROR ── */}
      {isError && (
        <div
          className={`rounded-2xl p-4 flex items-start gap-3 border mb-4
          ${isDark ? "bg-red-500/[0.08] border-red-500/20" : "bg-red-50 border-red-200"}`}
        >
          <WifiOff size={16} className="text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-red-400 mb-0.5">
              Failed to load posts
            </p>
            <p
              className={`text-[12px] ${isDark ? "text-red-500/70" : "text-red-400"}`}
            >
              {(error as any)?.message}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-1.5 text-[12px] font-semibold text-blue-500"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      {!isInitial && user?.googleLocationId && (
        <>
          {/* stats: 2-col mobile → 4-col desktop */}
          {total > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <StatCard
                label="Total Posts"
                value={total}
                icon={<FileText size={14} />}
                color="#3b82f6"
                isDark={isDark}
              />
              <StatCard
                label="Live"
                value={liveCount}
                icon={<CheckCircle2 size={14} />}
                color="#22c55e"
                isDark={isDark}
              />
              <StatCard
                label="Events"
                value={evtCount}
                icon={<Calendar size={14} />}
                color="#8b5cf6"
                isDark={isDark}
              />
              <StatCard
                label="Offers"
                value={ofrCount}
                icon={<ShoppingBag size={14} />}
                color="#f97316"
                isDark={isDark}
              />
            </div>
          )}

          {/* search + filter row */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
            {/* search */}
            <div
              className={`flex items-center gap-2.5 h-[42px] px-3.5 rounded-[13px] border flex-1
              ${isDark ? "bg-[#131c2d] border-white/[0.07]" : "bg-white border-black/[0.07]"}`}
            >
              <Search
                size={14}
                className={isDark ? "text-slate-600" : "text-slate-400"}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search posts…"
                className={`flex-1 bg-transparent outline-none text-[13.5px]
                  ${isDark ? "text-white placeholder:text-slate-600" : "text-slate-900 placeholder:text-slate-400"}`}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className={`text-[11px] font-medium flex items-center gap-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                >
                  <X size={12} /> Clear
                </button>
              )}
            </div>

            {/* filter tabs: scroll on mobile, wrap on desktop */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar md:flex-wrap pb-0.5 md:pb-0 shrink-0">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`h-8 px-3 rounded-xl text-[12px] font-semibold whitespace-nowrap shrink-0 transition-all active:scale-95
                    ${
                      filter === f.id
                        ? "bg-blue-500 text-white"
                        : isDark
                          ? "bg-white/[0.07] text-slate-400 hover:bg-white/[0.12]"
                          : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* empty state — no posts */}
          {posts.length === 0 && !isLoading && (
            <div
              className={`rounded-2xl p-10 text-center border
              ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05]"}`}
            >
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4
                ${isDark ? "bg-blue-500/15" : "bg-blue-50"}`}
              >
                <FileText
                  size={26}
                  className={isDark ? "text-blue-400" : "text-blue-500"}
                />
              </div>
              <p
                className={`text-[15px] font-bold mb-1.5 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                No Posts Yet
              </p>
              <p
                className={`text-[13px] mb-5 ${isDark ? "text-slate-500" : "text-slate-400"}`}
              >
                Create your first Google Business post to engage customers.
              </p>
              <button
                onClick={() => router.push("/post/create")}
                className="h-10 px-6 rounded-xl text-[13px] font-bold text-white transition-all active:scale-95"
                style={{
                  background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
                  boxShadow: "0 3px 14px rgba(37,99,235,0.38)",
                }}
              >
                <span className="flex items-center gap-1.5">
                  <Plus size={15} /> Create First Post
                </span>
              </button>
            </div>
          )}

          {/* no search results */}
          {posts.length > 0 && visible.length === 0 && (
            <div
              className={`rounded-2xl p-8 text-center border
              ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05]"}`}
            >
              <Search
                size={24}
                className={`mx-auto mb-2 ${isDark ? "text-slate-600" : "text-slate-300"}`}
              />
              <p
                className={`text-[13px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
              >
                No posts match your filter
              </p>
            </div>
          )}

          {/* post grid: 1-col mobile → 2-col desktop */}
          {visible.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
              {visible.map((p) => (
                <PostCard
                  key={p.name}
                  post={p}
                  isDark={isDark}
                  onDelete={setDeleteTarget}
                  onEdit={(p) =>
                    router.push(`/post/edit/${encodeURIComponent(p.name)}`)
                  }
                  isDeleting={
                    deleteMutation.isPending &&
                    deleteMutation.variables === p.name
                  }
                />
              ))}
            </div>
          )}

          {/* load more */}
          <div className="mt-5">
            {loadingMore && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <PostCardSkeleton isDark={isDark} />
                <PostCardSkeleton isDark={isDark} />
              </div>
            )}
            {!loadingMore && hasMore && (
              <button
                onClick={loadMore}
                className={`w-full h-11 rounded-[13px] flex items-center justify-center gap-2
                  text-[13px] font-semibold border transition-all active:scale-[0.97]
                  ${
                    isDark
                      ? "bg-[#131c2d] border-white/[0.08] text-slate-400 hover:bg-[#182236]"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
              >
                Load More
              </button>
            )}
            {!loadingMore && !hasMore && total > 0 && (
              <div className="flex items-center gap-3 py-2">
                <div
                  className={`flex-1 h-px ${isDark ? "bg-white/[0.06]" : "bg-slate-200"}`}
                />
                <p
                  className={`text-[12px] font-medium ${isDark ? "text-slate-600" : "text-slate-400"}`}
                >
                  All {total} posts loaded
                </p>
                <div
                  className={`flex-1 h-px ${isDark ? "bg-white/[0.06]" : "bg-slate-200"}`}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* ── DELETE MODAL ── */}
      {deleteTarget && (
        <DeleteModal
          post={deleteTarget}
          isDark={isDark}
          isDeleting={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.name)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ── TOAST ── */}
      {toastMsg && (
        <div
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[300]
          flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-semibold text-white shadow-2xl"
          style={{
            background: "rgba(15,23,42,0.92)",
            backdropFilter: "blur(12px)",
          }}
        >
          <CheckCircle2 size={14} className="text-green-400 shrink-0" />
          {toastMsg}
        </div>
      )}
    </div>
  );
}
