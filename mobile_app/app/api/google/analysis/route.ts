// mobile_app/app/api/google/analysis/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: After replacing this file, run:
//   1. Stop the dev server (Ctrl+C)
//   2. Delete  mobile_app/.next  folder completely
//   3. npm run dev
// This clears Turbopack's compiled cache so the new URLs are picked up.
// ─────────────────────────────────────────────────────────────────────────────

import { google } from "googleapis";
import axios from "axios";

/* ─── helpers ──────────────────────────────────────────── */
function fmtDate(d: { year: number; month: number; day: number }) {
  return `${d.year}-${String(d.month).padStart(2,"0")}-${String(d.day).padStart(2,"0")}`;
}

function sum(arr: { value: number }[] | undefined) {
  return (arr ?? []).reduce((a, b) => a + b.value, 0);
}

/* ─── GET /api/google/analysis?locationId=...&range=7d|30d|90d ─── */
export async function GET(req: Request) {
  console.log("===== GOOGLE ANALYTICS v3 =====");

  try {
    /* params */
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");
    const range      = searchParams.get("range") || "30d";
    if (!locationId) {
      return Response.json({ success: false, error: "locationId required" }, { status: 400 });
    }

    /* auth */
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    /* user profile */
    const profile = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/users/profile/view`,
      { headers: { Authorization: authHeader } }
    );
    const user = profile.data.user;
    if (!user.googleAccessToken) {
      return Response.json({ success: false, error: "Google not connected" }, { status: 401 });
    }
    console.log("User:", user.email);

    /* oauth */
    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2.setCredentials({
      access_token:  user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });
    const { token: accessToken } = await oauth2.getAccessToken();
    if (!accessToken) {
      return Response.json({ success: false, error: "Token refresh failed" }, { status: 401 });
    }
    console.log("Token OK");

    /* date range */
    const endDate   = new Date();
    const startDate = new Date();
    if      (range === "7d")  startDate.setDate(endDate.getDate() - 7);
    else if (range === "90d") startDate.setDate(endDate.getDate() - 90);
    else                      startDate.setDate(endDate.getDate() - 30);

    /* ══════════════════════════════════════════════════════════════
       PERFORMANCE API
       Correct URL per official docs:
         GET /v1/{location=locations/*}:fetchMultiDailyMetricsTimeSeries
       i.e.  /v1/locations/LOCATION_ID:fetchMultiDailyMetrics...
       NO account prefix. locationId is the bare numeric ID.
    ══════════════════════════════════════════════════════════════ */
    const PERF_BASE = "https://businessprofileperformance.googleapis.com";

    // Build query string manually to get repeated ?dailyMetrics=X&dailyMetrics=Y
    const metricsKeys = [
      "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
      "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
      "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
      "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
      "CALL_CLICKS",
      "WEBSITE_CLICKS",
      "BUSINESS_DIRECTION_REQUESTS",
      "BUSINESS_CONVERSATIONS",
    ];

    const qp = new URLSearchParams();
    for (const m of metricsKeys) qp.append("dailyMetrics", m);
    qp.set("dailyRange.start_date.year",  String(startDate.getFullYear()));
    qp.set("dailyRange.start_date.month", String(startDate.getMonth() + 1));
    qp.set("dailyRange.start_date.day",   String(startDate.getDate()));
    qp.set("dailyRange.end_date.year",    String(endDate.getFullYear()));
    qp.set("dailyRange.end_date.month",   String(endDate.getMonth() + 1));
    qp.set("dailyRange.end_date.day",     String(endDate.getDate()));

    // ✅ CORRECT path: /v1/locations/{locationId}:fetchMultiDailyMetricsTimeSeries
    const perfEndpoint = `${PERF_BASE}/v1/locations/${locationId}:fetchMultiDailyMetricsTimeSeries?${qp.toString()}`;
    console.log("Perf endpoint:", perfEndpoint);

    let perfData: any = { multiDailyMetricTimeSeries: [] };
    try {
      const r    = await fetch(perfEndpoint, { headers: { Authorization: `Bearer ${accessToken}` } });
      const text = await r.text();
      console.log("Perf status:", r.status, "| first 80:", text.slice(0, 80));
      if (text.trimStart().startsWith("{")) {
        perfData = JSON.parse(text);
      } else {
        console.error("Perf API returned non-JSON. Status:", r.status);
      }
    } catch (e: any) {
      console.error("Perf fetch error:", e.message);
    }

    /* ══════════════════════════════════════════════════════════════
       REVIEWS
       mybusiness v4 reviews endpoint still active for most accounts.
       Path: /v4/accounts/{accountId}/locations/{locationId}/reviews
       We need the accountId for this one.
    ══════════════════════════════════════════════════════════════ */
    let accountId = "";
    try {
      const acctSvc  = google.mybusinessaccountmanagement({ version: "v1", auth: oauth2 });
      const acctRes  = await acctSvc.accounts.list();
      accountId      = acctRes.data.accounts?.[0]?.name ?? "";
      console.log("Account:", accountId);
    } catch (e: any) {
      console.warn("Account list failed:", e.message);
    }

    let reviewsData: any = { reviews: [], totalReviewCount: 0 };
    if (accountId) {
      try {
        const rUrl  = `https://mybusiness.googleapis.com/v4/${accountId}/locations/${locationId}/reviews?pageSize=50`;
        const rRes  = await fetch(rUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
        const rText = await rRes.text();
        console.log("Reviews status:", rRes.status, "| first 60:", rText.slice(0, 60));
        if (rText.trimStart().startsWith("{")) {
          const parsed = JSON.parse(rText);
          if (!parsed.error) reviewsData = parsed;
        }
      } catch (e: any) {
        console.warn("Reviews v4 error:", e.message);
      }
    }

    /* ══════════════════════════════════════════════════════════════
       POSTS COUNT
    ══════════════════════════════════════════════════════════════ */
    let totalPosts = 0;
    if (accountId) {
      try {
        const pUrl  = `https://mybusiness.googleapis.com/v4/${accountId}/locations/${locationId}/localPosts?pageSize=1`;
        const pRes  = await fetch(pUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
        const pText = await pRes.text();
        if (pText.trimStart().startsWith("{")) {
          const p = JSON.parse(pText);
          totalPosts = p.totalSize ?? 0;
        }
      } catch {}
    }
    console.log("Posts:", totalPosts);

    /* ══════════════════════════════════════════════════════════════
       NORMALISE SERIES
    ══════════════════════════════════════════════════════════════ */
    const series: Record<string, { date: string; value: number }[]> = {};
    for (const ts of (perfData.multiDailyMetricTimeSeries ?? [])) {
      const key = ts.dailyMetric as string;
      series[key] = (ts.timeSeries?.datedValues ?? []).map((dv: any) => ({
        date:  fmtDate(dv.date),
        value: parseInt(dv.value ?? "0", 10) || 0,
      }));
    }

    const totalImpressions =
      sum(series["BUSINESS_IMPRESSIONS_DESKTOP_MAPS"])   +
      sum(series["BUSINESS_IMPRESSIONS_DESKTOP_SEARCH"]) +
      sum(series["BUSINESS_IMPRESSIONS_MOBILE_MAPS"])    +
      sum(series["BUSINESS_IMPRESSIONS_MOBILE_SEARCH"]);

    /* merged daily impressions */
    const allDates = new Set<string>([
      ...(series["BUSINESS_IMPRESSIONS_DESKTOP_MAPS"]   ?? []).map(d => d.date),
      ...(series["BUSINESS_IMPRESSIONS_DESKTOP_SEARCH"] ?? []).map(d => d.date),
      ...(series["BUSINESS_IMPRESSIONS_MOBILE_MAPS"]    ?? []).map(d => d.date),
      ...(series["BUSINESS_IMPRESSIONS_MOBILE_SEARCH"]  ?? []).map(d => d.date),
    ]);
    const impressionsByDay = Array.from(allDates).sort().map(date => {
      const g = (k: string) => series[k]?.find(d => d.date === date)?.value ?? 0;
      return {
        date,
        desktop: g("BUSINESS_IMPRESSIONS_DESKTOP_MAPS") + g("BUSINESS_IMPRESSIONS_DESKTOP_SEARCH"),
        mobile:  g("BUSINESS_IMPRESSIONS_MOBILE_MAPS")  + g("BUSINESS_IMPRESSIONS_MOBILE_SEARCH"),
      };
    });

    /* merged daily actions */
    const actDates = new Set<string>([
      ...(series["CALL_CLICKS"]                 ?? []).map(d => d.date),
      ...(series["WEBSITE_CLICKS"]              ?? []).map(d => d.date),
      ...(series["BUSINESS_DIRECTION_REQUESTS"] ?? []).map(d => d.date),
    ]);
    const actionsByDay = Array.from(actDates).sort().map(date => ({
      date,
      calls:      series["CALL_CLICKS"]?.find(d => d.date === date)?.value ?? 0,
      website:    series["WEBSITE_CLICKS"]?.find(d => d.date === date)?.value ?? 0,
      directions: series["BUSINESS_DIRECTION_REQUESTS"]?.find(d => d.date === date)?.value ?? 0,
    }));

    /* breakdown */
    const impressionBreakdown = {
      desktopMaps:   sum(series["BUSINESS_IMPRESSIONS_DESKTOP_MAPS"]),
      desktopSearch: sum(series["BUSINESS_IMPRESSIONS_DESKTOP_SEARCH"]),
      mobileMaps:    sum(series["BUSINESS_IMPRESSIONS_MOBILE_MAPS"]),
      mobileSearch:  sum(series["BUSINESS_IMPRESSIONS_MOBILE_SEARCH"]),
    };

    /* ══════════════════════════════════════════════════════════════
       NORMALISE REVIEWS
    ══════════════════════════════════════════════════════════════ */
    const ratingMap: Record<string, number> = { ONE:1, TWO:2, THREE:3, FOUR:4, FIVE:5 };
    const reviews       = reviewsData.reviews ?? [];
    const totalReviews  = reviewsData.totalReviewCount ?? reviews.length;
    const avgRating     = reviews.length
      ? reviews.reduce((a: number, r: any) => a + (ratingMap[r.starRating] ?? 0), 0) / reviews.length
      : 0;
    const repliedCount  = reviews.filter((r: any) => r.reviewReply).length;
    const replyRate     = reviews.length ? Math.round((repliedCount / reviews.length) * 100) : 0;

    const ratingDistribution: Record<number, number> = {1:0,2:0,3:0,4:0,5:0};
    for (const r of reviews) {
      const n = ratingMap[r.starRating];
      if (n) ratingDistribution[n] = (ratingDistribution[n] ?? 0) + 1;
    }

    /* ══════════════════════════════════════════════════════════════
       RESPONSE
    ══════════════════════════════════════════════════════════════ */
    return Response.json({
      success: true,
      range,
      startDate: startDate.toISOString(),
      endDate:   endDate.toISOString(),
      summary: {
        totalImpressions,
        totalCalls:         sum(series["CALL_CLICKS"]),
        totalWebsite:       sum(series["WEBSITE_CLICKS"]),
        totalDirections:    sum(series["BUSINESS_DIRECTION_REQUESTS"]),
        totalConversations: sum(series["BUSINESS_CONVERSATIONS"]),
        totalReviews,
        avgRating:  parseFloat(avgRating.toFixed(1)),
        replyRate,
        totalPosts,
      },
      charts: {
        impressionsByDay,
        actionsByDay,
        impressionBreakdown,
        ratingDistribution,
        callSeries:      series["CALL_CLICKS"]                 ?? [],
        websiteSeries:   series["WEBSITE_CLICKS"]              ?? [],
        directionSeries: series["BUSINESS_DIRECTION_REQUESTS"] ?? [],
      },
      recentReviews: reviews.slice(0, 5).map((r: any) => ({
        author:  r.reviewer?.displayName ?? "Anonymous",
        rating:  ratingMap[r.starRating] ?? 0,
        comment: r.comment ?? "",
        date:    r.createTime,
        replied: !!r.reviewReply,
      })),
    });

  } catch (error: any) {
    console.error("ANALYTICS ERROR:", error);
    return Response.json({ success: false, error: error.message ?? "Analytics failed" }, { status: 500 });
  }
}