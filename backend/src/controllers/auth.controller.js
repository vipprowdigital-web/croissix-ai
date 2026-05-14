import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Business from "../models/business.model.js";
import { sendWelcomeEmail } from "./email.servce.js";
import { google } from "googleapis";

/*
========================================
GOOGLE OAUTH CLIENT
========================================
*/

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

// Register a New User

// export const register = async (req, res) => {
//   try {
//     console.log("📥 Register payload:", req.body);
//     const { name, phone, password } = req.body;
//     let email = req.body.email?.trim().toLowerCase();

//     if (!name || !email || !phone || !password) {
//       console.log("Fields required.");

//       return res.status(400).json({
//         message: "All fields are required",
//       });
//     }

//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       console.log("Email already registered");
//       return res.status(400).json({ message: "Email already registered" });
//     }

//     // check phone
//     const existingPhone = await User.findOne({ phone });

//     if (existingPhone) {
//       console.log("Phone number already registered");
//       return res.status(400).json({
//         message: "Phone number already registered",
//       });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = await User.create({
//       name,
//       email,
//       phone,
//       password: hashedPassword,
//       provider: "local",
//     });

//     res.status(201).json({
//       message: "User registered successfully.",
//       user: {
//         id: user._id,
//         name: user.name,
//         phone: user.phone,
//         email: user.email,
//       },
//     });
//   } catch (error) {
//     console.error("Register error:", error.message);
//     res.status(500).json({ message: "Internal Server Error." });
//   }
// };
export const register = async (req, res) => {
  try {
    console.log("📥 Register payload:", req.body);

    const { name, phone, password, businessName, employeeCount, city, state } =
      req.body;

    let email = req.body.email?.trim().toLowerCase();

    // ── Required field guard ─────────────────────────────────────
    if (
      !name ||
      !email ||
      !phone ||
      !password ||
      !businessName ||
      !city ||
      !state
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ── Duplicate checks ─────────────────────────────────────────
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res
        .status(400)
        .json({ message: "Phone number already registered" });
    }

    // ── Create User ──────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      provider: "local",
    });

    // ── Create Business linked to user ───────────────────────────
    const business = await Business.create({
      owner: user._id,
      businessName,
      employeeCount: Number(employeeCount) || 0,
      city,
      state,
    });

    // ── Send welcome email (non-blocking) ────────────────────────
    // We don't await this — if email fails, registration still succeeds
    sendWelcomeEmail({
      name,
      email,
      phone,
      businessName,
      employeeCount: Number(employeeCount) || 0,
      city,
      state,
    }).catch((err) => console.error("Welcome email failed silently:", err));

    // ── Response ─────────────────────────────────────────────────
    res.status(201).json({
      message: "User registered successfully.",
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
      },
      business: {
        id: business._id,
        businessName: business.businessName,
        city: business.city,
        state: business.state,
        employeeCount: business.employeeCount,
      },
    });
  } catch (error) {
    console.error("Register error:", error.message);
    // If user was created but business creation failed, clean up the orphan
    // (optional — only needed if you don't use DB transactions)
    res.status(500).json({ message: "Internal Server Error." });
  }
};

// Login User via email & password
export const login = async (req, res) => {
  try {
    let { email, password } = req.body;
    // console.log("Inside login: email: ", email, " password: ", password);

    // Normalize email (avoid case sensitivity issues)
    email = email?.trim().toLowerCase();

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Email and password are required.",
        field: !email ? "email" : "password",
      });
    }

    // Check user existence
    const user = await User.findOne({ email });

    // Generic error (avoid telling which field is incorrect for security)
    if (!user) {
      console.error(
        "Login error: Invalid email or password for email e:",
        email,
      );
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password.",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.error("Login error: password match:", email);
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password.",
      });
    }

    // Generate JWT Token - Acccess Token
    const accessToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        provider: user.provider,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    // Generate JWT Token - Refresh Token
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    // store refresh token
    user.refreshToken = refreshToken;
    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Login successful.",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        provider: user.provider,
        googleId: user.googleId || null,
        googleLocationId: user.googleLocationId || null,
        googleLocationName: user.googleLocationName || null,
        avatar: user.avatar || null,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      status: "error",
      message: "Something went wrong. Please try again later.",
    });
  }
};

