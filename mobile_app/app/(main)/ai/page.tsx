// mobile_app\app\(main)\ai\page.tsx

"use client";

// mobile_app/app/(main)/ai/page.tsx

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import {
  Send, Copy, Check, ChevronDown,
  TrendingUp, Search, Megaphone, BarChart3, Globe,
  Star, Zap, Target, Plus, Sparkles, StopCircle,
  ThumbsUp, ThumbsDown, User,
} from "lucide-react";

/* ══════════════════════════════════════════════════
   SYSTEM PROMPT
══════════════════════════════════════════════════ */
const SYSTEM_PROMPT = `You are Croissix AI — an elite SEO and Digital Marketing expert with 10+ years of hands-on experience helping businesses grow online.

Your deep expertise covers:
- Google Business Profile optimisation and Local SEO ranking
- Google Ads: Search, Display, Shopping, YouTube, Performance Max
- Facebook and Instagram Ads (Meta Ads Manager, pixel setup, retargeting)
- SEO: technical SEO, on-page optimisation, link building, keyword research
- Content marketing, copywriting, and conversion-focused landing pages
- Social media growth: Instagram, Facebook, LinkedIn, YouTube
- Google Analytics 4, Search Console, Meta Pixel, tag management
- E-commerce growth, Shopify/WooCommerce optimisation, CRO
- Brand building, online reputation management, review strategies
- Email marketing, automation, and customer retention

Your style:
- Confident, direct, results-focused with specific numbers and tactics
- Concrete step-by-step advice with clear action items
- Reference real tools: Semrush, Ahrefs, Google Ads, Meta Ads Manager etc
- Format responses with headers, bullets, and bold for scannability
- Always end with a follow-up question or next step`;

/* ══════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════ */
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  liked?: boolean | null;
}

/* ══════════════════════════════════════════════════
   SUGGESTIONS
══════════════════════════════════════════════════ */
const SUGGESTIONS = [
  { icon: <Search size={14}/>, text: "How do I rank #1 on Google for my local business?", color: "#22c55e" },
  { icon: <Megaphone size={14}/>, text: "Best Google Ads strategy for ₹20,000/month budget", color: "#f97316" },
  { icon: <BarChart3 size={14}/>, text: "How to get more Google reviews quickly?", color: "#3b82f6" },
  { icon: <TrendingUp size={14}/>, text: "Instagram growth strategy for 10K followers", color: "#ec4899" },
  { icon: <Star size={14}/>, text: "Improve my Google Business Profile score", color: "#f59e0b" },
  { icon: <Globe size={14}/>, text: "Facebook Ads vs Google Ads — which is better?", color: "#8b5cf6" },
  { icon: <Zap size={14}/>, text: "SEO basics for a beginner small business owner", color: "#06b6d4" },
  { icon: <Target size={14}/>, text: "Set up Meta retargeting for website visitors", color: "#1877F2" },
];

/* ══════════════════════════════════════════════════
   LOGO
══════════════════════════════════════════════════ */
function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="overflow-visible">
      <style>{`
        @keyframes lsp{0%,100%{transform:scale(1) rotate(0deg)}25%{transform:scale(1.15) rotate(8deg)}75%{transform:scale(1.1) rotate(-8deg)}}
        @keyframes lsc{0%,100%{stop-color:#60a5fa}50%{stop-color:#a78bfa}}
        .lss{transform-origin:12px 12px;animation:lsp 3s ease-in-out infinite}
        .lc1{animation:lsc 3s ease-in-out infinite}
        .lc2{animation:lsc 3s ease-in-out infinite 1s}
      `}</style>
      <defs>
        <linearGradient id="slg" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" className="lc1" stopColor="#60a5fa"/>
          <stop offset="100%" className="lc2" stopColor="#a78bfa"/>
        </linearGradient>
      </defs>
      <path className="lss"
        d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z"
        fill="url(#slg)" stroke="url(#slg)" strokeWidth="0.5"/>
    </svg>
  );
}

/* ══════════════════════════════════════════════════
   TYPING DOTS
══════════════════════════════════════════════════ */
function Dots() {
  return (
    <span className="inline-flex items-center gap-1 ml-1">
      {[0,1,2].map(i => (
        <span key={i} className="w-1.5 h-1.5 rounded-full bg-current opacity-60"
          style={{ animation: "dt 1.4s ease-in-out infinite", animationDelay: `${i * 0.2}s` }}/>
      ))}
      <style>{`@keyframes dt{0%,80%,100%{transform:scale(.6);opacity:.3}40%{transform:scale(1);opacity:1}}`}</style>
    </span>
  );
}

