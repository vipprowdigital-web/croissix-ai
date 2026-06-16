// web_app/app/(main)/facebook/posts/create/page.tsx
//
// Facebook Create Post Page
// Theme: matches FacebookAnalytics page (#050d1a dark / #eef4ff light, #1877F2 blue)
// Features:
//   • Post type selector (Text / Photo / Video / Link)
//   • AI content generation (calls /api/ai/post-content)
//   • AI image generation (calls /api/ai/generate-image)
//   • Manual photo upload
//   • Schedule for later (date + time picker)
//   • Preview modal
//   • Posts to /api/v1/facebook/posts/create

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
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
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Eye,
  Plus,
  Link2,
  Video,
  Type,
  Lightbulb,
  Hash,
  Upload,
  Loader2,
  Wand2,
  NotebookText,
} from "lucide-react";
import { getToken } from "@/lib/token";

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
type PostType = "Text" | "Photo" | "Video" | "Link";
type Tone = "Professional" | "Friendly" | "Enthusiastic";
type ImgStyle =
  | "photorealistic"
  | "illustration"
  | "minimalist"
  | "cinematic"
  | "warm";

interface ScheduleDate {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}
interface AIResult {
  content: string;
  engagementScore: number;
  tips: string[];
  hashtags: string[];
  suggestedKeywords: string[];
  wordCount: number;
  charCount: number;
}
interface ImageResult {
  imageUrl: string;
  prompt: string;
  provider: string;
  seed: number;
}

/* ══════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════ */
const POST_TYPES: {
  id: PostType;
  icon: React.ReactNode;
  label: string;
  desc: string;
}[] = [
  {
    id: "Text",
    icon: <Type size={14} />,
    label: "Text",
    desc: "Share thoughts or updates",
  },
  {
    id: "Photo",
    icon: <ImageIcon size={14} />,
    label: "Photo",
    desc: "Share images with your audience",
  },
  {
    id: "Video",
    icon: <Video size={14} />,
    label: "Video",
    desc: "Share video content",
  },
  {
    id: "Link",
    icon: <Link2 size={14} />,
    label: "Link",
    desc: "Share an external link",
  },
];
const TONES: { id: Tone; emoji: string; label: string }[] = [
  { id: "Professional", emoji: "🎯", label: "Professional" },
  { id: "Friendly", emoji: "😊", label: "Friendly" },
  { id: "Enthusiastic", emoji: "🚀", label: "Enthusiastic" },
];
const IMG_STYLES: { id: ImgStyle; emoji: string; label: string }[] = [
  { id: "photorealistic", emoji: "📸", label: "Photo" },
  { id: "illustration", emoji: "🎨", label: "Illustration" },
  { id: "minimalist", emoji: "⬜", label: "Minimal" },
  { id: "cinematic", emoji: "🎬", label: "Cinematic" },
  { id: "warm", emoji: "🌅", label: "Warm" },
];
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
const MAX_CHARS = 63206; // Facebook's actual limit

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
const getDaysInMonth = (y: number, m: number) =>
  new Date(y, m + 1, 0).getDate();
const getFirstDay = (y: number, m: number) => new Date(y, m, 1).getDay();
const pad = (n: number) => String(n).padStart(2, "0");
const formatSchedule = (s: ScheduleDate) =>
  `${MONTHS[s.month].slice(0, 3)} ${s.day}, ${s.year} at ${pad(s.hour)}:${pad(s.minute)}`;
function nowDate(): ScheduleDate {
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
   API
══════════════════════════════════════════════════════════ */
async function uploadImage(base64: string): Promise<string> {
  const res = await fetch(base64);
  const blob = await res.blob();
  const form = new FormData();
  form.append("file", blob, "image.jpg");
  const r = await fetch("/api/upload", { method: "POST", body: form });
  const d = await r.json();
  if (!d.secure_url) throw new Error("Image upload failed");
  return d.secure_url as string;
}

// async function publishPost(body: {
//   message: string;
//   postType: PostType;
//   link?: string;
//   mediaUrls?: string[];
//   scheduleTime?: ScheduleDate | null;
// }): Promise<void> {
//   const res = await fetch(
//     `${process.env.NEXT_PUBLIC_API_URL}/facebook/posts/create`,
//     {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${getToken()}`,
//       },
//       body: JSON.stringify(body),
//     },
//   );
//   const json = await res.json();
//   if (!res.ok || !json.success) throw new Error(json.message ?? "Post failed");
// }
async function publishPost(body: {
  message: string;
  postType: PostType;
  link?: string;
  mediaUrls?: string[];
  scheduleTime?: ScheduleDate | null;
}): Promise<void> {
  // Convert your scheduleTime date to a UNIX timestamp if it's not already one
  //   let formattedScheduleTime: number | undefined = undefined;
  //   if (body.scheduleTime) {
  //     const dateObj = new Date(
  //       body.scheduleTime.year,
  //       body.scheduleTime.month,
  //       body.scheduleTime.day,
  //       body.scheduleTime.hour,
  //       body.scheduleTime.minute,
  //     );
  //     formattedScheduleTime = Math.floor(dateObj.getTime() / 1000);
  //   }
  // ScheduleDate.month is already 0-indexed (from Date.getMonth()) — use it directly
  let formattedScheduleTime: number | undefined = undefined;
  if (body.scheduleTime) {
    const { year, month, day, hour, minute } = body.scheduleTime;
    formattedScheduleTime = Math.floor(
      new Date(year, month, day, hour, minute).getTime() / 1000,
    );
  }

  const backendPayload: Record<string, unknown> = { message: body.message };
  if (body.link) backendPayload.link = body.link;
  if (body.mediaUrls?.length) backendPayload.attached_media = body.mediaUrls;
  if (formattedScheduleTime) backendPayload.scheduled_publish_time = formattedScheduleTime;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/facebook/posts/create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(backendPayload), // Send the correctly mapped payload
    },
  );

  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message ?? "Post failed");
}

