import { Router } from "express";
import { ensureAuth } from "../middleware/authMiddleware.js";
import {
  getFacebookStatus,
  getPageFeedPerformance,
} from "../controllers/facebook.controller.js";

const router = Router();

// facebook feed performance
router.get("/status", ensureAuth, getFacebookStatus);
router.get("/feed-performance", ensureAuth, getPageFeedPerformance);

export default router;
