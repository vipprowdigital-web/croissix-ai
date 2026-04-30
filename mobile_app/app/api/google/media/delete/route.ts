// app/api/google/media/delete/route.ts

import { getAuthClient } from "@/lib/googleAuth";
import axios from "axios";

export async function DELETE(req: Request) {
  const { mediaName } = await req.json();
  const authHeader = req.headers.get("authorization");
  console.log("Auth Header: ", authHeader);
  console.log("Media Name: ", mediaName);

  if (!mediaName) {
    return Response.json({ error: "Missing mediaName" }, { status: 400 });
  }

  try {
    const auth = await getAuthClient(authHeader || undefined);
    if (!auth) {
      return Response.json({ error: "Authentication failed" }, { status: 401 });
    }

    const accessToken = auth.credentials.access_token;

    await axios.delete(`https://mybusiness.googleapis.com/v4/${mediaName}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("Google Delete Error:", error.response?.data);
    return Response.json(
      { error: error.response?.data || error.message },
      { status: 500 },
    );
  }
}
