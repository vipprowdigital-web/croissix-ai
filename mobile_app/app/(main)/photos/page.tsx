// mobile_app\app\(main)\photos\page.tsx

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import {
  Camera,
  Plus,
  Trash2,
  Eye,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Image as ImgIcon,
  Star,
  Users,
  Package,
  MapPin,
  Video,
  LayoutGrid,
  List,
  Filter,
  SortAsc,
  RefreshCw,
  Brain,
  Sparkles,
  AlertTriangle,
  Check,
  Loader2,
  ZoomIn,
  Share2,
  MoreVertical,
  TrendingUp,
  BarChart2,
  Clock,
  ArrowUpRight,
  Shield,
  Lock,
  Zap,
} from "lucide-react";

/* ════════════════════════════════════════════════════════
   TYPES
════════════════════════════════════════════════════════ */
type MediaFormat = "PHOTO" | "VIDEO";
type MediaCategory =
  | "COVER"
  | "LOGO"
  | "EXTERIOR"
  | "INTERIOR"
  | "PRODUCT"
  | "AT_WORK"
  | "FOOD_AND_DRINK"
  | "MENU"
  | "COMMON_AREA"
  | "ROOMS"
  | "TEAMS"
  | "ADDITIONAL";

interface GBPMedia {
  name: string; // e.g. accounts/{id}/locations/{id}/media/{id}
  mediaFormat: MediaFormat;
  locationAssociation?: { category: MediaCategory };
  googleUrl?: string;
  thumbnailUrl?: string;
  createTime: string;
  dimensions?: { widthPixels: number; heightPixels: number };
  viewCount?: number;
  description?: string;
  // derived
  id: string;
}

interface MediaResponse {
  mediaItems: GBPMedia[];
  totalMediaItemCount: number;
  nextPageToken?: string;
}

/* ════════════════════════════════════════════════════════
   CATEGORY CONFIG
════════════════════════════════════════════════════════ */
const CAT_CFG: Record<
  MediaCategory,
  { label: string; icon: React.ReactNode; color: string; tip: string }
> = {
  COVER: {
    label: "Cover",
    icon: <Star size={11} />,
    color: "#3b82f6",
    tip: "Banner shown at top of your profile",
  },
  LOGO: {
    label: "Logo",
    icon: <Shield size={11} />,
    color: "#6366f1",
    tip: "Square logo for Knowledge Panel",
  },
  EXTERIOR: {
    label: "Exterior",
    icon: <MapPin size={11} />,
    color: "#0ea5e9",
    tip: "Outside your building",
  },
  INTERIOR: {
    label: "Interior",
    icon: <LayoutGrid size={11} />,
    color: "#8b5cf6",
    tip: "Inside your business",
  },
  PRODUCT: {
    label: "Product",
    icon: <Package size={11} />,
    color: "#06b6d4",
    tip: "Products you sell",
  },
  AT_WORK: {
    label: "At Work",
    icon: <Users size={11} />,
    color: "#10b981",
    tip: "Your team in action",
  },
  FOOD_AND_DRINK: {
    label: "Food",
    icon: <Star size={11} />,
    color: "#f59e0b",
    tip: "Food and drinks",
  },
  MENU: {
    label: "Menu",
    icon: <List size={11} />,
    color: "#ef4444",
    tip: "Menu items",
  },
  COMMON_AREA: {
    label: "Common",
    icon: <LayoutGrid size={11} />,
    color: "#14b8a6",
    tip: "Common areas",
  },
  ROOMS: {
    label: "Rooms",
    icon: <ImgIcon size={11} />,
    color: "#a855f7",
    tip: "Rooms",
  },
  TEAMS: {
    label: "Teams",
    icon: <Users size={11} />,
    color: "#f97316",
    tip: "Your team",
  },
  ADDITIONAL: {
    label: "Other",
    icon: <Camera size={11} />,
    color: "#64748b",
    tip: "Other photos",
  },
};

