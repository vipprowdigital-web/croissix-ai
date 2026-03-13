// mobile_app\app\api\google\competitor-analysis\route.ts

// mobile_app/app/api/google/competitor-analysis/route.ts
//
// Comprehensive Competitor Analysis — real data from all GBP APIs
//
// OWN business data (real APIs):
//   - GBP v1  → location info, coords, category, hours, website, phone
//   - GBP v4  → reviews (rating, count, reply rate, dist, recents)
//   - GBP v4  → posts (total, last30d, by type: standard/offer/event)
//   - Performance API → impressions30d, calls, website clicks, directions
//   - Search Keywords API → top 10 search terms driving impressions
//
// COMPETITOR data (Google Places API):
//   - Nearby Search → same-category businesses within radius
//   - Place Details → rating, reviewCount, hours, website, phone, photo, priceLevel
//
// COMPOSITE SCORE (0–100):
//   rating   /5  × 40 pts
//   reviews  log-scaled (max 500) × 35 pts
//   profile  (website 8, phone 7, hours 6, posts 4) × 25 pts max
//
// Deploy to: mobile_app/app/api/google/competitor-analysis/route.ts

import axios from "axios";
import { google } from "googleapis";

/* ─── helpers ─────────────────────────────────────────────────── */
async function refreshGoogleToken(rt: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type:    "refresh_token",
      refresh_token: rt,
    }),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(`Token refresh failed: ${d.error}`);
  return d.access_token as string;
}

async function sf(url: string, token: string): Promise<any | null> {
  try {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) { console.warn(`[comp] ${r.status} ${url.split("?")[0]}`); return null; }
    return r.json();
  } catch (e: any) { console.warn(`[comp] fetch err: ${e.message}`); return null; }
}

function compositeScore(
  rating: number, reviews: number,
  hasWeb: boolean, hasPhone: boolean, hasHours: boolean, posts30d: number,
): number {
  const r = (rating / 5) * 40;
  const v = (Math.log(reviews + 1) / Math.log(500)) * 35;
  const p = (hasWeb ? 8 : 0) + (hasPhone ? 7 : 0) + (hasHours ? 6 : 0) +
            (posts30d >= 4 ? 4 : posts30d >= 1 ? 2 : 0);
  return Math.min(100, Math.round(r + v + p));
}

function haversine(a: number, b: number, c: number, d: number): number {
  const R = 6371000, dLat = (c - a) * Math.PI / 180, dLon = (d - b) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a * Math.PI / 180) * Math.cos(c * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
}

const GBP_TO_PLACES: Record<string, string> = {
  "gcid:music_school": "school", "gcid:dance_school": "school",
  "gcid:gym": "gym", "gcid:yoga_studio": "gym",
  "gcid:restaurant": "restaurant", "gcid:cafe": "cafe", "gcid:bakery": "bakery", "gcid:bar": "bar",
  "gcid:beauty_salon": "beauty_salon", "gcid:hair_salon": "hair_care", "gcid:spa": "spa",
  "gcid:doctor": "doctor", "gcid:dentist": "dentist", "gcid:pharmacy": "pharmacy",
  "gcid:lawyer": "lawyer", "gcid:accountant": "accounting",
  "gcid:real_estate_agency": "real_estate_agency",
  "gcid:clothing_store": "clothing_store", "gcid:electronics_store": "electronics_store",
  "gcid:jewelry_store": "jewelry_store", "gcid:supermarket": "supermarket",
  "gcid:hotel": "lodging", "gcid:school": "school", "gcid:tutoring_service": "school",
};

/* ─── types ───────────────────────────────────────────────────── */
export interface BizEntry {
  placeId:        string;
  name:           string;
  address:        string;
  rating:         number;
  reviewCount:    number;
  isOpen:         boolean | null;
  photoRef:       string | null;
  distance:       number;
  compositeScore: number;
  rank:           number;
  isOwn:          boolean;
  lat:            number;
  lng:            number;
  primaryType:    string;
  priceLevel:     number | null;
  website:        string | null;
  phone:          string | null;
  hasHours:       boolean;
  postsLast30d:   number;
  totalPosts:     number;
  postTypes:      { standard: number; offer: number; event: number };
}

