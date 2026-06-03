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

// FIX 1: Restore the "categories/" prefix that was stripped on load.
// Our frontend strips "categories/" when reading (stripCatPrefix), but Google's
// PATCH endpoint requires the full resource name like "categories/gcid:foo".
function restoreCatName(name: string): string {
  if (!name) return name;
  // If it already has the prefix, leave it alone
  if (name.startsWith("categories/")) return name;
  // Otherwise restore it
  return `categories/${name}`;
}

export async function PATCH(req: Request) {
  console.log("===== GOOGLE LOCATION UPDATE START =====");

  try {
    const body = await req.json();
    console.log("Received update request with body:", body);
    const { locationId, payload, fields } = body as {
      locationId: string;
      payload: Record<string, unknown>;
      fields: string[];
    };
    // console.log(
    //   "locationId: ",
    //   locationId,
    //   " payload: ",
    //   payload,
    //   " fields: ",
    //   fields,
    // );

    if (
      !locationId ||
      !payload ||
      !Array.isArray(fields) ||
      fields.length === 0
    ) {
      // console.log("Inside !locationId");

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

    /* 1 ── categories
       FIX: Filter out additionalCategories with empty names.
       When a user types a new category displayName, there's no gcid yet.
       Google's API requires a valid resource name — empty string causes 400.
       Only send categories that have a real gcid name. */
    if (payload.categories && typeof payload.categories === "object") {
      const cats = payload.categories as any;
      payload.categories = {
        primaryCategory: {
          name: restoreCatName(cats.primaryCategory?.name ?? ""),
        },
        additionalCategories: (cats.additionalCategories ?? [])
          // Drop any category that has no valid gcid name
          .filter((c: any) => c.name && c.name.trim() !== "")
          .map((c: any) => ({ name: restoreCatName(c.name ?? "") })),
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

    /* 4 ── specialHours */
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

    /* 4b ── serviceArea: remove read-only 'name' field from placeInfos */
    if (payload.serviceArea && typeof payload.serviceArea === "object") {
      const sa = payload.serviceArea as any;
      if (Array.isArray(sa.places?.placeInfos)) {
        sa.places.placeInfos = sa.places.placeInfos
          .filter((p: any) => p.placeId && p.placeId.trim() !== "")
          .map((p: any) => ({ placeId: p.placeId }));
      }
    }

    /* 4c ── serviceItems: only freeForm, drop structured */
    if (Array.isArray(payload.serviceItems)) {
      payload.serviceItems = (payload.serviceItems as any[])
        .filter((item: any) => !!item.freeFormServiceItem)
        .map((item: any) => {
          const ffi = item.freeFormServiceItem;
          const sanitized: any = {
            label: { displayName: ffi.label?.displayName ?? "" },
          };
          if (ffi.category && ffi.category.trim() !== "") {
            sanitized.category = ffi.category;
          }
          return { freeFormServiceItem: sanitized };
        });
    }

    /* 5 ── openInfo
       FIX: When openingDate is absent/cleared, remove it from payload entirely
       AND remove "openInfo.openingDate" from fields. Google will then only
       receive the status update without touching the openingDate field.
       To CLEAR an existing opening date, we need to send openInfo without
       openingDate — Google treats absence of the field as "clear it". */
    if (payload.openInfo && typeof payload.openInfo === "object") {
      const oi = payload.openInfo as any;
      if (!oi.openingDate?.year || oi.openingDate.year === 0) {
        delete oi.openingDate;
        // Also signal to updateMask builder below: exclude openInfo.openingDate
        // but INCLUDE openInfo.status so the status still gets saved.
      }
    }

    /* 6 ── profile.description */
    if (payload.profile && typeof payload.profile === "object") {
      const pr = payload.profile as any;
      if (pr.description === "") delete pr.description;
    }

    /* 6b ── adWordsLocationExtensions */
    // if (
    //   payload.adWordsLocationExtensions &&
    //   typeof payload.adWordsLocationExtensions === "object"
    // ) {
    //   const ext = payload.adWordsLocationExtensions as any;
    //   if (!ext.adPhone || ext.adPhone.trim() === "") {
    //     // Remove from payload — don't touch this field at all when empty
    //     delete payload.adWordsLocationExtensions;
    //     // The mask filter below will also skip it
    //   }
    // }

    // Google rejects relationshipData:{} — omit when nothing to set
    if (
      payload.relationshipData &&
      typeof payload.relationshipData === "object" &&
      Object.keys(payload.relationshipData as object).length === 0
    ) {
      delete payload.relationshipData;
    }

    if (payload.specialHours && typeof payload.specialHours === "object") {
      const sh = payload.specialHours as any;
      if (
        Array.isArray(sh.specialHourPeriods) &&
        sh.specialHourPeriods.length === 0 &&
        fields.filter((f) => f !== "specialHours").length > 0
      ) {
        delete payload.specialHours;
        // Will be filtered out of mask below
      }
    }

    // Same for moreHours empty array with other fields
    if (
      Array.isArray(payload.moreHours) &&
      (payload.moreHours as any[]).length === 0 &&
      fields.filter((f) => f !== "moreHours").length > 0
    ) {
      delete payload.moreHours;
    }

    // For categories
    const normalizedFields = fields.map((f) => {
      if (
        f === "categories.primaryCategory" ||
        f === "categories.additionalCategories"
      ) {
        return "categories";
      }
      return f;
    });

    /* ── BUILD updateMask ── */
    const READONLY_FIELDS = new Set(["languageCode"]);
    const updateMask = normalizedFields
      .filter((f) => {
        if (READONLY_FIELDS.has(f)) return false;

        // Skip any field we deleted from payload above
        if (f === "relationshipData" && !payload.relationshipData) return false;
        if (f === "specialHours" && !payload.specialHours) return false;
        if (f === "moreHours" && !payload.hasOwnProperty("moreHours"))
          return false;

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

    // const res = await service.locations.patch({
    //   name: `locations/${locationId}`,
    //   updateMask,
    //   requestBody: payload as any,
    // });

    // console.log("✅ Update success:", res.data);
    // return NextResponse.json({ success: true, data: res.data });
    try {
      const res = await service.locations.patch({
        name: `locations/${locationId}`,
        updateMask,
        requestBody: payload as any,
      });

      console.log("✅ Update success:", res.data);

      return NextResponse.json({
        success: true,
        data: res.data,
      });
    } catch (patchError: any) {
      const details = patchError.response?.data?.error?.details ?? [];

      const phoneThrottled = details.some(
        (d: any) =>
          d.reason === "THROTTLED" &&
          (d.metadata?.field_mask === "phone_numbers.primary_phone" ||
            d.metadata?.field_mask === "phone_numbers.additional_phones"),
      );

      if (phoneThrottled && (payload as any).phoneNumbers) {
        console.log(
          "📞 Phone numbers throttled by Google. Retrying without phoneNumbers...",
        );

        const retryPayload = { ...(payload as any) };

        console.log("retrypayload: ", retryPayload);

        delete retryPayload.phoneNumbers;

        const retryMask = updateMask
          .split(",")
          .filter((f) => f !== "phoneNumbers")
          .join(",");

        if (!retryMask) {
          return NextResponse.json(
            {
              success: false,
              phoneSkipped: true,
              throttledFields: details
                .filter((d: any) => d.reason === "THROTTLED")
                .map((d: any) => d.metadata?.field_mask),
              error: "Google is temporarily restricting phone number updates.",
            },
            {
              status: 200,
            },
          );
        } else {
          console.log("Retry updateMask:", retryMask);

          console.log("Retry payload:", JSON.stringify(retryPayload, null, 2));

          const retryRes = await service.locations.patch({
            name: `locations/${locationId}`,
            updateMask: retryMask,
            requestBody: retryPayload,
          });

          return NextResponse.json({
            success: true,
            phoneSkipped: true,
            warning: "Google temporarily restricted phone number updates.",
            throttledFields: details
              .filter((d: any) => d.reason === "THROTTLED")
              .map((d: any) => d.metadata?.field_mask),
            data: retryRes.data,
          });
        }
      }

      throw patchError;
    }
  } catch (error: any) {
    const status = error.response?.status ?? 500;
    const message =
      error.response?.data?.error?.message ??
      error.message ??
      "Google API error";
    const details = error.response?.data?.error?.details ?? [];
    const throttledFields = details
      .filter((d: any) => d.reason === "THROTTLED")
      .map((d: any) => d.metadata?.field_mask);
    console.error("Error while updating location: ", error);
    console.error(
      "GOOGLE ERROR BODY:",
      JSON.stringify(error.response?.data, null, 2),
    );
    console.error(
      "GOOGLE ERROR DETAILS:",
      JSON.stringify(error.response?.data?.error, null, 2),
    );
    console.error(`❌ GOOGLE UPDATE ERROR [${status}]:`, message);
    // return NextResponse.json({ error: message }, { status });
    return NextResponse.json(
      {
        error: message,
        throttledFields,
      },
      {
        status,
      },
    );
  }
}
