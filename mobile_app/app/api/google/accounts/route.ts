// mobile_app\app\api\google\accounts\route.ts

import { google } from "googleapis";
import { getAuthClient } from "@/lib/googleAuth";

export async function GET() {
  const auth = await getAuthClient(); // ✅ await here

  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = google.mybusinessaccountmanagement({
    version: "v1",
    auth,
  });

  const res = await service.accounts.list();

  return Response.json(res.data);
}