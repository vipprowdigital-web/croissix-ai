import { Router } from "express";
import { ensureAuth } from "../middleware/authMiddleware.js";
import {
  getInstagramAccountDetails,
  getInstagramFeedPosts,
  getInstagramComments,
  replyToInstagramComment,
  deleteInstagramComment,
  getInstagramMessages,
  getInstagramConversationThread,
  sendInstagramMessage,
  createInstagramPost,
  deleteInstagramPost,
} from "../controllers/instagram.controller.js";

const router = Router();

// Account
router.get("/account", ensureAuth, getInstagramAccountDetails);

// Feed posts
router.get("/feed", ensureAuth, getInstagramFeedPosts);
router.post("/posts/create", ensureAuth, createInstagramPost);
router.delete("/posts/:mediaId", ensureAuth, deleteInstagramPost);

// Comments
router.get("/comments", ensureAuth, getInstagramComments);
router.post("/comments/reply", ensureAuth, replyToInstagramComment);
router.delete("/comments/:commentId", ensureAuth, deleteInstagramComment);

// Messages (DMs) — requires instagram_manage_messages permission
router.get("/messages", ensureAuth, getInstagramMessages);
router.post("/messages/send", ensureAuth, sendInstagramMessage);
router.get("/messages/:conversationId", ensureAuth, getInstagramConversationThread);

export default router;
