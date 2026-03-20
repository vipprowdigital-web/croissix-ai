// backend\src\middleware\planMiddleware.js

export const checkPostLimit = async (req, res, next) => {
  const limits = {
    starter: 5,
    pro: 20,
    agency: 100,
  };

  const userPlan = req.user.plan || "starter";

  const todayPosts = 3; // 🔥 fetch from DB (your logic)

  if (todayPosts >= limits[userPlan]) {
    return res.status(403).json({
      message: "Daily post limit reached",
    });
  }

  next();
};
