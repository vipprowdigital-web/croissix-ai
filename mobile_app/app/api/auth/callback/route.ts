// mobile_app\app\api\auth\callback\route.ts

import { google } from "googleapis";
import axios from "axios";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const token = state ? decodeURIComponent(state) : "";

  if (!code) {
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_FRONTEND_URL}/login?error=missing_code`,
    );
  }

  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:3000/api/auth/callback";

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri,
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
    const { data: googleProfile } = await oauth2.userinfo.get();

    // Save tokens in your backend
    await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/link-google`,
      {
        googleId: googleProfile.id,
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token,
        googleTokenExpiry: tokens.expiry_date,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    /* ⭐ IMPORTANT: set cookie for Next.js APIs */

    const cookieStore = await cookies();

    cookieStore.set(
      "google_tokens",
      JSON.stringify({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      },
    );

    const frontendUrl =
      process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

    return Response.redirect(frontendUrl);
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return new Response("OAuth callback failed", { status: 500 });
  }
}
