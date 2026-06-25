import User from "../models/user.model.js";
import ScheduledPost from "../models/scheduledPost.model.js";
import axios from "axios";

const igBaseUrl = "https://graph.facebook.com/v25.0";

// GET /api/v1/instagram/account
// Fetches the Instagram Business Account details linked to the user's Facebook Page.
export const getInstagramAccountDetails = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    const user = await User.findById(userId);
    if (!user?.facebookPageId || !user?.facebookPageToken) {
      return res.status(400).json({
        success: false,
        message: "Facebook integration not active. Please connect your Facebook Page first.",
      });
    }

    const { facebookPageId, facebookPageToken } = user;

    const fields = [
      "instagram_business_account{",
      "id,username,name,",
      "profile_picture_url,biography,",
      "website,followers_count,follows_count,media_count",
      "}",
    ].join("");

    const response = await axios.get(`${igBaseUrl}/${facebookPageId}`, {
      params: {
        fields,
        access_token: facebookPageToken,
      },
    });

    const igAccount = response.data?.instagram_business_account;

    if (!igAccount) {
      return res.status(404).json({
        success: false,
        message:
          "No Instagram Business Account linked to this Facebook Page. " +
          "Ensure the Page is connected to an Instagram Business or Creator account.",
      });
    }

    // Persist the IG user ID to the user doc for subsequent feed calls
    if (!user.instagramBusinessAccountId || user.instagramBusinessAccountId !== igAccount.id) {
      await User.findByIdAndUpdate(userId, { instagramBusinessAccountId: igAccount.id });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: igAccount.id,
        username: igAccount.username,
        name: igAccount.name,
        profilePictureUrl: igAccount.profile_picture_url || null,
        biography: igAccount.biography || "",
        website: igAccount.website || null,
        followersCount: igAccount.followers_count ?? 0,
        followsCount: igAccount.follows_count ?? 0,
        mediaCount: igAccount.media_count ?? 0,
      },
    });
  } catch (error) {
    console.error("getInstagramAccountDetails error:", error.response?.data || error.message);
    const fbError = error.response?.data?.error;
    return res.status(error.response?.status || 500).json({
      success: false,
      message: fbError?.message || "Failed to fetch Instagram account details.",
      fbCode: fbError?.code || null,
    });
  }
};

// Shared helper — resolves & caches the IG user ID from the user doc
async function resolveIgUserId(user) {
  if (user.instagramBusinessAccountId) return user.instagramBusinessAccountId;

  const pageRes = await axios.get(`${igBaseUrl}/${user.facebookPageId}`, {
    params: {
      fields: "instagram_business_account{id}",
      access_token: user.facebookPageToken,
    },
  });

  const igUserId = pageRes.data?.instagram_business_account?.id;
  if (igUserId) {
    await User.findByIdAndUpdate(user._id, { instagramBusinessAccountId: igUserId });
  }
  return igUserId || null;
}

