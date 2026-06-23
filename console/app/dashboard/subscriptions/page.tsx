"use client";

import { useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { ChevronLeft, ChevronRight, User, Filter } from "lucide-react";
import api from "@/lib/api";

interface SubRecord {
  _id: string;
  user: { name: string; email: string; avatar?: string } | null;
  razorpaySubscriptionId: string;
  planId: string;
  status: "created" | "active" | "cancelled" | "failed" | "expired";
  amount: number;
  currency: string;
  currentStart?: string;
  currentEnd?: string;
  paidCount: number;
  totalCount: number;
  createdAt: string;
}

interface Pagination {
  page: number;
  pages: number;
  total: number;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active:    { bg: "rgba(16,185,129,0.12)", text: "#10b981" },
  created:   { bg: "rgba(59,130,246,0.12)", text: "#3b82f6" },
  cancelled: { bg: "rgba(239,68,68,0.12)", text: "#ef4444" },
  failed:    { bg: "rgba(239,68,68,0.12)", text: "#ef4444" },
  expired:   { bg: "rgba(100,116,139,0.12)", text: "#64748b" },
};

const STATUS_OPTIONS = ["", "active", "created", "cancelled", "failed", "expired"];

export default function SubscriptionsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [subs, setSubs] = useState<SubRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => { setMounted(true); }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const pageBg = isDark ? "#0d1421" : "#eef2fb";
  const cardBg = isDark ? "#131c2d" : "#fff";
  const cardBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(37,99,235,0.07)";
  const textPrimary = isDark ? "#f1f5f9" : "#0f172a";
  const textSub = isDark ? "#64748b" : "#94a3b8";
  const rowHover = isDark ? "rgba(255,255,255,0.03)" : "rgba(37,99,235,0.03)";

  const fetchSubs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/subscriptions", { params: { page, limit: 15, status: statusFilter } });
      setSubs(data.subscriptions);
      setPagination(data.pagination);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  if (!mounted) return null;

  return (
    <div className="p-6 md:p-8 min-h-full" style={{ background: pageBg }}>
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black mb-0.5" style={{ color: textPrimary, letterSpacing: "-0.04em" }}>
            Subscriptions
          </h1>
          <p className="text-sm" style={{ color: textSub }}>
            {pagination.total.toLocaleString()} total subscriptions
          </p>
        </div>

        {/* status filter */}
        <div
          className="flex items-center gap-2 h-10 px-3 rounded-[11px] border"
          style={{ background: cardBg, borderColor: cardBorder }}
        >
          <Filter size={14} style={{ color: textSub }} />
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-transparent outline-none text-[13px] pr-2"
            style={{ color: statusFilter ? STATUS_COLORS[statusFilter]?.text : textSub }}
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s} style={{ background: isDark ? "#131c2d" : "#fff", color: s ? STATUS_COLORS[s]?.text : textPrimary }}>
                {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All Statuses"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* table */}
      <div
        className="rounded-[18px] overflow-hidden"
        style={{ background: cardBg, border: `1px solid ${cardBorder}`, boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.3)" : "0 4px 16px rgba(37,99,235,0.06)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid ${cardBorder}` }}>
                {["User", "Plan", "Status", "Amount", "Billing Period", "Paid Cycles", "Date"].map(h => (
                  <th
                    key={h}
                    className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-widest whitespace-nowrap"
                    style={{ color: textSub }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 rounded animate-pulse" style={{ background: isDark ? "#182236" : "#e2e8f0", width: j === 0 ? 160 : 80 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : subs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm" style={{ color: textSub }}>
                    No subscriptions found.
                  </td>
                </tr>
              ) : (
                subs.map(sub => {
                  const sc = STATUS_COLORS[sub.status] || STATUS_COLORS.expired;
                  return (
                    <tr
                      key={sub._id}
                      className="transition-colors duration-100"
                      style={{ borderBottom: `1px solid ${cardBorder}` }}
                      onMouseEnter={e => (e.currentTarget.style.background = rowHover)}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* user */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden shrink-0"
                            style={{ background: isDark ? "#182236" : "#eff6ff" }}
                          >
                            {sub.user?.avatar ? (
                              <img src={sub.user.avatar} alt={sub.user.name} className="w-full h-full object-cover" />
                            ) : (
                              <User size={14} color="#3b82f6" />
                            )}
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold" style={{ color: textPrimary }}>
                              {sub.user?.name || "Deleted User"}
                            </p>
                            <p className="text-[11px]" style={{ color: textSub }}>{sub.user?.email || "—"}</p>
                          </div>
                        </div>
                      </td>

                      {/* plan */}
                      <td className="px-5 py-3.5">
                        <span
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize"
                          style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}
                        >
                          {sub.planId}
                        </span>
                      </td>

                      {/* status */}
                      <td className="px-5 py-3.5">
                        <span
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize"
                          style={{ background: sc.bg, color: sc.text }}
                        >
                          {sub.status}
                        </span>
                      </td>

                      {/* amount */}
                      <td className="px-5 py-3.5 text-[13px] font-semibold" style={{ color: textPrimary }}>
                        ₹{(sub.amount / 100).toLocaleString("en-IN")}
                        <span className="text-[10px] font-normal ml-1" style={{ color: textSub }}>/{sub.currency}</span>
                      </td>

                      {/* billing period */}
                      <td className="px-5 py-3.5 text-[12px]" style={{ color: textSub }}>
                        {sub.currentStart && sub.currentEnd ? (
                          <>
                            {new Date(sub.currentStart).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            {" – "}
                            {new Date(sub.currentEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </>
                        ) : "—"}
                      </td>

                      {/* paid cycles */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold" style={{ color: textPrimary }}>
                            {sub.paidCount}/{sub.totalCount}
                          </span>
                          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? "#182236" : "#e2e8f0" }}>
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(100, (sub.paidCount / sub.totalCount) * 100)}%`,
                                background: sc.text,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* date */}
                      <td className="px-5 py-3.5 text-[12px]" style={{ color: textSub }}>
                        {new Date(sub.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: cardBorder }}>
            <p className="text-[12px]" style={{ color: textSub }}>
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-40"
                style={{ background: isDark ? "#182236" : "#f1f5f9", color: textPrimary }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-40"
                style={{ background: isDark ? "#182236" : "#f1f5f9", color: textPrimary }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}