import User from "../models/user.model.js";
import axios from "axios";

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

export const getPageFeedPerformance = async (req, res) => {
  try {
    // 1. Get the authenticated User ID from your middleware
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

    // 3. Construct the Meta Graph API request URL and parameters
    // const metaUrl = `https://graph.facebook.com/v25.0/${facebookPageId}/feed`;

    // console.log(`Fetching Meta Feed for Page ID: ${facebookPageId}`);

    // const metaResponse = await axios.get(metaUrl, {
    //   params: {
    //     fields: [
    //       "id",
    //       "message",
    //       "status_type",
    //       "created_time",
    //       "attachments{media,type,url}",
    //       "likes.summary(true)",
    //       "comments.summary(true)",
    //       "shares",
    //       "insights.metric(post_impressions_unique,post_impressions){values}",
    //     ].join(","),
    //     limit: 10,
    //     access_token: facebookPageToken,
    //   },
    // });

    // console.log("Raw Meta API Response:", metaResponse.data.data);

    // const rawPosts = metaResponse.data.data || [];

    // const formattedPosts = rawPosts.map((post) => {
    //   // 1. Extract core surface counts
    //   const likesCount = post.likes?.summary?.total_count || 0;
    //   const commentsCount = post.comments?.summary?.total_count || 0;
    //   const sharesCount = post.shares?.count || 0;
    //   const totalEngagements = likesCount + commentsCount + sharesCount;

    //   // 2. Extract deep analytics metrics from Meta insights array
    //   const reachValue =
    //     post.insights?.data?.find((i) => i.name === "post_impressions_unique")
    //       ?.values?.[0]?.value || 0;
    //   const impressionsValue =
    //     post.insights?.data?.find((i) => i.name === "post_impressions")
    //       ?.values?.[0]?.value || 0;

    //   // 3. Compute Engagement Rate (ER %) safely
    //   const engagementRate =
    //     impressionsValue > 0
    //       ? ((totalEngagements / impressionsValue) * 100).toFixed(2)
    //       : "0.00";

    //   // 4. Determine Post Type clean labels
    //   let postType = "Text";
    //   if (post.attachments?.data?.[0]?.type?.includes("video"))
    //     postType = "Video";
    //   else if (post.attachments?.data?.[0]?.type?.includes("photo"))
    //     postType = "Image";
    //   else if (post.attachments?.data?.[0]?.type?.includes("share"))
    //     postType = "Link";

    //   const formattedDate = new Date(post.created_time).toLocaleDateString(
    //     "en-US",
    //     {
    //       month: "short",
    //       day: "numeric",
    //       year: "numeric",
    //     },
    //   );

    //   return {
    //     id: post.id,
    //     title:
    //       post.message || "Media asset shared without timeline status copy.",
    //     dateString: formattedDate,
    //     contentType: postType,
    //     mediaUrl: post.attachments?.data?.[0]?.media?.image?.src || null,
    //     targetUrl: post.attachments?.data?.[0]?.url || null,
    //     metrics: {
    //       likes: likesCount.toLocaleString(),
    //       comments: commentsCount.toLocaleString(),
    //       shares: sharesCount.toLocaleString(),
    //       reach: reachValue.toLocaleString(),
    //       impressions: impressionsValue.toLocaleString(),
    //       engagementRate: `${engagementRate}%`,
    //     },
    //   };
    // });

    // 5. Respond with clean layout fields

    // 1. Fetch Timeline Feed using core nodes ONLY (This stops the Error 100 crash completely!)
    const feedUrl = `https://graph.facebook.com/v25.0/${facebookPageId}/feed`;
    const feedResponse = await axios.get(feedUrl, {
      params: {
        fields:
          "id,message,status_type,created_time,attachments{media,type,url},likes.summary(true),comments.summary(true),shares",
        limit: 10,
        access_token: facebookPageToken,
      },
    });

    const rawPosts = feedResponse.data.data || [];

    // 2. Fetch Aggregated Page Insights separately for your high-level overview metrics
    const insightsUrl = `https://graph.facebook.com/v25.0/${facebookPageId}/insights`;
    let pageImpressions = "0";
    let pageEngagement = "0";

    try {
      const insightsResponse = await axios.get(insightsUrl, {
        params: {
          metric: "page_impressions,page_post_engagements",
          period: "days_28", // Look at the last 28 days of growth
          access_token: facebookPageToken,
        },
      });

      const dataMetrics = insightsResponse.data.data || [];
      pageImpressions =
        dataMetrics
          .find((m) => m.name === "page_impressions")
          ?.values?.[0]?.value?.toLocaleString() || "0";
      pageEngagement =
        dataMetrics
          .find((m) => m.name === "page_post_engagements")
          ?.values?.[0]?.value?.toLocaleString() || "0";
    } catch (insightErr) {
      console.warn(
        "Non-blocking warning: Page-level insights skipped or restricted:",
        insightErr.message,
      );
    }

    // 3. Format timeline post blocks safely
    const formattedPosts = rawPosts.map((post) => {
      const likesCount = post.likes?.summary?.total_count || 0;
      const commentsCount = post.comments?.summary?.total_count || 0;
      const sharesCount = post.shares?.count || 0;
      const combinedEngagements = likesCount + commentsCount + sharesCount;

      let postType = "Text";
      if (post.attachments?.data?.[0]?.type?.includes("video"))
        postType = "Video";
      else if (post.attachments?.data?.[0]?.type?.includes("photo"))
        postType = "Image";
      else if (post.attachments?.data?.[0]?.type?.includes("share"))
        postType = "Link";

      const formattedDate = new Date(post.created_time).toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        },
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
          reach: "Organic", // Set a clean fallback layout label string since post-level insights are mixed content types
          impressions: "Active",
          engagementRate:
            combinedEngagements > 0
              ? `${combinedEngagements} interactions`
              : "No interactions",
        },
      };
    });

    return res.status(200).json({
      success: true,
      pageOverview: {
        totalImpressions: pageImpressions,
        totalEngagements: pageEngagement,
      },
      posts: formattedPosts,
    });

    // return res.status(200).json({
    //   success: true,
    //   posts: formattedPosts,
    // });
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
