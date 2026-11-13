// backend\src\models\autoReply.model.js
//
// Queue of automatic review replies. One document per Google review, so a
// review can never be replied to twice (unique reviewName).

import mongoose from "mongoose";

const autoReplySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    locationId: { type: String, required: true },
    locationName: { type: String },

    // accounts/{a}/locations/{l}/reviews/{r}
    reviewName: { type: String, required: true, unique: true },
    reviewerName: { type: String },
    rating: { type: Number },
    comment: { type: String },
    reviewCreatedAt: { type: Date },

    status: {
      type: String,
      enum: ["pending", "sending", "sent", "failed", "skipped"],
      default: "pending",
    },
    dueAt: { type: Date, required: true },
    lockedAt: { type: Date },
    attempts: { type: Number, default: 0 },

    replyText: { type: String },
    error: { type: String },
    sentAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

// Worker: "what is due now?"
autoReplySchema.index({ status: 1, dueAt: 1 });
// Scheduling: "when was the last reply for this location scheduled?"
autoReplySchema.index({ user: 1, locationId: 1, dueAt: -1 });

export default mongoose.model("AutoReply", autoReplySchema);
