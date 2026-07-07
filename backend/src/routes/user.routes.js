// backend\src\routes\user.routes.js

import { Router } from "express";
import {
  getProfile,
  setGoogleLocation,
  updateProfileById,
} from "../controllers/user.controller.js";
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

export default router;
