// mobile_app\app\(main)\post\create\page.tsx

// mobile_app/app/(main)/post/create/page.tsx
//
// ENHANCED v2: AI-generated images + smart re-generation optimization
//
// KEY OPTIMIZATION — Separate dirty flags prevent wasteful API calls:
//   imageKey   = hash(title + postType + businessName)
//                → only changes when image-relevant fields change
//                → regenerating description does NOT change imageKey → no image API call
//   textDirty  = title / postType / tone / keywords changed since last text generation
//                → only re-calls /api/ai/post-content when text inputs changed
//
// New image generation flow:
//   1. User types title → "Generate SEO Post" button
//   2. Both /api/ai/post-content AND /api/ai/generate-image are called IN PARALLEL
//   3. Image appears in the Photos card with style picker (Photorealistic/Illustration/etc.)
//   4. "Regenerate Image" button = new seed, same title → only calls image API
//   5. "Regenerate Text" button → only calls text API (image unchanged)
//   6. Style change → only calls image API (text unchanged)
//
// Image styles: Photorealistic | Illustration | Minimalist | Cinematic | Warm
//
// Deploy to: mobile_app/app/(main)/post/create/page.tsx

"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTheme } from "next-themes";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useUser } from "@/features/user/hook/useUser";
import {
  Sparkles, Image as ImageIcon, X, Calendar, Clock, Send,
  RefreshCw, ChevronDown, CheckCircle2, AlertCircle, Trash2,
  Eye, Zap, Tag, Link2, Phone, ShoppingBag, Plus,
  ChevronLeft, ChevronRight, Info, Upload, Loader2,
  Hash, Lightbulb, Brain, Type, Wand2,
} from "lucide-react";
import { useRouter } from "next/navigation";

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
type PostType = "STANDARD" | "EVENT" | "OFFER";
type CTA      = "BOOK" | "ORDER" | "SHOP" | "LEARN_MORE" | "SIGN_UP" | "CALL" | "NONE";
type Tone     = "Professional" | "Friendly" | "Enthusiastic";
type ImgStyle = "photorealistic" | "illustration" | "minimalist" | "cinematic" | "warm";

interface ScheduleDate { year: number; month: number; day: number; hour: number; minute: number; }
interface PostPayload   { payload: Record<string, any>; scheduleTime: ScheduleDate | null; }
interface AIResult {
  content: string; seoScore: number; tips: string[];
  hashtags: string[]; suggestedKeywords: string[]; wordCount: number; charCount: number;
}
interface ImageResult { imageUrl: string; prompt: string; provider: string; seed: number; }

/* ══════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════ */
const POST_TYPES: { id: PostType; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "STANDARD", label: "Update",  icon: <Zap size={14}/>,        desc: "Share news or updates" },
  { id: "EVENT",    label: "Event",   icon: <Calendar size={14}/>,    desc: "Promote an upcoming event" },
  { id: "OFFER",    label: "Offer",   icon: <ShoppingBag size={14}/>, desc: "Share a deal or discount" },
];
const CTA_OPTIONS: { id: CTA; label: string; icon: React.ReactNode }[] = [
  { id: "NONE",       label: "No Button",   icon: <X size={12}/> },
  { id: "LEARN_MORE", label: "Learn More",  icon: <Info size={12}/> },
  { id: "BOOK",       label: "Book",        icon: <Calendar size={12}/> },
  { id: "ORDER",      label: "Order Online",icon: <ShoppingBag size={12}/> },
  { id: "SHOP",       label: "Shop",        icon: <Tag size={12}/> },
  { id: "SIGN_UP",    label: "Sign Up",     icon: <Link2 size={12}/> },
  { id: "CALL",       label: "Call Now",    icon: <Phone size={12}/> },
];
const TONES: { id: Tone; emoji: string; label: string }[] = [
  { id: "Professional", emoji: "🎯", label: "Professional" },
  { id: "Friendly",     emoji: "😊", label: "Friendly" },
  { id: "Enthusiastic", emoji: "🚀", label: "Enthusiastic" },
];
const IMG_STYLES: { id: ImgStyle; emoji: string; label: string }[] = [
  { id: "photorealistic", emoji: "📸", label: "Photo" },
  { id: "illustration",   emoji: "🎨", label: "Illustration" },
  { id: "minimalist",     emoji: "⬜", label: "Minimal" },
  { id: "cinematic",      emoji: "🎬", label: "Cinematic" },
  { id: "warm",           emoji: "🌅", label: "Warm" },
];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const MAX_CHARS = 1500;

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const getFirstDay    = (y: number, m: number) => new Date(y, m, 1).getDay();
const pad            = (n: number) => String(n).padStart(2, "0");
const formatSchedule = (s: ScheduleDate) =>
  `${MONTHS[s.month].slice(0, 3)} ${s.day}, ${s.year} at ${pad(s.hour)}:${pad(s.minute)}`;
