import { Router } from "express";
import { ensureAuth } from "../middleware/authMiddleware.js";
import {
  bulkReplyToComments,
  createPost,
  deleteComment,
  deletePost,
  getConversationThread,
  getFacebookPostDetails,
  getFacebookStatus,
  getFeedCommentsUnified,
  getPageFeedPerformance,
  getPageMessages,
  replyToComment,
  sendMessage,
  updateComment,
} from "../controllers/facebook.controller.js";

const router = Router();

// facebook feed performance
router.get("/status", ensureAuth, getFacebookStatus);
router.get("/feed-performance", ensureAuth, getPageFeedPerformance);
router.get("/posts/:id", ensureAuth, getFacebookPostDetails);

// facebook post management
router.post("/posts/create", ensureAuth, createPost);
router.delete("/posts/:postId", ensureAuth, deletePost);

// facebook comments
router.get("/comments", ensureAuth, getFeedCommentsUnified);
router.post("/comments/reply", ensureAuth, replyToComment);
router.post("/comments/reply/bulk", ensureAuth, bulkReplyToComments);
router.put("/comments/:id", ensureAuth, updateComment);
router.delete("/comments/:id", ensureAuth, deleteComment);

// facebook messages
router.get("/messages", ensureAuth, getPageMessages);
router.post("/messages/send", ensureAuth, sendMessage);
router.get("/messages/:conversationId", ensureAuth, getConversationThread);

export default router;
