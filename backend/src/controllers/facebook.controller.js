import User from "../models/user.model.js";
import axios from "axios";

const facebookBaseUrl = "https://graph.facebook.com/v25.0";

export const getFacebookStatus = async (req, res) => {
  try {
    // 1. Get the current logged-in user's ID from your authorization middleware
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized application context access.",
      });
    }

    // 2. Look up the user document in MongoDB
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account context not located.",
      });
    }

    // 3. Evaluate if a valid Facebook token is present in the schema fields
    // Double bang (!!) converts the existence of a string into a clean boolean (true/false)
    const hasActiveConnection =
      !!user.facebookPageId && !!user.facebookPageToken;

    return res.status(200).json({
      success: true,
      isFacebookConnected: hasActiveConnection,
    });
  } catch (error) {
    console.error(
      "Failed to check Facebook integration status:",
      error.message,
    );
    return res.status(500).json({
      success: false,
      message: "Internal server verification error.",
    });
  }
};

// export const getPageFeedPerformance = async (req, res) => {
//   try {
//     // 1. Get the authenticated User ID from your middleware
//     const userId = req.user?.id;

//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized application context access.",
//       });
//     }

//     // 2. Fetch the user document to get the stored page credentials
//     const user = await User.findById(userId);
//     if (!user || !user.facebookPageId || !user.facebookPageToken) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Facebook integration not active or missing setup configurations for this account.",
//       });
//     }

//     const { facebookPageId, facebookPageToken } = user;

//     // 3. Construct the Meta Graph API request URL and parameters
//     // const metaUrl = `${facebookBaseUrl}/${facebookPageId}/feed`;

//     // console.log(`Fetching Meta Feed for Page ID: ${facebookPageId}`);

//     // const metaResponse = await axios.get(metaUrl, {
//     //   params: {
//     //     fields: [
//     //       "id",
//     //       "message",
//     //       "status_type",
//     //       "created_time",
//     //       "attachments{media,type,url}",
//     //       "likes.summary(true)",
//     //       "comments.summary(true)",
//     //       "shares",
//     //       "insights.metric(post_impressions_unique,post_impressions){values}",
//     //     ].join(","),
//     //     limit: 10,
//     //     access_token: facebookPageToken,
//     //   },
//     // });

//     // console.log("Raw Meta API Response:", metaResponse.data.data);

//     // const rawPosts = metaResponse.data.data || [];

//     // const formattedPosts = rawPosts.map((post) => {
//     //   // 1. Extract core surface counts
//     //   const likesCount = post.likes?.summary?.total_count || 0;
//     //   const commentsCount = post.comments?.summary?.total_count || 0;
//     //   const sharesCount = post.shares?.count || 0;
//     //   const totalEngagements = likesCount + commentsCount + sharesCount;

//     //   // 2. Extract deep analytics metrics from Meta insights array
//     //   const reachValue =
//     //     post.insights?.data?.find((i) => i.name === "post_impressions_unique")
//     //       ?.values?.[0]?.value || 0;
//     //   const impressionsValue =
//     //     post.insights?.data?.find((i) => i.name === "post_impressions")
//     //       ?.values?.[0]?.value || 0;

//     //   // 3. Compute Engagement Rate (ER %) safely
//     //   const engagementRate =
//     //     impressionsValue > 0
//     //       ? ((totalEngagements / impressionsValue) * 100).toFixed(2)
//     //       : "0.00";

//     //   // 4. Determine Post Type clean labels
//     //   let postType = "Text";
//     //   if (post.attachments?.data?.[0]?.type?.includes("video"))
//     //     postType = "Video";
//     //   else if (post.attachments?.data?.[0]?.type?.includes("photo"))
//     //     postType = "Image";
//     //   else if (post.attachments?.data?.[0]?.type?.includes("share"))
//     //     postType = "Link";

//     //   const formattedDate = new Date(post.created_time).toLocaleDateString(
//     //     "en-US",
//     //     {
//     //       month: "short",
//     //       day: "numeric",
//     //       year: "numeric",
//     //     },
//     //   );