/* ════════════════════════════════════════════════════════
   MOCK DATA (replace with real API call)
════════════════════════════════════════════════════════ */
const MOCK: GBPMedia[] = [
  ...Array.from({ length: 18 }, (_, i) => {
    const cats: MediaCategory[] = [
      "COVER",
      "LOGO",
      "EXTERIOR",
      "INTERIOR",
      "PRODUCT",
      "AT_WORK",
      "EXTERIOR",
      "PRODUCT",
      "INTERIOR",
      "PRODUCT",
      "AT_WORK",
      "EXTERIOR",
      "PRODUCT",
      "INTERIOR",
      "PRODUCT",
      "ADDITIONAL",
      "EXTERIOR",
      "INTERIOR",
    ];
    const dims = [
      [1920, 1080],
      [800, 800],
      [1280, 960],
      [1080, 1080],
      [720, 720],
      [1920, 1080],
      [1280, 720],
      [800, 600],
      [1080, 1080],
      [900, 675],
      [1200, 900],
      [1280, 960],
      [1080, 1080],
      [720, 720],
      [1920, 1080],
      [1280, 720],
      [800, 600],
      [1080, 1080],
    ];
    const cat = cats[i] as MediaCategory;
    return {
      id: `media_${i + 1}`,
      name: `accounts/123/locations/456/media/media_${i + 1}`,
      mediaFormat: "PHOTO" as MediaFormat,
      locationAssociation: { category: cat },
      googleUrl: `https://picsum.photos/seed/${i + 10}/800/600`,
      thumbnailUrl: `https://picsum.photos/seed/${i + 10}/400/300`,
      createTime: new Date(
        Date.now() - i * 7 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      dimensions: { widthPixels: dims[i][0], heightPixels: dims[i][1] },
      viewCount: Math.floor(Math.random() * 800 + 50),
      description:
        i % 3 === 0
          ? "Our beautiful store interior showcasing premium products"
          : undefined,
    };
  }),
];

/* ════════════════════════════════════════════════════════
   API
════════════════════════════════════════════════════════ */
async function fetchMedia(): Promise<MediaResponse> {
  const res = await fetch("/api/google/media/list");
  if (!res.ok) throw new Error("Failed to fetch media");
  return res.json();
  // await new Promise((r) => setTimeout(r, 900));
  // return { mediaItems: MOCK, totalMediaItemCount: MOCK.length };
}

async function deleteMedia(mediaName: string): Promise<void> {
  // const res = await fetch("/api/google/media/delete", { method: "POST", body: JSON.stringify({ mediaName }) });
  // if (!res.ok) throw new Error("Delete failed");
  await new Promise((r) => setTimeout(r, 700));
}

/* ════════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════════ */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

/* ════════════════════════════════════════════════════════
   DELETE MODAL
════════════════════════════════════════════════════════ */
function DeleteModal({
  photo,
  dark,
  onConfirm,
  onCancel,
  loading,
}: {
  photo: GBPMedia;
  dark: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const cat = photo.locationAssociation?.category
    ? CAT_CFG[photo.locationAssociation.category]
    : null;

  return (
    <div
      className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
    >
      <div
        className={`w-full max-w-sm rounded-3xl border overflow-hidden
        ${dark ? "bg-[#0a1020] border-blue-900/50" : "bg-white border-blue-100"}`}
        style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.4)" }}
      >
        {/* header stripe */}
        <div
          className="h-1 w-full"
          style={{ background: "linear-gradient(90deg,#ef4444,#f87171)" }}
        />

        <div className="p-5">
          {/* icon */}
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
            className={`text-[17px] font-black text-center mb-1 ${dark ? "text-white" : "text-slate-900"}`}
            style={{ letterSpacing: "-0.03em" }}
          >
            Delete Photo?
          </h3>
          <p
            className={`text-[12px] text-center mb-4 ${dark ? "text-slate-400" : "text-slate-500"}`}
          >
            This will permanently remove the photo from your Google Business
            Profile. This action cannot be undone.
          </p>

          {/* photo preview */}
          <div
            className={`flex items-center gap-3 p-3 rounded-2xl border mb-5
            ${dark ? "bg-white/[0.03] border-white/[0.06]" : "bg-slate-50 border-slate-100"}`}
          >
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-blue-900/20">
              {photo.thumbnailUrl && (
                <img
                  src={photo.thumbnailUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="min-w-0">
              {cat && (
                <span
                  className="inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-full mb-1"
                  style={{
                    background: `${cat.color}15`,
                    color: cat.color,
                    border: `1px solid ${cat.color}30`,
                  }}
                >
                  {cat.icon} {cat.label}
                </span>
              )}
              <p
                className={`text-[11px] font-medium truncate ${dark ? "text-slate-400" : "text-slate-600"}`}
              >
                {photo.dimensions
                  ? `${photo.dimensions.widthPixels} × ${photo.dimensions.heightPixels}px`
                  : "Photo"}
              </p>
              <p
                className={`text-[10px] ${dark ? "text-slate-600" : "text-slate-400"}`}
              >
                {timeAgo(photo.createTime)} ·{" "}
                {photo.viewCount?.toLocaleString()} views
              </p>
            </div>
          </div>

          {/* warning */}
          <div
            className={`flex items-start gap-2 p-3 rounded-xl border mb-5
            ${dark ? "bg-red-500/[0.06] border-red-500/20" : "bg-red-50 border-red-200/60"}`}
          >
            <AlertTriangle size={13} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-red-400 leading-relaxed">
              Google may take up to 24 hours to reflect this change across all
              surfaces.
            </p>
          </div>

          {/* actions */}
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
                  <Loader2
                    size={13}
                    style={{ animation: "spin .6s linear infinite" }}
                  />{" "}
                  Deleting…
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
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   LIGHTBOX / PREVIEW
════════════════════════════════════════════════════════ */
function Lightbox({
  photos,
  index,
  dark,
  onClose,
  onDelete,
}: {
  photos: GBPMedia[];
  index: number;
  dark: boolean;
  onClose: () => void;
  onDelete: (p: GBPMedia) => void;
}) {
  const [cur, setCur] = useState(index);
  const photo = photos[cur];
  const cat = photo?.locationAssociation?.category
    ? CAT_CFG[photo.locationAssociation.category]
    : null;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight")
        setCur((c) => Math.min(c + 1, photos.length - 1));
      if (e.key === "ArrowLeft") setCur((c) => Math.max(c - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photos.length, onClose]);

  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-[500] flex flex-col"
      style={{ background: "rgba(3,7,18,0.95)", backdropFilter: "blur(20px)" }}
    >
      {/* top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <div className="flex items-center gap-2.5">
          {cat && (
            <span
              className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{
                background: `${cat.color}20`,
                color: cat.color,
                border: `1px solid ${cat.color}30`,
              }}
            >
              {cat.icon} {cat.label}
            </span>
          )}
          <span className="text-[11px] font-medium text-slate-500">
            {cur + 1} / {photos.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {photo.googleUrl && (
            <a
              href={photo.googleUrl}
              target="_blank"
              rel="noopener"
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
              style={{
                background: "rgba(59,130,246,0.12)",
                border: "1px solid rgba(59,130,246,0.2)",
              }}
            >
              <Download size={14} className="text-blue-400" />
            </a>
          )}
          <button
            onClick={() => onDelete(photo)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <Trash2 size={14} className="text-red-400" />
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <X size={15} className="text-white" />
          </button>
        </div>
      </div>

      {/* image area */}
      <div className="flex-1 flex items-center justify-center relative px-12 min-h-0">
        {/* prev */}
        {cur > 0 && (
          <button
            onClick={() => setCur((c) => c - 1)}
            className="absolute left-2 w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90 z-10"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <ChevronLeft size={18} className="text-white" />
          </button>
        )}

        <div className="w-full h-full flex items-center justify-center">
          <img
            src={photo.googleUrl || photo.thumbnailUrl}
            alt=""
            className="max-w-full max-h-full object-contain rounded-2xl"
            style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}
          />
        </div>

        {/* next */}
        {cur < photos.length - 1 && (
          <button
            onClick={() => setCur((c) => c + 1)}
            className="absolute right-2 w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90 z-10"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <ChevronRight size={18} className="text-white" />
          </button>
        )}
      </div>

      {/* bottom info */}
      <div className="shrink-0 px-4 py-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          {photo.description && (
            <p className="text-[12px] text-slate-300 truncate mb-0.5">
              {photo.description}
            </p>
          )}
          <div className="flex items-center gap-3">
            {photo.dimensions && (
              <span className="text-[10px] text-slate-500 font-mono">
                {photo.dimensions.widthPixels}×{photo.dimensions.heightPixels}
              </span>
            )}
            <span className="text-[10px] text-slate-500">
              {timeAgo(photo.createTime)}
            </span>
            {photo.viewCount != null && (
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Eye size={9} /> {photo.viewCount.toLocaleString()} views
              </span>
            )}
          </div>
        </div>

        {/* thumbnail strip */}
        <div className="flex gap-1.5 shrink-0">
          {photos.slice(Math.max(0, cur - 2), cur + 3).map((p, i) => {
            const realIdx = Math.max(0, cur - 2) + i;
            return (
              <button
                key={p.id}
                onClick={() => setCur(realIdx)}
                className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all ${
                  realIdx === cur
                    ? "border-blue-500"
                    : "border-transparent opacity-50"
                }`}
              >
                <img
                  src={p.thumbnailUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   PHOTO CARD
════════════════════════════════════════════════════════ */
function PhotoCard({
  photo,
  dark,
  onPreview,
  onDelete,
  view,
}: {
  photo: GBPMedia;
  dark: boolean;
  onPreview: () => void;
  onDelete: () => void;
  view: "grid" | "list";
}) {
  const [hover, setHover] = useState(false);
  const cat = photo.locationAssociation?.category
    ? CAT_CFG[photo.locationAssociation.category]
    : null;

  if (view === "list") {
    return (
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all
        ${
          dark
            ? "bg-[#0a1020] border-blue-900/30 hover:border-blue-700/40"
            : "bg-white border-blue-100/80 hover:border-blue-200"
        }`}
        style={{ boxShadow: dark ? "none" : "0 2px 8px rgba(59,130,246,0.04)" }}
      >
        {/* thumb */}
        <div
          className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-blue-900/20 cursor-pointer"
          onClick={onPreview}
        >
          {photo.thumbnailUrl ? (
            <img
              src={photo.thumbnailUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImgIcon size={18} className="text-blue-400/40" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {cat && (
              <span
                className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                style={{ background: `${cat.color}15`, color: cat.color }}
              >
                {cat.icon} {cat.label}
              </span>
            )}
            {photo.mediaFormat === "VIDEO" && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-purple-500/15 text-purple-400">
                VIDEO
              </span>
            )}
          </div>
          <p
            className={`text-[11px] font-medium truncate ${dark ? "text-slate-300" : "text-slate-700"}`}
          >
            {photo.dimensions
              ? `${photo.dimensions.widthPixels} × ${photo.dimensions.heightPixels}px`
              : photo.mediaFormat}
          </p>
          <div className="flex items-center gap-2.5 mt-0.5">
            <span
              className={`text-[10px] ${dark ? "text-slate-600" : "text-slate-400"}`}
            >
              {timeAgo(photo.createTime)}
            </span>
            {photo.viewCount != null && (
              <span
                className={`text-[10px] flex items-center gap-0.5 ${dark ? "text-slate-600" : "text-slate-400"}`}
              >
                <Eye size={8} /> {photo.viewCount.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onPreview}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90
              ${dark ? "bg-white/[0.04] hover:bg-blue-500/15" : "bg-slate-50 hover:bg-blue-50"}`}
          >
            <ZoomIn size={13} className="text-blue-400" />
          </button>
          <button
            onClick={onDelete}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90
              ${dark ? "bg-white/[0.04] hover:bg-red-500/15" : "bg-slate-50 hover:bg-red-50"}`}
          >
            <Trash2 size={13} className="text-red-400" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer group
      ${dark ? "border-blue-900/30" : "border-blue-100/60"}`}
      style={{
        aspectRatio: "1",
        boxShadow: hover
          ? dark
            ? "0 8px 32px rgba(37,99,235,0.25)"
            : "0 8px 24px rgba(37,99,235,0.15)"
          : "none",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onPreview}
    >
      {/* image */}
      <div className="w-full h-full bg-blue-900/10">
        {photo.thumbnailUrl ? (
          <img
            src={photo.thumbnailUrl}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500"
            style={{ transform: hover ? "scale(1.06)" : "scale(1)" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImgIcon size={28} className="text-blue-400/30" />
          </div>
        )}
      </div>

      {/* hover overlay */}
      <div
        className="absolute inset-0 transition-opacity duration-200"
        style={{
          opacity: hover ? 1 : 0,
          background:
            "linear-gradient(to top, rgba(3,7,18,0.85) 0%, rgba(3,7,18,0.2) 50%, transparent 100%)",
        }}
      />

      {/* top: category badge */}
      {cat && (
        <div className="absolute top-2 left-2">
          <span
            className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full"
            style={{
              background: `${cat.color}90`,
              color: "#fff",
              backdropFilter: "blur(8px)",
              border: `1px solid ${cat.color}50`,
            }}
          >
            {cat.icon} {cat.label}
          </span>
        </div>
      )}

      {/* top-right: delete */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-2 right-2 w-7 h-7 rounded-xl flex items-center justify-center transition-all active:scale-90"
        style={{
          opacity: hover ? 1 : 0,
          background: "rgba(239,68,68,0.75)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(239,68,68,0.4)",
        }}
      >
        <Trash2 size={11} className="text-white" />
      </button>

      {/* bottom info */}
      <div
        className="absolute bottom-0 left-0 right-0 px-2.5 pb-2.5 pt-6 transition-opacity duration-200"
        style={{ opacity: hover ? 1 : 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {photo.viewCount != null && (
              <span className="text-[9.5px] font-medium text-white/80 flex items-center gap-0.5">
                <Eye size={8} /> {photo.viewCount.toLocaleString()}
              </span>
            )}
          </div>
          <span className="text-[9px] text-white/60">
            {timeAgo(photo.createTime)}
          </span>
        </div>
      </div>

      {/* video badge */}
      {photo.mediaFormat === "VIDEO" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(4px)",
            }}
          >
            <Video size={16} className="text-white ml-0.5" />
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   STATS STRIP
════════════════════════════════════════════════════════ */
function StatsStrip({ items, dark }: { items: GBPMedia[]; dark: boolean }) {
  const totalViews = items.reduce((a, i) => a + (i.viewCount ?? 0), 0);
  const totalPhotos = items.filter((i) => i.mediaFormat === "PHOTO").length;
  const totalVideos = items.filter((i) => i.mediaFormat === "VIDEO").length;
  const categories = new Set(items.map((i) => i.locationAssociation?.category))
    .size;
  const hasCover = items.some(
    (i) => i.locationAssociation?.category === "COVER",
  );
  const hasLogo = items.some((i) => i.locationAssociation?.category === "LOGO");

  const stats = [
    {
      label: "Photos",
      value: totalPhotos,
      icon: <Camera size={12} />,
      color: "#3b82f6",
    },
    {
      label: "Videos",
      value: totalVideos,
      icon: <Video size={12} />,
      color: "#8b5cf6",
    },
    {
      label: "Total Views",
      value: totalViews.toLocaleString(),
      icon: <Eye size={12} />,
      color: "#06b6d4",
    },
    {
      label: "Categories",
      value: categories,
      icon: <LayoutGrid size={12} />,
      color: "#10b981",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 mb-4">
      {stats.map((s, i) => (
        <div
          key={i}
          className={`rounded-2xl px-3 py-2.5 border text-center
          ${dark ? "bg-[#0a1020] border-blue-900/30" : "bg-white border-blue-100/80 shadow-sm"}`}
        >
          <div
            className="flex items-center justify-center mb-1"
            style={{ color: s.color }}
          >
            {s.icon}
          </div>
          <p
            className="text-[13px] font-black leading-none"
            style={{
              color: s.color,
              fontFamily: "-apple-system,'SF Pro Display',sans-serif",
            }}
          >
            {s.value}
          </p>
          <p
            className={`text-[8.5px] font-semibold mt-0.5 ${dark ? "text-slate-600" : "text-slate-400"}`}
          >
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   SKELETON
════════════════════════════════════════════════════════ */
function GridSkeleton({ dark }: { dark: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className={`rounded-2xl animate-pulse ${dark ? "bg-white/[0.05]" : "bg-blue-100/50"}`}
          style={{ aspectRatio: "1" }}
        />
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   EMPTY STATE
════════════════════════════════════════════════════════ */
function EmptyState({ dark, onAdd }: { dark: boolean; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div
        className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-5
        ${dark ? "bg-blue-500/10" : "bg-blue-50"}`}
        style={{ border: "1px solid rgba(59,130,246,0.2)" }}
      >
        <Camera size={32} className="text-blue-400" />
      </div>
      <h3
        className={`text-[17px] font-black mb-2 ${dark ? "text-white" : "text-slate-900"}`}
        style={{ letterSpacing: "-0.03em" }}
      >
        No Photos Yet
      </h3>
      <p
        className={`text-[12px] mb-6 max-w-[220px] leading-relaxed ${dark ? "text-slate-500" : "text-slate-400"}`}
      >
        Add photos to your Google Business Profile to attract more customers.
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-5 py-3 rounded-2xl text-[13px] font-black text-white"
        style={{
          background: "linear-gradient(135deg,#1e40af,#3b82f6)",
          boxShadow: "0 8px 24px rgba(59,130,246,0.35)",
        }}
      >
        <Plus size={15} /> Add First Photo
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   AI INSIGHT BANNER
════════════════════════════════════════════════════════ */
function AIBanner({ items, dark }: { items: GBPMedia[]; dark: boolean }) {
  const hasCover = items.some(
    (i) => i.locationAssociation?.category === "COVER",
  );
  const interiors = items.filter(
    (i) => i.locationAssociation?.category === "INTERIOR",
  ).length;
  const products = items.filter(
    (i) => i.locationAssociation?.category === "PRODUCT",
  ).length;

  const tips = [
    !hasCover && {
      msg: "No cover photo detected — this is the most-viewed element of your profile. Add one to increase clicks by 42%.",
      icon: <Star size={11} />,
    },
    interiors < 3 && {
      msg: `You have ${interiors} interior photo${interiors === 1 ? "" : "s"}. Businesses with 5+ interiors see 29% more walk-ins.`,
      icon: <ImgIcon size={11} />,
    },
    products < 5 && {
      msg: `Only ${products} product photo${products === 1 ? "" : "s"} — add at least 10 to unlock 94% more profile views.`,
      icon: <Package size={11} />,
    },
  ].filter(Boolean) as { msg: string; icon: React.ReactNode }[];

  if (!tips.length) return null;

  return (
    <div
      className={`rounded-2xl border px-4 py-3 mb-4 flex items-start gap-3
      ${dark ? "bg-[#080f1e] border-blue-900/40" : "bg-blue-50/80 border-blue-200/60"}`}
    >
      <div
        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5
        ${dark ? "bg-blue-500/15" : "bg-blue-100"}`}
      >
        <Brain size={13} style={{ color: "#60a5fa" }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <Sparkles size={9} className="text-blue-400" />
          <span
            className={`text-[9.5px] font-black uppercase tracking-widest ${dark ? "text-blue-400" : "text-blue-600"}`}
          >
            AI Insight
          </span>
        </div>
        <p
          className={`text-[11.5px] leading-relaxed ${dark ? "text-blue-200/70" : "text-blue-800"}`}
        >
          {tips[0].msg}
        </p>
        {tips.length > 1 && (
          <p
            className={`text-[10px] mt-1 ${dark ? "text-blue-400/50" : "text-blue-500/70"}`}
          >
            +{tips.length - 1} more insight{tips.length > 2 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   AI ADD PHOTO BUTTON (full-width, animated)
════════════════════════════════════════════════════════ */
function AIAddPhotoButton({
  dark,
  onClick,
}: {
  dark: boolean;
  onClick: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const [tick, setTick] = useState(0);
  const [sparkle, setSparkle] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 100), 40);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setSparkle(true);
      setTimeout(() => setSparkle(false), 500);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  const dots = [
    { left: "8%", top: "30%", delay: "0s", r: 2 },
    { left: "18%", top: "65%", delay: "0.7s", r: 1.5 },
    { left: "75%", top: "25%", delay: "0.35s", r: 2 },
    { left: "88%", top: "60%", delay: "1.1s", r: 1.5 },
    { left: "50%", top: "20%", delay: "0.55s", r: 1.5 },
    { left: "62%", top: "75%", delay: "0.9s", r: 2 },
  ];

  return (
    <button
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className="w-full mb-4 relative overflow-hidden"
      style={{
        height: 56,
        borderRadius: 18,
        border: "1px solid rgba(96,165,250,0.25)",
        background:
          "linear-gradient(118deg,#0d1f45 0%,#1a3a8f 45%,#2563eb 100%)",
        transform: pressed ? "scale(0.978)" : "scale(1)",
        transition:
          "transform 0.13s cubic-bezier(0.4,0,0.2,1), box-shadow 0.13s",
        boxShadow: pressed
          ? "0 2px 8px rgba(37,99,235,0.2)"
          : "0 6px 24px rgba(37,99,235,0.4), inset 0 1px 0 rgba(255,255,255,0.07)",
        WebkitTapHighlightColor: "transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        color: "#fff",
        fontFamily: "-apple-system,'SF Pro Display',sans-serif",
        fontSize: 14,
        fontWeight: 800,
        letterSpacing: "-0.02em",
      }}
    >
      {/* shimmer */}
      <span
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `linear-gradient(108deg,
          transparent ${tick - 5}%,
          rgba(147,197,253,0.1) ${tick + 5}%,
          rgba(219,234,254,0.07) ${tick + 12}%,
          transparent ${tick + 22}%)`,
        }}
      />

      {/* dot grid */}
      <span
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.04,
          backgroundImage:
            "repeating-linear-gradient(0deg,#93c5fd 0,#93c5fd 1px,transparent 1px,transparent 24px)," +
            "repeating-linear-gradient(90deg,#93c5fd 0,#93c5fd 1px,transparent 1px,transparent 24px)",
        }}
      />

      {/* top highlight */}
      <span
        style={{
          position: "absolute",
          top: 0,
          left: "8%",
          right: "8%",
          height: 1,
          pointerEvents: "none",
          background:
            "linear-gradient(90deg,transparent,rgba(147,197,253,0.5),transparent)",
        }}
      />

      {/* bottom accent */}
      <span
        style={{
          position: "absolute",
          bottom: 0,
          left: "20%",
          right: "20%",
          height: 1,
          pointerEvents: "none",
          background:
            "linear-gradient(90deg,transparent,rgba(96,165,250,0.4),transparent)",
        }}
      />

      {/* left bloom */}
      <span
        style={{
          position: "absolute",
          left: -20,
          top: "50%",
          transform: "translateY(-50%)",
          width: 80,
          height: 80,
          borderRadius: "50%",
          background:
            "radial-gradient(circle,rgba(59,130,246,0.2) 0%,transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* floating dots */}
      {dots.map((d, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: d.left,
            top: d.top,
            width: d.r,
            height: d.r,
            borderRadius: "50%",
            background: "rgba(147,197,253,0.6)",
            pointerEvents: "none",
            animation: `aibtn-dot ${2.2 + i * 0.18}s ease-in-out ${d.delay} infinite`,
          }}
        />
      ))}

      {/* Brain + sparkle */}
      <span
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Brain size={17} style={{ color: "#93c5fd" }} />
        <Sparkles
          size={8}
          style={{
            position: "absolute",
            top: -5,
            right: -5,
            color: "#fbbf24",
            opacity: sparkle ? 1 : 0.45,
            transform: sparkle ? "scale(1.4) rotate(15deg)" : "scale(1)",
            transition: "opacity 0.2s, transform 0.2s",
          }}
        />
      </span>

      <span>Add Photos with AI</span>

      {/* AI pill */}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 3,
          padding: "2px 8px",
          borderRadius: 999,
          background: "rgba(37,99,235,0.45)",
          border: "1px solid rgba(96,165,250,0.35)",
          fontSize: 10,
          fontWeight: 800,
          color: "#93c5fd",
          letterSpacing: "0.04em",
        }}
      >
        <Zap size={8} style={{ color: "#fbbf24" }} /> AI
      </span>

      <Plus
        size={13}
        style={{ color: "rgba(147,197,253,0.7)", flexShrink: 0 }}
      />

      <style>{`
        @keyframes aibtn-dot {
          0%,100% { opacity:.4; transform:scale(1); }
          50%      { opacity:1; transform:scale(2); }
        }
      `}</style>
    </button>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════ */
export default function PhotosPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";

  const router = useRouter();
  const queryClient = useQueryClient();

  const [view, setView] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState<MediaCategory | "ALL">("ALL");
  const [lightbox, setLightbox] = useState<{
    photos: GBPMedia[];
    index: number;
  } | null>(null);
  const [toDelete, setToDelete] = useState<GBPMedia | null>(null);

  /* ── data ── */
  const { data, isLoading, isError, refetch, isFetching } =
    useQuery<MediaResponse>({
      queryKey: ["gbp-media"],
      queryFn: fetchMedia,
      staleTime: 5 * 60 * 1000,
    });

  const deleteMut = useMutation({
    mutationFn: (name: string) => deleteMedia(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gbp-media"] });
      setToDelete(null);
    },
  });

  const items = data?.mediaItems ?? [];

  /* ── filter ── */
  const cats = Array.from(
    new Set(items.map((i) => i.locationAssociation?.category).filter(Boolean)),
  ) as MediaCategory[];
  const filtered =
    filter === "ALL"
      ? items
      : items.filter((i) => i.locationAssociation?.category === filter);

  /* ── open lightbox only on filtered set ── */
  function openLightbox(index: number) {
    setLightbox({ photos: filtered, index });
  }

  return (
    <div
      className={`min-h-screen transition-colors ${dark ? "bg-[#050d1a]" : "bg-[#eef4ff]"}`}
      style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}
    >
      {/* dot grid bg */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px,#3b82f6 1px,transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative max-w-lg mx-auto px-4 pb-28">
        {/* ── HEADER ── */}
        <div className="pt-5 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9.5px] font-black uppercase tracking-widest
                  ${dark ? "bg-blue-500/10 border-blue-700/60 text-blue-400" : "bg-blue-50 border-blue-300 text-blue-600"}`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  Google Business
                </div>
              </div>
              <h1
                className={`text-[22px] font-black leading-tight ${dark ? "text-white" : "text-slate-900"}`}
                style={{ letterSpacing: "-0.04em" }}
              >
                Profile Photos
              </h1>
              <p
                className={`text-[12px] mt-0.5 ${dark ? "text-slate-500" : "text-blue-500/80"}`}
              >
                {isLoading
                  ? "Loading…"
                  : `${items.length} media · ${data?.totalMediaItemCount ?? 0} total`}
              </p>
            </div>

            {/* actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all active:scale-90 border
                  ${dark ? "bg-white/[0.04] border-white/[0.06] text-slate-400" : "bg-white border-blue-100 text-slate-500"}`}
              >
                <RefreshCw
                  size={14}
                  style={{
                    animation: isFetching ? "spin .8s linear infinite" : "none",
                  }}
                />
              </button>
              <button
                onClick={() => router.push("/photos/create")}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-[12px] font-black text-white transition-all active:scale-95"
                style={{
                  background: "linear-gradient(135deg,#1e40af,#3b82f6)",
                  boxShadow: "0 6px 20px rgba(59,130,246,0.38)",
                }}
              >
                <Plus size={14} /> Add Photo
              </button>
            </div>
          </div>
        </div>

        {/* ── STATS ── */}
        {!isLoading && items.length > 0 && (
          <StatsStrip items={items} dark={dark} />
        )}

        {/* ── AI BANNER ── */}
        {!isLoading && items.length > 0 && (
          <AIBanner items={items} dark={dark} />
        )}

        {/* ── FILTER + VIEW TOGGLE ── */}
        {!isLoading && items.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            {/* filter tabs */}
            <div className="flex-1 flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              <button
                onClick={() => setFilter("ALL")}
                className="shrink-0 px-3 py-1.5 rounded-full text-[10.5px] font-bold transition-all border"
                style={
                  filter === "ALL"
                    ? {
                        background: "rgba(59,130,246,0.15)",
                        color: "#60a5fa",
                        borderColor: "rgba(59,130,246,0.3)",
                      }
                    : {
                        background: "transparent",
                        color: dark ? "#475569" : "#94a3b8",
                        borderColor: "transparent",
                      }
                }
              >
                All ({items.length})
              </button>
              {cats.map((c) => {
                const cfg = CAT_CFG[c];
                const count = items.filter(
                  (i) => i.locationAssociation?.category === c,
                ).length;
                return (
                  <button
                    key={c}
                    onClick={() => setFilter(c)}
                    className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[10.5px] font-bold transition-all border"
                    style={
                      filter === c
                        ? {
                            background: `${cfg.color}18`,
                            color: cfg.color,
                            borderColor: `${cfg.color}35`,
                          }
                        : {
                            background: "transparent",
                            color: dark ? "#475569" : "#94a3b8",
                            borderColor: "transparent",
                          }
                    }
                  >
                    {cfg.icon} {cfg.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* view toggle */}
            <div
              className={`flex gap-0.5 p-1 rounded-xl border shrink-0
              ${dark ? "bg-white/[0.03] border-white/[0.06]" : "bg-white border-blue-100"}`}
            >
              {(["grid", "list"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                  style={
                    view === v
                      ? { background: "rgba(59,130,246,0.2)", color: "#60a5fa" }
                      : { color: dark ? "#475569" : "#94a3b8" }
                  }
                >
                  {v === "grid" ? <LayoutGrid size={12} /> : <List size={12} />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── CONTENT ── */}
        {isLoading ? (
          <GridSkeleton dark={dark} />
        ) : isError ? (
          <div
            className={`rounded-2xl border p-6 text-center
    ${dark ? "bg-red-500/[0.06] border-red-500/20" : "bg-red-50 border-red-200/60"}`}
          >
            <AlertTriangle size={24} className="text-red-400 mx-auto mb-2" />
            <p
              className={`text-[13px] font-bold mb-1 ${dark ? "text-white" : "text-slate-900"}`}
            >
              Failed to load photos
            </p>
            <p className="text-[11px] text-red-400 mb-3">
              Could not connect to Google Business API
            </p>
            <button
              onClick={() => refetch()}
              className="text-[11px] font-bold text-blue-400 flex items-center gap-1 mx-auto"
            >
              <RefreshCw size={11} /> Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          filter === "ALL" ? (
            <EmptyState
              dark={dark}
              onAdd={() => router.push("/photos/create")}
            />
          ) : (
            <div
              className={`rounded-2xl border p-8 text-center
        ${dark ? "bg-[#0a1020] border-blue-900/30" : "bg-white border-blue-100"}`}
            >
              <Camera size={28} className="text-blue-400/40 mx-auto mb-2" />
              <p
                className={`text-[12px] ${dark ? "text-slate-500" : "text-slate-400"}`}
              >
                No {CAT_CFG[filter as MediaCategory]?.label} photos yet
              </p>
            </div>
          )
        ) : (
          <>
            {/* ── AI ADD BUTTON — always visible above grid/list ── */}
            <AIAddPhotoButton
              dark={dark}
              onClick={() => router.push("/photos/create")}
            />

            {view === "grid" ? (
              <div
                className="grid grid-cols-3 gap-2"
                style={{
                  animation:
                    "pgrid-in 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
                }}
              >
                {filtered.map((p, i) => (
                  <div
                    key={p.id}
                    style={{
                      animation: `pcard-in 0.3s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.04}s both`,
                    }}
                  >
                    <PhotoCard
                      photo={p}
                      dark={dark}
                      view="grid"
                      onPreview={() => openLightbox(i)}
                      onDelete={() => setToDelete(p)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filtered.map((p, i) => (
                  <div
                    key={p.id}
                    style={{
                      animation: `plist-in 0.28s ease-out ${i * 0.05}s both`,
                    }}
                  >
                    <PhotoCard
                      photo={p}
                      dark={dark}
                      view="list"
                      onPreview={() => openLightbox(i)}
                      onDelete={() => setToDelete(p)}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── CATEGORY GUIDE ── */}
        {!isLoading && items.length > 0 && (
          <div className="mt-6">
            <p
              className={`text-[10px] font-black uppercase tracking-widest mb-3 ${dark ? "text-slate-600" : "text-slate-400"}`}
            >
              Coverage Guide
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  "COVER",
                  "LOGO",
                  "EXTERIOR",
                  "INTERIOR",
                  "PRODUCT",
                  "AT_WORK",
                ] as MediaCategory[]
              ).map((c) => {
                const cfg = CAT_CFG[c];
                const count = items.filter(
                  (i) => i.locationAssociation?.category === c,
                ).length;
                const targets: Record<string, number> = {
                  COVER: 1,
                  LOGO: 1,
                  EXTERIOR: 5,
                  INTERIOR: 8,
                  PRODUCT: 10,
                  AT_WORK: 3,
                };
                const target = targets[c] ?? 3;
                const pct = Math.min(100, Math.round((count / target) * 100));
                return (
                  <div
                    key={c}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl border
                    ${dark ? "bg-[#0a1020] border-blue-900/30" : "bg-white border-blue-100/80"}`}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${cfg.color}15`, color: cfg.color }}
                    >
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-0.5">
                        <span
                          className={`text-[10px] font-bold ${dark ? "text-slate-300" : "text-slate-700"}`}
                        >
                          {cfg.label}
                        </span>
                        <span
                          className="text-[9.5px] font-bold"
                          style={{ color: cfg.color }}
                        >
                          {count}/{target}
                        </span>
                      </div>
                      <div
                        className={`h-1 rounded-full overflow-hidden ${dark ? "bg-white/[0.05]" : "bg-blue-50"}`}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: cfg.color }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── LIGHTBOX ── */}
      {lightbox && (
        <Lightbox
          photos={lightbox.photos}
          index={lightbox.index}
          dark={dark}
          onClose={() => setLightbox(null)}
          onDelete={(p) => {
            setLightbox(null);
            setToDelete(p);
          }}
        />
      )}

      {/* ── DELETE MODAL ── */}
      {toDelete && (
        <DeleteModal
          photo={toDelete}
          dark={dark}
          loading={deleteMut.isPending}
          onCancel={() => setToDelete(null)}
          onConfirm={() => deleteMut.mutate(toDelete.name)}
        />
      )}

      <style>{`
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        .no-scrollbar::-webkit-scrollbar { display:none }
        .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none }
      `}</style>

      <style>{`
        @keyframes spin     { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes pgrid-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes pcard-in { from{opacity:0;transform:scale(0.88)} to{opacity:1;transform:scale(1)} }
        @keyframes plist-in { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:none} }
        .no-scrollbar::-webkit-scrollbar { display:none }
        .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none }
        `}</style>

    </div>
  );
}
