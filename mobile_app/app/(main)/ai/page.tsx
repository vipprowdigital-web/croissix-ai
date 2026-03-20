// mobile_app\app\(main)\ai\page.tsx
"use client";

// mobile_app/app/(main)/ai/page.tsx
// Full-page AI Chat — SEO & Digital Marketing Expert
// Route: /ai

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import {
  Send,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  X,
  TrendingUp,
  Search,
  Megaphone,
  BarChart3,
  Globe,
  Star,
  Zap,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  ArrowUpRight,
  Loader2,
  User,
  Sparkles,
  Target,
  Shield,
  Award,
  Brain,
} from "lucide-react";

/* ══════════════════════════════════════════════════
   SYSTEM PROMPT
══════════════════════════════════════════════════ */
const SYSTEM_PROMPT = `You are Croissix AI — an elite SEO and Digital Marketing expert with 10+ years of hands-on experience helping businesses grow online.

Your deep expertise covers:
• Google Business Profile optimisation & Local SEO ranking
• Google Ads: Search, Display, Shopping, YouTube, Performance Max
• Facebook & Instagram Ads (Meta Ads Manager, pixel setup, retargeting)
• SEO: technical SEO, on-page optimisation, link building, keyword research
• Content marketing, copywriting, and conversion-focused landing pages
• Social media growth: Instagram, Facebook, LinkedIn, YouTube
• Google Analytics 4, Search Console, Meta Pixel, tag management
• E-commerce growth, Shopify/WooCommerce optimisation, CRO
• Brand building, online reputation management, review strategies
• Email marketing, automation, and customer retention
• Competitor analysis and market positioning

Your style:
• Confident, direct, and results-focused — give specific numbers and tactics
• Use concrete step-by-step advice with clear action items
• Reference real tools: Semrush, Ahrefs, Google Ads, Meta Ads Manager, etc.
• Format responses with headers, bullets, and bold for scannability
• Keep answers concise unless depth is explicitly needed
• Always end with a follow-up question or "next step" to guide the user

You represent Croissix — a digital growth platform. Be proud of it.`;

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
   QUICK PROMPTS
══════════════════════════════════════════════════ */
const QUICK_PROMPTS = [
  {
    icon: <Search size={13} />,
    label: "Rank #1 on Google",
    text: "How do I rank my website on the first page of Google? Give me a step-by-step plan.",
    color: "#22c55e",
  },
  {
    icon: <Megaphone size={13} />,
    label: "Google Ads strategy",
    text: "What is the best Google Ads strategy for a local business with a ₹20,000/month budget?",
    color: "#f97316",
  },
  {
    icon: <BarChart3 size={13} />,
    label: "More reviews fast",
    text: "How do I get more Google reviews for my business quickly and ethically?",
    color: "#3b82f6",
  },
  {
    icon: <Globe size={13} />,
    label: "Facebook vs Google",
    text: "Should I invest in Facebook Ads or Google Ads? Compare them for my business.",
    color: "#8b5cf6",
  },
  {
    icon: <TrendingUp size={13} />,
    label: "Instagram growth",
    text: "Give me a proven Instagram growth strategy to reach 10,000 followers in 3 months.",
    color: "#ec4899",
  },
  {
    icon: <Star size={13} />,
    label: "Improve GBP score",
    text: "How do I improve my Google Business Profile score and ranking in local search?",
    color: "#f59e0b",
  },
  {
    icon: <Zap size={13} />,
    label: "SEO basics",
    text: "Explain SEO for a complete beginner running a small business. What should I do first?",
    color: "#06b6d4",
  },
  {
    icon: <MessageSquare size={13} />,
    label: "Write ad copy",
    text: "Write compelling Google Ads copy for a restaurant in Mumbai. Include 3 headlines and descriptions.",
    color: "#22c55e",
  },
  {
    icon: <Target size={13} />,
    label: "Meta retargeting",
    text: "How do I set up Meta retargeting ads to bring back website visitors who didn't convert?",
    color: "#1877F2",
  },
  {
    icon: <Shield size={13} />,
    label: "Reputation mgmt",
    text: "How do I manage and improve my online reputation on Google and social media?",
    color: "#10b981",
  },
];

