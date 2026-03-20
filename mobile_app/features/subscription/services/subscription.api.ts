// mobile_app\features\subscription\services\subscription.api.ts

import { API } from "@/lib/axiosClient";
import { getAuthHeader } from "@/lib/token";

/* =========================================
   GET MY SUBSCRIPTION
========================================= */
export const fetchMySubscription = async () => {
  const res = await API.get("/subscription/me", {
    headers: { Authorization: getAuthHeader() },
  });
  return res.data;
};

/* =========================================
   CREATE SUBSCRIPTION
========================================= */
export const createSubscriptionApi = async (planId: string) => {
  const res = await API.post(
    "/subscription/create",
    { planId },
    {
      headers: { Authorization: getAuthHeader() },
    },
  );
  return res.data;
};

/* =========================================
   VERIFY SUBSCRIPTION
========================================= */
export const verifySubscriptionApi = async (payload: {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
  planId: string;
}) => {
  const res = await API.post("/subscription/verify", payload, {
    headers: { Authorization: getAuthHeader() },
  });
  return res.data;
};

/* =========================================
   CANCEL SUBSCRIPTION
========================================= */
export const cancelSubscriptionApi = async (subscriptionId: string) => {
  const res = await API.post(
    `/subscription/cancel/${subscriptionId}`,
    {},
    {
      headers: { Authorization: getAuthHeader() },
    },
  );
  return res.data;
};
