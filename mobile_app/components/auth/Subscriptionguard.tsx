// mobile_app/components/auth/Subscriptionguard.tsx
"use client";

// mobile_app/components/auth/SubscriptionGuard.tsx
//
// Wraps all (main) pages.
// Flow:
//   1. Auth check  → redirect /login if no token
//   2. Sub check   → if loading, show skeleton
//   3. If active   → render children (the app)
//   4. If inactive → render full-screen subscription gate (inline, no redirect)
//
// We render the subscription page INLINE (not redirect) so the URL stays clean
// and the user can subscribe and immediately land back in the app.

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Zap, Shield, Check, Star, RefreshCw, CheckCircle2,
  XCircle, Clock, Bell, Lock, AlertCircle, ArrowLeft,
} from "lucide-react";
import { getToken } from "@/lib/token";
import { useSubscription } from "@/features/subscription/hook/useSubscription";
import { useSubscriptionActions } from "@/features/subscription/hook/useSubscriptionActions";
import { useUser } from "@/features/user/hook/useUser";

/* ══════════════════════════════════════════════════
   CONFIG
══════════════════════════════════════════════════ */
const PLAN_ID    = process.env.NEXT_PUBLIC_RAZORPAY_PLAN_ID ?? "";
const RZP_KEY    = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID  ?? "";
const PRICE      = 49900; // paise
const fmt        = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;
const fmtDate    = (d?: string | Date) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long" }) : "—";

// Routes that are EXEMPT from subscription check (e.g. the subscription page itself)
const EXEMPT = ["/subscription", "/profile"];

declare global { interface Window { Razorpay: any; } }

function loadRzp(): Promise<boolean> {
  return new Promise((res) => {
    if (document.getElementById("rzp-js")) return res(true);
    const s   = document.createElement("script");
    s.id      = "rzp-js";
    s.src     = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload  = () => res(true);
    s.onerror = () => res(false);
    document.body.appendChild(s);
  });
}

const FEATURES = [
  { text: "1 Google Business Profile", highlight: true  },
  { text: "Analytics dashboard",        highlight: true  },
  { text: "Review monitoring",          highlight: false },
  { text: "5 posts / month",            highlight: false },
  { text: "AI insights",               highlight: true  },
  { text: "Email support",             highlight: false },
];

