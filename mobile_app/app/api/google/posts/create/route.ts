// mobile_app\app\api\google\posts\create\route.ts

import { google } from "googleapis";
import axios from "axios";

export async function POST(req: Request) {
  console.log("----- GOOGLE POST API START -----");

  try {
    const body = await req.json();
    let { payload } = body;

    console.log("Incoming payload:", payload);

    const token = req.headers.get("authorization");

    console.log("Authorization header:", token);

    if (!token) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    /* ---------------- USER PROFILE ---------------- */

    console.log("Fetching user profile...");

    const profile = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/users/profile/view`,
      {
        headers: { Authorization: token },
      },
    );

    const user = profile.data.user;

    console.log("User:", user);

    if (!user.googleAccessToken) {
      return Response.json(
        { success: false, error: "Google not connected" },
        { status: 401 },
      );
    }

    /* ---------------- GOOGLE AUTH ---------------- */

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    console.log("OAuth client ready");

    /* ---------------- GET ACCOUNT ---------------- */

    const accountService = google.mybusinessaccountmanagement({
      version: "v1",
      auth: oauth2Client,
    });

    const accountsRes = await accountService.accounts.list();

    const accountId = accountsRes.data.accounts?.[0]?.name;

    console.log("Account ID:", accountId);

    if (!accountId) {
      return Response.json(
        { success: false, error: "No Google Business account found" },
        { status: 404 },
      );
    }

    /* ---------------- LOCATION ---------------- */

    const locationId = user.googleLocationId;

    if (!locationId) {
      return Response.json(
        { success: false, error: "No Google location connected" },
        { status: 400 },
      );
    }

    console.log("Location ID:", locationId);

    /* ---------------- FIX BASE64 IMAGES ---------------- */

    if (payload?.media) {
      payload.media = payload.media.filter(
        (m: any) => !m.sourceUrl.startsWith("data:"),
      );

      console.log("Filtered media:", payload.media);
    }

    /* ---------------- FIX EVENT POST ---------------- */

    if (payload.topicType === "EVENT" && payload.event) {
      const now = new Date();

      payload.event.schedule = {
        startDate: {
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          day: now.getDate(),
        },
        startTime: {
          hours: now.getHours(),
          minutes: now.getMinutes(),
        },
        endDate: {
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          day: now.getDate() + 1,
        },
        endTime: {
          hours: now.getHours(),
          minutes: now.getMinutes(),
        },
      };
    }
    /* ---------------- ADD REQUIRED FIELD ---------------- */

    payload.topicType = payload.topicType || "STANDARD";

    /* ---------------- GOOGLE POST API ---------------- */

    const url = `https://mybusiness.googleapis.com/v4/${accountId}/locations/${locationId}/localPosts`;

    console.log("Google Post API URL:", url);

    /* get oauth headers */
    const authHeaders = await oauth2Client.getRequestHeaders();

    console.log("Google Auth Header:", authHeaders);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeaders.get("Authorization") as string,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    console.log("Google response:", data);

    if (!res.ok) {
      return Response.json(
        {
          success: false,
          error: data?.error?.message || "Google API error",
        },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,
      post: data,
    });
  } catch (error: any) {
    console.error("GOOGLE POST ERROR:", error);

    return Response.json(
      {
        success: false,
        error: error.message || "Post failed",
      },
      { status: 500 },
    );
  }
}
