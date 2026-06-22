"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  MessageCircle,
  Mail,
  ChevronRight,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Unplug,
  Users,
  Eye,
  TrendingUp,
  Globe,
  Trophy,
  Link as LinkIcon,
  Heart,
  NotebookText,
  Clapperboard,
  Image as ImageIcon,
  Video,
  Share2,
  MessageCircleMore,
} from "lucide-react";
import { API } from "@/lib/axiosClient";
import { useUser } from "@/features/user/hook/useUser";
import Image from "next/image";
import { getToken } from "@/lib/token";

/* ═══════════════════════════════════════════════════════
   TYPES  (mirrors mobile FacebookAnalytics types exactly)
═══════════════════════════════════════════════════════ */
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

interface EnhancedPostData {
  id: string;
  title: string;
  dateString: string;
  contentType: "Video" | "Image" | "Link" | "Text";
  mediaUrl: string | null;
  targetUrl: string | null;
  metrics: PostMetrics;
}

interface PageOverview {
  totalImpressions: string;
  totalEngagements: string;
  newFans: string;
  pageViews: string;
  totalFans: string;
}

interface PageProfile {
  name: string;
  pictureUrl: string | null;
  category: string;
  fans: string;
  followers: string;
}

interface AnalyticsData {
  posts: EnhancedPostData[];
  pageOverview: PageOverview | null;
  pageProfile: PageProfile | null;
  topPost: EnhancedPostData | null;
}

/* ═══════════════════════════════════════════════════════
   CONTENT TYPE CONFIG  (mirrors mobile contentTypeConfig)
═══════════════════════════════════════════════════════ */
const CONTENT_TYPE_CFG: Record<
  string,
  { icon: React.ReactNode; color: string }
> = {
  Video: { icon: <Clapperboard size={13} />, color: "#EF4444" },
  Image: { icon: <ImageIcon size={13} />, color: "#8B5CF6" },
  Link: { icon: <LinkIcon size={13} />, color: "#F59E0B" },
  Text: { icon: <NotebookText size={13} />, color: "#1877F2" },
};

const ngrokUrl =
  "https://c7f8-2405-201-3025-d0bc-c813-49b2-210a-b662.ngrok-free.app/api/v1";

/* ═══════════════════════════════════════════════════════
   API
═══════════════════════════════════════════════════════ */
async function fetchFacebookStatus(): Promise<{
  isFacebookConnected: boolean;
}> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/facebook/status`,
    {
      headers: { Authorization: `Bearer ${getToken()}` },
    },
  );
  if (!res.ok) throw new Error("Failed to fetch Facebook status");
  return res.json();
}

async function fetchFacebookAnalytics(): Promise<AnalyticsData> {
  // Calls the same backend endpoint as mobile: /api/v1/facebook/feed-performance
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/facebook/feed-performance`,
    {
      headers: { Authorization: `Bearer ${getToken()}` },
    },
  );
  if (!res.ok) throw new Error("Failed to fetch Facebook analytics");
  return res.json();
}

