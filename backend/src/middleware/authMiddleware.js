// backend\src\middleware\authMiddleware.js
// backend/src/middleware/authMiddleware.js

import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const ensureAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("Auth Header: ", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Inside !authHeader");

      return res.status(401).json({
        status: "error",
        message: "Authorization token missing",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 Include subscription fields
    const user = await User.findById(decoded.id).select("-password").lean();

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "User not found",
      });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      provider: user.provider,

      // 🔥 SaaS fields
      subscription: user.subscription,
      subscriptionStatus: user.subscriptionStatus,
      plan: user.plan,
      expiresAt: user.expiresAt,
      role: user.role || "user",
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        status: "error",
        message: "Token expired",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        status: "error",
        message: "Invalid token",
      });
    }

    console.error("Auth Middleware Error:", error);

    return res.status(500).json({
      status: "error",
      message: "Authentication failed",
    });
  }
};