//     //   return {
//     //     id: post.id,
//     //     title:
//     //       post.message || "Media asset shared without timeline status copy.",
//     //     dateString: formattedDate,
//     //     contentType: postType,
//     //     mediaUrl: post.attachments?.data?.[0]?.media?.image?.src || null,
//     //     targetUrl: post.attachments?.data?.[0]?.url || null,
//     //     metrics: {
//     //       likes: likesCount.toLocaleString(),
//     //       comments: commentsCount.toLocaleString(),
//     //       shares: sharesCount.toLocaleString(),
//     //       reach: reachValue.toLocaleString(),
//     //       impressions: impressionsValue.toLocaleString(),
//     //       engagementRate: `${engagementRate}%`,
//     //     },
//     //   };
//     // });

//     // 5. Respond with clean layout fields

//     // 1. Fetch Timeline Feed using core nodes ONLY (This stops the Error 100 crash completely!)
//     const feedUrl = `${facebookBaseUrl}/${facebookPageId}/feed`;
//     const feedResponse = await axios.get(feedUrl, {
//       params: {
//         fields:
//           "id,message,status_type,created_time,attachments{media,type,url},likes.summary(true),comments.summary(true),shares",
//         limit: 10,
//         access_token: facebookPageToken,
//       },
//     });

//     const rawPosts = feedResponse.data.data || [];

//     // 2. Fetch Aggregated Page Insights separately for your high-level overview metrics
//     const insightsUrl = `${facebookBaseUrl}/${facebookPageId}/insights`;
//     let pageImpressions = "0";
//     let pageEngagement = "0";

//     try {
//       const insightsResponse = await axios.get(insightsUrl, {
//         params: {
//           metric: "page_impressions,page_post_engagements",
//           period: "days_28", // Look at the last 28 days of growth
//           access_token: facebookPageToken,
//         },
//       });

//       const dataMetrics = insightsResponse.data.data || [];
//       pageImpressions =
//         dataMetrics
//           .find((m) => m.name === "page_impressions")
//           ?.values?.[0]?.value?.toLocaleString() || "0";
//       pageEngagement =
//         dataMetrics
//           .find((m) => m.name === "page_post_engagements")
//           ?.values?.[0]?.value?.toLocaleString() || "0";
//     } catch (insightErr) {
//       console.warn(
//         "Non-blocking warning: Page-level insights skipped or restricted:",
//         insightErr.message,
//       );
//     }

//     // 3. Format timeline post blocks safely
//     const formattedPosts = rawPosts.map((post) => {
//       const likesCount = post.likes?.summary?.total_count || 0;
//       const commentsCount = post.comments?.summary?.total_count || 0;
//       const sharesCount = post.shares?.count || 0;
//       const combinedEngagements = likesCount + commentsCount + sharesCount;

//       let postType = "Text";
//       if (post.attachments?.data?.[0]?.type?.includes("video"))
//         postType = "Video";
//       else if (post.attachments?.data?.[0]?.type?.includes("photo"))
//         postType = "Image";
//       else if (post.attachments?.data?.[0]?.type?.includes("share"))
//         postType = "Link";

//       const formattedDate = new Date(post.created_time).toLocaleDateString(
//         "en-US",
//         {
//           month: "short",
//           day: "numeric",
//           year: "numeric",
//         },
//       );

//       return {
//         id: post.id,
//         title:
//           post.message ||
//           "Media asset shared without timeline status text copy.",
//         dateString: formattedDate,
//         contentType: postType,
//         mediaUrl: post.attachments?.data?.[0]?.media?.image?.src || null,
//         targetUrl: post.attachments?.data?.[0]?.url || null,
//         metrics: {
//           likes: likesCount.toLocaleString(),
//           comments: commentsCount.toLocaleString(),
//           shares: sharesCount.toLocaleString(),
//           reach: "Organic", // Set a clean fallback layout label string since post-level insights are mixed content types
//           impressions: "Active",
//           engagementRate:
//             combinedEngagements > 0
//               ? `${combinedEngagements} interactions`
//               : "No interactions",
//         },
//       };
//     });

//     return res.status(200).json({
//       success: true,
//       pageOverview: {
//         totalImpressions: pageImpressions,
//         totalEngagements: pageEngagement,
//       },
//       posts: formattedPosts,
//     });

