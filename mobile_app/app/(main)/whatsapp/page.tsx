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
} from "lucide-react";

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
type Tone = "Friendly" | "Professional" | "Promotional";

/* ══════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════ */
const MAX_CHARS = 4096;
const TONES: { id: Tone; emoji: string; label: string; hint: string }[] = [
  { id: "Friendly", emoji: "😊", label: "Friendly", hint: "Warm & conversational" },
  { id: "Professional", emoji: "🎯", label: "Professional", hint: "Clear & business-like" },
  { id: "Promotional", emoji: "🚀", label: "Promotional", hint: "Exciting & offer-driven" },
];

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
   WHATSAPP PREVIEW BUBBLE
══════════════════════════════════════════════════════════ */
function WhatsAppBubble({ text, bizName, isDark }: { text: string; bizName: string; isDark: boolean }) {
  const renderFormatted = (raw: string) => {
    // Parse WhatsApp *bold* and _italic_ for preview
    const parts: React.ReactNode[] = [];
    let i = 0;
    const tokens = raw.split(/(\*[^*]+\*|_[^_]+_)/g);
    tokens.forEach((token, idx) => {
      if (token.startsWith("*") && token.endsWith("*")) {
        parts.push(<strong key={idx}>{token.slice(1, -1)}</strong>);
      } else if (token.startsWith("_") && token.endsWith("_")) {
        parts.push(<em key={idx}>{token.slice(1, -1)}</em>);
      } else {
        parts.push(<span key={idx}>{token}</span>);
      }
    });
    return parts;
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

  return (
    <div
      className={`rounded-2xl border overflow-hidden ${isDark ? "bg-[#0b1621] border-white/[0.06]" : "bg-[#e9f5e1] border-green-200/60"}`}
      style={{ backgroundImage: isDark ? "none" : "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2325D366' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
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
          <p className={`text-[10px] ${isDark ? "text-green-600" : "text-white/70"}`}>
            Business Account
          </p>
        </div>
      </div>

      {/* Chat area */}
      <div className="p-4 flex flex-col gap-2">
        <p
          className={`text-[10px] font-bold text-center ${isDark ? "text-slate-600" : "text-slate-400"}`}
        >
          Today
        </p>
        {text.trim() ? (
          <div
            className="self-start max-w-[85%] rounded-2xl rounded-tl-sm px-3 py-2.5 shadow-sm"
            style={{ background: isDark ? "#1e2d1e" : "white" }}
          >
            <p
              className={`text-[13px] leading-relaxed ${isDark ? "text-slate-200" : "text-slate-800"}`}
              style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            >
              {renderFormatted(text)}
            </p>
            <div className="flex items-center justify-end gap-1 mt-1">
              <span className={`text-[9.5px] ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                {timeStr}
              </span>
              <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
                <path d="M1 4l3 3L13 1" stroke="#25D366" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 4l3 3" stroke="#25D366" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        ) : (
          <div
            className={`self-start rounded-2xl px-4 py-3 border-2 border-dashed ${isDark ? "border-white/[0.08]" : "border-green-200"}`}
          >
            <p className={`text-[12px] ${isDark ? "text-slate-600" : "text-slate-400"}`}>
              Your message preview will appear here…
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
  const bizCat = user?.businessCategory ?? "";

  /* ── state ── */
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<Tone>("Friendly");
  const [text, setText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const charCount = text.length;
  const remaining = MAX_CHARS - charCount;
  const overLimit = remaining < 0;

  /* ── AI generate ── */
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
          businessName: bizName || "our business",
          businessCategory: bizCat,
          tone,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "AI generation failed");

      // typewriter effect
      const final: string = json.content;
      let i = 0;
      setText("");
      const interval = setInterval(() => {
        i++;
        setText(final.slice(0, i));
        if (i >= final.length) {
          clearInterval(interval);
          setIsGenerating(false);
        }
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
  const handleShare = () => {
    if (!text.trim()) return;
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

        {/* TOPIC INPUT + GENERATE */}
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
                placeholder="e.g. Weekend sale 30% off, New product launch, Appointment reminder…"
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
                      ? isDark
                        ? "bg-green-500/15 border-green-500/35 text-green-400"
                        : "bg-green-50 border-green-300/60 text-green-700"
                      : isDark
                        ? "bg-white/[0.03] border-white/[0.05] text-slate-500"
                        : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}
                >
                  <span className="text-[14px]">{t.emoji}</span>
                  <span className="text-[10.5px] font-bold">{t.label}</span>
                </button>
              ))}
            </div>

            {/* Generate button */}
            <button
              onClick={generate}
              disabled={!topic.trim() || isGenerating}
              className="w-full h-12 rounded-2xl text-[13.5px] font-black text-white flex items-center justify-center gap-2.5 transition-all active:scale-[0.97] disabled:opacity-50 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg,#128C7E,#25D366,#34c759)",
                boxShadow: topic.trim() ? "0 8px 24px rgba(37,211,102,0.35)" : "none",
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
                {isGenerating ? (
                  <><Spin size={15} /> Generating…</>
                ) : (
                  <><Sparkles size={15} /> Generate with AI</>
                )}
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
            <p className={`text-[12.5px] font-black ${isDark ? "text-white" : "text-slate-900"}`}>
              Message
            </p>
            <span className={`ml-auto text-[10px] font-medium ${isDark ? "text-slate-600" : "text-slate-400"}`}>
              Use *bold* and _italic_ for formatting
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
                <div
                  key={i}
                  className={`h-3 rounded-lg animate-pulse ${isDark ? "bg-white/[0.07]" : "bg-slate-100"} ${i === 2 ? "w-2/3" : "w-full"}`}
                />
              ))}
            </div>
          )}

          <div className={isGenerating && text.length === 0 ? "hidden" : ""}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Your AI-generated message will appear here… or type your own message ✍️"
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
            <WhatsAppBubble text={text} bizName={bizName} isDark={isDark} />
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex gap-3">
          {/* Copy */}
          <button
            onClick={handleCopy}
            disabled={!text.trim()}
            className={`flex items-center gap-1.5 h-12 px-4 rounded-2xl text-[13px] font-semibold border transition-all active:scale-95 disabled:opacity-40 ${isDark ? "bg-[#131c2d] border-white/[0.08] text-slate-300" : "bg-white border-slate-200 text-slate-700 shadow-sm"}`}
          >
            {copied ? <Check size={15} className="text-green-400" /> : <Copy size={15} />}
            {copied ? "Copied!" : "Copy"}
          </button>

          {/* Open in WhatsApp */}
          <button
            onClick={handleShare}
            disabled={!text.trim() || overLimit}
            className="flex-1 h-12 rounded-2xl text-[14px] font-black text-white flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-60"
            style={{
              background: text.trim() && !overLimit
                ? "linear-gradient(135deg,#128C7E,#25D366)"
                : undefined,
              boxShadow: text.trim() && !overLimit ? "0 4px 18px rgba(37,211,102,0.4)" : "none",
              backgroundColor: !text.trim() || overLimit ? (isDark ? "#1e2a3a" : "#e2e8f0") : undefined,
            }}
          >
            <WhatsAppLogo size={16} />
            Open in WhatsApp
            <ExternalLink size={13} className="opacity-70" />
          </button>
        </div>

        <p className={`text-[10.5px] text-center mt-4 leading-relaxed ${isDark ? "text-slate-700" : "text-slate-400"}`}>
          Tapping "Open in WhatsApp" will launch the WhatsApp app or web with your message pre-filled. You choose who to send it to.
        </p>
      </div>
    </div>
  );
}
