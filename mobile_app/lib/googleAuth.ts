// mobile_app\lib\googleAuth.ts

import { google } from "googleapis";
import axios from "axios";

export async function getAuthClient(authHeader?: string) {
  console.log("===== GOOGLE AUTH (DB MODE) =====");
  console.log("AuthHeader: ", authHeader);

  if (!authHeader) {
    console.log("❌ No Authorization header");
    return null;
  }

  try {
    // ✅ STEP 1: Get user from backend
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/users/profile/view`,
      {
        headers: { Authorization: authHeader },
      },
    );

    const user = res.data.user;

    if (!user?.googleRefreshToken) {
      console.log("❌ No Google refresh token in DB");
      return null;
    }

    console.log("✅ User found:", user.email);

    // ✅ STEP 2: Create OAuth client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    oauth2Client.setCredentials({
      refresh_token: user.googleRefreshToken,
    });

    // ✅ STEP 3: Force fresh access token
    const { token } = await oauth2Client.getAccessToken();

    console.log("✅ Access token generated");

    return oauth2Client;
  } catch (error: any) {
    console.error(
      "❌ Google Auth Error:",
      error?.response?.data || error.message,
    );
    return null;
  }
}
