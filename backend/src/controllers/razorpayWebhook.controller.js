// backend/src/controllers/razorpayWebhook.controller.js

import crypto from "crypto";
import Subscription from "../models/subscription.model.js";
import User from "../models/user.model.js";

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function verifyWebhookSignature(rawBody, signature) {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(signature, "hex"),
  );
}

async function syncSubscriptionFromPayload(payload) {
  const { subscription, payment } = payload;
  const subId = subscription?.entity?.id ?? payload?.subscription_id;
  if (!subId) return null;

  return Subscription.findOne({ razorpaySubscriptionId: subId });
}

/* ─────────────────────────────────────────────
   STATUS MAP  —  Razorpay event → our status
───────────────────────────────────────────── */
const EVENT_STATUS_MAP = {
  "subscription.activated": "active",
  "subscription.charged": "active",
  "subscription.completed": "expired",
  "subscription.cancelled": "cancelled",
  "subscription.halted": "failed",
  "subscription.paused": "cancelled",
  "subscription.resumed": "active",
  "payment.failed": null, // handled separately
};

/* ─────────────────────────────────────────────
   MAIN WEBHOOK HANDLER
───────────────────────────────────────────── */
export const razorpayWebhook = async (req, res) => {
  // 1. Respond fast — Razorpay retries if we don't ACK within 5s
  res.status(200).json({ received: true });

  const signature = req.headers["x-razorpay-signature"];
  if (!signature) {
    console.warn("[webhook] Missing signature header");
    return;
  }

  // 2. Verify signature (raw body required — set in app.js)
  let rawBody;
  try {
    rawBody =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body); // fallback

    if (!verifyWebhookSignature(rawBody, signature)) {
      console.warn("[webhook] Invalid signature — rejected");
      return;
    }
  } catch (err) {
    console.error("[webhook] Signature check error:", err.message);
    return;
  }

  // 3. Parse event
  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    console.error("[webhook] Could not parse body");
    return;
  }

  const { event: eventType, payload } = event;
  console.log("[webhook] event:", eventType);

  try {
    switch (eventType) {
      // ── New subscription activated (first charge or trial start) ──
      case "subscription.activated": {
        const rzSub = payload?.subscription?.entity;
        if (!rzSub) break;

        await Subscription.findOneAndUpdate(
          { razorpaySubscriptionId: rzSub.id },
          {
            status: "active",
            currentStart: new Date(rzSub.current_start * 1000),
            currentEnd: new Date(rzSub.current_end * 1000),
            paidCount: rzSub.paid_count ?? 1,
            totalCount: rzSub.total_count,
          },
        );
        break;
      }

      // ── Renewal payment charged successfully ──
      case "subscription.charged": {
        const rzSub = payload?.subscription?.entity;
        const rzPay = payload?.payment?.entity;
        if (!rzSub) break;

        const newEnd = new Date(rzSub.current_end * 1000);

        const sub = await Subscription.findOneAndUpdate(
          { razorpaySubscriptionId: rzSub.id },
          {
            status: "active",
            currentStart: new Date(rzSub.current_start * 1000),
            currentEnd: newEnd,
            paidCount: rzSub.paid_count,
            razorpayPaymentId: rzPay?.id,
            amount: rzPay ? rzPay.amount / 100 : undefined,
          },
          { new: true },
        );

        if (sub?.user) {
          await User.findByIdAndUpdate(sub.user, {
            subscriptionStatus: "active",
            expiresAt: newEnd,
          });
        }
        break;
      }

      // ── User or admin cancelled ──
      case "subscription.cancelled": {
        const rzSub = payload?.subscription?.entity;
        if (!rzSub) break;

        const sub = await Subscription.findOneAndUpdate(
          { razorpaySubscriptionId: rzSub.id },
          { status: "cancelled" },
          { new: true },
        );

        if (sub?.user) {
          await User.findByIdAndUpdate(sub.user, {
            subscriptionStatus: "cancelled",
          });
        }
        break;
      }

      // ── All billing cycles completed ──
      case "subscription.completed": {
        const rzSub = payload?.subscription?.entity;
        if (!rzSub) break;

        const sub = await Subscription.findOneAndUpdate(
          { razorpaySubscriptionId: rzSub.id },
          { status: "expired" },
          { new: true },
        );

        if (sub?.user) {
          await User.findByIdAndUpdate(sub.user, {
            subscriptionStatus: "expired",
          });
        }
        break;
      }

      // ── Subscription halted (too many payment failures) ──
      case "subscription.halted": {
        const rzSub = payload?.subscription?.entity;
        if (!rzSub) break;

        const sub = await Subscription.findOneAndUpdate(
          { razorpaySubscriptionId: rzSub.id },
          { status: "failed" },
          { new: true },
        );

        if (sub?.user) {
          await User.findByIdAndUpdate(sub.user, {
            subscriptionStatus: "failed",
          });
        }
        break;
      }

      // ── Subscription resumed after pause ──
      case "subscription.resumed": {
        const rzSub = payload?.subscription?.entity;
        if (!rzSub) break;

        const sub = await Subscription.findOneAndUpdate(
          { razorpaySubscriptionId: rzSub.id },
          {
            status: "active",
            currentEnd: rzSub.current_end
              ? new Date(rzSub.current_end * 1000)
              : undefined,
          },
          { new: true },
        );

        if (sub?.user) {
          await User.findByIdAndUpdate(sub.user, {
            subscriptionStatus: "active",
          });
        }
        break;
      }

      // ── Individual payment failed (not yet halted) ──
      case "payment.failed": {
        const rzPay = payload?.payment?.entity;
        const subId = rzPay?.subscription_id;
        if (!subId) break;

        // Don't downgrade status yet — Razorpay will retry.
        // Just log for monitoring/alerting purposes.
        console.warn(
          `[webhook] payment.failed subId=${subId} reason=${rzPay?.error_description}`,
        );
        break;
      }

      default:
        console.log(`[webhook] unhandled event: ${eventType}`);
    }
  } catch (err) {
    // Never let DB errors kill the 200 we already sent
    console.error(`[webhook] handler error for ${eventType}:`, err.message);
  }
};
