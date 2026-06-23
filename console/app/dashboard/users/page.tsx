"use client";

import { useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import {
  Search, Pencil, Trash2, X, Check, ChevronLeft, ChevronRight, User,
} from "lucide-react";
import api from "@/lib/api";

interface UserRecord {
  _id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  provider: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  pages: number;
  total: number;
}

export default function UsersPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);

  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const pageBg = isDark ? "#0d1421" : "#eef2fb";
  const cardBg = isDark ? "#131c2d" : "#fff";
  const cardBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(37,99,235,0.07)";
  const textPrimary = isDark ? "#f1f5f9" : "#0f172a";
  const textSub = isDark ? "#64748b" : "#94a3b8";
  const rowHover = isDark ? "rgba(255,255,255,0.03)" : "rgba(37,99,235,0.03)";

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/users", { params: { page, limit: 15, search } });
      setUsers(data.users);
      setPagination(data.pagination);
    } catch {
      showToast("Failed to load users", false);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const openEdit = (u: UserRecord) => {
    setEditUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditPhone(u.phone);
    setEditError("");
  };

  const handleEdit = async () => {
    if (!editUser) return;
    setEditError("");
    setEditLoading(true);
    try {
      await api.patch(`/admin/users/${editUser._id}`, { name: editName, email: editEmail, phone: editPhone });
      showToast("User updated", true);
      setEditUser(null);
      fetchUsers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setEditError(msg || "Update failed");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/users/${deleteTarget._id}`);
      showToast("User deleted", true);
      setDeleteTarget(null);
      fetchUsers();
    } catch {
      showToast("Delete failed", false);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="p-6 md:p-8 min-h-full" style={{ background: pageBg }}>
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black mb-0.5" style={{ color: textPrimary, letterSpacing: "-0.04em" }}>
            Users
          </h1>
          <p className="text-sm" style={{ color: textSub }}>
            {pagination.total.toLocaleString()} total users
          </p>
        </div>

        {/* search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div
            className="flex items-center gap-2 h-10 px-3 rounded-[11px] border"
            style={{ background: cardBg, borderColor: cardBorder, minWidth: 240 }}
          >
            <Search size={14} style={{ color: textSub }} />
            <input
              type="text" value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by name, email, phone…"
              className="flex-1 bg-transparent outline-none text-[13px]"
              style={{ color: textPrimary }}
            />
            {searchInput && (
              <button type="button" onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}>
                <X size={13} style={{ color: textSub }} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="h-10 px-4 rounded-[11px] text-[13px] font-semibold text-white"
            style={{ background: "linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%)" }}
          >
            Search
          </button>
        </form>
      </div>

      {/* table card */}
      <div
        className="rounded-[18px] overflow-hidden"
        style={{ background: cardBg, border: `1px solid ${cardBorder}`, boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.3)" : "0 4px 16px rgba(37,99,235,0.06)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid ${cardBorder}` }}>
                {["User", "Phone", "Provider", "Joined", "Actions"].map(h => (
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
                        <div className="h-4 rounded animate-pulse" style={{ background: isDark ? "#182236" : "#e2e8f0", width: j === 0 ? 160 : j === 4 ? 80 : 100 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm" style={{ color: textSub }}>
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr
                    key={u._id}
                    className="transition-colors duration-100"
                    style={{ borderBottom: `1px solid ${cardBorder}` }}
                    onMouseEnter={e => (e.currentTarget.style.background = rowHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* user cell */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden shrink-0"
                          style={{ background: isDark ? "#182236" : "#eff6ff" }}
                        >
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            <User size={14} color="#3b82f6" />
                          )}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold" style={{ color: textPrimary }}>{u.name}</p>
                          <p className="text-[11px]" style={{ color: textSub }}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px]" style={{ color: textSub }}>{u.phone}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize"
                        style={{
                          background: u.provider === "google" ? "rgba(66,133,244,0.12)" : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                          color: u.provider === "google" ? "#4285F4" : textSub,
                        }}
                      >
                        {u.provider}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[12px]" style={{ color: textSub }}>
                      {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEdit(u)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-105"
                          style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}
                          title="Edit"
                        >
                          <Pencil size={13} strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-105"
                          style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
                          title="Delete"
                        >
                          <Trash2 size={13} strokeWidth={2} />
                        </button>
                      </div>
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

      {/* ── Edit Modal ── */}
      {editUser && (
        <Modal isDark={isDark} onClose={() => setEditUser(null)} title="Edit User">
          <div className="flex flex-col gap-4">
            <ModalField label="Name" isDark={isDark}>
              <input
                type="text" value={editName} onChange={e => setEditName(e.target.value)}
                className="w-full h-10 px-3 rounded-[10px] border text-[13px] outline-none"
                style={{ background: isDark ? "#182236" : "#f8fafc", borderColor: cardBorder, color: textPrimary }}
              />
            </ModalField>
            <ModalField label="Email" isDark={isDark}>
              <input
                type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-[10px] border text-[13px] outline-none"
                style={{ background: isDark ? "#182236" : "#f8fafc", borderColor: cardBorder, color: textPrimary }}
              />
            </ModalField>
            <ModalField label="Phone" isDark={isDark}>
              <input
                type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)}
                className="w-full h-10 px-3 rounded-[10px] border text-[13px] outline-none"
                style={{ background: isDark ? "#182236" : "#f8fafc", borderColor: cardBorder, color: textPrimary }}
              />
            </ModalField>
            {editError && <p className="text-[12px] text-red-400">{editError}</p>}
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setEditUser(null)}
                className="flex-1 h-10 rounded-[10px] text-[13px] font-semibold"
                style={{ background: isDark ? "#182236" : "#f1f5f9", color: textSub }}
              >
                Cancel
              </button>
              <button
                onClick={handleEdit} disabled={editLoading}
                className="flex-1 h-10 rounded-[10px] text-[13px] font-semibold text-white disabled:opacity-60 flex items-center justify-center gap-1.5"
                style={{ background: "linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%)" }}
              >
                {editLoading ? "Saving…" : <><Check size={14} /> Save</>}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <Modal isDark={isDark} onClose={() => setDeleteTarget(null)} title="Delete User">
          <p className="text-[13px] mb-5" style={{ color: textSub }}>
            Are you sure you want to delete <strong style={{ color: textPrimary }}>{deleteTarget.name}</strong>?
            This will also remove all their subscriptions and cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="flex-1 h-10 rounded-[10px] text-[13px] font-semibold"
              style={{ background: isDark ? "#182236" : "#f1f5f9", color: textSub }}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete} disabled={deleteLoading}
              className="flex-1 h-10 rounded-[10px] text-[13px] font-semibold text-white disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#dc2626 0%,#ef4444 100%)" }}
            >
              {deleteLoading ? "Deleting…" : "Delete"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-[13px] text-[13px] font-semibold text-white z-50"
          style={{ background: toast.ok ? "#10b981" : "#ef4444", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}
        >
          {toast.ok ? <Check size={14} /> : <X size={14} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function Modal({ isDark, onClose, title, children }: {
  isDark: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  const cardBg = isDark ? "#131c2d" : "#fff";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const textPrimary = isDark ? "#f1f5f9" : "#0f172a";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div
        className="w-full max-w-md rounded-[20px] p-6"
        style={{ background: cardBg, border: `1px solid ${cardBorder}`, boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[16px] font-black" style={{ color: textPrimary, letterSpacing: "-0.03em" }}>{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ color: "#64748b" }}>
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalField({ label, isDark, children }: { label: string; isDark: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: isDark ? "#64748b" : "#94a3b8" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