//     // return res.status(200).json({
//     //   success: true,
//     //   posts: formattedPosts,
//     // });
//   } catch (error) {
//     console.error(
//       "Meta Graph Feed Fetch Exception:",
//       error.response?.data || error.message,
//     );

//     return res.status(error.response?.status || 500).json({
//       success: false,
//       message:
//         "Failed to collect real-time page timeline metrics from Meta API.",
//       error: error.response?.data || error.message,
//     });
//   }
// };

export const getPageFeedPerformance = async (req, res) => {
  try {
    // 1. Get the authenticated User ID from middleware
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized application context access.",
      });
    }

    // 2. Fetch the user document to get the stored page credentials
    const user = await User.findById(userId);
    if (!user || !user.facebookPageId || !user.facebookPageToken) {
      return res.status(400).json({
        success: false,
        message:
          "Facebook integration not active or missing setup configurations for this account.",
      });
    }

    const { facebookPageId, facebookPageToken } = user;

    // 3. Fetch Timeline Feed posts with core fields
    const feedUrl = `${facebookBaseUrl}/${facebookPageId}/feed`;
    const feedResponse = await axios.get(feedUrl, {
      params: {
        fields:
          "id,message,status_type,created_time,attachments{media,type,url},likes.summary(true),comments.summary(true),shares,reactions.summary(true)",
        limit: 10,
        access_token: facebookPageToken,
      },
    });

    const rawPosts = feedResponse.data.data || [];

    // 4. Fetch per-post insights in parallel (reach + impressions per post)
    const postsWithInsights = await Promise.all(
      rawPosts.map(async (post) => {
        try {
          const postInsightUrl = `${facebookBaseUrl}/${post.id}/insights`;
          const insightRes = await axios.get(postInsightUrl, {
            params: {
              metric:
                "post_impressions,post_impressions_unique,post_video_views",
              access_token: facebookPageToken,
            },
          });
          const insightData = insightRes.data.data || [];
          return {
            ...post,
            _insights: insightData,
          };
        } catch {
          // Non-blocking: some post types may not support insights
          return { ...post, _insights: [] };
        }
      }),
    );

    // 5. Fetch Page-level Insights (overview stats)
    let pageImpressions = 0;
    let pageEngagement = 0;
    let pageFans = 0;
    let pageFanAdds = 0;
    let pageViews = 0;

    try {
      // Page-level time-series metrics
      const insightsResponse = await axios.get(
        `${facebookBaseUrl}/${facebookPageId}/insights`,
        {
          params: {
            metric:
              "page_impressions,page_post_engagements,page_fan_adds,page_views_total",
            period: "days_28",
            access_token: facebookPageToken,
          },
        },
      );

      const dataMetrics = insightsResponse.data.data || [];

      const findLatestValue = (name) =>
        dataMetrics.find((m) => m.name === name)?.values?.slice(-1)?.[0]
          ?.value || 0;

      pageImpressions = findLatestValue("page_impressions");
      pageEngagement = findLatestValue("page_post_engagements");
      pageFanAdds = findLatestValue("page_fan_adds");
      pageViews = findLatestValue("page_views_total");
    } catch (insightErr) {
      console.warn(
        "Non-blocking warning: Page-level insights skipped or restricted:",
        insightErr.message,
      );
    }

    // 6. Fetch Page public info (fan count / follower count)
    try {
      const pageInfoRes = await axios.get(
        `${facebookBaseUrl}/${facebookPageId}`,
        {
          params: {
            fields: "fan_count,followers_count,name,picture{url},category",
            access_token: facebookPageToken,
          },
        },
      );
      pageFans = pageInfoRes.data.fan_count || 0;

      // Attach page profile info to response
      var pageProfile = {
        name: pageInfoRes.data.name || "",
        pictureUrl: pageInfoRes.data.picture?.data?.url || null,
        category: pageInfoRes.data.category || "",
        fans: pageFans.toLocaleString(),
        followers: (pageInfoRes.data.followers_count || 0).toLocaleString(),
      };
    } catch (pageInfoErr) {
      console.warn(
        "Non-blocking warning: Page info fetch failed:",
        pageInfoErr.message,
      );
      var pageProfile = null;
    }

    // 7. Format timeline post blocks with real per-post insight metrics
    const formattedPosts = postsWithInsights.map((post) => {
      const likesCount = post.likes?.summary?.total_count || 0;
      const commentsCount = post.comments?.summary?.total_count || 0;
      const sharesCount = post.shares?.count || 0;
      const reactionsCount = post.reactions?.summary?.total_count || 0;
      const totalEngagements = reactionsCount + commentsCount + sharesCount;

      // Extract per-post reach and impressions from insights
      const getInsightValue = (name) =>
        post._insights?.find((i) => i.name === name)?.values?.[0]?.value || 0;

      const reachValue = getInsightValue("post_impressions_unique");
      const impressionsValue = getInsightValue("post_impressions");
      const videoViewsValue = getInsightValue("post_video_views");

      // Compute Engagement Rate safely
      const engagementRate =
        impressionsValue > 0
          ? ((totalEngagements / impressionsValue) * 100).toFixed(2)
          : "0.00";

      // Determine post type
      let postType = "Text";
      const attachType = post.attachments?.data?.[0]?.type || "";
      if (attachType.includes("video")) postType = "Video";
      else if (attachType.includes("photo")) postType = "Image";
      else if (attachType.includes("share")) postType = "Link";

      const formattedDate = new Date(post.created_time).toLocaleDateString(
        "en-US",
        { month: "short", day: "numeric", year: "numeric" },
      );

      return {
        id: post.id,
        title:
          post.message ||
          "Media asset shared without timeline status text copy.",
        dateString: formattedDate,
        contentType: postType,
        mediaUrl: post.attachments?.data?.[0]?.media?.image?.src || null,
        targetUrl: post.attachments?.data?.[0]?.url || null,
        metrics: {
          likes: likesCount.toLocaleString(),
          comments: commentsCount.toLocaleString(),
          shares: sharesCount.toLocaleString(),
          reactions: reactionsCount.toLocaleString(),
          reach: reachValue > 0 ? reachValue.toLocaleString() : "N/A",
          impressions:
            impressionsValue > 0 ? impressionsValue.toLocaleString() : "N/A",
          videoViews:
            postType === "Video" && videoViewsValue > 0
              ? videoViewsValue.toLocaleString()
              : null,
          engagementRate: impressionsValue > 0 ? `${engagementRate}%` : "N/A",
          totalEngagements: totalEngagements.toLocaleString(),
        },
      };
    });

    // 8. Compute top performing post by total engagements
    const topPost =
      formattedPosts.length > 0
        ? formattedPosts.reduce((best, p) =>
            parseInt(p.metrics.totalEngagements.replace(/,/g, "") || "0") >
            parseInt(best.metrics.totalEngagements.replace(/,/g, "") || "0")
              ? p
              : best,
          )
        : null;

    return res.status(200).json({
      success: true,
      pageProfile: pageProfile || null,
      pageOverview: {
        totalImpressions: pageImpressions.toLocaleString(),
        totalEngagements: pageEngagement.toLocaleString(),
        newFans: pageFanAdds.toLocaleString(),
        pageViews: pageViews.toLocaleString(),
        totalFans: pageFans.toLocaleString(),
      },
      topPost: topPost,
      posts: formattedPosts,
    });
  } catch (error) {
    console.error(
      "Meta Graph Feed Fetch Exception:",
      error.response?.data || error.message,
    );

    return res.status(error.response?.status || 500).json({
      success: false,
      message:
        "Failed to collect real-time page timeline metrics from Meta API.",
      error: error.response?.data || error.message,
    });
  }
};

