"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  MessageCircle,
  Mail,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Users,
  Heart,
  Image as ImageIcon,
  Globe,
  Link as LinkIcon,
  ExternalLink,
} from "lucide-react";
import { API } from "@/lib/axiosClient";
import Image from "next/image";

/* ═══════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════ */
interface IgAccount {
  id: string;
  username: string;
  name: string;
  profilePictureUrl: string | null;
  biography: string;
  website: string | null;
  followersCount: number;
  followsCount: number;
  mediaCount: number;
}

/* ═══════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════ */
const IG_GRADIENT =
  "linear-gradient(135deg, #833ab4 0%, #C13584 45%, #fd1d1d 80%, #fcb045 100%)";
const IG_ACCENT = "#C13584";

/* ═══════════════════════════════════════════════════════
   API
═══════════════════════════════════════════════════════ */
async function fetchIgAccount(): Promise<{
  success: boolean;
  data: IgAccount;
}> {
  const res = await API.get("/instagram/account");
  if (!res.data.success)
    throw new Error(res.data.message ?? "Failed to fetch Instagram account");
  return res.data;
}

/* ═══════════════════════════════════════════════════════
   SKELETON
═══════════════════════════════════════════════════════ */
function PageSkeleton({ dark }: { dark: boolean }) {
  const shimmer = dark ? "bg-white/[0.05]" : "bg-pink-100/50";
  return (
    <div className="space-y-4">
      <div className={`h-40 rounded-3xl animate-pulse ${shimmer}`} />
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-24 rounded-2xl animate-pulse ${shimmer}`}
          />
        ))}
      </div>
      <div className={`h-20 rounded-2xl animate-pulse ${shimmer}`} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STAT CARD
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
      className={`p-4 rounded-2xl border relative overflow-hidden transition-colors
        ${dark ? "bg-[#130820] border-pink-900/30" : "bg-white border-pink-100/80 shadow-sm"}`}
    >
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
      <p
        className="text-[22px] font-black leading-none mt-1 mb-5"
        style={{ color, letterSpacing: "-0.03em" }}
      >
        {value}
      </p>
      <p
        className="text-[9px] font-black uppercase tracking-widest"
        style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}
      >
        {label}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PROFILE HEADER
═══════════════════════════════════════════════════════ */
function ProfileHeader({
  account,
  dark,
}: {
  account: IgAccount;
  dark: boolean;
}) {
  return (
    <div
      className="rounded-3xl overflow-hidden border border-pink-500/30 mb-2"
      style={{ background: IG_GRADIENT }}
    >
      {/* Top section with avatar + name */}
      <div className="flex items-center gap-4 p-3 sm:p-5 pb-4">
        {account.profilePictureUrl ? (
          <div className="relative shrink-0">
            <div
              className="absolute -inset-1 rounded-full"
              style={{ background: "rgba(255,255,255,0.3)" }}
            />
            <Image
              src={account.profilePictureUrl}
              alt={account.username}
              width={72}
              height={72}
              priority
              className="w-[72px] h-[72px] rounded-full object-cover relative"
            />
          </div>
        ) : (
          <div
            className="w-[72px] h-[72px] rounded-full flex items-center justify-center shrink-0 text-white text-2xl font-black"
            style={{ background: "rgba(255,255,255,0.25)" }}
          >
            {account.username.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-white text-[15px] sm:text-[20px] font-black leading-tight truncate">
            @{account.username}
          </p>
          {account.name && account.name !== account.username && (
            <p className="text-white/70 text-[12px] font-medium mt-0.5 truncate">
              {account.name}
            </p>
          )}
          {account.biography && (
            <p className="text-white/75 text-xs sm:text-[11px] leading-relaxed mt-1.5 line-clamp-2">
              {account.biography}
            </p>
          )}
          {account.website && (
            <a
              href={account.website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 mt-1.5 text-white/80 text-[11px] hover:text-white transition-colors"
            >
              <ExternalLink size={9} />
              {account.website.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div
        className="grid grid-cols-3 divide-x"
        style={{
          background: "rgba(0,0,0,0.18)",
          borderColor: "rgba(255,255,255,0.1)",
        }}
      >
        {[
          { label: "Posts", value: account.mediaCount.toLocaleString() },
          {
            label: "Followers",
            value: account.followersCount.toLocaleString(),
          },
          { label: "Following", value: account.followsCount.toLocaleString() },
        ].map((s) => (
          <div
            key={s.label}
            className="py-3 text-center"
            style={{ borderColor: "rgba(255,255,255,0.15)" }}
          >
            <p className="text-white text-[16px] sm:text-[18px] font-black leading-none">
              {s.value}
            </p>
            <p className="text-white/55 text-[9px] font-black uppercase tracking-widest mt-0.5">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   NOT CONNECTED VIEW
═══════════════════════════════════════════════════════ */
function NotConnectedView({ dark }: { dark: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div
        className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6"
        style={{
          background: IG_GRADIENT,
          boxShadow: "0 12px 40px rgba(193,53,132,0.35)",
        }}
      >
        <ImageIcon size={36} className="text-white" />
      </div>
      <h3
        className={`text-[24px] font-black mb-2 ${dark ? "text-white" : "text-slate-900"}`}
        style={{ letterSpacing: "-0.04em" }}
      >
        Instagram Insights
      </h3>
      <p
        className="text-[13px] mb-8 max-w-[280px] leading-relaxed"
        style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}
      >
        Connect your Facebook Page (linked to an Instagram Business or Creator
        account) to view your Instagram analytics here.
      </p>
      <p className="text-[12px] font-medium" style={{ color: IG_ACCENT }}>
        Go to Facebook → Connect your Page first
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════ */
export default function InstagramPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";

  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["ig-account"],
    queryFn: fetchIgAccount,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const account = data?.data ?? null;

  const bgDark = "#0d0814";
  const bgLight = "#fdf0ff";

  return (
    <div
      className={`min-h-screen transition-colors`}
      style={{
        backgroundColor: dark ? bgDark : bgLight,
        fontFamily: "-apple-system,'SF Pro Text',sans-serif",
      }}
    >
      {/* Dot grid */}
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
        <div className="flex items-start justify-between mb-4 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9.5px] font-black uppercase tracking-widest"
                style={
                  dark
                    ? {
                        background: "rgba(193,53,132,0.1)",
                        borderColor: "rgba(193,53,132,0.4)",
                        color: "#e879b8",
                      }
                    : {
                        background: "rgba(193,53,132,0.06)",
                        borderColor: "rgba(193,53,132,0.25)",
                        color: "#C13584",
                      }
                }
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: IG_ACCENT,
                    animation: account ? "pulse 2s infinite" : "none",
                  }}
                />
                Instagram
              </div>
            </div>
            <h1
              className={`text-[26px] font-black leading-tight ${dark ? "text-white" : "text-slate-900"}`}
              style={{ letterSpacing: "-0.04em" }}
            >
              Instagram Analytics
            </h1>
            <p
              className="text-[12px] mt-0.5"
              style={{ color: dark ? "#6b4f7a" : "rgba(193,53,132,0.7)" }}
            >
              {isLoading
                ? "Loading…"
                : account
                  ? `@${account.username} · Live data`
                  : "Not connected"}
            </p>
          </div>

          {/* Refresh button */}
          {account && (
            <button
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ["ig-account"] })
              }
              disabled={isFetching}
              className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all active:scale-90 border shrink-0
                ${dark ? "bg-white/[0.04] border-white/[0.06] text-slate-400" : "bg-white border-pink-100 text-slate-500 shadow-sm"}`}
            >
              <RefreshCw
                size={14}
                className={isFetching ? "animate-spin" : ""}
              />
            </button>
          )}
        </div>

        {/* ── NAVIGATION TABS ── */}
        {account && (
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar">
            {[
              {
                label: "Posts",
                icon: <FileText size={14} />,
                route: "/instagram/posts",
              },
              {
                label: "Comments",
                icon: <MessageCircle size={14} />,
                route: "/instagram/comments",
              },
              {
                label: "Messages",
                icon: <Mail size={14} />,
                route: "/instagram/messages",
              },
            ].map((n) => (
              <button
                key={n.label}
                onClick={() => router.push(n.route)}
                className={`flex items-center gap-1.5 px-2 py-2 sm:px-4 sm:py-2.5 rounded-xl border text-[12px] font-bold transition-all active:scale-95 whitespace-nowrap
                  ${dark ? "bg-white/[0.04] border-white/[0.06] text-slate-400 hover:border-pink-700/40" : "bg-white border-pink-100 text-slate-600 shadow-sm hover:border-pink-300/60"}`}
              >
                {n.icon} {n.label}
              </button>
            ))}
          </div>
        )}

        {/* ── CONTENT ── */}
        {isLoading ? (
          <PageSkeleton dark={dark} />
        ) : isError ? (
          (() => {
            const msg = (error as Error)?.message || "";
            const isNotLinked =
              msg.toLowerCase().includes("no instagram") ||
              msg.toLowerCase().includes("not linked") ||
              msg.toLowerCase().includes("not active");
            return isNotLinked ? (
              <NotConnectedView dark={dark} />
            ) : (
              <div
                className={`rounded-2xl border p-8 text-center
                  ${dark ? "bg-red-500/[0.06] border-red-500/20" : "bg-red-50 border-red-200/60"}`}
              >
                <AlertTriangle
                  size={28}
                  className="text-red-400 mx-auto mb-3"
                />
                <p
                  className={`text-[14px] font-bold mb-1 ${dark ? "text-white" : "text-slate-900"}`}
                >
                  Failed to load Instagram account
                </p>
                <p className="text-[11px] text-red-400 mb-4">{msg}</p>
                <button
                  onClick={() => refetch()}
                  className="text-[12px] font-bold text-pink-400 flex items-center gap-1.5 mx-auto"
                >
                  <RefreshCw size={12} /> Try Again
                </button>
              </div>
            );
          })()
        ) : !account ? (
          <NotConnectedView dark={dark} />
        ) : (
          <div className="space-y-5">
            {/* Profile header */}
            <ProfileHeader account={account} dark={dark} />

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard
                label="Followers"
                value={account.followersCount.toLocaleString()}
                icon={<Users size={15} />}
                color="#C13584"
                dark={dark}
              />
              <StatCard
                label="Following"
                value={account.followsCount.toLocaleString()}
                icon={<Heart size={15} />}
                color="#833ab4"
                dark={dark}
              />
              <StatCard
                label="Total Posts"
                value={account.mediaCount.toLocaleString()}
                icon={<ImageIcon size={15} />}
                color="#fd1d1d"
                dark={dark}
              />
            </div>

            {/* Quick links to subpages */}
            <div
              className={`rounded-2xl border p-4 ${dark ? "bg-[#130820] border-pink-900/30" : "bg-white border-pink-100/80 shadow-sm"}`}
            >
              <p
                className="text-[10px] font-black uppercase tracking-widest mb-3"
                style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}
              >
                Quick Actions
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    label: "View Posts",
                    route: "/instagram/posts",
                    icon: <FileText size={18} />,
                    color: "#fd1d1d",
                  },
                  {
                    label: "Comments",
                    route: "/instagram/comments",
                    icon: <MessageCircle size={18} />,
                    color: "#833ab4",
                  },
                  {
                    label: "Messages",
                    route: "/instagram/messages",
                    icon: <Mail size={18} />,
                    color: "#C13584",
                  },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => router.push(item.route)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-[10px] sm:text-[11px] font-bold transition-all active:scale-95
                      ${dark ? "bg-white/[0.03] border-pink-900/20 text-slate-400 hover:bg-white/[0.07]" : "bg-pink-50/50 border-pink-100 text-slate-600 hover:bg-pink-50"}`}
                  >
                    <span style={{ color: item.color }}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .no-scrollbar::-webkit-scrollbar { display:none }
        .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none }
      `}</style>
    </div>
  );
}
