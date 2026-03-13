// app/api/google/performance/route.ts

import { getToken } from "@/lib/token";
import axios from "axios";

export async function GET() {
  const res = await axios.get(
    "https://businessprofileperformance.googleapis.com/v1/locations/LOCATION_ID/searchKeywords/impressions/monthly",
    {
      headers: {
       Authorization: `Bearer ${getToken()}`,
      },
    }
  );

  return Response.json(res.data);
}