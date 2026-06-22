"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  RefreshCw,
  Send,
  ArrowLeft,
  CheckCircle2,
  WifiOff,
  Mail,
  ChevronRight,
  Loader2,
  X,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { API } from "@/lib/axiosClient";

/* ═══════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════ */
interface IgConversation {
  conversationId: string;
  sender: string;
  senderId: string | null;
  preview: string;
  time: string;
  unreadCount: number;
  unread: boolean;
}

interface IgMessage {
  id: string;
  message: string;
  from: { id: string; name?: string };
  to?: { data: { id: string; name?: string }[] };
  created_time: string;
}

interface ConversationsResponse {
  success: boolean;
  data: {
    conversations: IgConversation[];
    total: number;
    unreadCount: number;
  };
  permissionRequired?: boolean;
}

interface ThreadResponse {
  success: boolean;
  data: { messages: IgMessage[]; paging: null | Record<string, string> };
}

/* ═══════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════ */
const IG_GRADIENT = "linear-gradient(135deg, #833ab4 0%, #C13584 45%, #fd1d1d 80%, #fcb045 100%)";
const IG_ACCENT = "#C13584";

/* ═══════════════════════════════════════════════════════
   API
═══════════════════════════════════════════════════════ */
async function fetchConversations(): Promise<ConversationsResponse> {
  const res = await API.get("/instagram/messages");
  if (!res.data.success) throw Object.assign(new Error(res.data.message ?? "Failed to fetch"), { permissionRequired: res.data.permissionRequired });
  return res.data;
}

async function fetchThread(conversationId: string): Promise<ThreadResponse> {
  const res = await API.get(`/instagram/messages/${conversationId}`);
  if (!res.data.success) throw new Error(res.data.message ?? "Failed to fetch thread");
  return res.data;
}

async function sendMsg(recipientId: string, message: string): Promise<void> {
  const res = await API.post("/instagram/messages/send", { recipientId, message });
  if (!res.data.success) throw new Error(res.data.message ?? "Failed to send");
}

