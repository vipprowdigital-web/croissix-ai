// mobile_app\components\LocationSwitcher.tsx

"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { Building2 } from "lucide-react";
import { RootState } from "@/redux/store";
import { setUser } from "@/redux/slices/userSlice";
import { useUser } from "@/features/user/hook/useUser";

/**
 * Lets free-access accounts switch between their linked Google Business
 * locations. Renders nothing for everyone else. Every page keys its data on
 * user.googleLocationId, so switching refreshes them automatically.
 */
export default function LocationSwitcher() {
  const dispatch = useDispatch();
  const qc = useQueryClient();
  const { data: queryUser } = useUser();
  const reduxUser = useSelector((s: RootState) => s.user.data);
  const user = reduxUser ?? queryUser;
  const [busy, setBusy] = useState(false);

  const locations = user?.googleLocations ?? [];
  if (!user?.freeAccess || locations.length < 2) return null;

  const onChange = async (locationId: string) => {
    if (locationId === user.googleLocationId) return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    setBusy(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/google-location/active`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ locationId }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Could not switch location");

      dispatch(setUser({ ...user, ...json.user }));
      qc.setQueryData(["user-profile"], (old: any) => ({
        ...old,
        ...json.user,
      }));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not switch location");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2 pt-2 pb-1">
      <Building2 size={14} className="text-slate-400 shrink-0" />
      <select
        value={user.googleLocationId ?? ""}
        disabled={busy}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Active business profile"
        className="flex-1 md:flex-none md:min-w-[260px] h-9 px-3 rounded-xl text-[13px] font-semibold border border-slate-200 dark:border-white/10 bg-white dark:bg-[#131c2d] text-slate-800 dark:text-slate-200 outline-none disabled:opacity-60"
      >
        {locations.map((l) => (
          <option key={l.locationId} value={l.locationId}>
            {l.locationName || l.locationId}
          </option>
        ))}
      </select>
    </div>
  );
}
