// app/api/google/media/list/route.ts


import { getAuthClient } from "@/lib/googleAuth";
import axios from "axios";
import { google } from "googleapis";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locationName = searchParams.get("location");

  if (!locationName) {
    return Response.json({ error: "Missing location" }, { status: 400 });
  }

  try {
    const auth = await getAuthClient();
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

    const locationId = locationName.split("/")[1];

    const res = await axios.get(
      `https://mybusiness.googleapis.com/v4/${accountId}/locations/${locationId}/media`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return Response.json({ media: res.data.mediaItems || [] });

  } catch (error: any) {
    console.error("Media list error:", error.response?.data || error);
    return Response.json(
      { error: error.response?.data || error.message },
      { status: 500 }
    );
  }
}