/* ══════════════════════════════════════════════════
   AI SPARKLE ICON
══════════════════════════════════════════════════ */
function AISparkle({ size = 17 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="overflow-visible"
    >
      <style>{`
        @keyframes gstar2{0%,100%{transform:scale(1) rotate(0deg)}25%{transform:scale(1.2) rotate(12deg)}50%{transform:scale(0.85) rotate(0deg)}75%{transform:scale(1.15) rotate(-10deg)}}
        @keyframes gsh2{0%,100%{stop-color:white;stop-opacity:.9}33%{stop-color:#a5f3fc;stop-opacity:1}66%{stop-color:#c4b5fd;stop-opacity:1}}
        .gs2{transform-origin:12px 11px;animation:gstar2 2.8s ease-in-out infinite}
        .gx21{animation:gsh2 2.8s ease-in-out infinite}
        .gx22{animation:gsh2 2.8s ease-in-out infinite .9s}
        .gx23{animation:gsh2 2.8s ease-in-out infinite 1.8s}
      `}</style>
      <defs>
        <linearGradient
          id="ag2"
          x1="3"
          y1="2"
          x2="21"
          y2="20"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            className="gx21"
            stopColor="white"
            stopOpacity=".9"
          />
          <stop
            offset="50%"
            className="gx22"
            stopColor="#a5f3fc"
            stopOpacity="1"
          />
          <stop
            offset="100%"
            className="gx23"
            stopColor="#c4b5fd"
            stopOpacity="1"
          />
        </linearGradient>
      </defs>
      <path
        className="gs2"
        d="M12 2L13.8 9.2L21 11L13.8 12.8L12 20L10.2 12.8L3 11L10.2 9.2L12 2Z"
        stroke="url(#ag2)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="url(#ag2)"
        fillOpacity="0.3"
      />
    </svg>
  );
}

/* ══════════════════════════════════════════════════
   TYPING DOTS
══════════════════════════════════════════════════ */
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-blue-400"
          style={{
            animation: "tDot 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <style>{`@keyframes tDot{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(-4px);opacity:1}}`}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MARKDOWN RENDERER
══════════════════════════════════════════════════ */
function MD({ text }: { text: string }) {
  const lines = text.split("\n");
  const bold = (s: string) => {
    const parts = s.split(/\*\*(.*?)\*\*/g);
    return parts.map((p, j) =>
      j % 2 === 1 ? (
        <strong key={j} className="font-semibold">
          {p}
        </strong>
      ) : (
        <span key={j}>{p}</span>
      ),
    );
  };
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        if (line.startsWith("### "))
          return (
            <p key={i} className="font-black text-[13px] mt-2 mb-0.5">
              {line.slice(4)}
            </p>
          );
        if (line.startsWith("## "))
          return (
            <p key={i} className="font-black text-[14px] mt-2 mb-0.5">
              {line.slice(3)}
            </p>
          );
        if (line.match(/^[•\-\*]\s/))
          return (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-[5px] shrink-0" />
              <span className="flex-1">
                {bold(line.replace(/^[•\-\*]\s/, ""))}
              </span>
            </div>
          );
        if (line.match(/^\d+\.\s/)) {
          const num = line.match(/^(\d+)\./)?.[1];
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="text-blue-400 font-bold shrink-0 text-[11px] mt-0.5 w-3">
                {num}.
              </span>
              <span className="flex-1">
                {bold(line.replace(/^\d+\.\s/, ""))}
              </span>
            </div>
          );
        }
        return <p key={i}>{bold(line)}</p>;
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MESSAGE BUBBLE
══════════════════════════════════════════════════ */
function Bubble({
  msg,
  isDark,
  onFeedback,
}: {
  msg: Message;
  isDark: boolean;
  onFeedback: (id: string, liked: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === "user";

  const copy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={`flex gap-2.5 items-end ${isUser ? "flex-row-reverse" : ""}`}
      style={{ animation: "mIn 0.28s cubic-bezier(0.34,1.1,0.64,1)" }}
    >
      <style>{`@keyframes mIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Avatar */}
      {!isUser ? (
        <div
          className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 mb-0.5"
          style={{
            background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
            boxShadow: "0 2px 8px rgba(37,99,235,0.4)",
          }}
        >
          <AISparkle size={15} />
        </div>
      ) : (
        <div
          className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 mb-0.5"
          style={{
            background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)",
          }}
        >
          <User size={14} style={{ color: isDark ? "#94a3b8" : "#64748b" }} />
        </div>
      )}

      <div
        className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"} max-w-[80%] md:max-w-[72%]`}
      >
        <div
          className="px-4 py-3 rounded-[18px] text-[13.5px] leading-relaxed"
          style={{
            background: isUser
              ? "linear-gradient(135deg,#1d4ed8,#3b82f6)"
              : isDark
                ? "rgba(255,255,255,0.07)"
                : "#ffffff",
            color: isUser ? "white" : isDark ? "#e2e8f0" : "#1e293b",
            borderBottomRightRadius: isUser ? 5 : 18,
            borderBottomLeftRadius: isUser ? 18 : 5,
            border: isUser
              ? "none"
              : `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}`,
            boxShadow: isUser
              ? "0 4px 14px rgba(37,99,235,0.3)"
              : isDark
                ? "none"
                : "0 2px 8px rgba(0,0,0,0.06)",
            fontFamily:
              "-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif",
          }}
        >
          {msg.isStreaming && !msg.content ? (
            <TypingDots />
          ) : isUser ? (
            <span>{msg.content}</span>
          ) : (
            <MD text={msg.content} />
          )}
          {msg.isStreaming && msg.content && (
            <span
              className="inline-block w-0.5 h-3.5 bg-blue-400 ml-0.5 rounded-sm"
              style={{ animation: "blink 1s step-end infinite" }}
            />
          )}
          <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
        </div>

        {/* Actions */}
        {!msg.isStreaming && (
          <div
            className={`flex items-center gap-1 px-1 ${isUser ? "flex-row-reverse" : ""}`}
          >
            <span
              className="text-[10px]"
              style={{
                color: isDark ? "#334155" : "#cbd5e1",
                fontFamily: "-apple-system,BlinkMacSystemFont,sans-serif",
              }}
            >
              {msg.timestamp.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
            {!isUser && (
              <>
                <button
                  onClick={copy}
                  className="p-1.5 rounded-lg transition-all active:scale-90"
                  style={{ color: isDark ? "#475569" : "#94a3b8" }}
                >
                  {copied ? (
                    <Check size={11} className="text-green-500" />
                  ) : (
                    <Copy size={11} />
                  )}
                </button>
                <button
                  onClick={() => onFeedback(msg.id, true)}
                  className="p-1.5 rounded-lg transition-all active:scale-90"
                  style={{
                    color:
                      msg.liked === true
                        ? "#22c55e"
                        : isDark
                          ? "#475569"
                          : "#94a3b8",
                  }}
                >
                  <ThumbsUp size={11} />
                </button>
                <button
                  onClick={() => onFeedback(msg.id, false)}
                  className="p-1.5 rounded-lg transition-all active:scale-90"
                  style={{
                    color:
                      msg.liked === false
                        ? "#ef4444"
                        : isDark
                          ? "#475569"
                          : "#94a3b8",
                  }}
                >
                  <ThumbsDown size={11} />
                </button>
              </>
            )}
          </div>
        )}
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

  const endRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    endRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (messages.length) scrollToBottom();
  }, [messages]);

  const genId = () => Math.random().toString(36).slice(2);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      const userMsg: Message = {
        id: genId(),
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };
      const aiId = genId();
      const aiMsg: Message = {
        id: aiId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      };
      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setInput("");
      setLoading(true);

      try {
        abortRef.current = new AbortController();
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortRef.current.signal,
          body: JSON.stringify({
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              ...[...messages, userMsg].map((m) => ({
                role: m.role,
                content: m.content,
              })),
            ],
          }),
        });
        if (!res.ok) throw new Error("API error");

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        if (reader) {
          let full = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split("\n")) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                const delta =
                  parsed.choices?.[0]?.delta?.content ||
                  parsed.content?.[0]?.text ||
                  "";
                if (delta) {
                  full += delta;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === aiId ? { ...m, content: full } : m,
                    ),
                  );
                }
              } catch {}
            }
          }
          if (!full) {
            const json = await res
              .clone()
              .json()
              .catch(() => null);
            const content =
              json?.content?.[0]?.text ||
              json?.choices?.[0]?.message?.content ||
              json?.reply ||
              "";
            if (content)
              setMessages((prev) =>
                prev.map((m) => (m.id === aiId ? { ...m, content } : m)),
              );
          }
        }
      } catch (e: any) {
        if (e.name !== "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiId
                ? {
                    ...m,
                    content: "⚠️ Something went wrong. Please try again.",
                  }
                : m,
            ),
          );
        }
      } finally {
        setMessages((prev) =>
          prev.map((m) => (m.id === aiId ? { ...m, isStreaming: false } : m)),
        );
        setLoading(false);
      }
    },
    [loading, messages],
  );

  const clear = () => {
    abortRef.current?.abort();
    setMessages([]);
    setLoading(false);
  };
  const feedback = (id: string, liked: boolean) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, liked } : m)));

  const isEmpty = messages.length === 0;

  const bg = isDark ? "rgb(10,14,26)" : "#f1f5f9";
  const cardBg = isDark ? "rgb(16,23,38)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const textPrimary = isDark ? "#f0f4ff" : "#0f172a";
  const textSub = isDark ? "#475569" : "#94a3b8";
  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";

  return (
    <div
      className="w-full flex flex-col"
      style={{
        height: "calc(100vh - 60px)" /* subtract desktop topbar height */,
        background: bg,
        fontFamily: "-apple-system,'SF Pro Text',sans-serif",
      }}
    >
      {/* ── DESKTOP: 2-panel layout | MOBILE: full-screen chat ── */}
      <div className="flex flex-1 min-h-0 h-full">
        {/* ── LEFT SIDEBAR: Agent info + quick prompts (desktop only) ── */}
        <div
          className="hidden lg:flex flex-col w-[280px] xl:w-[300px] shrink-0 border-r overflow-y-auto"
          style={{ borderColor: border, background: cardBg }}
        >
          {/* Agent card */}
          <div className="p-5">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="relative mb-3">
                <div
                  className="w-16 h-16 rounded-3xl flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg,#1d4ed8,#3b82f6,#60a5fa)",
                    boxShadow: "0 8px 24px rgba(37,99,235,0.45)",
                  }}
                >
                  <AISparkle size={28} />
                </div>
                <div
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-400"
                  style={{
                    border: `2.5px solid ${cardBg}`,
                    boxShadow: "0 0 8px #22c55e",
                  }}
                />
              </div>
              <h2
                className="font-black text-[17px] mb-0.5"
                style={{
                  color: textPrimary,
                  letterSpacing: "-0.03em",
                  fontFamily:
                    "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
                }}
              >
                Croissix AI
              </h2>
              <div className="flex items-center gap-1.5 mb-2">
                <span
                  className="text-[9px] font-black px-2 py-0.5 rounded-full text-white uppercase tracking-wide"
                  style={{
                    background: "linear-gradient(135deg,#f97316,#ea580c)",
                  }}
                >
                  SEO Expert
                </span>
                <span
                  className="text-[9px] font-black px-2 py-0.5 rounded-full text-white uppercase tracking-wide"
                  style={{
                    background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
                  }}
                >
                  Marketing
                </span>
              </div>
              <p
                className="text-[12px] leading-relaxed"
                style={{ color: textSub, maxWidth: 220 }}
              >
                Your personal SEO & Digital Marketing expert. Ask anything about
                growing your business online.
              </p>
            </div>

            {/* Expertise chips */}
            <div className="flex flex-wrap gap-1.5 mb-5 justify-center">
              {[
                { label: "Google Ads", color: "#4285F4" },
                { label: "Local SEO", color: "#22c55e" },
                { label: "Meta Ads", color: "#1877F2" },
                { label: "Instagram", color: "#e1306c" },
                { label: "Analytics", color: "#f97316" },
                { label: "YouTube", color: "#ef4444" },
                { label: "Content", color: "#8b5cf6" },
                { label: "E-Commerce", color: "#06b6d4" },
              ].map((c) => (
                <span
                  key={c.label}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: `${c.color}14`,
                    color: c.color,
                    border: `1px solid ${c.color}22`,
                  }}
                >
                  {c.label}
                </span>
              ))}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { val: "10+", label: "Yrs Exp" },
                { val: "500+", label: "Clients" },
                { val: "24/7", label: "Available" },
              ].map((s, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-2.5 text-center"
                  style={{
                    background: isDark
                      ? "rgba(255,255,255,0.04)"
                      : "rgba(0,0,0,0.03)",
                    border: `1px solid ${border}`,
                  }}
                >
                  <div
                    className="text-[15px] font-black"
                    style={{ color: textPrimary, letterSpacing: "-0.03em" }}
                  >
                    {s.val}
                  </div>
                  <div
                    className="text-[9px] font-semibold uppercase tracking-wide"
                    style={{ color: textSub }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="h-px mb-4" style={{ background: border }} />

            {/* Quick prompts */}
            <p
              className="text-[9.5px] font-black uppercase tracking-widest mb-2.5"
              style={{ color: textSub }}
            >
              Quick Questions
            </p>
            <div className="flex flex-col gap-1.5">
              {QUICK_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => send(p.text)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-[12px] text-left text-[12px] font-medium transition-all active:scale-[0.98]"
                  style={{
                    background: isDark
                      ? "rgba(255,255,255,0.04)"
                      : "rgba(0,0,0,0.03)",
                    border: `1px solid ${border}`,
                    color: isDark ? "#94a3b8" : "#475569",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
                  }}
                >
                  <span style={{ color: p.color, flexShrink: 0 }}>
                    {p.icon}
                  </span>
                  <span className="flex-1 truncate">{p.label}</span>
                  <ArrowUpRight
                    size={11}
                    style={{ color: textSub, flexShrink: 0 }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── MAIN CHAT AREA ── */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0">
          {/* Chat header */}
          <div
            className="flex items-center gap-3 px-4 py-3 shrink-0"
            style={{ borderBottom: `1px solid ${border}`, background: cardBg }}
          >
            {/* Mobile: avatar + name */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative shrink-0">
                <div
                  className="w-9 h-9 rounded-[11px] flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
                    boxShadow: "0 2px 10px rgba(37,99,235,0.4)",
                  }}
                >
                  <AISparkle size={16} />
                </div>
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400"
                  style={{ border: `2px solid ${cardBg}` }}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className="font-black text-[15px]"
                    style={{
                      color: textPrimary,
                      letterSpacing: "-0.02em",
                      fontFamily:
                        "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
                    }}
                  >
                    Croissix AI
                  </p>
                  <span
                    className="hidden sm:inline text-[9px] font-black px-1.5 py-0.5 rounded-full text-white uppercase tracking-wide"
                    style={{
                      background: "linear-gradient(135deg,#f97316,#ea580c)",
                    }}
                  >
                    SEO Expert
                  </span>
                </div>
                <p className="text-[11px] truncate" style={{ color: textSub }}>
                  Google · Meta · SEO · Growth Strategy
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              {messages.length > 0 && (
                <button
                  onClick={clear}
                  className="w-8 h-8 flex items-center justify-center rounded-[10px] transition-all active:scale-90"
                  style={{
                    background: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.05)",
                    color: textSub,
                  }}
                  title="Clear chat"
                >
                  <RotateCcw size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4"
            onScroll={() => {
              const el = scrollRef.current;
              if (el)
                setShowScroll(
                  el.scrollHeight - el.scrollTop - el.clientHeight > 100,
                );
            }}
            style={{ scrollbarWidth: "none" }}
          >
            {/* Empty state */}
            {isEmpty && (
              <div className="flex flex-col items-center justify-center flex-1 py-10 px-4">
                <div
                  className="w-20 h-20 rounded-[24px] flex items-center justify-center mb-5"
                  style={{
                    background:
                      "linear-gradient(135deg,#1d4ed8 0%,#3b82f6 60%,#60a5fa 100%)",
                    boxShadow: "0 12px 36px rgba(37,99,235,0.45)",
                  }}
                >
                  <AISparkle size={36} />
                </div>
                <h3
                  className="font-black text-[20px] mb-2 text-center"
                  style={{
                    color: textPrimary,
                    letterSpacing: "-0.04em",
                    fontFamily:
                      "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
                  }}
                >
                  Your Marketing Brain
                </h3>
                <p
                  className="text-[13px] text-center leading-relaxed mb-8"
                  style={{ color: textSub, maxWidth: 340 }}
                >
                  Ask me anything — SEO tactics, Google Ads strategy, Instagram
                  growth, review management, or how to outrank your competitors.
                </p>

                {/* Quick prompt grid — mobile/desktop */}
                <div className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {QUICK_PROMPTS.slice(0, 6).map((p, i) => (
                    <button
                      key={i}
                      onClick={() => send(p.text)}
                      className="flex items-start gap-3 px-4 py-3.5 rounded-[14px] text-left transition-all active:scale-[0.97]"
                      style={{
                        background: isDark
                          ? "rgba(255,255,255,0.05)"
                          : "#ffffff",
                        border: `1px solid ${border}`,
                        boxShadow: isDark
                          ? "none"
                          : "0 2px 8px rgba(0,0,0,0.05)",
                      }}
                      onMouseEnter={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.borderColor = p.color + "50";
                      }}
                      onMouseLeave={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.borderColor = border;
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: `${p.color}15` }}
                      >
                        <span style={{ color: p.color }}>{p.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-semibold text-[12.5px] mb-0.5"
                          style={{ color: textPrimary }}
                        >
                          {p.label}
                        </p>
                        <p
                          className="text-[11px] line-clamp-2"
                          style={{ color: textSub }}
                        >
                          {p.text}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message list */}
            {messages.map((msg) => (
              <Bubble
                key={msg.id}
                msg={msg}
                isDark={isDark}
                onFeedback={feedback}
              />
            ))}
            <div ref={endRef} />
          </div>

          {/* Scroll to bottom */}
          {showScroll && (
            <button
              onClick={() => scrollToBottom()}
              className="absolute bottom-24 right-6 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{
                background: isDark ? "rgba(37,99,235,0.85)" : "#2563eb",
                boxShadow: "0 4px 14px rgba(37,99,235,0.4)",
                color: "white",
                zIndex: 10,
              }}
            >
              <ChevronDown size={15} />
            </button>
          )}

          {/* Quick prompt chips — when chat has messages */}
          {!isEmpty && !loading && (
            <div className="px-4 pt-2 pb-1 shrink-0">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
                {QUICK_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => send(p.text)}
                    className="flex items-center gap-1.5 h-7 px-3 rounded-[10px] text-[11px] font-semibold whitespace-nowrap shrink-0 transition-all active:scale-95"
                    style={{
                      background: isDark
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.04)",
                      border: `1px solid ${border}`,
                      color: p.color,
                    }}
                  >
                    {p.icon}
                    <span style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                      {p.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div
            className="px-4 pt-3 pb-4 shrink-0"
            style={{ borderTop: `1px solid ${border}`, background: cardBg }}
          >
            <div className="flex items-end gap-2.5 max-w-3xl mx-auto">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  rows={1}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height =
                      Math.min(e.target.scrollHeight, 130) + "px";
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  disabled={loading}
                  placeholder="Ask about SEO, Google Ads, Instagram growth…"
                  className="w-full resize-none outline-none rounded-[16px] px-4 py-3.5 text-[13.5px] leading-relaxed transition-all"
                  style={{
                    background: inputBg,
                    border: `1.5px solid ${isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.09)"}`,
                    color: isDark ? "#e2e8f0" : "#1e293b",
                    caretColor: "#3b82f6",
                    fontFamily:
                      "-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif",
                    maxHeight: 130,
                    scrollbarWidth: "none",
                    boxShadow: isDark ? "none" : "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                />
              </div>

              <button
                onClick={() => send(input)}
                disabled={!input.trim() || loading}
                className="flex-shrink-0 w-12 h-12 rounded-[14px] flex items-center justify-center transition-all active:scale-90 disabled:opacity-40"
                style={{
                  background:
                    input.trim() && !loading
                      ? "linear-gradient(135deg,#1d4ed8,#3b82f6)"
                      : inputBg,
                  boxShadow:
                    input.trim() && !loading
                      ? "0 4px 16px rgba(37,99,235,0.45)"
                      : "none",
                  border: `1px solid ${input.trim() && !loading ? "transparent" : border}`,
                  transition: "all 0.2s cubic-bezier(0.34,1.1,0.64,1)",
                }}
              >
                {loading ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                    style={{ color: textSub }}
                  />
                ) : (
                  <Send
                    size={17}
                    style={{ color: input.trim() ? "white" : textSub }}
                  />
                )}
              </button>
            </div>

            <p
              className="text-center text-[10px] mt-2"
              style={{
                color: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.2)",
                fontFamily: "-apple-system,BlinkMacSystemFont,sans-serif",
              }}
            >
              Croissix AI · SEO & Digital Marketing Expert · Enter to send ·
              Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
