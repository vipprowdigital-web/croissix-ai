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
    googleAccessToken: {
      type: String,
    },
    googleRefreshToken: {
      type: String,
    },
    googleTokenExpiry: Date,

    googleLocationId: {
      type: String,
    },

    googleLocationName: {
      type: String,
    },

    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