function now(): ScheduleDate {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate(), hour: d.getHours(), minute: Math.ceil(d.getMinutes() / 15) * 15 };
}
function seoGrade(score: number): { label: string; color: string; bg: string } {
  if (score >= 85) return { label: "Excellent", color: "#22c55e", bg: "rgba(34,197,94,0.1)" };
  if (score >= 70) return { label: "Good",       color: "#3b82f6", bg: "rgba(59,130,246,0.1)" };
  if (score >= 50) return { label: "Needs Work", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" };
  return                   { label: "Poor",       color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
}
// Simple hash to detect when image-relevant inputs changed
function makeImageKey(title: string, postType: string, bizName: string) {
  return `${title.trim().toLowerCase()}|${postType}|${bizName.toLowerCase()}`;
}

/* ══════════════════════════════════════════════════════════
   API FUNCTIONS
══════════════════════════════════════════════════════════ */
async function uploadImage(base64: string): Promise<string> {
  const res  = await fetch(base64);
  const blob = await res.blob();
  const form = new FormData();
  form.append("file", blob, "image.jpg");
  const r    = await fetch("/api/upload", { method: "POST", body: form });
  const data = await r.json();
  if (!data.secure_url) throw new Error("Image upload failed");
  return data.secure_url as string;
}

async function publishPost(body: PostPayload & { token: string }): Promise<void> {
  const { token, ...rest } = body;
  const res  = await fetch("/api/google/posts/create", {
    method:  "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body:    JSON.stringify(rest),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Post failed");
}

async function callGenerateContent(params: {
  title: string; postType: string; businessName: string;
  businessCategory: string; keywords: string[]; existingPosts: string[]; tone: string;
}): Promise<AIResult> {
  const res  = await fetch("/api/ai/post-content", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "AI generation failed");
  return json as AIResult;
}

async function callGenerateImage(params: {
  title: string; postType: string; businessName: string;
  businessCategory: string; style: string; seed?: number;
}): Promise<ImageResult> {
  const res  = await fetch("/api/ai/generate-image", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Image generation failed");
  return json as ImageResult;
}

/* ══════════════════════════════════════════════════════════
   AI IMAGE CARD
══════════════════════════════════════════════════════════ */
function AIImageCard({
  title, postType, bizName, bizCat, imgStyle, setImgStyle,
  aiImage, setAiImage, onImageAccepted, dark, disabled,
}: {
  title: string; postType: string; bizName: string; bizCat: string;
  imgStyle: ImgStyle; setImgStyle: (s: ImgStyle) => void;
  aiImage: ImageResult | null; setAiImage: (r: ImageResult | null) => void;
  onImageAccepted: (dataUrl: string) => void;
  dark: boolean; disabled: boolean;
}) {
  const [generating, setGenerating] = useState(false);
  const [imgError,   setImgError]   = useState("");
  const lastKeyRef                   = useRef("");

  // The "image key" — only regenerates when these change
  const imageKey = makeImageKey(title, postType, bizName);

  const generate = useCallback(async (forceNewSeed = false) => {
    if (!title.trim() || generating || disabled) return;
    setGenerating(true); setImgError("");
    try {
      const seed = forceNewSeed ? Math.floor(Math.random() * 999999) : (aiImage?.seed ?? undefined);
      const result = await callGenerateImage({ title, postType, businessName: bizName, businessCategory: bizCat, style: imgStyle, seed });
      setAiImage(result);
      lastKeyRef.current = imageKey;
    } catch (e: any) {
      setImgError(e.message ?? "Image generation failed");
    } finally {
      setGenerating(false);
    }
  }, [title, postType, bizName, bizCat, imgStyle, generating, disabled, aiImage?.seed, imageKey]);

  // Style change → regenerate with same seed (different style, same content)
  const handleStyleChange = (s: ImgStyle) => {
    setImgStyle(s);
  };
  // After style changes, user taps Regenerate → will use new style
  const handleStyleRegen = useCallback(async (s: ImgStyle) => {
    if (!title.trim() || generating || disabled) return;
    setGenerating(true); setImgError("");
    try {
      const result = await callGenerateImage({ title, postType, businessName: bizName, businessCategory: bizCat, style: s, seed: aiImage?.seed });
      setAiImage(result);
    } catch (e: any) { setImgError(e.message ?? "Failed"); }
    finally { setGenerating(false); }
  }, [title, postType, bizName, bizCat, aiImage?.seed, generating, disabled]);

  const card = `rounded-2xl border overflow-hidden ${dark ? "bg-[#0a1628] border-[#1a2d4a]" : "bg-white border-slate-200/80 shadow-sm"}`;

  return (
    <div className={card}>
      {/* header */}
      <div className={`px-4 py-2.5 flex items-center gap-2 border-b ${dark ? "border-[#1a2d4a]" : "border-slate-100"}`}>
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${dark ? "bg-purple-500/15" : "bg-purple-100"}`}>
          <Wand2 size={12} className="text-purple-400"/>
        </div>
        <p className={`text-[12.5px] font-black ${dark ? "text-white" : "text-slate-900"}`}>AI Image</p>
        {aiImage && (
          <span className="text-[9px] font-black px-2 py-0.5 rounded-full ml-1"
            style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
            Generated
          </span>
        )}
        {aiImage && (
          <span className={`ml-auto text-[9px] font-bold ${dark ? "text-slate-700" : "text-slate-300"}`}>
            via {aiImage.provider}
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col gap-3">
        {/* style selector */}
        <div>
          <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${dark ? "text-slate-700" : "text-slate-400"}`}>Image Style</p>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
            {IMG_STYLES.map(s => (
              <button key={s.id} onClick={() => handleStyleChange(s.id)}
                className={`flex items-center gap-1.5 shrink-0 h-8 px-2.5 rounded-xl text-[11px] font-bold border transition-all active:scale-95
                  ${imgStyle === s.id
                    ? dark ? "bg-purple-500/15 border-purple-500/35 text-purple-400" : "bg-purple-50 border-purple-300/60 text-purple-600"
                    : dark ? "bg-white/[0.03] border-white/[0.05] text-slate-500" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
                <span className="text-[13px]">{s.emoji}</span>{s.label}
              </button>
            ))}
          </div>
        </div>

        {/* image preview / placeholder */}
        {generating ? (
          /* loading state — animated skeleton with particle effect */
          <div className={`w-full rounded-2xl overflow-hidden relative ${dark ? "bg-[#0d1c36]" : "bg-slate-100"}`} style={{ aspectRatio: "16/9" }}>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              {/* pulsing brain orb */}
              <div className="relative flex items-center justify-center" style={{ width: 52, height: 52 }}>
                {[1,2].map(i => (
                  <div key={i} className="absolute inset-0 rounded-full border border-purple-500/40"
                    style={{ animation: `pulse-ring ${1.2 + i * 0.5}s ease-out infinite`, animationDelay: `${i * 0.3}s` }}/>
                ))}
                <div className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow: "0 0 20px rgba(168,85,247,0.5)" }}>
                  <Wand2 size={20} className="text-white"/>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-purple-400"
                      style={{ animation: "bounce 1s ease-in-out infinite", animationDelay: `${i * 0.15}s` }}/>
                  ))}
                </div>
                <p className={`text-[11px] font-semibold ${dark ? "text-purple-300" : "text-purple-600"}`}>
                  Generating image…
                </p>
                <p className={`text-[9.5px] ${dark ? "text-slate-600" : "text-slate-400"}`}>
                  Using FLUX AI model
                </p>
              </div>
            </div>
            {/* shimmer overlay */}
            <div className="absolute inset-0" style={{
              background: `linear-gradient(90deg,transparent 0%,${dark ? "rgba(168,85,247,0.06)" : "rgba(168,85,247,0.04)"} 50%,transparent 100%)`,
              animation: "shimmer 2s linear infinite",
            }}/>
            <style>{`
              @keyframes pulse-ring{0%{transform:scale(1);opacity:0.6}100%{transform:scale(1.7);opacity:0}}
              @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
              @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
            `}</style>
          </div>
        ) : aiImage ? (
          /* generated image */
          <div className="relative rounded-2xl overflow-hidden group" style={{ aspectRatio: "16/9" }}>
            <img
              src={aiImage.imageUrl}
              alt="AI generated"
              className="w-full h-full object-cover"
            />
            {/* hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 gap-3">
              {/* Use this image */}
              <button onClick={() => onImageAccepted(aiImage.imageUrl)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-white text-[11px] font-black transition-all active:scale-95"
                style={{ background: "rgba(34,197,94,0.9)", boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}>
                <CheckCircle2 size={13}/> Use Image
              </button>
            </div>
            {/* bottom bar */}
            <div className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-center gap-2"
              style={{ background: "linear-gradient(0deg,rgba(0,0,0,0.7),transparent)" }}>
              <p className="text-white text-[10px] font-medium flex-1 truncate opacity-70">{aiImage.prompt.slice(0, 60)}…</p>
              {/* Regenerate same style */}
              <button onClick={() => generate(true)} disabled={generating}
                className="flex items-center gap-1 px-2 py-1 rounded-xl text-white text-[10px] font-black transition-all active:scale-95 disabled:opacity-50"
                style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
                <RefreshCw size={10}/> New
              </button>
            </div>
          </div>
        ) : (
          /* placeholder — generate button */
          <button onClick={() => generate(true)} disabled={!title.trim() || generating || disabled}
            className={`w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-40`}
            style={{ aspectRatio: "16/9", borderColor: dark ? "rgba(168,85,247,0.25)" : "rgba(168,85,247,0.3)", background: dark ? "rgba(168,85,247,0.04)" : "rgba(168,85,247,0.03)" }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: dark ? "rgba(168,85,247,0.12)" : "rgba(168,85,247,0.1)" }}>
              <Wand2 size={22} className="text-purple-400"/>
            </div>
            <div className="text-center">
              <p className={`text-[13px] font-black ${dark ? "text-purple-300" : "text-purple-600"}`}>Generate AI Image</p>
              <p className={`text-[10.5px] mt-0.5 ${dark ? "text-slate-600" : "text-slate-400"}`}>
                {title.trim() ? "FLUX AI · Free · 1200×675" : "Enter a title first"}
              </p>
            </div>
          </button>
        )}

        {imgError && (
          <div className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border ${dark ? "bg-red-500/[0.07] border-red-900/40" : "bg-red-50 border-red-200/60"}`}>
            <AlertCircle size={12} className="text-red-400 shrink-0 mt-0.5"/>
            <div className="flex-1 min-w-0">
              <p className={`text-[10.5px] ${dark ? "text-red-400" : "text-red-600"}`}>{imgError}</p>
              <p className={`text-[9.5px] mt-0.5 ${dark ? "text-slate-600" : "text-slate-400"}`}>
                Add <code className="font-mono">TOGETHER_API_KEY</code> to .env for reliable generation.
              </p>
            </div>
          </div>
        )}

        {/* action row — only shown after generation */}
        {aiImage && !generating && (
          <div className="flex gap-2">
            <button onClick={() => onImageAccepted(aiImage.imageUrl)}
              className="flex-1 h-9 rounded-2xl text-[12px] font-black text-white flex items-center justify-center gap-1.5 transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg,#16a34a,#22c55e)", boxShadow: "0 4px 16px rgba(34,197,94,0.3)" }}>
              <CheckCircle2 size={13}/> Add to Post
            </button>
            <button onClick={() => handleStyleRegen(imgStyle)} disabled={generating}
              className={`flex items-center gap-1.5 h-9 px-3 rounded-2xl text-[11.5px] font-bold border transition-all active:scale-95 disabled:opacity-50 ${dark ? "bg-white/[0.04] border-white/[0.07] text-purple-400" : "bg-purple-50 border-purple-200/60 text-purple-600"}`}>
              <RefreshCw size={12}/> Regen Style
            </button>
            <button onClick={() => generate(true)} disabled={generating}
              className={`flex items-center gap-1.5 h-9 px-3 rounded-2xl text-[11.5px] font-bold border transition-all active:scale-95 disabled:opacity-50 ${dark ? "bg-white/[0.04] border-white/[0.07] text-slate-400" : "bg-slate-50 border-slate-200/60 text-slate-500"}`}>
              <RefreshCw size={12}/> New Seed
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SEO SCORE METER
══════════════════════════════════════════════════════════ */
function SEOMeter({ score, tips, dark }: { score: number; tips: string[]; dark: boolean }) {
  const { label, color, bg } = seoGrade(score);
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-2xl border overflow-hidden ${dark ? "bg-[#080f1e] border-blue-900/40" : "bg-white border-slate-200/80 shadow-sm"}`}>
      <button onClick={() => tips.length > 0 && setOpen(o => !o)} className="w-full flex items-center gap-3 px-4 py-3">
        <div className="relative shrink-0" style={{ width: 44, height: 44 }}>
          <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4"/>
            <circle cx="22" cy="22" r="18" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 113} 113`}
              style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}/>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-black" style={{ color }}>{score}</span>
          </div>
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2 mb-0.5">
            <p className={`text-[13px] font-black ${dark ? "text-white" : "text-slate-900"}`}>SEO Score</p>
            <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full" style={{ background: bg, color }}>{label}</span>
          </div>
          <p className={`text-[10.5px] ${dark ? "text-slate-500" : "text-slate-400"}`}>
            {tips.length === 0 ? "Your post is fully optimised! 🎉" : `${tips.length} improvement${tips.length > 1 ? "s" : ""} available`}
          </p>
        </div>
        {tips.length > 0 && <ChevronDown size={14} className={`transition-transform shrink-0 ${dark ? "text-slate-600" : "text-slate-300"} ${open ? "rotate-180" : ""}`}/>}
      </button>
      {open && tips.length > 0 && (
        <div className={`border-t px-4 py-3 flex flex-col gap-2 ${dark ? "border-blue-900/30" : "border-slate-100"}`}>
          {tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2">
              <Lightbulb size={11} className="text-amber-400 shrink-0 mt-0.5"/>
              <p className={`text-[11px] ${dark ? "text-slate-400" : "text-slate-600"}`}>{tip}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   KEYWORD CHIPS
══════════════════════════════════════════════════════════ */
function KeywordPanel({ embedded, suggested, extras, onAdd, onRemove, dark }: {
  embedded: string[]; suggested: string[]; extras: string[];
  onAdd: (k: string) => void; onRemove: (k: string) => void; dark: boolean;
}) {
  const [custom, setCustom] = useState("");
  return (
    <div className={`rounded-2xl border overflow-hidden ${dark ? "bg-[#080f1e] border-blue-900/40" : "bg-white border-slate-200/80 shadow-sm"}`}>
      <div className={`px-4 py-2.5 flex items-center gap-2 border-b ${dark ? "border-blue-900/30" : "border-slate-100"}`}>
        <Hash size={12} className="text-blue-400"/>
        <p className={`text-[12.5px] font-black ${dark ? "text-white" : "text-slate-900"}`}>Keywords</p>
        <span className={`ml-auto text-[9.5px] font-bold ${dark ? "text-slate-600" : "text-slate-400"}`}>{embedded.length} embedded</span>
      </div>
      <div className="p-3 flex flex-col gap-2.5">
        {embedded.length > 0 && (
          <div>
            <p className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${dark ? "text-slate-700" : "text-slate-400"}`}>In Your Post</p>
            <div className="flex flex-wrap gap-1.5">
              {embedded.map(kw => (
                <div key={kw} className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
                  <CheckCircle2 size={9} className="text-emerald-400"/>
                  <span className="text-[10px] font-bold text-emerald-400">{kw}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {extras.length > 0 && (
          <div>
            <p className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${dark ? "text-slate-700" : "text-slate-400"}`}>Your Keywords</p>
            <div className="flex flex-wrap gap-1.5">
              {extras.map(kw => (
                <button key={kw} onClick={() => onRemove(kw)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)" }}>
                  <span className="text-[10px] font-bold text-blue-400">{kw}</span>
                  <X size={8} className="text-blue-400"/>
                </button>
              ))}
            </div>
          </div>
        )}
        {suggested.length > 0 && (
          <div>
            <p className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${dark ? "text-slate-700" : "text-slate-400"}`}>Suggested</p>
            <div className="flex flex-wrap gap-1.5">
              {suggested.map(kw => (
                <button key={kw} onClick={() => onAdd(kw)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-all active:scale-95 ${dark ? "bg-white/[0.04] border-white/[0.07]" : "bg-slate-50 border-slate-200"} border`}>
                  <Plus size={8} className={dark ? "text-slate-500" : "text-slate-400"}/>
                  <span className={`text-[10px] font-bold ${dark ? "text-slate-400" : "text-slate-600"}`}>{kw}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className={`flex items-center gap-2 h-8 px-2.5 rounded-xl border ${dark ? "bg-white/[0.03] border-white/[0.06]" : "bg-slate-50 border-slate-200"}`}>
          <Plus size={10} className={dark ? "text-slate-600" : "text-slate-400"}/>
          <input value={custom} onChange={e => setCustom(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && custom.trim()) { onAdd(custom.trim()); setCustom(""); }}}
            placeholder="Add keyword…"
            className={`flex-1 bg-transparent outline-none text-[11.5px] ${dark ? "text-white placeholder:text-slate-700" : "text-slate-900 placeholder:text-slate-400"}`}/>
          {custom.trim() && <button onClick={() => { onAdd(custom.trim()); setCustom(""); }} className="text-blue-400 text-[9.5px] font-black">Add</button>}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ATOMS
══════════════════════════════════════════════════════════ */
function GeminiSparkle({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="overflow-visible shrink-0">
      <style>{`@keyframes gsp{0%,100%{transform:scale(1) rotate(0deg)}25%{transform:scale(1.2) rotate(10deg)}75%{transform:scale(1.1) rotate(-9deg)}}@keyframes gss1{0%,100%{stop-color:#60a5fa}50%{stop-color:#a5f3fc}}@keyframes gss2{0%,100%{stop-color:#818cf8}50%{stop-color:#60a5fa}}@keyframes gsd{0%,100%{opacity:.5}50%{opacity:1}}.gsp-s{transform-origin:12px 11px;animation:gsp 2.8s ease-in-out infinite}.gsp-1{animation:gss1 2.8s ease-in-out infinite}.gsp-2{animation:gss2 2.8s ease-in-out infinite .9s}.gsp-d{animation:gsd 2.8s ease-in-out infinite}.gsp-d2{animation:gsd 2.8s ease-in-out infinite 1.1s}`}</style>
      <defs><linearGradient id="gspg" x1="3" y1="2" x2="21" y2="20" gradientUnits="userSpaceOnUse"><stop offset="0%" className="gsp-1" stopColor="#60a5fa"/><stop offset="100%" className="gsp-2" stopColor="#818cf8"/></linearGradient></defs>
      <path className="gsp-s" d="M12 2L13.8 9.2L21 11L13.8 12.8L12 20L10.2 12.8L3 11L10.2 9.2L12 2Z" stroke="url(#gspg)" strokeWidth="1.5" strokeLinejoin="round" fill="url(#gspg)" fillOpacity=".25"/>
      <circle className="gsp-d" cx="19.5" cy="4.5" r="1.1" fill="url(#gspg)"/>
      <circle className="gsp-d2" cx="4.5" cy="19" r="0.9" fill="url(#gspg)"/>
    </svg>
  );
}
function Spin({ size = 16, white = false }: { size?: number; white?: boolean }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={white ? "white" : "currentColor"} strokeWidth="2.5" strokeOpacity="0.25"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke={white ? "white" : "currentColor"} strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}
function Skeleton({ isDark, className = "" }: { isDark: boolean; className?: string }) {
  return <div className={`animate-pulse rounded-xl ${isDark ? "bg-white/[0.07]" : "bg-slate-100"} ${className}`}/>;
}
function PageSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-28">
      <div className="flex items-center gap-3"><Skeleton isDark={isDark} className="w-8 h-8 rounded-xl"/><Skeleton isDark={isDark} className="h-5 w-36"/></div>
      <div className="flex gap-2">{[...Array(3)].map((_,i) => <Skeleton key={i} isDark={isDark} className="h-20 flex-1 rounded-2xl"/>)}</div>
      <Skeleton isDark={isDark} className="h-16 rounded-2xl"/><Skeleton isDark={isDark} className="h-40 rounded-2xl"/>
      <Skeleton isDark={isDark} className="h-[200px] rounded-2xl"/><Skeleton isDark={isDark} className="h-32 rounded-2xl"/>
    </div>
  );
}
function UploadProgress({ current, total, isDark }: { current: number; total: number; isDark: boolean }) {
  const pct = total ? Math.round((current / total) * 100) : 0;
  return (
    <div className={`rounded-2xl p-4 border flex flex-col gap-2.5 mb-4 ${isDark ? "bg-blue-500/[0.06] border-blue-500/20" : "bg-blue-50 border-blue-200"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Upload size={13} className="text-blue-500 animate-bounce"/><span className={`text-[12px] font-semibold ${isDark ? "text-blue-400" : "text-blue-600"}`}>Uploading photos… {current}/{total}</span></div>
        <span className={`text-[11px] font-bold ${isDark ? "text-blue-400" : "text-blue-600"}`}>{pct}%</span>
      </div>
      <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-white/[0.07]" : "bg-blue-100"}`}>
        <div className="h-full rounded-full bg-blue-500 transition-all duration-300" style={{ width: `${pct}%` }}/>
      </div>
    </div>
  );
}
function StepBadge({ step, isDark }: { step: "uploading" | "posting"; isDark: boolean }) {
  const steps = [{ id: "uploading", label: "Uploading photos" }, { id: "posting", label: "Publishing post" }];
  return (
    <div className={`flex items-center gap-3 p-3 rounded-2xl mb-4 border ${isDark ? "bg-blue-500/[0.07] border-blue-500/20" : "bg-blue-50 border-blue-200"}`}>
      <Loader2 size={15} className="text-blue-500 animate-spin shrink-0"/>
      <div className="flex-1">
        <div className="flex gap-1.5 mb-1.5">{steps.map((s,i) => <div key={s.id} className={`h-1 rounded-full transition-all duration-500 ${step === s.id ? "w-8 bg-blue-500" : steps.indexOf(steps.find(x => x.id === step)!) > i ? "w-4 bg-green-500" : "w-4 bg-white/[0.1]"}`}/>)}</div>
        <p className={`text-[11.5px] font-semibold ${isDark ? "text-blue-400" : "text-blue-600"}`}>{steps.find(s => s.id === step)?.label}…</p>
      </div>
    </div>
  );
}
function CalendarPicker({ value, onChange, isDark, onClose }: { value: ScheduleDate; onChange: (d: ScheduleDate) => void; isDark: boolean; onClose: () => void }) {
  const [view, setView] = useState({ year: value.year, month: value.month });
  const today = new Date(); const days = getDaysInMonth(view.year, view.month); const first = getFirstDay(view.year, view.month);
  const cells = Array(first).fill(null).concat(Array.from({ length: days }, (_, i) => i + 1));
  const isToday    = (d: number) => d === today.getDate() && view.month === today.getMonth() && view.year === today.getFullYear();
  const isSelected = (d: number) => d === value.day && view.month === value.month && view.year === value.year;
  const isPast     = (d: number) => new Date(view.year, view.month, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const prev = () => setView(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 });
  const next = () => setView(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 });
  return (
    <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-[#131c2d] border-white/[0.08]" : "bg-white border-black/[0.06]"}`}>
      <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? "border-white/[0.06]" : "border-slate-100"}`}>
        <button onClick={prev} className={`w-7 h-7 flex items-center justify-center rounded-lg ${isDark ? "text-slate-400" : "text-slate-500"}`}><ChevronLeft size={15}/></button>
        <span className={`text-[13px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{MONTHS[view.month]} {view.year}</span>
        <button onClick={next} className={`w-7 h-7 flex items-center justify-center rounded-lg ${isDark ? "text-slate-400" : "text-slate-500"}`}><ChevronRight size={15}/></button>
      </div>
      <div className="p-3">
        <div className="grid grid-cols-7 mb-1">{DAYS.map(d => <div key={d} className={`text-center text-[10px] font-bold py-1 ${isDark ? "text-slate-600" : "text-slate-400"}`}>{d}</div>)}</div>
        <div className="grid grid-cols-7 gap-0.5">{cells.map((d,i) => <div key={i}>{d === null ? <div/> : <button disabled={isPast(d)} onClick={() => onChange({ ...value, day: d, month: view.month, year: view.year })} className={`w-full aspect-square flex items-center justify-center rounded-xl text-[12px] font-medium transition-all active:scale-90 disabled:opacity-25 ${isSelected(d) ? "bg-blue-500 text-white" : isToday(d) ? isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-50 text-blue-600" : isDark ? "text-slate-300" : "text-slate-700"}`}>{d}</button>}</div>)}</div>
      </div>
      <div className={`px-4 py-3 border-t ${isDark ? "border-white/[0.06]" : "border-slate-100"}`}>
        <div className="flex items-center gap-2">
          <Clock size={13} className={isDark ? "text-slate-500" : "text-slate-400"}/>
          <span className={`text-[11px] font-semibold uppercase tracking-wide ${isDark ? "text-slate-500" : "text-slate-400"}`}>Time</span>
          <div className="flex items-center gap-1.5 ml-auto">
            <select value={value.hour} onChange={e => onChange({ ...value, hour: +e.target.value })} className={`h-8 px-2 rounded-lg text-[13px] font-medium outline-none border ${isDark ? "bg-[#182236] border-white/[0.07] text-white" : "bg-slate-50 border-black/[0.07] text-slate-900"}`}>
              {Array.from({ length: 24 }, (_,i) => <option key={i} value={i}>{pad(i)}</option>)}
            </select>
            <span className={isDark ? "text-slate-500" : "text-slate-400"}>:</span>
            <select value={value.minute} onChange={e => onChange({ ...value, minute: +e.target.value })} className={`h-8 px-2 rounded-lg text-[13px] font-medium outline-none border ${isDark ? "bg-[#182236] border-white/[0.07] text-white" : "bg-slate-50 border-black/[0.07] text-slate-900"}`}>
              {[0,15,30,45].map(m => <option key={m} value={m}>{pad(m)}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div className="px-4 pb-3 pt-1 flex gap-2">
        <button onClick={onClose} className={`flex-1 h-9 rounded-xl text-[13px] font-semibold ${isDark ? "bg-white/[0.07] text-slate-300" : "bg-slate-100 text-slate-600"}`}>Cancel</button>
        <button onClick={onClose} className="flex-1 h-9 rounded-xl text-[13px] font-bold text-white" style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>Confirm</button>
      </div>
    </div>
  );
}
function ImageUpload({ images, onChange, isDark, disabled }: { images: string[]; onChange: (imgs: string[]) => void; isDark: boolean; disabled?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFiles = (files: FileList | null) => {
    if (!files || disabled) return;
    Array.from(files).slice(0, 10 - images.length).forEach(file => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = e => onChange([...images, e.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };
  return (
    <div className={disabled ? "pointer-events-none opacity-50" : ""}>
      {images.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <div key={i} className="relative shrink-0 w-20 h-20 rounded-2xl overflow-hidden group">
              <img src={src} alt="" className="w-full h-full object-cover"/>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all"/>
              <button onClick={() => onChange(images.filter((_,idx) => idx !== i))}
                className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100">
                <X size={11} className="text-white"/>
              </button>
            </div>
          ))}
          {images.length < 10 && (
            <button onClick={() => inputRef.current?.click()}
              className={`shrink-0 w-20 h-20 rounded-2xl border-2 border-dashed flex items-center justify-center ${isDark ? "border-white/[0.12] text-slate-600" : "border-slate-200 text-slate-400"}`}>
              <Plus size={20}/>
            </button>
          )}
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()}
          className={`w-full h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 ${isDark ? "border-white/[0.1]" : "border-slate-200"}`}>
          <ImageIcon size={18} className={isDark ? "text-slate-500" : "text-slate-400"}/>
          <p className={`text-[12px] font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>Upload from device</p>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)}/>
    </div>
  );
}
function PreviewModal({ text, images, cta, schedule, isDark, onClose }: { text: string; images: string[]; cta: CTA; schedule: ScheduleDate | null; isDark: boolean; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center p-4" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)" }}>
      <div className={`w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl ${isDark ? "bg-[#131c2d]" : "bg-white"}`}>
        <div className="p-4">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center"><span className="text-white text-[12px] font-bold">B</span></div>
            <div>
              <p className={`text-[13px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Your Business</p>
              <p className={`text-[11px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>Google Business · {schedule ? formatSchedule(schedule) : "Now"}</p>
            </div>
          </div>
          {images.length > 0 && <img src={images[0]} alt="" className="w-full h-44 object-cover rounded-2xl mb-3"/>}
          <p className={`text-[13.5px] leading-relaxed mb-3 ${isDark ? "text-slate-300" : "text-slate-700"}`} style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}>
            {text || <span className={isDark ? "text-slate-600" : "text-slate-400"}>Your post content will appear here…</span>}
          </p>
          {cta !== "NONE" && (
            <div className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-semibold ${isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
              {CTA_OPTIONS.find(c => c.id === cta)?.icon}{CTA_OPTIONS.find(c => c.id === cta)?.label}
            </div>
          )}
        </div>
        <div className={`px-4 pb-4 pt-2 border-t ${isDark ? "border-white/[0.06]" : "border-slate-100"}`}>
          <button onClick={onClose} className={`w-full h-10 rounded-2xl text-[13px] font-semibold ${isDark ? "bg-white/[0.07] text-slate-300" : "bg-slate-100 text-slate-600"}`}>Close Preview</button>
        </div>
      </div>
    </div>
  );
}
function GoogleLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M21.805 10.023H12v3.977h5.617c-.245 1.36-1.017 2.514-2.164 3.29v2.73h3.503C20.938 18.202 22 15.298 22 12c0-.66-.069-1.305-.195-1.977z" fill="#4285F4"/>
      <path d="M12 22c2.97 0 5.46-.984 7.28-2.668l-3.503-2.73c-.984.66-2.245 1.05-3.777 1.05-2.9 0-5.36-1.958-6.24-4.59H2.15v2.817C3.96 19.983 7.7 22 12 22z" fill="#34A853"/>
      <path d="M5.76 13.062A6.05 6.05 0 0 1 5.44 12c0-.37.063-.73.163-1.062V8.121H2.15A9.987 9.987 0 0 0 2 12c0 1.61.387 3.13 1.07 4.477l3.69-2.817z" fill="#FBBC05"/>
      <path d="M12 5.958c1.637 0 3.105.563 4.26 1.667l3.195-3.195C17.455 2.693 14.965 1.6 12 1.6 7.7 1.6 3.96 3.617 2.15 7.12l3.61 2.817C6.64 7.305 9.1 5.958 12 5.958z" fill="#EA4335"/>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════ */
export default function GooglePostPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  const { data: user, isLoading: userLoading } = useUser();

  /* ── form state ── */
  const [postTitle,  setPostTitle]  = useState("");
  const [postType,   setPostType]   = useState<PostType>("STANDARD");
  const [tone,       setTone]       = useState<Tone>("Friendly");
  const [text,       setText]       = useState("");
  const [images,     setImages]     = useState<string[]>([]);
  const [cta,        setCta]        = useState<CTA>("LEARN_MORE");
  const [ctaUrl,     setCtaUrl]     = useState("");
  const [schedule,   setSchedule]   = useState<ScheduleDate | null>(null);
  const [showCal,    setShowCal]    = useState(false);
  const [calDraft,   setCalDraft]   = useState<ScheduleDate>(now());
  const [showPreview,setShowPreview]= useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [offerTitle, setOfferTitle] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [showCtaUrl, setShowCtaUrl] = useState(false);
  const [validErr,   setValidErr]   = useState("");

  /* ── AI text state ── */
  const [aiResult,        setAiResult]        = useState<AIResult | null>(null);
  const [extraKeywords,   setExtraKeywords]   = useState<string[]>([]);
  const [isGenerating,    setIsGenerating]    = useState(false);
  const [aiError,         setAiError]         = useState("");
  const [duplicateOpener, setDuplicateOpener] = useState("");

  /* ── AI image state ── */
  const [imgStyle,   setImgStyle]   = useState<ImgStyle>("photorealistic");
  const [aiImage,    setAiImage]    = useState<ImageResult | null>(null);

  /* ── upload progress ── */
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const submittingRef = useRef(false);

  const charCount = text.length;
  const remaining = MAX_CHARS - charCount;
  const overLimit = remaining < 0;

  /* ── recent posts (for duplicate detection) ── */
  const { data: recentPostsData } = useQuery({
    queryKey:  ["recent-posts", user?.googleLocationId],
    queryFn:   async () => {
      if (!user?.googleLocationId) return { posts: [] };
      const token = localStorage.getItem("accessToken");
      const res   = await fetch(`/api/google/posts?location=accounts/me/locations/${user.googleLocationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    enabled:   !!user?.googleLocationId,
    staleTime: 5 * 60_000,
  });
  const recentPosts: string[] = (recentPostsData?.posts ?? []).slice(0, 10).map((p: any) => p.summary ?? "").filter(Boolean);

  /* ── mutations ── */
  const postMutation = useMutation({
    mutationFn: publishPost,
    onSuccess:  () => { submittingRef.current = false; alert("✅ Post created successfully!"); router.push("/post"); },
    onError:    () => { submittingRef.current = false; },
  });

  const uploadPhase  = postMutation.isPending && uploadProgress.total > 0 && uploadProgress.current < uploadProgress.total;

  /* ══════════════════════════════════════════════════════
     SMART GENERATION — separate text and image calls
     
     generateBoth   → called when user first taps "Generate"
                      runs text + image in parallel
     generateText   → only re-calls /api/ai/post-content
                      (title/tone/keywords changed, image unchanged)
     (image regen)  → handled inside AIImageCard via its own state
  ══════════════════════════════════════════════════════ */

  /* ── text generation ── */
  const generateText = useCallback(async () => {
    if (!postTitle.trim() || isGenerating) return;
    setIsGenerating(true); setAiError(""); setDuplicateOpener("");
    try {
      const result = await callGenerateContent({
        title: postTitle, postType,
        businessName:     user?.googleLocationName ?? "our business",
        businessCategory: user?.businessCategory   ?? "",
        keywords: extraKeywords, existingPosts: recentPosts, tone,
      });
      // typewriter
      const final = result.content; let i = 0; setText("");
      const interval = setInterval(() => {
        i++; setText(final.slice(0, i));
        if (i >= final.length) {
          clearInterval(interval); setAiResult(result); setIsGenerating(false);
          const newOpening = final.split(/\s+/).slice(0, 5).join(" ").toLowerCase();
          const matched    = recentPosts.find(p => p.split(/\s+/).slice(0, 5).join(" ").toLowerCase() === newOpening);
          if (matched) setDuplicateOpener(final.split(/\s+/).slice(0, 5).join(" "));
        }
      }, 16);
    } catch (e: any) { setAiError(e.message ?? "AI generation failed"); setIsGenerating(false); }
  }, [postTitle, postType, tone, user, extraKeywords, recentPosts, isGenerating]);

  /* ── generate BOTH text + image in parallel (first generate) ── */
  const generateBoth = useCallback(async () => {
    if (!postTitle.trim() || isGenerating) return;
    // Fire text (handles its own state) and image in parallel
    generateText();  // starts typewriter, manages isGenerating
    // Image: fire independently — doesn't block text
    try {
      const imgResult = await callGenerateImage({
        title: postTitle, postType,
        businessName:     user?.googleLocationName ?? "",
        businessCategory: user?.businessCategory   ?? "",
        style: imgStyle,
      });
      setAiImage(imgResult);
    } catch {
      // image failure is non-fatal — AIImageCard shows its own error if user retries
    }
  }, [postTitle, postType, user, imgStyle, generateText, isGenerating]);

  /* ── keyword helpers ── */
  const addKeyword    = (kw: string) => { if (!extraKeywords.includes(kw)) setExtraKeywords(p => [...p, kw]); };
  const removeKeyword = (kw: string) => setExtraKeywords(p => p.filter(k => k !== kw));

  const allKeywords = [
    ...(user?.googleLocationName ?? "").split(/\s+/),
    postTitle,
    ...(aiResult?.hashtags?.map(h => h.replace("#", "")) ?? []),
    ...extraKeywords,
  ].map(k => k.toLowerCase().trim()).filter(k => k.length > 3);
  const embeddedKeywords = [...new Set(allKeywords.filter(k => text.toLowerCase().includes(k)))].slice(0, 8);

  /* ── validation ── */
  const validate = (): boolean => {
    if (!postTitle.trim())                          { setValidErr("Post title is required."); return false; }
    if (!text.trim())                               { setValidErr("Post content is required."); return false; }
    if (text.length > MAX_CHARS)                    { setValidErr(`Content exceeds ${MAX_CHARS} chars.`); return false; }
    if (postType === "EVENT" && !eventTitle.trim()) { setValidErr("Event title is required."); return false; }
    if (postType === "OFFER" && !offerTitle.trim()) { setValidErr("Offer title is required."); return false; }
    if (cta !== "NONE" && cta !== "CALL" && showCtaUrl && !ctaUrl.trim()) { setValidErr("CTA URL is required."); return false; }
    return true;
  };

  /* ── submit ── */
  const handleSubmit = async () => {
    setValidErr("");
    if (submittingRef.current || postMutation.isPending) return;
    if (!validate()) return;
    const token = localStorage.getItem("accessToken");
    if (!token) { setValidErr("Not authenticated."); return; }
    submittingRef.current = true;

    const payload: Record<string, any> = { languageCode: "en-US", summary: text, topicType: postType };
    if (cta !== "NONE") {
      payload.callToAction = { actionType: cta };
      if (cta !== "CALL" && ctaUrl) payload.callToAction.url = ctaUrl;
    }

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
    if (uploadedUrls.length) payload.media = uploadedUrls.map(url => ({ mediaFormat: "PHOTO", sourceUrl: url }));
    if (postType === "EVENT") payload.event = { title: eventTitle };
    if (postType === "OFFER") { payload.offer = { couponCode, redeemOnlineUrl: ctaUrl, termsConditions: "" }; payload.event = { title: offerTitle }; }

    postMutation.mutate({ payload, scheduleTime: schedule, token });
  };

  const isSubmitting = postMutation.isPending;
  const displayError = validErr || (postMutation.error?.message ?? "");

  if (userLoading) return <div className={`min-h-screen ${isDark ? "bg-[#0d1421]" : "bg-[#eef2fb]"}`}><PageSkeleton isDark={isDark}/></div>;

  const card = `rounded-2xl border ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05] shadow-sm"}`;
  const bizName = user?.googleLocationName ?? "";
  const bizCat  = user?.businessCategory  ?? "";

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-[#0d1421]" : "bg-[#eef2fb]"}`}
      style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}>
      <div className="max-w-lg mx-auto px-4 pb-28">

        {/* HEADER */}
        <div className="pt-4 pb-5">
          <div className="flex items-center gap-2 mb-0.5"><GoogleLogo/>
            <h1 className={`text-[18px] font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontFamily: "-apple-system,'SF Pro Display',sans-serif", letterSpacing: "-0.03em" }}>Create Post</h1>
          </div>
          {bizName && <p className={`text-[12px] ml-[22px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>{bizName}</p>}
        </div>

        {isSubmitting && <StepBadge step={uploadPhase ? "uploading" : "posting"} isDark={isDark}/>}
        {uploadPhase && uploadProgress.total > 1 && <UploadProgress current={uploadProgress.current} total={uploadProgress.total} isDark={isDark}/>}

        {/* POST TYPE */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {POST_TYPES.map(t => (
            <button key={t.id} onClick={() => !isSubmitting && setPostType(t.id)} disabled={isSubmitting}
              className={`flex flex-col items-center gap-1.5 py-3.5 px-2 rounded-2xl border transition-all active:scale-95 disabled:opacity-50
                ${postType === t.id ? isDark ? "bg-blue-500/15 border-blue-500/40 text-blue-400" : "bg-blue-50 border-blue-300 text-blue-600"
                                    : isDark ? "bg-[#131c2d] border-white/[0.06] text-slate-400" : "bg-white border-black/[0.05] text-slate-500 shadow-sm"}`}>
              <span className={postType === t.id ? "" : "opacity-60"}>{t.icon}</span>
              <span className={`text-[12px] font-bold ${postType === t.id ? "" : "opacity-70"}`}>{t.label}</span>
              <span className={`text-[10px] text-center leading-tight ${postType === t.id ? isDark ? "text-blue-500/70" : "text-blue-500/70" : isDark ? "text-slate-600" : "text-slate-400"}`}>{t.desc}</span>
            </button>
          ))}
        </div>

        {/* ── STEP 1: TITLE + GENERATE ── */}
        <div className={`${card} mb-4 overflow-hidden`}>
          <div className={`px-4 py-3 flex items-center gap-2 border-b ${isDark ? "border-white/[0.05]" : "border-slate-100"}`}>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? "bg-blue-500/15" : "bg-blue-100"}`}><Type size={12} className="text-blue-400"/></div>
            <p className={`text-[12.5px] font-black ${isDark ? "text-white" : "text-slate-900"}`}>Post Title</p>
            <span className={`ml-auto text-[10px] font-bold ${isDark ? "text-slate-600" : "text-slate-400"}`}>Step 1 of 2</span>
          </div>
          <div className="p-4">
            <div className={`flex items-center gap-2.5 h-12 px-3.5 rounded-2xl border mb-3 transition-all ${isDark ? "bg-[#0d1421] border-white/[0.07] focus-within:border-blue-500/50" : "bg-slate-50 border-black/[0.07] focus-within:border-blue-400"}`}>
              <Tag size={14} className={isDark ? "text-slate-600" : "text-slate-400"}/>
              <input value={postTitle} onChange={e => { setPostTitle(e.target.value); setAiError(""); }}
                onKeyDown={e => { if (e.key === "Enter" && postTitle.trim()) generateBoth(); }}
                disabled={isSubmitting} placeholder="e.g. Summer Sale 50% Off · New Menu Launch · Grand Opening"
                className={`flex-1 bg-transparent outline-none text-[13.5px] font-medium disabled:opacity-50 ${isDark ? "text-white placeholder:text-slate-600" : "text-slate-900 placeholder:text-slate-400"}`}/>
              {postTitle.length > 0 && !isSubmitting && (
                <button onClick={() => { setPostTitle(""); setAiResult(null); setText(""); setAiImage(null); }} className={`shrink-0 ${isDark ? "text-slate-600" : "text-slate-400"}`}><X size={14}/></button>
              )}
            </div>
            <div className="flex gap-2 mb-3">
              {TONES.map(t => (
                <button key={t.id} onClick={() => setTone(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl text-[11px] font-bold border transition-all active:scale-95
                    ${tone === t.id ? isDark ? "bg-blue-500/15 border-blue-500/35 text-blue-400" : "bg-blue-50 border-blue-300/60 text-blue-600"
                                    : isDark ? "bg-white/[0.03] border-white/[0.05] text-slate-500" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
                  <span>{t.emoji}</span>{t.label}
                </button>
              ))}
            </div>

            {/* MAIN GENERATE BUTTON — fires BOTH text + image in parallel */}
            <button onClick={generateBoth} disabled={!postTitle.trim() || isGenerating || isSubmitting}
              className="w-full h-12 rounded-2xl text-[13.5px] font-black text-white flex items-center justify-center gap-2.5 transition-all active:scale-[0.97] disabled:opacity-50 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg,#1e3a6e,#2563eb,#60a5fa)", boxShadow: postTitle.trim() ? "0 8px 24px rgba(37,99,235,0.4)" : "none" }}>
              {postTitle.trim() && !isGenerating && (
                <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.1) 50%,transparent 100%)", animation: "shimmer 2.5s linear infinite" }}/>
              )}
              <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}`}</style>
              <div className="relative flex items-center gap-2.5">
                {isGenerating ? <><Spin size={15} white/> Generating post + image…</> : <><GeminiSparkle size={14}/> Generate SEO Post + Image</>}
              </div>
            </button>

            {aiError && (
              <div className={`mt-2.5 flex items-center gap-2 px-3 py-2 rounded-xl border ${isDark ? "bg-red-500/[0.07] border-red-900/40" : "bg-red-50 border-red-200/60"}`}>
                <AlertCircle size={12} className="text-red-400 shrink-0"/>
                <p className={`text-[11px] ${isDark ? "text-red-400" : "text-red-600"}`}>{aiError}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── STEP 2: CONTENT ── */}
        <div className={`${card} mb-4 overflow-hidden`}>
          <div className={`px-4 py-2.5 flex items-center gap-2 border-b ${isDark ? "border-white/[0.05]" : "border-slate-100"}`}>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? "bg-emerald-500/15" : "bg-emerald-100"}`}><Brain size={12} className="text-emerald-400"/></div>
            <p className={`text-[12.5px] font-black ${isDark ? "text-white" : "text-slate-900"}`}>Post Content</p>
            <span className={`ml-auto text-[10px] font-bold ${isDark ? "text-slate-600" : "text-slate-400"}`}>Step 2 of 2</span>
            {text.length > 0 && !isSubmitting && (
              <button onClick={() => { setText(""); setAiResult(null); }}
                className={`flex items-center gap-1 h-6 px-2 rounded-lg text-[10px] font-medium ${isDark ? "text-slate-600 hover:text-red-400" : "text-slate-400 hover:text-red-500"}`}>
                <Trash2 size={10}/> Clear
              </button>
            )}
          </div>
          {isGenerating && text.length === 0 && (
            <div className="p-4 flex flex-col gap-2.5">
              {[...Array(4)].map((_,i) => <Skeleton key={i} isDark={isDark} className={`h-3 ${i === 3 ? "w-2/3" : "w-full"}`}/>)}
            </div>
          )}
          <div className={isGenerating && text.length === 0 ? "hidden" : ""}>
            <textarea value={text} onChange={e => { setText(e.target.value); setValidErr(""); }}
              disabled={isSubmitting} placeholder="Your AI-generated post will appear here… or type manually ✍️"
              rows={7}
              className={`w-full bg-transparent outline-none text-[14px] leading-relaxed resize-none p-4 disabled:opacity-60 ${isDark ? "text-white placeholder:text-slate-600" : "text-slate-900 placeholder:text-slate-400"}`}
              style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}/>
          </div>
          <div className={`flex items-center justify-between px-4 pb-3 pt-0 gap-2 border-t ${isDark ? "border-white/[0.04]" : "border-slate-100"}`}>
            <span className={`text-[11px] font-medium ${overLimit ? "text-red-400" : remaining < 100 ? "text-orange-400" : isDark ? "text-slate-600" : "text-slate-400"}`}>
              {overLimit ? `${Math.abs(remaining)} over limit` : remaining < 200 ? `${remaining} chars left` : `${charCount} / ${MAX_CHARS}`}
            </span>
            {text.length > 0 && !isGenerating && !isSubmitting && (
              /* Regenerate TEXT only — does NOT re-call image API */
              <button onClick={generateText} disabled={!postTitle.trim()}
                className={`flex items-center gap-1 h-7 px-2.5 rounded-xl text-[11px] font-medium transition-all active:scale-95 disabled:opacity-40 ${isDark ? "text-slate-500 hover:text-blue-400 hover:bg-blue-500/10" : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"}`}>
                <RefreshCw size={10}/> Regenerate text only
              </button>
            )}
          </div>
        </div>

        {/* ── DUPLICATE WARNING ── */}
        {duplicateOpener && !isGenerating && (
          <div className={`mb-4 flex items-start gap-2.5 px-3.5 py-3 rounded-2xl border ${isDark ? "bg-amber-500/[0.06] border-amber-900/40" : "bg-amber-50 border-amber-200/60"}`}>
            <AlertCircle size={13} className="text-amber-400 shrink-0 mt-0.5"/>
            <p className={`text-[11px] leading-relaxed ${isDark ? "text-amber-400/80" : "text-amber-700"}`}>
              <span className="font-black">Similar opening detected.</span> Your recent posts also start with "{duplicateOpener}" — consider editing the first sentence.
            </p>
          </div>
        )}

        {/* ── SEO SCORE ── */}
        {aiResult && !isGenerating && text.length > 0 && (
          <div className="mb-4"><SEOMeter score={aiResult.seoScore} tips={aiResult.tips} dark={isDark}/></div>
        )}

        {/* ── KEYWORDS ── */}
        {(aiResult || extraKeywords.length > 0) && !isGenerating && (
          <div className="mb-4">
            <KeywordPanel
              embedded={embeddedKeywords}
              suggested={aiResult?.suggestedKeywords?.filter(k => !extraKeywords.includes(k)) ?? []}
              extras={extraKeywords}
              onAdd={kw => { addKeyword(kw); if (!text.toLowerCase().includes(kw.toLowerCase())) setText(prev => prev + " " + kw); }}
              onRemove={removeKeyword}
              dark={isDark}
            />
          </div>
        )}

        {/* ── EVENT / OFFER EXTRAS ── */}
        {postType === "EVENT" && (
          <div className={`${card} mb-4 p-4 flex flex-col gap-3`}>
            <p className={`text-[11px] font-bold uppercase tracking-wide ${isDark ? "text-slate-500" : "text-slate-400"}`}>Event Details</p>
            <input value={eventTitle} onChange={e => setEventTitle(e.target.value)} placeholder="Event title *" disabled={isSubmitting}
              className={`w-full h-10 px-3 rounded-xl text-[13.5px] outline-none border transition-all disabled:opacity-50 ${isDark ? "bg-[#182236] border-white/[0.07] text-white placeholder:text-slate-600 focus:border-blue-500/50" : "bg-slate-50 border-black/[0.07] text-slate-900 placeholder:text-slate-400"}`}/>
          </div>
        )}
        {postType === "OFFER" && (
          <div className={`${card} mb-4 p-4 flex flex-col gap-3`}>
            <p className={`text-[11px] font-bold uppercase tracking-wide ${isDark ? "text-slate-500" : "text-slate-400"}`}>Offer Details</p>
            <input value={offerTitle} onChange={e => setOfferTitle(e.target.value)} placeholder="Offer title *" disabled={isSubmitting}
              className={`w-full h-10 px-3 rounded-xl text-[13.5px] outline-none border transition-all disabled:opacity-50 ${isDark ? "bg-[#182236] border-white/[0.07] text-white placeholder:text-slate-600 focus:border-blue-500/50" : "bg-slate-50 border-black/[0.07] text-slate-900 placeholder:text-slate-400"}`}/>
            <input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="Coupon code (optional)" disabled={isSubmitting}
              className={`w-full h-10 px-3 rounded-xl text-[13.5px] outline-none border transition-all disabled:opacity-50 ${isDark ? "bg-[#182236] border-white/[0.07] text-white placeholder:text-slate-600 focus:border-blue-500/50" : "bg-slate-50 border-black/[0.07] text-slate-900 placeholder:text-slate-400"}`}/>
          </div>
        )}

        {/* ── AI IMAGE CARD ── */}
        <div className="mb-4">
          <AIImageCard
            title={postTitle} postType={postType} bizName={bizName} bizCat={bizCat}
            imgStyle={imgStyle} setImgStyle={setImgStyle}
            aiImage={aiImage} setAiImage={setAiImage}
            onImageAccepted={dataUrl => setImages(prev => prev.includes(dataUrl) ? prev : [dataUrl, ...prev.filter(i => i !== dataUrl)])}
            dark={isDark} disabled={isSubmitting}
          />
        </div>

        {/* ── PHOTOS (manual upload) ── */}
        <div className={`${card} mb-4 p-4`}>
          <div className="flex items-center justify-between mb-3">
            <p className={`text-[11px] font-bold uppercase tracking-wide ${isDark ? "text-slate-500" : "text-slate-400"}`}>Photos</p>
            {images.length > 0 && <span className={`text-[11px] font-medium ${isDark ? "text-slate-600" : "text-slate-400"}`}>{images.length}/10</span>}
          </div>
          <ImageUpload images={images} onChange={setImages} isDark={isDark} disabled={isSubmitting}/>
          {images.length > 0 && (
            <p className={`text-[10px] mt-2 ${isDark ? "text-slate-700" : "text-slate-400"}`}>
              First image is used as the post cover. Tap × to remove.
            </p>
          )}
        </div>

        {/* ── CTA ── */}
        <div className={`${card} mb-4 p-4`}>
          <p className={`text-[11px] font-bold uppercase tracking-wide mb-3 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Call to Action</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CTA_OPTIONS.map(c => (
              <button key={c.id} onClick={() => { if (!isSubmitting) { setCta(c.id); setShowCtaUrl(c.id !== "NONE" && c.id !== "CALL"); }}} disabled={isSubmitting}
                className={`flex items-center gap-1.5 h-8 px-3 rounded-xl text-[12px] font-semibold whitespace-nowrap shrink-0 transition-all active:scale-95 disabled:opacity-50 ${cta === c.id ? "bg-blue-500 text-white" : isDark ? "bg-white/[0.07] text-slate-400" : "bg-slate-100 text-slate-500"}`}>
                {c.icon}{c.label}
              </button>
            ))}
          </div>
          {showCtaUrl && cta !== "NONE" && cta !== "CALL" && (
            <div className={`mt-3 flex items-center gap-2 h-10 px-3 rounded-xl border ${isDark ? "bg-[#182236] border-white/[0.07]" : "bg-slate-50 border-black/[0.07]"}`}>
              <Link2 size={13} className={isDark ? "text-slate-600" : "text-slate-400"}/>
              <input value={ctaUrl} onChange={e => setCtaUrl(e.target.value)} disabled={isSubmitting} placeholder="https://yourwebsite.com"
                className={`flex-1 bg-transparent outline-none text-[13.5px] disabled:opacity-50 ${isDark ? "text-white placeholder:text-slate-600" : "text-slate-900 placeholder:text-slate-400"}`}/>
            </div>
          )}
        </div>

        {/* ── SCHEDULER ── */}
        <div className={`${card} mb-4 overflow-hidden`}>
          <button onClick={() => !isSubmitting && setShowCal(v => !v)} disabled={isSubmitting}
            className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all disabled:opacity-50 ${isDark ? "hover:bg-white/[0.03]" : "hover:bg-slate-50"}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${schedule ? isDark ? "bg-orange-500/20" : "bg-orange-50" : isDark ? "bg-white/[0.07]" : "bg-slate-100"}`}>
              <Calendar size={15} className={schedule ? isDark ? "text-orange-400" : "text-orange-500" : isDark ? "text-slate-500" : "text-slate-400"}/>
            </div>
            <div className="flex-1 text-left">
              <p className={`text-[13px] font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{schedule ? "Scheduled" : "Schedule for Later"}</p>
              <p className={`text-[11px] ${schedule ? isDark ? "text-orange-400/80" : "text-orange-500" : isDark ? "text-slate-600" : "text-slate-400"}`}>
                {schedule ? formatSchedule(schedule) : "Post immediately when published"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {schedule && <button onClick={e => { e.stopPropagation(); if (!isSubmitting) setSchedule(null); }} className={`w-6 h-6 flex items-center justify-center rounded-lg ${isDark ? "text-slate-500" : "text-slate-400"}`}><X size={13}/></button>}
              <ChevronDown size={15} className={`transition-transform ${isDark ? "text-slate-500" : "text-slate-400"} ${showCal ? "rotate-180" : ""}`}/>
            </div>
          </button>
          {showCal && (
            <div className={`border-t p-3 ${isDark ? "border-white/[0.05]" : "border-slate-100"}`}>
              <CalendarPicker value={calDraft} onChange={v => { setCalDraft(v); setSchedule(v); }} isDark={isDark} onClose={() => setShowCal(false)}/>
            </div>
          )}
        </div>

        {/* ── ERROR ── */}
        {displayError && (
          <div className={`flex items-start gap-2.5 p-3.5 rounded-2xl mb-4 border ${isDark ? "bg-red-500/[0.08] border-red-500/20" : "bg-red-50 border-red-200"}`}>
            <AlertCircle size={15} className="text-red-400 mt-0.5 shrink-0"/>
            <div className="flex-1">
              <p className="text-[13px] font-medium text-red-400">{displayError}</p>
              {postMutation.isError && <button onClick={() => { postMutation.reset(); setValidErr(""); submittingRef.current = false; }} className="text-[11px] font-semibold text-blue-500 mt-1">Dismiss</button>}
            </div>
          </div>
        )}

        {/* ── ACTIONS ── */}
        <div className="flex gap-3">
          <button onClick={() => setShowPreview(true)} disabled={isSubmitting}
            className={`flex items-center gap-1.5 h-12 px-4 rounded-2xl text-[13px] font-semibold border transition-all active:scale-95 disabled:opacity-40 ${isDark ? "bg-[#131c2d] border-white/[0.08] text-slate-300" : "bg-white border-slate-200 text-slate-700 shadow-sm"}`}>
            <Eye size={15}/> Preview
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting || isGenerating || overLimit}
            className="flex-1 h-12 rounded-2xl text-[14px] font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", boxShadow: isSubmitting ? "none" : "0 4px 18px rgba(37,99,235,0.38)" }}>
            {isSubmitting
              ? uploadPhase ? <><Upload size={14} className="animate-bounce"/> Uploading {uploadProgress.current}/{uploadProgress.total}…</> : <><Spin size={15} white/> {schedule ? "Scheduling…" : "Publishing…"}</>
              : <><Send size={14}/>{schedule ? "Schedule Post" : "Publish Now"}</>}
          </button>
        </div>
        <p className={`text-[10.5px] text-center mt-4 leading-relaxed ${isDark ? "text-slate-700" : "text-slate-400"}`}>
          Posts may take a few minutes to appear on Google. Content must comply with <span className="text-blue-500 cursor-pointer">Google's content policies</span>. Posts expire after 7 days unless Event or Offer posts.
        </p>
      </div>
      {showPreview && <PreviewModal text={text} images={images} cta={cta} schedule={schedule} isDark={isDark} onClose={() => setShowPreview(false)}/>}
    </div>
  );
}