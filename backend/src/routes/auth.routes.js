import { Router } from "express";
import {
  googleAuth,
  googleAuthCallback,
  googleReviews,
  linkGoogleAccount,
  login,
  logout,
  refreshToken,
  register,
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

export default router;
