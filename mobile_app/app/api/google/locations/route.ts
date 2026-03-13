// mobile_app\app\api\google\locations\route.ts

import { google, mybusinessbusinessinformation_v1 } from "googleapis";
import axios from "axios";

export async function GET(req: Request) {
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

  console.log("accountList", accountList);

  let allLocations: any[] = [];

  for (const acc of accountList) {
    let pageToken: string | undefined = undefined;

    do {
      const res:any = await infoService.accounts.locations.list({
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

  console.log(allLocations);

  return Response.json({ locations: allLocations });
}