/* ══════════════════════════════════════════════════
   MARKDOWN
══════════════════════════════════════════════════ */
function MD({ text, streaming }: { text: string; streaming?: boolean }) {
  const bold = (s: string) =>
    s.split(/\*\*(.*?)\*\*/g).map((p, j) =>
      j % 2 === 1 ? <strong key={j} className="font-semibold">{p}</strong> : <span key={j}>{p}</span>
    );
  const nonEmpty = text.split("\n").filter(l => l.trim());
  return (
    <div className="space-y-1.5 text-[15px] leading-[1.75]">
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1.5"/>;
        if (line.startsWith("### ")) return <p key={i} className="font-bold text-[15px] mt-3 mb-0.5">{line.slice(4)}</p>;
        if (line.startsWith("## ")) return <p key={i} className="font-bold text-[16px] mt-3 mb-0.5">{line.slice(3)}</p>;
        if (line.match(/^[•\-\*]\s/)) return (
          <div key={i} className="flex items-start gap-2.5 ml-1">
            <span className="mt-[10px] w-1.5 h-1.5 rounded-full bg-current opacity-40 shrink-0"/>
            <span className="flex-1">{bold(line.replace(/^[•\-\*]\s/, ""))}</span>
          </div>
        );
        if (line.match(/^\d+\.\s/)) {
          const num = line.match(/^(\d+)\./)?.[1];
          return (
            <div key={i} className="flex items-start gap-2.5 ml-1">
              <span className="shrink-0 font-semibold opacity-40 text-[13px] mt-0.5 w-4">{num}.</span>
              <span className="flex-1">{bold(line.replace(/^\d+\.\s/, ""))}</span>
            </div>
          );
        }
        const isLast = line === nonEmpty[nonEmpty.length - 1];
        return (
          <p key={i}>{bold(line)}{isLast && streaming && <Dots/>}</p>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MESSAGE ROW
══════════════════════════════════════════════════ */
function MsgRow({ msg, isDark, onFeedback }: {
  msg: Message; isDark: boolean;
  onFeedback: (id: string, liked: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [hover, setHover] = useState(false);
  const isUser = msg.role === "user";

  const copy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (isUser) return (
    <div className="flex justify-end px-4 md:px-8 lg:px-12">
      <div className="max-w-[82%] md:max-w-[65%]">
        <div className="px-4 py-3 rounded-[22px] rounded-br-[6px] text-[15px] leading-relaxed"
          style={{
            background: isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.055)",
            color: isDark ? "#f1f5f9" : "#1e293b",
            fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif",
          }}>
          {msg.content}
        </div>
      </div>
    </div>
  );

  return (
    <div className="px-4 md:px-8 lg:px-12"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}>
      <div className="flex gap-3 items-start max-w-3xl">
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1"
          style={{ background: "linear-gradient(135deg,#1d4ed8,#7c3aed)",
            boxShadow: "0 2px 8px rgba(99,102,241,0.35)" }}>
          <Logo size={13}/>
        </div>

        <div className="flex-1 min-w-0 pb-2">
          {/* Name badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[12px] font-semibold"
              style={{ color: isDark ? "#94a3b8" : "#64748b" }}>Croissix AI</span>
            <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: isDark ? "rgba(249,115,22,0.14)" : "rgba(249,115,22,0.09)", color: "#f97316" }}>
              SEO Expert
            </span>
          </div>

          {/* Content */}
          <div style={{ color: isDark ? "#e2e8f0" : "#1e293b",
            fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif" }}>
            {msg.isStreaming && !msg.content
              ? <span className="text-[15px]" style={{ color: isDark ? "#64748b" : "#94a3b8" }}>
                  Thinking<Dots/>
                </span>
              : <MD text={msg.content} streaming={msg.isStreaming}/>}
          </div>

          {/* Actions — appear on hover */}
          {!msg.isStreaming && msg.content && (
            <div className={`flex items-center gap-0.5 mt-2.5 transition-opacity duration-150 ${hover ? "opacity-100" : "opacity-0"}`}>
              <button onClick={copy}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11.5px] font-medium transition-all active:scale-95"
                style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                  color: isDark ? "#64748b" : "#94a3b8" }}>
                {copied ? <Check size={11} className="text-green-500"/> : <Copy size={11}/>}
                {copied ? "Copied" : "Copy"}
              </button>
              <button onClick={() => onFeedback(msg.id, true)}
                className="p-1.5 rounded-xl transition-all active:scale-95"
                style={{ color: msg.liked === true ? "#22c55e" : isDark ? "#64748b" : "#94a3b8" }}>
                <ThumbsUp size={12}/>
              </button>
              <button onClick={() => onFeedback(msg.id, false)}
                className="p-1.5 rounded-xl transition-all active:scale-95"
                style={{ color: msg.liked === false ? "#ef4444" : isDark ? "#64748b" : "#94a3b8" }}>
                <ThumbsDown size={12}/>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════ */
export default function AIChatPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showScroll, setShowScroll] = useState(false);
  const [focused, setFocused] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback((b: ScrollBehavior = "smooth") => {
    endRef.current?.scrollIntoView({ behavior: b });
  }, []);

  useEffect(() => { if (messages.length) scrollToBottom(); }, [messages]);

  const genId = () => Math.random().toString(36).slice(2);

  const resetTA = () => { if (taRef.current) taRef.current.style.height = "auto"; };

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    const uid = genId(), aiId = genId();
    const userMsg: Message = { id: uid, role: "user", content: text.trim(), timestamp: new Date() };
    const aiMsg: Message = { id: aiId, role: "assistant", content: "", timestamp: new Date(), isStreaming: true };
    setMessages(prev => [...prev, userMsg, aiMsg]);
    setInput(""); resetTA(); setLoading(true);

    try {
      abortRef.current = new AbortController();
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...[...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          ],
        }),
      });
      if (!res.ok) throw new Error("API error");

      const reader = res.body?.getReader();
      const dec = new TextDecoder();
      if (reader) {
        let full = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of dec.decode(value, { stream: true }).split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const d = line.slice(6).trim();
            if (d === "[DONE]") break;
            try {
              const delta = JSON.parse(d)?.choices?.[0]?.delta?.content || "";
              if (delta) {
                full += delta;
                setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: full } : m));
              }
            } catch {}
          }
        }
        if (!full) {
          const json = await res.clone().json().catch(() => null);
          const c = json?.content?.[0]?.text || json?.choices?.[0]?.message?.content || json?.reply || "";
          if (c) setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: c } : m));
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError")
        setMessages(prev => prev.map(m =>
          m.id === aiId ? { ...m, content: "Something went wrong. Please try again." } : m
        ));
    } finally {
      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, isStreaming: false } : m));
      setLoading(false);
    }
  }, [loading, messages]);

  const stop = () => {
    abortRef.current?.abort(); setLoading(false);
    setMessages(prev => prev.map(m => m.isStreaming ? { ...m, isStreaming: false } : m));
  };
  const clear = () => { stop(); setMessages([]); };
  const feedback = (id: string, liked: boolean) =>
    setMessages(prev => prev.map(m => m.id === id ? { ...m, liked } : m));

  const isEmpty = messages.length === 0;
  const pageBg = isDark ? "rgb(10,14,26)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const textP = isDark ? "#f1f5f9" : "#0f172a";
  const textS = isDark ? "#64748b" : "#94a3b8";
  const inputBg = isDark ? "rgb(20,28,44)" : "#f8fafc";
  const inputBorderColor = focused
    ? isDark ? "rgba(99,102,241,0.55)" : "rgba(99,102,241,0.45)"
    : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.11)";

  return (
    /*
      h-full + flex flex-col fills exactly the space the layout provides.
      NO fixed/absolute positioning on the input — it stays at the bottom
      of the flex column naturally via shrink-0.
      Works on both mobile and desktop without any calc() hacks.
    */
    <div className="flex flex-col h-full min-h-0"
      style={{ background: pageBg, fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}>

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-4 py-2.5 shrink-0"
        style={{ borderBottom: isEmpty ? "none" : `1px solid ${border}` }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#7c3aed)" }}>
            <Logo size={15}/>
          </div>
          <div>
            <p className="text-[14px] font-semibold leading-none" style={{ color: textP }}>Croissix AI</p>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ boxShadow: "0 0 4px #22c55e" }}/>
              <span className="text-[10px] font-medium" style={{ color: textS }}>SEO & Marketing Expert</span>
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all active:scale-95"
            style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: textS }}>
            <Plus size={13}/> New chat
          </button>
        )}
      </div>

      {/* ── MESSAGES — flex-1 min-h-0 overflow-y-auto ── */}
      <div ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto py-5 flex flex-col gap-5"
        onScroll={() => {
          const el = scrollRef.current;
          if (el) setShowScroll(el.scrollHeight - el.scrollTop - el.clientHeight > 80);
        }}
        style={{ scrollbarWidth: "none" }}>

        {/* ── EMPTY STATE ── */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center flex-1 px-4 py-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "linear-gradient(135deg,#1d4ed8,#7c3aed)",
                boxShadow: "0 8px 28px rgba(99,102,241,0.4)" }}>
              <Logo size={26}/>
            </div>
            <h2 className="text-[22px] font-bold mb-1.5 text-center"
              style={{ color: textP, letterSpacing: "-0.03em",
                fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif" }}>
              How can I help you?
            </h2>
            <p className="text-[14px] text-center mb-7 leading-relaxed"
              style={{ color: textS, maxWidth: 280 }}>
              Ask me anything about SEO, Google Ads, Meta Ads, or growing your business online.
            </p>

            {/* Suggestion grid */}
            <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => send(s.text)}
                  className="flex items-start gap-3 px-4 py-3.5 rounded-2xl text-left transition-all active:scale-[0.98]"
                  style={{ background: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc", border: `1px solid ${border}` }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(255,255,255,0.07)" : "#f1f5f9";
                    (e.currentTarget as HTMLElement).style.borderColor = s.color + "44";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(255,255,255,0.04)" : "#f8fafc";
                    (e.currentTarget as HTMLElement).style.borderColor = border;
                  }}>
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${s.color}15` }}>
                    <span style={{ color: s.color }}>{s.icon}</span>
                  </div>
                  <span className="text-[13px] leading-snug" style={{ color: textP }}>{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── MESSAGES ── */}
        {messages.map(msg => (
          <MsgRow key={msg.id} msg={msg} isDark={isDark} onFeedback={feedback}/>
        ))}
        <div ref={endRef} className="h-1"/>
      </div>

      {/* Scroll-to-bottom pill */}
      {showScroll && (
        <div className="flex justify-center pb-2 shrink-0">
          <button onClick={() => scrollToBottom()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all active:scale-95"
            style={{ background: isDark ? "rgba(30,41,59,0.95)" : "white",
              border: `1px solid ${border}`, color: textP,
              boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.45)" : "0 4px 16px rgba(0,0,0,0.1)" }}>
            <ChevronDown size={13}/> Scroll to bottom
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════
          INPUT — shrink-0, always at bottom.
          Uses the flex column naturally —
          NO fixed, NO absolute, NO calc().
          Works on mobile AND desktop.
      ══════════════════════════════════════ */}
      <div className="shrink-0 px-4 pb-5 pt-2">
        <div className="max-w-2xl mx-auto">

          {/* Floating input card */}
          <div className="rounded-[20px] overflow-hidden"
            style={{
              position:"fixed",
              bottom: 95,
              left: 18,
              width: "92vw",
              background: inputBg,
              border: `1.5px solid ${inputBorderColor}`,
              boxShadow: focused
                ? isDark
                  ? "0 0 0 4px rgba(99,102,241,0.12), 0 8px 32px rgba(0,0,0,0.5)"
                  : "0 0 0 4px rgba(99,102,241,0.08), 0 8px 28px rgba(0,0,0,0.1)"
                : isDark
                  ? "0 4px 24px rgba(0,0,0,0.4)"
                  : "0 4px 20px rgba(0,0,0,0.08)",
              transition: "border-color .18s, box-shadow .18s",
            }}>
            <textarea
              ref={taRef}
              value={input}
              rows={1}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
              }}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
              }}
              disabled={loading}
              placeholder="Ask about SEO, Google Ads, growth strategies…"
              className="w-full resize-none outline-none bg-transparent px-4 pt-4 pb-2 text-[15px] leading-relaxed"
              style={{
                color: isDark ? "#e2e8f0" : "#1e293b",
                caretColor: "#6366f1",
                fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif",
                maxHeight: 160,
                scrollbarWidth: "none",
              }}/>

            {/* Bottom toolbar */}
            <div className="flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{ background: isDark ? "rgba(99,102,241,0.13)" : "rgba(99,102,241,0.09)", color: "#6366f1" }}>
                  <Sparkles size={10}/>
                  SEO Expert
                </div>
              </div>

              <div className="flex items-center gap-2">
                {input.length > 0 && !loading && (
                  <span className="text-[11px]" style={{ color: textS }}>{input.length}</span>
                )}
                {loading ? (
                  <button onClick={stop}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-2xl text-[12px] font-semibold transition-all active:scale-95"
                    style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
                      color: isDark ? "#f1f5f9" : "#1e293b" }}>
                    <StopCircle size={13}/> Stop
                  </button>
                ) : (
                  <button onClick={() => send(input)} disabled={!input.trim()}
                    className="w-9 h-9 rounded-[14px] flex items-center justify-center transition-all active:scale-90 disabled:opacity-25"
                    style={{
                      background: input.trim()
                        ? "linear-gradient(135deg,#4f46e5,#7c3aed)"
                        : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
                      boxShadow: input.trim() ? "0 2px 12px rgba(99,102,241,0.45)" : "none",
                      transition: "all .18s cubic-bezier(.34,1.1,.64,1)",
                    }}>
                    <Send size={14} style={{ color: input.trim() ? "white" : textS }}/>
                  </button>
                )}
              </div>
            </div>
          </div>

          <p className="text-center text-[10.5px] mt-2"
            style={{ color: isDark ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.22)" }}>
            Croissix AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}