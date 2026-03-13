// mobile_app/app/api/google/analysis/route.ts

//
// FIXES:
//  1. 401 on Performance API  — refresh token via direct POST to oauth2.googleapis.com/token,
//                               then PATCH the new accessToken back to your DB via your own API.
//  2. Reviews: undefined      — wrong URL format. Correct path:
//                               /v4/accounts/{accountName}/locations/{locationId}/reviews
//                               where accountName is the full "accounts/NNN" string.
//  3. ratingDistribution {}   — now computed from the reviews array.
//  4. Perf API response shape — multiDailyMetricTimeSeries entries can have the metric name
//                               at the top level OR inside dailyMetricTimeSeries[0].dailyMetric.
//                               Both patterns are handled.

import { google } from "googleapis";
import axios from "axios";

/* ── helpers ─────────────────────────────────────────────────────────────── */

function fmtDate(d: { year: number; month: number; day: number }) {
  return `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
}

function sum(arr: { value: number }[] | undefined) {
  return (arr ?? []).reduce((a, b) => a + b.value, 0);
}

/**
 * Refresh a Google access token directly via oauth2.googleapis.com.
 * Returns the new access_token string, or throws on failure.
 */
async function refreshGoogleToken(refreshToken: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      `Token refresh failed: ${data.error} — ${data.error_description}`,
    );
  }

  return data.access_token as string;
}

/* ── main handler ────────────────────────────────────────────────────────── */

export async function GET(req: Request) {
  console.log("===== GOOGLE ANALYTICS v4 =====");

  try {
    /* params */
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");
    const range = searchParams.get("range") || "30d";

    if (!locationId) {
      return Response.json(
        { success: false, error: "locationId required" },
        { status: 400 },
      );
    }

    /* auth — your own backend JWT */
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    /* user profile from your API */
    const profile = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/users/profile/view`,
      { headers: { Authorization: authHeader } },
    );

    const user = profile.data.user;

    if (!user.googleAccessToken || !user.googleRefreshToken) {
      return Response.json(
        { success: false, error: "Google not connected" },
        { status: 401 },
      );
    }

    console.log("User:", user.email);

    /* ── FIX 1: get a fresh access token ──────────────────────────────────
     *
     *  oauth2.getAccessToken() sometimes returns the stale stored token
     *  without actually verifying it is still valid with Google.
     *  We always force-refresh via the token endpoint instead.
     *  After a successful refresh we persist the new token back to your DB
     *  so the next request doesn't have to refresh again unnecessarily.
     */
    let accessToken: string;

    try {
      accessToken = await refreshGoogleToken(user.googleRefreshToken);
      console.log("Token refreshed OK");

      // Persist new token back to your DB so it doesn't expire mid-session.
      // Fire-and-forget — don't block the analytics response.
      axios
        .patch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/profile/google-token`,
          { googleAccessToken: accessToken },
          { headers: { Authorization: authHeader } },
        )
        .catch((e) =>
          console.warn("Could not persist refreshed token:", e.message),
        );
    } catch (refreshErr: any) {
      console.error("Token refresh error:", refreshErr.message);
      return Response.json(
        {
          success: false,
          error: "Google token expired. Please re-connect Google.",
        },
        { status: 401 },
      );
    }

    /* ── date range ───────────────────────────────────────────────────────── */
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 2); // GBP data lags ~48 h

    const startDate = new Date(endDate);
    if (range === "7d") startDate.setDate(endDate.getDate() - 7);
    else if (range === "90d") startDate.setDate(endDate.getDate() - 90);
    else startDate.setDate(endDate.getDate() - 30);

    /* ── Performance API ──────────────────────────────────────────────────── */
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
    metrics.forEach((m) => qp.append("dailyMetrics", m));
    qp.set("dailyRange.start_date.year", String(startDate.getFullYear()));
    qp.set("dailyRange.start_date.month", String(startDate.getMonth() + 1));
    qp.set("dailyRange.start_date.day", String(startDate.getDate()));
    qp.set("dailyRange.end_date.year", String(endDate.getFullYear()));
    qp.set("dailyRange.end_date.month", String(endDate.getMonth() + 1));
    qp.set("dailyRange.end_date.day", String(endDate.getDate()));

    const perfEndpoint = `${PERF_BASE}/v1/locations/${locationId}:fetchMultiDailyMetricsTimeSeries?${qp}`;
    console.log("Perf endpoint:", perfEndpoint);

    const perfRes = await fetch(perfEndpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log("Perf status:", perfRes.status);

    if (!perfRes.ok) {
      const perfErr = await perfRes.json().catch(() => ({}));
      console.error("Perf API error body:", JSON.stringify(perfErr));
      // Don't hard-fail — return zeros for perf data, still show reviews
    }

    const perfJson = perfRes.ok ? await perfRes.json() : { multiDailyMetricTimeSeries: [] };

    console.log(
      "Metric series count:",
      perfJson.multiDailyMetricTimeSeries?.length,
    );

    /* ── FIX 4: parse metric series ─────────────────────────────────────────
     *
     *  The API returns either:
     *    { dailyMetric: "CALL_CLICKS", dailyMetricTimeSeries: [{ timeSeries: { datedValues: [...] } }] }
     *  OR:
     *    { dailyMetricTimeSeries: [{ dailyMetric: "CALL_CLICKS", timeSeries: { datedValues: [...] } }] }
     *
     *  We handle both.
     */
    const series: Record<string, { date: string; value: number }[]> = {};

    for (const entry of perfJson.multiDailyMetricTimeSeries ?? []) {
      // pattern A — metric name at top level
      const topLevelMetric: string | undefined = entry.dailyMetric;

      const innerSeries: any[] = entry.dailyMetricTimeSeries ?? [];

      if (topLevelMetric && innerSeries.length > 0) {
        // All inner series share the same metric
        const datedValues =
          innerSeries[0]?.timeSeries?.datedValues ?? [];
        series[topLevelMetric] = datedValues.map((dv: any) => ({
          date: fmtDate(dv.date),
          value: parseInt(dv.value ?? "0", 10) || 0,
        }));
      } else {
        // pattern B — metric name inside each inner series object
        for (const inner of innerSeries) {
          const metricName: string =
            inner.dailyMetric ?? inner.metric ?? "UNKNOWN";
          const datedValues = inner.timeSeries?.datedValues ?? [];
          series[metricName] = datedValues.map((dv: any) => ({
            date: fmtDate(dv.date),
            value: parseInt(dv.value ?? "0", 10) || 0,
          }));
        }
      }
    }

    console.log("Parsed metric keys:", Object.keys(series));

    /* ── totals / daily arrays ────────────────────────────────────────────── */
    const totalImpressions =
      sum(series["BUSINESS_IMPRESSIONS_DESKTOP_MAPS"]) +
      sum(series["BUSINESS_IMPRESSIONS_DESKTOP_SEARCH"]) +
      sum(series["BUSINESS_IMPRESSIONS_MOBILE_MAPS"]) +
      sum(series["BUSINESS_IMPRESSIONS_MOBILE_SEARCH"]);

    const dateSet = new Set<string>();
    Object.values(series).forEach((arr) => arr.forEach((d) => dateSet.add(d.date)));

    const impressionsByDay = Array.from(dateSet)
      .sort()
      .map((date) => {
        const g = (k: string) =>
          series[k]?.find((d) => d.date === date)?.value ?? 0;
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

    const actionsByDay = Array.from(dateSet)
      .sort()
      .map((date) => ({
        date,
        calls: series["CALL_CLICKS"]?.find((d) => d.date === date)?.value ?? 0,
        website:
          series["WEBSITE_CLICKS"]?.find((d) => d.date === date)?.value ?? 0,
        directions:
          series["BUSINESS_DIRECTION_REQUESTS"]?.find((d) => d.date === date)
            ?.value ?? 0,
      }));

    /* ── Reviews ──────────────────────────────────────────────────────────────
     *
     *  FIX 2: We need the full account resource name ("accounts/NNN"), not just
     *  the numeric ID.  We fetch it fresh from the Account Management API.
     *
     *  Correct URL:
     *    GET /v4/{parent=accounts/*\/locations/*}/reviews
     *    i.e. https://mybusiness.googleapis.com/v4/accounts/NNN/locations/LLL/reviews
     *
     *  Note: locationId here is just the numeric string (e.g. "8458234036949018584"),
     *  NOT the full "accounts/NNN/locations/LLL" path.
     */

    // We still use the googleapis client just for listing accounts (it handles auth internally).
    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
    oauth2.setCredentials({
      access_token: accessToken,
      refresh_token: user.googleRefreshToken,
    });

    const acctSvc = google.mybusinessaccountmanagement({
      version: "v1",
      auth: oauth2,
    });

    const acctRes = await acctSvc.accounts.list();
    // accountName looks like "accounts/117769049285321930480"
    const accountName = acctRes.data.accounts?.[0]?.name ?? "";
    console.log("Account:", accountName);

    const ratingMap: Record<string, number> = {
      ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
    };

    let reviews: any[] = [];
    let totalReviewCount = 0;
    let avgRatingFromApi = 0;

    if (accountName) {
      // accountName = "accounts/117769049285321930480"
      // locationId  = "8458234036949018584"   (just the numeric part)
      const reviewsUrl = `https://mybusiness.googleapis.com/v4/${accountName}/locations/${locationId}/reviews?pageSize=50&orderBy=updateTime+desc`;

      console.log("Reviews URL:", reviewsUrl);

      const rRes = await fetch(reviewsUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      console.log("Reviews status:", rRes.status);

      if (rRes.ok) {
        const reviewsData = await rRes.json();
        reviews = reviewsData.reviews ?? [];
        totalReviewCount = reviewsData.totalReviewCount ?? reviews.length;
        avgRatingFromApi = reviewsData.averageRating
          ? parseFloat(parseFloat(reviewsData.averageRating).toFixed(1))
          : 0;

        console.log("Reviews fetched:", reviews.length, "total:", totalReviewCount);
      } else {
        const errBody = await rRes.json().catch(() => ({}));
        console.error("Reviews API error:", JSON.stringify(errBody));
      }
    }

    /* ── FIX 3: compute ratingDistribution from actual reviews ─────────────── */
    const ratingDistribution: Record<number, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
    };

    const avgRating =
      avgRatingFromApi > 0
        ? avgRatingFromApi
        : reviews.length
        ? parseFloat(
            (
              reviews.reduce(
                (a: number, r: any) => a + (ratingMap[r.starRating] ?? 0),
                0,
              ) / reviews.length
            ).toFixed(1),
          )
        : 0;

    for (const r of reviews) {
      const stars = ratingMap[r.starRating];
      if (stars) ratingDistribution[stars] = (ratingDistribution[stars] ?? 0) + 1;
    }

    const repliedCount = reviews.filter((r: any) => r.reviewReply).length;
    const replyRate = reviews.length
      ? Math.round((repliedCount / reviews.length) * 100)
      : 0;

    /* ── Posts ────────────────────────────────────────────────────────────── */
    let totalPosts = 0;
    let livePosts = 0;
    let eventPosts = 0;
    let offerPosts = 0;
    let updatePosts = 0;

    if (accountName) {
      const pRes = await fetch(
        `https://mybusiness.googleapis.com/v4/${accountName}/locations/${locationId}/localPosts?pageSize=100`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      if (pRes.ok) {
        const postsData = await pRes.json();
        const posts = postsData.localPosts ?? [];
        totalPosts = posts.length;
        for (const post of posts) {
          if (post.state === "LIVE") livePosts++;
          if (post.topicType === "EVENT") eventPosts++;
          if (post.topicType === "OFFER") offerPosts++;
          if (post.topicType === "STANDARD") updatePosts++;
        }
      } else {
        console.warn("Posts API status:", pRes.status);
      }
    }

    /* ── response ─────────────────────────────────────────────────────────── */
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
        totalReviews: totalReviewCount,
        avgRating,
        replyRate,
        totalPosts,
      },

      stats: {
        totalReviews: totalReviewCount,
        repliedReviews: repliedCount,
        unrepliedReviews: totalReviewCount - repliedCount,
        avgRating,
        totalPosts,
        livePosts,
        eventPosts,
        offerPosts,
        updatePosts,
        totalImpressions,
        totalCalls: sum(series["CALL_CLICKS"]),
        totalWebsite: sum(series["WEBSITE_CLICKS"]),
        totalDirections: sum(series["BUSINESS_DIRECTION_REQUESTS"]),
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
        ratingDistribution,
        callSeries: series["CALL_CLICKS"] ?? [],
        websiteSeries: series["WEBSITE_CLICKS"] ?? [],
        directionSeries: series["BUSINESS_DIRECTION_REQUESTS"] ?? [],
      },

      recentReviews: reviews.slice(0, 5).map((r: any) => ({
        author: r.reviewer?.displayName ?? "Anonymous",
        rating: ratingMap[r.starRating] ?? 0,
        comment: r.comment ?? "",
        date: r.createTime,
        replied: !!r.reviewReply,
      })),
    });
  } catch (err: any) {
    console.error("ANALYTICS ERROR:", err);
    return Response.json(
      { success: false, error: err.message ?? "Analytics failed" },
      { status: 500 },
    );
  }
}