async function disconnectFacebook(): Promise<void> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/facebook/disconnect-page`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
    },
  );
  if (!res.ok) throw new Error("Failed to disconnect Facebook");
}

/* ═══════════════════════════════════════════════════════
   SKELETON  (matches mobile PostSkeleton pattern)
═══════════════════════════════════════════════════════ */
function PageSkeleton({ dark }: { dark: boolean }) {
  return (
    <div className="space-y-4">
      {/* Profile header skeleton */}
      <div
        className={`h-28 rounded-2xl animate-pulse ${dark ? "bg-white/[0.05]" : "bg-blue-100/50"}`}
      />
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-24 rounded-2xl animate-pulse ${dark ? "bg-white/[0.05]" : "bg-blue-100/50"}`}
          />
        ))}
      </div>
      {/* Top post banner skeleton */}
      <div
        className={`h-40 rounded-2xl animate-pulse ${dark ? "bg-white/[0.05]" : "bg-blue-100/50"}`}
      />
      {/* Post card skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className={`h-48 rounded-2xl animate-pulse ${dark ? "bg-white/[0.05]" : "bg-blue-100/50"}`}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STAT CARD  (mirrors mobile StatCard — icon top-right,
               value large, label small uppercase)
═══════════════════════════════════════════════════════ */
function StatCard({
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
      className={`p-3 rounded-2xl border relative overflow-hidden transition-colors
        ${dark ? "bg-[#0a1020] border-blue-900/30" : "bg-white border-blue-100/80 shadow-sm"}`}
    >
      {/* Icon top-right — same as mobile */}
      <div
        className="absolute top-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center border"
        style={{
          backgroundColor: color + "20",
          borderColor: color + "50",
          color,
        }}
      >
        {icon}
      </div>
      {/* Value */}
      <p
        className="text-[22px] font-black leading-none mt-1 mb-5"
        style={{ color, letterSpacing: "-0.03em" }}
      >
        {value}
      </p>
      {/* Label */}
      <p
        className="text-[9px] font-black uppercase tracking-widest mt-1.5"
        style={{ color: dark ? "#475569" : "#94a3b8" }}
      >
        {label}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TOP POST BANNER  (mirrors mobile TopPostBanner)
═══════════════════════════════════════════════════════ */
function TopPostBanner({
  post,
  dark,
}: {
  post: EnhancedPostData;
  dark: boolean;
}) {
  // accentGreen equivalent for web
  const green = "#10B981";

  return (
    <div
      className="p-4 rounded-2xl border mb-5"
      style={{
        backgroundColor: green + "10",
        borderColor: green + "40",
      }}
    >
      {/* Crown badge row — mirrors mobile exactly */}
      <div className="flex items-center gap-2 mb-2">
        <Trophy size={16} style={{ color: "#EAB308" }} />
        <span
          className="text-[10px] font-black uppercase tracking-widest"
          style={{ color: green }}
        >
          Top Performing Post
        </span>
      </div>

      <p
        className={`font-bold text-[13px] leading-5 mb-2 line-clamp-2 ${dark ? "text-white" : "text-slate-900"}`}
      >
        {post.title}
      </p>

      {/* Post image — mirrors mobile Image block */}
      {post.mediaUrl && (
        <div className="relative w-full h-40 mt-2 mb-1">
          <Image
            src={post.mediaUrl}
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 600px"
            className="object-cover rounded-xl"
          />
        </div>
        // <img
        //   src={post.mediaUrl}
        //   alt=""
        //   className="w-full h-40 object-cover rounded-xl mt-2 mb-1"
        // />
      )}

      {/* Key metrics row — matches mobile: Reach / Engagements / ER */}
      <div className="flex gap-6 flex-wrap mt-3">
        {[
          { label: "Reach", value: post.metrics.reach },
          { label: "Engagements", value: post.metrics.totalEngagements },
          { label: "ER", value: post.metrics.engagementRate },
        ].map((m) => (
          <div key={m.label}>
            <p
              className="text-[9px] font-black uppercase tracking-wider"
              style={{ color: dark ? "#475569" : "#94a3b8" }}
            >
              {m.label}
            </p>
            <p className="text-[15px] font-black" style={{ color: green }}>
              {m.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   POST CARD  (mirrors mobile post card: badge, title,
               date, thumbnail, ER bar, 6-metric grid)
═══════════════════════════════════════════════════════ */
function PostCard({ post, dark }: { post: EnhancedPostData; dark: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const typeConfig =
    CONTENT_TYPE_CFG[post.contentType] ?? CONTENT_TYPE_CFG.Text;
  const green = "#10B981";
  const cardText = dark ? "#93C5FD" : "#2563EB"; // "link" color equivalent

  // Parse ER % for the progress bar (same logic as mobile commented code)
  const erValue = parseFloat(post.metrics.engagementRate) || 0;
  const erBarWidth = Math.min(erValue * 8, 100);

  return (
    <div
      className={`p-4 rounded-2xl border mb-4 overflow-hidden transition-all cursor-pointer
        ${dark ? "bg-[#0a1020] border-blue-900/30" : "bg-white border-blue-100/80 shadow-sm"}`}
      onClick={() => setExpanded((v) => !v)}
    >
      {/* ── Header row: badge + title + thumbnail ── */}
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex-1 min-w-0">
          {/* Content type badge — mirrors mobile badge exactly */}
          <div
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md mb-2 border"
            style={{
              backgroundColor: typeConfig.color + "18",
              borderColor: typeConfig.color + "50",
              color: typeConfig.color,
            }}
          >
            {typeConfig.icon}
            <span className="text-[10px] font-black uppercase tracking-wider">
              {post.contentType}
            </span>
          </div>

          <p
            className={`font-bold text-[13px] leading-5 ${expanded ? "" : "line-clamp-2"} ${dark ? "text-white" : "text-slate-900"}`}
          >
            {post.title}
          </p>
          <p
            className="text-[11px] font-medium mt-1"
            style={{ color: dark ? "#475569" : "#94a3b8" }}
          >
            Published {post.dateString}
          </p>
        </div>

        {/* Thumbnail or placeholder icon — mirrors mobile */}
        {post.mediaUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          // <img
          //   src={post.mediaUrl}
          //   alt=""
          //   className="w-16 h-16 rounded-xl object-cover shrink-0"
          // />
          <Image
            src={post.mediaUrl}
            alt=""
            width={64}
            height={64}
            className="w-16 h-16 rounded-xl object-cover shrink-0"
          />
        ) : (
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: typeConfig.color + "15",
              color: typeConfig.color,
            }}
          >
            {typeConfig.icon}
          </div>
        )}
      </div>

      {/* ── ER progress bar — mirrors mobile commented ER bar ── */}
      {erValue > 0 && (
        <div
          className="h-1 rounded-full mb-3 overflow-hidden"
          style={{
            backgroundColor: dark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
          }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${erBarWidth}%`, backgroundColor: green }}
          />
        </div>
      )}

      {/* ── 6-metric grid — matches mobile's 3-col flex-wrap grid exactly ── */}
      <div
        className="grid grid-cols-3 gap-y-3 pt-3 border-t"
        style={{
          borderColor: dark ? "rgba(30,58,138,0.3)" : "rgba(219,234,254,0.8)",
        }}
      >
        {/* 1: Reach */}
        <div>
          <p
            className="text-[9px] font-black uppercase tracking-wider"
            style={{ color: dark ? "#475569" : "#94a3b8" }}
          >
            Reach
          </p>
          <p
            className="font-black text-[13px] mt-0.5"
            style={{ color: cardText }}
          >
            {post.metrics.reach}
          </p>
        </div>

        {/* 2: Impressions */}
        <div>
          <p
            className="text-[9px] font-black uppercase tracking-wider"
            style={{ color: dark ? "#475569" : "#94a3b8" }}
          >
            Impressions
          </p>
          <p
            className="font-black text-[13px] mt-0.5"
            style={{ color: cardText }}
          >
            {post.metrics.impressions}
          </p>
        </div>

        {/* 3: Engagement Rate */}
        <div>
          <p
            className="text-[9px] font-black uppercase tracking-wider"
            style={{ color: dark ? "#475569" : "#94a3b8" }}
          >
            ER %
          </p>
          <p className="font-black text-[13px] mt-0.5" style={{ color: green }}>
            {post.metrics.engagementRate}
          </p>
        </div>

        {/* 4: Reactions (with Heart icon — mirrors mobile) */}
        <div>
          <div className="flex items-center gap-1">
            <Heart size={11} style={{ color: "#EF4444" }} />
            <p
              className="text-[9px] font-medium"
              style={{ color: dark ? "#475569" : "#94a3b8" }}
            >
              Reactions
            </p>
          </div>
          <p
            className="font-bold text-[12px] mt-0.5"
            style={{ color: dark ? "#cbd5e1" : "#475569" }}
          >
            {post.metrics.reactions}
          </p>
        </div>

        {/* 5: Comments (with MessageCircleMore icon — mirrors mobile) */}
        <div>
          <div className="flex items-center gap-1">
            <MessageCircleMore
              size={11}
              style={{ color: dark ? "#cbd5e1" : "#64748b" }}
            />
            <p
              className="text-[9px] font-medium"
              style={{ color: dark ? "#475569" : "#94a3b8" }}
            >
              Comments
            </p>
          </div>
          <p
            className="font-bold text-[12px] mt-0.5"
            style={{ color: dark ? "#cbd5e1" : "#475569" }}
          >
            {post.metrics.comments}
          </p>
        </div>

        {/* 6: Video Views OR Shares (mirrors mobile conditional) */}
        <div>
          {post.metrics.videoViews ? (
            <>
              <div className="flex items-center gap-1">
                <Video size={11} style={{ color: "#1877F2" }} />
                <p
                  className="text-[9px] font-medium"
                  style={{ color: dark ? "#475569" : "#94a3b8" }}
                >
                  Views
                </p>
              </div>
              <p
                className="font-bold text-[12px] mt-0.5"
                style={{ color: dark ? "#cbd5e1" : "#475569" }}
              >
                {post.metrics.videoViews}
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <LinkIcon size={11} style={{ color: cardText }} />
                <p
                  className="text-[9px] font-medium"
                  style={{ color: dark ? "#475569" : "#94a3b8" }}
                >
                  Shares
                </p>
              </div>
              <p
                className="font-bold text-[12px] mt-0.5"
                style={{ color: dark ? "#cbd5e1" : "#475569" }}
              >
                {post.metrics.shares}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ANALYTICS SECTION  (the full FacebookAnalytics mobile
   component ported to web — profile header, stat cards,
   top post banner, post cards list)
═══════════════════════════════════════════════════════ */
function FacebookAnalyticsSection({
  dark,
  isFetching,
  onRefresh,
}: {
  dark: boolean;
  isFetching: boolean;
  onRefresh: () => void;
}) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["facebookAnalytics"],
    queryFn: fetchFacebookAnalytics,
    staleTime: 1000 * 60 * 5,
  });

  const facebookBlue = "#1877F2";
  const green = "#10B981";

  // ── Loading ──
  if (isLoading) return <PageSkeleton dark={dark} />;

  // ── Error ──
  if (isError) {
    return (
      <div
        className={`rounded-2xl border p-8 text-center
          ${dark ? "bg-red-500/[0.06] border-red-500/20" : "bg-red-50 border-red-200/60"}`}
      >
        <AlertTriangle size={28} className="text-red-400 mx-auto mb-3" />
        <p
          className={`text-[14px] font-bold mb-1 ${dark ? "text-white" : "text-slate-900"}`}
        >
          Failed to load analytics
        </p>
        <p className="text-[11px] text-red-400 mb-4">
          {(error as Error)?.message || "Could not reach Facebook Graph API"}
        </p>
        <button
          onClick={() => refetch()}
          className="text-[12px] font-bold text-blue-400 flex items-center gap-1.5 mx-auto"
        >
          <RefreshCw size={12} /> Try Again
        </button>
      </div>
    );
  }

  const posts = data?.posts ?? [];
  const pageOverview = data?.pageOverview ?? null;
  const pageProfile = data?.pageProfile ?? null;
  const topPost = data?.topPost ?? null;

  // ── Empty ──
  if (posts.length === 0) {
    return (
      <div
        className={`rounded-2xl border p-10 text-center
          ${dark ? "bg-[#0a1020] border-blue-900/30" : "bg-white border-blue-100/80 shadow-sm"}`}
      >
        <p className="text-4xl mb-3">📭</p>
        <p
          className={`text-[14px] font-bold ${dark ? "text-white" : "text-slate-900"}`}
        >
          No posts found on your page yet.
        </p>
        <p
          className="text-[12px] mt-1"
          style={{ color: dark ? "#475569" : "#94a3b8" }}
        >
          Publish content to see your analytics appear here.
        </p>
      </div>
    );
  }

  // ── Overview cards config — mirrors mobile overviewCards array ──
  const overviewCards = pageOverview
    ? [
        {
          label: "28d Impressions",
          value: pageOverview.totalImpressions,
          icon: <Eye size={16} />,
          color: "#3B82F6",
        },
        {
          label: "28d Engagements",
          value: pageOverview.totalEngagements,
          icon: <MessageCircleMore size={16} />,
          color: "#EC4899",
        },
        {
          label: "New Fans (28d)",
          value: pageOverview.newFans,
          icon: <TrendingUp size={16} />,
          color: "#10B981",
        },
        {
          label: "Page Views (28d)",
          value: pageOverview.pageViews,
          icon: <Globe size={16} />,
          color: "#8B5CF6",
        },
        {
          label: "Total Fans",
          value: pageOverview.totalFans,
          icon: <Users size={16} />,
          color: "#F59E0B",
        },
      ]
    : [];

  return (
    <div className="space-y-5">
      {/* ── Page Profile Header (gradient — mirrors mobile LinearGradient) ── */}
      {pageProfile && (
        <div
          className="rounded-2xl overflow-hidden border border-blue-500/40 mb-1"
          style={{
            background:
              "linear-gradient(135deg, #3b5998 0%, #1877F1 55%, #000 100%)",
          }}
        >
          <div className="flex items-center gap-3 p-4">
            {/* Avatar */}
            {pageProfile.pictureUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              // <img
              //   src={pageProfile.pictureUrl}
              //   alt={pageProfile.name}
              //   className="w-14 h-14 rounded-full object-cover shrink-0"
              // />
              <Image
                src={pageProfile.pictureUrl}
                alt={pageProfile.name}
                width={56}
                height={56}
                priority
                className="w-14 h-14 rounded-full object-cover shrink-0"
              />
            ) : (
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: facebookBlue }}
              >
                <span className="text-white text-2xl font-black">
                  {pageProfile.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {/* Name + category + fans/followers */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-[18px] font-black capitalize leading-tight truncate">
                {pageProfile.name}
              </p>
              <p className="text-white/60 text-[11px] font-medium mt-0.5">
                {pageProfile.category}
              </p>
              <div className="flex gap-5 mt-2">
                <div>
                  <p className="text-white text-[17px] font-black leading-none">
                    {pageProfile.fans}
                  </p>
                  <p className="text-white/50 text-[9px] font-black uppercase tracking-widest mt-0.5">
                    Fans
                  </p>
                </div>
                <div>
                  <p className="text-white text-[17px] font-black leading-none">
                    {pageProfile.followers}
                  </p>
                  <p className="text-white/50 text-[9px] font-black uppercase tracking-widest mt-0.5">
                    Followers
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Section title — mirrors mobile "Content Performance" heading ── */}
      <div>
        <h2
          className={`text-[20px] font-black tracking-tight ${dark ? "text-white" : "text-slate-900"}`}
          style={{ letterSpacing: "-0.03em" }}
        >
          Content Performance
        </h2>
        <p
          className="text-[12px] font-medium mt-0.5"
          style={{ color: dark ? "#475569" : "#94a3b8" }}
        >
          Organic audience engagement analytics · Last 28 days
        </p>
      </div>

      {/* ── Overview Stat Cards grid ── */}
      {overviewCards.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {overviewCards.map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              icon={card.icon}
              color={card.color}
              dark={dark}
            />
          ))}
        </div>
      )}

      {/* ── Top Post Banner ── */}
      {topPost && <TopPostBanner post={topPost} dark={dark} />}

      {/* ── Post Cards list ── */}
      {/* <div>
        <div className="flex items-center justify-between mb-3">
          <p
            className="text-[10px] font-black uppercase tracking-widest"
            style={{ color: dark ? "#475569" : "#94a3b8" }}
          >
            Recent Posts · {posts.length} total
          </p>
        </div>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} dark={dark} />
        ))}
      </div> */}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   NOT CONNECTED VIEW
═══════════════════════════════════════════════════════ */
function NotConnectedView({
  dark,
  onConnect,
}: {
  dark: boolean;
  onConnect: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{
          background: "rgba(37,99,235,0.12)",
          border: "1px solid rgba(59,130,246,0.25)",
        }}
      >
        <span
          className="text-5xl font-black leading-none"
          style={{
            color: "#3b82f6",
            fontFamily: "-apple-system,'SF Pro Display',sans-serif",
          }}
        >
          f
        </span>
      </div>
      <h3
        className={`text-[24px] font-black mb-2 ${dark ? "text-white" : "text-slate-900"}`}
        style={{ letterSpacing: "-0.04em" }}
      >
        Facebook Insights
      </h3>
      <p
        className="text-[13px] mb-8 max-w-[280px] leading-relaxed"
        style={{ color: dark ? "#475569" : "#94a3b8" }}
      >
        Connect your Facebook Page to view real-time reach, engagement metrics,
        and individual post performance.
      </p>
      <button
        onClick={onConnect}
        className="flex items-center gap-2 px-5 py-3 rounded-2xl text-[12px] sm:text-[14px] font-black text-white transition-all active:scale-95"
        style={{
          background: "linear-gradient(135deg,#1e40af,#3b82f6)",
          boxShadow: "0 8px 24px rgba(59,130,246,0.38)",
        }}
      >
        Connect Facebook Account
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PAGE SELECT VIEW
═══════════════════════════════════════════════════════ */
interface FacebookPage {
  id: string;
  name: string;
  category?: string;
}

function PageSelectView({
  pages,
  dark,
  onSelect,
  onCancel,
}: {
  pages: FacebookPage[];
  dark: boolean;
  onSelect: (id: string) => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <h3
        className={`text-[22px] font-black mb-2 text-center ${dark ? "text-white" : "text-slate-900"}`}
        style={{ letterSpacing: "-0.04em" }}
      >
        Select Facebook Page
      </h3>
      <p
        className="text-[12px] mb-6 text-center max-w-[280px] leading-relaxed"
        style={{ color: dark ? "#475569" : "#94a3b8" }}
      >
        Choose the business page you want to connect to your analytics
        workspace.
      </p>
      <div className="w-full max-w-md space-y-2.5 mb-6">
        {pages.map((page) => (
          <button
            key={page.id}
            onClick={() => onSelect(page.id)}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all active:scale-[0.98] hover:border-blue-400/40
              ${dark ? "bg-[#0a1020] border-blue-900/30 hover:bg-blue-900/20" : "bg-white border-blue-100/80 hover:bg-blue-50 shadow-sm"}`}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6" }}
            >
              <span className="text-lg font-black">f</span>
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-[13px] font-bold ${dark ? "text-white" : "text-slate-900"}`}
              >
                {page.name}
              </p>
              {page.category && (
                <p
                  className="text-[10.5px]"
                  style={{ color: dark ? "#475569" : "#94a3b8" }}
                >
                  {page.category}
                </p>
              )}
            </div>
            <span
              className="text-[11px] font-bold"
              style={{ color: "#3b82f6" }}
            >
              Link →
            </span>
          </button>
        ))}
      </div>
      <button
        onClick={onCancel}
        className="text-[12px] font-medium"
        style={{ color: "#ef4444" }}
      >
        Cancel
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DISCONNECT MODAL
═══════════════════════════════════════════════════════ */
function DisconnectModal({
  dark,
  loading,
  onConfirm,
  onCancel,
}: {
  dark: boolean;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className={`w-full max-w-sm rounded-3xl border overflow-hidden
          ${dark ? "bg-[#0a1020] border-blue-900/50" : "bg-white border-blue-100"}`}
        style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.4)" }}
      >
        <div
          className="h-1 w-full"
          style={{ background: "linear-gradient(90deg,#ef4444,#f87171)" }}
        />
        <div className="p-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <Unplug size={22} className="text-red-400" />
          </div>
          <h3
            className={`text-[17px] font-black text-center mb-1 ${dark ? "text-white" : "text-slate-900"}`}
            style={{ letterSpacing: "-0.03em" }}
          >
            Disconnect Facebook?
          </h3>
          <p
            className={`text-[12px] text-center mb-5 ${dark ? "text-slate-400" : "text-slate-500"}`}
          >
            This will remove the connected Facebook Page from your workspace.
            You can reconnect at any time.
          </p>
          <div
            className={`flex items-start gap-2 p-3 rounded-xl border mb-5
              ${dark ? "bg-red-500/[0.06] border-red-500/20" : "bg-red-50 border-red-200/60"}`}
          >
            <AlertTriangle size={13} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-red-400 leading-relaxed">
              Scheduled posts and auto-replies linked to this page will be
              paused.
            </p>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={onCancel}
              disabled={loading}
              className={`flex-1 py-3 rounded-2xl text-[13px] font-bold transition-all active:scale-[0.97] border
                ${dark ? "bg-white/[0.04] border-white/[0.08] text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"}`}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-3 rounded-2xl text-[13px] font-black text-white flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg,#dc2626,#ef4444)",
                boxShadow: "0 6px 20px rgba(239,68,68,0.35)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Disconnecting…
                </>
              ) : (
                <>
                  <Unplug size={13} /> Disconnect
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
   MAIN PAGE
═══════════════════════════════════════════════════════ */
export default function FacebookPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // Prevent hydration mismatch — same pattern as PhotosPage
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";

  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: currentUser } = useUser();

  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [availablePages, setAvailablePages] = useState<FacebookPage[]>([]);
  const [showPageSelect, setShowPageSelect] = useState(false);

  /* ── Connection status query ── */
  const {
    data: statusData,
    isLoading: statusLoading,
    isError: statusError,
    refetch: refetchStatus,
    isFetching,
  } = useQuery({
    queryKey: ["facebook-status"],
    queryFn: fetchFacebookStatus,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  const isConnected = statusData?.isFacebookConnected ?? false;

  /* ── Disconnect mutation ── */
  const disconnectMut = useMutation({
    mutationFn: disconnectFacebook,
    onSuccess: () => {
      // Invalidate both status and analytics so the UI reverts to connect screen
      queryClient.invalidateQueries({ queryKey: ["facebook-status"] });
      queryClient.invalidateQueries({ queryKey: ["facebookAnalytics"] });
      setShowDisconnectModal(false);
    },
  });

  /* ── Page selection after OAuth ── */
  const handleSelectPage = useCallback(
    async (pageId: string) => {
      try {
        const { data } = await API.post(
          `${ngrokUrl}/auth/facebook/connect-page`,
          {
            selectedPageId: pageId,
          },
        );
        if (data?.success) {
          setShowPageSelect(false);
          setAvailablePages([]);
          queryClient.invalidateQueries({ queryKey: ["facebook-status"] });
        }
      } catch (err) {
        console.error("Page connection failed:", err);
      }
    },
    [queryClient],
  );

  const FACEBOOK_SCOPES = [
    "pages_show_list",
    "pages_read_engagement",
    "pages_read_user_content",
    "pages_manage_posts",
    "instagram_basic",
    "instagram_content_publishing",
    "instagram_manage_comments",
    "instagram_manage_messages",
    "pages_messaging",
  ].join(",");

  /* ── OAuth connect — mirrors mobile's direct-build pattern,
     no backend round-trip to fetch the URL ── */
  const handleConnect = useCallback(() => {
    if (!currentUser?.id) {
      console.error("Cannot start Facebook OAuth — user not loaded yet.");
      return;
    }

    const redirectUri = process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI!;
    const state = btoa(
      JSON.stringify({ userId: currentUser.id, callback: window.location.href }),
    );

    const fbUrl =
      `https://www.facebook.com/dialog/oauth` +
      `?client_id=${process.env.NEXT_PUBLIC_FACEBOOK_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(FACEBOOK_SCOPES)}` +
      `&state=${state}`;

    window.location.href = fbUrl;
  }, [currentUser]);

  /* ── Parse URL params after OAuth redirect returns ── */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const pagesParam = params.get("pages");
    const errorParam = params.get("error");

    if (status === "select_page" && pagesParam) {
      try {
        const pages = JSON.parse(decodeURIComponent(pagesParam));
        setAvailablePages(pages);
        setShowPageSelect(true);
        window.history.replaceState({}, "", window.location.pathname);
      } catch (e) {
        console.error("Failed to parse pages from URL:", e);
      }
    }
    if (status === "connected") {
      queryClient.invalidateQueries({ queryKey: ["facebook-status"] });
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (errorParam) {
      console.error("Facebook OAuth error:", errorParam);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [queryClient]);

  return (
    <div
      className={`min-h-screen transition-colors ${dark ? "bg-[#050d1a]" : "bg-[#eef4ff]"}`}
      style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}
    >
      {/* Dot grid background — same as PhotosPage */}
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
        <div className="flex items-start justify-between mb-4 gap-3">
          <div>
            {/* Status pill — same as PhotosPage "Google Business" pill */}
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9.5px] font-black uppercase tracking-widest
                  ${dark ? "bg-blue-500/10 border-blue-700/60 text-blue-400" : "bg-blue-50 border-blue-300 text-blue-600"}`}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full bg-blue-500"
                  style={{
                    animation: isConnected ? "pulse 2s infinite" : "none",
                  }}
                />
                Facebook
              </div>
            </div>
            <h1
              className={`text-[26px] font-black leading-tight ${dark ? "text-white" : "text-slate-900"}`}
              style={{ letterSpacing: "-0.04em" }}
            >
              Facebook Analytics
            </h1>
            <p
              className="text-[12px] mt-0.5"
              style={{ color: dark ? "#475569" : "rgba(59,130,246,0.8)" }}
            >
              {statusLoading
                ? "Loading…"
                : isConnected
                  ? "Connected · Live data"
                  : "Not connected"}
            </p>
          </div>

          {/* Top-right: Refresh + Disconnect */}
          {isConnected && (
            <div className="flex items-center gap-2 shrink-0">
              {/* Refresh */}
              <button
                onClick={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["facebookAnalytics"],
                  })
                }
                disabled={isFetching}
                className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all active:scale-90 border
                  ${dark ? "bg-white/[0.04] border-white/[0.06] text-slate-400" : "bg-white border-blue-100 text-slate-500 shadow-sm"}`}
              >
                <RefreshCw
                  size={14}
                  className={isFetching ? "animate-spin" : ""}
                />
              </button>

              {/* Disconnect */}
              <button
                onClick={() => setShowDisconnectModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-bold transition-all active:scale-95 whitespace-nowrap"
                style={{
                  color: "#ef4444",
                  borderColor: dark
                    ? "rgba(239,68,68,0.2)"
                    : "rgba(239,68,68,0.15)",
                  background: dark
                    ? "rgba(239,68,68,0.05)"
                    : "rgba(239,68,68,0.04)",
                }}
              >
                <Unplug size={12} /> Disconnect
              </button>
            </div>
          )}
        </div>

        {/* ── NAVIGATION TABS: Posts / Comments / Messages ── */}
        {isConnected && (
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
            {[
              {
                label: "Posts",
                icon: <FileText size={14} />,
                route: "/facebook/posts",
              },
              {
                label: "Comments",
                icon: <MessageCircle size={14} />,
                route: "/facebook/comments",
              },
              {
                label: "Messages",
                icon: <Mail size={14} />,
                route: "/facebook/messages",
              },
            ].map((n) => (
              <button
                key={n.label}
                onClick={() => router.push(n.route)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-[12px] font-bold transition-all active:scale-95 hover:border-blue-400/40 whitespace-nowrap
                  ${dark ? "bg-white/[0.04] border-white/[0.06] text-slate-400" : "bg-white border-blue-100 text-slate-600 shadow-sm"}`}
              >
                {n.icon} {n.label}
              </button>
            ))}
          </div>
        )}

        {/* ── CONTENT ── */}
        {statusLoading ? (
          <PageSkeleton dark={dark} />
        ) : statusError ? (
          <div
            className={`rounded-2xl border p-8 text-center
              ${dark ? "bg-red-500/[0.06] border-red-500/20" : "bg-red-50 border-red-200/60"}`}
          >
            <AlertTriangle size={28} className="text-red-400 mx-auto mb-3" />
            <p
              className={`text-[14px] font-bold mb-1 ${dark ? "text-white" : "text-slate-900"}`}
            >
              Unable to check connection status
            </p>
            <p className="text-[11px] text-red-400 mb-4">
              Could not reach the server. Please try again.
            </p>
            <button
              onClick={() => refetchStatus()}
              className="text-[12px] font-bold text-blue-400 flex items-center gap-1.5 mx-auto"
            >
              <RefreshCw size={12} /> Try Again
            </button>
          </div>
        ) : showPageSelect ? (
          <PageSelectView
            pages={availablePages}
            dark={dark}
            onSelect={handleSelectPage}
            onCancel={() => {
              setShowPageSelect(false);
              setAvailablePages([]);
            }}
          />
        ) : !isConnected ? (
          <NotConnectedView dark={dark} onConnect={handleConnect} />
        ) : (
          // Connected — render the full analytics section (same query key as mobile)
          <FacebookAnalyticsSection
            dark={dark}
            isFetching={isFetching}
            onRefresh={() =>
              queryClient.invalidateQueries({ queryKey: ["facebookAnalytics"] })
            }
          />
        )}
      </div>

      {/* ── DISCONNECT MODAL ── */}
      {showDisconnectModal && (
        <DisconnectModal
          dark={dark}
          loading={disconnectMut.isPending}
          onCancel={() => setShowDisconnectModal(false)}
          onConfirm={() => disconnectMut.mutate()}
        />
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