/* ══════════════════════════════════════════════════
   SKELETON
══════════════════════════════════════════════════ */
function AppSkeleton({ dark }: { dark: boolean }) {
  const bg = dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
  return (
    <div className="flex-1 min-h-screen p-6 flex flex-col gap-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-14 rounded-2xl animate-pulse" style={{ background: bg, animationDelay: `${i * 80}ms` }}/>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SUBSCRIPTION GATE — full-page inline
══════════════════════════════════════════════════ */
type PayScreen = "plans" | "processing" | "success" | "failed";

function SubscriptionGate({ dark }: { dark: boolean }) {
  const [screen,         setScreen]         = useState<PayScreen>("plans");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [failReason,     setFailReason]     = useState("");

  const { data: user }                                   = useUser();
  const { createSubscription, verifySubscription, loading } = useSubscriptionActions();

  const textP  = dark ? "#f1f5f9" : "#0f172a";
  const textS  = dark ? "#64748b" : "#94a3b8";
  const cardBg = dark ? "rgb(16,23,38)" : "#ffffff";
  const border = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const pageBg = dark
    ? "linear-gradient(150deg,#050d1a 0%,#080f1e 100%)"
    : "linear-gradient(150deg,#eef4ff 0%,#f0f5ff 100%)";

  async function handleSubscribe() {
    setScreen("processing");
    const loaded = await loadRzp();
    if (!loaded) {
      setFailReason("Failed to load payment SDK. Check your connection.");
      setScreen("failed"); return;
    }
    let rzSubId: string;
    try {
      const data = await createSubscription(PLAN_ID);
      rzSubId = data.subscriptionId;
      if (!rzSubId) throw new Error("No subscription ID returned.");
    } catch (err: any) {
      setFailReason(err?.response?.data?.message ?? err?.message ?? "Could not create subscription.");
      setScreen("failed"); return;
    }
    const rzp = new window.Razorpay({
      key:             RZP_KEY,
      subscription_id: rzSubId,
      name:            "Vipprow",
      description:     `Starter Plan · ${fmt(PRICE)}/mo`,
      image:           "/logo.png",
      prefill: { name: user?.name ?? "", email: user?.email ?? "", contact: user?.phone ?? "" },
      theme: { color: "#2563eb" },
      handler: async (resp: any) => {
        try {
          await verifySubscription({
            razorpay_payment_id:      resp.razorpay_payment_id,
            razorpay_subscription_id: resp.razorpay_subscription_id,
            razorpay_signature:       resp.razorpay_signature,
            planId:                   PLAN_ID,
          });
          setSubscriptionId(resp.razorpay_subscription_id);
          setScreen("success");
        } catch (err: any) {
          setFailReason(err?.response?.data?.message ?? err?.message ?? "Verification failed.");
          setScreen("failed");
        }
      },
      modal: { ondismiss() { setScreen("plans"); } },
    });
    rzp.open();
    rzp.on("payment.failed", (r: any) => {
      setFailReason(r?.error?.description ?? "Payment failed.");
      setScreen("failed");
    });
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-y-auto"
      style={{ background: pageBg, fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}>

      {/* Glow orb */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-30 z-0"
        style={{ background: "radial-gradient(circle,rgba(37,99,235,0.12) 0%,transparent 70%)" }}/>

      <div className="relative z-10 w-full max-w-md mx-auto px-4 py-8 flex flex-col">

        <AnimatePresence mode="wait">

          {/* ── PLANS ── */}
          {screen === "plans" && (
            <motion.div key="plans"
              initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-10 }} transition={{ duration:0.35, ease:[0.22,1,0.36,1] }}
              className="flex flex-col gap-5">

              {/* Header */}
              <div className="text-center pt-4">
                {/* Logo */}
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
                    boxShadow: "0 8px 28px rgba(37,99,235,0.4)" }}>
                  <Zap size={24} color="#fff"/>
                </div>

                {/* Trial badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3"
                  style={{ background: dark ? "rgba(59,130,246,0.12)" : "rgba(219,234,254,0.8)",
                    border: `1px solid ${dark ? "rgba(59,130,246,0.2)" : "rgba(147,197,253,0.5)"}` }}>
                  <Zap size={10} style={{ color:"#3b82f6" }}/>
                  <span className="text-[10.5px] font-extrabold uppercase tracking-[0.06em]" style={{ color:"#3b82f6" }}>
                    7-day free trial
                  </span>
                </div>

                <h1 className="text-[26px] font-black leading-tight mb-2"
                  style={{ letterSpacing:"-0.04em", color:textP }}>
                  Unlock Croissix
                </h1>
                <p className="text-[13px] font-medium leading-relaxed" style={{ color:textS }}>
                  Subscribe to access all features — Google analytics, AI insights, review management, and more.
                </p>
              </div>

              {/* Plan card */}
              <div className="rounded-3xl overflow-hidden"
                style={{ border:`2px solid ${dark?"rgba(59,130,246,0.3)":"rgba(59,130,246,0.25)"}`,
                  background: dark?"rgba(37,99,235,0.06)":"rgba(239,246,255,0.7)",
                  boxShadow: dark?"0 0 0 4px rgba(59,130,246,0.08),0 16px 48px rgba(37,99,235,0.18)":"0 0 0 4px rgba(59,130,246,0.06),0 8px 40px rgba(37,99,235,0.12)" }}>
                <div style={{ height:4, background:"linear-gradient(90deg,#1d4ed8,#3b82f6,#60a5fa)" }}/>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-[14px] flex items-center justify-center"
                        style={{ background:"linear-gradient(135deg,#1d4ed8,#3b82f6)", boxShadow:"0 6px 20px rgba(37,99,235,0.35)" }}>
                        <Zap size={20} color="#fff"/>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[18px] font-black" style={{ letterSpacing:"-0.03em", color:textP }}>Starter</span>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full text-white uppercase"
                            style={{ background:"linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>POPULAR</span>
                        </div>
                        <p className="text-[11px] mt-0.5 font-medium" style={{ color:textS }}>1 location · 5 posts/mo</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-start gap-0.5">
                        <span className="text-[12px] font-extrabold mt-1" style={{ color:dark?"#93c5fd":"#2563eb" }}>₹</span>
                        <span className="text-[34px] font-black leading-none" style={{ letterSpacing:"-0.05em", color:textP }}>499</span>
                      </div>
                      <p className="text-[10px] font-bold mt-0.5" style={{ color:textS }}>per month</p>
                    </div>
                  </div>

                  <div className="h-px mb-4" style={{ background: dark?"rgba(255,255,255,0.05)":"rgba(59,130,246,0.1)" }}/>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                    {FEATURES.map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center"
                          style={{ background: f.highlight?"linear-gradient(135deg,#1d4ed8,#3b82f6)":dark?"rgba(59,130,246,0.15)":"rgba(59,130,246,0.1)" }}>
                          <Check size={9} color={f.highlight?"#fff":"#3b82f6"} strokeWidth={3}/>
                        </div>
                        <span className="text-[11px]"
                          style={{ fontWeight:f.highlight?700:500,
                            color:dark?f.highlight?"#bfdbfe":"#94a3b8":f.highlight?"#1d4ed8":"#64748b" }}>
                          {f.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Trust row */}
              <div className="rounded-2xl p-3 flex items-center gap-2.5"
                style={{ background:dark?"rgba(37,99,235,0.07)":"rgba(219,234,254,0.5)",
                  border:`1px solid ${dark?"rgba(59,130,246,0.12)":"rgba(147,197,253,0.4)"}` }}>
                <Shield size={13} style={{ color:"#3b82f6", flexShrink:0 }}/>
                <p className="text-[11px] font-semibold m-0" style={{ color:dark?"#93c5fd":"#1d4ed8" }}>
                  <strong>7-day free trial</strong> · Cancel anytime · Secured by Razorpay
                </p>
              </div>

              {/* CTA */}
              <motion.button onClick={handleSubscribe} disabled={loading} whileTap={{ scale:0.975 }}
                className="w-full py-4 rounded-[18px] text-white text-[15px] font-black flex items-center justify-center gap-2 relative overflow-hidden disabled:opacity-60"
                style={{ background:"linear-gradient(135deg,#1d4ed8,#2563eb,#3b82f6)",
                  boxShadow:"0 10px 32px rgba(37,99,235,0.4)", letterSpacing:"-0.01em" }}>
                <motion.div className="absolute inset-0"
                  style={{ background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)" }}
                  animate={{ x:["-100%","100%"] }} transition={{ duration:2.2, repeat:Infinity, ease:"linear" }}/>
                {loading
                  ? <RefreshCw size={16} className="animate-spin relative"/>
                  : <Zap size={16} className="relative"/>}
                <span className="relative">
                  {loading ? "Loading…" : `Start Free Trial · ${fmt(PRICE)}/mo`}
                </span>
              </motion.button>
              <p className="text-center text-[10.5px] font-medium" style={{ color:dark?"#2d3f58":"#94a3b8" }}>
                Free for 7 days · then {fmt(PRICE)}/month · cancel anytime
              </p>
            </motion.div>
          )}

          {/* ── PROCESSING ── */}
          {screen === "processing" && (
            <motion.div key="processing"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center">
              <div className="relative">
                <motion.div animate={{ scale:[1,1.4,1], opacity:[0.4,0,0.4] }}
                  transition={{ duration:1.8, repeat:Infinity }}
                  className="absolute rounded-full border-2 border-blue-500" style={{ inset:-18 }}/>
                <motion.div animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:"linear" }}
                  className="rounded-full flex items-center justify-center"
                  style={{ width:52, height:52, background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",
                    boxShadow:"0 8px 28px rgba(37,99,235,0.35)" }}>
                  <RefreshCw size={22} color="#fff"/>
                </motion.div>
              </div>
              <div>
                <p className="text-[16px] font-extrabold mb-1.5" style={{ color:textP }}>Opening secure checkout…</p>
                <p className="text-[12px] font-medium" style={{ color:textS }}>Setting up your Starter subscription</p>
              </div>
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-full"
                style={{ background:dark?"rgba(59,130,246,0.08)":"rgba(219,234,254,0.6)",
                  border:`1px solid ${dark?"rgba(59,130,246,0.15)":"rgba(147,197,253,0.4)"}` }}>
                <Lock size={11} style={{ color:"#3b82f6" }}/>
                <span className="text-[10.5px] font-bold" style={{ color:dark?"#93c5fd":"#2563eb" }}>Secured by Razorpay</span>
              </div>
            </motion.div>
          )}

          {/* ── SUCCESS ── */}
          {screen === "success" && (
            <motion.div key="success"
              initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }}
              transition={{ duration:0.35, ease:[0.22,1,0.36,1] }}
              className="flex flex-col items-center text-center pt-10 gap-4">
              {/* Orb */}
              <motion.div style={{ position:"relative", width:100, height:100, marginBottom:8 }}>
                {[68,86,104].map((size,i)=>(
                  <motion.div key={i} initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }}
                    transition={{ delay:0.12+i*0.07, duration:0.4, ease:[0.34,1.3,0.64,1] }}
                    style={{ position:"absolute", borderRadius:"50%",
                      border:`1.5px solid rgba(59,130,246,${0.28-i*0.07})`,
                      width:size, height:size, top:(104-size)/2, left:(104-size)/2 }}/>
                ))}
                <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
                  transition={{ duration:0.45, ease:[0.34,1.5,0.64,1] }}
                  style={{ position:"absolute", top:12, left:12, width:76, height:76, borderRadius:"50%",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    background:"linear-gradient(135deg,#1d4ed8,#3b82f6)", boxShadow:"0 12px 44px rgba(37,99,235,0.42)" }}>
                  <CheckCircle2 size={34} color="#fff" strokeWidth={1.8}/>
                </motion.div>
                {[...Array(8)].map((_,i)=>(
                  <motion.div key={i}
                    initial={{ x:0,y:0,opacity:1,scale:1 }}
                    animate={{ x:Math.cos((i/8)*Math.PI*2)*58, y:Math.sin((i/8)*Math.PI*2)*58, opacity:0, scale:0 }}
                    transition={{ delay:0.28, duration:0.6, ease:"easeOut" }}
                    style={{ position:"absolute", top:"50%", left:"50%", width:5, height:5, borderRadius:"50%",
                      marginTop:-2.5, marginLeft:-2.5, background:i%2===0?"#3b82f6":"#60a5fa" }}/>
                ))}
              </motion.div>

              <motion.h1 initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
                className="text-[26px] font-black" style={{ letterSpacing:"-0.04em", color:textP }}>
                You're in! 🎉
              </motion.h1>
              <p className="text-[13px] font-medium" style={{ color:textS }}>
                Starter plan activated. Welcome to Croissix!
              </p>

              {/* Trial notice */}
              <div className="w-full rounded-2xl p-3.5 flex items-center gap-3 text-left mt-2"
                style={{ background:dark?"rgba(34,197,94,0.07)":"rgba(220,252,231,0.6)",
                  border:`1.5px solid ${dark?"rgba(34,197,94,0.14)":"rgba(134,239,172,0.4)"}` }}>
                <Clock size={14} style={{ color:"#22c55e", flexShrink:0 }}/>
                <div>
                  <p className="text-[12.5px] font-extrabold m-0" style={{ color:dark?"#4ade80":"#15803d" }}>Trial active — 7 days free</p>
                  <p className="text-[10.5px] mt-0.5 m-0" style={{ color:dark?"#16a34a":"#16a34a" }}>
                    First charge on {fmtDate(new Date(Date.now() + 7 * 86400000))} · Cancel anytime
                  </p>
                </div>
              </div>

              {/* Enter app button — page will reload and guard passes */}
              <motion.button
                onClick={() => window.location.reload()}
                whileTap={{ scale:0.975 }}
                className="w-full py-4 rounded-[18px] text-white text-[15px] font-black relative overflow-hidden mt-2"
                style={{ background:"linear-gradient(135deg,#1d4ed8,#2563eb,#3b82f6)",
                  boxShadow:"0 10px 32px rgba(37,99,235,0.38)", letterSpacing:"-0.01em" }}>
                <motion.div className="absolute inset-0"
                  style={{ background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)" }}
                  animate={{ x:["-100%","100%"] }} transition={{ duration:2.2, repeat:Infinity, ease:"linear" }}/>
                <span className="relative">Enter Croissix →</span>
              </motion.button>
            </motion.div>
          )}

          {/* ── FAILED ── */}
          {screen === "failed" && (
            <motion.div key="failed"
              initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }}
              transition={{ duration:0.32 }}
              className="flex flex-col items-center text-center pt-10 gap-4">
              <motion.div initial={{ scale:0 }} animate={{ scale:1, x:[0,-5,5,-2,2,0] }}
                transition={{ scale:{ duration:0.42, ease:[0.34,1.4,0.64,1] }, x:{ delay:0.45, duration:0.4 } }}
                className="rounded-full flex items-center justify-center"
                style={{ width:72, height:72, background:dark?"rgba(239,68,68,0.1)":"rgba(254,226,226,0.8)",
                  border:"2px solid rgba(239,68,68,0.25)" }}>
                <XCircle size={34} style={{ color:"#ef4444" }} strokeWidth={1.8}/>
              </motion.div>

              <h1 className="text-[24px] font-black" style={{ letterSpacing:"-0.04em", color:textP }}>Payment Failed</h1>
              <p className="text-[13px] font-medium" style={{ color:textS, maxWidth:260 }}>No charges were made.</p>

              {failReason && (
                <div className="w-full rounded-2xl p-3.5 flex items-start gap-2.5 text-left"
                  style={{ background:dark?"rgba(239,68,68,0.07)":"rgba(254,226,226,0.5)",
                    border:`1.5px solid ${dark?"rgba(239,68,68,0.15)":"rgba(252,165,165,0.4)"}` }}>
                  <AlertCircle size={14} style={{ color:"#ef4444", marginTop:1, flexShrink:0 }}/>
                  <p className="text-[12px] font-semibold m-0" style={{ color:dark?"#fca5a5":"#991b1b" }}>{failReason}</p>
                </div>
              )}

              <div className="w-full rounded-2xl p-3.5 flex items-center gap-2.5 text-left"
                style={{ background:dark?"rgba(37,99,235,0.07)":"rgba(219,234,254,0.5)",
                  border:`1px solid ${dark?"rgba(59,130,246,0.1)":"rgba(147,197,253,0.35)"}` }}>
                <Bell size={13} style={{ color:"#3b82f6", flexShrink:0 }}/>
                <p className="text-[11.5px] font-semibold m-0" style={{ color:dark?"#93c5fd":"#1d4ed8" }}>
                  Need help? Email <strong>support@vipprow.com</strong>
                </p>
              </div>

              <div className="w-full flex flex-col gap-2.5 mt-2">
                <button onClick={handleSubscribe} disabled={loading}
                  className="w-full py-4 rounded-[18px] text-white text-[14px] font-black flex items-center justify-center gap-2 relative overflow-hidden disabled:opacity-60 active:scale-[0.975]"
                  style={{ background:"linear-gradient(135deg,#1d4ed8,#3b82f6)", boxShadow:"0 10px 32px rgba(37,99,235,0.38)" }}>
                  {loading?<RefreshCw size={14} className="animate-spin"/>:<RefreshCw size={14}/>}
                  {loading?"Loading…":"Try Again"}
                </button>
                <button onClick={() => setScreen("plans")}
                  className="w-full py-3.5 rounded-[18px] text-[13px] font-bold active:scale-[0.975]"
                  style={{ background:"transparent",
                    border:`1.5px solid ${dark?"rgba(255,255,255,0.09)":"rgba(203,213,225,0.7)"}`,
                    color:textS }}>
                  ← Back
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN GUARD
══════════════════════════════════════════════════ */
export default function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const [mounted,   setMounted]  = useState(false);
  const [authed,    setAuthed]   = useState(false);

  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";

  // 1. Auth check
  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace("/login"); return; }
    setAuthed(true);
  }, [router]);

  // 2. Subscription check (only when authed)
  const { isActive, isLoading: subLoading } = useSubscription();

  // Routes exempt from subscription gate
  const isExempt = EXEMPT.some(p => pathname?.startsWith(p));

  if (!authed) return null;

  // Still checking subscription
  if (subLoading) return <AppSkeleton dark={dark}/>;

  // Has active subscription OR on exempt route → render the app
  if (isActive || isExempt) return <>{children}</>;

  // No active subscription → show the inline gate
  return <SubscriptionGate dark={dark}/>;
}