async function callGenerateContent(params: {
  topic: string;
  postType: string;
  pageName: string;
  businessCategory: string;
  keywords: string[];
  existingPosts: string[];
  tone: string;
}): Promise<AIResult> {
  const res = await fetch("/api/ai/facebook-post-content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "AI generation failed");
  return json as AIResult;
}

async function callGenerateImage(params: {
  topic: string;
  content?: string;
  postType: string;
  pageName: string;
  businessCategory: string;
  style: string;
  seed?: number;
}): Promise<ImageResult> {
  const res = await fetch("/api/ai/facebook-generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Image generation failed");
  return json as ImageResult;
}

/* ══════════════════════════════════════════════════════════
   ATOMS
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

function Sk({ dark, className = "" }: { dark: boolean; className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${dark ? "bg-blue-900/30" : "bg-blue-100/50"} ${className}`}
    />
  );
}

function FacebookLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════
   AI IMAGE CARD
══════════════════════════════════════════════════════════ */
function AIImageCard({
  title,
  postType,
  bizName,
  bizCat,
  imgStyle,
  setImgStyle,
  aiImage,
  setAiImage,
  onImageAccepted,
  dark,
  disabled,
}: {
  title: string;
  postType: string;
  bizName: string;
  bizCat: string;
  imgStyle: ImgStyle;
  setImgStyle: (s: ImgStyle) => void;
  aiImage: ImageResult | null;
  setAiImage: (r: ImageResult | null) => void;
  onImageAccepted: (url: string) => void;
  dark: boolean;
  disabled: boolean;
}) {
  const [generating, setGenerating] = useState(false);
  const [imgError, setImgError] = useState("");

  const generate = useCallback(
    async (forceNewSeed = false) => {
      if (!title.trim() || generating || disabled) return;
      setGenerating(true);
      setImgError("");
      try {
        const seed = forceNewSeed
          ? Math.floor(Math.random() * 999999)
          : (aiImage?.seed ?? undefined);
        const result = await callGenerateImage({
          topic: title,
          postType,
          pageName: bizName,
          businessCategory: bizCat,
          style: imgStyle,
          seed,
        });
        setAiImage(result);
      } catch (e: any) {
        setImgError(e.message ?? "Image generation failed");
      } finally {
        setGenerating(false);
      }
    },
    [
      title,
      postType,
      bizName,
      bizCat,
      imgStyle,
      generating,
      disabled,
      aiImage?.seed,
    ],
  );

  const card = `rounded-2xl border overflow-hidden ${dark ? "bg-[#0a1020] border-blue-900/30" : "bg-white border-blue-100/80 shadow-sm"}`;

  return (
    <div className={card}>
      <div
        className={`px-4 py-2.5 flex items-center gap-2 border-b ${dark ? "border-blue-900/30" : "border-blue-50"}`}
      >
        <div
          className={`w-6 h-6 rounded-lg flex items-center justify-center ${dark ? "bg-purple-500/15" : "bg-purple-100"}`}
        >
          <Wand2 size={12} className="text-purple-400" />
        </div>
        <p
          className={`text-[12.5px] font-black ${dark ? "text-white" : "text-slate-900"}`}
        >
          AI Image
        </p>
        {aiImage && (
          <span
            className="text-[9px] font-black px-2 py-0.5 rounded-full ml-1 border"
            style={{
              background: "rgba(16,185,129,0.1)",
              color: "#10B981",
              borderColor: "rgba(16,185,129,0.25)",
            }}
          >
            Generated
          </span>
        )}
        {aiImage && (
          <span
            className="ml-auto text-[9px] font-bold"
            style={{ color: dark ? "#334155" : "#cbd5e1" }}
          >
            via {aiImage.provider}
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col gap-3">
        {/* Style selector */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {IMG_STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => setImgStyle(s.id)}
              className={`flex items-center gap-1.5 shrink-0 h-8 px-2.5 rounded-xl text-[11px] font-bold border transition-all active:scale-95
                ${
                  imgStyle === s.id
                    ? dark
                      ? "bg-purple-500/15 border-purple-500/35 text-purple-400"
                      : "bg-purple-50 border-purple-200 text-purple-600"
                    : dark
                      ? "bg-white/[0.03] border-blue-900/30 text-slate-500"
                      : "bg-slate-50 border-blue-100 text-slate-500"
                }`}
            >
              <span className="text-[13px]">{s.emoji}</span> {s.label}
            </button>
          ))}
        </div>

        {/* Image area */}
        {generating ? (
          <div
            className={`w-full rounded-2xl overflow-hidden relative ${dark ? "bg-[#070f1e]" : "bg-blue-50/60"}`}
            style={{ aspectRatio: "1/1" }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg,#7c3aed,#a855f7)",
                  boxShadow: "0 0 20px rgba(168,85,247,0.5)",
                }}
              >
                <Wand2 size={20} className="text-white" />
              </div>
              <p
                className={`text-[11px] font-semibold ${dark ? "text-purple-300" : "text-purple-600"}`}
              >
                Generating image…
              </p>
            </div>
          </div>
        ) : aiImage ? (
          <div
            className="relative rounded-2xl overflow-hidden group"
            style={{ aspectRatio: "1/1" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={aiImage.imageUrl}
              alt="AI generated"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <button
                onClick={() => onImageAccepted(aiImage.imageUrl)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-white text-[11px] font-black active:scale-95"
                style={{
                  background: "rgba(16,185,129,0.9)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                }}
              >
                <CheckCircle2 size={12} /> Use Image
              </button>
            </div>
            <div
              className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-center gap-2"
              style={{
                background: "linear-gradient(0deg,rgba(0,0,0,0.7),transparent)",
              }}
            >
              <p className="text-white text-[10px] flex-1 truncate opacity-70">
                {aiImage.prompt.slice(0, 60)}…
              </p>
              <button
                onClick={() => generate(true)}
                disabled={generating}
                className="flex items-center gap-1 px-2 py-1 rounded-xl text-white text-[10px] font-black active:scale-95 disabled:opacity-50"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <RefreshCw size={9} /> New
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => generate(true)}
            disabled={!title.trim() || generating || disabled}
            className="w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-40"
            style={{
              aspectRatio: "1/1",
              borderColor: dark
                ? "rgba(168,85,247,0.25)"
                : "rgba(168,85,247,0.3)",
              background: dark
                ? "rgba(168,85,247,0.04)"
                : "rgba(168,85,247,0.03)",
            }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                background: dark
                  ? "rgba(168,85,247,0.12)"
                  : "rgba(168,85,247,0.1)",
              }}
            >
              <Wand2 size={22} className="text-purple-400" />
            </div>
            <div className="text-center">
              <p
                className={`text-[13px] font-black ${dark ? "text-purple-300" : "text-purple-600"}`}
              >
                Generate AI Image
              </p>
              <p
                className="text-[10.5px] mt-0.5"
                style={{ color: dark ? "#334155" : "#94a3b8" }}
              >
                {title.trim()
                  ? "FLUX AI · Free · Square format"
                  : "Enter a topic first"}
              </p>
            </div>
          </button>
        )}

        {imgError && (
          <div
            className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border
            ${dark ? "bg-red-500/[0.07] border-red-900/40" : "bg-red-50 border-red-200/60"}`}
          >
            <AlertCircle size={12} className="text-red-400 shrink-0 mt-0.5" />
            <p
              className={`text-[10.5px] ${dark ? "text-red-400" : "text-red-600"}`}
            >
              {imgError}
            </p>
          </div>
        )}

        {aiImage && !generating && (
          <div className="flex gap-2">
            <button
              onClick={() => onImageAccepted(aiImage.imageUrl)}
              className="flex-1 h-9 rounded-2xl text-[12px] font-black text-white flex items-center justify-center gap-1.5 active:scale-95"
              style={{
                background: "linear-gradient(135deg,#16a34a,#22c55e)",
                boxShadow: "0 4px 16px rgba(34,197,94,0.3)",
              }}
            >
              <CheckCircle2 size={12} /> Add to Post
            </button>
            <button
              onClick={() => generate(true)}
              disabled={generating}
              className={`flex items-center gap-1.5 h-9 px-3 rounded-2xl text-[11.5px] font-bold border active:scale-95 disabled:opacity-50
                ${dark ? "bg-white/[0.04] border-blue-900/40 text-purple-400" : "bg-purple-50 border-purple-200/60 text-purple-600"}`}
            >
              <RefreshCw size={11} /> Regen
            </button>
          </div>
        )}
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
  dark,
  onClose,
}: {
  value: ScheduleDate;
  onChange: (d: ScheduleDate) => void;
  dark: boolean;
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
      className={`rounded-2xl border overflow-hidden ${dark ? "bg-[#0a1020] border-blue-900/40" : "bg-white border-blue-100"}`}
    >
      <div
        className={`flex items-center justify-between px-4 py-3 border-b ${dark ? "border-blue-900/30" : "border-blue-50"}`}
      >
        <button
          onClick={prev}
          className={`w-7 h-7 flex items-center justify-center rounded-lg ${dark ? "text-slate-400" : "text-slate-500"}`}
        >
          <ChevronLeft size={15} />
        </button>
        <span
          className={`text-[13px] font-bold ${dark ? "text-white" : "text-slate-900"}`}
        >
          {MONTHS[view.month]} {view.year}
        </span>
        <button
          onClick={next}
          className={`w-7 h-7 flex items-center justify-center rounded-lg ${dark ? "text-slate-400" : "text-slate-500"}`}
        >
          <ChevronRight size={15} />
        </button>
      </div>
      <div className="p-3">
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] font-bold py-1"
              style={{ color: dark ? "#334155" : "#94a3b8" }}
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
                  className={`w-full aspect-square flex items-center justify-center rounded-xl text-[12px] font-medium transition-all active:scale-90 disabled:opacity-25
                    ${
                      isSelected(d)
                        ? "text-white"
                        : isToday(d)
                          ? dark
                            ? "text-blue-400"
                            : "text-blue-600"
                          : dark
                            ? "text-slate-300"
                            : "text-slate-700"
                    }`}
                  style={
                    isSelected(d)
                      ? { background: "#1877F2" }
                      : isToday(d)
                        ? {
                            background: dark
                              ? "rgba(24,119,242,0.2)"
                              : "rgba(24,119,242,0.08)",
                          }
                        : {}
                  }
                >
                  {d}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      <div
        className={`px-4 py-3 border-t ${dark ? "border-blue-900/30" : "border-blue-50"}`}
      >
        <div className="flex items-center gap-2">
          <Clock size={12} style={{ color: dark ? "#475569" : "#94a3b8" }} />
          <span
            className="text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: dark ? "#475569" : "#94a3b8" }}
          >
            Time
          </span>
          <div className="flex items-center gap-1.5 ml-auto">
            <select
              value={value.hour}
              onChange={(e) => onChange({ ...value, hour: +e.target.value })}
              className={`h-8 px-2 rounded-lg text-[13px] font-medium outline-none border
                ${dark ? "bg-[#0d1728] border-blue-900/40 text-white" : "bg-blue-50 border-blue-100 text-slate-900"}`}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {pad(i)}
                </option>
              ))}
            </select>
            <span style={{ color: dark ? "#475569" : "#94a3b8" }}>:</span>
            <select
              value={value.minute}
              onChange={(e) => onChange({ ...value, minute: +e.target.value })}
              className={`h-8 px-2 rounded-lg text-[13px] font-medium outline-none border
                ${dark ? "bg-[#0d1728] border-blue-900/40 text-white" : "bg-blue-50 border-blue-100 text-slate-900"}`}
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
          className={`flex-1 h-9 rounded-xl text-[13px] font-semibold border
            ${dark ? "bg-white/[0.04] border-blue-900/40 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}
        >
          Cancel
        </button>
        <button
          onClick={onClose}
          className="flex-1 h-9 rounded-xl text-[13px] font-bold text-white"
          style={{ background: "linear-gradient(135deg,#1d4ed8,#1877F2)" }}
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   IMAGE UPLOAD
══════════════════════════════════════════════════════════ */
function ImageUpload({
  images,
  onChange,
  dark,
  disabled,
}: {
  images: string[];
  onChange: (imgs: string[]) => void;
  dark: boolean;
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
  return (
    <div className={disabled ? "pointer-events-none opacity-50" : ""}>
      {images.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <div
              key={i}
              className="relative shrink-0 w-20 h-20 rounded-2xl overflow-hidden group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />
              <button
                onClick={() => onChange(images.filter((_, idx) => idx !== i))}
                className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"
              >
                <X size={10} className="text-white" />
              </button>
            </div>
          ))}
          {images.length < 10 && (
            <button
              onClick={() => inputRef.current?.click()}
              className={`shrink-0 w-20 h-20 rounded-2xl border-2 border-dashed flex items-center justify-center
                ${dark ? "border-blue-900/40 text-slate-600" : "border-blue-100 text-slate-400"}`}
            >
              <Plus size={20} />
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className={`w-full h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2
            ${dark ? "border-blue-900/30" : "border-blue-100"}`}
        >
          <ImageIcon
            size={18}
            style={{ color: dark ? "#334155" : "#94a3b8" }}
          />
          <p
            className="text-[12px] font-semibold"
            style={{ color: dark ? "#475569" : "#94a3b8" }}
          >
            Upload from device
          </p>
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
  postType,
  link,
  schedule,
  dark,
  bizName,
  onClose,
}: {
  text: string;
  images: string[];
  postType: PostType;
  link: string;
  schedule: ScheduleDate | null;
  dark: boolean;
  bizName: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)" }}
    >
      <div
        className={`w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border
        ${dark ? "bg-[#0a1020] border-blue-900/50" : "bg-white border-blue-100"}`}
      >
        <div className="p-4">
          {/* Fake FB page header */}
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg,#1d4ed8,#1877F2)" }}
            >
              <span className="text-white font-black text-sm">f</span>
            </div>
            <div>
              <p
                className={`text-[13px] font-bold ${dark ? "text-white" : "text-slate-900"}`}
              >
                {bizName || "Your Page"}
              </p>
              <p
                className="text-[11px]"
                style={{ color: dark ? "#475569" : "#94a3b8" }}
              >
                Facebook Page ·{" "}
                {schedule ? formatSchedule(schedule) : "Just now"}
              </p>
            </div>
          </div>
          {images.length > 0 && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={images[0]}
              alt=""
              className="w-full h-44 object-cover rounded-2xl mb-3"
            />
          )}
          <p
            className={`text-[13.5px] leading-relaxed mb-3 ${dark ? "text-slate-300" : "text-slate-700"}`}
          >
            {text || (
              <span style={{ color: dark ? "#334155" : "#94a3b8" }}>
                Your post content will appear here…
              </span>
            )}
          </p>
          {link && (
            <div
              className={`flex items-center gap-2 p-3 rounded-xl border text-[11.5px] font-medium
              ${dark ? "bg-blue-900/20 border-blue-900/40 text-blue-400" : "bg-blue-50 border-blue-100 text-blue-600"}`}
            >
              <Link2 size={12} /> {link}
            </div>
          )}
        </div>
        <div
          className={`px-4 pb-4 pt-2 border-t ${dark ? "border-blue-900/30" : "border-blue-50"}`}
        >
          <button
            onClick={onClose}
            className={`w-full h-10 rounded-2xl text-[13px] font-semibold border
              ${dark ? "bg-white/[0.04] border-blue-900/40 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════ */
export default function FacebookCreatePostPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";

  const router = useRouter();
  const { data: user, isLoading: userLoading } = useUser();

  /* ── Form state ── */
  const [postType, setPostType] = useState<PostType>("Text");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<Tone>("Professional");
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [link, setLink] = useState("");
  const [schedule, setSchedule] = useState<ScheduleDate | null>(null);
  const [showCal, setShowCal] = useState(false);
  const [calDraft, setCalDraft] = useState<ScheduleDate>(nowDate());
  const [showPreview, setShowPreview] = useState(false);
  const [validErr, setValidErr] = useState("");

  /* ── AI text ── */
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState("");

  /* ── AI image ── */
  const [imgStyle, setImgStyle] = useState<ImgStyle>("photorealistic");
  const [aiImage, setAiImage] = useState<ImageResult | null>(null);

  /* ── Upload progress ── */
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });
  const submittingRef = useRef(false);

  const charCount = text.length;
  const overLimit = charCount > MAX_CHARS;

  const bizName = user?.facebookPageName ?? "Your Business";
  const bizCat = user?.businessCategory ?? "";

  /* ── AI text generation ── */
  const generateText = useCallback(async () => {
    if (!topic.trim() || isGenerating) return;
    setIsGenerating(true);
    setAiError("");
    try {
      const result = await callGenerateContent({
        topic,
        postType,
        pageName: bizName,
        businessCategory: bizCat,
        keywords: [],
        existingPosts: [],
        tone,
      });
      // Typewriter effect
      const final = result.content;
      let i = 0;
      setText("");
      const interval = setInterval(() => {
        i++;
        setText(final.slice(0, i));
        if (i >= final.length) {
          clearInterval(interval);
          setAiResult(result);
          setIsGenerating(false);
        }
      }, 16);
    } catch (e: any) {
      setAiError(e.message ?? "AI generation failed");
      setIsGenerating(false);
    }
  }, [topic, postType, tone, bizName, bizCat, isGenerating]);

  /* ── Generate BOTH text + image in parallel ── */
  const generateBoth = useCallback(async () => {
    if (!topic.trim() || isGenerating) return;
    generateText(); // manages its own loading state
    // Fire image in parallel — non-blocking
    try {
      const imgResult = await callGenerateImage({
        topic,
        postType,
        pageName: bizName,
        businessCategory: bizCat,
        style: imgStyle,
      });
      setAiImage(imgResult);
    } catch {
      /* image failure is non-fatal */
    }
  }, [topic, postType, bizName, bizCat, imgStyle, generateText, isGenerating]);

  /* ── Mutation ── */
  const postMutation = useMutation({
    mutationFn: publishPost,
    onSuccess: () => {
      submittingRef.current = false;
      alert("✅ Post published successfully!");
      router.push("/facebook/posts");
    },
    onError: () => {
      submittingRef.current = false;
    },
  });

  const uploadPhase =
    postMutation.isPending &&
    uploadProgress.total > 0 &&
    uploadProgress.current < uploadProgress.total;

  /* ── Validate + Submit ── */
  const handleSubmit = async () => {
    setValidErr("");
    if (submittingRef.current || postMutation.isPending) return;
    if (!text.trim()) {
      setValidErr("Post content is required.");
      return;
    }
    if (charCount > MAX_CHARS) {
      setValidErr("Content exceeds character limit.");
      return;
    }
    if (postType === "Link" && !link.trim()) {
      setValidErr("A link URL is required for Link posts.");
      return;
    }
    submittingRef.current = true;

    let uploadedUrls: string[] = [];
    if (images.length) {
      setUploadProgress({ current: 0, total: images.length });
      try {
        for (let idx = 0; idx < images.length; idx++) {
          uploadedUrls.push(await uploadImage(images[idx]));
          setUploadProgress({ current: idx + 1, total: images.length });
        }
      } catch (e: any) {
        setValidErr(e.message ?? "Image upload failed.");
        submittingRef.current = false;
        setUploadProgress({ current: 0, total: 0 });
        return;
      }
    }

    postMutation.mutate({
      message: text,
      postType,
      ...(link ? { link } : {}),
      ...(uploadedUrls.length ? { mediaUrls: uploadedUrls } : {}),
      scheduleTime: schedule,
    });
  };

  const isSubmitting = postMutation.isPending;
  const displayError = validErr || (postMutation.error?.message ?? "");

  // Shared card style
  const card = `rounded-2xl border ${dark ? "bg-[#0a1020] border-blue-900/30" : "bg-white border-blue-100/80 shadow-sm"}`;

  if (userLoading) {
    return (
      <div className={`min-h-screen ${dark ? "bg-[#050d1a]" : "bg-[#eef4ff]"}`}>
        <div className="max-w-2xl mx-auto px-4 pt-6 flex flex-col gap-4">
          {[...Array(5)].map((_, i) => (
            <Sk key={i} dark={dark} className={`h-${[8, 32, 40, 24, 14][i]}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors ${dark ? "bg-[#050d1a]" : "bg-[#eef4ff]"}`}
      style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}
    >
      {/* Dot grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.018] z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-3 pb-28 pt-6">
        {/* ── HEADER ── */}
        <div className="pt-2 pb-5">
          <div className="flex items-center gap-2 mb-0.5">
            <FacebookLogo />
            <h1
              className={`text-[22px] font-black tracking-tight ${dark ? "text-white" : "text-slate-900"}`}
              style={{ letterSpacing: "-0.04em" }}
            >
              Create Post
            </h1>
          </div>
          {bizName && (
            <p
              className="text-[12px] ml-[22px]"
              style={{ color: dark ? "#475569" : "rgba(59,130,246,0.8)" }}
            >
              {bizName}
            </p>
          )}
        </div>

        {/* Publish progress indicator */}
        {isSubmitting && (
          <div
            className={`flex items-center gap-3 p-3 rounded-2xl mb-4 border
            ${dark ? "bg-blue-500/[0.07] border-blue-500/20" : "bg-blue-50 border-blue-200"}`}
          >
            <Loader2
              size={15}
              className="text-blue-500 animate-spin shrink-0"
            />
            <p
              className="text-[11.5px] font-semibold"
              style={{ color: dark ? "#93c5fd" : "#2563eb" }}
            >
              {uploadPhase
                ? `Uploading photos ${uploadProgress.current}/${uploadProgress.total}…`
                : schedule
                  ? "Scheduling post…"
                  : "Publishing to Facebook…"}
            </p>
          </div>
        )}

        {/* ── POST TYPE SELECTOR ── */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {POST_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => !isSubmitting && setPostType(t.id)}
              disabled={isSubmitting}
              className={`flex flex-col items-center gap-1.5 py-3.5 px-2 rounded-2xl border transition-all active:scale-95 disabled:opacity-50
                ${
                  postType === t.id
                    ? dark
                      ? "border-blue-500/40 text-blue-400"
                      : "border-blue-300 text-blue-600"
                    : dark
                      ? "bg-[#0a1020] border-blue-900/30 text-slate-400"
                      : "bg-white border-blue-100/80 text-slate-500 shadow-sm"
                }`}
              style={
                postType === t.id
                  ? {
                      background: dark
                        ? "rgba(24,119,242,0.12)"
                        : "rgba(24,119,242,0.06)",
                    }
                  : {}
              }
            >
              <span className={postType === t.id ? "" : "opacity-60"}>
                {t.icon}
              </span>
              <span
                className={`text-[11.5px] font-bold ${postType === t.id ? "" : "opacity-70"}`}
              >
                {t.label}
              </span>
            </button>
          ))}
        </div>

        {/* ── TOPIC + GENERATE ── */}
        <div className={`${card} mb-4 overflow-hidden`}>
          <div
            className={`px-4 py-3 flex items-center gap-2 border-b ${dark ? "border-blue-900/30" : "border-blue-50"}`}
          >
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center ${dark ? "bg-blue-500/15" : "bg-blue-100"}`}
            >
              <Sparkles size={12} className="text-blue-400" />
            </div>
            <p
              className={`text-[12.5px] font-black ${dark ? "text-white" : "text-slate-900"}`}
            >
              Post Topic
            </p>
            <span
              className="ml-auto text-[9.5px] font-bold"
              style={{ color: dark ? "#334155" : "#94a3b8" }}
            >
              AI Powered
            </span>
          </div>
          <div className="p-4">
            {/* Topic input */}
            <div
              className={`flex items-center gap-2.5 h-12 px-3.5 rounded-2xl border mb-3 transition-all
              ${dark ? "bg-[#070f1e] border-blue-900/40 focus-within:border-blue-500/50" : "bg-blue-50/60 border-blue-100 focus-within:border-blue-300"}`}
            >
              <Sparkles
                size={13}
                style={{ color: dark ? "#334155" : "#94a3b8" }}
              />
              <input
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value);
                  setAiError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && topic.trim()) generateBoth();
                }}
                disabled={isSubmitting}
                placeholder="e.g. New product launch, weekend offer, team announcement…"
                className={`flex-1 bg-transparent outline-none text-[13px] font-medium disabled:opacity-50
                  ${dark ? "text-white placeholder:text-slate-700" : "text-slate-900 placeholder:text-slate-400"}`}
              />
              {topic && !isSubmitting && (
                <button
                  onClick={() => {
                    setTopic("");
                    setAiResult(null);
                    setText("");
                    setAiImage(null);
                  }}
                  style={{ color: dark ? "#334155" : "#94a3b8" }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Tone selector */}
            <div className="flex gap-2 mb-3">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl text-[11px] font-bold border transition-all active:scale-95
                    ${
                      tone === t.id
                        ? dark
                          ? "border-blue-500/35 text-blue-400"
                          : "border-blue-300/60 text-blue-600"
                        : dark
                          ? "bg-white/[0.03] border-blue-900/30 text-slate-500"
                          : "bg-slate-50 border-blue-100 text-slate-500"
                    }`}
                  style={
                    tone === t.id
                      ? {
                          background: dark
                            ? "rgba(24,119,242,0.1)"
                            : "rgba(24,119,242,0.06)",
                        }
                      : {}
                  }
                >
                  <span>{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Generate button */}
            <button
              onClick={generateBoth}
              disabled={!topic.trim() || isGenerating || isSubmitting}
              className="w-full h-12 rounded-2xl text-[13.5px] font-black text-white flex items-center justify-center gap-2.5 transition-all active:scale-[0.97] disabled:opacity-50 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg,#1e3a8a,#1d4ed8,#1877F2)",
                boxShadow: topic.trim()
                  ? "0 8px 24px rgba(24,119,242,0.4)"
                  : "none",
              }}
            >
              {isGenerating ? (
                <>
                  <Spin size={15} white /> Generating post + image…
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Generate AI Post + Image
                </>
              )}
            </button>

            {aiError && (
              <div
                className={`mt-2.5 flex items-center gap-2 px-3 py-2 rounded-xl border
                ${dark ? "bg-red-500/[0.07] border-red-900/40" : "bg-red-50 border-red-200/60"}`}
              >
                <AlertCircle size={12} className="text-red-400 shrink-0" />
                <p
                  className={`text-[11px] ${dark ? "text-red-400" : "text-red-600"}`}
                >
                  {aiError}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── POST CONTENT ── */}
        <div className={`${card} mb-4 overflow-hidden`}>
          <div
            className={`px-4 py-2.5 flex items-center gap-2 border-b ${dark ? "border-blue-900/30" : "border-blue-50"}`}
          >
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center ${dark ? "bg-blue-900/60" : "bg-blue-100"}`}
            >
              <NotebookText size={12} className="text-blue-400" />
            </div>
            <p
              className={`text-[12.5px] font-black ${dark ? "text-white" : "text-slate-900"}`}
            >
              Post Content
            </p>
            {text.length > 0 && !isSubmitting && (
              <button
                onClick={() => {
                  setText("");
                  setAiResult(null);
                }}
                className="ml-auto flex items-center gap-1 h-6 px-2 rounded-lg text-[10px] font-medium"
                style={{ color: dark ? "#334155" : "#94a3b8" }}
              >
                <Trash2 size={10} /> Clear
              </button>
            )}
          </div>

          {/* Skeleton during generation */}
          {isGenerating && text.length === 0 && (
            <div className="p-4 flex flex-col gap-2.5">
              {[...Array(5)].map((_, i) => (
                <Sk
                  key={i}
                  dark={dark}
                  className={`h-3 ${i === 4 ? "w-2/3" : "w-full"}`}
                />
              ))}
            </div>
          )}

          <div className={isGenerating && text.length === 0 ? "hidden" : ""}>
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setValidErr("");
              }}
              disabled={isSubmitting}
              placeholder="Your AI-generated post will appear here… or type manually ✍️"
              rows={8}
              className={`w-full bg-transparent outline-none text-[14px] leading-relaxed resize-none p-4 disabled:opacity-60
                ${dark ? "text-white placeholder:text-slate-700" : "text-slate-900 placeholder:text-slate-400"}`}
              style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}
            />
          </div>

          <div
            className={`flex items-center justify-between px-4 pb-3 pt-0 gap-2 border-t ${dark ? "border-blue-900/20" : "border-blue-50"}`}
          >
            <span
              className={`text-[11px] font-medium ${overLimit ? "text-red-400" : ""}`}
              style={{
                color: overLimit ? undefined : dark ? "#334155" : "#94a3b8",
              }}
            >
              {overLimit
                ? `${charCount - MAX_CHARS} over limit`
                : `${charCount} chars`}
            </span>
            {text.length > 0 && !isGenerating && !isSubmitting && (
              <button
                onClick={generateText}
                disabled={!topic.trim()}
                className={`flex items-center gap-1 h-7 px-2.5 rounded-xl text-[11px] font-medium transition-all active:scale-95 disabled:opacity-40
                  ${dark ? "text-slate-500 hover:text-blue-400 hover:bg-blue-500/10" : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"}`}
              >
                <RefreshCw size={10} /> Regenerate text
              </button>
            )}
          </div>
        </div>

        {/* ── AI IMAGE CARD ── */}
        {(postType === "Photo" || postType === "Text") && (
          <div className="mb-4">
            <AIImageCard
              title={topic}
              postType={postType}
              bizName={bizName}
              bizCat={bizCat}
              imgStyle={imgStyle}
              setImgStyle={setImgStyle}
              aiImage={aiImage}
              setAiImage={setAiImage}
              onImageAccepted={(url) =>
                setImages((prev) =>
                  prev.includes(url) ? prev : [url, ...prev],
                )
              }
              dark={dark}
              disabled={isSubmitting}
            />
          </div>
        )}

        {/* ── PHOTOS (manual upload) ── */}
        {(postType === "Photo" || postType === "Text") && (
          <div className={`${card} mb-4 p-4`}>
            <div className="flex items-center justify-between mb-3">
              <p
                className="text-[10.5px] font-black uppercase tracking-widest"
                style={{ color: dark ? "#475569" : "#94a3b8" }}
              >
                Photos
              </p>
              {images.length > 0 && (
                <span
                  className="text-[11px] font-medium"
                  style={{ color: dark ? "#334155" : "#94a3b8" }}
                >
                  {images.length}/10
                </span>
              )}
            </div>
            <ImageUpload
              images={images}
              onChange={setImages}
              dark={dark}
              disabled={isSubmitting}
            />
            {images.length > 0 && (
              <p
                className="text-[10px] mt-2"
                style={{ color: dark ? "#334155" : "#94a3b8" }}
              >
                First image is used as the post cover. Tap × to remove.
              </p>
            )}
          </div>
        )}

        {/* ── LINK INPUT ── */}
        {postType === "Link" && (
          <div className={`${card} mb-4 p-4`}>
            <p
              className="text-[10.5px] font-black uppercase tracking-widest mb-3"
              style={{ color: dark ? "#475569" : "#94a3b8" }}
            >
              Link URL
            </p>
            <div
              className={`flex items-center gap-2.5 h-11 px-3.5 rounded-2xl border
              ${dark ? "bg-[#070f1e] border-blue-900/40" : "bg-blue-50/60 border-blue-100"}`}
            >
              <Link2
                size={13}
                style={{ color: dark ? "#334155" : "#94a3b8" }}
              />
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                disabled={isSubmitting}
                placeholder="https://example.com"
                className={`flex-1 bg-transparent outline-none text-[13.5px] disabled:opacity-50
                  ${dark ? "text-white placeholder:text-slate-700" : "text-slate-900 placeholder:text-slate-400"}`}
              />
            </div>
          </div>
        )}

        {/* ── SCHEDULE ── */}
        <div className={`${card} mb-4 overflow-hidden`}>
          <div
            role="button"
            tabIndex={isSubmitting ? -1 : 0}
            onClick={() => !isSubmitting && setShowCal((v) => !v)}
            onKeyDown={(e) => { if (!isSubmitting && (e.key === "Enter" || e.key === " ")) setShowCal((v) => !v); }}
            aria-expanded={showCal}
            className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all cursor-pointer select-none
              ${isSubmitting ? "opacity-50 pointer-events-none" : ""}
              ${dark ? "hover:bg-white/[0.02]" : "hover:bg-blue-50/50"}`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border`}
              style={{
                background: schedule
                  ? "rgba(24,119,242,0.15)"
                  : dark
                    ? "rgba(30,58,138,0.3)"
                    : "rgba(219,234,254,0.6)",
                borderColor: schedule
                  ? "rgba(24,119,242,0.3)"
                  : dark
                    ? "rgba(30,58,138,0.4)"
                    : "rgba(219,234,254,0.8)",
              }}
            >
              <Calendar
                size={15}
                style={{
                  color: schedule ? "#1877F2" : dark ? "#475569" : "#94a3b8",
                }}
              />
            </div>
            <div className="flex-1 text-left">
              <p
                className={`text-[13px] font-semibold ${dark ? "text-white" : "text-slate-900"}`}
              >
                {schedule ? "Scheduled" : "Schedule for Later"}
              </p>
              <p
                className="text-[11px]"
                style={{
                  color: schedule ? "#1877F2" : dark ? "#475569" : "#94a3b8",
                }}
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
                  className="w-6 h-6 flex items-center justify-center rounded-lg"
                  style={{ color: dark ? "#475569" : "#94a3b8" }}
                >
                  <X size={13} />
                </button>
              )}
              <ChevronDown
                size={14}
                className={`transition-transform ${showCal ? "rotate-180" : ""}`}
                style={{ color: dark ? "#475569" : "#94a3b8" }}
              />
            </div>
          </div>
          {showCal && (
            <div
              className={`border-t p-3 ${dark ? "border-blue-900/30" : "border-blue-50"}`}
            >
              <CalendarPicker
                value={calDraft}
                onChange={(v) => {
                  setCalDraft(v);
                  setSchedule(v);
                }}
                dark={dark}
                onClose={() => setShowCal(false)}
              />
            </div>
          )}
        </div>

        {/* ── ERROR ── */}
        {displayError && (
          <div
            className={`flex items-start gap-2.5 p-3.5 rounded-2xl mb-4 border
            ${dark ? "bg-red-500/[0.07] border-red-500/20" : "bg-red-50 border-red-200"}`}
          >
            <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
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
                  className="text-[11px] font-semibold text-blue-400 mt-1"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── ACTION BUTTONS ── */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowPreview(true)}
            disabled={isSubmitting}
            className={`flex items-center gap-1.5 h-12 px-4 rounded-2xl text-[13px] font-semibold border transition-all active:scale-95 disabled:opacity-40
              ${dark ? "bg-[#0a1020] border-blue-900/40 text-slate-300" : "bg-white border-blue-100 text-slate-700 shadow-sm"}`}
          >
            <Eye size={15} /> Preview
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isGenerating || overLimit}
            className="flex-1 h-12 rounded-2xl text-[14px] font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg,#1d4ed8,#1877F2)",
              boxShadow: isSubmitting
                ? "none"
                : "0 4px 18px rgba(24,119,242,0.4)",
            }}
          >
            {isSubmitting ? (
              uploadPhase ? (
                <>
                  <Upload size={13} className="animate-bounce" /> Uploading{" "}
                  {uploadProgress.current}/{uploadProgress.total}…
                </>
              ) : (
                <>
                  <Spin size={14} white />{" "}
                  {schedule ? "Scheduling…" : "Publishing…"}
                </>
              )
            ) : (
              <>
                <Send size={14} /> {schedule ? "Schedule Post" : "Publish Now"}
              </>
            )}
          </button>
        </div>

        <p
          className="text-[10.5px] text-center mt-4 leading-relaxed"
          style={{ color: dark ? "#334155" : "#94a3b8" }}
        >
          Posts appear on your Facebook Page immediately (or at the scheduled
          time). Content must comply with{" "}
          <span className="text-blue-500 cursor-pointer">
            Facebook's Community Standards
          </span>
          .
        </p>
      </div>

      {/* ── PREVIEW MODAL ── */}
      {showPreview && (
        <PreviewModal
          text={text}
          images={images}
          postType={postType}
          link={link}
          schedule={schedule}
          dark={dark}
          bizName={bizName}
          onClose={() => setShowPreview(false)}
        />
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .no-scrollbar::-webkit-scrollbar { display:none }
        .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none }
      `}</style>
    </div>
  );
}
