// app/(main)/messages/facebook/[conversationId]/page.tsx
// Web port of mobile FacebookConversationScreen.
// Theme matches the existing Facebook Comments web page exactly.
// Renders as a chat-bubble thread with an inline reply input at the bottom.

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  RefreshCw,
  MessageCircle,
  AlertCircle,
} from "lucide-react";
import { getAuthHeader } from "@/lib/token";

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */

interface ConversationMessage {
  id: string;
  from: { name: string; id?: string };
  message: string;
  created_time: string; // Graph API returns snake_case
  isPageMessage?: boolean;
}

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

function formatFullTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const AV_COLORS = [
  "#8B5CF6",
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#1877F2",
  "#EC4899",
  "#06B6D4",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AV_COLORS[Math.abs(hash) % AV_COLORS.length];
}

/* ══════════════════════════════════════════════════════════
   MESSAGE BUBBLE
══════════════════════════════════════════════════════════ */

function MessageBubble({
  msg,
  outgoing,
  senderName,
  isDark,
}: {
  msg: ConversationMessage;
  outgoing: boolean;
  senderName: string;
  isDark: boolean;
}) {
  const avatarColor = getAvatarColor(senderName);

  return (
    <div
      className={`flex items-end gap-2 mb-2 ${outgoing ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Incoming avatar */}
      {!outgoing && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-black shrink-0 mb-0.5"
          style={{ background: avatarColor }}
        >
          {msg.from?.name?.charAt(0)?.toUpperCase() ?? "?"}
        </div>
      )}

      <div
        className="max-w-[70%] px-3.5 py-2.5 rounded-2xl"
        style={{
          background: outgoing ? "#1877F2" : isDark ? "#131c2d" : "#f1f5f9",
          borderRadius: outgoing ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          border: outgoing
            ? "none"
            : `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}`,
        }}
      >
        <p
          className="text-[13.5px] leading-relaxed"
          style={{ color: outgoing ? "#fff" : isDark ? "#e2e8f0" : "#1e293b" }}
        >
          {msg.message}
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════ */

export default function FacebookConversationPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Route params: /messages/facebook/[conversationId]?senderName=...&senderId=...
  const conversationId = params.conversationId as string;
  const senderName = searchParams.get("senderName") ?? "Unknown";
  const senderId = searchParams.get("senderId") ?? "";

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [pageName, setPageName] = useState("");

  const avatarColor = getAvatarColor(senderName);

  // ── Load messages ──────────────────────────────────────────────────────

  const loadMessages = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/facebook/messages/${conversationId}`,
          { headers: { Authorization: getAuthHeader() ?? "" } },
        );
        const json = await res.json();
        if (!json.success && !json.data)
          throw new Error(json.message ?? "Failed to load conversation");

        const data = json.data ?? json;
        // Graph API returns newest-first — reverse so oldest is at the top
        setMessages((data.messages ?? []).slice().reverse());
        if (data.pageName) setPageName(data.pageName);
      } catch (e: any) {
        setError(e.message ?? "Failed to load conversation.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [conversationId],
  );

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // ── Scroll to bottom when messages change ──────────────────────────────

  useEffect(() => {
    if (messages.length > 0 && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    }
  }, [messages.length]);

  // ── Determine message direction ────────────────────────────────────────
  // Outgoing = sent by the page (not from the customer)

  const isOutgoing = (msg: ConversationMessage): boolean => {
    if (msg.isPageMessage !== undefined) return msg.isPageMessage;
    return msg.from?.name !== senderName;
  };

  // ── Send message ───────────────────────────────────────────────────────

  const handleSend = async () => {
    if (!replyText.trim() || !senderId) return;
    setSending(true);
    const text = replyText.trim();
    setReplyText("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/facebook/messages/send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: getAuthHeader() ?? "",
          },
          body: JSON.stringify({ recipientId: senderId, message: text }),
        },
      );
      const json = await res.json();
      if (!json.success && !json.data)
        throw new Error(json.message ?? "Failed to send");

      // Optimistic append — don't wait for a refetch
      setMessages((prev) => [
        ...prev,
        {
          id: `opt-${Date.now()}`,
          from: { name: pageName || "You" },
          message: text,
          created_time: new Date().toISOString(),
          isPageMessage: true,
        },
      ]);
    } catch (e: any) {
      setReplyText(text); // restore input on failure
      setError(e.message ?? "Failed to send message.");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Allow Ctrl+Enter or Cmd+Enter to send
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="w-full h-[calc(100vh-120px)] flex flex-col items-center justify-center">
        <RefreshCw
          size={24}
          className="animate-spin"
          style={{ color: "#1877F2" }}
        />
        <p
          className={`text-[13px] mt-3 ${isDark ? "text-slate-500" : "text-slate-400"}`}
        >
          Loading conversation…
        </p>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────

  if (error && messages.length === 0) {
    return (
      <div
        className="w-full"
        style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}
      >
        {/* Back header */}
        <div className="pt-2 pb-4">
          <button
            onClick={() => router.back()}
            className={`flex items-center gap-2 text-[13px] font-semibold transition-all active:scale-95
            ${isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"}`}
          >
            <ArrowLeft size={16} />
            Back to Messages
          </button>
        </div>

        <div
          className={`rounded-2xl p-10 text-center border ${isDark ? "bg-[#131c2d] border-white/[0.06]" : "bg-white border-black/[0.05]"}`}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "#1877F215" }}
          >
            <MessageCircle size={28} style={{ color: "#1877F2" }} />
          </div>
          <p
            className={`text-[15px] font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Failed to load conversation
          </p>
          <p
            className={`text-[13px] mb-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
          >
            {error}
          </p>
          <button
            onClick={() => loadMessages()}
            className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-full text-white text-[13px] font-bold"
            style={{ background: "#1877F2" }}
          >
            <RefreshCw size={13} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────

  return (
    <div
      className="w-full flex flex-col"
      style={{
        height: "calc(100vh - 80px)", // leave room for sidebar/nav
        fontFamily: "-apple-system,'SF Pro Text',sans-serif",
      }}
    >
      {/* ── Thread header ── */}
      <div
        className={`flex items-center gap-3 px-0 py-3 border-b shrink-0
        ${isDark ? "border-white/[0.06]" : "border-slate-200"}`}
      >
        <button
          onClick={() => router.back()}
          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90
          ${isDark ? "bg-white/[0.07] text-slate-400 hover:bg-white/[0.12]" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
        >
          <ArrowLeft size={16} />
        </button>

        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px] font-black shrink-0"
          style={{ background: avatarColor }}
        >
          {senderName.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className={`text-[14px] font-black truncate ${isDark ? "text-white" : "text-slate-900"}`}
          >
            {senderName}
          </p>
          <p
            className={`text-[11px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
          >
            Messenger
          </p>
        </div>

        <button
          onClick={() => loadMessages(true)}
          disabled={refreshing}
          className={`w-8 h-8 flex items-center justify-center rounded-xl shrink-0 transition-all active:scale-90 disabled:opacity-50
          ${isDark ? "bg-white/[0.07] text-slate-400" : "bg-white text-slate-500 border border-slate-200"}`}
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {/* ── Message list (scrollable) ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-4 px-0"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: isDark
            ? "#334155 transparent"
            : "#cbd5e1 transparent",
        }}
      >
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full py-16">
            <MessageCircle
              size={32}
              style={{ color: isDark ? "#334155" : "#cbd5e1" }}
            />
            <p
              className={`text-[13px] mt-3 ${isDark ? "text-slate-600" : "text-slate-400"}`}
            >
              No messages yet.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const outgoing = isOutgoing(msg);

          // Show timestamp divider if first message OR gap > 5 minutes
          const prevMsg = messages[idx - 1];
          const showDivider =
            idx === 0 ||
            new Date(msg.created_time).getTime() -
              new Date(prevMsg.created_time).getTime() >
              300_000;

          return (
            <div key={msg.id ?? idx}>
              {/* Timestamp divider */}
              {showDivider && (
                <p
                  className={`text-[9px] text-center my-3 uppercase tracking-widest
                  ${isDark ? "text-slate-700" : "text-slate-400"}`}
                >
                  {formatTime(msg.created_time)} ·{" "}
                  {formatFullTime(msg.created_time)}
                </p>
              )}

              <MessageBubble
                msg={msg}
                outgoing={outgoing}
                senderName={senderName}
                isDark={isDark}
              />
            </div>
          );
        })}
      </div>

      {/* ── Send error notice (non-blocking) ── */}
      {error && messages.length > 0 && (
        <div
          className={`flex items-center gap-2 px-3 py-2 mx-0 mb-2 rounded-xl border text-[12px]
          ${isDark ? "bg-red-500/[0.08] border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-500"}`}
        >
          <AlertCircle size={13} className="shrink-0" />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-[11px] font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Reply input ── */}
      {senderId ? (
        <div
          className={`shrink-0 pt-3 pb-3 border-t
          ${isDark ? "border-white/[0.06]" : "border-slate-200"}`}
        >
          <div
            className={`flex items-end gap-2 rounded-2xl border px-3 py-2
            ${
              isDark
                ? "bg-[#131c2d] border-white/[0.08] focus-within:border-blue-500/40"
                : "bg-white border-slate-200 focus-within:border-blue-300 shadow-sm"
            }`}
          >
            <textarea
              ref={inputRef}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              rows={1}
              maxLength={2000}
              className={`flex-1 resize-none outline-none bg-transparent text-[13.5px] py-1.5 leading-relaxed max-h-[120px]
              ${isDark ? "text-white placeholder:text-slate-600" : "text-slate-900 placeholder:text-slate-400"}`}
              style={{ scrollbarWidth: "none" }}
            />
            <button
              onClick={handleSend}
              disabled={!replyText.trim() || sending}
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white transition-all active:scale-90 disabled:opacity-40"
              style={{
                background:
                  !replyText.trim() || sending ? "#1877F260" : "#1877F2",
              }}
            >
              {sending ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between mt-1.5 px-0.5">
            <p
              className={`text-[10px] ${isDark ? "text-slate-700" : "text-slate-400"}`}
            >
              Replies are sent as your Page via Messenger.
            </p>
            <p
              className={`text-[10px] ${replyText.length > 1800 ? "text-orange-400" : isDark ? "text-slate-700" : "text-slate-400"}`}
            >
              {replyText.length}/2000
            </p>
          </div>
        </div>
      ) : (
        // No senderId — can't reply
        <div
          className={`shrink-0 pt-3 pb-3 border-t text-center
          ${isDark ? "border-white/[0.06]" : "border-slate-200"}`}
        >
          <p
            className={`text-[12px] ${isDark ? "text-slate-600" : "text-slate-400"}`}
          >
            Cannot reply — no sender ID available for this conversation.
          </p>
        </div>
      )}
    </div>
  );
}
