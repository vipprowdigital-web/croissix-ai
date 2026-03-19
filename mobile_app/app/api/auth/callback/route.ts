// mobile_app\app\api\auth\callback\route.ts
import { google } from "googleapis";
import axios from "axios";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const cookieStore = await cookies();

  // ✅ FIRST try to get token from cookie (PRODUCTION SAFE)
  let token = cookieStore.get("auth_token")?.value;

  // ✅ fallback to state (for backward compatibility)
  if (!token && state) {
    token = state;
  }

  if (!code) {
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_FRONTEND_URL}/login?error=missing_code`,
    );
  }

  if (!token) {
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_FRONTEND_URL}/login?error=no_token`,
    );
  }

  const redirectUri = process.env.GOOGLE_REDIRECT_URI!;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri,
  );

  try {
    // ✅ STEP 1: exchange code
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    console.log("TOKENS:", tokens);

    // ✅ STEP 2: get profile
    const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
    const { data: googleProfile } = await oauth2.userinfo.get();

    console.log("PROFILE:", googleProfile);

    // ✅ STEP 3: send to backend (SAFE PAYLOAD)
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/link-google`,
        {
          googleId: googleProfile.id,
          googleAccessToken: tokens.access_token,
          googleRefreshToken: tokens.refresh_token || null, // ✅ FIX
          googleTokenExpiry: tokens.expiry_date || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log("BACKEND SUCCESS:", res.data);
    } catch (err: any) {
      console.error(
        "BACKEND ERROR:",
        err?.response?.data || err.message,
      );

      return Response.redirect(
        `${process.env.NEXT_PUBLIC_FRONTEND_URL}/login?error=backend_failed`,
      );
    }

    // ✅ STEP 4: store google tokens
    cookieStore.set(
      "google_tokens",
      JSON.stringify({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        expiry_date: tokens.expiry_date || null,
      }),
      {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
      },
    );

    return Response.redirect(process.env.NEXT_PUBLIC_FRONTEND_URL!);
  } catch (error: any) {
    console.error(
      "GOOGLE ERROR:",
      error?.response?.data || error.message,
    );

    return Response.redirect(
      `${process.env.NEXT_PUBLIC_FRONTEND_URL}/login?error=oauth_failed`,
    );
  }
}