// mobile_app\app\api\google\posts\delete\route.ts


import { google } from "googleapis";
import axios from "axios";

export async function POST(req: Request) {
  try {
    const { postName } = await req.json();

    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    /* USER PROFILE */

    const profile = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/users/profile/view`,
      { headers: { Authorization: authHeader } }
    );

    const user = profile.data.user;

    if (!user.googleRefreshToken) {
      return Response.json(
        { success: false, error: "Google not connected" },
        { status: 401 }
      );
    }

    /* GOOGLE AUTH */

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      refresh_token: user.googleRefreshToken,
    });

    /* REFRESH ACCESS TOKEN */

    const accessTokenResponse = await oauth2Client.getAccessToken();
    const googleToken = accessTokenResponse.token;

    if (!googleToken) {
      return Response.json(
        { success: false, error: "Failed to refresh Google token" },
        { status: 401 }
      );
    }

    /* DELETE POST */

    const postId = postName.split("/").pop();

    const url = `https://mybusiness.googleapis.com/v4/accounts/${user.googleId}/locations/${user.googleLocationId}/localPosts/${postId}`;

    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${googleToken}`,
      },
    });

    const text = await res.text();

    if (!res.ok) {
      console.log("GOOGLE DELETE ERROR:", text);
      return Response.json(
        { success: false, error: text },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: "Post deleted successfully",
    });

  } catch (error: any) {

    console.error("DELETE POST ERROR:", error);

    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );

  }
}