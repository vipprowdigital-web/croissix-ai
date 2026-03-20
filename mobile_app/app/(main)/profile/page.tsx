"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import {
  LinkIcon,
  RefreshCcw,
  Check,
  X,
  Share2,
  Copy,
  Star,
  MapPin,
  Globe,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { setUser, clearUser } from "@/redux/slices/userSlice";
import { useRouter } from "next/navigation";
import { useLogout } from "@/features/auth/hook/useAuth";

/* ══════════════════════════════════════════════════
   TOKENS
══════════════════════════════════════════════════ */
const D = {
  pageBg: "transparent",
  cardBg: "rgb(19,28,45)",
  surface: "rgb(24,34,54)",
  border: "rgba(255,255,255,0.06)",
  border2: "rgba(255,255,255,0.04)",
  text: "#eef2ff",
  sub: "#64748b",
  muted: "#94a3b8",
  divider: "rgba(255,255,255,0.05)",
  pressed: "rgba(255,255,255,0.05)",
};
const L = {
  pageBg: "transparent",
  cardBg: "#ffffff",
  surface: "#f8fafc",
  border: "rgba(0,0,0,0.06)",
  border2: "rgba(0,0,0,0.04)",
  text: "#0f172a",
  sub: "#8e8e93",
  muted: "#6b7280",
  divider: "rgba(0,0,0,0.06)",
  pressed: "rgba(0,0,0,0.05)",
};
function getTheme(isDark: boolean) {
  return isDark ? D : L;
}

/* ══════════════════════════════════════════════════
   ICONS
══════════════════════════════════════════════════ */
const Chev = () => (
  <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
    <path
      d="M1 1l5 5-5 5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const ChevDown = () => (
  <svg width="12" height="7" viewBox="0 0 12 7" fill="none">
    <path
      d="M1 1l5 5 5-5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const ExtLink = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
    <path
      d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <polyline
      points="15 3 21 3 21 9"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="10"
      y1="14"
      x2="21"
      y2="3"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);
const GoogleG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M21.805 10.023H12v3.977h5.617c-.245 1.36-1.017 2.514-2.164 3.29v2.73h3.503C20.938 18.202 22 15.298 22 12c0-.66-.069-1.305-.195-1.977z"
      fill="#4285F4"
    />
    <path
      d="M12 22c2.97 0 5.46-.984 7.28-2.668l-3.503-2.73c-.984.66-2.245 1.05-3.777 1.05-2.9 0-5.36-1.958-6.24-4.59H2.15v2.817C3.96 19.983 7.7 22 12 22z"
      fill="#34A853"
    />
    <path
      d="M5.76 13.062A6.05 6.05 0 0 1 5.44 12c0-.37.063-.73.163-1.062V8.121H2.15A9.987 9.987 0 0 0 2 12c0 1.61.387 3.13 1.07 4.477l3.69-2.817z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.958c1.637 0 3.105.563 4.26 1.667l3.195-3.195C17.455 2.693 14.965 1.6 12 1.6 7.7 1.6 3.96 3.617 2.15 7.12l3.61 2.817C6.64 7.305 9.1 5.958 12 5.958z"
      fill="#EA4335"
    />
  </svg>
);
const IcoQr = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
    <rect
      x="3"
      y="3"
      width="7"
      height="7"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <rect
      x="14"
      y="3"
      width="7"
      height="7"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <rect
      x="3"
      y="14"
      width="7"
      height="7"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <rect x="14" y="14" width="3" height="3" fill="currentColor" />
    <rect x="18" y="14" width="3" height="3" fill="currentColor" />
    <rect x="14" y="18" width="3" height="3" fill="currentColor" />
    <rect x="18" y="18" width="3" height="3" fill="currentColor" />
    <rect x="5" y="5" width="3" height="3" fill="currentColor" />
    <rect x="16" y="5" width="3" height="3" fill="currentColor" />
    <rect x="5" y="16" width="3" height="3" fill="currentColor" />
  </svg>
);
const IcoNotif = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
    <path
      d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13.73 21a2 2 0 0 1-3.46 0"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);
