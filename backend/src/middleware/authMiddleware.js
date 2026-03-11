// backend\src\middleware\authMiddleware.js

import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const ensureAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ─────────────────────────────
    // Check Authorization Header
    // ─────────────────────────────
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Authorization token missing",
      });
    }

    const token = authHeader.split(" ")[1];

    // ─────────────────────────────
    // Verify JWT
    // ─────────────────────────────
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ─────────────────────────────
    // Fetch User (lean for performance)
    // ─────────────────────────────
    const user = await User.findById(decoded.id).select("-password").lean();

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "User not found",
      });
    }

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    // Token expired
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        status: "error",
        message: "Token expired",
      });
    }

    // Invalid token
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
