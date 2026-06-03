// backend\src\routes\subscription.routes.js

import express from "express";
import {
  createSubscription,
  verifySubscription,
  getMySubscription,
  cancelSubscription,
  getBillingCycles,
} from "../controllers/subscription.controller.js";

import { razorpayWebhook } from "../controllers/razorpayWebhook.controller.js";
import { ensureAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔐 protected
router.post("/create", ensureAuth, createSubscription);
router.post("/verify", ensureAuth, verifySubscription);
router.get("/me", ensureAuth, getMySubscription);
router.get("/billing-cycles/:id", ensureAuth, getBillingCycles);
router.post("/cancel/:subscriptionId", ensureAuth, cancelSubscription);

// 🔥 webhook (NO auth)
router.post("/webhook", razorpayWebhook);

export default router;
