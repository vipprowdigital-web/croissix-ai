// app/api/google/media/list/route.ts

import { getAuthClient } from "@/lib/googleAuth";
import axios from "axios";
import { google } from "googleapis";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locationName = searchParams.get("location");

  const authHeader = req.headers.get("authorization");
  if (!locationName) {
    return Response.json({ error: "Missing location" }, { status: 400 });
  }

  try {
    const auth = await getAuthClient(authHeader || undefined);
    console.log("Auth: ", auth);

    if (!auth) {
      return Response.json({ error: "Authentication failed" }, { status: 401 });
    }

    const accessToken = auth.credentials.access_token;

    const accountService = google.mybusinessaccountmanagement({
      version: "v1",
      auth,
    });

    const accounts = await accountService.accounts.list();
    const accountId = accounts.data.accounts?.[0]?.name;
    console.log("Account Id: ", accountId);

    const locationId = locationName.split("/")[1];
    console.log("Location Id: ", locationId);

    const res = await axios.get(
      `https://mybusiness.googleapis.com/v4/${accountId}/locations/${locationId}/media`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    console.log("Response:  ", res);

    // return Response.json({ media: res.data.mediaItems || [] });
    // return Response.json({ media: res.data || [] });
    return Response.json({
      mediaItems: res.data.mediaItems || [],
      totalMediaItemCount: res.data.totalMediaItemCount || 0,
      nextPageToken: res.data.nextPageToken || null,
    });
  } catch (error: any) {
    console.error("Media list error:", error.response?.data || error);
    return Response.json(
      { error: error.response?.data || error.message },
      { status: 500 },
    );
  }
}
