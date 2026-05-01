// mobile_app\app\api\google\reviews\route.ts

import { google } from "googleapis";
import axios from "axios";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const locationName = searchParams.get("location");
    const page = Number(searchParams.get("page") || 1);
    const limit = 50;

    const token = req.headers.get("authorization");

    if (!token) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!locationName) {
      return Response.json(
        { success: false, error: "Location is required" },
        { status: 400 },
      );
    }

    /* ---------------- USER PROFILE ---------------- */

    const profile = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/users/profile/view`,
      { headers: { Authorization: token } },
    );

    const user = profile.data.user;

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

    /* ---------------- GET ACCOUNT ---------------- */

    const accountService = google.mybusinessaccountmanagement({
      version: "v1",
      auth: oauth2Client,
    });

    const accountsRes = await accountService.accounts.list({});

    const accountId = accountsRes.data.accounts?.[0]?.name;

    if (!accountId) {
      return Response.json(
        { success: false, error: "No Google Business account found" },
        { status: 404 },
      );
    }

    const locationId = locationName.split("/").pop();

    /* ---------------- FETCH ALL REVIEWS ---------------- */
    const pageToken = searchParams.get("pageToken"); // ✅ get from frontend

    const url = new URL(
      `https://mybusiness.googleapis.com/v4/${accountId}/locations/${locationId}/reviews`,
    );

    url.searchParams.append("pageSize", "50");

    // ✅ THIS IS THE KEY FIX
    if (pageToken) {
      url.searchParams.append("pageToken", pageToken);
    }

    const res = await fetch(url.toString(), {
      headers: await oauth2Client.getRequestHeaders(),
    });

    const data = await res.json();

    // console.log("FETCHED REVIEWS:", data.reviews?.length);

    return Response.json({
      success: true,
      reviews: data.reviews || [],
      nextPageToken: data.nextPageToken || null, // ✅ IMPORTANT
      totalReviewCount: data.totalReviewCount || 0,
      averageRating: data.averageRating || 0,
    });
  } catch (error: any) {
    console.error("GOOGLE REVIEWS ERROR:", error);

    return Response.json(
      {
        success: false,
        error: error.message || "Failed to fetch reviews",
      },
      { status: 500 },
    );
  }
}