const IcoLock = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
    <rect
      x="5"
      y="11"
      width="14"
      height="10"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M8 11V7a4 4 0 1 1 8 0v4"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);
const IcoShield = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 3L4 7v5c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V7L12 3z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 12l2 2 4-4"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const IcoMsg = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
    <path
      d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const IcoDB = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
    <ellipse
      cx="12"
      cy="5"
      rx="9"
      ry="3"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M21 12c0 1.66-4.03 3-9 3S3 13.66 3 12"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"
      stroke="currentColor"
      strokeWidth="1.8"
    />
  </svg>
);
const IcoHelp = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <circle
      cx="12"
      cy="17"
      r="0.5"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1"
    />
  </svg>
);
const IcoShare = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
    <path
      d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <polyline
      points="16 6 12 2 8 6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="12"
      y1="2"
      x2="12"
      y2="15"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);
const IcoSun = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);
const IcoLogout = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
    <path
      d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <polyline
      points="16 17 21 12 16 7"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="21"
      y1="12"
      x2="9"
      y2="12"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);
const IcoCamera = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path
      d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
      stroke="white"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="13" r="4" stroke="white" strokeWidth="1.8" />
  </svg>
);
const IcoEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path
      d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ══════════════════════════════════════════════════
   ROW & SECTION
══════════════════════════════════════════════════ */
function Row({
  icon,
  iconBg,
  label,
  value,
  destructive = false,
  t,
  onClick,
  badge,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value?: string;
  destructive?: boolean;
  t: typeof D;
  onClick?: () => void;
  badge?: React.ReactNode;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 13,
        padding: "12px 16px",
        background: pressed ? t.pressed : "transparent",
        cursor: "pointer",
        transition: "background .1s",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: iconBg,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: destructive ? "#ef4444" : "white",
        }}
      >
        {icon}
      </div>
      <span
        style={{
          flex: 1,
          fontSize: 15.5,
          fontWeight: 400,
          color: destructive ? "#ef4444" : t.text,
          fontFamily:
            "-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif",
          letterSpacing: "-0.01em",
        }}
      >
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {badge}
        {value && (
          <span
            style={{
              fontSize: 13.5,
              color: t.sub,
              fontFamily: "-apple-system,BlinkMacSystemFont,sans-serif",
            }}
          >
            {value}
          </span>
        )}
        <span style={{ color: t === D ? "#2d3f58" : "#c7d2dc" }}>
          <Chev />
        </span>
      </div>
    </div>
  );
}