export const getFacebookPostDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        error: "Bad Request: Target id parameter is required.",
      });
      return;
    }

    const userDoc = await User.findById(req.user?.id);
    const pageAccessToken = userDoc?.facebookPageToken;

    // 2. Define the exact fields and edge summaries needed from the Graph API
    const fields = [
      "id",
      "message",
      "story",
      "created_time",
      "status_type",
      "full_picture",
      "permalink_url",
      "shares",
      // Fetches top 100 comments and forces Meta to calculate an absolute 'total_count' summary
      "comments.limit(100).summary(true){id,message,created_time,from,like_count}",
      // Fetches top 100 reactions and totals up all emotion metrics (Like, Love, Wow, etc.)
      "reactions.limit(100).summary(true){id,name,type}",
    ].join(",");

    // 3. Dispatch the pipeline request directly to Meta Graph API
    const graphApiResponse = await axios.get(`${facebookBaseUrl}/${id}`, {
      params: {
        fields: fields,
        access_token: pageAccessToken,
      },
    });

    const postData = graphApiResponse.data;

    // 4. Structure an elegant response wrapper for your frontend UI layout
    res.status(200).json({
      success: true,
      data: {
        id: postData.id,
        caption: postData.message || postData.story || "",
        createdAt: postData.created_time,
        type: postData.status_type,
        mediaUrl: postData.full_picture || null,
        permalink: postData.permalink_url,

        // Extracted Counters (Safe-guarded in case objects are missing)
        shareCount: postData.shares?.count || 0,
        totalComments: postData.comments?.summary?.total_count || 0,
        totalReactions: postData.reactions?.summary?.total_count || 0,

        // Nested Datasets for lists/mapping loops
        commentsList: postData.comments?.data || [],
        reactionsList: postData.reactions?.data || [],

        // Pagination metadata pointers for loading more comments downstream
        commentsPaging: postData.comments?.paging || null,
        reactionsPaging: postData.reactions?.paging || null,
      },
    });
  } catch (error) {
    console.error(
      "Facebook API Node Fetch Error:",
      error.response?.data || error.message,
    );

    // Catch explicit error structures thrown out directly by Meta's graph engine
    const fbError = error.response?.data?.error;

    res.status(error.response?.status || 500).json({
      success: false,
      error:
        fbError?.message ||
        "Internal server error connecting to Facebook API service.",
      fbCode: fbError?.code || null,
    });
  }
};

