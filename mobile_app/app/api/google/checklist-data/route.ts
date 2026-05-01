// mobile_app\app\api\google\checklist-data\route.ts

// mobile_app/app/api/google/checklist-data/route.ts
//
// Fetches ALL data needed for the checklist page that isn't already
// covered by /api/google/profile-score.
//
// Returns:
//   logoUploaded, coverUploaded, exteriorCount, interiorCount, productCount, videoCount
//   servicesCount, productsCount, attributesSet, attributesTotal
//   bookingUrl, reviewCount, avgRating, replyRate, lastReviewDaysAgo
//   allNegativeReplied, postsLast30d, hasActiveOffer, qaCount
//   messagingEnabled, serviceAreaSet, hasSpecialHours

import { google } from "googleapis";
import axios from "axios";

/* ── token refresh ───────────────────────────────────────────────── */
async function refreshGoogleToken(refreshToken: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type:    "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Token refresh failed: ${data.error}`);
  return data.access_token as string;
}

/* ── safe fetch helper (never throws, returns null on error) ──────── */
async function safeFetch(url: string, token: string): Promise<any | null> {
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      console.warn(`[checklist-data] ${res.status} ${url}`);
      return null;
    }
    return res.json();
  } catch (e: any) {
    console.warn(`[checklist-data] fetch error: ${e.message}`);
    return null;
  }
}