function Section({ children, t }: { children: React.ReactNode; t: typeof D }) {
  const arr = Array.isArray(children)
    ? (children as React.ReactNode[])
    : [children];
  return (
    <div
      style={{
        background: t.cardBg,
        borderRadius: 16,
        overflow: "hidden",
        border: `1px solid ${t.border}`,
      }}
    >
      {arr.map((child, i) => (
        <div key={i}>
          {child}
          {i < arr.length - 1 && (
            <div style={{ height: 1, marginLeft: 63, background: t.divider }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   QR PATTERN GENERATOR
══════════════════════════════════════════════════ */
function QRPattern({ url, size = 180 }: { url: string; size: number }) {
  const seed = url.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const cells = 21;
  const cell = size / cells;
  const grid = Array.from({ length: cells }, (_, r) =>
    Array.from({ length: cells }, (_, c) => {
      const inTL = r < 7 && c < 7,
        inTR = r < 7 && c >= cells - 7,
        inBL = r >= cells - 7 && c < 7;
      if (inTL || inTR || inBL) {
        const lr = inTL ? r : inTR ? r : r - (cells - 7);
        const lc = inTL ? c : inTR ? c - (cells - 7) : c;
        if (lr === 0 || lr === 6 || lc === 0 || lc === 6) return true;
        if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) return true;
        return false;
      }
      return (seed * (r * 31 + c * 17) + r + c) % 3 !== 0;
    }),
  );
  return (
    <div
      style={{
        background: "white",
        borderRadius: 16,
        padding: 12,
        display: "inline-block",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {grid.map((row, r) =>
          row.map((on, c) =>
            on ? (
              <rect
                key={`${r}-${c}`}
                x={c * cell}
                y={r * cell}
                width={cell}
                height={cell}
                fill="#0f172a"
                rx={0.5}
              />
            ) : null,
          ),
        )}
      </svg>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   QR MODAL
══════════════════════════════════════════════════ */
function QRModal({
  isDark,
  t,
  onClose,
  locationName,
  locationId,
}: {
  isDark: boolean;
  t: typeof D;
  onClose: () => void;
  locationName?: string;
  locationId?: string;
}) {
  const [activeTab, setActiveTab] = useState<
    "review" | "profile" | "directions"
  >("review");
  const [copied, setCopied] = useState(false);

  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://app.croissix.com";
  const urls = {
    review: locationId
      ? `https://search.google.com/local/writereview?placeid=${locationId}`
      : `${base}/review`,
    profile: locationId
      ? `https://www.google.com/maps/place/?q=place_id:${locationId}`
      : `${base}/profile`,
    directions: locationId
      ? `https://www.google.com/maps/dir/?api=1&destination_place_id=${locationId}`
      : `${base}/directions`,
  };

  const tabs = [
    {
      id: "review" as const,
      label: "Review QR",
      icon: <Star size={13} />,
      color: "#f59e0b",
      desc: "Let customers leave a Google review instantly",
    },
    {
      id: "profile" as const,
      label: "Profile QR",
      icon: <MapPin size={13} />,
      color: "#3b82f6",
      desc: "Share your full Google Business listing",
    },
    {
      id: "directions" as const,
      label: "Directions QR",
      icon: <Globe size={13} />,
      color: "#22c55e",
      desc: "Help customers navigate directly to you",
    },
  ];
  const active = tabs.find((tab) => tab.id === activeTab)!;

  const copyLink = () => {
    navigator.clipboard.writeText(urls[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${locationName || "Business"} — ${active.label}`,
          url: urls[activeTab],
        });
      } catch {}
    } else copyLink();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[200]"
        style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(14px)" }}
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-[201] flex justify-center">
        <div
          className="w-full md:max-w-lg md:mx-auto rounded-t-[28px] overflow-hidden"
          style={{
            background: t.cardBg,
            boxShadow:
              "0 -20px 60px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.08)",
            animation: "qrSlide 0.32s cubic-bezier(0.34,1.12,0.64,1)",
          }}
        >
          <style>{`@keyframes qrSlide{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

          {/* top accent */}
          <div
            style={{
              height: "1.5px",
              background:
                "linear-gradient(90deg,transparent,#3b82f6,#60a5fa,transparent)",
            }}
          />

          {/* drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div
              className="w-10 h-1 rounded-full"
              style={{ background: t.border }}
            />
          </div>

          {/* header */}
          <div className="flex items-center justify-between px-5 pt-2 pb-4">
            <div>
              <h2
                className="text-[18px] font-black"
                style={{
                  color: t.text,
                  letterSpacing: "-0.03em",
                  fontFamily: "-apple-system,'SF Pro Display',sans-serif",
                }}
              >
                Share &amp; QR Codes
              </h2>
              {locationName && (
                <p className="text-[12px] mt-0.5" style={{ color: t.sub }}>
                  {locationName}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{ background: t.surface }}
            >
              <X size={15} style={{ color: t.muted }} />
            </button>
          </div>

          {/* tab pills */}
          <div className="flex gap-2 px-5 pb-4 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 h-9 px-4 rounded-2xl text-[12.5px] font-semibold whitespace-nowrap shrink-0 transition-all active:scale-95"
                style={{
                  background: activeTab === tab.id ? tab.color : t.surface,
                  color: activeTab === tab.id ? "white" : t.sub,
                  border: `1px solid ${activeTab === tab.id ? "transparent" : t.border}`,
                  boxShadow:
                    activeTab === tab.id ? `0 4px 14px ${tab.color}40` : "none",
                }}
              >
                <span
                  style={{ color: activeTab === tab.id ? "white" : tab.color }}
                >
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* main content */}
          <div className="px-5 pb-6 flex flex-col items-center gap-4">
            <p className="text-[13px] text-center" style={{ color: t.sub }}>
              {active.desc}
            </p>

            {/* QR */}
            <QRPattern url={urls[activeTab]} size={196} />

            {/* URL chip */}
            <div
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-2xl"
              style={{ background: t.surface, border: `1px solid ${t.border}` }}
            >
              <span
                className="flex-1 text-[11px] truncate font-medium"
                style={{ color: t.muted }}
              >
                {urls[activeTab]}
              </span>
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 h-7 px-3 rounded-xl text-[11px] font-bold shrink-0 transition-all active:scale-95"
                style={{
                  background: copied ? "#22c55e18" : `${active.color}18`,
                  color: copied ? "#22c55e" : active.color,
                }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            {/* action buttons */}
            <div className="flex gap-3 w-full">
              <button
                onClick={copyLink}
                className="flex-1 h-11 rounded-2xl flex items-center justify-center gap-2 text-[13px] font-semibold transition-all active:scale-95"
                style={{
                  background: t.surface,
                  border: `1px solid ${t.border}`,
                  color: t.text,
                }}
              >
                {copied ? (
                  <Check size={15} className="text-green-500" />
                ) : (
                  <Copy size={15} style={{ color: active.color }} />
                )}
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <button
                onClick={shareLink}
                className="flex-1 h-11 rounded-2xl flex items-center justify-center gap-2 text-[13px] font-bold text-white transition-all active:scale-95"
                style={{
                  background: `linear-gradient(135deg,${active.color},${active.color}bb)`,
                  boxShadow: `0 4px 14px ${active.color}40`,
                }}
              >
                <Share2 size={15} /> Share QR
              </button>
            </div>

            <p
              className="text-[11px] text-center leading-relaxed"
              style={{ color: t.sub }}
            >
              {activeTab === "review"
                ? "Display this on receipts, tables, or counters to collect more reviews."
                : activeTab === "profile"
                  ? "Share on social media, email signatures, or print materials."
                  : "Print near your entrance or parking area for easy navigation."}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════
   LOCATION ROW
══════════════════════════════════════════════════ */
function LocationRow({
  location,
  isDark,
  t,
}: {
  location: any;
  isDark: boolean;
  t: any;
}) {
  const dispatch = useDispatch();
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const user = useSelector((s: RootState) => s.user.data);
  const locationId = location.name.split("/").pop();
  const isConnected = user?.googleLocationId === locationId;

  const handleLink = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      setLinkingId(locationId);
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/google-location`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ locationId, locationName: location.title }),
      });
      if (!user) return;
      dispatch(
        setUser({
          ...user,
          googleLocationId: locationId,
          googleLocationName: location.title,
        }),
      );
      alert(`${location.title} linked successfully`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLinkingId(null);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 16px",
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: isDark ? "#1e2a42" : "#f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <GoogleG />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: t.text }}>
          {location.title}
        </div>
        <div style={{ fontSize: 11, color: t.sub }}>
          {location.phoneNumbers?.primaryPhone || "No phone"}
        </div>
      </div>
      {isConnected ? (
        <span className="text-green-500 text-xs font-semibold flex items-center gap-1">
          <Check size={12} /> Connected
        </span>
      ) : (
        <button
          onClick={handleLink}
          disabled={linkingId === locationId}
          className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full disabled:opacity-60 transition"
        >
          {linkingId === locationId ? "Linking..." : "Link"}
          <LinkIcon size={12} />
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   GOOGLE PROFILE ROW
══════════════════════════════════════════════════ */
function GoogleProfileRow({
  t,
  isDark,
}: {
  t: ReturnType<typeof getTheme>;
  isDark: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const user = useSelector((s: RootState) => s.user.data);

  useEffect(() => {
    if (!open) return;
    if (locations.length === 0 && user?.googleId) fetchLocs();
  }, [open]);

  const fetchLocs = async () => {
    if (!user?.googleId) {
      setLocations([]);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("/api/google/locations", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const d = await res.json();
      setLocations(d.locations || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: t.cardBg,
        borderRadius: 16,
        overflow: "hidden",
        border: `1px solid ${t.border}`,
        boxShadow: open
          ? isDark
            ? "0 8px 32px rgba(0,0,0,0.45)"
            : "0 8px 28px rgba(66,133,244,0.1)"
          : "none",
        transition: "box-shadow .2s",
      }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 13,
          padding: "12px 16px",
          background: pressed ? t.pressed : "transparent",
          cursor: "pointer",
          transition: "background .1s",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            flexShrink: 0,
            background: isDark ? "#1e2a42" : "#f1f5f9",
            border: `1px solid ${t.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <GoogleG />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 15.5,
              fontWeight: 400,
              color: t.text,
              letterSpacing: "-0.01em",
              fontFamily:
                "-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif",
            }}
          >
            Google Profile Manager
          </div>
          {open && (
            <div
              style={{
                fontSize: 11,
                color: "#4285F4",
                marginTop: 1,
                fontFamily: "-apple-system,BlinkMacSystemFont,sans-serif",
              }}
            >
              {user?.googleId ? locations?.length : 0} linked profiles
            </div>
          )}
        </div>
        {user?.googleId && open && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              fetchLocs();
            }}
            disabled={loading}
            className={`flex items-center text-blue-500 transition ${loading ? "opacity-70 cursor-not-allowed" : "hover:text-blue-600"}`}
          >
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        )}
        <span
          style={{
            color: "gray",
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform .22s cubic-bezier(.4,0,.2,1)",
            display: "flex",
          }}
        >
          <ChevDown />
        </span>
      </div>

      {open && (
        <>
          <div style={{ height: 1, background: t.divider }} />
          <div
            style={{
              padding: "7px 20px 5px",
              fontSize: 10.5,
              fontWeight: 600,
              color: "#4285F4",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              fontFamily: "-apple-system,BlinkMacSystemFont,sans-serif",
            }}
          >
            Link Your Google Profile
          </div>
          {loading && (
            <div style={{ padding: 16, color: t.sub }}>
              Loading locations...
            </div>
          )}
          {!loading && locations.length === 0 && (
            <div
              style={{
                padding: 20,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 13, color: t.sub, textAlign: "center" }}>
                No Google Business profiles found
              </div>
              {!user?.googleId && (
                <button
                  onClick={() => {
                    const token = localStorage.getItem("accessToken");
                    if (!token) {
                      alert("Please login first");
                      return;
                    }
                    window.location.href = `/api/auth/google?token=${token}`;
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#4285F4",
                    color: "white",
                    border: "none",
                    borderRadius: 20,
                    padding: "6px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <GoogleG /> Link Google Profile
                </button>
              )}
            </div>
          )}
          {locations.map((loc: any, i: number) => (
            <div key={loc.name}>
              <LocationRow location={loc} t={t} isDark={isDark} />
              {i < locations.length - 1 && (
                <div
                  style={{ height: 1, marginLeft: 66, background: t.divider }}
                />
              )}
            </div>
          ))}
          <div
            style={{
              padding: "8px 20px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Link
              href="https://business.google.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12.5,
                fontWeight: 600,
                color: "#4285F4",
                textDecoration: "none",
                fontFamily: "-apple-system,BlinkMacSystemFont,sans-serif",
              }}
            >
              Open Google Business <ExtLink />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════ */
export default function ProfilePage() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const { mutate: logout } = useLogout();
  const router = useRouter();
  const user = useSelector((s: RootState) => s.user.data);

  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  const t = isDark ? D : L;
  const hasProfile = !!user?.googleLocationId;

  const accountSection = (
    <Section t={t}>
      <Row icon={<IcoNotif />} iconBg="#f97316" label="Notifications" t={t} />
      <Row
        icon={<IcoLock />}
        iconBg="#8b5cf6"
        label="Privacy"
        t={t}
        onClick={() => router.push("/privacy")}
      />
      <Row
        icon={<IcoLock />}
        iconBg="#8b5cf6"
        label="Terms & Conditions"
        t={t}
        onClick={() => router.push("/terms_and_conditions")}
      />
      <Row
        icon={<IcoShield />}
        iconBg="#2563eb"
        label="My Plan"
        value="View"
        t={t}
        onClick={() => router.push("/subscription")}
      />
    </Section>
  );

  return (
    <div
      className="w-full pt-2 pb-20"
      style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}
    >
      {/* QR Modal */}
      {showQR && (
        <QRModal
          isDark={isDark}
          t={t}
          onClose={() => setShowQR(false)}
          locationName={user?.googleLocationName}
          locationId={user?.googleLocationId}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        {/* ── LEFT ── */}
        <div className="flex flex-col gap-4">
          {/* Profile hero */}
          <div
            style={{
              background: t.cardBg,
              borderRadius: 20,
              padding: "28px 20px 20px",
              border: `1px solid ${t.border}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
              boxShadow: isDark
                ? "0 8px 32px rgba(0,0,0,0.4)"
                : "0 4px 20px rgba(0,0,0,0.06)",
            }}
          >
            {/* Avatar */}
            <div style={{ position: "relative" }}>
              <div
                style={{
                  width: 92,
                  height: 92,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#3b82f6 0%,#8b5cf6 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 38,
                  fontWeight: 700,
                  color: "white",
                  boxShadow: isDark
                    ? "0 4px 28px rgba(59,130,246,0.45)"
                    : "0 4px 20px rgba(59,130,246,0.3)",
                }}
              >
                {user?.name?.[0]?.toUpperCase() ?? "A"}
              </div>
              <button
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 29,
                  height: 29,
                  borderRadius: "50%",
                  background: "#25d366",
                  border: `2.5px solid ${t.cardBg}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <IcoCamera />
              </button>
            </div>

            {/* Name */}
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                }}
              >
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                    color: t.text,
                    fontFamily:
                      "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
                  }}
                >
                  {user?.name ?? "N/A"}
                </span>
                <span
                  style={{ color: "#3b82f6", cursor: "pointer" }}
                  onClick={() => router.push("/profile/google-profile/edit")}
                >
                  <IcoEdit />
                </span>
              </div>
              <div
                style={{
                  fontSize: 13.5,
                  color: t.sub,
                  marginTop: 3,
                  fontFamily: "-apple-system,BlinkMacSystemFont,sans-serif",
                }}
              >
                {user?.phone ?? "N/A"}
              </div>
              {/* connected badge */}
              {hasProfile && (
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-green-400"
                    style={{ boxShadow: "0 0 6px #22c55e" }}
                  />
                  <span className="text-[11px] font-semibold text-green-400">
                    {user?.googleLocationName} · Connected
                  </span>
                </div>
              )}
            </div>

            {/* ── NEW: Edit Google Business Profile tab ── */}
            {hasProfile && (
              <button
                onClick={() => router.push("/profile/google-profile/edit")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all active:scale-[0.98]"
                style={{
                  background: isDark
                    ? "rgba(66,133,244,0.1)"
                    : "rgba(66,133,244,0.07)",
                  border: "1px solid rgba(66,133,244,0.2)",
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(66,133,244,0.15)" }}
                >
                  <GoogleG />
                </div>
                <div className="flex-1 text-left">
                  <div
                    className="text-[13.5px] font-semibold"
                    style={{ color: "#4285F4" }}
                  >
                    Edit Google Business Profile
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: t.sub }}>
                    Update info, hours, photos &amp; more
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-[9px] font-black px-2 py-0.5 rounded-full text-white"
                    style={{ background: "#4285F4" }}
                  >
                    EDIT
                  </span>
                  <span style={{ color: "#4285F4" }}>
                    <Chev />
                  </span>
                </div>
              </button>
            )}

            {/* Update profile box — shows when no linked profile */}
            {!hasProfile && (
              <div
                style={{
                  width: "100%",
                  borderRadius: 12,
                  padding: "10px 14px",
                  background: t.surface,
                  border: `1px solid ${t.border2}`,
                }}
              >
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: "#25d366",
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    marginBottom: 4,
                    fontFamily: "-apple-system,BlinkMacSystemFont,sans-serif",
                  }}
                >
                  Edit
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      color: t.muted,
                      fontFamily: "-apple-system,BlinkMacSystemFont,sans-serif",
                    }}
                  >
                    Update Google Profile
                  </span>
                  <span
                    style={{
                      color: "#3b82f6",
                      cursor: "pointer",
                      marginLeft: 8,
                    }}
                    onClick={() => router.push("/profile/google-profile/edit")}
                  >
                    <IcoEdit />
                  </span>
                </div>
              </div>
            )}

            {/* ── View QR Code button ── */}
            <button
              onClick={() => setShowQR(true)}
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: 12,
                background: isDark
                  ? "rgba(37,211,102,0.08)"
                  : "rgba(37,211,102,0.07)",
                border: "1px solid rgba(37,211,102,0.18)",
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                transition: "opacity .15s",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span style={{ color: "#25d366" }}>
                <IcoQr />
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#25d366",
                  fontFamily: "-apple-system,BlinkMacSystemFont,sans-serif",
                }}
              >
                View QR Code
              </span>
              <span
                style={{ marginLeft: "auto", color: "#25d366", opacity: 0.55 }}
              >
                <Chev />
              </span>
            </button>
          </div>

          {/* Google Profile Manager */}
          <GoogleProfileRow t={t} isDark={isDark} />
        </div>

        {/* ── RIGHT ── */}
        <div className="flex flex-col gap-3">
          {/* Account section — desktop left col only */}
          <div className="hidden md:block">{accountSection}</div>
          {/* Account section — mobile only */}
          <div className="md:hidden">{accountSection}</div>

          <Section t={t}>
            <Row icon={<IcoMsg />} iconBg="#25d366" label="Chats" t={t} />
            <Row
              icon={<IcoDB />}
              iconBg="#06b6d4"
              label="Storage and Data"
              value="1.2 GB"
              t={t}
            />
          </Section>

          <Section t={t}>
            <Row
              icon={<IcoHelp />}
              iconBg="#64748b"
              label="Help"
              t={t}
              onClick={() => router.push("/help")}
            />
            <Row
              icon={<IcoShare />}
              iconBg="#10b981"
              label="Invite a Friend"
              t={t}
              onClick={() => router.push("/invite")}
            />
            <Row
              icon={<IcoSun />}
              iconBg={isDark ? "rgb(24,34,54)" : "#1e293b"}
              label="Theme"
              value={isDark ? "Dark" : "Light"}
              t={t}
              onClick={() => setTheme(isDark ? "light" : "dark")}
              badge={
                <div
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{
                    background: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.05)",
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full transition-all"
                    style={{
                      background: isDark ? "#1e293b" : "white",
                      border: isDark
                        ? "2px solid #475569"
                        : "2px solid #cbd5e1",
                      boxShadow: isDark ? "none" : "0 0 0 2px #e2e8f0",
                    }}
                  />
                </div>
              }
            />
          </Section>

          <Section t={t}>
            <Row
              icon={<IcoLogout />}
              iconBg="rgba(239,68,68,0.14)"
              label="Log Out"
              destructive
              t={t}
              onClick={() => logout()}
            />
          </Section>

          <div className="text-center pt-2 pb-4">
            <p className="text-[12px] leading-relaxed" style={{ color: t.sub }}>
              Croissix · Beta Version 0.01
            </p>
            <p className="text-[12px] leading-relaxed" style={{ color: t.sub }}>
              from Vipprow
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
