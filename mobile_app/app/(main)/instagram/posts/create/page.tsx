"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useUser } from "@/features/user/hook/useUser";
import {
  Sparkles,
  Image as ImageIcon,
  X,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Eye,
  Upload,
  Loader2,
  Wand2,
  ArrowLeft,
  Hash,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Calendar,
  Clock,
  Target,
  Smile,
  Rocket,
  Camera,
  Palette,
  Minimize2,
  Film,
  Sunrise,
  type LucideIcon,
} from "lucide-react";
import { API } from "@/lib/axiosClient";

/* ═══════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════ */
const IG_GRADIENT =
  "linear-gradient(135deg, #833ab4 0%, #C13584 45%, #fd1d1d 80%, #fcb045 100%)";
const IG_ACCENT = "#C13584";
const MAX_CHARS = 2200;
const IMG_GEN_LIMIT = 4;
const IMG_GEN_KEY_DATE = "ig_img_gen_date";
const IMG_GEN_KEY_COUNT = "ig_img_gen_count";

type Tone = "Professional" | "Friendly" | "Enthusiastic";
type ImgStyle = "photorealistic" | "illustration" | "minimalist" | "cinematic" | "warm";

const TONES: { id: Tone; icon: LucideIcon; label: string }[] = [
  { id: "Professional", icon: Target, label: "Professional" },
  { id: "Friendly", icon: Smile, label: "Friendly" },
  { id: "Enthusiastic", icon: Rocket, label: "Enthusiastic" },
];

const IMG_STYLES: { id: ImgStyle; icon: LucideIcon; label: string }[] = [
  { id: "photorealistic", icon: Camera, label: "Photo" },
  { id: "illustration", icon: Palette, label: "Illustration" },
  { id: "minimalist", icon: Minimize2, label: "Minimal" },
  { id: "cinematic", icon: Film, label: "Cinematic" },
  { id: "warm", icon: Sunrise, label: "Warm" },
];

