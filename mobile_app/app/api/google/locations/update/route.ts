// mobile_app\app\api\google\locations\update\route.ts
// mobile_app/app/api/google/locations/update/route.ts

import { google } from "googleapis";
import axios from "axios";
import { NextResponse } from "next/server";

/* ── helpers ── */
function toTimeObj(t: string | { hours?: number; minutes?: number }) {
  if (typeof t === "object") return t; // already an object
  const [h, m] = t.split(":").map(Number);
  return { hours: h ?? 0, minutes: m ?? 0 };
}

function sanitizePeriods(periods: any[]) {
  return (periods ?? []).map((p: any) => ({
    openDay: p.openDay,
    closeDay: p.closeDay ?? p.openDay,
    openTime: toTimeObj(p.openTime),
    closeTime: toTimeObj(p.closeTime),
  }));
}

export async function PATCH(req: Request) {
  console.log("===== GOOGLE LOCATION UPDATE START =====");

  try {
    const body = await req.json();
    const { locationId, payload, fields } = body as {
      locationId: string;
      payload: Record<string, unknown>;
      fields: string[];
    };
    console.log(
      "locationId: ",
      locationId,
      " payload: ",
      payload,
      " fields: ",
      fields,
    );

    if (
      !locationId ||
      !payload ||
      !Array.isArray(fields) ||
      fields.length === 0
    ) {
      console.log("Inside !locationId");

      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* ── USER PROFILE ── */
    const { data: profileData } = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/users/profile/view`,
      { headers: { Authorization: authHeader } },
    );
    const user = profileData.user;

    if (!user?.googleAccessToken) {
      return NextResponse.json(
        { error: "Google not connected" },
        { status: 401 },
      );
    }

    /* ── OAUTH CLIENT + AUTO-REFRESH ── */
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
      expiry_date: user.googleTokenExpiry ?? undefined,
    });

    const expiry = user.googleTokenExpiry ? Number(user.googleTokenExpiry) : 0;
    const needsRefresh = !expiry || expiry - Date.now() < 60_000;
    if (needsRefresh) {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
      if (credentials.access_token) {
        await axios
          .patch(
            `${process.env.NEXT_PUBLIC_API_URL}/users/profile/update-tokens`,
            {
              googleAccessToken: credentials.access_token,
              googleTokenExpiry: credentials.expiry_date,
            },
            { headers: { Authorization: authHeader } },
          )
          .catch((e) => console.warn("Token persist failed:", e.message));
      }
    }

    /* ══════════════════════════════════════════
       SANITIZE PAYLOAD
    ══════════════════════════════════════════ */

    /* 1 ── categories: keep only { name } */
    if (payload.categories && typeof payload.categories === "object") {
      const cats = payload.categories as any;
      payload.categories = {
        primaryCategory: { name: cats.primaryCategory?.name },
        additionalCategories: (cats.additionalCategories ?? []).map(
          (c: any) => ({ name: c.name }),
        ),
      };
    }

    /* 2 ── regularHours: convert "HH:MM" strings → { hours, minutes } */
    if (payload.regularHours && typeof payload.regularHours === "object") {
      const rh = payload.regularHours as any;
      payload.regularHours = {
        periods: sanitizePeriods(rh.periods ?? []),
      };
    }

    /* 3 ── moreHours: same time conversion for each type */
    if (Array.isArray(payload.moreHours)) {
      payload.moreHours = (payload.moreHours as any[]).map((mh: any) => ({
        hoursTypeId: mh.hoursTypeId,
        periods: sanitizePeriods(mh.periods ?? []),
      }));
    }

    /* 4 ── specialHours: convert time strings + keep date objects */
    if (payload.specialHours && typeof payload.specialHours === "object") {
      const sh = payload.specialHours as any;
      payload.specialHours = {
        specialHourPeriods: (sh.specialHourPeriods ?? []).map((sp: any) => {
          const base: any = {
            startDate: sp.startDate,
            endDate: sp.endDate ?? sp.startDate,
            closed: !!sp.closed,
          };
          if (!sp.closed) {
            base.openTime = toTimeObj(sp.openTime ?? "09:00");
            base.closeTime = toTimeObj(sp.closeTime ?? "18:00");
          }
          return base;
        }),
      };
    }

    /* 5 ── openInfo: remove openingDate if empty */
    if (payload.openInfo && typeof payload.openInfo === "object") {
      const oi = payload.openInfo as any;
      if (!oi.openingDate || !oi.openingDate.year) {
        delete oi.openingDate;
      }
    }

    /* 6 ── profile.description: remove if empty string */
    if (payload.profile && typeof payload.profile === "object") {
      const pr = payload.profile as any;
      if (pr.description === "") delete pr.description;
    }

    /* ── BUILD updateMask (skip openInfo.openingDate if removed) ── */
    const updateMask = fields
      .filter((f) => {
        if (f === "openInfo.openingDate") {
          const oi = payload.openInfo as any;
          return !!oi?.openingDate;
        }
        return true;
      })
      .join(",");

    if (!updateMask) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    console.log("updateMask:", updateMask);
    console.log("payload:", JSON.stringify(payload, null, 2));

    /* ── PATCH ── */
    const service = google.mybusinessbusinessinformation({
      version: "v1",
      auth: oauth2Client,
    });

    const res = await service.locations.patch({
      name: `locations/${locationId}`,
      updateMask,
      requestBody: payload as any,
    });

    console.log("✅ Update success:", res.data);
    return NextResponse.json({ success: true, data: res.data });
  } catch (error: any) {
    const status = error.response?.status ?? 500;
    const message =
      error.response?.data?.error?.message ??
      error.message ??
      "Google API error";

    console.error(`❌ GOOGLE UPDATE ERROR [${status}]:`, message);
    return NextResponse.json({ error: message }, { status });
  }
}
