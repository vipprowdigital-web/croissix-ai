// backend\src\controllers\autoReply.controller.js

import User from "../models/user.model.js";
import AutoReply from "../models/autoReply.model.js";

const DEFAULT_TONE = "Warm, professional, and friendly";

// GET /users/auto-reply  -> settings + recent activity
export const getAutoReply = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("autoReply googleId googleRefreshToken")
      .lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const [recent, pending] = await Promise.all([
      AutoReply.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .limit(15)
        .select(
          "reviewerName rating locationName status replyText error dueAt sentAt createdAt",
        )
        .lean(),
      AutoReply.countDocuments({ user: req.user.id, status: "pending" }),
    ]);

    return res.status(200).json({
      settings: {
        enabled: !!user.autoReply?.enabled,
        tone: user.autoReply?.tone || DEFAULT_TONE,
        needsReconnect: !!user.autoReply?.needsReconnect,
        googleConnected: !!user.googleRefreshToken,
      },
      pending,
      recent,
    });
  } catch (error) {
    console.error("getAutoReply error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /users/auto-reply  { enabled?, tone? }
export const updateAutoReply = async (req, res) => {
  try {
    const { enabled, tone } = req.body || {};
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (typeof enabled === "boolean") {
      if (enabled) {
        if (!user.googleRefreshToken || !user.googleLocationId) {
          return res.status(400).json({
            message: "Link your Google Business Profile before enabling auto-reply.",
          });
        }
        // Only reviews posted from now on get an automatic reply
        if (!user.autoReply?.enabled) user.autoReply.enabledAt = new Date();
        user.autoReply.needsReconnect = false;
      }
      user.autoReply.enabled = enabled;
    }

    if (typeof tone === "string" && tone.trim()) {
      user.autoReply.tone = tone.trim().slice(0, 120);
    }

    await user.save();

    return res.status(200).json({
      message: "Auto-reply updated",
      settings: {
        enabled: user.autoReply.enabled,
        tone: user.autoReply.tone,
        needsReconnect: user.autoReply.needsReconnect,
        googleConnected: !!user.googleRefreshToken,
      },
    });
  } catch (error) {
    console.error("updateAutoReply error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