interface ScheduleDate {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

interface AIResult {
  content: string;
  seoScore: number;
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

/* ═══════════════════════════════════════════════════════
   SCHEDULE HELPERS
═══════════════════════════════════════════════════════ */
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const getFirstDay = (y: number, m: number) => new Date(y, m, 1).getDay();
const pad = (n: number) => String(n).padStart(2, "0");
const formatSchedule = (s: ScheduleDate) =>
  `${MONTHS[s.month].slice(0, 3)} ${s.day}, ${s.year} at ${pad(s.hour)}:${pad(s.minute)}`;
function nowDate(): ScheduleDate {
  const d = new Date();
  return {
    year: d.getFullYear(), month: d.getMonth(), day: d.getDate(),
    hour: d.getHours(), minute: Math.ceil(d.getMinutes() / 15) * 15,
  };
}

/* ═══════════════════════════════════════════════════════
   DAILY LIMIT HELPERS
═══════════════════════════════════════════════════════ */
function getImgGenCount(): number {
  if (typeof window === "undefined") return 0;
  const today = new Date().toDateString();
  const storedDate = localStorage.getItem(IMG_GEN_KEY_DATE);
  if (storedDate !== today) {
    localStorage.setItem(IMG_GEN_KEY_DATE, today);
    localStorage.setItem(IMG_GEN_KEY_COUNT, "0");
    return 0;
  }
  return parseInt(localStorage.getItem(IMG_GEN_KEY_COUNT) ?? "0", 10);
}

function incrementImgGenCount(): number {
  const next = getImgGenCount() + 1;
  localStorage.setItem(IMG_GEN_KEY_COUNT, String(next));
  return next;
}

/* ═══════════════════════════════════════════════════════
   API FUNCTIONS
═══════════════════════════════════════════════════════ */
async function uploadToCloudinary(base64: string): Promise<string> {
  const res = await fetch(base64);
  const blob = await res.blob();
  const form = new FormData();
  form.append("file", blob, "image.jpg");
  const r = await fetch("/api/upload", { method: "POST", body: form });
  const d = await r.json();
  if (!d.secure_url) throw new Error("Image upload failed");
  return d.secure_url as string;
}

async function publishInstagramPost(body: {
  imageUrl: string;
  caption: string;
  scheduleTime?: ScheduleDate | null;
}): Promise<void> {
  const { scheduleTime, ...rest } = body;
  const payload: Record<string, unknown> = { ...rest };
  if (scheduleTime) {
    const { year, month, day, hour, minute } = scheduleTime;
    payload.scheduledPublishTime = Math.floor(new Date(year, month, day, hour, minute).getTime() / 1000);
  }
  const res = await API.post("/instagram/posts/create", payload);
  if (!res.data.success) throw new Error(res.data.message ?? "Post failed");
}

async function callGenerateCaption(params: {
  topic: string;
  accountName: string;
  businessCategory: string;
  tone: string;
  keywords: string[];
}): Promise<AIResult> {
  const res = await fetch("/api/ai/instagram-post-content", {
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
  caption: string;
  accountName: string;
  businessCategory: string;
  style: string;
  seed?: number;
}): Promise<ImageResult> {
  const res = await fetch("/api/ai/instagram-generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Image generation failed");
  return json as ImageResult;
}

/* ═══════════════════════════════════════════════════════
   CALENDAR PICKER
═══════════════════════════════════════════════════════ */
function CalendarPicker({
  value, onChange, dark, onClose,
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
  const cells = Array(first).fill(null).concat(Array.from({ length: days }, (_, i) => i + 1));

  const isToday = (d: number) =>
    d === today.getDate() && view.month === today.getMonth() && view.year === today.getFullYear();
  const isSelected = (d: number) =>
    d === value.day && view.month === value.month && view.year === value.year;
  const isPast = (d: number) =>
    new Date(view.year, view.month, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const prev = () => setView((v) => v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 });
  const next = () => setView((v) => v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 });

  return (
    <div className={`rounded-2xl border overflow-hidden ${dark ? "bg-[#0d0814] border-pink-900/40" : "bg-white border-pink-100"}`}>
      {/* Month nav */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${dark ? "border-pink-900/30" : "border-pink-50"}`}>
        <button onClick={prev} className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all active:scale-90 ${dark ? "text-slate-400 hover:bg-white/[0.04]" : "text-slate-500 hover:bg-pink-50"}`}>
          <ChevronLeft size={15} />
        </button>
        <span className={`text-[13px] font-bold ${dark ? "text-white" : "text-slate-900"}`}>
          {MONTHS[view.month]} {view.year}
        </span>
        <button onClick={next} className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all active:scale-90 ${dark ? "text-slate-400 hover:bg-white/[0.04]" : "text-slate-500 hover:bg-pink-50"}`}>
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Day grid */}
      <div className="p-3">
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-bold py-1" style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((d, i) => (
            <div key={i}>
              {d === null ? <div /> : (
                <button
                  disabled={isPast(d)}
                  onClick={() => onChange({ ...value, day: d, month: view.month, year: view.year })}
                  className={`w-full aspect-square flex items-center justify-center rounded-xl text-[12px] font-medium transition-all active:scale-90 disabled:opacity-25
                    ${isSelected(d) ? "text-white" : isToday(d) ? dark ? "text-pink-400" : "text-pink-600" : dark ? "text-slate-300" : "text-slate-700"}`}
                  style={
                    isSelected(d)
                      ? { background: IG_ACCENT }
                      : isToday(d)
                        ? { background: dark ? "rgba(193,53,132,0.18)" : "rgba(193,53,132,0.08)" }
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

      {/* Time picker */}
      <div className={`px-4 py-3 border-t ${dark ? "border-pink-900/30" : "border-pink-50"}`}>
        <div className="flex items-center gap-2">
          <Clock size={12} style={{ color: dark ? "#6b4f7a" : "#94a3b8" }} />
          <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}>Time</span>
          <div className="flex items-center gap-1.5 ml-auto">
            <select
              value={value.hour}
              onChange={(e) => onChange({ ...value, hour: +e.target.value })}
              className={`h-8 px-2 rounded-lg text-[13px] font-medium outline-none border ${dark ? "bg-[#130820] border-pink-900/40 text-white" : "bg-pink-50 border-pink-100 text-slate-900"}`}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{pad(i)}</option>
              ))}
            </select>
            <span style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}>:</span>
            <select
              value={value.minute}
              onChange={(e) => onChange({ ...value, minute: +e.target.value })}
              className={`h-8 px-2 rounded-lg text-[13px] font-medium outline-none border ${dark ? "bg-[#130820] border-pink-900/40 text-white" : "bg-pink-50 border-pink-100 text-slate-900"}`}
            >
              {[0, 15, 30, 45].map((m) => (
                <option key={m} value={m}>{pad(m)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-3 pt-1 flex gap-2">
        <button
          onClick={onClose}
          className={`flex-1 h-9 rounded-xl text-[13px] font-semibold border ${dark ? "bg-white/[0.04] border-pink-900/40 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}
        >
          Cancel
        </button>
        <button
          onClick={onClose}
          className="flex-1 h-9 rounded-xl text-[13px] font-bold text-white"
          style={{ background: IG_GRADIENT }}
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SEO SCORE METER
═══════════════════════════════════════════════════════ */
function seoGrade(score: number): { label: string; color: string; bg: string } {
  if (score >= 85) return { label: "Excellent", color: "#22c55e", bg: "rgba(34,197,94,0.1)" };
  if (score >= 70) return { label: "Good",      color: "#3b82f6", bg: "rgba(59,130,246,0.1)" };
  if (score >= 50) return { label: "Needs Work", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" };
  return                    { label: "Poor",      color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
}

function SEOMeter({ score, tips, dark }: { score: number; tips: string[]; dark: boolean }) {
  const { label, color, bg } = seoGrade(score);
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`rounded-2xl border overflow-hidden ${dark ? "bg-[#130820] border-pink-900/30" : "bg-white border-pink-100/80 shadow-sm"}`}
    >
      <button
        onClick={() => tips.length > 0 && setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3"
      >
        <div className="relative shrink-0" style={{ width: 44, height: 44 }}>
          <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
            <circle
              cx="22" cy="22" r="18" fill="none"
              stroke={color} strokeWidth="4" strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 113} 113`}
              style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-black" style={{ color }}>{score}</span>
          </div>
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2 mb-0.5">
            <p className={`text-[13px] font-black ${dark ? "text-white" : "text-slate-900"}`}>
              Engagement Score
            </p>
            <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full" style={{ background: bg, color }}>
              {label}
            </span>
          </div>
          <p className={`text-[10.5px] ${dark ? "text-slate-500" : "text-slate-400"}`}>
            {tips.length === 0
              ? "Caption is fully optimised! 🎉"
              : `${tips.length} improvement${tips.length > 1 ? "s" : ""} available`}
          </p>
        </div>
        {tips.length > 0 && (
          <ChevronDown
            size={14}
            className={`transition-transform shrink-0 ${dark ? "text-slate-600" : "text-slate-300"} ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>
      {open && tips.length > 0 && (
        <div
          className={`border-t px-4 py-3 flex flex-col gap-2 ${dark ? "border-pink-900/30" : "border-pink-50"}`}
        >
          {tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2">
              <Lightbulb size={11} className="text-amber-400 shrink-0 mt-0.5" />
              <p className={`text-[11px] ${dark ? "text-slate-400" : "text-slate-600"}`}>{tip}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   KEYWORD PANEL
═══════════════════════════════════════════════════════ */
function KeywordPanel({
  embedded, suggested, extras, onAdd, onRemove, dark,
}: {
  embedded: string[];
  suggested: string[];
  extras: string[];
  onAdd: (k: string) => void;
  onRemove: (k: string) => void;
  dark: boolean;
}) {
  const [custom, setCustom] = useState("");
  return (
    <div
      className={`rounded-2xl border overflow-hidden ${dark ? "bg-[#130820] border-pink-900/30" : "bg-white border-pink-100/80 shadow-sm"}`}
    >
      <div
        className={`px-4 py-2.5 flex items-center gap-2 border-b ${dark ? "border-pink-900/30" : "border-pink-50"}`}
      >
        <Hash size={12} style={{ color: IG_ACCENT }} />
        <p className={`text-[12.5px] font-black ${dark ? "text-white" : "text-slate-900"}`}>
          Keywords & Hashtags
        </p>
        <span className={`ml-auto text-[9.5px] font-bold ${dark ? "text-slate-600" : "text-slate-400"}`}>
          {embedded.length} embedded
        </span>
      </div>
      <div className="p-3 flex flex-col gap-2.5">
        {embedded.length > 0 && (
          <div>
            <p className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${dark ? "text-slate-700" : "text-slate-400"}`}>
              In Your Caption
            </p>
            <div className="flex flex-wrap gap-1.5">
              {embedded.map((kw) => (
                <div
                  key={kw}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}
                >
                  <CheckCircle2 size={9} className="text-emerald-400" />
                  <span className="text-[10px] font-bold text-emerald-400">{kw}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {extras.length > 0 && (
          <div>
            <p className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${dark ? "text-slate-700" : "text-slate-400"}`}>
              Your Keywords
            </p>
            <div className="flex flex-wrap gap-1.5">
              {extras.map((kw) => (
                <button
                  key={kw}
                  onClick={() => onRemove(kw)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(193,53,132,0.1)", border: "1px solid rgba(193,53,132,0.25)" }}
                >
                  <span className="text-[10px] font-bold" style={{ color: IG_ACCENT }}>{kw}</span>
                  <X size={8} style={{ color: IG_ACCENT }} />
                </button>
              ))}
            </div>
          </div>
        )}
        {suggested.length > 0 && (
          <div>
            <p className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${dark ? "text-slate-700" : "text-slate-400"}`}>
              Suggested
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggested.map((kw) => (
                <button
                  key={kw}
                  onClick={() => onAdd(kw)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-all active:scale-95 border ${dark ? "bg-white/[0.04] border-white/[0.07]" : "bg-slate-50 border-slate-200"}`}
                >
                  <Plus size={8} className={dark ? "text-slate-500" : "text-slate-400"} />
                  <span className={`text-[10px] font-bold ${dark ? "text-slate-400" : "text-slate-600"}`}>{kw}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div
          className={`flex items-center gap-2 h-8 px-2.5 rounded-xl border ${dark ? "bg-white/[0.03] border-pink-900/30" : "bg-slate-50 border-pink-100"}`}
        >
          <Plus size={10} className={dark ? "text-slate-600" : "text-slate-400"} />
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && custom.trim()) {
                onAdd(custom.trim());
                setCustom("");
              }
            }}
            placeholder="Add keyword…"
            className={`flex-1 bg-transparent outline-none text-[11.5px] ${dark ? "text-white placeholder:text-slate-700" : "text-slate-900 placeholder:text-slate-400"}`}
          />
          {custom.trim() && (
            <button
              onClick={() => { onAdd(custom.trim()); setCustom(""); }}
              className="text-[9.5px] font-black"
              style={{ color: IG_ACCENT }}
            >
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   AI IMAGE CARD
═══════════════════════════════════════════════════════ */
function AIImageCard({
  topic, caption, accountName, bizCat,
  imgStyle, setImgStyle,
  aiImage, setAiImage,
  onImageAccepted, dark, disabled,
  externalGenerating,
}: {
  topic: string; caption: string; accountName: string; bizCat: string;
  imgStyle: ImgStyle; setImgStyle: (s: ImgStyle) => void;
  aiImage: ImageResult | null; setAiImage: (r: ImageResult | null) => void;
  onImageAccepted: (url: string) => void;
  dark: boolean; disabled: boolean;
  externalGenerating?: boolean;
}) {
  const [generating, setGenerating] = useState(false);
  const [imgError, setImgError] = useState("");
  const [genCount, setGenCount] = useState(0);

  useEffect(() => {
    setGenCount(getImgGenCount());
  }, [externalGenerating]);

  const remaining = IMG_GEN_LIMIT - genCount;
  const limitReached = remaining <= 0;

  const generate = useCallback(async (forceNewSeed = false) => {
    if (!topic.trim() || generating || disabled || limitReached) return;
    setGenerating(true);
    setImgError("");
    try {
      const seed = forceNewSeed ? Math.floor(Math.random() * 999999) : (aiImage?.seed ?? undefined);
      const result = await callGenerateImage({
        topic, caption, accountName, businessCategory: bizCat, style: imgStyle, seed,
      });
      setAiImage(result);
      const newCount = incrementImgGenCount();
      setGenCount(newCount);
    } catch (e: any) {
      setImgError(e.message ?? "Image generation failed");
    } finally {
      setGenerating(false);
    }
  }, [topic, caption, accountName, bizCat, imgStyle, generating, disabled, limitReached, aiImage?.seed]);

  return (
    <div
      className={`rounded-2xl border overflow-hidden ${dark ? "bg-[#130820] border-pink-900/30" : "bg-white border-pink-100/80 shadow-sm"}`}
    >
      <div
        className={`px-4 py-2.5 flex items-center gap-2 border-b ${dark ? "border-pink-900/30" : "border-pink-50"}`}
      >
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(168,85,247,0.15)" }}>
          <Wand2 size={12} className="text-purple-400" />
        </div>
        <p className={`text-[12.5px] font-black ${dark ? "text-white" : "text-slate-900"}`}>AI Image</p>
        {aiImage && (
          <span className="text-[9px] font-black px-2 py-0.5 rounded-full ml-1 border"
            style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", borderColor: "rgba(34,197,94,0.25)" }}>
            Generated
          </span>
        )}
        <span
          className="ml-auto text-[9.5px] font-bold px-2 py-0.5 rounded-full border"
          style={{
            color: limitReached ? "#ef4444" : remaining <= 1 ? "#f59e0b" : dark ? "#6b4f7a" : "#94a3b8",
            borderColor: limitReached ? "rgba(239,68,68,0.3)" : remaining <= 1 ? "rgba(245,158,11,0.3)" : "transparent",
            background: limitReached ? "rgba(239,68,68,0.08)" : remaining <= 1 ? "rgba(245,158,11,0.08)" : "transparent",
          }}
        >
          {limitReached ? "Limit reached" : `${remaining} left today`}
        </span>
      </div>

      <div className="p-3 flex flex-col gap-3">
        {/* Style selector */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {IMG_STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => setImgStyle(s.id)}
              className={`flex items-center gap-1.5 shrink-0 h-8 px-2.5 rounded-xl text-[11px] font-bold border transition-all active:scale-95
                ${imgStyle === s.id
                  ? dark ? "bg-purple-500/15 border-purple-500/35 text-purple-400" : "bg-purple-50 border-purple-200 text-purple-600"
                  : dark ? "bg-white/[0.03] border-pink-900/30 text-slate-500" : "bg-slate-50 border-pink-100 text-slate-500"
                }`}
            >
              <s.icon
              size={12}
              color={imgStyle === s.id ? (dark ? "#c084fc" : "#9333ea") : (dark ? "#64748b" : "#94a3b8")}
            /> {s.label}
            </button>
          ))}
        </div>

        {/* Image area */}
        {(generating || externalGenerating) ? (
          <div
            className={`w-full rounded-2xl overflow-hidden relative ${dark ? "bg-[#0d0814]" : "bg-purple-50/60"}`}
            style={{ aspectRatio: "1/1" }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="relative flex items-center justify-center" style={{ width: 52, height: 52 }}>
                {[1, 2].map((i) => (
                  <div key={i} className="absolute inset-0 rounded-full border border-purple-500/40"
                    style={{ animation: `pulse-ring ${1.2 + i * 0.5}s ease-out infinite`, animationDelay: `${i * 0.3}s` }} />
                ))}
                <div className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow: "0 0 20px rgba(168,85,247,0.5)" }}>
                  <Wand2 size={20} className="text-white" />
                </div>
              </div>
              <p className={`text-[11px] font-semibold ${dark ? "text-purple-300" : "text-purple-600"}`}>
                Generating Instagram image…
              </p>
              <p className={`text-[9.5px] ${dark ? "text-slate-600" : "text-slate-400"}`}>FLUX AI · Square 1080×1080</p>
            </div>
            <style>{`
              @keyframes pulse-ring{0%{transform:scale(1);opacity:0.6}100%{transform:scale(1.7);opacity:0}}
            `}</style>
          </div>
        ) : aiImage ? (
          <div className="relative rounded-2xl overflow-hidden group" style={{ aspectRatio: "1/1" }}>
            <img src={aiImage.imageUrl} alt="AI generated" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <button
                onClick={() => onImageAccepted(aiImage.imageUrl)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-white text-[11px] font-black active:scale-95"
                style={{ background: "rgba(34,197,94,0.9)", boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}
              >
                <CheckCircle2 size={12} /> Use Image
              </button>
            </div>
            <div
              className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-center gap-2"
              style={{ background: "linear-gradient(0deg,rgba(0,0,0,0.7),transparent)" }}
            >
              <p className="text-white text-[10px] flex-1 truncate opacity-70">{aiImage.prompt.slice(0, 55)}…</p>
              <button
                onClick={() => generate(true)}
                disabled={generating || limitReached}
                className="flex items-center gap-1 px-2 py-1 rounded-xl text-white text-[10px] font-black active:scale-95 disabled:opacity-50"
                style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
              >
                <RefreshCw size={9} /> New
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => generate(true)}
            disabled={!topic.trim() || generating || disabled || limitReached}
            className="w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-40"
            style={{
              aspectRatio: "1/1",
              borderColor: dark ? "rgba(168,85,247,0.25)" : "rgba(168,85,247,0.3)",
              background: dark ? "rgba(168,85,247,0.04)" : "rgba(168,85,247,0.03)",
            }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: dark ? "rgba(168,85,247,0.12)" : "rgba(168,85,247,0.1)" }}>
              <Wand2 size={22} className="text-purple-400" />
            </div>
            <div className="text-center">
              <p className={`text-[13px] font-black ${dark ? "text-purple-300" : "text-purple-600"}`}>
                {limitReached ? "Daily Limit Reached" : "Generate AI Image"}
              </p>
              <p className="text-[10.5px] mt-0.5" style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}>
                {limitReached
                  ? "4 images used · Resets tomorrow"
                  : topic.trim() ? `FLUX AI · Square · ${remaining} of ${IMG_GEN_LIMIT} left today` : "Enter a topic first"}
              </p>
            </div>
          </button>
        )}

        {imgError && (
          <div className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border ${dark ? "bg-red-500/[0.07] border-red-900/40" : "bg-red-50 border-red-200/60"}`}>
            <AlertCircle size={12} className="text-red-400 shrink-0 mt-0.5" />
            <p className={`text-[10.5px] ${dark ? "text-red-400" : "text-red-600"}`}>{imgError}</p>
          </div>
        )}

        {aiImage && !generating && !externalGenerating && (
          <div className="flex gap-2">
            <button
              onClick={() => onImageAccepted(aiImage.imageUrl)}
              className="flex-1 h-9 rounded-2xl text-[12px] font-black text-white flex items-center justify-center gap-1.5 active:scale-95"
              style={{ background: "linear-gradient(135deg,#16a34a,#22c55e)", boxShadow: "0 4px 16px rgba(34,197,94,0.3)" }}
            >
              <CheckCircle2 size={12} /> Add to Post
            </button>
            <button
              onClick={() => generate(true)}
              disabled={generating || externalGenerating || limitReached}
              className={`flex items-center gap-1.5 h-9 px-3 rounded-2xl text-[11.5px] font-bold border active:scale-95 disabled:opacity-50
                ${dark ? "bg-white/[0.04] border-pink-900/40 text-purple-400" : "bg-purple-50 border-purple-200/60 text-purple-600"}`}
            >
              <RefreshCw size={11} /> Regen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PHOTO UPLOAD
═══════════════════════════════════════════════════════ */
function PhotoUpload({
  image, onChange, dark, disabled,
}: {
  image: string | null; onChange: (img: string | null) => void;
  dark: boolean; disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || disabled || !files[0]) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className={disabled ? "pointer-events-none opacity-50" : ""}>
      {image ? (
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden group">
          <img src={image} alt="Post image" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />
          <button
            onClick={() => onChange(null)}
            className="absolute top-3 right-3 w-8 h-8 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={14} className="text-white" />
          </button>
          <div className="absolute bottom-3 left-3 px-2 py-1 rounded-lg text-white text-[10px] font-bold"
            style={{ background: "rgba(0,0,0,0.55)" }}>
            Hover → tap × to replace
          </div>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all active:scale-[0.98]"
          style={{
            borderColor: dark ? "rgba(193,53,132,0.3)" : "rgba(193,53,132,0.25)",
            background: dark ? "rgba(193,53,132,0.04)" : "rgba(193,53,132,0.02)",
          }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: IG_GRADIENT }}>
            <ImageIcon size={24} className="text-white" />
          </div>
          <div className="text-center">
            <p className={`text-[14px] font-black ${dark ? "text-white" : "text-slate-900"}`}>Add Photo</p>
            <p className="text-[11px] mt-0.5" style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}>
              Required · JPEG or PNG
            </p>
          </div>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PREVIEW MODAL
═══════════════════════════════════════════════════════ */
function PreviewModal({
  caption, image, dark, accountName, onClose,
}: {
  caption: string; image: string | null; dark: boolean;
  accountName: string; onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(14px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`w-full max-w-sm rounded-3xl overflow-hidden border shadow-2xl ${dark ? "bg-[#130820] border-pink-900/40" : "bg-white border-pink-100"}`}
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        <div className="h-1 w-full" style={{ background: IG_GRADIENT }} />
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: IG_GRADIENT }}>
            <span className="text-white font-black text-sm">{(accountName || "U")[0].toUpperCase()}</span>
          </div>
          <div>
            <p className={`text-[13px] font-bold ${dark ? "text-white" : "text-slate-900"}`}>{accountName || "your_account"}</p>
            <p className="text-[10px]" style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}>Just now</p>
          </div>
        </div>
        {image && <img src={image} alt="Preview" className="w-full aspect-square object-cover" />}
        <div className="p-4">
          <p className={`text-[13px] leading-relaxed ${dark ? "text-slate-300" : "text-slate-700"}`}>
            {caption || <span style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}>Your caption will appear here…</span>}
          </p>
        </div>
        <div className={`px-4 pb-4 border-t ${dark ? "border-pink-900/30" : "border-pink-50"}`}>
          <button
            onClick={onClose}
            className={`w-full h-10 mt-3 rounded-2xl text-[13px] font-semibold border ${dark ? "bg-white/[0.04] border-pink-900/40 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════ */
export default function InstagramCreatePostPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";

  const router = useRouter();
  const { data: user, isLoading: userLoading } = useUser();

  // Form
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<Tone>("Friendly");
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [validErr, setValidErr] = useState("");

  // Schedule
  const [schedule, setSchedule] = useState<ScheduleDate | null>(null);
  const [showCal, setShowCal] = useState(false);
  const [calDraft, setCalDraft] = useState<ScheduleDate>(nowDate());

  // AI caption
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [extraKeywords, setExtraKeywords] = useState<string[]>([]);

  // AI image
  const [imgStyle, setImgStyle] = useState<ImgStyle>("photorealistic");
  const [aiImage, setAiImage] = useState<ImageResult | null>(null);
  const [autoImgGenerating, setAutoImgGenerating] = useState(false);

  // Submit
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const submittingRef = useRef(false);

  const charCount = caption.length;
  const overLimit = charCount > MAX_CHARS;

  const accountName = user?.facebookPageName ?? "Your Account";
  const bizCat = user?.businessCategory ?? "";

  // Keyword helpers
  const addKeyword = (kw: string) => {
    if (!extraKeywords.includes(kw)) setExtraKeywords((p) => [...p, kw]);
  };
  const removeKeyword = (kw: string) => setExtraKeywords((p) => p.filter((k) => k !== kw));

  const allKeywords = [topic, accountName, ...(aiResult?.hashtags?.map((h) => h.replace("#", "")) ?? []), ...extraKeywords]
    .flatMap((s) => s.split(/\s+/))
    .map((k) => k.toLowerCase().trim().replace(/[^a-z0-9]/g, ""))
    .filter((k) => k.length > 3);
  const embeddedKeywords = [...new Set(allKeywords.filter((k) => caption.toLowerCase().includes(k)))].slice(0, 8);

  const generateCaption = useCallback(async () => {
    if (!topic.trim() || isGenerating) return;
    setIsGenerating(true);
    setAiError("");
    try {
      const result = await callGenerateCaption({
        topic, accountName, businessCategory: bizCat, tone, keywords: extraKeywords,
      });
      const final = result.content;
      let i = 0;
      setCaption("");
      const interval = setInterval(() => {
        i++;
        setCaption(final.slice(0, i));
        if (i >= final.length) {
          clearInterval(interval);
          setAiResult(result);
          setIsGenerating(false);
        }
      }, 12);
    } catch (e: any) {
      setAiError(e.message ?? "AI generation failed");
      setIsGenerating(false);
    }
  }, [topic, tone, accountName, bizCat, extraKeywords, isGenerating]);

  const generateBoth = useCallback(async () => {
    if (!topic.trim() || isGenerating) return;
    generateCaption();
    // Auto-generate image in parallel if daily limit not reached
    if (getImgGenCount() < IMG_GEN_LIMIT) {
      setAutoImgGenerating(true);
      try {
        const imgResult = await callGenerateImage({
          topic, caption, accountName, businessCategory: bizCat, style: imgStyle,
          seed: Math.floor(Math.random() * 999999),
        });
        setAiImage(imgResult);
        incrementImgGenCount();
      } catch {
        // image failure is non-fatal
      } finally {
        setAutoImgGenerating(false);
      }
    }
  }, [topic, caption, accountName, bizCat, imgStyle, isGenerating, generateCaption]);

  const postMutation = useMutation({
    mutationFn: publishInstagramPost,
    onSuccess: () => {
      submittingRef.current = false;
      router.push("/instagram/posts");
    },
    onError: () => {
      submittingRef.current = false;
    },
  });

  const handleSubmit = async () => {
    setValidErr("");
    if (submittingRef.current || postMutation.isPending) return;
    if (!image) { setValidErr("A photo is required for Instagram posts."); return; }
    if (overLimit) { setValidErr("Caption exceeds the 2,200 character limit."); return; }
    submittingRef.current = true;

    let imageUrl: string;
    setUploadingPhoto(true);
    try {
      imageUrl = await uploadToCloudinary(image);
    } catch (e: any) {
      setValidErr(e.message ?? "Image upload failed.");
      submittingRef.current = false;
      setUploadingPhoto(false);
      return;
    }
    setUploadingPhoto(false);
    postMutation.mutate({ imageUrl, caption, scheduleTime: schedule });
  };

  const isSubmitting = postMutation.isPending;
  const displayError = validErr || (postMutation.error?.message ?? "");

  const card = `rounded-2xl border ${dark ? "bg-[#130820] border-pink-900/30" : "bg-white border-pink-100/80 shadow-sm"}`;

  if (userLoading) {
    return (
      <div className={`min-h-screen ${dark ? "bg-[#0d0814]" : "bg-[#fdf0ff]"}`}>
        <div className="max-w-2xl mx-auto px-4 pt-6 flex flex-col gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`animate-pulse rounded-2xl h-24 ${dark ? "bg-pink-900/20" : "bg-pink-100/50"}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen transition-colors"
      style={{ backgroundColor: dark ? "#0d0814" : "#fdf0ff", fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}
    >
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.018] z-0"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #C13584 1px, transparent 0)", backgroundSize: "32px 32px" }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-3 pb-28 pt-6">
        {/* ── HEADER ── */}
        <div className="pt-2 pb-5">
          <button
            onClick={() => router.push("/instagram/posts")}
            className="flex items-center gap-1 text-[11px] font-bold mb-3"
            style={{ color: IG_ACCENT }}
          >
            <ArrowLeft size={12} /> Posts
          </button>
          <h1
            className={`text-[24px] font-black leading-tight ${dark ? "text-white" : "text-slate-900"}`}
            style={{ letterSpacing: "-0.04em" }}
          >
            Create Post
          </h1>
          {accountName && (
            <p className="text-[12px] mt-0.5" style={{ color: dark ? "#6b4f7a" : "rgba(193,53,132,0.7)" }}>
              {accountName}
            </p>
          )}
        </div>

        {/* Publish progress */}
        {isSubmitting && (
          <div className={`flex items-center gap-3 p-3 rounded-2xl mb-4 border ${dark ? "bg-pink-500/[0.07] border-pink-500/20" : "bg-pink-50 border-pink-200"}`}>
            <Loader2 size={15} className="animate-spin shrink-0" style={{ color: IG_ACCENT }} />
            <p className="text-[11.5px] font-semibold" style={{ color: dark ? "#f9a8d4" : "#9d174d" }}>
              {uploadingPhoto ? "Uploading photo…" : schedule ? "Scheduling post…" : "Publishing to Instagram…"}
            </p>
          </div>
        )}

        {/* ── AI CAPTION GENERATOR ── */}
        <div className={`${card} mb-4 overflow-hidden`}>
          <div className={`px-4 py-3 flex items-center gap-2 border-b ${dark ? "border-pink-900/30" : "border-pink-50"}`}>
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(193,53,132,0.15)" }}>
              <Sparkles size={12} style={{ color: IG_ACCENT }} />
            </div>
            <p className={`text-[12.5px] font-black ${dark ? "text-white" : "text-slate-900"}`}>Caption Topic</p>
            <span className="ml-auto text-[9.5px] font-bold" style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}>AI Powered</span>
          </div>
          <div className="p-4">
            <div
              className={`flex items-center gap-2.5 h-12 px-3.5 rounded-2xl border mb-3 ${dark ? "bg-[#0d0814] border-pink-900/40 focus-within:border-pink-500/50" : "bg-pink-50/60 border-pink-100 focus-within:border-pink-300"}`}
            >
              <Sparkles size={13} style={{ color: dark ? "#6b4f7a" : "#94a3b8" }} />
              <input
                value={topic}
                onChange={(e) => { setTopic(e.target.value); setAiError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter" && topic.trim()) generateBoth(); }}
                disabled={isSubmitting}
                placeholder="e.g. New product launch, weekend special, behind the scenes…"
                className={`flex-1 bg-transparent outline-none text-[13px] font-medium disabled:opacity-50 ${dark ? "text-white placeholder:text-slate-700" : "text-slate-900 placeholder:text-slate-400"}`}
              />
              {topic && !isSubmitting && (
                <button onClick={() => { setTopic(""); setCaption(""); setAiResult(null); setAiError(""); }} style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}>
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex gap-2 mb-3">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl text-[11px] font-bold border transition-all active:scale-95
                    ${tone === t.id
                      ? dark ? "border-pink-500/35 text-pink-400" : "border-pink-300/60 text-pink-600"
                      : dark ? "bg-white/[0.03] border-pink-900/30 text-slate-500" : "bg-slate-50 border-pink-100 text-slate-500"
                    }`}
                  style={tone === t.id ? { background: dark ? "rgba(193,53,132,0.12)" : "rgba(193,53,132,0.06)" } : {}}
                >
                  <t.icon
              size={12}
              color={tone === t.id ? (dark ? "#f472b6" : "#db2777") : (dark ? "#64748b" : "#94a3b8")}
            /> {t.label}
                </button>
              ))}
            </div>

            <button
              onClick={generateBoth}
              disabled={!topic.trim() || isGenerating || isSubmitting}
              className="w-full h-12 rounded-2xl text-[13.5px] font-black text-white flex items-center justify-center gap-2.5 transition-all active:scale-[0.97] disabled:opacity-50"
              style={{ background: IG_GRADIENT, boxShadow: topic.trim() ? "0 8px 24px rgba(193,53,132,0.4)" : "none" }}
            >
              {isGenerating ? (
                <><Loader2 size={15} className="animate-spin" /> Generating caption…</>
              ) : (
                <><Sparkles size={14} /> Generate AI Caption</>
              )}
            </button>

            {aiError && (
              <div className={`mt-2.5 flex items-center gap-2 px-3 py-2.5 rounded-xl border ${dark ? "bg-red-500/[0.07] border-red-900/40" : "bg-red-50 border-red-200/60"}`}>
                <AlertCircle size={12} className="text-red-400 shrink-0" />
                <p className={`text-[11px] ${dark ? "text-red-400" : "text-red-600"}`}>{aiError}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── CAPTION ── */}
        <div className={`${card} mb-4 overflow-hidden`}>
          <div className={`px-4 py-2.5 flex items-center gap-2 border-b ${dark ? "border-pink-900/30" : "border-pink-50"}`}>
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(193,53,132,0.12)" }}>
              <Hash size={12} style={{ color: IG_ACCENT }} />
            </div>
            <p className={`text-[12.5px] font-black ${dark ? "text-white" : "text-slate-900"}`}>Caption</p>
            {caption.length > 0 && !isSubmitting && (
              <button onClick={() => { setCaption(""); setAiResult(null); }}
                className="ml-auto flex items-center gap-1 h-6 px-2 rounded-lg text-[10px] font-medium" style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}>
                <Trash2 size={10} /> Clear
              </button>
            )}
          </div>

          {isGenerating && caption.length === 0 && (
            <div className="p-4 flex flex-col gap-2.5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`animate-pulse rounded-xl h-3 ${dark ? "bg-pink-900/30" : "bg-pink-100/50"} ${i === 4 ? "w-2/3" : "w-full"}`} />
              ))}
            </div>
          )}

          <div className={isGenerating && caption.length === 0 ? "hidden" : ""}>
            <textarea
              value={caption}
              onChange={(e) => { setCaption(e.target.value); setValidErr(""); }}
              disabled={isSubmitting}
              placeholder={"Your AI-generated caption will appear here… or write manually ✍️\n\nInclude hashtags at the end for best reach."}
              rows={8}
              className={`w-full bg-transparent outline-none text-[14px] leading-relaxed resize-none p-4 disabled:opacity-60 ${dark ? "text-white placeholder:text-slate-700" : "text-slate-900 placeholder:text-slate-400"}`}
              style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}
            />
          </div>

          <div className={`flex items-center justify-between px-4 pb-3 pt-0 gap-2 border-t ${dark ? "border-pink-900/20" : "border-pink-50"}`}>
            <span
              className={`text-[11px] font-medium ${overLimit ? "text-red-400" : ""}`}
              style={{ color: overLimit ? undefined : dark ? "#6b4f7a" : "#94a3b8" }}
            >
              {overLimit ? `${charCount - MAX_CHARS} over limit` : `${charCount} / ${MAX_CHARS}`}
            </span>
            {caption.length > 0 && !isGenerating && !isSubmitting && topic.trim() && (
              <button
                onClick={generateBoth}
                className={`flex items-center gap-1 h-7 px-2.5 rounded-xl text-[11px] font-medium transition-all active:scale-95 ${dark ? "text-slate-500 hover:text-pink-400 hover:bg-pink-500/10" : "text-slate-400 hover:text-pink-600 hover:bg-pink-50"}`}
              >
                <RefreshCw size={10} /> Regenerate
              </button>
            )}
          </div>
        </div>

        {/* ── AI IMAGE ── */}
        <div className="mb-4">
          <AIImageCard
            topic={topic} caption={caption} accountName={accountName} bizCat={bizCat}
            imgStyle={imgStyle} setImgStyle={setImgStyle}
            aiImage={aiImage} setAiImage={setAiImage}
            onImageAccepted={(url) => setImage(url)}
            dark={dark} disabled={isSubmitting}
            externalGenerating={autoImgGenerating}
          />
        </div>

        {/* ── PHOTO ── */}
        <div className={`${card} mb-4 p-4`}>
          <p className="text-[10.5px] font-black uppercase tracking-widest mb-3" style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}>
            Photo <span className="text-red-400">*</span>
          </p>
          <PhotoUpload image={image} onChange={setImage} dark={dark} disabled={isSubmitting} />
        </div>

        {/* ── SEO SCORE ── */}
        {aiResult && (
          <div className="mb-4">
            <SEOMeter score={aiResult.seoScore} tips={aiResult.tips} dark={dark} />
          </div>
        )}

        {/* ── KEYWORDS ── */}
        {aiResult && (
          <div className="mb-4">
            <KeywordPanel
              embedded={embeddedKeywords}
              suggested={aiResult.suggestedKeywords.filter((k) => !extraKeywords.includes(k))}
              extras={extraKeywords}
              onAdd={addKeyword}
              onRemove={removeKeyword}
              dark={dark}
            />
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
            className={`w-full flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none transition-all ${isSubmitting ? "opacity-50 pointer-events-none" : dark ? "hover:bg-white/[0.02]" : "hover:bg-pink-50/50"}`}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
              style={{
                background: schedule ? "rgba(193,53,132,0.15)" : dark ? "rgba(131,58,180,0.2)" : "rgba(253,240,255,0.8)",
                borderColor: schedule ? "rgba(193,53,132,0.35)" : dark ? "rgba(131,58,180,0.3)" : "rgba(253,240,255,1)",
              }}
            >
              <Calendar size={15} style={{ color: schedule ? IG_ACCENT : dark ? "#6b4f7a" : "#94a3b8" }} />
            </div>
            <div className="flex-1 text-left">
              <p className={`text-[13px] font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                {schedule ? "Scheduled" : "Schedule for Later"}
              </p>
              <p className="text-[11px]" style={{ color: schedule ? IG_ACCENT : dark ? "#6b4f7a" : "#94a3b8" }}>
                {schedule ? formatSchedule(schedule) : "Post immediately when published"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {schedule && (
                <button
                  onClick={(e) => { e.stopPropagation(); if (!isSubmitting) setSchedule(null); }}
                  className="w-6 h-6 flex items-center justify-center rounded-lg"
                  style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}
                >
                  <X size={13} />
                </button>
              )}
              <ChevronDown
                size={14}
                className={`transition-transform ${showCal ? "rotate-180" : ""}`}
                style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}
              />
            </div>
          </div>
          {showCal && (
            <div className={`border-t p-3 ${dark ? "border-pink-900/30" : "border-pink-50"}`}>
              <CalendarPicker
                value={calDraft}
                onChange={(v) => { setCalDraft(v); setSchedule(v); }}
                dark={dark}
                onClose={() => setShowCal(false)}
              />
            </div>
          )}
        </div>

        {/* ── ERROR ── */}
        {displayError && (
          <div className={`flex items-start gap-2.5 p-3.5 rounded-2xl mb-4 border ${dark ? "bg-red-500/[0.07] border-red-500/20" : "bg-red-50 border-red-200"}`}>
            <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-[13px] font-medium text-red-400">{displayError}</p>
              {postMutation.isError && (
                <button
                  onClick={() => { postMutation.reset(); setValidErr(""); submittingRef.current = false; }}
                  className="text-[11px] font-semibold mt-1"
                  style={{ color: IG_ACCENT }}
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── ACTIONS ── */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowPreview(true)}
            disabled={isSubmitting}
            className={`flex items-center gap-1.5 h-12 px-4 rounded-2xl text-[13px] font-semibold border transition-all active:scale-95 disabled:opacity-40 ${dark ? "bg-[#130820] border-pink-900/40 text-slate-300" : "bg-white border-pink-100 text-slate-700 shadow-sm"}`}
          >
            <Eye size={15} /> Preview
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isGenerating || overLimit}
            className="flex-1 h-12 rounded-2xl text-[14px] font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-60"
            style={{ background: IG_GRADIENT, boxShadow: isSubmitting ? "none" : "0 4px 18px rgba(193,53,132,0.4)" }}
          >
            {isSubmitting ? (
              uploadingPhoto
                ? <><Upload size={13} className="animate-bounce" /> Uploading…</>
                : <><Loader2 size={14} className="animate-spin" /> {schedule ? "Scheduling…" : "Publishing…"}</>
            ) : (
              <><Send size={14} /> {schedule ? "Schedule Post" : "Publish Now"}</>
            )}
          </button>
        </div>

        <p className="text-[10.5px] text-center mt-4 leading-relaxed" style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}>
          Posts appear on your Instagram Business Account immediately. Content must comply with Instagram's Community Standards.
        </p>
      </div>

      {showPreview && (
        <PreviewModal caption={caption} image={image} dark={dark} accountName={accountName} onClose={() => setShowPreview(false)} />
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display:none }
        .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none }
      `}</style>
    </div>
  );
}
