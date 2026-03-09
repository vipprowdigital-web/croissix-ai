// mobile_app/app/api/google/analysis/route.ts

import { google } from "googleapis";
import axios from "axios";

/* helpers */
function fmtDate(d: { year: number; month: number; day: number }) {
  return `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
}

function sum(arr: { value: number }[] | undefined) {
  return (arr ?? []).reduce((a, b) => a + b.value, 0);
}

export async function GET(req: Request) {

  console.log("===== GOOGLE ANALYTICS v4 =====");

  try {

    /* params */
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");
    const range = searchParams.get("range") || "30d";

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
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    const { token: accessToken } = await oauth2.getAccessToken();

    if (!accessToken) {
      return Response.json({ success: false, error: "Token refresh failed" }, { status: 401 });
    }

    console.log("Token OK");

    /* date range */
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 2);

    const startDate = new Date(endDate);

    if (range === "7d") startDate.setDate(endDate.getDate() - 7);
    else if (range === "90d") startDate.setDate(endDate.getDate() - 90);
    else startDate.setDate(endDate.getDate() - 30);

    /* performance API */
    const PERF_BASE = "https://businessprofileperformance.googleapis.com";

    const metrics = [
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

    metrics.forEach(m => qp.append("dailyMetrics", m));

    qp.set("dailyRange.start_date.year", String(startDate.getFullYear()));
    qp.set("dailyRange.start_date.month", String(startDate.getMonth() + 1));
    qp.set("dailyRange.start_date.day", String(startDate.getDate()));

    qp.set("dailyRange.end_date.year", String(endDate.getFullYear()));
    qp.set("dailyRange.end_date.month", String(endDate.getMonth() + 1));
    qp.set("dailyRange.end_date.day", String(endDate.getDate()));

    const perfEndpoint =
      `${PERF_BASE}/v1/locations/${locationId}:fetchMultiDailyMetricsTimeSeries?${qp}`;

    console.log("Perf endpoint:", perfEndpoint);

    let perfData: any = { multiDailyMetricTimeSeries: [] };

    const perfRes = await fetch(perfEndpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const perfJson = await perfRes.json();

    console.log("Perf status:", perfRes.status);

    perfData = perfJson;

    console.log(
      "Metric series count:",
      perfData.multiDailyMetricTimeSeries?.length
    );

    /* parse metrics safely */

    const series: Record<string, { date: string; value: number }[]> = {};

    for (const metricObj of perfData.multiDailyMetricTimeSeries ?? []) {

      const metricName =
        metricObj.dailyMetric ||
        metricObj.dailyMetricTimeSeries?.[0]?.dailyMetric ||
        metricObj.dailyMetricTimeSeries?.[0]?.metric ||
        "UNKNOWN";

      const values =
        metricObj.dailyMetricTimeSeries?.[0]?.timeSeries?.datedValues ?? [];

      series[metricName] = values.map((dv: any) => ({
        date: fmtDate(dv.date),
        value: parseInt(dv.value ?? "0", 10) || 0,
      }));
    }

    console.log("Parsed metric keys:", Object.keys(series));

    /* totals */

    const totalImpressions =
      sum(series["BUSINESS_IMPRESSIONS_DESKTOP_MAPS"]) +
      sum(series["BUSINESS_IMPRESSIONS_DESKTOP_SEARCH"]) +
      sum(series["BUSINESS_IMPRESSIONS_MOBILE_MAPS"]) +
      sum(series["BUSINESS_IMPRESSIONS_MOBILE_SEARCH"]);

    /* impressions by day */

    const dateSet = new Set<string>();

    Object.values(series).forEach(arr =>
      arr.forEach(d => dateSet.add(d.date))
    );

    const impressionsByDay = Array.from(dateSet)
      .sort()
      .map(date => {

        const g = (k: string) =>
          series[k]?.find(d => d.date === date)?.value ?? 0;

        return {
          date,
          desktop:
            g("BUSINESS_IMPRESSIONS_DESKTOP_MAPS") +
            g("BUSINESS_IMPRESSIONS_DESKTOP_SEARCH"),

          mobile:
            g("BUSINESS_IMPRESSIONS_MOBILE_MAPS") +
            g("BUSINESS_IMPRESSIONS_MOBILE_SEARCH"),
        };
      });

    /* actions */

    const actionsByDay = Array.from(dateSet)
      .sort()
      .map(date => ({

        date,

        calls:
          series["CALL_CLICKS"]?.find(d => d.date === date)?.value ?? 0,

        website:
          series["WEBSITE_CLICKS"]?.find(d => d.date === date)?.value ?? 0,

        directions:
          series["BUSINESS_DIRECTION_REQUESTS"]
            ?.find(d => d.date === date)?.value ?? 0,
      }));

    /* reviews */

    const acctSvc = google.mybusinessaccountmanagement({
      version: "v1",
      auth: oauth2,
    });

    const acctRes = await acctSvc.accounts.list();

    const accountId = acctRes.data.accounts?.[0]?.name ?? "";

    console.log("Account:", accountId);

    let reviewsData: any = { reviews: [], totalReviewCount: 0 };

    if (accountId) {

      const rRes = await fetch(
        `https://mybusiness.googleapis.com/v4/${accountId}/locations/${locationId}/reviews?pageSize=50`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      reviewsData = await rRes.json();

      console.log("Reviews:", reviewsData.reviews?.length);
    }

    const ratingMap: Record<string, number> =
      { ONE:1, TWO:2, THREE:3, FOUR:4, FIVE:5 };

    const reviews = reviewsData.reviews ?? [];

    const avgRating =
      reviews.length
        ? reviews.reduce((a: number, r: any) =>
            a + (ratingMap[r.starRating] ?? 0), 0) / reviews.length
        : 0;

    const repliedCount =
      reviews.filter((r: any) => r.reviewReply).length;

    const replyRate =
      reviews.length
        ? Math.round((repliedCount / reviews.length) * 100)
        : 0;

    /* response */

    return Response.json({

      success: true,

      range,

      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),

      summary: {
        totalImpressions,
        totalCalls: sum(series["CALL_CLICKS"]),
        totalWebsite: sum(series["WEBSITE_CLICKS"]),
        totalDirections: sum(series["BUSINESS_DIRECTION_REQUESTS"]),
        totalConversations: sum(series["BUSINESS_CONVERSATIONS"]),
        totalReviews: reviewsData.totalReviewCount ?? reviews.length,
        avgRating: parseFloat(avgRating.toFixed(1)),
        replyRate,
        totalPosts: 0,
      },

      charts: {
        impressionsByDay,
        actionsByDay,
        impressionBreakdown: {
          desktopMaps: sum(series["BUSINESS_IMPRESSIONS_DESKTOP_MAPS"]),
          desktopSearch: sum(series["BUSINESS_IMPRESSIONS_DESKTOP_SEARCH"]),
          mobileMaps: sum(series["BUSINESS_IMPRESSIONS_MOBILE_MAPS"]),
          mobileSearch: sum(series["BUSINESS_IMPRESSIONS_MOBILE_SEARCH"]),
        },
        ratingDistribution: {},
        callSeries: series["CALL_CLICKS"] ?? [],
        websiteSeries: series["WEBSITE_CLICKS"] ?? [],
        directionSeries: series["BUSINESS_DIRECTION_REQUESTS"] ?? [],
      },

      recentReviews: reviews.slice(0,5).map((r:any)=>({
        author:r.reviewer?.displayName ?? "Anonymous",
        rating:ratingMap[r.starRating] ?? 0,
        comment:r.comment ?? "",
        date:r.createTime,
        replied:!!r.reviewReply
      }))
    });

  } catch (err:any) {

    console.error("ANALYTICS ERROR:", err);

    return Response.json(
      { success:false, error:err.message ?? "Analytics failed" },
      { status:500 }
    );
  }
}