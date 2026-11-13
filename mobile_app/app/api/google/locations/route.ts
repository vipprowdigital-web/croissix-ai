// mobile_app\app\api\google\locations\route.ts

import { google, mybusinessbusinessinformation_v1 } from "googleapis";
import axios from "axios";

export async function GET(req: Request) {
  try {
    return await handleGet(req);
  } catch (error: any) {
    // Always answer with JSON so the client never has to parse an empty 500
    const status = Number(error?.response?.status || error?.code) || 500;
    const googleMsg =
      error?.response?.data?.error?.message ||
      error?.errors?.[0]?.message ||
      error?.message ||
      "Failed to load Google Business locations";
    console.error("GOOGLE LOCATIONS ERROR:", status, googleMsg);
    const missingScope = /insufficient authentication scopes/i.test(googleMsg);
    return Response.json(
      {
        error: missingScope
          ? "Business Profile permission was not granted. Tap \"Reconnect Google\" and tick the \"Manage your Business Profile\" checkbox on the Google consent screen."
          : googleMsg,
        code: missingScope ? "MISSING_SCOPE" : undefined,
        locations: [],
      },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}

async function handleGet(req: Request) {
  const token = req.headers.get("authorization");

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await axios.get(
    `${process.env.NEXT_PUBLIC_API_URL}/users/profile/view`,
    {
      headers: { Authorization: token },
    },
  );

  const user = profile.data.user; // ✅ FIX HERE

  if (!user.googleAccessToken) {
    return Response.json({ error: "Google not connected" }, { status: 401 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );

  oauth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
  });

  const accountService = google.mybusinessaccountmanagement({
    version: "v1",
    auth: oauth2Client,
  });

  const infoService = google.mybusinessbusinessinformation({
    version: "v1",
    auth: oauth2Client,
  });

  const accounts = await accountService.accounts.list({});
  const accountList = accounts.data.accounts || [];

  let allLocations: any[] = [];

  for (const acc of accountList) {
    let pageToken: string | undefined = undefined;

    do {
      const res: any = await infoService.accounts.locations.list({
        parent: acc.name!,
        readMask:
          "name,title,storeCode,phoneNumbers,websiteUri,storefrontAddress,openInfo",
        pageSize: 100,
        pageToken,
      });

      const data = res.data;

      if (data?.locations) {
        allLocations = [...allLocations, ...data.locations];
      }

      pageToken = data?.nextPageToken || undefined;
    } while (pageToken);
  }

  return Response.json({ locations: allLocations });
}