// GET /api/v1/instagram/feed
// Fetches the Instagram Business Account's media feed.
// Optional query param: limit (default 12)
export const getInstagramFeedPosts = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    const user = await User.findById(userId);
    if (!user?.facebookPageToken) {
      return res.status(400).json({
        success: false,
        message: "Facebook integration not active.",
      });
    }

    // Resolve the IG user ID via shared helper
    const igUserId = await resolveIgUserId(user);

    if (!igUserId) {
      return res.status(404).json({
        success: false,
        message: "No Instagram Business Account linked to this Facebook Page.",
      });
    }

    const limit = Math.min(parseInt(req.query.limit) || 12, 50);
    const after = req.query.after || null; // cursor for next page

    const fields = [
      "id",
      "caption",
      "media_type",
      "media_url",
      "thumbnail_url",
      "permalink",
      "timestamp",
      "like_count",
      "comments_count",
      "media_product_type",
      "children{media_url,media_type,thumbnail_url}",
    ].join(",");

    const params = { fields, limit, access_token: user.facebookPageToken };
    if (after) params.after = after;

    const response = await axios.get(`${igBaseUrl}/${igUserId}/media`, { params });

    const rawPosts = response.data?.data || [];

    const formattedPosts = rawPosts.map((post) => ({
      id: post.id,
      caption: post.caption || "",
      mediaType: post.media_type,
      mediaProductType: post.media_product_type || null,
      mediaUrl: post.media_url || post.thumbnail_url || null,
      thumbnailUrl: post.thumbnail_url || null,
      permalink: post.permalink,
      timestamp: post.timestamp,
      likeCount: post.like_count ?? 0,
      commentsCount: post.comments_count ?? 0,
      children: post.children?.data?.map((child) => ({
        mediaUrl: child.media_url || child.thumbnail_url || null,
        mediaType: child.media_type,
        thumbnailUrl: child.thumbnail_url || null,
      })) || [],
    }));

    const nextCursor = response.data?.paging?.cursors?.after || null;
    const hasMore = !!response.data?.paging?.next;

    return res.status(200).json({
      success: true,
      igUserId,
      count: formattedPosts.length,
      nextCursor,
      hasMore,
      data: formattedPosts,
    });
  } catch (error) {
    console.error("getInstagramFeedPosts error:", error.response?.data || error.message);
    const fbError = error.response?.data?.error;
    return res.status(error.response?.status || 500).json({
      success: false,
      message: fbError?.message || "Failed to fetch Instagram feed posts.",
      fbCode: fbError?.code || null,
    });
  }
};

// GET /api/v1/instagram/comments
// Fetches comments from the last N media posts (default 6 posts, up to 50 comments each).
// Optional query params: mediaLimit (default 6), commentLimit (default 50)
export const getInstagramComments = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized." });

    const user = await User.findById(userId);
    if (!user?.facebookPageToken) {
      return res.status(400).json({ success: false, message: "Facebook integration not active." });
    }

    const igUserId = await resolveIgUserId(user);
    if (!igUserId) {
      return res.status(404).json({ success: false, message: "No Instagram Business Account linked." });
    }

    const mediaLimit = Math.min(parseInt(req.query.mediaLimit) || 6, 20);
    const commentLimit = Math.min(parseInt(req.query.commentLimit) || 50, 100);
    const mediaCursor = req.query.mediaCursor || null; // cursor to paginate media batches

    // Fetch media batch (with optional cursor)
    const mediaParams = {
      fields: "id,caption,media_type,media_url,thumbnail_url,timestamp,permalink",
      limit: mediaLimit,
      access_token: user.facebookPageToken,
    };
    if (mediaCursor) mediaParams.after = mediaCursor;

    const mediaRes = await axios.get(`${igBaseUrl}/${igUserId}/media`, { params: mediaParams });

    const mediaItems = mediaRes.data?.data || [];
    const nextMediaCursor = mediaRes.data?.paging?.cursors?.after || null;
    const hasMoreMedia = !!mediaRes.data?.paging?.next;

    // Fetch comments for each media in parallel
    const commentsPerPost = await Promise.all(
      mediaItems.map(async (media) => {
        try {
          const commentRes = await axios.get(`${igBaseUrl}/${media.id}/comments`, {
            params: {
              fields: "id,text,timestamp,username,replies{id,text,timestamp,username}",
              limit: commentLimit,
              access_token: user.facebookPageToken,
            },
          });

          const comments = (commentRes.data?.data || []).map((c) => ({
            commentId: c.id,
            commentText: c.text,
            username: c.username || "Unknown",
            timestamp: c.timestamp,
            mediaId: media.id,
            mediaCaption: media.caption || "[Media Post]",
            mediaUrl: media.media_type === "VIDEO" ? (media.thumbnail_url || null) : (media.media_url || media.thumbnail_url || null),
            mediaPermalink: media.permalink,
            mediaType: media.media_type,
            replies: (c.replies?.data || []).map((r) => ({
              id: r.id,
              text: r.text,
              username: r.username || "Unknown",
              timestamp: r.timestamp,
            })),
          }));

          return comments;
        } catch {
          return [];
        }
      }),
    );

    const allComments = commentsPerPost.flat();

    return res.status(200).json({
      success: true,
      count: allComments.length,
      nextMediaCursor,
      hasMoreMedia,
      data: allComments,
    });
  } catch (error) {
    console.error("getInstagramComments error:", error.response?.data || error.message);
    const fbError = error.response?.data?.error;
    return res.status(error.response?.status || 500).json({
      success: false,
      message: fbError?.message || "Failed to fetch Instagram comments.",
      fbCode: fbError?.code || null,
    });
  }
};

