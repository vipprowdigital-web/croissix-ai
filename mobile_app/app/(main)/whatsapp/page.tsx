"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "next-themes";
import { useUser } from "@/features/user/hook/useUser";
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  Trash2,
  ExternalLink,
  ChevronDown,
  Tag,
  Type,
  Wand2,
  Download,
  Camera,
  Palette,
  Minimize2,
  Film,
  Sunrise,
  type LucideIcon,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
type Tone     = "Friendly" | "Professional" | "Promotional";
type ImgStyle = "photorealistic" | "illustration" | "minimalist" | "cinematic" | "warm";

interface ImageResult {
  imageUrl: string;
  prompt:   string;
  provider: string;
  seed:     number;
}

/* ══════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════ */
const MAX_CHARS       = 4096;
const IMG_GEN_LIMIT   = 4;
const IMG_KEY_DATE    = "wa_img_gen_date";
const IMG_KEY_COUNT   = "wa_img_gen_count";

const TONES: { id: Tone; emoji: string; label: string }[] = [
  { id: "Friendly",     emoji: "😊", label: "Friendly"     },
  { id: "Professional", emoji: "🎯", label: "Professional" },
  { id: "Promotional",  emoji: "🚀", label: "Promotional"  },
];

const IMG_STYLES: { id: ImgStyle; icon: LucideIcon; label: string }[] = [
  { id: "photorealistic", icon: Camera,    label: "Photo"        },
  { id: "illustration",   icon: Palette,   label: "Illustration" },
  { id: "minimalist",     icon: Minimize2, label: "Minimal"      },
  { id: "cinematic",      icon: Film,      label: "Cinematic"    },
  { id: "warm",           icon: Sunrise,   label: "Warm"         },
];

/* ══════════════════════════════════════════════════════════
   DAILY LIMIT HELPERS
══════════════════════════════════════════════════════════ */
function getImgGenCount(): number {
  if (typeof window === "undefined") return 0;
  const today = new Date().toDateString();
  const storedDate = localStorage.getItem(IMG_KEY_DATE);
  if (storedDate !== today) {
    localStorage.setItem(IMG_KEY_DATE, today);
    localStorage.setItem(IMG_KEY_COUNT, "0");
    return 0;
  }
  return parseInt(localStorage.getItem(IMG_KEY_COUNT) ?? "0", 10);
}

function incrementImgGenCount(): number {
  const next = getImgGenCount() + 1;
  localStorage.setItem(IMG_KEY_COUNT, String(next));
  return next;
}

/* ══════════════════════════════════════════════════════════
   API
══════════════════════════════════════════════════════════ */
async function callGenerateImage(params: {
  topic: string;
  businessName: string;
  businessCategory: string;
  style: string;
  seed?: number;
}): Promise<ImageResult> {
  const res = await fetch("/api/ai/whatsapp-generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Image generation failed");
  return json as ImageResult;
}

/* ══════════════════════════════════════════════════════════
   WHATSAPP LOGO
══════════════════════════════════════════════════════════ */
function WhatsAppLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#25D366" />
      <path
        d="M12 4C7.58 4 4 7.58 4 12c0 1.42.37 2.75 1.01 3.91L4 20l4.24-1.11A7.95 7.95 0 0 0 12 20c4.42 0 8-3.58 8-8s-3.58-8-8-8zm3.9 11.3c-.16.45-.95.87-1.31.93-.33.05-.75.07-1.21-.08-.28-.09-.64-.21-1.1-.41-1.93-.83-3.19-2.79-3.29-2.92-.1-.13-.8-1.06-.8-2.02 0-.96.5-1.43.68-1.63.18-.2.39-.25.52-.25h.37c.12 0 .28-.05.43.33l.55 1.38c.05.12.08.26.02.38l-.21.4-.32.38c-.1.12-.2.24-.09.47.11.23.5.82 1.07 1.33.73.65 1.35.85 1.54.94.19.09.3.08.41-.05l.54-.64c.11-.14.22-.12.37-.07l1.18.56c.14.07.23.1.27.16.04.06.04.36-.12.82z"
        fill="white"
      />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════
   SPIN
