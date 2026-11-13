// mobile_app\components\AutoReplyCard.tsx

"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, Check, Clock, AlertTriangle, ChevronDown } from "lucide-react";

type Settings = {
  enabled: boolean;
  tone: string;
  needsReconnect: boolean;
  googleConnected: boolean;
};
type Item = {
  _id: string;
  reviewerName?: string;
  rating?: number;
  locationName?: string;
  status: "pending" | "sending" | "sent" | "failed" | "skipped";
  replyText?: string;
  error?: string;
  dueAt: string;
  sentAt?: string;
};

const TONES = [
  "Warm, professional, and friendly",
  "Formal and professional",
  "Casual and cheerful",
];

const API = process.env.NEXT_PUBLIC_API_URL;

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
});

const statusLabel = (i: Item) => {
  if (i.status === "sent") return "Replied";
  if (i.status === "pending" || i.status === "sending") {
    return `Scheduled ${new Date(i.dueAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (i.status === "skipped") return i.error || "Skipped";
  return "Failed";
};

export default function AutoReplyCard({ isDark }: { isDark: boolean }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [recent, setRecent] = useState<Item[]>([]);
  const [pending, setPending] = useState(0);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/users/auto-reply`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load");
      setSettings(json.settings);
      setRecent(json.recent || []);
      setPending(json.pending || 0);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (patch: Partial<Pick<Settings, "enabled" | "tone">>) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API}/users/auto-reply`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Could not save");
      setSettings(json.settings);
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return null;

  const card = isDark
    ? "bg-[#131c2d] border-white/[0.06]"
    : "bg-white border-black/[0.05] shadow-sm";
  const sub = isDark ? "text-slate-500" : "text-slate-400";
  const text = isDark ? "text-white" : "text-slate-900";

  return (
    <div className={`rounded-2xl border p-4 mb-4 ${card}`}>
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isDark ? "bg-blue-500/15 text-blue-400" : "bg-blue-50 text-blue-600"}`}
        >
          <Bot size={17} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[14px] font-bold ${text}`}>Auto-reply to new reviews</p>
          <p className={`text-[12px] ${sub}`}>
            Replies a few minutes after a review is posted, spaced out like a person would.
          </p>
        </div>
        <button
          role="switch"
          aria-checked={settings.enabled}
          disabled={saving}
          onClick={() => save({ enabled: !settings.enabled })}
          className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-60 ${settings.enabled ? "bg-blue-500" : isDark ? "bg-white/[0.15]" : "bg-slate-300"}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${settings.enabled ? "translate-x-5" : ""}`}
          />
        </button>
      </div>

      {settings.needsReconnect && (
        <p className="mt-3 flex items-start gap-1.5 text-[12px] text-amber-500">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          Google access expired, so auto-reply was turned off. Reconnect Google
          from your Profile, then switch it on again.
        </p>
      )}
      {error && <p className="mt-2 text-[12px] text-red-500">{error}</p>}

      {settings.enabled && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={settings.tone}
            disabled={saving}
            onChange={(e) => save({ tone: e.target.value })}
            aria-label="Reply tone"
            className={`h-8 px-2.5 rounded-xl text-[12px] font-semibold border outline-none ${isDark ? "bg-[#182236] border-white/[0.08] text-slate-200" : "bg-white border-slate-200 text-slate-700"}`}
          >
            {[...new Set([settings.tone, ...TONES])].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {pending > 0 && (
            <span className={`text-[12px] flex items-center gap-1 ${sub}`}>
              <Clock size={12} /> {pending} scheduled
            </span>
          )}
          {recent.length > 0 && (
            <button
              onClick={() => setOpen((v) => !v)}
              className="ml-auto text-[12px] font-semibold text-blue-500 flex items-center gap-1"
            >
              Activity{" "}
              <ChevronDown size={12} className={open ? "rotate-180" : ""} />
            </button>
          )}
        </div>
      )}

      {open && (
        <ul className="mt-3 flex flex-col gap-2">
          {recent.map((i) => (
            <li
              key={i._id}
              className={`rounded-xl p-2.5 text-[12px] ${isDark ? "bg-white/[0.04]" : "bg-slate-50"}`}
            >
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${text}`}>
                  {i.reviewerName || "Reviewer"} · {i.rating ?? "–"}★
                </span>
                <span
                  className={`ml-auto flex items-center gap-1 ${i.status === "sent" ? "text-green-500" : i.status === "failed" ? "text-red-500" : sub}`}
                >
                  {i.status === "sent" && <Check size={11} />}
                  {statusLabel(i)}
                </span>
              </div>
              {i.replyText && (
                <p className={`mt-1 line-clamp-2 ${sub}`}>{i.replyText}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
