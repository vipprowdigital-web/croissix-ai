"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, CreditCard, LogOut, ShieldCheck, Menu, X, Sun, Moon,
} from "lucide-react";
import { clearAuth, getAdminInfo } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/users", icon: Users, label: "Users" },
  { href: "/dashboard/subscriptions", icon: CreditCard, label: "Subscriptions" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const admin = mounted ? getAdminInfo() : null;

  const handleLogout = () => {
    clearAuth();
    router.replace("/login");
  };

  const sidebarBg = isDark ? "#0f1a2e" : "#f8faff";
  const borderColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(37,99,235,0.08)";

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: sidebarBg }}>
      {/* logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor }}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%)" }}
        >
          <ShieldCheck size={18} color="white" strokeWidth={2} />
        </div>
        <div>
          <p className="text-[13px] font-black" style={{ color: isDark ? "#fff" : "#0f172a", letterSpacing: "-0.03em" }}>
            Croissix
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#3b82f6" }}>
            Console
          </p>
        </div>
      </div>

      {/* nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
          return (
            <Link
              key={href} href={href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[11px] text-[13px] font-semibold transition-all duration-150"
              style={{
                background: active ? (isDark ? "rgba(37,99,235,0.15)" : "rgba(37,99,235,0.08)") : "transparent",
                color: active ? "#3b82f6" : isDark ? "#94a3b8" : "#475569",
              }}
            >
              <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* bottom */}
      <div className="px-3 pb-5 flex flex-col gap-2 border-t pt-3" style={{ borderColor }}>
        {/* admin info */}
        {admin && (
          <div className="px-3 py-2 rounded-[11px]" style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(37,99,235,0.04)" }}>
            <p className="text-[12px] font-semibold truncate" style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>
              {admin.name}
            </p>
            <p className="text-[11px] truncate" style={{ color: isDark ? "#64748b" : "#64748b" }}>
              {admin.email}
            </p>
          </div>
        )}

        {/* theme toggle */}
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="flex items-center gap-3 px-3 py-2.5 rounded-[11px] text-[13px] font-semibold transition-all duration-150 w-full"
          style={{ color: isDark ? "#94a3b8" : "#475569" }}
        >
          {isDark ? <Sun size={16} strokeWidth={1.8} /> : <Moon size={16} strokeWidth={1.8} />}
          {isDark ? "Light Mode" : "Dark Mode"}
        </button>

        {/* logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-[11px] text-[13px] font-semibold transition-all duration-150 w-full"
          style={{ color: "#ef4444" }}
        >
          <LogOut size={16} strokeWidth={1.8} />
          Sign Out
        </button>
      </div>
    </div>
  );

  if (!mounted) return null;

  return (
    <>
      {/* desktop sidebar */}
      <aside
        className="hidden md:flex flex-col w-56 shrink-0 h-screen sticky top-0 border-r"
        style={{ borderColor, background: sidebarBg }}
      >
        <SidebarContent />
      </aside>

      {/* mobile top bar */}
      <div
        className="md:hidden flex items-center justify-between px-4 h-14 border-b sticky top-0 z-40"
        style={{ background: sidebarBg, borderColor }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%)" }}
          >
            <ShieldCheck size={14} color="white" strokeWidth={2} />
          </div>
          <span className="text-[13px] font-black" style={{ color: isDark ? "#fff" : "#0f172a" }}>
            Croissix Console
          </span>
        </div>
        <button onClick={() => setMobileOpen(v => !v)} style={{ color: isDark ? "#94a3b8" : "#475569" }}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-56 h-full border-r" style={{ borderColor, background: sidebarBg }}>
            <SidebarContent />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  );
}