export interface OwnPerf {
  impressions30d:     number;
  impressionsMaps:    number;
  impressionsSearch:  number;
  calls30d:           number;
  websiteClicks30d:   number;
  directions30d:      number;
  replyRate:          number;
  ratingDistribution: Record<number, number>;
  recentReviews: { author: string; rating: number; comment: string; date: string; replied: boolean }[];
  topKeywords:   { keyword: string; impressions: number }[];
}

export interface CompetitorAnalysisResponse {
  success:    boolean;
  error?:     string;
  own:        BizEntry;
  ownPerf:    OwnPerf;
  competitors: BizEntry[];
  all:        BizEntry[];
  meta: {
    searchRadius: number;
    totalFound:   number;
    ownRank:      number;
    ratingGap:    number;
    reviewGap:    number;
    scoreGap:     number;
    locationName: string;
    category:     string;
    searchedAt:   string;
    hasPlacesKey: boolean;
  };
}

/* ─── main ────────────────────────────────────────────────────── */
export async function GET(req: Request): Promise<Response> {
  console.log("===== COMPETITOR ANALYSIS =====");
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");
    const radius     = Math.min(Math.max(parseInt(searchParams.get("radius") ?? "1500"), 500), 50000);

    if (!locationId) return Response.json({ success: false, error: "locationId required" }, { status: 400 });
    const auth = req.headers.get("authorization");
    if (!auth)    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });

    /* 1 — user + token */
    const { data: { user } } = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/users/profile/view`,
      { headers: { Authorization: auth } },
    );
    if (!user.googleRefreshToken) return Response.json({ success: false, error: "Google not connected" }, { status: 401 });

    let tok: string;
    try {
      tok = await refreshGoogleToken(user.googleRefreshToken);
      axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile/google-token`,
        { googleAccessToken: tok }, { headers: { Authorization: auth } }).catch(() => {});
    } catch { return Response.json({ success: false, error: "Google token expired. Re-connect Google." }, { status: 401 }); }

    /* 2 — own location */
    const loc = await sf(
      `https://mybusinessbusinessinformation.googleapis.com/v1/locations/${locationId}` +
      `?readMask=title,categories,latlng,regularHours,metadata,websiteUri,phoneNumbers,storefrontAddress,profile`,
      tok,
    );
    if (!loc?.latlng) return Response.json({ success: false, error: "Could not fetch business coordinates." }, { status: 422 });

    const { latitude: lat0, longitude: lng0 } = loc.latlng;
    const ownName  = loc.title ?? "My Business";
    const ownCat   = loc.categories?.primaryCategory?.displayName ?? "";
    const gcid     = loc.categories?.primaryCategory?.name ?? "";
    const ownAddr  = [loc.storefrontAddress?.addressLines?.[0], loc.storefrontAddress?.locality].filter(Boolean).join(", ");
    const ownWeb   = loc.websiteUri ?? null;
    const ownPhone = loc.phoneNumbers?.primaryPhone ?? null;
    const ownHours = !!(loc.regularHours?.periods?.length);

    /* 3 — account name */
    const oauth2 = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    oauth2.setCredentials({ access_token: tok, refresh_token: user.googleRefreshToken });
    const acctSvc = google.mybusinessaccountmanagement({ version: "v1", auth: oauth2 });
    const acctRes = await acctSvc.accounts.list();
    const acct    = acctRes.data.accounts?.[0]?.name ?? "";
    console.log("Account:", acct);

    /* 4 — reviews */
    const RMAP: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
    let ownRating = 0, ownRevCount = 0, ownReplyRate = 0;
    const ratingDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let recentReviews: OwnPerf["recentReviews"] = [];

    if (acct) {
      const rd = await sf(
        `https://mybusiness.googleapis.com/v4/${acct}/locations/${locationId}/reviews?pageSize=50&orderBy=updateTime+desc`,
        tok,
      );
      if (rd) {
        const revs: any[] = rd.reviews ?? [];
        ownRevCount  = rd.totalReviewCount ?? revs.length;
        ownRating    = rd.averageRating ? parseFloat(parseFloat(rd.averageRating).toFixed(1))
          : revs.length ? parseFloat((revs.reduce((a: number, r: any) => a + (RMAP[r.starRating] ?? 0), 0) / revs.length).toFixed(1)) : 0;
        const replied = revs.filter(r => r.reviewReply).length;
        ownReplyRate  = revs.length ? Math.round((replied / revs.length) * 100) : 0;
        for (const r of revs) { const s = RMAP[r.starRating]; if (s) ratingDist[s]++; }
        recentReviews = revs.slice(0, 8).map(r => ({
          author:  r.reviewer?.displayName ?? "Anonymous",
          rating:  RMAP[r.starRating] ?? 0,
          comment: r.comment ?? "",
          date:    r.createTime,
          replied: !!r.reviewReply,
        }));
      }
    }
    console.log(`Reviews: ${ownRevCount} avg:${ownRating} reply:${ownReplyRate}%`);

    /* 5 — posts */
    let posts30d = 0, postsTotal = 0;
    const postTypes = { standard: 0, offer: 0, event: 0 };
    if (acct) {
      const pd = await sf(`https://mybusiness.googleapis.com/v4/${acct}/locations/${locationId}/localPosts?pageSize=100`, tok);
      if (pd) {
        const posts: any[] = pd.localPosts ?? [];
        postsTotal = posts.length;
        const cut = new Date(); cut.setDate(cut.getDate() - 30);
        for (const p of posts) {
          const ct = p.createTime ? new Date(p.createTime) : null;
          if (ct && ct >= cut) posts30d++;
          if (p.topicType === "STANDARD") postTypes.standard++;
          if (p.topicType === "OFFER")    postTypes.offer++;
          if (p.topicType === "EVENT")    postTypes.event++;
        }
      }
    }
    console.log(`Posts: last30d=${posts30d} total=${postsTotal}`);

    /* 6 — performance + keywords */
    let imp30d = 0, impMaps = 0, impSearch = 0, calls30d = 0, webClicks = 0, dirs30d = 0;
    const topKeywords: OwnPerf["topKeywords"] = [];
    try {
      const ed = new Date(); ed.setDate(ed.getDate() - 2);
      const sd = new Date(ed); sd.setDate(ed.getDate() - 30);
      const qp = new URLSearchParams();
      ["BUSINESS_IMPRESSIONS_DESKTOP_MAPS","BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
       "BUSINESS_IMPRESSIONS_MOBILE_MAPS","BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
       "CALL_CLICKS","WEBSITE_CLICKS","BUSINESS_DIRECTION_REQUESTS"].forEach(m => qp.append("dailyMetrics", m));
      const fmt = (d: Date) => [d.getFullYear(), d.getMonth() + 1, d.getDate()];
      const [sy,sm,sd2] = fmt(sd); const [ey,em,ed2] = fmt(ed);
      qp.set("dailyRange.start_date.year", String(sy)); qp.set("dailyRange.start_date.month", String(sm)); qp.set("dailyRange.start_date.day", String(sd2));
      qp.set("dailyRange.end_date.year",   String(ey)); qp.set("dailyRange.end_date.month",   String(em)); qp.set("dailyRange.end_date.day",   String(ed2));

      const pr = await fetch(
        `https://businessprofileperformance.googleapis.com/v1/locations/${locationId}:fetchMultiDailyMetricsTimeSeries?${qp}`,
        { headers: { Authorization: `Bearer ${tok}` } },
      );
      if (pr.ok) {
        const pj = await pr.json();
        const sm2: Record<string, number> = {};
        for (const entry of pj.multiDailyMetricTimeSeries ?? []) {
          const topM: string | undefined = entry.dailyMetric;
          const inner: any[] = entry.dailyMetricTimeSeries ?? [];
          if (topM && inner.length > 0) {
            sm2[topM] = (inner[0]?.timeSeries?.datedValues ?? [])
              .reduce((a: number, dv: any) => a + (parseInt(dv.value ?? "0", 10) || 0), 0);
          } else {
            for (const s of inner) {
              const k = s.dailyMetric ?? s.metric ?? "";
              sm2[k] = (sm2[k] ?? 0) + (s.timeSeries?.datedValues ?? [])
                .reduce((a: number, dv: any) => a + (parseInt(dv.value ?? "0", 10) || 0), 0);
            }
          }
        }
        impMaps   = (sm2["BUSINESS_IMPRESSIONS_DESKTOP_MAPS"] ?? 0) + (sm2["BUSINESS_IMPRESSIONS_MOBILE_MAPS"] ?? 0);
        impSearch = (sm2["BUSINESS_IMPRESSIONS_DESKTOP_SEARCH"] ?? 0) + (sm2["BUSINESS_IMPRESSIONS_MOBILE_SEARCH"] ?? 0);
        imp30d    = impMaps + impSearch;
        calls30d  = sm2["CALL_CLICKS"] ?? 0;
        webClicks = sm2["WEBSITE_CLICKS"] ?? 0;
        dirs30d   = sm2["BUSINESS_DIRECTION_REQUESTS"] ?? 0;
        console.log(`Perf: imp=${imp30d} calls=${calls30d} web=${webClicks} dirs=${dirs30d}`);
      }

      // search keywords
      const kwp = new URLSearchParams();
      kwp.set("monthlyRange.start_month.year",  String(sy)); kwp.set("monthlyRange.start_month.month", String(sm));
      kwp.set("monthlyRange.end_month.year",    String(ey)); kwp.set("monthlyRange.end_month.month",   String(em));
      const kr = await fetch(
        `https://businessprofileperformance.googleapis.com/v1/locations/${locationId}/searchkeywords/impressions/monthly?${kwp}`,
        { headers: { Authorization: `Bearer ${tok}` } },
      );
      if (kr.ok) {
        const kj = await kr.json();
        const kwMap: Record<string, number> = {};
        for (const kw of kj.searchKeywordsCounts ?? []) {
          const word = kw.searchKeyword as string;
          const imp  = typeof kw.insightsValue?.value === "number" ? kw.insightsValue.value : 0;
          kwMap[word] = (kwMap[word] ?? 0) + imp;
        }
        Object.entries(kwMap).sort((a, b) => b[1] - a[1]).slice(0, 10)
          .forEach(([keyword, impressions]) => topKeywords.push({ keyword, impressions }));
        console.log(`Keywords: ${topKeywords.length}`);
      }
    } catch (e: any) { console.warn(`[comp] Perf API: ${e.message}`); }

    /* 7 — nearby Places */
    const PLACES_KEY = process.env.GOOGLE_MAPS_API_KEY ?? "";
    const placesType = GBP_TO_PLACES[gcid] ?? "establishment";
    let nearby: any[] = [];

    if (PLACES_KEY) {
      try {
        let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat0},${lng0}&radius=${radius}&type=${placesType}&key=${PLACES_KEY}`;
        const nr = await fetch(url); const nd = await nr.json();
        if (nd.status === "OK") { nearby = nd.results ?? []; }
        else {
          const ru = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat0},${lng0}&radius=${radius}&keyword=${encodeURIComponent(ownCat)}&key=${PLACES_KEY}`;
          const rr = await fetch(ru); const rd2 = await rr.json();
          nearby = rd2.results ?? [];
        }
        console.log(`Places: ${nearby.length}`);
      } catch (e: any) { console.warn(`[comp] Places: ${e.message}`); }
    }

    /* 8 — place details */
    async function details(pid: string): Promise<any | null> {
      if (!PLACES_KEY) return null;
      try {
        const r = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${pid}` +
          `&fields=place_id,name,formatted_address,geometry,rating,user_ratings_total,opening_hours,photos,website,formatted_phone_number,types,price_level&key=${PLACES_KEY}`,
        );
        const d = await r.json();
        return d.status === "OK" ? d.result : null;
      } catch { return null; }
    }

    const top9    = nearby.slice(0, 9);
    const dets    = await Promise.all(top9.map(p => details(p.place_id)));
    const compList: BizEntry[] = dets.map((d, i) => {
      const nb = top9[i]; if (!d && !nb) return null;
      const det  = d ?? {};
      const lt2  = det.geometry?.location?.lat ?? nb?.geometry?.location?.lat ?? lat0;
      const ln2  = det.geometry?.location?.lng ?? nb?.geometry?.location?.lng ?? lng0;
      const rat  = det.rating ?? nb?.rating ?? 0;
      const cnt  = det.user_ratings_total ?? nb?.user_ratings_total ?? 0;
      const hw   = !!(det.website);
      const hp   = !!(det.formatted_phone_number ?? nb?.formatted_phone_number);
      const hh   = !!(det.opening_hours);
      return {
        placeId:        det.place_id ?? nb?.place_id ?? "",
        name:           det.name ?? nb?.name ?? "Unknown",
        address:        det.formatted_address ?? nb?.vicinity ?? "",
        rating:         rat,
        reviewCount:    cnt,
        isOpen:         det.opening_hours?.open_now ?? nb?.opening_hours?.open_now ?? null,
        photoRef:       det.photos?.[0]?.photo_reference ?? nb?.photos?.[0]?.photo_reference ?? null,
        distance:       haversine(lat0, lng0, lt2, ln2),
        compositeScore: compositeScore(rat, cnt, hw, hp, hh, 0),
        rank:           0,
        isOwn:          false,
        lat:            lt2, lng: ln2,
        primaryType:    (det.types ?? nb?.types ?? [])[0] ?? "",
        priceLevel:     det.price_level ?? nb?.price_level ?? null,
        website:        det.website ?? null,
        phone:          det.formatted_phone_number ?? nb?.formatted_phone_number ?? null,
        hasHours:       hh,
        postsLast30d:   0, totalPosts: 0,
        postTypes:      { standard: 0, offer: 0, event: 0 },
      } satisfies BizEntry;
    }).filter((c): c is BizEntry => c !== null);

    /* 9 — own entry */
    const ownEntry: BizEntry = {
      placeId: locationId, name: ownName, address: ownAddr,
      rating: ownRating, reviewCount: ownRevCount,
      isOpen: null, photoRef: null, distance: 0,
      compositeScore: compositeScore(ownRating, ownRevCount, !!ownWeb, !!ownPhone, ownHours, posts30d),
      rank: 0, isOwn: true,
      lat: lat0, lng: lng0, primaryType: placesType, priceLevel: null,
      website: ownWeb, phone: ownPhone, hasHours: ownHours,
      postsLast30d: posts30d, totalPosts: postsTotal, postTypes,
    };

    /* 10 — rank */
    const all = [...compList, ownEntry].sort((a, b) => b.compositeScore - a.compositeScore);
    all.forEach((c, i) => { c.rank = i + 1; });
    const ownFinal = all.find(c => c.isOwn)!;
    const top1     = all[0];
    const ratingGap = parseFloat((ownFinal.rating - top1.rating).toFixed(1));
    const reviewGap = ownFinal.reviewCount - top1.reviewCount;
    const scoreGap  = Math.round(ownFinal.compositeScore - top1.compositeScore);

    console.log(`Rank: #${ownFinal.rank}/${all.length} scoreGap:${scoreGap}`);

    return Response.json({
      success:     true,
      own:         ownFinal,
      ownPerf: {
        impressions30d: imp30d, impressionsMaps: impMaps, impressionsSearch: impSearch,
        calls30d, websiteClicks30d: webClicks, directions30d: dirs30d,
        replyRate: ownReplyRate, ratingDistribution: ratingDist,
        recentReviews, topKeywords,
      },
      competitors: all.filter(c => !c.isOwn),
      all,
      meta: {
        searchRadius: radius, totalFound: all.length,
        ownRank: ownFinal.rank, ratingGap, reviewGap, scoreGap,
        locationName: ownName, category: ownCat,
        searchedAt: new Date().toISOString(),
        hasPlacesKey: !!PLACES_KEY,
      },
    } satisfies CompetitorAnalysisResponse);

  } catch (err: any) {
    console.error("COMPETITOR ERROR:", err);
    return Response.json({ success: false, error: err.message ?? "Failed" }, { status: 500 });
  }
}