export const getFeedCommentsUnified = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || !user.facebookPageToken || !user.facebookPageId) {
      return res.status(400).json({
        success: false,
        message: "Missing facebookPageToken or facebookPageId in user data.",
      });
    }

    const { facebookPageToken, facebookPageId } = user;
    let masterCommentList = [];

    // This is exactly your API string setup
    let nextFeedUrl = `${facebookBaseUrl}/${facebookPageId}/feed`;
    const queryParams = {
      fields:
        "id,message,created_time,comments{id,message,from,created_time,comments{id,message,from,created_time}}",
      limit: 50, // Your requested limit
      access_token: facebookPageToken,
    };

    let isInitialRequest = true;

    // Loop to handle pagination using Meta's paging structure
    while (nextFeedUrl) {
      let response;

      if (isInitialRequest) {
        // Initial call uses your defined structure and parameters
        response = await axios.get(nextFeedUrl, { params: queryParams });
        isInitialRequest = false;
      } else {
        // Subsequent loops execute directly via the API's pagination links
        response = await axios.get(nextFeedUrl);
      }

      const posts = response.data.data || [];

      // Read the posts batch and compile comments
      for (const post of posts) {
        if (post.comments && post.comments.data) {
          // Maps out individual comments directly from the inline 'comments' object field
          const postComments = post.comments.data.map((comment) => ({
            commentId: comment.id,
            commentText: comment.message,
            commentedBy: comment.from ? comment.from.name : "Anonymous",
            commenterId: comment.from ? comment.from.id : null,
            commentCreatedAt: comment.created_time,
            postId: post.id,
            postMessage: post.message || "[Media/Link Post]",
            replies: (comment.comments?.data ?? []).map((r) => ({
              id: r.id,
              message: r.message,
              createdAt: r.created_time,
              repliedBy: r.from ? r.from.name : "Anonymous",
            })),
          }));

          masterCommentList.push(...postComments);
        }
      }

      // Sets up the next API URL or defaults to null ending the while loop
      nextFeedUrl = response.data.paging?.next || null;
    }

    console.log("Data from comments: ", masterCommentList);

    // Return everything back to your client
    return res.status(200).json({
      success: true,
      count: masterCommentList.length,
      data: masterCommentList,
    });
  } catch (error) {
    console.error(
      "Graph API Execution Failure:",
      error.response?.data || error.message,
    );
    return res.status(500).json({
      success: false,
      message: "Error communicating with Facebook Graph API",
      error: error.response?.data || error.message,
    });
  }
};