/* ═══════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════ */
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function formatMsgTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/* ═══════════════════════════════════════════════════════
   SKELETON
═══════════════════════════════════════════════════════ */
function ConvSkeleton({ dark }: { dark: boolean }) {
  const shimmer = dark ? "bg-white/[0.05]" : "bg-pink-100/50";
  return (
    <div className={`flex items-center gap-3 p-4 rounded-2xl border ${dark ? "bg-[#130820] border-pink-900/30" : "bg-white border-pink-100/80"}`}>
      <div className={`w-10 h-10 rounded-full shrink-0 animate-pulse ${shimmer}`} />
      <div className="flex-1">
        <div className={`h-3 w-28 rounded mb-2 animate-pulse ${shimmer}`} />
        <div className={`h-2 w-44 rounded animate-pulse ${shimmer}`} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PERMISSION WALL
═══════════════════════════════════════════════════════ */
function PermissionWall({ dark }: { dark: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
        style={{ background: "rgba(193,53,132,0.1)", border: "1px solid rgba(193,53,132,0.2)" }}
      >
        <Lock size={32} style={{ color: IG_ACCENT }} />
      </div>
      <h3 className={`text-[20px] font-black mb-2 ${dark ? "text-white" : "text-slate-900"}`} style={{ letterSpacing: "-0.03em" }}>
        Permission Required
      </h3>
      <p className="text-[13px] max-w-[300px] leading-relaxed mb-4" style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}>
        Instagram Direct Messages require the{" "}
        <span className="font-bold" style={{ color: IG_ACCENT }}>instagram_manage_messages</span>{" "}
        permission. Reconnect your Facebook Page with this permission to enable DM management.
      </p>
      <div
        className={`flex items-start gap-2 p-3 rounded-xl border max-w-[300px] text-left
          ${dark ? "bg-pink-500/[0.06] border-pink-500/20" : "bg-pink-50 border-pink-200/60"}`}
      >
        <AlertTriangle size={13} className="shrink-0 mt-0.5" style={{ color: IG_ACCENT }} />
        <p className="text-[11px] leading-relaxed" style={{ color: IG_ACCENT }}>
          This permission must be approved by Meta and requires your app to go through their business verification process.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   THREAD VIEW
═══════════════════════════════════════════════════════ */
function ThreadView({
  conv,
  dark,
  igUserId,
  onClose,
}: {
  conv: IgConversation;
  dark: boolean;
  igUserId: string;
  onClose: () => void;
}) {
  const [msgText, setMsgText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["ig-thread", conv.conversationId],
    queryFn: () => fetchThread(conv.conversationId),
    staleTime: 30_000,
  });

  const messages = [...(data?.data?.messages ?? [])].reverse();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendMut = useMutation({
    mutationFn: () => sendMsg(conv.senderId!, msgText.trim()),
    onSuccess: () => setMsgText(""),
  });

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ backgroundColor: dark ? "#0d0814" : "#fdf0ff", fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}
    >
      {/* Header */}
      <div
        className={`flex items-center gap-3 px-4 py-3 border-b shrink-0
          ${dark ? "bg-[#130820] border-pink-900/30" : "bg-white border-pink-100"}`}
      >
        <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ color: IG_ACCENT }}>
          <ArrowLeft size={18} />
        </button>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px] font-black shrink-0"
          style={{ background: IG_GRADIENT }}
        >
          {conv.sender.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[14px] font-black truncate ${dark ? "text-white" : "text-slate-900"}`}>{conv.sender}</p>
          <p className="text-[10px]" style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}>Instagram DM</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="animate-spin" style={{ color: IG_ACCENT }} />
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.from.id === igUserId;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed`}
                style={
                  isMe
                    ? { background: IG_GRADIENT, color: "white", borderBottomRightRadius: 4 }
                    : {
                        background: dark ? "rgba(255,255,255,0.06)" : "white",
                        color: dark ? "#e2e8f0" : "#1e293b",
                        border: dark ? "1px solid rgba(193,53,132,0.15)" : "1px solid rgba(193,53,132,0.1)",
                        borderBottomLeftRadius: 4,
                      }
                }
              >
                <p>{msg.message}</p>
                <p className={`text-[9px] mt-1 ${isMe ? "text-white/60" : ""}`} style={isMe ? {} : { color: dark ? "#6b4f7a" : "#94a3b8" }}>
                  {formatMsgTime(msg.created_time)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className={`px-4 py-3 border-t shrink-0 ${dark ? "bg-[#130820] border-pink-900/30" : "bg-white border-pink-100"}`}
      >
        {!conv.senderId ? (
          <p className="text-center text-[12px]" style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}>
            Recipient ID unavailable — cannot send reply
          </p>
        ) : (
          <div
            className={`flex items-center gap-2 rounded-2xl border px-3 py-2
              ${dark ? "bg-white/[0.04] border-pink-900/30" : "bg-pink-50/50 border-pink-200/60"}`}
          >
            <input
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              placeholder="Message…"
              className={`flex-1 bg-transparent outline-none text-[13px]
                ${dark ? "text-white placeholder:text-slate-600" : "text-slate-800 placeholder:text-slate-400"}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && msgText.trim()) {
                  e.preventDefault();
                  sendMut.mutate();
                }
              }}
            />
            <button
              onClick={() => sendMut.mutate()}
              disabled={!msgText.trim() || sendMut.isPending}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all active:scale-90 disabled:opacity-40"
              style={{ background: IG_GRADIENT }}
            >
              {sendMut.isPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            </button>
          </div>
        )}
        {sendMut.isError && (
          <p className="text-[10.5px] text-red-400 mt-1 text-center">
            {(sendMut.error as Error)?.message ?? "Send failed"}
          </p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════ */
export default function InstagramMessagesPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";

  const router = useRouter();
  const qc = useQueryClient();

  const [activeConv, setActiveConv] = useState<IgConversation | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["ig-messages"],
    queryFn: fetchConversations,
    staleTime: 60_000,
    retry: 1,
  });

  const permRequired = (error as any)?.permissionRequired || data?.permissionRequired;
  const conversations = data?.data?.conversations ?? [];
  const unreadCount = data?.data?.unreadCount ?? 0;

  if (activeConv) {
    return (
      <ThreadView
        conv={activeConv}
        dark={dark}
        igUserId=""
        onClose={() => setActiveConv(null)}
      />
    );
  }

  return (
    <div
      className="min-h-screen transition-colors"
      style={{ backgroundColor: dark ? "#0d0814" : "#fdf0ff", fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}
    >
      {/* Dot grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.018] z-0"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #C13584 1px, transparent 0)", backgroundSize: "32px 32px" }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-3 pb-28 pt-6">
        {/* ── HEADER ── */}
        <div className="flex items-start justify-between mb-6 gap-3">
          <div>
            <button
              onClick={() => router.push("/instagram")}
              className="flex items-center gap-1 text-[11px] font-bold mb-1"
              style={{ color: IG_ACCENT }}
            >
              <ArrowLeft size={12} /> Instagram
            </button>
            <h1
              className={`text-[26px] font-black leading-tight ${dark ? "text-white" : "text-slate-900"}`}
              style={{ letterSpacing: "-0.04em" }}
            >
              Messages
            </h1>
            <p className="text-[12px] mt-0.5" style={{ color: dark ? "#6b4f7a" : "rgba(193,53,132,0.7)" }}>
              {isLoading ? "Loading…" : permRequired ? "Permission required" : `${conversations.length} conversations${unreadCount > 0 ? ` · ${unreadCount} unread` : ""}`}
            </p>
          </div>

          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["ig-messages"] })}
            disabled={isFetching}
            className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all active:scale-90 border shrink-0
              ${dark ? "bg-white/[0.04] border-white/[0.06] text-slate-400" : "bg-white border-pink-100 text-slate-500 shadow-sm"}`}
          >
            <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
          </button>
        </div>

        {/* ── LOADING ── */}
        {isLoading && (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => <ConvSkeleton key={i} dark={dark} />)}
          </div>
        )}

        {/* ── PERMISSION WALL ── */}
        {!isLoading && (isError && permRequired) && <PermissionWall dark={dark} />}

        {/* ── ERROR (non-permission) ── */}
        {!isLoading && isError && !permRequired && (
          <div className={`rounded-2xl border p-6 flex items-start gap-3 ${dark ? "bg-red-500/[0.07] border-red-500/20" : "bg-red-50 border-red-200/60"}`}>
            <WifiOff size={16} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-red-400 mb-0.5">Failed to load messages</p>
              <p className={`text-[11.5px] mb-2 ${dark ? "text-red-500/70" : "text-red-400"}`}>{(error as Error)?.message}</p>
              <button onClick={() => refetch()} className="text-[12px] font-semibold" style={{ color: IG_ACCENT }}>Retry</button>
            </div>
          </div>
        )}

        {/* ── EMPTY ── */}
        {!isLoading && !isError && conversations.length === 0 && (
          <div className={`rounded-2xl border p-12 text-center ${dark ? "bg-[#130820] border-pink-900/30" : "bg-white border-pink-100/80 shadow-sm"}`}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: IG_GRADIENT }}>
              <Mail size={26} className="text-white" />
            </div>
            <p className={`text-[15px] font-bold mb-1.5 ${dark ? "text-white" : "text-slate-900"}`}>No Messages Yet</p>
            <p className="text-[12.5px]" style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}>
              Instagram Direct Messages from your audience will appear here.
            </p>
          </div>
        )}

        {/* ── CONVERSATION LIST ── */}
        {!isLoading && !isError && conversations.length > 0 && (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.conversationId}
                onClick={() => setActiveConv(conv)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all active:scale-[0.99] group
                  ${dark
                    ? "bg-[#130820] border-pink-900/30 hover:border-pink-700/40 hover:bg-[#1a0e2a]"
                    : "bg-white border-pink-100/80 hover:border-pink-200 shadow-sm hover:shadow-md"
                  }
                  ${conv.unread ? (dark ? "border-pink-700/50" : "border-pink-300/60") : ""}`}
              >
                {/* Avatar */}
                <div
                  className="relative w-11 h-11 rounded-full flex items-center justify-center text-white text-[15px] font-black shrink-0"
                  style={{ background: IG_GRADIENT }}
                >
                  {conv.sender.charAt(0).toUpperCase()}
                  {conv.unread && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 bg-pink-500"
                      style={{ borderColor: dark ? "#130820" : "white" }} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`text-[13.5px] truncate ${conv.unread ? "font-black" : "font-semibold"} ${dark ? "text-white" : "text-slate-900"}`}>
                      {conv.sender}
                    </p>
                    <span className="text-[10px] shrink-0 ml-auto" style={{ color: dark ? "#6b4f7a" : "#94a3b8" }}>
                      {timeAgo(conv.time)}
                    </span>
                  </div>
                  <p
                    className={`text-[12px] truncate ${conv.unread ? "font-semibold" : ""}`}
                    style={{ color: conv.unread ? (dark ? "#e879b8" : IG_ACCENT) : (dark ? "#6b4f7a" : "#94a3b8") }}
                  >
                    {conv.preview || "No preview available"}
                  </p>
                </div>

                {/* Unread badge + chevron */}
                <div className="flex items-center gap-2 shrink-0">
                  {conv.unreadCount > 0 && (
                    <span
                      className="text-[10px] font-black text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                      style={{ background: IG_GRADIENT }}
                    >
                      {conv.unreadCount}
                    </span>
                  )}
                  <ChevronRight size={14} style={{ color: dark ? "#6b4f7a" : "#cbd5e1" }} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