// POST /api/v1/instagram/comments/reply
// Body: { commentId, message }
export const replyToInstagramComment = async (req, res) => {
  try {
    const { commentId, message } = req.body;
    if (!commentId || !message?.trim()) {
      return res.status(400).json({ success: false, message: "commentId and message are required." });
    }

    const user = await User.findById(req.user?.id);
    if (!user?.facebookPageToken) {
      return res.status(400).json({ success: false, message: "Facebook integration not active." });
    }

    const response = await axios.post(
      `${igBaseUrl}/${commentId}/replies`,
      { message: message.trim() },
      { params: { access_token: user.facebookPageToken }, timeout: 10000 },
    );

    return res.status(200).json({
      success: true,
      message: "Reply posted successfully.",
      data: { commentId, replyId: response.data.id },
    });
  } catch (error) {
    console.error("replyToInstagramComment error:", error.response?.data || error.message);
    const fbError = error.response?.data?.error;
    return res.status(fbError ? 400 : 500).json({
      success: false,
      message: fbError?.message || error.message || "Failed to post reply.",
      fbCode: fbError?.code || null,
    });
  }
};

// DELETE /api/v1/instagram/comments/:commentId
export const deleteInstagramComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    if (!commentId) {
      return res.status(400).json({ success: false, message: "commentId is required." });
    }

    const user = await User.findById(req.user?.id);
    if (!user?.facebookPageToken) {
      return res.status(400).json({ success: false, message: "Facebook integration not active." });
    }

    const response = await axios.delete(`${igBaseUrl}/${commentId}`, {
      params: { access_token: user.facebookPageToken },
      timeout: 10000,
    });

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully.",
      data: { commentId, deleted: response.data.success },
    });
  } catch (error) {
    console.error("deleteInstagramComment error:", error.response?.data || error.message);
    const fbError = error.response?.data?.error;
    return res.status(fbError ? 400 : 500).json({
      success: false,
      message: fbError?.message || "Failed to delete comment.",
      fbCode: fbError?.code || null,
    });
  }
};

