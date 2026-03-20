// backend\src\middleware\subscriptionMiddleware.js

export const requireSubscription = (req, res, next) => {
  if (req.user.subscriptionStatus !== "active") {
    return res.status(403).json({
      message: "Active subscription required",
    });
  }

  if (req.user.expiresAt && new Date(req.user.expiresAt) < new Date()) {
    return res.status(403).json({
      message: "Subscription expired",
    });
  }

  next();
};
