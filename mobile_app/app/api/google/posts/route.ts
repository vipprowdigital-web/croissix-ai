// app/api/google/posts/route.ts

import { google } from "googleapis";
import axios from "axios";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const location = searchParams.get("location");
    const pageToken = searchParams.get("pageToken") || undefined;

    const token = req.headers.get("authorization");

    if (!token) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!location) {
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

    /* ---------------- ACCOUNT ---------------- */

    const accountService = google.mybusinessaccountmanagement({
      version: "v1",
      auth: oauth2Client,
    });

    const accountsRes = await accountService.accounts.list();

    const accountId = accountsRes.data.accounts?.[0]?.name;

    if (!accountId) {
      return Response.json(
        { success: false, error: "No Google Business account found" },
        { status: 404 },
      );
    }

    /* ---------------- LOCATION ---------------- */

    const locationId = location.split("/").pop();

    if (!locationId) {
      return Response.json(
        { success: false, error: "Invalid location" },
        { status: 400 },
      );
    }

    /* ---------------- GOOGLE API ---------------- */

    const url = new URL(
      `https://mybusiness.googleapis.com/v4/${accountId}/locations/${locationId}/localPosts`,
    );

    url.searchParams.append("pageSize", "10");

    if (pageToken) {
      url.searchParams.append("pageToken", pageToken);
    }

    const res = await fetch(url.toString(), {
      headers: await oauth2Client.getRequestHeaders(),
    });

    const data = await res.json();

    if (!res.ok) {
      return Response.json(
        {
          success: false,
          error: data?.error?.message || "Google API error",
        },
        { status: 500 },
      );
    }

    /* ---------------- FIX MEDIA ---------------- */

    let posts = (data.localPosts || []).map((post: any) => {
      if (post.media && post.media.length > 0) {
        post.media = post.media.map((m: any) => ({
          ...m,
          sourceUrl: m.googleUrl || null,
        }));
      }

      return post;
    });

    return Response.json({
      success: true,
      posts,
      nextPageToken: data.nextPageToken || null,
      total: posts.length,
    });
  } catch (error: any) {
    console.error("GOOGLE POSTS FETCH ERROR:", error);

    return Response.json(
      {
        success: false,
        error: error.message || "Failed to fetch posts",
      },
      { status: 500 },
    );
  }
}
