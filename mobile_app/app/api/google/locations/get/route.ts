// mobile_app/app/api/google/locations/get/route.ts

// mobile_app/app/api/google/locations/get/route.ts

import { google } from "googleapis";
import axios from "axios";
import { NextResponse } from "next/server";

const READ_MASK = [
  "name",
  "title",
  "storeCode",
  "languageCode",
  "profile",
  "phoneNumbers",
  "websiteUri",
  "categories",
  "storefrontAddress",
  "latlng",
  "openInfo",
  "regularHours",
  "specialHours",
  "moreHours",
  "serviceArea",
  "serviceItems",
  "adWordsLocationExtensions",
  "labels",
  "relationshipData",
].join(",");

export async function GET(req: Request) {
  try {
    console.log("Inside next js api call.....");

    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");

    if (!locationId) {
      return NextResponse.json(
        { error: "locationId is required" },
        { status: 400 },
      );
    }

    const token = req.headers.get("authorization");
    console.log("Token in next js: ", token);

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* ── USER PROFILE ── */
    const { data: profileData } = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/users/profile/view`,
      { headers: { Authorization: token } },
    );
    console.log("Profile Data from next js: ", profileData);
    const user = profileData.user;
    console.log("User from next js: ", user);
    console.log("User from next js: ", user?.googleAccessToken);

    if (!user?.googleAccessToken) {
      return NextResponse.json(
        { error: "Google not connected" },
        { status: 401 },
      );
    }

    /* ── OAUTH CLIENT ── */
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
      expiry_date: user.googleTokenExpiry ?? undefined,
    });

    // Auto-refresh
    const expiry = user.googleTokenExpiry ? Number(user.googleTokenExpiry) : 0;
    if (!expiry || expiry - Date.now() < 60_000) {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
    }

    const service = google.mybusinessbusinessinformation({
      version: "v1",
      auth: oauth2Client,
    });

    /* ── FETCH ── */
    const res = await service.locations.get({
      name: `locations/${locationId}`,
      readMask: READ_MASK,
    });

    console.log("LOCATION DATA:", res.data);
    return NextResponse.json({ success: true, data: res.data });
  } catch (error: any) {
    const status = error.response?.status ?? 500;
    const message =
      error.response?.data?.error?.message ??
      error.message ??
      "Google API error";

    console.error(`GBP GET ERROR [${status}]:`, message);
    return NextResponse.json({ error: message }, { status });
  }
}
