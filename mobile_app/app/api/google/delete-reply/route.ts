// app/api/google/delete-reply/route.ts

import { getAuthClient } from "@/lib/googleAuth";
import axios from "axios";

export async function DELETE(req: Request) {
  const { reviewName } = await req.json();

  if (!reviewName) {
    return Response.json({ error: "Missing reviewName" }, { status: 400 });
  }

  try {
    const auth = await getAuthClient();
    if (!auth) {
      return Response.json({ error: "Authentication failed" }, { status: 401 });
    }

    const accessToken = auth.credentials.access_token;

    const url = `https://mybusiness.googleapis.com/v4/${reviewName}/reply`;

    await axios.delete(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return Response.json({ success: true });

  } catch (error: any) {
    return Response.json(
      { error: error.response?.data || error.message },
      { status: 500 }
    );
  }
}