// GET /api/v1/instagram/messages
// Fetches Instagram Direct Message conversations.
// Requires instagram_manage_messages permission on the connected token.
export const getInstagramMessages = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized." });

    const user = await User.findById(userId);
    if (!user?.facebookPageToken) {
      return res.status(400).json({ success: false, message: "Facebook integration not active." });
    }

    const igUserId = await resolveIgUserId(user);
    if (!igUserId) {
      return res.status(404).json({ success: false, message: "No Instagram Business Account linked." });
    }

    const limit = Math.min(parseInt(req.query.limit) || 25, 50);
    const after = req.query.after || null;

    const convParams = {
      fields: "id,participants,updated_time,unread_count,messages{message,from,to,created_time}",
      platform: "instagram",
      limit,
      access_token: user.facebookPageToken,
    };
    if (after) convParams.after = after;

    const conversationsRes = await axios.get(`${igBaseUrl}/${igUserId}/conversations`, {
      params: convParams,
    });

    const conversations = conversationsRes.data?.data || [];
    const nextCursor = conversationsRes.data?.paging?.cursors?.after || null;
    const hasMore = !!conversationsRes.data?.paging?.next;

    const formatted = conversations.map((conv) => {
      const messages = conv.messages?.data || [];
      const latestMsg = messages[0] || null;
      const participant = conv.participants?.data?.find((p) => p.id !== igUserId);

      return {
        conversationId: conv.id,
        sender: participant?.name || participant?.username || "Instagram User",
        senderId: participant?.id || null,
        preview: latestMsg?.message || "",
        time: conv.updated_time,
        unreadCount: conv.unread_count || 0,
        unread: (conv.unread_count || 0) > 0,
      };
    });

    return res.status(200).json({
      success: true,
      nextCursor,
      hasMore,
      data: {
        conversations: formatted,
        total: formatted.length,
        unreadCount: formatted.filter((m) => m.unread).length,
      },
    });
  } catch (error) {
    console.error("getInstagramMessages error:", error.response?.data || error.message);
    const fbError = error.response?.data?.error;
    // Codes 3, 10, 200 all indicate missing capability / permission
    const PERMISSION_CODES = [3, 10, 200];
    if (PERMISSION_CODES.includes(fbError?.code)) {
      return res.status(403).json({
        success: false,
        message: "Instagram messaging requires the instagram_manage_messages permission which has not been granted to this app.",
        fbCode: fbError.code,
        permissionRequired: true,
      });
    }
    return res.status(error.response?.status || 500).json({
      success: false,
      message: fbError?.message || "Failed to fetch Instagram messages.",
      fbCode: fbError?.code || null,
    });
  }
};

// GET /api/v1/instagram/messages/:conversationId
export const getInstagramConversationThread = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const user = await User.findById(req.user?.id);
    if (!user?.facebookPageToken) {
      return res.status(400).json({ success: false, message: "Facebook integration not active." });
    }

    const msgRes = await axios.get(`${igBaseUrl}/${conversationId}/messages`, {
      params: {
        fields: "id,message,from,to,created_time",
        limit: 50,
        access_token: user.facebookPageToken,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        messages: msgRes.data?.data || [],
        paging: msgRes.data?.paging || null,
      },
    });
  } catch (error) {
    console.error("getInstagramConversationThread error:", error.response?.data || error.message);
    const fbError = error.response?.data?.error;
    return res.status(error.response?.status || 500).json({
      success: false,
      message: fbError?.message || "Failed to fetch conversation thread.",
    });
  }
};

// DELETE /api/v1/instagram/posts/:mediaId
export const deleteInstagramPost = async (req, res) => {
  try {
    const { mediaId } = req.params;
    if (!mediaId) {
      return res.status(400).json({ success: false, message: "mediaId is required." });
    }

    const user = await User.findById(req.user?.id);
    if (!user?.facebookPageToken) {
      return res.status(400).json({ success: false, message: "Facebook integration not active." });
    }

    const response = await axios.delete(`${igBaseUrl}/${mediaId}`, {
      params: { access_token: user.facebookPageToken },
      timeout: 10000,
    });

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully.",
      data: { mediaId, deleted: response.data.success },
    });
  } catch (error) {
    console.error("deleteInstagramPost error:", error.response?.data || error.message);
    const fbError = error.response?.data?.error;

    // Codes 3, 10, 200 all indicate a missing permission on the stored token.
    // instagram_content_publishing is required to delete posts.
    const PERMISSION_CODES = [3, 10, 200];
    if (PERMISSION_CODES.includes(fbError?.code) || error.response?.status === 403) {
      return res.status(403).json({
        success: false,
        message:
          "Deleting Instagram posts requires the instagram_content_publishing permission. " +
          "Please disconnect and reconnect your Facebook account to grant this permission.",
        fbCode: fbError?.code || null,
        permissionRequired: true,
      });
    }

    return res.status(error.response?.status || 500).json({
      success: false,
      message: fbError?.message || "Failed to delete post.",
      fbCode: fbError?.code || null,
    });
  }
};