══════════════════════════════════════════════════════════ */
function Spin({ size = 16 }: { size?: number }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════
   AI IMAGE CARD
══════════════════════════════════════════════════════════ */
function AIImageCard({
  topic, bizName, bizCat,
  imgStyle, setImgStyle,
  aiImage, setAiImage,
  dark, disabled,
}: {
  topic:         string;
  bizName:       string;
  bizCat:        string;
  imgStyle:      ImgStyle;
  setImgStyle:   (s: ImgStyle) => void;
  aiImage:       ImageResult | null;
  setAiImage:    (r: ImageResult | null) => void;
  dark:          boolean;
  disabled:      boolean;
}) {
  const [generating, setGenerating] = useState(false);
  const [imgError,   setImgError]   = useState("");
  const [genCount,   setGenCount]   = useState(0);

  useEffect(() => { setGenCount(getImgGenCount()); }, []);

  const remaining   = IMG_GEN_LIMIT - genCount;
  const limitReached = remaining <= 0;

  const generate = useCallback(async (forceNewSeed = false) => {
    if (!topic.trim() || generating || disabled || limitReached) return;
    setGenerating(true);
    setImgError("");
    try {
      const seed = forceNewSeed
        ? Math.floor(Math.random() * 999_999)
        : (aiImage?.seed ?? undefined);
      const result = await callGenerateImage({ topic, businessName: bizName, businessCategory: bizCat, style: imgStyle, seed });
      setAiImage(result);
      setGenCount(incrementImgGenCount());
    } catch (e: any) {
      setImgError(e.message ?? "Image generation failed");
    } finally {
      setGenerating(false);
    }
  }, [topic, bizName, bizCat, imgStyle, generating, disabled, limitReached, aiImage?.seed]);

  const handleStyleRegen = useCallback(async (s: ImgStyle) => {
    if (!topic.trim() || generating || disabled || limitReached) return;
    setGenerating(true);
    setImgError("");
    try {
      const result = await callGenerateImage({ topic, businessName: bizName, businessCategory: bizCat, style: s, seed: aiImage?.seed });
      setAiImage(result);
      setGenCount(incrementImgGenCount());
    } catch (e: any) {
      setImgError(e.message ?? "Failed");
    } finally {
      setGenerating(false);
    }
  }, [topic, bizName, bizCat, aiImage?.seed, generating, disabled, limitReached]);

  const handleDownload = () => {
    if (!aiImage) return;
    const a = document.createElement("a");
    a.href = aiImage.imageUrl;
    a.download = `whatsapp-image-${Date.now()}.jpg`;
    a.click();
  };

  return (
    <div className={`rounded-2xl border overflow-hidden ${dark ? "bg-[#071a0f] border-[#25D366]/20" : "bg-white border-green-200/60 shadow-sm"}`}>
      {/* Header */}
      <div className={`px-4 py-2.5 flex items-center gap-2 border-b ${dark ? "border-[#25D366]/15" : "border-green-100"}`}>
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(37,211,102,0.15)" }}
        >
          <Wand2 size={12} className="text-green-400" />
        </div>
        <p className={`text-[12.5px] font-black ${dark ? "text-white" : "text-slate-900"}`}>AI Image</p>
        {aiImage && (
          <span
            className="text-[9px] font-black px-2 py-0.5 rounded-full ml-1 border"
            style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", borderColor: "rgba(34,197,94,0.25)" }}
          >
            Generated
          </span>
        )}
        {aiImage && (
          <span className={`text-[9px] font-bold ${dark ? "text-slate-700" : "text-slate-300"}`}>
            via {aiImage.provider}
          </span>
        )}
        <span
          className="text-[9px] font-black px-2 py-0.5 rounded-full border ml-auto"
          style={
            limitReached
              ? { background: "rgba(239,68,68,0.1)", color: "#ef4444", borderColor: "rgba(239,68,68,0.25)" }
              : remaining === 1
                ? { background: "rgba(245,158,11,0.1)", color: "#f59e0b", borderColor: "rgba(245,158,11,0.25)" }
                : { background: "rgba(37,211,102,0.08)", color: "#22c55e", borderColor: "rgba(37,211,102,0.2)" }
          }
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
              onClick={() => { setImgStyle(s.id); if (aiImage) handleStyleRegen(s.id); }}
              className={`flex items-center gap-1.5 shrink-0 h-8 px-2.5 rounded-xl text-[11px] font-bold border transition-all active:scale-95
                ${imgStyle === s.id
                  ? dark ? "bg-green-500/15 border-green-500/35 text-green-400" : "bg-green-50 border-green-300/60 text-green-700"
                  : dark ? "bg-white/[0.03] border-[#25D366]/15 text-slate-500"  : "bg-slate-50 border-green-100 text-slate-500"
                }`}
            >
              <s.icon
                size={12}
                color={imgStyle === s.id ? (dark ? "#4ade80" : "#15803d") : (dark ? "#64748b" : "#94a3b8")}
              />
              {s.label}
            </button>
          ))}
        </div>

        {/* Image area */}
        {generating ? (
          <div
            className={`w-full rounded-2xl overflow-hidden relative ${dark ? "bg-[#071a0f]" : "bg-green-50/60"}`}
            style={{ aspectRatio: "1/1" }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="relative flex items-center justify-center" style={{ width: 52, height: 52 }}>
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="absolute inset-0 rounded-full border border-green-500/40"
                    style={{ animation: `pulse-ring ${1.2 + i * 0.5}s ease-out infinite`, animationDelay: `${i * 0.3}s` }}
                  />
                ))}
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#128C7E,#25D366)", boxShadow: "0 0 20px rgba(37,211,102,0.45)" }}
                >
                  <Wand2 size={20} className="text-white" />
                </div>
              </div>
              <p className={`text-[11px] font-semibold ${dark ? "text-green-400" : "text-green-700"}`}>
                Generating image…
              </p>
              <p className={`text-[9.5px] ${dark ? "text-slate-600" : "text-slate-400"}`}>FLUX AI · Square 1080×1080</p>
            </div>
            <style>{`@keyframes pulse-ring{0%{transform:scale(1);opacity:0.6}100%{transform:scale(1.7);opacity:0}}`}</style>
          </div>
        ) : aiImage ? (
          <div className="relative rounded-2xl overflow-hidden group" style={{ aspectRatio: "1/1" }}>
            <img src={aiImage.imageUrl} alt="AI generated" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />
            {/* overlay regen + prompt */}
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
              borderColor: dark ? "rgba(37,211,102,0.25)" : "rgba(37,211,102,0.3)",
              background:  dark ? "rgba(37,211,102,0.04)" : "rgba(37,211,102,0.03)",
            }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: dark ? "rgba(37,211,102,0.12)" : "rgba(37,211,102,0.1)" }}
            >
              <Wand2 size={22} className="text-green-400" />
            </div>
            <div className="text-center">
              <p className={`text-[13px] font-black ${dark ? "text-green-400" : "text-green-700"}`}>
                {limitReached ? "Daily Limit Reached" : "Generate AI Image"}
              </p>
              <p className={`text-[10.5px] mt-0.5 ${dark ? "text-slate-600" : "text-slate-400"}`}>
                {limitReached
                  ? "4 images used · Resets tomorrow"
                  : topic.trim()
                    ? `FLUX AI · Square · ${remaining} of ${IMG_GEN_LIMIT} left today`
                    : "Enter a topic first"}
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

        {aiImage && !generating && (
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex-1 h-9 rounded-2xl text-[12px] font-black text-white flex items-center justify-center gap-1.5 active:scale-95"
              style={{ background: "linear-gradient(135deg,#128C7E,#25D366)", boxShadow: "0 4px 16px rgba(37,211,102,0.3)" }}
            >
              <Download size={13} /> Save Image
            </button>
            <button
              onClick={() => generate(true)}
              disabled={generating || limitReached}
              className={`flex items-center gap-1.5 h-9 px-3 rounded-2xl text-[11.5px] font-bold border active:scale-95 disabled:opacity-50
                ${dark ? "bg-white/[0.04] border-[#25D366]/25 text-green-400" : "bg-green-50 border-green-200/60 text-green-700"}`}
            >
              <RefreshCw size={11} /> Regen
            </button>
          </div>
        )}

        {aiImage && (
          <p className={`text-[10px] text-center ${dark ? "text-slate-700" : "text-slate-400"}`}>
            Save the image, then attach it when sending your WhatsApp message.
          </p>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   WHATSAPP PREVIEW BUBBLE
══════════════════════════════════════════════════════════ */
function WhatsAppBubble({
  text, bizName, aiImage, isDark,
}: {
  text: string; bizName: string; aiImage: ImageResult | null; isDark: boolean;
}) {
  const renderFormatted = (raw: string) => {
    const tokens = raw.split(/(\*[^*]+\*|_[^_]+_)/g);
    return tokens.map((token, idx) => {
      if (token.startsWith("*") && token.endsWith("*"))
        return <strong key={idx}>{token.slice(1, -1)}</strong>;
      if (token.startsWith("_") && token.endsWith("_"))
        return <em key={idx}>{token.slice(1, -1)}</em>;
      return <span key={idx}>{token}</span>;
    });
  };

  const timeStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

  return (
    <div
      className={`rounded-2xl border overflow-hidden ${isDark ? "bg-[#0b1621] border-white/[0.06]" : "bg-[#e9f5e1] border-green-200/60"}`}
    >
      {/* Header bar */}
      <div
        className="px-4 py-3 flex items-center gap-3"
        style={{ background: isDark ? "rgba(37,211,102,0.12)" : "#25D366" }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-black text-white shrink-0"
          style={{ background: "rgba(0,0,0,0.2)" }}
        >
          {(bizName || "B")[0].toUpperCase()}
        </div>
        <div>
          <p className={`text-[13px] font-bold ${isDark ? "text-green-400" : "text-white"}`}>
            {bizName || "Your Business"}
          </p>
          <p className={`text-[10px] ${isDark ? "text-green-600" : "text-white/70"}`}>Business Account</p>
        </div>
      </div>

      {/* Chat area */}
      <div className="p-4 flex flex-col gap-2">
        <p className={`text-[10px] font-bold text-center ${isDark ? "text-slate-600" : "text-slate-400"}`}>Today</p>
        {text.trim() || aiImage ? (
          <div
            className="self-start max-w-[85%] rounded-2xl rounded-tl-sm overflow-hidden shadow-sm"
            style={{ background: isDark ? "#1e2d1e" : "white" }}
          >
            {aiImage && (
              <img
                src={aiImage.imageUrl}
                alt="Attached"
                className="w-full object-cover"
                style={{ maxHeight: 220 }}
              />
            )}
            {text.trim() && (
              <div className="px-3 py-2.5">
                <p
                  className={`text-[13px] leading-relaxed ${isDark ? "text-slate-200" : "text-slate-800"}`}
                  style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {renderFormatted(text)}
                </p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className={`text-[9.5px] ${isDark ? "text-slate-600" : "text-slate-400"}`}>{timeStr}</span>
                  <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
                    <path d="M1 4l3 3L13 1" stroke="#25D366" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5 4l3 3" stroke="#25D366" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={`self-start rounded-2xl px-4 py-3 border-2 border-dashed ${isDark ? "border-white/[0.08]" : "border-green-200"}`}>
            <p className={`text-[12px] ${isDark ? "text-slate-600" : "text-slate-400"}`}>
              Your message and image preview will appear here…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════ */
export default function WhatsAppPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  const { data: user } = useUser();
  const bizName = user?.googleLocationName ?? "";
  const bizCat  = user?.businessCategory  ?? "";

  /* ── state ── */
  const [topic,        setTopic]        = useState("");
  const [tone,         setTone]         = useState<Tone>("Friendly");
  const [text,         setText]         = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError,      setAiError]      = useState("");
  const [copied,       setCopied]       = useState(false);
  const [showPreview,  setShowPreview]  = useState(false);
  const [imgStyle,     setImgStyle]     = useState<ImgStyle>("photorealistic");
  const [aiImage,      setAiImage]      = useState<ImageResult | null>(null);

  const charCount  = text.length;
  const remaining  = MAX_CHARS - charCount;
  const overLimit  = remaining < 0;

  /* ── AI text generate ── */
  const generate = useCallback(async () => {
    if (!topic.trim() || isGenerating) return;
    setIsGenerating(true);
    setAiError("");
    try {
      const res = await fetch("/api/ai/whatsapp-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          businessName:     bizName || "our business",
          businessCategory: bizCat,
          tone,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "AI generation failed");

      const final: string = json.content;
      let i = 0;
      setText("");
      const interval = setInterval(() => {
        i++;
        setText(final.slice(0, i));
        if (i >= final.length) { clearInterval(interval); setIsGenerating(false); }
      }, 14);
    } catch (e: any) {
      setAiError(e.message ?? "AI generation failed");
      setIsGenerating(false);
    }
  }, [topic, tone, bizName, bizCat, isGenerating]);

  /* ── copy ── */
  const handleCopy = async () => {
    if (!text.trim()) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── share to WhatsApp ── */
  const handleShare = async () => {
    if (!text.trim() && !aiImage) return;

    // Try Web Share API (works on mobile with image + text)
    if (aiImage && navigator.canShare) {
      try {
        const res  = await fetch(aiImage.imageUrl);
        const blob = await res.blob();
        const file = new File([blob], "whatsapp-image.jpg", { type: "image/jpeg" });
        const shareData: ShareData = { files: [file], text: text || undefined };
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      } catch {
        // fallthrough to text-only URL
      }
    }

    // Fallback: text-only WhatsApp URL
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const card = `rounded-2xl border ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05] shadow-sm"}`;

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-[#0d1421]" : "bg-[#eef2fb]"}`}
      style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}
    >
      <div className="max-w-lg mx-auto px-4 pb-28 pt-4">

        {/* HEADER */}
        <div className="pb-5">
          <div className="flex items-center gap-2 mb-0.5">
            <WhatsAppLogo size={20} />
            <h1
              className={`text-[18px] font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
              style={{ letterSpacing: "-0.03em" }}
            >
              WhatsApp Message
            </h1>
          </div>
          {bizName && (
            <p className={`text-[12px] ml-[26px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              {bizName}
            </p>
          )}
        </div>

        {/* TOPIC + TONE + GENERATE */}
        <div className={`${card} mb-4 overflow-hidden`}>
          <div className={`px-4 py-2.5 flex items-center gap-2 border-b ${isDark ? "border-white/[0.05]" : "border-slate-100"}`}>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? "bg-green-500/15" : "bg-green-100"}`}>
              <Type size={12} className="text-green-500" />
            </div>
            <p className={`text-[12.5px] font-black ${isDark ? "text-white" : "text-slate-900"}`}>
              What's the message about?
            </p>
          </div>
          <div className="p-4">
            <div className={`flex items-center gap-2.5 h-12 px-3.5 rounded-2xl border mb-3 transition-all ${isDark ? "bg-[#0d1421] border-white/[0.07] focus-within:border-green-500/50" : "bg-slate-50 border-black/[0.07] focus-within:border-green-400"}`}>
              <Tag size={14} className={isDark ? "text-slate-600" : "text-slate-400"} />
              <input
                value={topic}
                onChange={(e) => { setTopic(e.target.value); setAiError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter" && topic.trim()) generate(); }}
                placeholder="e.g. Weekend sale 30% off · New product launch · Appointment reminder…"
                className={`flex-1 bg-transparent outline-none text-[13px] font-medium ${isDark ? "text-white placeholder:text-slate-600" : "text-slate-900 placeholder:text-slate-400"}`}
              />
            </div>

            {/* Tone picker */}
            <div className="flex gap-2 mb-3">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-xl border transition-all active:scale-95
                    ${tone === t.id
                      ? isDark ? "bg-green-500/15 border-green-500/35 text-green-400" : "bg-green-50 border-green-300/60 text-green-700"
                      : isDark ? "bg-white/[0.03] border-white/[0.05] text-slate-500"  : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}
                >
                  <span className="text-[14px]">{t.emoji}</span>
                  <span className="text-[10.5px] font-bold">{t.label}</span>
                </button>
              ))}
            </div>

            {/* Generate text button */}
            <button
              onClick={generate}
              disabled={!topic.trim() || isGenerating}
              className="w-full h-12 rounded-2xl text-[13.5px] font-black text-white flex items-center justify-center gap-2.5 transition-all active:scale-[0.97] disabled:opacity-50 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg,#128C7E,#25D366,#34c759)",
                boxShadow:  topic.trim() ? "0 8px 24px rgba(37,211,102,0.35)" : "none",
              }}
            >
              {topic.trim() && !isGenerating && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.12) 50%,transparent 100%)",
                    animation: "shimmer 2.5s linear infinite",
                  }}
                />
              )}
              <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}`}</style>
              <div className="relative flex items-center gap-2">
                {isGenerating ? <><Spin size={15} /> Generating…</> : <><Sparkles size={15} /> Generate with AI</>}
              </div>
            </button>

            {aiError && (
              <div className={`mt-2.5 flex items-center gap-2 px-3 py-2 rounded-xl border ${isDark ? "bg-red-500/[0.07] border-red-900/40" : "bg-red-50 border-red-200/60"}`}>
                <AlertCircle size={12} className="text-red-400 shrink-0" />
                <p className={`text-[11px] ${isDark ? "text-red-400" : "text-red-600"}`}>{aiError}</p>
              </div>
            )}
          </div>
        </div>

        {/* MESSAGE TEXT AREA */}
        <div className={`${card} mb-4 overflow-hidden`}>
          <div className={`px-4 py-2.5 flex items-center gap-2 border-b ${isDark ? "border-white/[0.05]" : "border-slate-100"}`}>
            <WhatsAppLogo size={14} />
            <p className={`text-[12.5px] font-black ${isDark ? "text-white" : "text-slate-900"}`}>Message</p>
            <span className={`ml-auto text-[10px] font-medium ${isDark ? "text-slate-600" : "text-slate-400"}`}>
              *bold* · _italic_
            </span>
            {text.length > 0 && (
              <button
                onClick={() => setText("")}
                className={`flex items-center gap-1 h-6 px-2 rounded-lg text-[10px] font-medium ${isDark ? "text-slate-600 hover:text-red-400" : "text-slate-400 hover:text-red-500"}`}
              >
                <Trash2 size={10} /> Clear
              </button>
            )}
          </div>

          {isGenerating && text.length === 0 && (
            <div className="p-4 flex flex-col gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`h-3 rounded-lg animate-pulse ${isDark ? "bg-white/[0.07]" : "bg-slate-100"} ${i === 2 ? "w-2/3" : "w-full"}`} />
              ))}
            </div>
          )}

          <div className={isGenerating && text.length === 0 ? "hidden" : ""}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Your AI-generated message will appear here… or type your own ✍️"
              rows={6}
              className={`w-full bg-transparent outline-none text-[14px] leading-relaxed resize-none p-4 ${isDark ? "text-white placeholder:text-slate-600" : "text-slate-900 placeholder:text-slate-400"}`}
            />
          </div>

          <div className={`flex items-center justify-between px-4 pb-3 pt-0 gap-2 border-t ${isDark ? "border-white/[0.04]" : "border-slate-100"}`}>
            <span className={`text-[11px] font-medium ${overLimit ? "text-red-400" : remaining < 100 ? "text-orange-400" : isDark ? "text-slate-600" : "text-slate-400"}`}>
              {overLimit ? `${Math.abs(remaining)} over limit` : `${charCount} chars`}
            </span>
            {text.length > 0 && !isGenerating && (
              <button
                onClick={generate}
                disabled={!topic.trim()}
                className={`flex items-center gap-1 h-7 px-2.5 rounded-xl text-[11px] font-medium transition-all active:scale-95 disabled:opacity-40 ${isDark ? "text-slate-500 hover:text-green-400 hover:bg-green-500/10" : "text-slate-400 hover:text-green-600 hover:bg-green-50"}`}
              >
                <RefreshCw size={10} /> Regenerate
              </button>
            )}
          </div>
        </div>

        {/* AI IMAGE CARD */}
        <div className="mb-4">
          <AIImageCard
            topic={topic}
            bizName={bizName}
            bizCat={bizCat}
            imgStyle={imgStyle}
            setImgStyle={setImgStyle}
            aiImage={aiImage}
            setAiImage={setAiImage}
            dark={isDark}
            disabled={false}
          />
        </div>

        {/* PREVIEW TOGGLE */}
        <button
          onClick={() => setShowPreview((v) => !v)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border mb-4 transition-all ${isDark ? "bg-[#131c2d] border-white/[0.06] text-slate-300" : "bg-white border-black/[0.05] text-slate-600 shadow-sm"}`}
        >
          <div className="flex items-center gap-2">
            <WhatsAppLogo size={14} />
            <span className="text-[12.5px] font-bold">WhatsApp Preview</span>
          </div>
          <ChevronDown
            size={14}
            className={`transition-transform ${showPreview ? "rotate-180" : ""} ${isDark ? "text-slate-500" : "text-slate-400"}`}
          />
        </button>

        {showPreview && (
          <div className="mb-4">
            <WhatsAppBubble text={text} bizName={bizName} aiImage={aiImage} isDark={isDark} />
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            disabled={!text.trim()}
            className={`flex items-center gap-1.5 h-12 px-4 rounded-2xl text-[13px] font-semibold border transition-all active:scale-95 disabled:opacity-40 ${isDark ? "bg-[#131c2d] border-white/[0.08] text-slate-300" : "bg-white border-slate-200 text-slate-700 shadow-sm"}`}
          >
            {copied ? <Check size={15} className="text-green-400" /> : <Copy size={15} />}
            {copied ? "Copied!" : "Copy"}
          </button>

          <button
            onClick={handleShare}
            disabled={!text.trim() && !aiImage}
            className="flex-1 h-12 rounded-2xl text-[14px] font-black text-white flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-60"
            style={{
              background: (text.trim() || aiImage) ? "linear-gradient(135deg,#128C7E,#25D366)" : undefined,
              boxShadow:  (text.trim() || aiImage) ? "0 4px 18px rgba(37,211,102,0.4)" : "none",
              backgroundColor: (!text.trim() && !aiImage) ? (isDark ? "#1e2a3a" : "#e2e8f0") : undefined,
            }}
          >
            <WhatsAppLogo size={16} />
            Open in WhatsApp
            <ExternalLink size={13} className="opacity-70" />
          </button>
        </div>

        <p className={`text-[10.5px] text-center mt-4 leading-relaxed ${isDark ? "text-slate-700" : "text-slate-400"}`}>
          "Open in WhatsApp" launches WhatsApp with your text pre-filled. Save the image separately and attach it when sending.
        </p>
      </div>
    </div>
  );
}
