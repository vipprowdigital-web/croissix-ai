// mobile_app\app\(main)\post\create\page.tsx


"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import { useMutation } from "@tanstack/react-query";
import { useUser } from "@/features/user/hook/useUser";
import {
  Sparkles,
  Image as ImageIcon,
  X,
  Calendar,
  Clock,
  Send,
  RefreshCw,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Eye,
  Zap,
  Tag,
  Link2,
  Phone,
  ShoppingBag,
  Plus,
  ChevronLeft,
  ChevronRight,
  Info,
  Upload,
  Loader2,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
type PostType = "STANDARD" | "EVENT" | "OFFER";
type CTA =
  | "BOOK"
  | "ORDER"
  | "SHOP"
  | "LEARN_MORE"
  | "SIGN_UP"
  | "CALL"
  | "NONE";

interface ScheduleDate {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}
interface PostPayload {
  payload: Record<string, any>;
  scheduleTime: ScheduleDate | null;
}

/* ══════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════ */
const POST_TYPES: {
  id: PostType;
  label: string;
  icon: React.ReactNode;
  desc: string;
}[] = [
  {
    id: "STANDARD",
    label: "Update",
    icon: <Zap size={14} />,
    desc: "Share news or updates",
  },
  {
    id: "EVENT",
    label: "Event",
    icon: <Calendar size={14} />,
    desc: "Promote an upcoming event",
  },
  {
    id: "OFFER",
    label: "Offer",
    icon: <ShoppingBag size={14} />,
    desc: "Share a deal or discount",
  },
];

const CTA_OPTIONS: { id: CTA; label: string; icon: React.ReactNode }[] = [
  { id: "NONE", label: "No Button", icon: <X size={12} /> },
  { id: "LEARN_MORE", label: "Learn More", icon: <Info size={12} /> },
  { id: "BOOK", label: "Book", icon: <Calendar size={12} /> },
  { id: "ORDER", label: "Order Online", icon: <ShoppingBag size={12} /> },
  { id: "SHOP", label: "Shop", icon: <Tag size={12} /> },
  { id: "SIGN_UP", label: "Sign Up", icon: <Link2 size={12} /> },
  { id: "CALL", label: "Call Now", icon: <Phone size={12} /> },
];

const AI_PROMPTS: Record<PostType, string[]> = {
  STANDARD: [
    "✨ Exciting news from {business}! We're thrilled to share that we've been serving our community with dedication and passion. Come visit us and experience the difference that quality and care makes. We look forward to seeing you soon! #LocalBusiness #Community",
    "🌟 At {business}, every day is an opportunity to deliver excellence. Our team works tirelessly to ensure you get the best experience possible. Thank you for your continued support — you mean the world to us! 💙",
  ],
  EVENT: [
    "🎉 Mark your calendars! {business} is hosting a special event you won't want to miss. Join us for an unforgettable experience filled with great moments and wonderful people. Spaces are limited — reserve yours today!",
    "📅 Save the date! Something exciting is happening at {business}. We're putting together a wonderful experience for our valued customers and community. Stay tuned for more details! #Event #Community",
  ],
  OFFER: [
    "🏷️ Special offer alert from {business}! For a limited time, we're bringing you an exclusive deal that's too good to pass up. Don't miss this opportunity — visit us today and take advantage of this amazing offer! T&Cs apply.",
    "💥 DEAL OF THE DAY at {business}! We believe everyone deserves great value, which is why we're offering this incredible promotion. Act fast — this offer won't last long! #Sale #SpecialOffer",
  ],
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MAX_CHARS = 1500;

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
const getDaysInMonth = (y: number, m: number) =>
  new Date(y, m + 1, 0).getDate();
const getFirstDay = (y: number, m: number) => new Date(y, m, 1).getDay();
const pad = (n: number) => String(n).padStart(2, "0");
const formatSchedule = (s: ScheduleDate) =>
  `${MONTHS[s.month].slice(0, 3)} ${s.day}, ${s.year} at ${pad(s.hour)}:${pad(s.minute)}`;
function now(): ScheduleDate {
  const d = new Date();
  return {
    year: d.getFullYear(),
    month: d.getMonth(),
    day: d.getDate(),
    hour: d.getHours(),
    minute: Math.ceil(d.getMinutes() / 15) * 15,
  };
}

/* ══════════════════════════════════════════════════════════
   API FUNCTIONS (used by TanStack mutations)
══════════════════════════════════════════════════════════ */
async function uploadImage(base64: string): Promise<string> {
  const res = await fetch(base64);
  const blob = await res.blob();
  const form = new FormData();
  form.append("file", blob, "image.jpg");
  const r = await fetch("/api/upload", { method: "POST", body: form });
  const data = await r.json();
  if (!data.secure_url) throw new Error("Image upload failed");
  return data.secure_url as string;
}

async function publishPost(
  body: PostPayload & { token: string },
): Promise<void> {
  const { token, ...rest } = body;
  const res = await fetch("/api/google/posts/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(rest),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Post failed");
}

/* ══════════════════════════════════════════════════════════
   GEMINI SPARKLE
══════════════════════════════════════════════════════════ */
function GeminiSparkle({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="overflow-visible shrink-0"
    >
      <style>{`
        @keyframes gsp{0%,100%{transform:scale(1) rotate(0deg)}25%{transform:scale(1.2) rotate(10deg)}75%{transform:scale(1.1) rotate(-9deg)}}
        @keyframes gss1{0%,100%{stop-color:#60a5fa}50%{stop-color:#a5f3fc}}
        @keyframes gss2{0%,100%{stop-color:#818cf8}50%{stop-color:#60a5fa}}
        @keyframes gsd{0%,100%{opacity:.5}50%{opacity:1}}
        .gsp-s{transform-origin:12px 11px;animation:gsp 2.8s ease-in-out infinite}
        .gsp-1{animation:gss1 2.8s ease-in-out infinite}
        .gsp-2{animation:gss2 2.8s ease-in-out infinite .9s}
        .gsp-d{animation:gsd 2.8s ease-in-out infinite}
        .gsp-d2{animation:gsd 2.8s ease-in-out infinite 1.1s}
      `}</style>
      <defs>
        <linearGradient
          id="gspg"
          x1="3"
          y1="2"
          x2="21"
          y2="20"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" className="gsp-1" stopColor="#60a5fa" />
          <stop offset="100%" className="gsp-2" stopColor="#818cf8" />
        </linearGradient>
      </defs>
      <path
        className="gsp-s"
        d="M12 2L13.8 9.2L21 11L13.8 12.8L12 20L10.2 12.8L3 11L10.2 9.2L12 2Z"
        stroke="url(#gspg)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="url(#gspg)"
        fillOpacity=".25"
      />
      <circle className="gsp-d" cx="19.5" cy="4.5" r="1.1" fill="url(#gspg)" />
      <circle className="gsp-d2" cx="4.5" cy="19" r="0.9" fill="url(#gspg)" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════
   SPINNER
══════════════════════════════════════════════════════════ */
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

/* ══════════════════════════════════════════════════════════
   SKELETONS
══════════════════════════════════════════════════════════ */
function Skeleton({
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

function PageSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-28">
      <div className="flex items-center gap-3">
        <Skeleton isDark={isDark} className="w-8 h-8 rounded-xl" />
        <Skeleton isDark={isDark} className="h-5 w-36" />
      </div>
      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton
            key={i}
            isDark={isDark}
            className="h-20 flex-1 rounded-2xl"
          />
        ))}
      </div>
      <Skeleton isDark={isDark} className="h-40 rounded-2xl" />
      <Skeleton isDark={isDark} className="h-32 rounded-2xl" />
      <Skeleton isDark={isDark} className="h-14 rounded-2xl" />
      <Skeleton isDark={isDark} className="h-14 rounded-2xl" />
      <Skeleton isDark={isDark} className="h-12 rounded-2xl" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   UPLOAD PROGRESS BAR
══════════════════════════════════════════════════════════ */
function UploadProgress({
  current,
  total,
  isDark,
}: {
  current: number;
  total: number;
  isDark: boolean;
}) {
  const pct = total ? Math.round((current / total) * 100) : 0;
  return (
    <div
      className={`rounded-2xl p-4 border flex flex-col gap-2.5 mb-4
      ${isDark ? "bg-blue-500/[0.06] border-blue-500/20" : "bg-blue-50 border-blue-200"}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Upload size={13} className="text-blue-500 animate-bounce" />
          <span
            className={`text-[12px] font-semibold ${isDark ? "text-blue-400" : "text-blue-600"}`}
          >
            Uploading photos… {current}/{total}
          </span>
        </div>
        <span
          className={`text-[11px] font-bold ${isDark ? "text-blue-400" : "text-blue-600"}`}
        >
          {pct}%
        </span>
      </div>
      <div
        className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-white/[0.07]" : "bg-blue-100"}`}
      >
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CALENDAR PICKER
══════════════════════════════════════════════════════════ */
function CalendarPicker({
  value,
  onChange,
  isDark,
  onClose,
}: {
  value: ScheduleDate;
  onChange: (d: ScheduleDate) => void;
  isDark: boolean;
  onClose: () => void;
}) {
  const [view, setView] = useState({ year: value.year, month: value.month });
  const today = new Date();
  const days = getDaysInMonth(view.year, view.month);
  const first = getFirstDay(view.year, view.month);
  const cells = Array(first)
    .fill(null)
    .concat(Array.from({ length: days }, (_, i) => i + 1));

  const isToday = (d: number) =>
    d === today.getDate() &&
    view.month === today.getMonth() &&
    view.year === today.getFullYear();
  const isSelected = (d: number) =>
    d === value.day && view.month === value.month && view.year === value.year;
  const isPast = (d: number) =>
    new Date(view.year, view.month, d) <
    new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const prev = () =>
    setView((v) =>
      v.month === 0
        ? { year: v.year - 1, month: 11 }
        : { year: v.year, month: v.month - 1 },
    );
  const next = () =>
    setView((v) =>
      v.month === 11
        ? { year: v.year + 1, month: 0 }
        : { year: v.year, month: v.month + 1 },
    );

  return (
    <div
      className={`rounded-2xl border overflow-hidden ${isDark ? "bg-[#131c2d] border-white/[0.08]" : "bg-white border-black/[0.06]"}`}
    >
      {/* month nav */}
      <div
        className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? "border-white/[0.06]" : "border-slate-100"}`}
      >
        <button
          onClick={prev}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all active:scale-90
          ${isDark ? "text-slate-400 hover:bg-white/[0.08]" : "text-slate-500 hover:bg-slate-100"}`}
        >
          <ChevronLeft size={15} />
        </button>
        <span
          className={`text-[13px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}
        >
          {MONTHS[view.month]} {view.year}
        </span>
        <button
          onClick={next}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all active:scale-90
          ${isDark ? "text-slate-400 hover:bg-white/[0.08]" : "text-slate-500 hover:bg-slate-100"}`}
        >
          <ChevronRight size={15} />
        </button>
      </div>
      <div className="p-3">
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d) => (
            <div
              key={d}
              className={`text-center text-[10px] font-bold py-1 ${isDark ? "text-slate-600" : "text-slate-400"}`}
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((d, i) => (
            <div key={i}>
              {d === null ? (
                <div />
              ) : (
                <button
                  disabled={isPast(d)}
                  onClick={() =>
                    onChange({
                      ...value,
                      day: d,
                      month: view.month,
                      year: view.year,
                    })
                  }
                  className={`w-full aspect-square flex items-center justify-center rounded-xl text-[12px] font-medium
                    transition-all duration-150 active:scale-90 disabled:opacity-25 disabled:cursor-not-allowed
                    ${
                      isSelected(d)
                        ? "bg-blue-500 text-white font-bold shadow-md"
                        : isToday(d)
                          ? isDark
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-blue-50 text-blue-600"
                          : isDark
                            ? "text-slate-300 hover:bg-white/[0.08]"
                            : "text-slate-700 hover:bg-slate-50"
                    }`}
                >
                  {d}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* time */}
      <div
        className={`px-4 py-3 border-t ${isDark ? "border-white/[0.06]" : "border-slate-100"}`}
      >
        <div className="flex items-center gap-2">
          <Clock
            size={13}
            className={isDark ? "text-slate-500" : "text-slate-400"}
          />
          <span
            className={`text-[11px] font-semibold uppercase tracking-wide ${isDark ? "text-slate-500" : "text-slate-400"}`}
          >
            Time
          </span>
          <div className="flex items-center gap-1.5 ml-auto">
            <select
              value={value.hour}
              onChange={(e) => onChange({ ...value, hour: +e.target.value })}
              className={`h-8 px-2 rounded-lg text-[13px] font-medium outline-none border
                ${isDark ? "bg-[#182236] border-white/[0.07] text-white" : "bg-slate-50 border-black/[0.07] text-slate-900"}`}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {pad(i)}
                </option>
              ))}
            </select>
            <span className={isDark ? "text-slate-500" : "text-slate-400"}>
              :
            </span>
            <select
              value={value.minute}
              onChange={(e) => onChange({ ...value, minute: +e.target.value })}
              className={`h-8 px-2 rounded-lg text-[13px] font-medium outline-none border
                ${isDark ? "bg-[#182236] border-white/[0.07] text-white" : "bg-slate-50 border-black/[0.07] text-slate-900"}`}
            >
              {[0, 15, 30, 45].map((m) => (
                <option key={m} value={m}>
                  {pad(m)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="px-4 pb-3 pt-1 flex gap-2">
        <button
          onClick={onClose}
          className={`flex-1 h-9 rounded-xl text-[13px] font-semibold transition-all active:scale-95
            ${isDark ? "bg-white/[0.07] text-slate-300" : "bg-slate-100 text-slate-600"}`}
        >
          Cancel
        </button>
        <button
          onClick={onClose}
          className="flex-1 h-9 rounded-xl text-[13px] font-bold text-white transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   IMAGE UPLOAD ZONE
══════════════════════════════════════════════════════════ */
function ImageUpload({
  images,
  onChange,
  isDark,
  disabled,
}: {
  images: string[];
  onChange: (imgs: string[]) => void;
  isDark: boolean;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFiles = (files: FileList | null) => {
    if (!files || disabled) return;
    Array.from(files)
      .slice(0, 10 - images.length)
      .forEach((file) => {
        if (!file.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onload = (e) =>
          onChange([...images, e.target?.result as string]);
        reader.readAsDataURL(file);
      });
  };
  const remove = (i: number) => {
    if (!disabled) onChange(images.filter((_, idx) => idx !== i));
  };

  return (
    <div className={disabled ? "pointer-events-none opacity-50" : ""}>
      {images.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar pb-1">
          {images.map((src, i) => (
            <div
              key={i}
              className="relative shrink-0 w-20 h-20 rounded-2xl overflow-hidden group"
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200" />
              <button
                onClick={() => remove(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center
                  opacity-0 group-hover:opacity-100 transition-all active:scale-90"
              >
                <X size={11} className="text-white" />
              </button>
            </div>
          ))}
          {images.length < 10 && (
            <button
              onClick={() => inputRef.current?.click()}
              className={`shrink-0 w-20 h-20 rounded-2xl border-2 border-dashed flex items-center justify-center
                transition-all active:scale-95
                ${
                  isDark
                    ? "border-white/[0.12] text-slate-600 hover:border-blue-500/40 hover:text-blue-400"
                    : "border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-500"
                }`}
            >
              <Plus size={20} />
            </button>
          )}
        </div>
      )}
      {images.length === 0 && (
        <button
          onClick={() => inputRef.current?.click()}
          className={`w-full h-28 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2
            transition-all duration-200 active:scale-[0.98]
            ${
              isDark
                ? "border-white/[0.1] hover:border-blue-500/40 hover:bg-blue-500/[0.04]"
                : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
            }`}
        >
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDark ? "bg-white/[0.06]" : "bg-slate-100"}`}
          >
            <ImageIcon
              size={18}
              className={isDark ? "text-slate-500" : "text-slate-400"}
            />
          </div>
          <div>
            <p
              className={`text-[13px] font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Tap to upload photos
            </p>
            <p
              className={`text-[11px] text-center ${isDark ? "text-slate-600" : "text-slate-400"}`}
            >
              Up to 10 images • JPG, PNG, WEBP
            </p>
          </div>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PREVIEW MODAL
══════════════════════════════════════════════════════════ */
function PreviewModal({
  text,
  images,
  cta,
  schedule,
  isDark,
  onClose,
}: {
  text: string;
  images: string[];
  cta: CTA;
  schedule: ScheduleDate | null;
  isDark: boolean;
  onClose: () => void;
}) {
  const ctaLabel = CTA_OPTIONS.find((c) => c.id === cta)?.label;
  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)" }}
    >
      <div
        className={`w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl ${isDark ? "bg-[#131c2d]" : "bg-white"}`}
      >
        <div className="p-4">
          {/* mock header */}
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white text-[12px] font-bold">B</span>
            </div>
            <div>
              <p
                className={`text-[13px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Your Business
              </p>
              <p
                className={`text-[11px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
              >
                Google Business · {schedule ? formatSchedule(schedule) : "Now"}
              </p>
            </div>
            <div className="ml-auto">
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
            </div>
          </div>
          {images.length > 0 && (
            <img
              src={images[0]}
              alt=""
              className="w-full h-40 object-cover rounded-2xl mb-3"
            />
          )}
          <p
            className={`text-[13.5px] leading-relaxed mb-3 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}
          >
            {text || (
              <span className={isDark ? "text-slate-600" : "text-slate-400"}>
                Your post content will appear here…
              </span>
            )}
          </p>
          {cta !== "NONE" && (
            <div
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-semibold
              ${isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-50 text-blue-600"}`}
            >
              {CTA_OPTIONS.find((c) => c.id === cta)?.icon}
              {ctaLabel}
            </div>
          )}
          {schedule && (
            <div
              className={`mt-3 flex items-center gap-1.5 text-[11px] font-medium ${isDark ? "text-orange-400" : "text-orange-500"}`}
            >
              <Clock size={11} /> Scheduled for {formatSchedule(schedule)}
            </div>
          )}
        </div>
        <div
          className={`px-4 pb-4 pt-2 border-t ${isDark ? "border-white/[0.06]" : "border-slate-100"}`}
        >
          <button
            onClick={onClose}
            className={`w-full h-10 rounded-2xl text-[13px] font-semibold transition-all active:scale-95
              ${isDark ? "bg-white/[0.07] text-slate-300" : "bg-slate-100 text-slate-600"}`}
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SUCCESS STATE
══════════════════════════════════════════════════════════ */
function SuccessView({
  schedule,
  isDark,
  onNew,
}: {
  schedule: ScheduleDate | null;
  isDark: boolean;
  onNew: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center gap-5">
      <div className="relative">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(34,197,94,0.15)",
            boxShadow: "0 0 40px rgba(34,197,94,0.25)",
          }}
        >
          <CheckCircle2 size={44} className="text-green-500" />
        </div>
        <div className="absolute -top-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-white text-[11px] font-bold">✓</span>
        </div>
      </div>
      <div>
        <h2
          className={`text-[24px] font-black mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
          style={{
            fontFamily: "-apple-system,'SF Pro Display',sans-serif",
            letterSpacing: "-0.04em",
          }}
        >
          {schedule ? "Post Scheduled!" : "Post Published!"}
        </h2>
        <p
          className={`text-[13.5px] leading-relaxed max-w-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
        >
          {schedule
            ? `Your post will go live on ${formatSchedule(schedule)}`
            : "Your post is now live on Google Business Profile. It may take a few minutes to appear."}
        </p>
      </div>
      <button
        onClick={onNew}
        className="h-12 px-10 rounded-2xl text-[14px] font-bold text-white transition-all active:scale-95"
        style={{
          background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
          boxShadow: "0 4px 20px rgba(37,99,235,0.40)",
        }}
      >
        Create Another Post
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   STEP INDICATOR (uploading → posting)
══════════════════════════════════════════════════════════ */
function StepBadge({
  step,
  isDark,
}: {
  step: "uploading" | "posting";
  isDark: boolean;
}) {
  const steps = [
    { id: "uploading", label: "Uploading photos" },
    { id: "posting", label: "Publishing post" },
  ];
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-2xl mb-4 border
      ${isDark ? "bg-blue-500/[0.07] border-blue-500/20" : "bg-blue-50 border-blue-200"}`}
    >
      <Loader2 size={15} className="text-blue-500 animate-spin shrink-0" />
      <div className="flex-1">
        <div className="flex gap-1.5 mb-1.5">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1.5">
              <div
                className={`h-1 rounded-full transition-all duration-500
                ${
                  step === s.id
                    ? "w-8 bg-blue-500"
                    : steps.indexOf(steps.find((x) => x.id === step)!) > i
                      ? "w-4 bg-green-500"
                      : "w-4 bg-white/[0.1]"
                }`}
              />
            </div>
          ))}
        </div>
        <p
          className={`text-[11.5px] font-semibold ${isDark ? "text-blue-400" : "text-blue-600"}`}
        >
          {steps.find((s) => s.id === step)?.label}…
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════ */
export default function GooglePostPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  const { data: user, isLoading: userLoading } = useUser();

  /* ── form state ── */
  const [postType, setPostType] = useState<PostType>("STANDARD");
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [cta, setCta] = useState<CTA>("LEARN_MORE");
  const [ctaUrl, setCtaUrl] = useState("");
  const [schedule, setSchedule] = useState<ScheduleDate | null>(null);
  const [showCal, setShowCal] = useState(false);
  const [calDraft, setCalDraft] = useState<ScheduleDate>(now());
  const [showPreview, setShowPreview] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [offerTitle, setOfferTitle] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [showCtaUrl, setShowCtaUrl] = useState(false);
  const [validErr, setValidErr] = useState("");

  /* ── upload progress ── */
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });

  /* ── AI generation local state ── */
  const [isGenerating, setIsGenerating] = useState(false);
  const aiIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── submission guard — prevents double-click even if button re-renders ── */
  const submittingRef = useRef(false);

  const charCount = text.length;
  const remaining = MAX_CHARS - charCount;
  const overLimit = remaining < 0;

  /* ── TanStack mutation: publish post ── */
  const postMutation = useMutation({
    mutationFn: publishPost,
    onSuccess: () => {
      submittingRef.current = false;
    },
    onError: () => {
      submittingRef.current = false;
    },
  });

  /* derived loading phase */
  const uploadPhase =
    postMutation.isPending &&
    uploadProgress.total > 0 &&
    uploadProgress.current < uploadProgress.total;
  const postingPhase = postMutation.isPending && !uploadPhase;

  /* ── AI generation ── */
  const generateAI = useCallback(() => {
    if (isGenerating) return;
    if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
    setIsGenerating(true);
    setValidErr("");
    setTimeout(() => {
      const pool = AI_PROMPTS[postType];
      const tmpl = pool[Math.floor(Math.random() * pool.length)];
      const biz = user?.googleLocationName || "our business";
      const final = tmpl.replace(/\{business\}/g, biz);
      let i = 0;
      setText("");
      aiIntervalRef.current = setInterval(() => {
        i++;
        setText(final.slice(0, i));
        if (i >= final.length) {
          clearInterval(aiIntervalRef.current!);
          setIsGenerating(false);
        }
      }, 18);
    }, 700);
  }, [isGenerating, postType, user?.googleLocationName]);

  /* cleanup on unmount */
  useEffect(
    () => () => {
      if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
    },
    [],
  );

  /* ── validation ── */
  const validate = (): boolean => {
    if (!text.trim()) {
      setValidErr("Post content is required.");
      return false;
    }
    if (text.length > MAX_CHARS) {
      setValidErr(`Content exceeds ${MAX_CHARS} chars.`);
      return false;
    }
    if (postType === "EVENT" && !eventTitle.trim()) {
      setValidErr("Event title is required.");
      return false;
    }
    if (postType === "OFFER" && !offerTitle.trim()) {
      setValidErr("Offer title is required.");
      return false;
    }
    if (cta !== "NONE" && cta !== "CALL" && showCtaUrl && !ctaUrl.trim()) {
      setValidErr("CTA URL is required.");
      return false;
    }
    return true;
  };

  /* ── submit (guarded by ref + TanStack isPending) ── */
  const handleSubmit = async () => {
    setValidErr("");

    /* double-submission guard */
    if (submittingRef.current || postMutation.isPending) return;
    if (!validate()) return;

    const token = localStorage.getItem("accessToken");
    if (!token) {
      setValidErr("Not authenticated. Please log in again.");
      return;
    }

    submittingRef.current = true;

    /* ── build payload ── */
    const payload: Record<string, any> = {
      languageCode: "en-US",
      summary: text,
      topicType: postType,
    };

    if (cta !== "NONE") {
      payload.callToAction = { actionType: cta };
      if (cta !== "CALL" && ctaUrl) payload.callToAction.url = ctaUrl;
    }

    /* ── upload images first ── */
    let uploadedUrls: string[] = [];
    if (images.length) {
      setUploadProgress({ current: 0, total: images.length });
      try {
        for (let idx = 0; idx < images.length; idx++) {
          const url = await uploadImage(images[idx]);
          uploadedUrls.push(url);
          setUploadProgress({ current: idx + 1, total: images.length });
        }
      } catch (e: any) {
        setValidErr(e.message ?? "Image upload failed.");
        submittingRef.current = false;
        setUploadProgress({ current: 0, total: 0 });
        return;
      }
    }

    if (uploadedUrls.length) {
      payload.media = uploadedUrls.map((url) => ({
        mediaFormat: "PHOTO",
        sourceUrl: url,
      }));
    }

    if (postType === "EVENT") {
      payload.event = { title: eventTitle };
    }
    if (postType === "OFFER") {
      payload.offer = {
        couponCode,
        redeemOnlineUrl: ctaUrl,
        termsConditions: "",
      };
      payload.event = { title: offerTitle };
    }

    /* ── fire TanStack mutation ── */
    postMutation.mutate({ payload, scheduleTime: schedule, token });
  };

  /* ── reset ── */
  const resetForm = () => {
    setText("");
    setImages([]);
    setCta("LEARN_MORE");
    setCtaUrl("");
    setSchedule(null);
    setPostType("STANDARD");
    setEventTitle("");
    setOfferTitle("");
    setCouponCode("");
    setValidErr("");
    setShowCtaUrl(false);
    setUploadProgress({ current: 0, total: 0 });
    setIsGenerating(false);
    if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
    postMutation.reset();
    submittingRef.current = false;
  };

  const isSubmitting = postMutation.isPending;
  const mutationError = postMutation.error?.message ?? "";
  const displayError = validErr || mutationError;

  /* ── skeletons ── */
  if (userLoading)
    return (
      <div
        className={`min-h-screen ${isDark ? "bg-[#0d1421]" : "bg-[#eef2fb]"}`}
      >
        <PageSkeleton isDark={isDark} />
      </div>
    );

  /* ── success ── */
  if (postMutation.isSuccess)
    return (
      <div
        className={`min-h-screen ${isDark ? "bg-[#0d1421]" : "bg-[#eef2fb]"}`}
        style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}
      >
        <SuccessView schedule={schedule} isDark={isDark} onNew={resetForm} />
      </div>
    );

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-[#0d1421]" : "bg-[#eef2fb]"}`}
      style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}
    >
      <div className="max-w-lg mx-auto px-4 pb-28">
        {/* ── header ── */}
        <div className="pt-4 pb-5">
          <div className="flex items-center gap-2 mb-0.5">
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
            <h1
              className={`text-[18px] font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
              style={{
                fontFamily: "-apple-system,'SF Pro Display',sans-serif",
                letterSpacing: "-0.03em",
              }}
            >
              Create Post
            </h1>
          </div>
          {user?.googleLocationName && (
            <p
              className={`text-[12px] ml-[22px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
            >
              {user.googleLocationName}
            </p>
          )}
        </div>

        {/* ── step indicator (while submitting) ── */}
        {isSubmitting && (
          <StepBadge
            step={uploadPhase ? "uploading" : "posting"}
            isDark={isDark}
          />
        )}

        {/* ── upload progress bar ── */}
        {uploadPhase && uploadProgress.total > 1 && (
          <UploadProgress
            current={uploadProgress.current}
            total={uploadProgress.total}
            isDark={isDark}
          />
        )}

        {/* ── post type selector ── */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {POST_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => !isSubmitting && setPostType(t.id)}
              disabled={isSubmitting}
              className={`flex flex-col items-center gap-1.5 py-3.5 px-2 rounded-2xl border
                transition-all duration-150 active:scale-95 disabled:opacity-50
                ${
                  postType === t.id
                    ? isDark
                      ? "bg-blue-500/15 border-blue-500/40 text-blue-400"
                      : "bg-blue-50 border-blue-300 text-blue-600"
                    : isDark
                      ? "bg-[#131c2d] border-white/[0.06] text-slate-400 hover:bg-[#182236]"
                      : "bg-white border-black/[0.05] text-slate-500 hover:bg-slate-50 shadow-sm"
                }`}
            >
              <span className={postType === t.id ? "" : "opacity-60"}>
                {t.icon}
              </span>
              <span
                className={`text-[12px] font-bold ${postType === t.id ? "" : "opacity-70"}`}
              >
                {t.label}
              </span>
              <span
                className={`text-[10px] text-center leading-tight
                ${postType === t.id ? (isDark ? "text-blue-500/70" : "text-blue-500/70") : isDark ? "text-slate-600" : "text-slate-400"}`}
              >
                {t.desc}
              </span>
            </button>
          ))}
        </div>

        {/* ── event extras ── */}
        {postType === "EVENT" && (
          <div
            className={`rounded-2xl p-4 mb-4 border flex flex-col gap-3
            ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05] shadow-sm"}`}
          >
            <p
              className={`text-[11px] font-bold uppercase tracking-wide ${isDark ? "text-slate-500" : "text-slate-400"}`}
            >
              Event Details
            </p>
            <input
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="Event title *"
              disabled={isSubmitting}
              className={`w-full h-10 px-3 rounded-xl text-[13.5px] outline-none border transition-all disabled:opacity-50
                ${
                  isDark
                    ? "bg-[#182236] border-white/[0.07] text-white placeholder:text-slate-600 focus:border-blue-500/50"
                    : "bg-slate-50 border-black/[0.07] text-slate-900 placeholder:text-slate-400 focus:border-blue-400"
                }`}
            />
          </div>
        )}

        {/* ── offer extras ── */}
        {postType === "OFFER" && (
          <div
            className={`rounded-2xl p-4 mb-4 border flex flex-col gap-3
            ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05] shadow-sm"}`}
          >
            <p
              className={`text-[11px] font-bold uppercase tracking-wide ${isDark ? "text-slate-500" : "text-slate-400"}`}
            >
              Offer Details
            </p>
            <input
              value={offerTitle}
              onChange={(e) => setOfferTitle(e.target.value)}
              placeholder="Offer title *"
              disabled={isSubmitting}
              className={`w-full h-10 px-3 rounded-xl text-[13.5px] outline-none border transition-all disabled:opacity-50
                ${
                  isDark
                    ? "bg-[#182236] border-white/[0.07] text-white placeholder:text-slate-600 focus:border-blue-500/50"
                    : "bg-slate-50 border-black/[0.07] text-slate-900 placeholder:text-slate-400 focus:border-blue-400"
                }`}
            />
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Coupon code (optional)"
              disabled={isSubmitting}
              className={`w-full h-10 px-3 rounded-xl text-[13.5px] outline-none border transition-all disabled:opacity-50
                ${
                  isDark
                    ? "bg-[#182236] border-white/[0.07] text-white placeholder:text-slate-600 focus:border-blue-500/50"
                    : "bg-slate-50 border-black/[0.07] text-slate-900 placeholder:text-slate-400 focus:border-blue-400"
                }`}
            />
          </div>
        )}

        {/* ── content card ── */}
        <div
          className={`rounded-2xl border mb-4 overflow-hidden
          ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05] shadow-sm"}`}
        >
          {/* AI toolbar */}
          <div
            className={`flex items-center gap-2 px-4 py-3 border-b flex-wrap ${isDark ? "border-white/[0.05]" : "border-slate-100"}`}
          >
            <button
              onClick={generateAI}
              disabled={isGenerating || isSubmitting}
              className={`flex items-center gap-1.5 h-8 px-3 rounded-xl text-[12px] font-semibold
                transition-all active:scale-95 disabled:opacity-60
                ${
                  isDark
                    ? "bg-blue-500/15 text-blue-400 border border-blue-500/25 hover:bg-blue-500/22"
                    : "bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
                }`}
            >
              {isGenerating ? (
                <>
                  <Spin size={12} /> Writing…
                </>
              ) : (
                <>
                  <GeminiSparkle size={13} /> Generate with AI
                </>
              )}
            </button>
            {text.length > 0 && !isGenerating && !isSubmitting && (
              <button
                onClick={generateAI}
                className={`flex items-center gap-1 h-8 px-2.5 rounded-xl text-[11px] font-medium transition-all active:scale-95
                  ${isDark ? "text-slate-500 hover:bg-white/[0.07] hover:text-slate-300" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"}`}
              >
                <RefreshCw size={11} /> Regenerate
              </button>
            )}
            {text.length > 0 && !isSubmitting && (
              <button
                onClick={() => setText("")}
                className={`ml-auto flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-medium transition-all active:scale-95
                  ${isDark ? "text-slate-600 hover:text-red-400 hover:bg-red-500/10" : "text-slate-400 hover:text-red-500 hover:bg-red-50"}`}
              >
                <Trash2 size={11} /> Clear
              </button>
            )}
          </div>
          {/* textarea */}
          <div className="relative p-4">
            {isGenerating && text.length === 0 && (
              <div className="flex flex-col gap-2.5 py-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton
                    key={i}
                    isDark={isDark}
                    className={`h-3 ${i === 2 ? "w-2/3" : "w-full"}`}
                  />
                ))}
              </div>
            )}
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setValidErr("");
              }}
              disabled={isSubmitting}
              placeholder={
                isGenerating
                  ? ""
                  : "Write your post… or use AI to generate content ✨"
              }
              rows={6}
              className={`w-full bg-transparent outline-none text-[14px] leading-relaxed resize-none placeholder:text-[13.5px]
                disabled:opacity-60
                ${isGenerating ? "opacity-0 absolute pointer-events-none" : ""}
                ${isDark ? "text-white placeholder:text-slate-600" : "text-slate-900 placeholder:text-slate-400"}`}
              style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}
            />
            {isGenerating && text.length > 0 && (
              <span className="inline-block w-0.5 h-4 bg-blue-500 ml-0.5 animate-pulse" />
            )}
          </div>
          {/* char counter */}
          <div className="flex items-center justify-between px-4 pb-3">
            <span
              className={`text-[11px] font-medium
              ${overLimit ? "text-red-400" : remaining < 100 ? "text-orange-400" : isDark ? "text-slate-600" : "text-slate-400"}`}
            >
              {overLimit
                ? `${Math.abs(remaining)} over limit`
                : remaining < 200
                  ? `${remaining} chars left`
                  : `${charCount} / ${MAX_CHARS}`}
            </span>
            <span
              className={`text-[10px] font-medium ${isDark ? "text-slate-700" : "text-slate-300"}`}
            >
              Google Business Post
            </span>
          </div>
        </div>

        {/* ── image upload ── */}
        <div
          className={`rounded-2xl p-4 mb-4 border
          ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05] shadow-sm"}`}
        >
          <div className="flex items-center justify-between mb-3">
            <p
              className={`text-[11px] font-bold uppercase tracking-wide ${isDark ? "text-slate-500" : "text-slate-400"}`}
            >
              Photos
            </p>
            {images.length > 0 && (
              <span
                className={`text-[11px] font-medium ${isDark ? "text-slate-600" : "text-slate-400"}`}
              >
                {images.length}/10
              </span>
            )}
          </div>
          <ImageUpload
            images={images}
            onChange={setImages}
            isDark={isDark}
            disabled={isSubmitting}
          />
        </div>

        {/* ── CTA picker ── */}
        <div
          className={`rounded-2xl p-4 mb-4 border
          ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05] shadow-sm"}`}
        >
          <p
            className={`text-[11px] font-bold uppercase tracking-wide mb-3 ${isDark ? "text-slate-500" : "text-slate-400"}`}
          >
            Call to Action
          </p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {CTA_OPTIONS.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  if (!isSubmitting) {
                    setCta(c.id);
                    setShowCtaUrl(c.id !== "NONE" && c.id !== "CALL");
                  }
                }}
                disabled={isSubmitting}
                className={`flex items-center gap-1.5 h-8 px-3 rounded-xl text-[12px] font-semibold whitespace-nowrap shrink-0
                  transition-all active:scale-95 disabled:opacity-50
                  ${
                    cta === c.id
                      ? "bg-blue-500 text-white"
                      : isDark
                        ? "bg-white/[0.07] text-slate-400 hover:bg-white/[0.12]"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
              >
                {c.icon}
                {c.label}
              </button>
            ))}
          </div>
          {showCtaUrl && cta !== "NONE" && cta !== "CALL" && (
            <div
              className={`mt-3 flex items-center gap-2 h-10 px-3 rounded-xl border
              ${isDark ? "bg-[#182236] border-white/[0.07]" : "bg-slate-50 border-black/[0.07]"}`}
            >
              <Link2
                size={13}
                className={isDark ? "text-slate-600" : "text-slate-400"}
              />
              <input
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                disabled={isSubmitting}
                placeholder="https://yourwebsite.com"
                className={`flex-1 bg-transparent outline-none text-[13.5px] disabled:opacity-50
                  ${isDark ? "text-white placeholder:text-slate-600" : "text-slate-900 placeholder:text-slate-400"}`}
              />
            </div>
          )}
        </div>

        {/* ── scheduler ── */}
        <div
          className={`rounded-2xl border mb-4 overflow-hidden
          ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05] shadow-sm"}`}
        >
          <button
            onClick={() => !isSubmitting && setShowCal((v) => !v)}
            disabled={isSubmitting}
            className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all disabled:opacity-50
              ${isDark ? "hover:bg-white/[0.03]" : "hover:bg-slate-50"}`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0
              ${schedule ? (isDark ? "bg-orange-500/20" : "bg-orange-50") : isDark ? "bg-white/[0.07]" : "bg-slate-100"}`}
            >
              <Calendar
                size={15}
                className={
                  schedule
                    ? isDark
                      ? "text-orange-400"
                      : "text-orange-500"
                    : isDark
                      ? "text-slate-500"
                      : "text-slate-400"
                }
              />
            </div>
            <div className="flex-1 text-left">
              <p
                className={`text-[13px] font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {schedule ? "Scheduled" : "Schedule for Later"}
              </p>
              <p
                className={`text-[11px] ${
                  schedule
                    ? isDark
                      ? "text-orange-400/80"
                      : "text-orange-500"
                    : isDark
                      ? "text-slate-600"
                      : "text-slate-400"
                }`}
              >
                {schedule
                  ? formatSchedule(schedule)
                  : "Post immediately when published"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {schedule && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isSubmitting) setSchedule(null);
                  }}
                  className={`w-6 h-6 flex items-center justify-center rounded-lg transition-all active:scale-90
                    ${isDark ? "text-slate-500 hover:text-red-400 hover:bg-red-500/10" : "text-slate-400 hover:text-red-500 hover:bg-red-50"}`}
                >
                  <X size={13} />
                </button>
              )}
              <ChevronDown
                size={15}
                className={`transition-transform ${isDark ? "text-slate-500" : "text-slate-400"} ${showCal ? "rotate-180" : ""}`}
              />
            </div>
          </button>
          {showCal && (
            <div
              className={`border-t ${isDark ? "border-white/[0.05]" : "border-slate-100"}`}
            >
              <div className="p-3">
                <CalendarPicker
                  value={calDraft}
                  onChange={(v) => {
                    setCalDraft(v);
                    setSchedule(v);
                  }}
                  isDark={isDark}
                  onClose={() => setShowCal(false)}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── error banner ── */}
        {displayError && (
          <div
            className={`flex items-start gap-2.5 p-3.5 rounded-2xl mb-4 border
            ${isDark ? "bg-red-500/[0.08] border-red-500/20" : "bg-red-50 border-red-200"}`}
          >
            <AlertCircle size={15} className="text-red-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-[13px] font-medium text-red-400">
                {displayError}
              </p>
              {postMutation.isError && (
                <button
                  onClick={() => {
                    postMutation.reset();
                    setValidErr("");
                    submittingRef.current = false;
                  }}
                  className="text-[11px] font-semibold text-blue-500 hover:text-blue-400 mt-1 transition-colors"
                >
                  Dismiss and try again
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── action buttons ── */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowPreview(true)}
            disabled={isSubmitting}
            className={`flex items-center gap-1.5 h-12 px-4 rounded-2xl text-[13px] font-semibold border
              transition-all active:scale-95 disabled:opacity-40
              ${
                isDark
                  ? "bg-[#131c2d] border-white/[0.08] text-slate-300 hover:bg-[#182236]"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
              }`}
          >
            <Eye size={15} /> Preview
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isGenerating || overLimit}
            className="flex-1 h-12 rounded-2xl text-[14px] font-bold text-white
              flex items-center justify-center gap-2 transition-all active:scale-[0.97]
              disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
            style={{
              background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
              boxShadow: isSubmitting
                ? "none"
                : "0 4px 18px rgba(37,99,235,0.38)",
              transition: "box-shadow 0.2s ease, transform 0.1s ease",
            }}
          >
            {isSubmitting ? (
              uploadPhase ? (
                <>
                  <Upload size={14} className="animate-bounce" /> Uploading{" "}
                  {uploadProgress.current}/{uploadProgress.total}…
                </>
              ) : (
                <>
                  <Spin size={15} white />{" "}
                  {schedule ? "Scheduling…" : "Publishing…"}
                </>
              )
            ) : (
              <>
                <Send size={14} />
                {schedule ? "Schedule Post" : "Publish Now"}
              </>
            )}
          </button>
        </div>

        {/* ── policy note ── */}
        <p
          className={`text-[10.5px] text-center mt-4 leading-relaxed ${isDark ? "text-slate-700" : "text-slate-400"}`}
        >
          Posts may take a few minutes to appear on Google. Content must comply
          with{" "}
          <span className="text-blue-500 cursor-pointer">
            Google's content policies
          </span>
          . Posts expire after 7 days unless they are Event or Offer posts.
        </p>
      </div>

      {/* ── preview modal ── */}
      {showPreview && (
        <PreviewModal
          text={text}
          images={images}
          cta={cta}
          schedule={schedule}
          isDark={isDark}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