// POST /api/v1/instagram/posts/create
// Body: { imageUrl, caption?, scheduledPublishTime? (Unix timestamp) }
// Immediate publish: create container → media_publish
// Scheduled publish: create container with published=false + scheduled_publish_time (auto-publishes at set time)
export const createInstagramPost = async (req, res) => {
  try {
    const { imageUrl, caption, scheduledPublishTime } = req.body;
    if (!imageUrl?.trim()) {
      return res.status(400).json({ success: false, message: "imageUrl is required for Instagram posts." });
    }

    const user = await User.findById(req.user?.id);
    if (!user?.facebookPageToken) {
      return res.status(400).json({ success: false, message: "Facebook integration not active." });
    }

    const igUserId = await resolveIgUserId(user);
    if (!igUserId) {
      return res.status(404).json({ success: false, message: "No Instagram Business Account linked." });
    }

    const isScheduled = !!scheduledPublishTime;

    // For scheduled posts: store in DB and publish server-side at the right time.
    // Using the Instagram API's native published=false scheduling requires Meta whitelist approval.
    if (isScheduled) {
      const scheduledAt = new Date(scheduledPublishTime * 1000);
      await ScheduledPost.create({
        userId: user._id,
        imageUrl: imageUrl.trim(),
        caption: caption?.trim() || "",
        scheduledAt,
      });
      return res.status(200).json({
        success: true,
        message: "Post scheduled on Instagram successfully.",
        data: { scheduledAt: scheduledPublishTime },
      });
    }

    const containerParams = {
      image_url: imageUrl.trim(),
      access_token: user.facebookPageToken,
    };
    if (caption?.trim()) containerParams.caption = caption.trim();

    const containerRes = await axios.post(
      `${igBaseUrl}/${igUserId}/media`,
      null,
      { params: containerParams, timeout: 15000 },
    );

    const creationId = containerRes.data?.id;
    if (!creationId) {
      return res.status(500).json({ success: false, message: "Failed to create media container." });
    }

    const publishRes = await axios.post(
      `${igBaseUrl}/${igUserId}/media_publish`,
      null,
      {
        params: { creation_id: creationId, access_token: user.facebookPageToken },
        timeout: 15000,
      },
    );

    return res.status(200).json({
      success: true,
      message: "Post published to Instagram successfully.",
      data: { mediaId: publishRes.data?.id },
    });
  } catch (error) {
    console.error("createInstagramPost error:", error.response?.data || error.message);
    const fbError = error.response?.data?.error;
    return res.status(error.response?.status || 500).json({
      success: false,
      message: fbError?.message || "Failed to create Instagram post.",
      fbCode: fbError?.code || null,
    });
  }
};

// POST /api/v1/instagram/messages/send
// Body: { recipientId, message }
export const sendInstagramMessage = async (req, res) => {
  try {
    const { recipientId, message } = req.body;
    if (!recipientId || !message?.trim()) {
      return res.status(400).json({ success: false, message: "recipientId and message are required." });
    }

    const user = await User.findById(req.user?.id);
    if (!user?.facebookPageToken) {
      return res.status(400).json({ success: false, message: "Facebook integration not active." });
    }

    const igUserId = await resolveIgUserId(user);
    if (!igUserId) {
      return res.status(404).json({ success: false, message: "No Instagram Business Account linked." });
    }

    const sendRes = await axios.post(
      `${igBaseUrl}/${igUserId}/messages`,
      {
        recipient: { id: recipientId },
        message: { text: message.trim() },
      },
      { params: { access_token: user.facebookPageToken } },
    );

    return res.status(200).json({ success: true, data: sendRes.data });
  } catch (error) {
    console.error("sendInstagramMessage error:", error.response?.data || error.message);
    const fbError = error.response?.data?.error;
    return res.status(error.response?.status || 500).json({
      success: false,
      message: fbError?.message || "Failed to send message.",
    });
  }
};
