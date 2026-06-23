"use client";

import { useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Building2,
} from "lucide-react";
import api from "@/lib/api";

interface Owner {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
}

interface BusinessRecord {
  _id: string;
  owner: Owner;
  businessName: string;
  employeeCount: number;
  city?: string;
  state?: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  pages: number;
  total: number;
}

export default function BusinessPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [businesses, setBusinesses] = useState<BusinessRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pages: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const pageBg = isDark ? "#0d1421" : "#eef2fb";
  const cardBg = isDark ? "#131c2d" : "#fff";
  const cardBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(37,99,235,0.07)";
  const textPrimary = isDark ? "#f1f5f9" : "#0f172a";
  const textSub = isDark ? "#64748b" : "#94a3b8";
  const rowHover = isDark ? "rgba(255,255,255,0.03)" : "rgba(37,99,235,0.03)";

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/businesses", {
        params: { page, limit: 15, search },
      });
      setBusinesses(data.businesses);
      setPagination(data.pagination);
    } catch {
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  console.log("Businesses: ", businesses);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  if (!mounted) return null;

  return (
    <div className="p-6 md:p-8 min-h-full" style={{ background: pageBg }}>
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1
            className="text-2xl font-black mb-0.5"
            style={{ color: textPrimary, letterSpacing: "-0.04em" }}
          >
            Businesses
          </h1>
          <p className="text-sm" style={{ color: textSub }}>
            {pagination.total.toLocaleString()} registered businesses
          </p>
        </div>

        {/* search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div
            className="flex items-center gap-2 h-10 px-3 rounded-[11px] border"
            style={{
              background: cardBg,
              borderColor: cardBorder,
              minWidth: 260,
            }}
          >
            <Search size={14} style={{ color: textSub }} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, city, owner…"
              className="flex-1 bg-transparent outline-none text-[13px]"
              style={{ color: textPrimary }}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setPage(1);
                }}
              >
                <X size={13} style={{ color: textSub }} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="h-10 px-4 rounded-[11px] text-[13px] font-semibold text-white"
            style={{
              background: "linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%)",
            }}
          >
            Search
          </button>
        </form>
      </div>

      {/* table */}
      <div
        className="rounded-[18px] overflow-hidden"
        style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          boxShadow: isDark
            ? "0 4px 24px rgba(0,0,0,0.3)"
            : "0 4px 16px rgba(37,99,235,0.06)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid ${cardBorder}` }}>
                {[
                  "Business",
                  "Owner",
                  "Employees",
                  "Location",
                  "Registered",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-widest"
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
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div
                          className="h-4 rounded animate-pulse"
                          style={{
                            background: isDark ? "#182236" : "#e2e8f0",
                            width: j === 0 ? 160 : 100,
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : businesses.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-14 text-center"
                    style={{ color: textSub }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Building2
                        size={28}
                        strokeWidth={1.5}
                        style={{ color: isDark ? "#1e3a5f" : "#cbd5e1" }}
                      />
                      <p className="text-sm">No businesses found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                businesses.map((b) => (
                  <tr
                    key={b._id}
                    className="transition-colors duration-100"
                    style={{ borderBottom: `1px solid ${cardBorder}` }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = rowHover)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    {/* business name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: "rgba(59,130,246,0.12)" }}
                        >
                          <Building2
                            size={14}
                            color="#3b82f6"
                            strokeWidth={2}
                          />
                        </div>
                        <p
                          className="text-[13px] font-semibold"
                          style={{ color: textPrimary }}
                        >
                          {b.businessName}
                        </p>
                      </div>
                    </td>

                    {/* owner */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden shrink-0"
                          style={{ background: isDark ? "#182236" : "#eff6ff" }}
                        >
                          {b.owner?.avatar ? (
                            <img
                              src={b.owner.avatar}
                              alt={b.owner.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User size={12} color="#3b82f6" />
                          )}
                        </div>
                        <div>
                          <p
                            className="text-[12px] font-semibold"
                            style={{ color: textPrimary }}
                          >
                            {b.owner?.name ?? "—"}
                          </p>
                          <p className="text-[11px]" style={{ color: textSub }}>
                            {b.owner?.email ?? "—"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* employees */}
                    <td className="px-5 py-3.5">
                      <span
                        className="text-[12px] font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          background: isDark
                            ? "rgba(59,130,246,0.12)"
                            : "rgba(59,130,246,0.08)",
                          color: "#3b82f6",
                        }}
                      >
                        {b.employeeCount ?? 0}
                      </span>
                    </td>

                    {/* location */}
                    <td
                      className="px-5 py-3.5 text-[13px]"
                      style={{ color: textSub }}
                    >
                      {[b.city, b.state].filter(Boolean).join(", ") || "—"}
                    </td>

                    {/* date */}
                    <td
                      className="px-5 py-3.5 text-[12px]"
                      style={{ color: textSub }}
                    >
                      {new Date(b.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* pagination */}
        {pagination.pages > 1 && (
          <div
            className="flex items-center justify-between px-5 py-3 border-t"
            style={{ borderColor: cardBorder }}
          >
            <p className="text-[12px]" style={{ color: textSub }}>
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-40"
                style={{
                  background: isDark ? "#182236" : "#f1f5f9",
                  color: textPrimary,
                }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() =>
                  setPage((p) => Math.min(pagination.pages, p + 1))
                }
                disabled={page === pagination.pages}
                className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-40"
                style={{
                  background: isDark ? "#182236" : "#f1f5f9",
                  color: textPrimary,
                }}
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
