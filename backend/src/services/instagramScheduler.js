import axios from "axios";
import ScheduledPost from "../models/scheduledPost.model.js";
import User from "../models/user.model.js";

const igBaseUrl = "https://graph.facebook.com/v25.0";

async function resolveIgUserId(user) {
  if (user.instagramBusinessAccountId) return user.instagramBusinessAccountId;
  const res = await axios.get(`${igBaseUrl}/${user.facebookPageId}`, {
    params: { fields: "instagram_business_account{id}", access_token: user.facebookPageToken },
  });
  const igUserId = res.data?.instagram_business_account?.id;
  if (igUserId) {
    await User.findByIdAndUpdate(user._id, { instagramBusinessAccountId: igUserId });
  }
  return igUserId || null;
}

async function publishOne(post) {
  try {
    const user = await User.findById(post.userId);
    if (!user?.facebookPageToken) {
      throw new Error("Facebook token not available");
    }

    const igUserId = await resolveIgUserId(user);
    if (!igUserId) throw new Error("No Instagram Business Account linked");

    const containerParams = {
      image_url: post.imageUrl,
      access_token: user.facebookPageToken,
    };
    if (post.caption) containerParams.caption = post.caption;

    const containerRes = await axios.post(
      `${igBaseUrl}/${igUserId}/media`,
      null,
      { params: containerParams, timeout: 15000 },
    );

    const creationId = containerRes.data?.id;
    if (!creationId) throw new Error("Failed to create media container");

    await axios.post(
      `${igBaseUrl}/${igUserId}/media_publish`,
      null,
      { params: { creation_id: creationId, access_token: user.facebookPageToken }, timeout: 15000 },
    );

    await ScheduledPost.findByIdAndUpdate(post._id, {
      status: "published",
      publishedAt: new Date(),
    });

    console.log(`[IG Scheduler] Published scheduled post ${post._id}`);
  } catch (error) {
    const errMsg = error.response?.data?.error?.message || error.message;
    console.error(`[IG Scheduler] Failed to publish post ${post._id}:`, errMsg);
    await ScheduledPost.findByIdAndUpdate(post._id, {
      status: "failed",
      errorMessage: errMsg,
    });
  }
}

export async function publishScheduledPosts() {
  try {
    const due = await ScheduledPost.find({
      status: "pending",
      scheduledAt: { $lte: new Date() },
    });

    if (due.length > 0) {
      console.log(`[IG Scheduler] Publishing ${due.length} scheduled post(s)`);
    }

    for (const post of due) {
      await publishOne(post);
    }
  } catch (error) {
    console.error("[IG Scheduler] Error in scheduler run:", error.message);
  }
}
