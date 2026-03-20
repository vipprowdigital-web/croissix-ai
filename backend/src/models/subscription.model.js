// backend\src\models\subscription.model.js

import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    razorpaySubscriptionId: {
      type: String,
      required: true,
      unique: true, // prevents duplicate records
    },

    razorpayPaymentId: {
      type: String,
      default: null,
    },

    planId: {
      type: String,
      default: "starter",
    },

    status: {
      type: String,
      enum: ["created", "active", "cancelled", "failed", "expired"],
      default: "created",
    },

    currentStart: Date,
    currentEnd: Date,

    totalCount: { type: Number, default: 12 },
    paidCount: { type: Number, default: 0 },

    amount: { type: Number, default: 499 },
    currency: { type: String, default: "INR" },
  },
  {
    timestamps: true,
  },
);

/* ─────────────────────────────────────────────
   INDEXES  —  critical for 1k+ users
   1. user + status  →  fast "do I have active sub?" queries
   2. currentEnd     →  fast expiry sweep / cron jobs
   3. razorpaySubscriptionId  →  already unique, also indexed
───────────────────────────────────────────── */
subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ currentEnd: 1 });
subscriptionSchema.index({ createdAt: -1 });

export default mongoose.model("Subscription", subscriptionSchema);
