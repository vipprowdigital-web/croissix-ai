// backend\src\jobs\autoReply.job.js
//
// Automatic, human-paced replies to Google Business Profile reviews.
//
//   POLL   (every 5 min)  find new unreplied reviews and put them in a queue,
//                         each with a randomised send time
//   WORKER (every 1 min)  send the queue items whose time has come
//
// Timing rules
//   - first reply is scheduled 2-5 min after we notice the review
//   - consecutive replies for the same location are 30-60 s apart
//   - a reply is scheduled no later than 30 min after the review was posted
//     (the gap shrinks to 30 s if a burst would otherwise overrun that)
//   - only reviews posted AFTER the user switched auto-reply on are answered

import { google } from "googleapis";
import User from "../models/user.model.js";
import Business from "../models/business.model.js";
import Subscription from "../models/subscription.model.js";
import AutoReply from "../models/autoReply.model.js";
import { generateReviewReply } from "../services/reviewReplyAi.js";

const MIN = 60 * 1000;
const SEC = 1000;

const POLL_MS = Number(process.env.AUTO_REPLY_POLL_MS) || 5 * MIN;
const WORKER_MS = 1 * MIN;

const FIRST_DELAY = [2 * MIN, 5 * MIN];
const GAP = [30 * SEC, 60 * SEC];
const MAX_AFTER_REVIEW = 30 * MIN;
const MAX_ATTEMPTS = 3;
const STALE_LOCK = 5 * MIN;

const STARS = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

const rand = ([min, max]) => min + Math.random() * (max - min);

/* ── Google helpers ─────────────────────────────────────────────── */

const clientFor = (user) => {
  const c = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  c.setCredentials({ refresh_token: user.googleRefreshToken });
  return c;
};

class GoogleHttpError extends Error {
  constructor(status, body) {
    super(body?.error?.message || `Google API error (${status})`);
    this.status = status;
    this.body = body;
  }
}

