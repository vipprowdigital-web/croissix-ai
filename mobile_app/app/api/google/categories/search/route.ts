import axios from "axios";
import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json([]);
    }

    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profileData } = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/users/profile/view`,
      {
        headers: {
          Authorization: authHeader,
        },
      },
    );

    const user = profileData.user;

    if (!user?.googleAccessToken) {
      return NextResponse.json(
        { error: "Google not connected" },
        { status: 401 },
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
      expiry_date: user.googleTokenExpiry,
    });

    const expiry = user.googleTokenExpiry ? Number(user.googleTokenExpiry) : 0;

    const needsRefresh = !expiry || expiry - Date.now() < 60_000;

    if (needsRefresh) {
      const { credentials } = await oauth2Client.refreshAccessToken();

      oauth2Client.setCredentials(credentials);

      console.log("Google token refreshed successfully");
    }

    const accessTokenResponse = await oauth2Client.getAccessToken();

    const accessToken =
      typeof accessTokenResponse === "string"
        ? accessTokenResponse
        : accessTokenResponse.token;

    console.log({
      authHeader,
      hasGoogleToken: !!user?.googleAccessToken,
      expiry,
      accessToken: accessToken?.slice(0, 20),
    });

    const response = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/categories?regionCode=US&languageCode=en`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const data = await response.json();

    const matches =
      data.categories?.filter((c: any) =>
        c.displayName.toLowerCase().includes(query.toLowerCase()),
      ) ?? [];

    return NextResponse.json(matches.slice(0, 20));
  } catch (err: any) {
    console.error("CATEGORY SEARCH ERROR:", err);

    return NextResponse.json(
      {
        error: err.message || "Unknown error",
      },
      {
        status: 500,
      },
    );
  }
}