// ─── Helper: send a single reply to Facebook Graph API ──────────────────────
async function postReplyToFacebook(commentId, message, pageAccessToken) {
  // POST /{comment-id}/comments  →  replies to that comment as the Page
  const response = await axios.post(
    `${facebookBaseUrl}/${commentId}/comments`,
    { message },
    {
      params: { access_token: pageAccessToken },
      timeout: 10000,
    },
  );
  // Facebook returns { id: "<new-reply-comment-id>" } on success
  return response.data;
}

// ─── Controller: reply to a SINGLE comment ──────────────────────────────────
// Request body: { commentId: string, message: string }
export const replyToComment = async (req, res) => {
  try {
    const { commentId, message } = req.body;
    const userId = req.user._id; // set by your auth middleware

    if (!commentId || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "commentId and message are required.",
      });
    }

    const userDoc = await User.findById(req.user?.id);
    const pageAccessToken = userDoc?.facebookPageToken;
    // console.log("Page token: ", pageAccessToken);

    const result = await postReplyToFacebook(
      commentId,
      message.trim(),
      pageAccessToken,
    );

    return res.status(200).json({
      success: true,
      message: "Reply posted successfully.",
      data: {
        commentId,
        replyId: result.id, // the new reply's comment ID from Facebook
      },
    });
  } catch (err) {
    console.error(
      "[replyToComment] Error:",
      err?.response?.data || err.message,
    );

    // Surface Facebook's own error message when available
    const fbError = err?.response?.data?.error;
    return res.status(fbError ? 400 : 500).json({
      success: false,
      message: fbError?.message || err.message || "Failed to post reply.",
      fbErrorCode: fbError?.code,
    });
  }
};

// ─── Controller: reply to MULTIPLE comments (bulk) ──────────────────────────
// Request body:
//   { replies: [{ commentId: string, message: string }, ...] }
//
// Each item can have its own message, which lets you later swap in
// AI-generated replies per comment without changing this endpoint.
//
// Returns a per-comment success/failure breakdown so the UI can reflect
// partial failures (e.g. one comment was deleted by the user).
export const bulkReplyToComments = async (req, res) => {
  try {
    const { replies } = req.body; // [{ commentId, message }]
    // const userId = req.user._id;

    if (!Array.isArray(replies) || replies.length === 0) {
      return res.status(400).json({
        success: false,
        message: "replies array is required and must not be empty.",
      });
    }

    // Validate all entries before hitting Facebook
    const invalid = replies.filter((r) => !r.commentId || !r.message?.trim());
    if (invalid.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Each reply must have commentId and message.",
        invalidCount: invalid.length,
      });
    }

    const userDoc = await User.findById(req.user?.id);
    const pageAccessToken = userDoc?.facebookPageToken;
    // Process sequentially to avoid rate limiting.
    // When you add AI replies later, you can still call this same endpoint
    // with all AI-generated messages pre-filled in the replies array.
    const results = [];
    for (const { commentId, message } of replies) {
      try {
        const data = await postReplyToFacebook(
          commentId,
          message.trim(),
          pageAccessToken,
        );
        results.push({
          commentId,
          success: true,
          replyId: data.id,
        });
      } catch (err) {
        const fbError = err?.response?.data?.error;
        results.push({
          commentId,
          success: false,
          error: fbError?.message || err.message,
          fbErrorCode: fbError?.code,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    return res.status(200).json({
      success: true,
      summary: {
        total: results.length,
        succeeded: successCount,
        failed: failCount,
      },
      results,
    });
  } catch (err) {
    console.error(
      "[bulkReplyToComments] Error:",
      err?.response?.data || err.message,
    );
    return res.status(500).json({
      success: false,
      message: err.message || "Bulk reply failed.",
    });
  }
};

// ─── Controller: update (edit) a comment ────────────────────────────────────
// Request body: { commentId: string, message: string }
export const updateComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const { message } = req.body;

    if (!commentId || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "commentId and message are required.",
      });
    }

    const userDoc = await User.findById(req.user?.id);
    const pageAccessToken = userDoc?.facebookPageToken;

    // POST /{comment-id}  with message field updates the comment text
    const response = await axios.post(
      `${facebookBaseUrl}/${commentId}`,
      { message: message.trim() },
      {
        params: { access_token: pageAccessToken },
        timeout: 10000,
      },
    );

    // Facebook returns { success: true } on a successful update
    return res.status(200).json({
      success: true,
      message: "Comment updated successfully.",
      data: { commentId, updated: response.data.success },
    });
  } catch (err) {
    console.error("[updateComment] Error:", err?.response?.data || err.message);
    const fbError = err?.response?.data?.error;
    return res.status(fbError ? 400 : 500).json({
      success: false,
      message: fbError?.message || err.message || "Failed to update comment.",
      fbErrorCode: fbError?.code,
    });
  }
};

