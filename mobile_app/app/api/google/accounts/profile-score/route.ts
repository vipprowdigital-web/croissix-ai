// mobile_app\app\api\google\accounts\profile-score\route.ts
//
// Computes a REAL Google Business Profile health score (0–1000) by fetching
// live data from the GBP API v1 (Business Information) + v4 (Reviews/Posts).
//
// Score breakdown (1000 pts total):
//
//  COMPLETENESS  (400 pts)
//    title              50  — business name set
//    primaryCategory    60  — primary category set
//    additionalCat      30  — ≥1 additional category
//    description        60  — profile description ≥ 50 chars
//    primaryPhone       50  — phone number present
//    websiteUri         50  — website present
//    storefrontAddress  60  — address fully set
//    regularHours       40  — hours configured
//    specialHours       10  — holiday / special hours
//    coverPhoto*        40  — cover photo uploaded   (checked via metadata.hasCoverPhoto)
//
//  REPUTATION    (350 pts)
//    avgRating          ×60 — (rating/5) × 60, max 60
//    reviewCount        60  — log-scaled, max at 200+ reviews → 60 pts
//    replyRate          80  — (replyRate/100) × 80
//    totalReviews       150 — tiered: 0=0 / 1–5=30 / 6–20=70 / 21–50=110 / 51+=150
//
//  ACTIVITY      (250 pts)
//    postsLast30d       100 — ≥4 posts in 30 days → 100, proportional below
//    repliedRecent      100 — % of last-10 reviews replied → ×100
//    verificationStatus 50  — location is verified
//
// *hasCoverPhoto is in the location.metadata object from GBP Business Info API v1

import axios from "axios";
import { google } from "googleapis";

/* ── helpers ─────────────────────────────────────────────────────────────── */

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
  if (!res.ok)
    throw new Error(`Token refresh failed: ${data.error} — ${data.error_description}`);
  return data.access_token as string;
}

function clamp(v: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, v));
}

/* ── score computation ───────────────────────────────────────────────────── */

interface ScoreBreakdown {
  completeness: { score: number; max: number; items: Record<string, { score: number; max: number; has: boolean }> };
  reputation:   { score: number; max: number; items: Record<string, { score: number; max: number }> };
  activity:     { score: number; max: number; items: Record<string, { score: number; max: number }> };
}

