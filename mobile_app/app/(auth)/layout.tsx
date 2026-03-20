// mobile_app\app\(auth)\layout.tsx
// mobile_app\app\(auth)\layout.tsx

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* ── Left decorative panel — hidden on mobile, visible md+ ── */}
      <div
        className="
          hidden md:flex
          w-[420px] lg:w-[480px] xl:w-[520px]
          flex-shrink-0
          flex-col items-center justify-center
          relative overflow-hidden
          bg-[#0f1e3a]
        "
      >
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-32 -left-32 w-[400px] h-[400px] rounded-full opacity-30"
            style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)" }}
          />
          <div
            className="absolute -bottom-24 -right-24 w-[350px] h-[350px] rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #1d4ed8 0%, transparent 70%)" }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #60a5fa 0%, transparent 60%)" }}
          />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 px-10 text-center flex flex-col items-center gap-6">
          {/* Logo / Icon */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2"
            style={{
              background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
              boxShadow: "0 8px 32px rgba(37,99,235,0.4)",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7l10 5 10-5-10-5z"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17l10 5 10-5"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12l10 5 10-5"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div>
            <h2
              className="text-3xl font-black text-white mb-3"
              style={{ letterSpacing: "-0.04em" }}
            >
              Croissix AI
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-[280px]">
              The fastest way to manage your workflow. Trusted by thousands of teams worldwide.
            </p>
          </div>

          {/* Feature list */}
          <div className="flex flex-col gap-3 mt-2 w-full max-w-[280px]">
            {[
              { icon: "⚡", text: "Lightning fast performance" },
              { icon: "🔒", text: "Enterprise-grade security" },
              { icon: "📊", text: "Real-time analytics" },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-3 text-left"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                  style={{ background: "rgba(59,130,246,0.15)" }}
                >
                  {item.icon}
                </div>
                <span className="text-slate-300 text-sm">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="mt-4 pt-6 border-t border-white/10 w-full max-w-[280px]">
            <div className="flex items-center justify-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
            <p className="text-slate-500 text-[11px]">
              Rated 4.9/5 by 10,000+ users
            </p>
          </div>
        </div>
      </div>

      {/* ── Right side — the actual page content ── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {children}
      </div>
    </div>
  );
}