// ─── Controller: delete a comment ───────────────────────────────────────────
// Request body: { commentId: string }
export const deleteComment = async (req, res) => {
  try {
    const commentId = req.params.id;

    if (!commentId) {
      return res.status(400).json({
        success: false,
        message: "commentId is required.",
      });
    }

    const userDoc = await User.findById(req.user?.id);
    const pageAccessToken = userDoc?.facebookPageToken;

    // DELETE /{comment-id}  removes the comment
    const response = await axios.delete(`${facebookBaseUrl}/${commentId}`, {
      params: { access_token: pageAccessToken },
      timeout: 10000,
    });

    // Facebook returns { success: true } on a successful delete
    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully.",
      data: { commentId, deleted: response.data.success },
    });
  } catch (err) {
    console.error("[deleteComment] Error:", err?.response?.data || err.message);
    const fbError = err?.response?.data?.error;
    return res.status(fbError ? 400 : 500).json({
      success: false,
      message: fbError?.message || err.message || "Failed to delete comment.",
      fbErrorCode: fbError?.code,
    });
  }
};

// ─── Controller: delete a post ──────────────────────────────────────────────
// DELETE /api/v1/facebook/posts/:postId
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!postId) {
      return res
        .status(400)
        .json({ success: false, message: "postId is required." });
    }

    const userDoc = await User.findById(req.user?.id);
    const pageAccessToken = userDoc?.facebookPageToken;

    if (!pageAccessToken) {
      return res
        .status(400)
        .json({ success: false, message: "Facebook integration not active." });
    }

    const response = await axios.delete(`${facebookBaseUrl}/${postId}`, {
      params: { access_token: pageAccessToken },
      timeout: 10000,
    });

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully.",
      data: { postId, deleted: response.data.success },
    });
  } catch (err) {
    console.error("[deletePost] Error:", err?.response?.data || err.message);
    const fbError = err?.response?.data?.error;
    return res.status(fbError ? 400 : 500).json({
      success: false,
      message: fbError?.message || err.message || "Failed to delete post.",
      fbErrorCode: fbError?.code,
    });
  }
};

// ─── Controller: create a post ───────────────────────────────────────────────
// POST /api/v1/facebook/posts/create
// Body: { message, link?, attached_media?, scheduled_publish_time? }
//   attached_media: [{ media_fbid: string }]  (IDs from the Page's photo/video uploads)
//   scheduled_publish_time: Unix timestamp (seconds) — omit to publish immediately
// export const createPost = async (req, res) => {
//   try {
//     const { message, link, attached_media, scheduled_publish_time } = req.body;

//     if (!message?.trim() && !attached_media?.length && !link) {
//       return res.status(400).json({
//         success: false,
//         message: "At least one of message, link, or attached_media is required.",
//       });
//     }

//     const userDoc = await User.findById(req.user?.id);
//     if (!userDoc?.facebookPageId || !userDoc?.facebookPageToken) {
//       return res.status(400).json({ success: false, message: "Facebook integration not active." });
//     }

