// mobile_app/app/api/auth/google/route.ts

import { google } from "googleapis";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  // For the mobile app
  const platform = searchParams.get("platform");

  console.log("Redirect URI:", process.env.GOOGLE_REDIRECT_URI);
  console.log("Platform:", platform);

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/business.manage",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "openid",
    ],
    // state: token || "", // ✅ pass JWT directly
    state: JSON.stringify({
      token,
      platform: platform || "web",
    }),
  });

  console.log("Url from google route.js: ", url);

  return Response.redirect(url);
}
