// backend/src/models/business.model.js

import mongoose from "mongoose";

const businessSchema = new mongoose.Schema(
  {
    // ── Owner reference ──────────────────────────────────────────
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    employeeCount: {
      type: Number,
      default: 0,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },

    // googleLocationId: {
    //   type: String,
    // },
    // googleLocationName: {
    //   type: String,
    // },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const Business = mongoose.model("Business", businessSchema);

export default Business;
