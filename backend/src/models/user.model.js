// backend\src\models\user.model.js

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      required: false,
    },
    provider: {
      type: String,
      default: "credentials",
    },
    googleId: {
      type: String,
    },
    googleAccountEmail: {
      type: String, // ✅ store google email separately
    },
    googleAccountName: {
      type: String,
    },
    googleAccessToken: {
      type: String,
    },
    googleRefreshToken: {
      type: String,
    },
    googleTokenExpiry: {
      type: Number, // ✅ store as timestamp (matches Google)
    },

    googleLocationId: {
      type: String,
    },

    googleLocationName: {
      type: String,
    },

    // All linked Google Business locations. Only free-access accounts may hold
    // more than one. googleLocationId/Name above always mirror the ACTIVE one,
    // so existing features keep working unchanged.
    googleLocations: [
      {
        _id: false,
        locationId: { type: String, required: true },
        locationName: { type: String },
      },
    ],

    // Granted from the admin console: bypasses the subscription paywall and
    // allows linking unlimited Google Business locations.
    freeAccess: {
      type: Boolean,
      default: false,
    },

    // Automatic review replies (see jobs/autoReply.job.js)
    autoReply: {
      enabled: { type: Boolean, default: false },
      tone: { type: String, default: "Warm, professional, and friendly" },
      // Only reviews posted after this moment are auto-replied to, so turning
      // the feature on never replies to old reviews.
      enabledAt: { type: Date },
      // Google refused our token (revoked / expired): user must reconnect.
      needsReconnect: { type: Boolean, default: false },
    },

    // Added for facebook oauth
    // --- FACEBOOK & INSTAGRAM INTEGRATION ---
    facebookUserId: { type: String },
    facebookAccessToken: { type: String },
    facebookPageId: { type: String },
    facebookPageToken: { type: String },
    facebookPageName: { type: String },
    facebookPageAvatar: { type: String },
    instagramBusinessAccountId: { type: String },

    refreshToken: {
      type: String,
    },

    // --- PASSWORD RESET (OTP) ---
    resetPasswordOtp: { type: String },
    resetPasswordOtpExpires: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