const gFetch = async (client, url, init = {}) => {
  const auth = await client.getRequestHeaders();
  const res = await fetch(url, {
    ...init,
    headers: { ...auth, "Content-Type": "application/json", ...init.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new GoogleHttpError(res.status, body);
  return body;
};

// Refresh token revoked / expired -> the user has to reconnect Google
const isAuthError = (e) =>
  /invalid_grant|invalid_client|unauthorized_client/i.test(
    `${e?.message} ${e?.response?.data?.error}`,
  ) || e?.status === 401;

const accountCache = new Map(); // `${userId}:${locationId}` -> accounts/123

const listReviews = async (client, userId, locationId) => {
  const key = `${userId}:${locationId}`;
  const cached = accountCache.get(key);

  const fetchFrom = (account) =>
    gFetch(
      client,
      `https://mybusiness.googleapis.com/v4/${account}/locations/${locationId}/reviews?pageSize=50`,
    );

  if (cached) {
    try {
      return (await fetchFrom(cached)).reviews || [];
    } catch (e) {
      if (isAuthError(e)) throw e;
      accountCache.delete(key);
    }
  }

  // A user can have several Google accounts (personal + groups): find the
  // one that owns this location.
  const accountService = google.mybusinessaccountmanagement({
    version: "v1",
    auth: client,
  });
  const { data } = await accountService.accounts.list({});
  let lastError;
  for (const acc of data.accounts || []) {
    try {
      const body = await fetchFrom(acc.name);
      accountCache.set(key, acc.name);
      return body.reviews || [];
    } catch (e) {
      if (isAuthError(e)) throw e;
      lastError = e;
    }
  }
  if (lastError) throw lastError;
  return [];
};

/* ── eligibility ────────────────────────────────────────────────── */

const hasActiveAccess = async (user) => {
  if (user.freeAccess) return true;
  const sub = await Subscription.findOne({ user: user._id, status: "active" })
    .sort({ currentEnd: -1 })
    .lean();
  return !!sub && (!sub.currentEnd || new Date(sub.currentEnd) > new Date());
};

// Free-access accounts may have many profiles; everyone else has one.
const locationsOf = (user) => {
  if (user.freeAccess && user.googleLocations?.length) {
    return user.googleLocations.map((l) => ({
      id: l.locationId,
      name: l.locationName,
    }));
  }
  return user.googleLocationId
    ? [{ id: user.googleLocationId, name: user.googleLocationName }]
    : [];
};

const disableForReconnect = async (userId) => {
  await User.updateOne(
    { _id: userId },
    { $set: { "autoReply.enabled": false, "autoReply.needsReconnect": true } },
  );
  await AutoReply.updateMany(
    { user: userId, status: "pending" },
    { $set: { status: "skipped", error: "Google needs to be reconnected" } },
  );
  console.warn(`[auto-reply] user ${userId}: Google token rejected, disabled`);
};

/* ── POLL: find new reviews and schedule them ───────────────────── */

const enqueueForLocation = async (user, loc) => {
  const client = clientFor(user);
  const reviews = await listReviews(client, user._id.toString(), loc.id);

  const enabledAt = user.autoReply.enabledAt
    ? new Date(user.autoReply.enabledAt)
    : new Date();

  const fresh = reviews
    .filter(
      (r) =>
        !r.reviewReply?.comment &&
        r.name &&
        new Date(r.createTime) >= enabledAt,
    )
    .sort((a, b) => new Date(a.createTime) - new Date(b.createTime));
  if (fresh.length === 0) return;

  const known = new Set(
    (
      await AutoReply.find({ reviewName: { $in: fresh.map((r) => r.name) } })
        .select("reviewName")
        .lean()
    ).map((d) => d.reviewName),
  );

  const lastDoc = await AutoReply.findOne({
    user: user._id,
    locationId: loc.id,
    status: { $in: ["pending", "sending", "sent"] },
  })
    .sort({ dueAt: -1 })
    .select("dueAt")
    .lean();
  let last = lastDoc ? new Date(lastDoc.dueAt).getTime() : 0;

  for (const r of fresh) {
    if (known.has(r.name)) continue;

    const now = Date.now();
    const base = now + rand(FIRST_DELAY);
    const deadline = Math.max(
      new Date(r.createTime).getTime() + MAX_AFTER_REVIEW,
      now + 10 * MIN,
    );

    let due = Math.max(base, last ? last + rand(GAP) : 0);
    // A big burst would overrun the 30 min limit: tighten the gap to 30 s
    if (due > deadline && last) due = Math.max(base, last + GAP[0]);
    // Still too late: leave the rest for the next poll (the queue will have drained)
    if (due > deadline) break;

    try {
      await AutoReply.create({
        user: user._id,
        locationId: loc.id,
        locationName: loc.name,
        reviewName: r.name,
        reviewerName: r.reviewer?.displayName,
        rating: STARS[r.starRating],
        comment: r.comment || "",
        reviewCreatedAt: r.createTime,
        dueAt: new Date(due),
      });
      last = due;
    } catch (e) {
      if (e.code !== 11000) throw e; // already queued by another run
    }
  }
};

let polling = false;

export const pollOnce = async () => {
  if (polling) return;
  polling = true;
  try {
    const users = await User.find({
      "autoReply.enabled": true,
      googleRefreshToken: { $exists: true, $ne: null },
    }).lean();

    for (const user of users) {
      try {
        if (!(await hasActiveAccess(user))) continue;
        for (const loc of locationsOf(user)) {
          await enqueueForLocation(user, loc);
        }
      } catch (e) {
        if (isAuthError(e)) await disableForReconnect(user._id);
        else console.error(`[auto-reply] poll user ${user._id}:`, e.message);
      }
    }
  } finally {
    polling = false;
  }
};

/* ── WORKER: send what is due ───────────────────────────────────── */

const finish = (item, fields) =>
  AutoReply.updateOne({ _id: item._id }, { $set: fields });

const processItem = async (item) => {
  const user = await User.findById(item.user).lean();

  if (!user?.autoReply?.enabled || user.autoReply.needsReconnect) {
    return finish(item, { status: "skipped", error: "Auto-reply is off" });
  }
  if (!(await hasActiveAccess(user))) {
    return finish(item, { status: "skipped", error: "No active plan" });
  }

  try {
    const client = clientFor(user);

    // Re-check right before sending: the owner may have replied manually
    let current;
    try {
      current = await gFetch(
        client,
        `https://mybusiness.googleapis.com/v4/${item.reviewName}`,
      );
    } catch (e) {
      if (e.status === 404) {
        return finish(item, { status: "skipped", error: "Review was deleted" });
      }
      throw e;
    }
    if (current.reviewReply?.comment) {
      return finish(item, { status: "skipped", error: "Already replied" });
    }

    const business = await Business.findOne({ owner: user._id }).lean();
    const replyText = await generateReviewReply({
      review: item.comment || "",
      rating: item.rating,
      reviewerName: item.reviewerName,
      businessName: item.locationName || business?.businessName,
      businessLocation: [business?.city, business?.state]
        .filter(Boolean)
        .join(", "),
      tone: user.autoReply.tone,
    });

    await gFetch(
      client,
      `https://mybusiness.googleapis.com/v4/${item.reviewName}/reply`,
      { method: "PUT", body: JSON.stringify({ comment: replyText }) },
    );

    await finish(item, {
      status: "sent",
      replyText,
      sentAt: new Date(),
      error: undefined,
    });
  } catch (e) {
    if (isAuthError(e)) {
      await finish(item, { status: "failed", error: "Google needs reconnecting" });
      return disableForReconnect(user._id);
    }
    if (item.attempts < MAX_ATTEMPTS) {
      // back off: 2 min, then 4 min
      return finish(item, {
        status: "pending",
        dueAt: new Date(Date.now() + item.attempts * 2 * MIN),
        error: e.message,
      });
    }
    await finish(item, { status: "failed", error: e.message });
  }
};

let working = false;

export const workOnce = async () => {
  if (working) return;
  working = true;
  try {
    // A crashed run can leave items stuck in "sending"
    await AutoReply.updateMany(
      { status: "sending", lockedAt: { $lt: new Date(Date.now() - STALE_LOCK) } },
      { $set: { status: "pending" } },
    );

    for (let i = 0; i < 10; i++) {
      // Atomic claim, so two backend instances never send the same reply
      const item = await AutoReply.findOneAndUpdate(
        { status: "pending", dueAt: { $lte: new Date() } },
        { $set: { status: "sending", lockedAt: new Date() }, $inc: { attempts: 1 } },
        { sort: { dueAt: 1 }, new: true },
      );
      if (!item) break;
      await processItem(item);
    }
  } catch (e) {
    console.error("[auto-reply] worker:", e.message);
  } finally {
    working = false;
  }
};

/* ── start ──────────────────────────────────────────────────────── */

export const startAutoReplyJobs = () => {
  if (process.env.AUTO_REPLY_ENABLED === "false") {
    console.log("[auto-reply] disabled by AUTO_REPLY_ENABLED=false");
    return;
  }
  if (!process.env.GROQ_API_KEY) {
    console.warn("[auto-reply] GROQ_API_KEY is not set - replies will fail");
  }

  const safe = (fn) => () =>
    fn().catch((e) => console.error("[auto-reply]", e.message));

  setTimeout(safe(pollOnce), 30 * SEC);
  setInterval(safe(pollOnce), POLL_MS);
  setInterval(safe(workOnce), WORKER_MS);

  console.log(
    `[auto-reply] started (poll ${POLL_MS / MIN} min, send check ${WORKER_MS / MIN} min)`,
  );
};
