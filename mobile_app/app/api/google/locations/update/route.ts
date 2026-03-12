// mobile_app\app\api\google\locations\update\route.ts

import { google } from "googleapis";
import axios from "axios";

export async function PATCH(req: Request) {
  console.log("===== GOOGLE LOCATION UPDATE START =====");

  try {
    const body = await req.json();
    const { locationId, payload, fields } = body;

    console.log("Request Body:", body);

    const authHeader = req.headers.get("authorization");

    console.log("Authorization header:", authHeader);

    if (!authHeader) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* --------------------------------------------
       LOAD USER PROFILE (GET GOOGLE TOKENS)
    --------------------------------------------- */

    const profile = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/users/profile/view`,
      {
        headers: {
          Authorization: authHeader,
        },
      },
    );

    const user = profile.data.user;

    console.log("User profile loaded:", user?.email);

    if (!user.googleAccessToken) {
      return Response.json({ error: "Google not connected" }, { status: 401 });
    }

    /* --------------------------------------------
       GOOGLE AUTH CLIENT
    --------------------------------------------- */

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    console.log("OAuth client ready");

    const service = google.mybusinessbusinessinformation({
      version: "v1",
      auth: oauth2Client,
    });

    /* --------------------------------------------
       FIX CATEGORY STRUCTURE
    --------------------------------------------- */

    if (payload.categories) {
      payload.categories = {
        primaryCategory: {
          name: payload.categories.primaryCategory?.name,
        },
        additionalCategories:
          payload.categories.additionalCategories?.map((c: any) => ({
            name: c.name,
          })) || [],
      };
    }

    /* --------------------------------------------
       FILTER INVALID FIELDS
    --------------------------------------------- */

    const filteredFields = fields.filter((f: string) => {
      if (f === "openInfo.openingDate" && !payload?.openInfo?.openingDate) {
        return false;
      }

      return true;
    });

    /* --------------------------------------------
       BUILD updateMask
    --------------------------------------------- */

  const updateMask = filteredFields.join(",");

    console.log("Update Mask:", updateMask);
    console.log("Final Payload:", payload);

    /* --------------------------------------------
       GOOGLE PATCH REQUEST
    --------------------------------------------- */

    const res = await service.locations.patch({
      name: `locations/${locationId}`,
      updateMask,
      requestBody: payload,
    });

    console.log("✅ Google update success:", res.data);

    return Response.json(res.data);
  } catch (error: any) {
    console.error("❌ GOOGLE UPDATE ERROR");

    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Google error:", error.response.data);
    }

    return Response.json(
      {
        error:
          error.response?.data?.error?.message ||
          error.message ||
          "Google API error",
      },
      { status: 500 },
    );
  }
}