// -------------------------
// Google OAuth
// -------------------------
// Link Google Account
export const linkGoogleAccount = async (req, res) => {
  try {
    console.log("🔵 LINK GOOGLE BODY:", req.body);
    console.log("🔵 AUTH USER:", req.user);

    const userId = req.user?.id;

    if (!userId) {
      console.log("User is missing.");
      return res.status(401).json({
        message: "Unauthorized: Missing user",
      });
    }

    let { googleId, googleAccessToken, googleRefreshToken, googleTokenExpiry } =
      req.body;

    // ✅ FIX 1: fallback for Google "sub"
    if (!googleId && req.body.sub) {
      googleId = req.body.sub;
    }

    if (!googleId) {
      console.log("Google ID is required.");
      return res.status(400).json({
        message: "Google ID is required",
        received: req.body,
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      console.log("User not found for linking Google account.");
      return res.status(404).json({
        message: "User not found",
      });
    }

    // ✅ prevent linking multiple accounts
    const existingGoogleUser = await User.findOne({ googleId });

    if (existingGoogleUser && existingGoogleUser._id.toString() !== userId) {
      return res.status(400).json({
        message: "This Google account is already linked to another user.",
      });
    }

    // ✅ FIX 2: safe updates (don't overwrite with undefined)
    user.googleId = googleId;

    // ✅ ADD THESE (IMPORTANT)
    user.googleAccountEmail = req.body.email || user.googleAccountEmail;
    user.googleAccountName = req.body.name || user.googleAccountName;

    user.googleAccessToken = googleAccessToken || user.googleAccessToken;
    user.googleRefreshToken = googleRefreshToken || user.googleRefreshToken; // ⭐ important
    user.googleTokenExpiry = googleTokenExpiry || user.googleTokenExpiry;

    user.provider = "google";

    await user.save();

    return res.status(200).json({
      message: "Google account linked successfully",
      user,
    });
  } catch (error) {
    console.error("❌ Google link error:", error);

    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// -------------------------
// Refresh Token (JWT)
// -------------------------
// -------------------------
// Refresh Token (JWT)
// -------------------------
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: incomingToken } = req.body;

    if (!incomingToken) {
      return res.status(401).json({
        status: "error",
        message: "Refresh token required",
      });
    }

    // verify refresh token
    const decoded = jwt.verify(incomingToken, process.env.JWT_REFRESH_SECRET);

    // fetch user
    const user = await User.findById(decoded.id)
      .select("email provider refreshToken")
      .lean();

    if (!user || user.refreshToken !== incomingToken) {
      return res.status(403).json({
        status: "error",
        message: "Invalid refresh token",
      });
    }

    // generate new access token
    const newAccessToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        provider: user.provider,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    return res.status(200).json({
      status: "success",
      accessToken: newAccessToken,
    });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(403).json({
        status: "error",
        message: "Refresh token expired",
      });
    }

    return res.status(403).json({
      status: "error",
      message: "Invalid refresh token",
    });
  }
};

// -------------------------
// Logout user (JWT) - optimized
// -------------------------
export const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    return res.status(200).json({
      message:
        "Logout successful. Please remove the token from client storage.",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
};

export const googleAuth = async (req, res) => {
  const scopes = ["https://www.googleapis.com/auth/business.manage"];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
  });

  res.redirect(authUrl);
};

export const googleAuthCallback = async (req, res) => {
  try {
    const code = req.query.code;

    const { tokens } = await oauth2Client.getToken(code);

    console.log("\n========== TOKENS ==========\n");
    console.log(tokens);

    /*
      IMPORTANT:
      SAVE THIS REFRESH TOKEN
      INTO YOUR .env FILE
    */

    res.send(`
      <h2>Authentication Successful</h2>
      <p>Check terminal for refresh token.</p>
    `);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "OAuth failed",
      error: error.message,
    });
  }
};