function computeScore(
  location: any,
  totalReviews: number,
  avgRating: number,
  replyRate: number,
  postsLast30d: number,
  recentRepliedPct: number,
  isVerified: boolean,
): { total: number; breakdown: ScoreBreakdown } {
  /* ── COMPLETENESS (400 pts) ── */
  const hasTitle         = !!location?.title;
  const hasPrimaryCat    = !!location?.categories?.primaryCategory;
  const hasAddlCat       = (location?.categories?.additionalCategories ?? []).length > 0;
  const hasDescription   = (location?.profile?.description ?? "").length >= 50;
  const hasPhone         = !!location?.phoneNumbers?.primaryPhone;
  const hasWebsite       = !!location?.websiteUri;
  const addr             = location?.storefrontAddress;
  const hasAddress       = !!(addr?.addressLines?.length && addr?.locality && addr?.regionCode);
  const hasHours         = (location?.regularHours?.periods ?? []).length > 0;
  const hasSpecialHours  = (location?.specialHours?.specialHourPeriods ?? []).length > 0;
  const hasCoverPhoto    = !!(location?.metadata?.hasCoverPhoto);

  const completenessItems = {
    title:          { score: hasTitle        ? 50 : 0, max: 50,  has: hasTitle },
    primaryCategory:{ score: hasPrimaryCat   ? 60 : 0, max: 60,  has: hasPrimaryCat },
    additionalCat:  { score: hasAddlCat      ? 30 : 0, max: 30,  has: hasAddlCat },
    description:    { score: hasDescription  ? 60 : 0, max: 60,  has: hasDescription },
    primaryPhone:   { score: hasPhone        ? 50 : 0, max: 50,  has: hasPhone },
    websiteUri:     { score: hasWebsite      ? 50 : 0, max: 50,  has: hasWebsite },
    storefrontAddress: { score: hasAddress   ? 60 : 0, max: 60,  has: hasAddress },
    regularHours:   { score: hasHours        ? 40 : 0, max: 40,  has: hasHours },
    specialHours:   { score: hasSpecialHours ? 10 : 0, max: 10,  has: hasSpecialHours },
    coverPhoto:     { score: hasCoverPhoto   ? 40 : 0, max: 40,  has: hasCoverPhoto },
  };

  const completenessScore = Object.values(completenessItems).reduce((a, v) => a + v.score, 0);

  /* ── REPUTATION (350 pts) ── */
  const ratingScore   = Math.round(clamp(avgRating / 5) * 60);
  const reviewLogScore = totalReviews === 0 ? 0 : Math.round(clamp(Math.log(totalReviews + 1) / Math.log(201)) * 60);
  const replyRateScore = Math.round(clamp(replyRate / 100) * 80);
  const reviewTierScore =
    totalReviews === 0   ? 0   :
    totalReviews <= 5    ? 30  :
    totalReviews <= 20   ? 70  :
    totalReviews <= 50   ? 110 : 150;

  const reputationItems = {
    avgRating:    { score: ratingScore,    max: 60  },
    reviewVolume: { score: reviewLogScore, max: 60  },
    replyRate:    { score: replyRateScore, max: 80  },
    reviewTier:   { score: reviewTierScore,max: 150 },
  };

  const reputationScore = Object.values(reputationItems).reduce((a, v) => a + v.score, 0);

  /* ── ACTIVITY (250 pts) ── */
  const postScore     = Math.round(clamp(postsLast30d / 4) * 100);
  const recentReplyScore = Math.round(clamp(recentRepliedPct) * 100);
  const verifiedScore = isVerified ? 50 : 0;

  const activityItems = {
    postsLast30d:   { score: postScore,         max: 100 },
    repliedRecent:  { score: recentReplyScore,  max: 100 },
    verified:       { score: verifiedScore,     max: 50  },
  };

  const activityScore = Object.values(activityItems).reduce((a, v) => a + v.score, 0);

  const total = completenessScore + reputationScore + activityScore;

  return {
    total,
    breakdown: {
      completeness: { score: completenessScore, max: 400, items: completenessItems },
      reputation:   { score: reputationScore,   max: 350, items: reputationItems },
      activity:     { score: activityScore,     max: 250, items: activityItems },
    },
  };
}

/* ── main handler ────────────────────────────────────────────────────────── */

