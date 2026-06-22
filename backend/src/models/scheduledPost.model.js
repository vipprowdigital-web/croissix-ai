import mongoose from "mongoose";

const scheduledPostSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    platform: { type: String, enum: ["instagram"], default: "instagram" },
    imageUrl: { type: String, required: true },
    caption: { type: String, default: "" },
    scheduledAt: { type: Date, required: true },
    status: { type: String, enum: ["pending", "published", "failed"], default: "pending" },
    errorMessage: { type: String },
    publishedAt: { type: Date },
  },
  { timestamps: true },
);

// Index for efficient scheduler queries
scheduledPostSchema.index({ status: 1, scheduledAt: 1 });

export default mongoose.model("ScheduledPost", scheduledPostSchema);
