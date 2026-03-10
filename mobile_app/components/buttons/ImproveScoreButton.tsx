// mobile_app\components\buttons\ImproveScoreButton.ts

"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Brain, Sparkles, ArrowUpRight, Zap } from "lucide-react";

export default function ImproveScoreButton() {
  const router   = useRouter();
  const [pressed,  setPressed]  = useState(false);
  const [scanning, setScanning] = useState(false);
  const [tick,     setTick]     = useState(0);
  const [sparkle,  setSparkle]  = useState(false);

  /* shimmer sweep */
  useEffect(() => {
    const id = setInterval(() => setTick(t => (t + 1) % 100), 40);
    return () => clearInterval(id);
  }, []);

  /* sparkle ping every 3 s */
  useEffect(() => {
    const id = setInterval(() => {
      setSparkle(true);
      setTimeout(() => setSparkle(false), 600);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  function handleClick() {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      router.push("/dashboard/checklist");
    }, 1800);
  }

  const dots = [
    { left: "12%", top: "22%", delay: "0s",    r: 2.5 },
    { left: "82%", top: "28%", delay: "0.55s", r: 1.8 },
    { left: "22%", top: "72%", delay: "1.1s",  r: 2   },
    { left: "68%", top: "68%", delay: "0.3s",  r: 1.5 },
    { left: "48%", top: "14%", delay: "0.75s", r: 1.5 },
    { left: "88%", top: "65%", delay: "1.4s",  r: 2   },
    { left: "35%", top: "80%", delay: "0.9s",  r: 1.5 },
  ];

  return (
    <button
      onClick={handleClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        width: "100%",
        height: 52,
        borderRadius: 16,
        border: "1px solid rgba(96,165,250,0.28)",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        color: "#fff",
        fontFamily: "-apple-system,'SF Pro Display',sans-serif",
        fontSize: 14,
        fontWeight: 800,
        letterSpacing: "-0.02em",
        background: "linear-gradient(118deg, #0d1f45 0%, #1a3a8f 45%, #2563eb 100%)",
        transform: pressed ? "scale(0.965)" : "scale(1)",
        transition: "transform 0.13s cubic-bezier(0.4,0,0.2,1), box-shadow 0.13s",
        boxShadow: pressed
          ? "0 2px 8px rgba(37,99,235,0.22), inset 0 0 0 1px rgba(96,165,250,0.15)"
          : "0 6px 22px rgba(37,99,235,0.38), inset 0 1px 0 rgba(255,255,255,0.07)",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {/* shimmer */}
      <span style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `linear-gradient(108deg,
          transparent ${tick - 5}%,
          rgba(147,197,253,0.1) ${tick + 5}%,
          rgba(219,234,254,0.07) ${tick + 12}%,
          transparent ${tick + 22}%)`,
      }}/>

      {/* dot grid */}
      <span style={{
        position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.04,
        backgroundImage:
          "repeating-linear-gradient(0deg,#93c5fd 0,#93c5fd 1px,transparent 1px,transparent 24px)," +
          "repeating-linear-gradient(90deg,#93c5fd 0,#93c5fd 1px,transparent 1px,transparent 24px)",
      }}/>

      {/* top edge highlight */}
      <span style={{
        position: "absolute", top: 0, left: "8%", right: "8%", height: 1,
        pointerEvents: "none",
        background: "linear-gradient(90deg, transparent, rgba(147,197,253,0.55), transparent)",
      }}/>

      {/* bottom accent */}
      <span style={{
        position: "absolute", bottom: 0, left: "18%", right: "18%", height: 1,
        pointerEvents: "none",
        background: "linear-gradient(90deg, transparent, rgba(96,165,250,0.4), transparent)",
      }}/>

      {/* left bloom */}
      <span style={{
        position: "absolute", left: -24, top: "50%", transform: "translateY(-50%)",
        width: 80, height: 80, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)",
        pointerEvents: "none",
      }}/>

      {/* floating micro-dots */}
      {dots.map((d, i) => (
        <span key={i} style={{
          position: "absolute", left: d.left, top: d.top,
          width: d.r, height: d.r, borderRadius: "50%",
          background: "rgba(147,197,253,0.55)",
          pointerEvents: "none",
          animation: `isbp ${2.4 + i * 0.15}s ease-in-out ${d.delay} infinite`,
        }}/>
      ))}

      {/* ── SCANNING ── */}
      {scanning ? (
        <>
          <span style={{
            position: "absolute", top: 0, left: "-70%",
            width: "55%", height: "100%", pointerEvents: "none",
            background: "linear-gradient(90deg, transparent, rgba(219,234,254,0.18), transparent)",
            animation: "isbSweep 1.1s cubic-bezier(0.4,0,0.2,1) forwards",
          }}/>
          <span style={{
            position: "absolute", bottom: 0, left: 0, height: 2, width: "100%",
            background: "linear-gradient(90deg, transparent, #93c5fd, transparent)",
            animation: "isbBar 1.1s ease-in-out forwards",
            pointerEvents: "none",
          }}/>
          <Brain size={15} style={{ color: "#bfdbfe", flexShrink: 0,
            animation: "isbSpin 0.55s linear infinite" }}/>
          <span style={{ color: "#bfdbfe", fontSize: 13 }}>Launching Audit…</span>
        </>
      ) : (
        <>
          {/* brain + sparkle */}
          <span style={{
            position: "relative", display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Brain size={16} style={{ color: "#93c5fd" }}/>
            <Sparkles size={8} style={{
              position: "absolute", top: -5, right: -5, color: "#fbbf24",
              opacity: sparkle ? 1 : 0.5,
              transform: sparkle ? "scale(1.4) rotate(15deg)" : "scale(1)",
              transition: "opacity 0.2s, transform 0.2s",
            }}/>
          </span>

          <span style={{ color: "#fff" }}>Improve Google Score</span>

          {/* AI pill */}
          <span style={{
            display: "flex", alignItems: "center", gap: 3,
            padding: "2px 8px", borderRadius: 999,
            background: "rgba(37,99,235,0.45)",
            border: "1px solid rgba(96,165,250,0.35)",
            fontSize: 10, fontWeight: 800,
            color: "#93c5fd", letterSpacing: "0.04em",
          }}>
            <Zap size={8} style={{ color: "#fbbf24" }}/> AI
          </span>

          <ArrowUpRight size={13} style={{ color: "rgba(147,197,253,0.65)", flexShrink: 0 }}/>
        </>
      )}

      <style>{`
        @keyframes isbp     { 0%,100%{opacity:.45;transform:scale(1)}  50%{opacity:1;transform:scale(1.9)} }
        @keyframes isbSweep { 0%{left:-70%} 100%{left:120%} }
        @keyframes isbBar   { 0%{transform:scaleX(0);transform-origin:left;opacity:1} 70%{transform:scaleX(1);opacity:1} 100%{opacity:0} }
        @keyframes isbSpin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </button>
  );
}