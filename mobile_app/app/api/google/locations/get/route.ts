// mobile_app/app/api/google/locations/get/route.ts

import { google } from "googleapis";
import axios from "axios";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");

    const token = req.headers.get("authorization");

    if (!token) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* ---------------- USER PROFILE ---------------- */

    const profile = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/users/profile/view`,
      {
        headers: { Authorization: token },
      }
    );

    const user = profile.data.user;

    if (!user.googleAccessToken) {
      return Response.json(
        { error: "Google not connected" },
        { status: 401 }
      );
    }

    /* ---------------- GOOGLE AUTH ---------------- */

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    /* auto refresh */
    await oauth2Client.getAccessToken();

    const service = google.mybusinessbusinessinformation({
      version: "v1",
      auth: oauth2Client,
    });

    /* ---------------- GET LOCATION ---------------- */

    const res = await service.locations.get({
      name: `locations/${locationId}`,
      readMask:
        "name,title,storeCode,profile,phoneNumbers,websiteUri,storefrontAddress,openInfo",
    });

    console.log("LOCATION DATA:", res.data);

    return Response.json(res.data);

  } catch (error: any) {

    console.error("GBP GET ERROR:", error.response?.data || error);

    return Response.json(
      {
        error:
          error.response?.data?.error?.message ||
          error.message ||
          "Google API error",
      },
      { status: 500 }
    );
  }
}