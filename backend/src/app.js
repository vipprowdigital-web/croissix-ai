// src/app.js

import express from "express";
import session from "express-session";
import passport from "passport";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import path from "path";
import { fileURLToPath } from "url";
// import { google } from "googleapis";

// 🧩 Local Imports
import "./config/passport.js";
// import connectDB from "./config/db.js";
import errorHandler from "./middleware/errorHandler.js";

// 🗂 Routes
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import appConfigRoutes from "./routes/appConfig.routes.js";
import categoriesRoutes from "./routes/category.routes.js";
import blogRoutes from "./routes/blog.routes.js";
import courseRoutes from "./routes/course.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import galleryRoutes from "./routes/gallery.routes.js";
import certificateRoutes from "./routes/certificate.routes.js";
import certificateDownloadRoutes from "./routes/userCertificate.routes.js";
import testimonialRoutes from "./routes/testimonials.routes.js";
import serviceRoutes from "./routes/service.routes.js";
import domainsRoutes from "./routes/domain.routes.js";
import policyRoutes from "./routes/policy.routes.js";
import contatUsRoutes from "./routes/contactus.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";

// ===============================================
// 🧠 Environment Config
// ===============================================
dotenv.config();
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const routePrefix = "/api/v1";
const allowedOrigins = [
  process.env.NEXT_FRONTEND_URL, // Next.js production site
  process.env.ADMIN_FRONTEND_URL, // Admin production site
  process.env.REACT_NATIVE_FRONTEND_URL, // React Native local
  process.env.VIPPROW_LANDING_PAGE_URL,
  "http://localhost:3000",
  "http://192.168.29.15:3000",
  "http://192.168.29.15:8081",
];
// ===============================================
// 🔥 WEBHOOK FIRST (VERY IMPORTANT)
// ===============================================
app.use(
  "/api/v1/subscription/webhook",
  express.raw({ type: "application/json" }),
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // SSR, Postman, mobile apps

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("❌ Blocked by CORS:", origin);
      return callback(new Error("CORS Not Allowed: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
// ===============================================
// 🧱 Core Middleware
// ===============================================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(compression());
app.use(morgan("dev"));
app.use(hpp()); // Prevent HTTP parameter pollution

// ===============================================
// ⚡ Rate Limiting
// ===============================================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200, // Limit each IP
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// ===============================================
// 🔐 Session & Passport Config
// ===============================================
app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      process.env.JWT_SECRET ||
      "SuperSecretKey_123",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60, // 1 hour
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

// ===============================================
// 🗂️ Static Files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===============================================
// 🚏 API Routes
// ===============================================
app.use(`${routePrefix}/auth`, authRoutes);
app.use(`${routePrefix}/users`, userRoutes);
app.use(`${routePrefix}/app-config`, appConfigRoutes);
app.use(`${routePrefix}/categories`, categoriesRoutes);
app.use(`${routePrefix}/blog`, blogRoutes);
app.use(`${routePrefix}/course`, courseRoutes);
app.use(`${routePrefix}/comments`, commentRoutes);
app.use(`${routePrefix}/gallery`, galleryRoutes);
app.use(`${routePrefix}/certificate/download`, certificateDownloadRoutes);
app.use(`${routePrefix}/certificate`, certificateRoutes);
app.use(`${routePrefix}/testimonial`, testimonialRoutes);
app.use(`${routePrefix}/service`, serviceRoutes);
app.use(`${routePrefix}/domains`, domainsRoutes);
app.use(`${routePrefix}/policy`, policyRoutes);
app.use(`${routePrefix}/contact`, contatUsRoutes);
app.use(`${routePrefix}/upload`, uploadRoutes);
app.use(`${routePrefix}/subscription`, subscriptionRoutes);

// ===============================================
// 🩵 Health Check
// ===============================================
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "🚀 API is running successfully!",
    version: "v1.0.0",
    env: process.env.NODE_ENV,
  });
});

// ------------------------------------ FOR LANDING PAGE ------------------------------------------
/*
========================================
GOOGLE OAUTH CLIENT
========================================
*/

// const oauth2Client = new google.auth.OAuth2(
//   process.env.GOOGLE_CLIENT_ID,
//   process.env.GOOGLE_CLIENT_SECRET,
//   process.env.GOOGLE_REDIRECT_URI,
// );

/*
========================================
STEP 1:
LOGIN ROUTE (ONE TIME ONLY)
========================================
*/

// app.get("/api/v1/auth/google", (req, res) => {
//   const scopes = ["https://www.googleapis.com/auth/business.manage"];

//   const authUrl = oauth2Client.generateAuthUrl({
//     access_type: "offline",
//     prompt: "consent",
//     scope: scopes,
//   });

//   res.redirect(authUrl);
// });

/*
========================================
STEP 2:
GOOGLE CALLBACK ROUTE
========================================
*/

// app.get("/api/v1/auth/google/callback", async (req, res) => {
//   try {
//     const code = req.query.code;

//     const { tokens } = await oauth2Client.getToken(code);

//     console.log("\n========== TOKENS ==========\n");
//     console.log(tokens);

//     /*
//       IMPORTANT:
//       SAVE THIS REFRESH TOKEN
//       INTO YOUR .env FILE
//     */

//     res.send(`
//       <h2>Authentication Successful</h2>
//       <p>Check terminal for refresh token.</p>
//     `);
//   } catch (error) {
//     console.error(error);

//     res.status(500).json({
//       success: false,
//       message: "OAuth failed",
//       error: error.message,
//     });
//   }
// });

/*
========================================
STEP 3:
FETCH GOOGLE BUSINESS REVIEWS
========================================
*/

// app.get("/api/v1/google/reviews", async (req, res) => {
//   try {
//     /*
//     =========================================
//     GOOGLE OAUTH CLIENT
//     =========================================
//     */

//     const oauth2Client = new google.auth.OAuth2(
//       process.env.GOOGLE_CLIENT_ID,
//       process.env.GOOGLE_CLIENT_SECRET,
//     );

//     /*
//     =========================================
//     SET REFRESH TOKEN
//     =========================================
//     */

//     oauth2Client.setCredentials({
//       refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
//     });

//     /*
//     =========================================
//     GET ACCESS TOKEN
//     =========================================
//     */

//     const accessTokenResponse = await oauth2Client.getAccessToken();

//     const access_token = accessTokenResponse.token;

//     if (!access_token) {
//       return res.status(401).json({
//         success: false,
//         error: "Failed to generate access token",
//       });
//     }

//     // const accountId = accountName.split("/")[1];
//     const accountId = process.env.GOOGLE_ACCOUNT_ID;

//     // const locationId = location.name.split("/")[1];
//     const locationId = process.env.GOOGLE_LOCATION_ID;

//     console.log("\n===== ACCOUNT ID =====\n");
//     console.log(accountId);

//     console.log("\n===== LOCATION ID =====\n");
//     console.log(locationId);

//     /*
//     =========================================
//     STEP 3: FETCH REVIEWS
//     =========================================
//     */

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

//     /*
//     =========================================
//     SUCCESS RESPONSE
//     =========================================
//     */

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
// });

app.use(errorHandler);

export default app;
