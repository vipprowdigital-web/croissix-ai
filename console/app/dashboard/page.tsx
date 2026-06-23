"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Users, CreditCard, TrendingUp, Activity } from "lucide-react";
import api from "@/lib/api";

interface Stats {
  totalUsers: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalRevenue: number;
}

function StatCard({
  title,
  value,
  icon: Icon,
  accent,
  isDark,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
  isDark: boolean;
}) {
  return (
    <div
      className="rounded-[18px] p-5 flex flex-col gap-4"
      style={{
        background: isDark ? "#131c2d" : "#fff",
        border: isDark
          ? "1px solid rgba(255,255,255,0.06)"
          : "1px solid rgba(37,99,235,0.07)",
        boxShadow: isDark
          ? "0 4px 24px rgba(0,0,0,0.3)"
          : "0 4px 16px rgba(37,99,235,0.06)",
      }}
    >
      <div className="flex items-center justify-between">
        <p
          className="text-[12px] font-semibold uppercase tracking-widest"
          style={{ color: isDark ? "#64748b" : "#94a3b8" }}
        >
          {title}
        </p>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}18` }}
        >
          <Icon size={17} color={accent} strokeWidth={2} />
        </div>
      </div>
      <p
        className="text-3xl font-black"
        style={{
          color: isDark ? "#f1f5f9" : "#0f172a",
          letterSpacing: "-0.04em",
        }}
      >
        {value}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    api
      .get("/admin/stats")
      .then((r) => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const pageBg = isDark ? "#0d1421" : "#eef2fb";
  const textPrimary = isDark ? "#f1f5f9" : "#0f172a";
  const textSub = isDark ? "#64748b" : "#94a3b8";

  return (
    <div className="p-6 md:p-8 min-h-full" style={{ background: pageBg }}>
      <div className="mb-8">
        <h1
          className="text-2xl font-black mb-1"
          style={{ color: textPrimary, letterSpacing: "-0.04em" }}
        >
          Dashboard
        </h1>
        <p className="text-sm" style={{ color: textSub }}>
          Overview of your Croissix platform
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-[18px] h-28 animate-pulse"
              style={{ background: isDark ? "#131c2d" : "#e2e8f0" }}
            />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon={Users}
            accent="#3b82f6"
            isDark={isDark}
          />
          <StatCard
            title="Total Subscriptions"
            value={stats.totalSubscriptions.toLocaleString()}
            icon={CreditCard}
            accent="#8b5cf6"
            isDark={isDark}
          />
          <StatCard
            title="Active Subscriptions"
            value={stats.activeSubscriptions.toLocaleString()}
            icon={Activity}
            accent="#10b981"
            isDark={isDark}
          />
          <StatCard
            title="Total Revenue"
            value={`₹${stats.totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`}
            icon={TrendingUp}
            accent="#f59e0b"
            isDark={isDark}
          />
        </div>
      ) : (
        <p style={{ color: textSub }}>Failed to load stats.</p>
      )}

      {/* quick links */}
      <div className="mt-10">
        <h2
          className="text-[13px] font-semibold uppercase tracking-widest mb-4"
          style={{ color: textSub }}
        >
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <QuickLink
            href="/dashboard/users"
            icon={Users}
            label="Manage Users"
            desc="View, edit or delete user accounts"
            accent="#3b82f6"
            isDark={isDark}
          />
          <QuickLink
            href="/dashboard/subscriptions"
            icon={CreditCard}
            label="View Subscriptions"
            desc="Track all subscription activity"
            accent="#8b5cf6"
            isDark={isDark}
          />
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
  desc,
  accent,
  isDark,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  desc: string;
  accent: string;
  isDark: boolean;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-4 rounded-[16px] p-4 transition-all duration-150 hover:scale-[1.01] active:scale-[0.99]"
      style={{
        background: isDark ? "#131c2d" : "#fff",
        border: isDark
          ? "1px solid rgba(255,255,255,0.06)"
          : "1px solid rgba(37,99,235,0.07)",
        boxShadow: isDark
          ? "0 2px 12px rgba(0,0,0,0.2)"
          : "0 2px 8px rgba(37,99,235,0.05)",
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${accent}18` }}
      >
        <Icon size={18} color={accent} strokeWidth={2} />
      </div>
      <div>
        <p
          className="text-[14px] font-bold"
          style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}
        >
          {label}
        </p>
        <p
          className="text-[12px]"
          style={{ color: isDark ? "#64748b" : "#94a3b8" }}
        >
          {desc}
        </p>
      </div>
    </a>
  );
}
