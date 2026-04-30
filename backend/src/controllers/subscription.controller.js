// backend/src/controllers/subscription.controller.js

import Razorpay from "razorpay";
import crypto from "crypto";
import Subscription from "../models/subscription.model.js";
import User from "../models/user.model.js";

// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_TEST_KEY_ID,
//   key_secret: process.env.RAZORPAY_TEST_KEY_SECRET,
// });
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ─────────────────────────────────────────────
   CREATE SUBSCRIPTION
   POST /api/v1/subscription/create
   Body: { planId }
───────────────────────────────────────────── */
export const createSubscription = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;
    console.log("Creating subscription for planId: ", planId);

    if (!planId) {
      return res.status(400).json({ message: "planId is required" });
    }

    // 🔥 Prevent duplicate (active + created)
    const existing = await Subscription.findOne({
      user: userId,
      status: { $in: ["active", "created"] },
    }).lean();

    console.log("Existing subscription: ", existing);

    if (existing) {
      return res.status(200).json({
        subscriptionId: existing.razorpaySubscriptionId,
        reused: true, // 🔥 important for frontend
      });
    }

    // 🔥 Create subscription in Razorpay
    const rzSub = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 12,
      customer_notify: 1,
      quantity: 1,
      notes: {
        userId: userId.toString(),
        planId,
      },
    });

    console.log("Subscription from razorpay: ", rzSub);

    // 🔥 Save
    await Subscription.create({
      user: userId,
      razorpaySubscriptionId: rzSub.id,
      planId,
      status: "created",
      totalCount: 12,
      paidCount: 0,
      amount: 599,
      // amount: 1,
    });

    return res.json({
      subscriptionId: rzSub.id,
      reused: false,
    });
  } catch (err) {
    console.error("[createSubscription]", err);

    return res.status(500).json({
      message: err?.error?.description || "Failed to create subscription",
    });
  }
};

/* ─────────────────────────────────────────────
   VERIFY PAYMENT
   POST /api/v1/subscription/verify
   Body: { razorpay_payment_id, razorpay_subscription_id,
           razorpay_signature, planId }
───────────────────────────────────────────── */
export const verifySubscription = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
      planId,
    } = req.body;

    if (!planId && !razorpay_subscription_id) {
      console.log("Invalid payload: ", planId, " ", razorpay_subscription_id);

      return res.status(400).json({ message: "Invalid payload" });
    }

    const userId = req.user.id;

    // ── Input validation ─────────────────────────────────────
    if (
      !razorpay_payment_id ||
      !razorpay_subscription_id ||
      !razorpay_signature
    ) {
      console.log(
        "Missing fields: ",
        razorpay_payment_id,
        " ",
        razorpay_signature,
        " ",
        razorpay_subscription_id,
      );

      return res
        .status(400)
        .json({ success: false, message: "Missing payment fields" });
    }

    // ── Signature verification ───────────────────────────────
    // const generated = crypto
    //   .createHmac("sha256", process.env.RAZORPAY_TEST_KEY_SECRET)
    //   .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
    //   .digest("hex");
    const generated = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest("hex");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(generated, "hex"),
        Buffer.from(razorpay_signature, "hex"),
      )
    ) {
      console.log("Signature mismatch");
      return res
        .status(400)
        .json({ success: false, message: "Signature mismatch" });
    }

    // ── Idempotency: already verified? ──────────────────────
    const existing = await Subscription.findOne({
      razorpaySubscriptionId: razorpay_subscription_id,
      status: "active",
    }).lean();

    if (existing) {
      return res.json({
        success: true,
        subscriptionId: razorpay_subscription_id,
      });
    }

    // ── Fetch from Razorpay for accurate dates ────────────────
    let rzSub;
    try {
      rzSub = await razorpay.subscriptions.fetch(razorpay_subscription_id);
    } catch {
      // Non-fatal: fall back to 30-day expiry
      rzSub = null;
    }
    console.log("Razorpay subs: ", rzSub);

    const now = new Date();
    const currentEnd = rzSub?.current_end
      ? new Date(rzSub.current_end * 1000)
      : new Date(now.getTime() + 30 * 86400000);

    // ── Upsert subscription ──────────────────────────────────
    await Subscription.findOneAndUpdate(
      { razorpaySubscriptionId: razorpay_subscription_id },
      {
        user: userId,
        razorpayPaymentId: razorpay_payment_id,
        planId: planId ?? rzSub?.plan_id,
        status: "active",
        currentStart: now,
        currentEnd,
        paidCount: 1,
        totalCount: rzSub?.total_count ?? 12,
        amount: 599,
        // amount: 1,
      },
      { upsert: true, new: true },
    );

    // ── Update user ──────────────────────────────────────────
    await User.findByIdAndUpdate(userId, {
      subscriptionStatus: "active",
      plan: planId ?? "starter",
      expiresAt: currentEnd,
    });

    console.log("Razorpay verified user: ", await User.find({ _id: userId }));

    return res.json({
      success: true,
      subscriptionId: razorpay_subscription_id,
    });
  } catch (err) {
    console.error("[verifySubscription]", err);
    return res
      .status(500)
      .json({ success: false, message: "Verification failed" });
  }
};

/* ─────────────────────────────────────────────
   GET MY SUBSCRIPTION
   GET /api/v1/subscription/me
───────────────────────────────────────────── */
export const getMySubscription = async (req, res) => {
  try {
    const sub = await Subscription.findOne({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    console.log("sub: ", sub);

    if (!sub) {
      return res.json(null);
    }

    // Auto-expire if past currentEnd
    if (
      sub.status === "active" &&
      sub.currentEnd &&
      new Date(sub.currentEnd) < new Date()
    ) {
      await Subscription.findByIdAndUpdate(sub._id, { status: "expired" });
      await User.findByIdAndUpdate(req.user.id, {
        subscriptionStatus: "expired",
      });
      sub.status = "expired";
    }

    return res.json(sub);
  } catch (err) {
    console.error("[getMySubscription]", err);
    return res.status(500).json({ message: "Error fetching subscription" });
  }
};

/* ─────────────────────────────────────────────
   CANCEL SUBSCRIPTION
   POST /api/v1/subscription/cancel/:subscriptionId
───────────────────────────────────────────── */
export const cancelSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const userId = req.user.id;

    // ── Ownership check ──────────────────────────────────────
    const sub = await Subscription.findOne({
      razorpaySubscriptionId: subscriptionId,
      user: userId,
    }).lean();

    if (!sub) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    if (sub.status === "cancelled") {
      return res.json({ success: true, message: "Already cancelled" });
    }

    // ── Cancel on Razorpay (cancel_at_cycle_end = 1 = graceful) ──
    // await razorpay.subscriptions.cancel(subscriptionId, true);
    const rzpResponse = await razorpay.subscriptions.cancel(subscriptionId, 0); // 0 - immediate cancel

    // await Subscription.findByIdAndUpdate(sub._id, { status: "cancelled" });
    // await User.findByIdAndUpdate(userId, { subscriptionStatus: "cancelled" });
    // Only update DB if Razorpay confirmed the cancellation
    if (rzpResponse && rzpResponse.status === "cancelled") {
      await Subscription.findByIdAndUpdate(sub._id, { status: "cancelled" });
      await User.findByIdAndUpdate(userId, { subscriptionStatus: "cancelled" });
    } else {
      return res
        .status(502)
        .json({ message: "Razorpay did not confirm cancellation" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("[cancelSubscription]", err);
    return res.status(500).json({ message: "Cancel failed" });
  }
};