export const googleReviews = async (req, res) => {
  try {
    /*
    =========================================
    QUERY PARAMS
    =========================================
    */

    const pageSize = Number(req.query.pageSize) || 5;

    const pageToken = req.query.pageToken || "";

    /*
    =========================================
    GOOGLE AUTH
    =========================================
    */

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    /*
    =========================================
    ACCESS TOKEN
    =========================================
    */

    const accessTokenResponse = await oauth2Client.getAccessToken();

    const access_token = accessTokenResponse.token;

    if (!access_token) {
      return res.status(401).json({
        success: false,
        error: "Failed to generate access token",
      });
    }

    /*
    =========================================
    ENV VARIABLES
    =========================================
    */

    const accountId = process.env.GOOGLE_ACCOUNT_ID;

    const locationId = process.env.GOOGLE_LOCATION_ID;

    /*
    =========================================
    GOOGLE REVIEWS URL
    =========================================
    */

    const reviewsUrl = new URL(
      `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews`,
    );

    /*
    =========================================
    PAGINATION
    =========================================
    */

    reviewsUrl.searchParams.append("pageSize", pageSize);

    if (pageToken) {
      reviewsUrl.searchParams.append("pageToken", pageToken);
    }

    // console.log("\n===== REVIEWS URL =====\n");

    // console.log(reviewsUrl.toString());

    /*
    =========================================
    FETCH REVIEWS
    =========================================
    */

    const reviewsRes = await fetch(reviewsUrl.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
    });

    const reviewsText = await reviewsRes.text();

    const reviewsData = JSON.parse(reviewsText);

    /*
    =========================================
    HANDLE ERRORS
    =========================================
    */

    if (reviewsData.error) {
      return res.status(400).json({
        success: false,
        error: reviewsData.error,
      });
    }

    /*
    =========================================
    SUCCESS RESPONSE
    =========================================
    */

    return res.status(200).json({
      success: true,
      reviews: reviewsData.reviews || [],

      averageRating: reviewsData.averageRating || 0,

      totalReviewCount: reviewsData.totalReviewCount || 0,

      nextPageToken: reviewsData.nextPageToken || null,
    });
  } catch (error) {
    console.error("\n===== GOOGLE REVIEWS ERROR =====\n");

    console.error(error);

    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch Google reviews",
    });
  }
};

// export const googleReviews = async (req, res) => {
//   try {
//     const oauth2Client = new google.auth.OAuth2(
//       process.env.GOOGLE_CLIENT_ID,
//       process.env.GOOGLE_CLIENT_SECRET,
//     );

//     oauth2Client.setCredentials({
//       refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
//     });

//     const accessTokenResponse = await oauth2Client.getAccessToken();

//     const access_token = accessTokenResponse.token;

//     if (!access_token) {
//       return res.status(401).json({
//         success: false,
//         error: "Failed to generate access token",
//       });
//     }

//     const accountId = process.env.GOOGLE_ACCOUNT_ID;

//     const locationId = process.env.GOOGLE_LOCATION_ID;

//     console.log("\n===== ACCOUNT ID =====\n");
//     console.log(accountId);

//     console.log("\n===== LOCATION ID =====\n");
//     console.log(locationId);

//     const reviewsUrl = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews`;

//     console.log("\n===== REVIEWS URL =====\n");
//     console.log(reviewsUrl);

//     const reviewsRes = await fetch(reviewsUrl, {
//       method: "GET",
//       headers: {
//         Authorization: `Bearer ${access_token}`,
//         "Content-Type": "application/json",
//       },
//     });

//     const reviewsText = await reviewsRes.text();

//     // console.log("\n===== REVIEWS RAW RESPONSE =====\n");
//     // console.log(reviewsText);

//     const reviewsData = JSON.parse(reviewsText);

//     if (reviewsData.error) {
//       return res.status(400).json({
//         success: false,
//         error: reviewsData.error,
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       reviews: reviewsData.reviews || [],
//       averageRating: reviewsData.averageRating || 0,
//       totalReviewCount: reviewsData.totalReviewCount || 0,
//     });
//   } catch (error) {
//     console.error("\n===== GOOGLE REVIEWS ERROR =====\n");

//     console.error(error);

//     return res.status(500).json({
//       success: false,
//       error: error.message || "Failed to fetch Google reviews",
//     });
//   }
// };
