// mobile_app\app\api\google\locations\update\route.ts


// mobile_app/app/api/google/locations/update/route.ts

import { google }  from "googleapis";
import axios       from "axios";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  console.log("===== GOOGLE LOCATION UPDATE START =====");

  try {
    const body = await req.json();
    const { locationId, payload, fields } = body as {
      locationId: string;
      payload:    Record<string, unknown>;
      fields:     string[];
    };

    if (!locationId || !payload || !Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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
      return NextResponse.json({ error: "Google not connected" }, { status: 401 });
    }

    /* ── OAUTH CLIENT + AUTO-REFRESH ── */
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
    oauth2Client.setCredentials({
      access_token:  user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
      expiry_date:   user.googleTokenExpiry ?? undefined,
    });

    // Force refresh if token is expired or within 60s of expiry
    const expiry    = user.googleTokenExpiry ? Number(user.googleTokenExpiry) : 0;
    const needsRefresh = !expiry || expiry - Date.now() < 60_000;
    if (needsRefresh) {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);

      // Persist refreshed token back to your backend
      if (credentials.access_token) {
        await axios.patch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/profile/update-tokens`,
          {
            googleAccessToken:  credentials.access_token,
            googleTokenExpiry:  credentials.expiry_date,
          },
          { headers: { Authorization: authHeader } },
        ).catch(e => console.warn("Token persist failed:", e.message));
      }
    }

    const service = google.mybusinessbusinessinformation({
      version: "v1",
      auth:    oauth2Client,
    });

    /* ── SANITIZE CATEGORIES ── */
    if (payload.categories && typeof payload.categories === "object") {
      const cats = payload.categories as any;
      payload.categories = {
        primaryCategory: { name: cats.primaryCategory?.name },
        additionalCategories: (cats.additionalCategories ?? []).map(
          (c: any) => ({ name: c.name }),
        ),
      };
    }

    /* ── FILTER FIELDS ── */
    const updateMask = fields
      .filter(f => {
        if (f === "openInfo.openingDate") {
          const oi = payload.openInfo as any;
          return !!oi?.openingDate;
        }
        return true;
      })
      .join(",");

    if (!updateMask) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    console.log("updateMask:", updateMask);
    console.log("payload:",    JSON.stringify(payload, null, 2));

    /* ── PATCH ── */
    const res = await service.locations.patch({
      name:        `locations/${locationId}`,
      updateMask,
      requestBody: payload as any,
    });

    console.log("✅ Update success:", res.data);
    return NextResponse.json({ success: true, data: res.data });

  } catch (error: any) {
    const status  = error.response?.status ?? 500;
    const message =
      error.response?.data?.error?.message ??
      error.message ??
      "Google API error";

    console.error(`❌ GOOGLE UPDATE ERROR [${status}]:`, message);
    return NextResponse.json({ error: message }, { status });
  }
}