//     const { facebookPageId, facebookPageToken } = userDoc;

//     const payload = {};
//     if (message?.trim()) payload.message = message.trim();
//     if (link) payload.link = link;
//     if (Array.isArray(attached_media) && attached_media.length > 0) {
//       payload.attached_media = attached_media;
//     }

//     const isScheduled = !!scheduled_publish_time;
//     if (isScheduled) {
//       payload.published = false;
//       payload.scheduled_publish_time = scheduled_publish_time;
//     }

//     const response = await axios.post(
//       `${facebookBaseUrl}/${facebookPageId}/feed`,
//       payload,
//       {
//         params: { access_token: facebookPageToken },
//         timeout: 15000,
//       },
//     );

//     return res.status(201).json({
//       success: true,
//       message: isScheduled ? "Post scheduled successfully." : "Post published successfully.",
//       data: { postId: response.data.id },
//     });
//   } catch (err) {
//     console.error("[createPost] Error:", err?.response?.data || err.message);
//     const fbError = err?.response?.data?.error;
//     return res.status(fbError ? 400 : 500).json({
//       success: false,
//       message: fbError?.message || err.message || "Failed to create post.",
//       fbErrorCode: fbError?.code,
//     });
//   }
// };
export const createPost = async (req, res) => {
  try {
    const { message, link, attached_media, scheduled_publish_time } = req.body;

    console.log("req.body: ", req.body);

    if (!message?.trim() && !attached_media?.length && !link) {
      return res.status(400).json({
        success: false,
        message:
          "At least one of message, link, or attached_media is required.",
      });
    }

    const userDoc = await User.findById(req.user?.id);
    if (!userDoc?.facebookPageId || !userDoc?.facebookPageToken) {
      return res
        .status(400)
        .json({ success: false, message: "Facebook integration not active." });
    }

    const { facebookPageId, facebookPageToken } = userDoc;
    const isScheduled = !!scheduled_publish_time;

    // --- STEP 1: UPLOAD PHOTOS FIRST (IF ANY) ---
    let facebookMediaIds = [];

    if (Array.isArray(attached_media) && attached_media.length > 0) {
      // attached_media should be an array of image URLs coming from your frontend/client request
      const uploadPromises = attached_media.map(async (imageUrl) => {
        const photoResponse = await axios.post(
          `${facebookBaseUrl}/${facebookPageId}/photos`,
          {
            url: imageUrl,
            published: false, // Critically important: do not publish standalone
            temporary: isScheduled, // Required by Meta if you are planning to schedule the final feed post
          },
          {
            params: { access_token: facebookPageToken },
          },
        );
        // The endpoint returns { id: "xxxxxxxxx" }
        return { media_fbid: photoResponse.data.id }; // Format exactly as Facebook expects for attached_media
      });

      // Execute all image uploads in parallel
      facebookMediaIds = await Promise.all(uploadPromises);
    }

    // --- STEP 2: ASSEMBLE THE FEED PAYLOAD ---
    const payload = {};
    if (message?.trim()) payload.message = message.trim();
    if (link) payload.link = link;

    // Inject the real Facebook Photo IDs into the payload
    if (facebookMediaIds.length > 0) {
      payload.attached_media = facebookMediaIds;
    }

    if (isScheduled) {
      payload.published = false;
      payload.scheduled_publish_time = scheduled_publish_time;
    }

    // --- STEP 3: CREATE/SCHEDULE THE TIMELINE POST ---
    const response = await axios.post(
      `${facebookBaseUrl}/${facebookPageId}/feed`,
      payload,
      {
        params: { access_token: facebookPageToken },
        timeout: 15000,
      },
    );

    return res.status(201).json({
      success: true,
      message: isScheduled
        ? "Post scheduled successfully."
        : "Post published successfully.",
      data: { postId: response.data.id },
    });
  } catch (err) {
    console.error("[createPost] Error:", err?.response?.data || err.message);
    const fbError = err?.response?.data?.error;
    return res.status(fbError ? 400 : 500).json({
      success: false,
      message: fbError?.message || err.message || "Failed to create post.",
      fbErrorCode: fbError?.code,
    });
  }
};