export async function GET(req: Request) {
  console.log("===== CHECKLIST DATA =====");
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");
    if (!locationId) return Response.json({ success: false, error: "locationId required" }, { status: 400 });

    const authHeader = req.headers.get("authorization");
    if (!authHeader) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });

    /* ── user profile ── */
    const profile = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/profile/view`, {
      headers: { Authorization: authHeader },
    });
    const user = profile.data.user;
    if (!user.googleRefreshToken) return Response.json({ success: false, error: "Google not connected" }, { status: 401 });

    /* ── fresh token ── */
    let accessToken: string;
    try {
      accessToken = await refreshGoogleToken(user.googleRefreshToken);
    } catch (e: any) {
      return Response.json({ success: false, error: "Google token expired. Re-connect Google." }, { status: 401 });
    }

    /* ── account name (for v4 endpoints) ── */
    const oauth2 = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    oauth2.setCredentials({ access_token: accessToken, refresh_token: user.googleRefreshToken });
    const acctSvc = google.mybusinessaccountmanagement({ version: "v1", auth: oauth2 });
    const acctRes = await acctSvc.accounts.list();
    const accountName = acctRes.data.accounts?.[0]?.name ?? "";
    // console.log("Account:", accountName);

    const AUTH = { Authorization: `Bearer ${accessToken}` };
    const BASE_V1 = "https://mybusinessbusinessinformation.googleapis.com/v1";
    const BASE_V4 = `https://mybusiness.googleapis.com/v4`;

    /* ════════════════════════════════════════════════════════
       Fire all requests in parallel for speed
    ════════════════════════════════════════════════════════ */
    const [
      locationData,
      mediaData,
      servicesData,
      attributesData,
      reviewsData,
      postsData,
      qaData,
    ] = await Promise.all([
      /* 1. Location (service area, special hours, booking, messaging) */
      safeFetch(
        `${BASE_V1}/locations/${locationId}` +
        `?readMask=serviceArea,specialHours,mapsUrls,metadata,regularHours`,
        accessToken,
      ),

      /* 2. Media list (logo, cover, exterior, interior, product, video) */
      accountName
        ? safeFetch(`${BASE_V4}/${accountName}/locations/${locationId}/media?pageSize=100`, accessToken)
        : Promise.resolve(null),

      /* 3. Services */
      safeFetch(`${BASE_V1}/locations/${locationId}?readMask=serviceList`, accessToken),

      /* 4. Attributes */
      safeFetch(`${BASE_V1}/locations/${locationId}/attributes`, accessToken),

      /* 5. Reviews (last 50, to check reply rate, recency, negative handling) */
      accountName
        ? safeFetch(`${BASE_V4}/${accountName}/locations/${locationId}/reviews?pageSize=50&orderBy=updateTime+desc`, accessToken)
        : Promise.resolve(null),

      /* 6. Posts (last 100, to check frequency + active offer) */
      accountName
        ? safeFetch(`${BASE_V4}/${accountName}/locations/${locationId}/localPosts?pageSize=100`, accessToken)
        : Promise.resolve(null),

      /* 7. Q&A */
      accountName
        ? safeFetch(`${BASE_V4}/${accountName}/locations/${locationId}/questions?pageSize=50`, accessToken)
        : Promise.resolve(null),
    ]);

    /* ════════════════════════════════════════════════════════
       MEDIA COUNTS
    ════════════════════════════════════════════════════════ */
    let logoUploaded  = false;
    let coverUploaded = false;
    let exteriorCount = 0;
    let interiorCount = 0;
    let productCount  = 0;
    let videoCount    = 0;

    const mediaItems: any[] = mediaData?.mediaItems ?? [];
    for (const m of mediaItems) {
      const cat = (m.mediaFormat === "VIDEO") ? "VIDEO" : (m.locationAssociation?.category ?? "");
      switch (cat) {
        case "LOGO":     logoUploaded  = true; break;
        case "COVER":    coverUploaded = true; break;
        case "EXTERIOR": exteriorCount++;       break;
        case "INTERIOR": interiorCount++;       break;
        case "PRODUCT":  productCount++;        break;
        case "VIDEO":    videoCount++;          break;
      }
    }
    // console.log(`Media: logo=${logoUploaded} cover=${coverUploaded} ext=${exteriorCount} int=${interiorCount} prod=${productCount} vid=${videoCount}`);

    /* ════════════════════════════════════════════════════════
       SERVICES & PRODUCTS
    ════════════════════════════════════════════════════════ */
    const servicesCount  = (servicesData?.serviceList?.services ?? []).length;
    // Products come from a separate API in newer GBP — check locationData for products tab
    // The v4 API doesn't have a dedicated product listing endpoint accessible here,
    // so we estimate from media product count as a proxy, or default 0 if no products API.
    const productsCount  = 0; // TODO: wire up products API when available in GBP scope

    /* ════════════════════════════════════════════════════════
       ATTRIBUTES
    ════════════════════════════════════════════════════════ */
    const attrs: any[] = attributesData?.attributes ?? [];
    const attributesTotal = attrs.length;
    // An attribute is "set" if it has at least one value that is true or has content
    const attributesSet = attrs.filter(a => {
      if (a.valueType === "BOOL") return a.uriValues?.length > 0 || a.values?.some((v: any) => v === true || v === "true");
      return (a.values?.length ?? 0) > 0 || (a.uriValues?.length ?? 0) > 0;
    }).length;
    // console.log(`Attributes: ${attributesSet}/${attributesTotal}`);

    /* ════════════════════════════════════════════════════════
       LOCATION FLAGS
    ════════════════════════════════════════════════════════ */
    const serviceAreaSet  = !!(locationData?.serviceArea?.places?.placeInfos?.length ||
                                locationData?.serviceArea?.radius);
    const hasSpecialHours = (locationData?.specialHours?.specialHourPeriods ?? []).length > 0;
    const bookingUrl      = !!(locationData?.mapsUrls?.appointmentUrl || locationData?.metadata?.mapsUri);
    const messagingEnabled = !!(locationData?.metadata?.hasBusinessMessaging);

    /* ════════════════════════════════════════════════════════
       REVIEWS
    ════════════════════════════════════════════════════════ */
    const ratingMap: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
    const reviews: any[] = reviewsData?.reviews ?? [];
    const reviewCount    = reviewsData?.totalReviewCount ?? reviews.length;
    const avgRating      = reviewsData?.averageRating
      ? parseFloat(parseFloat(reviewsData.averageRating).toFixed(1))
      : reviews.length
      ? parseFloat((reviews.reduce((a: number, r: any) => a + (ratingMap[r.starRating] ?? 0), 0) / reviews.length).toFixed(1))
      : 0;

    const repliedCount   = reviews.filter((r: any) => r.reviewReply).length;
    const replyRate      = reviews.length ? Math.round((repliedCount / reviews.length) * 100) : 0;

    // Most recent review — days ago
    let lastReviewDaysAgo = 9999;
    if (reviews.length > 0 && reviews[0].createTime) {
      const ms = Date.now() - new Date(reviews[0].createTime).getTime();
      lastReviewDaysAgo = Math.floor(ms / (1000 * 60 * 60 * 24));
    }

    // All negative reviews replied?
    const negativeReviews = reviews.filter((r: any) => (ratingMap[r.starRating] ?? 5) <= 3);
    const allNegativeReplied = negativeReviews.length === 0 ||
      negativeReviews.every((r: any) => !!r.reviewReply);

    // console.log(`Reviews: count=${reviewCount} avg=${avgRating} replyRate=${replyRate}% lastReview=${lastReviewDaysAgo}d allNegReplied=${allNegativeReplied}`);

    /* ════════════════════════════════════════════════════════
       POSTS
    ════════════════════════════════════════════════════════ */
    const posts: any[] = postsData?.localPosts ?? [];
    const cutoff30d     = new Date();
    cutoff30d.setDate(cutoff30d.getDate() - 30);

    const postsLast30d  = posts.filter((p: any) => {
      const ct = p.createTime ? new Date(p.createTime) : null;
      return ct && ct >= cutoff30d;
    }).length;

    const now = new Date();
    const hasActiveOffer = posts.some((p: any) => {
      if (p.topicType !== "OFFER") return false;
      const end = p.offer?.couponCode ? null : (p.callToAction?.url ? null : null);
      // Check if the offer event end date is in the future
      if (p.event?.schedule?.endDate) {
        const ed = p.event.schedule.endDate;
        const endDateObj = new Date(`${ed.year}-${String(ed.month).padStart(2,"0")}-${String(ed.day).padStart(2,"0")}`);
        return endDateObj >= now;
      }
      // If no end date, assume LIVE offers are active
      return p.state === "LIVE";
    });

    // console.log(`Posts: last30d=$/{postsLast30d} hasOffer=${hasActiveOffer}`);

    /* ════════════════════════════════════════════════════════
       Q&A
    ════════════════════════════════════════════════════════ */
    const qaCount = (qaData?.questions ?? []).length;
    // console.log(`Q&A: ${qaCount}`);

    /* ════════════════════════════════════════════════════════
       RESPONSE
    ════════════════════════════════════════════════════════ */
    return Response.json({
      success: true,

      // Media
      logoUploaded,
      coverUploaded,
      exteriorCount,
      interiorCount,
      productCount,
      videoCount,

      // Services & products
      servicesCount,
      productsCount,

      // Attributes
      attributesSet,
      attributesTotal,

      // Location flags
      serviceAreaSet,
      hasSpecialHours,
      bookingUrl,
      messagingEnabled,

      // Reviews
      reviewCount,
      avgRating,
      replyRate,
      lastReviewDaysAgo,
      allNegativeReplied,

      // Posts
      postsLast30d,
      hasActiveOffer,

      // Q&A
      qaCount,
    });
  } catch (err: any) {
    console.error("CHECKLIST DATA ERROR:", err);
    return Response.json({ success: false, error: err.message ?? "Checklist data failed" }, { status: 500 });
  }
}