export async function GET(req: Request) {
  console.log("===== PROFILE SCORE =====");

  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");

    if (!locationId) {
      return Response.json({ success: false, error: "locationId required" }, { status: 400 });
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    /* user profile */
    const profile = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/users/profile/view`,
      { headers: { Authorization: authHeader } },
    );
    const user = profile.data.user;

    if (!user.googleRefreshToken) {
      return Response.json({ success: false, error: "Google not connected" }, { status: 401 });
    }

    /* refresh token */
    let accessToken: string;
    try {
      accessToken = await refreshGoogleToken(user.googleRefreshToken);
      console.log("Token OK");
    } catch (e: any) {
      return Response.json({ success: false, error: "Google token expired. Re-connect Google." }, { status: 401 });
    }

    /* ── 1. Fetch full location object from Business Information API v1 ── */
    const locationRes = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/locations/${locationId}` +
      `?readMask=title,categories,profile,phoneNumbers,websiteUri,storefrontAddress,regularHours,specialHours,metadata,openInfo`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    let location: any = null;
    if (locationRes.ok) {
      location = await locationRes.json();
      console.log("Location fetched:", location?.title);
    } else {
      const err = await locationRes.json().catch(() => ({}));
      console.error("Location API error:", JSON.stringify(err));
    }

    /* ── 2. Reviews via v4 API ── */
    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
    oauth2.setCredentials({ access_token: accessToken, refresh_token: user.googleRefreshToken });

    const acctSvc = google.mybusinessaccountmanagement({ version: "v1", auth: oauth2 });
    const acctRes = await acctSvc.accounts.list();
    const accountName = acctRes.data.accounts?.[0]?.name ?? "";
    console.log("Account:", accountName);

    const ratingMap: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

    let reviews: any[]    = [];
    let totalReviewCount  = 0;
    let avgRating         = 0;

    if (accountName) {
      const rRes = await fetch(
        `https://mybusiness.googleapis.com/v4/${accountName}/locations/${locationId}/reviews?pageSize=50&orderBy=updateTime+desc`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (rRes.ok) {
        const rd = await rRes.json();
        reviews          = rd.reviews ?? [];
        totalReviewCount = rd.totalReviewCount ?? reviews.length;
        avgRating        = rd.averageRating
          ? parseFloat(parseFloat(rd.averageRating).toFixed(1))
          : reviews.length
          ? parseFloat((reviews.reduce((a: number, r: any) => a + (ratingMap[r.starRating] ?? 0), 0) / reviews.length).toFixed(1))
          : 0;
        console.log("Reviews:", reviews.length, "avg:", avgRating);
      } else {
        console.error("Reviews error:", rRes.status, await rRes.text().catch(() => ""));
      }
    }

    const repliedCount   = reviews.filter((r: any) => r.reviewReply).length;
    const replyRate      = reviews.length ? Math.round((repliedCount / reviews.length) * 100) : 0;
    // % of last 10 reviews that have been replied to
    const last10         = reviews.slice(0, 10);
    const recentRepliedPct = last10.length
      ? last10.filter((r: any) => r.reviewReply).length / last10.length
      : 0;

    /* ── 3. Posts in last 30 days ── */
    let postsLast30d = 0;
    const cutoff30d  = new Date();
    cutoff30d.setDate(cutoff30d.getDate() - 30);

    if (accountName) {
      const pRes = await fetch(
        `https://mybusiness.googleapis.com/v4/${accountName}/locations/${locationId}/localPosts?pageSize=100`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (pRes.ok) {
        const pd = await pRes.json();
        const posts = pd.localPosts ?? [];
        postsLast30d = posts.filter((p: any) => {
          const ct = p.createTime ? new Date(p.createTime) : null;
          return ct && ct >= cutoff30d;
        }).length;
        console.log("Posts last 30d:", postsLast30d);
      }
    }

    /* ── 4. Verification status (from location.metadata) ── */
    const isVerified = !!(location?.metadata?.hasGoogleUpdated === false || location?.metadata?.isVerified);
    // GBP API v1: metadata.isVerified was renamed; fall back to checking openInfo.status
    const openStatus = location?.openInfo?.status;
    const isOpen     = openStatus === "OPEN";

    /* ── 5. Compute score ── */
    const { total, breakdown } = computeScore(
      location,
      totalReviewCount,
      avgRating,
      replyRate,
      postsLast30d,
      recentRepliedPct,
      isVerified,
    );

    /* ── 6. Build missing items list for UI ── */
    const missing: string[] = [];
    const ci = breakdown.completeness.items;
    if (!ci.title.has)           missing.push("Add your business name");
    if (!ci.primaryCategory.has) missing.push("Set a primary business category");
    if (!ci.additionalCat.has)   missing.push("Add additional categories");
    if (!ci.description.has)     missing.push("Write a profile description (50+ chars)");
    if (!ci.primaryPhone.has)    missing.push("Add a phone number");
    if (!ci.websiteUri.has)      missing.push("Add your website URL");
    if (!ci.storefrontAddress.has) missing.push("Complete your business address");
    if (!ci.regularHours.has)    missing.push("Set regular business hours");
    if (!ci.specialHours.has)    missing.push("Add holiday / special hours");
    if (!ci.coverPhoto.has)      missing.push("Upload a cover photo");
    if (replyRate < 80)          missing.push(`Reply to more reviews (currently ${replyRate}%)`);
    if (postsLast30d < 4)        missing.push(`Post more updates (${postsLast30d}/4 this month)`);

    console.log("Score:", total);

    return Response.json({
      success:    true,
      score:      total,        // 0–1000
      maxScore:   1000,
      change:     0,            // TODO: persist previous score in DB and diff
      breakdown,
      meta: {
        locationName:    location?.title ?? "Your Business",
        avgRating,
        totalReviews:    totalReviewCount,
        replyRate,
        postsLast30d,
        isVerified,
        isOpen,
      },
      missing,
    });
  } catch (err: any) {
    console.error("PROFILE SCORE ERROR:", err);
    return Response.json({ success: false, error: err.message ?? "Score failed" }, { status: 500 });
  }
}