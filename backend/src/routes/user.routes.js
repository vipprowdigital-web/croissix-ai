// backend\src\routes\user.routes.js

import { Router } from "express";
import {
  getProfile,
  setGoogleLocation,
  setActiveGoogleLocation,
  removeGoogleLocation,
  updateProfileById,
} from "../controllers/user.controller.js";
import {
  getAutoReply,
  updateAutoReply,
} from "../controllers/autoReply.controller.js";
import { ensureAuth } from "../middleware/authMiddleware.js";
import upload from "../config/multer.js";

const router = Router();

router.get("/profile/view", ensureAuth, getProfile);
router.patch(
  "/profile/update",
  ensureAuth,
  upload.fields([{ name: "avatar", maxCount: 1 }]),
  updateProfileById,
);

router.patch("/google-location", ensureAuth, setGoogleLocation);
router.patch("/google-location/active", ensureAuth, setActiveGoogleLocation);
router.delete("/google-location/:locationId", ensureAuth, removeGoogleLocation);

router.get("/auto-reply", ensureAuth, getAutoReply);
router.patch("/auto-reply", ensureAuth, updateAutoReply);

export default router;
