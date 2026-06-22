import { Router } from "express";
import {
  googleAuth,
  googleAuthCallback,
  googleReviews,
  facebookOauthInitiate,
  facebookAuthCallback,
  linkGoogleAccount,
  login,
  logout,
  refreshToken,
  register,
  connectSingleFacebookPage,
  disconnectFacebookProfile,
} from "../controllers/auth.controller.js";
import { ensureAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/link-google", ensureAuth, linkGoogleAccount);
router.post("/refresh", refreshToken);
router.post("/logout", ensureAuth, logout);
router.get("/google", googleAuth);
router.get("/google/callback", googleAuthCallback);
router.get("/google/reviews", googleReviews);

// Facebook OAuth
router.get("/facebook/oauth", ensureAuth, facebookOauthInitiate); // initiates OAuth with correct scopes
router.get("/facebook", facebookAuthCallback);                     // Meta callback — no auth, called by Facebook
router.post("/facebook/connect-page", ensureAuth, connectSingleFacebookPage);
router.post("/facebook/disconnect-page", ensureAuth, disconnectFacebookProfile);

export default router;
