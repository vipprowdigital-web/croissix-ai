// mobile_app\features\subscription\hook\useSubscription.ts

"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMySubscription } from "../services/subscription.api";

export const useSubscription = () => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["subscription"],
    // queryFn: fetchMySubscription,
    queryFn: async () => {
      try {
        const result = await fetchMySubscription();
        console.log("✅ fetchMySubscription result:", result);
        return result;
      } catch (err) {
        console.error("❌ fetchMySubscription error:", err);
        throw err;
      }
    },
    // staleTime: 1000 * 60 * 5, // 5 min
    staleTime: 0, // ✅ Always consider stale — refetches on mount
    gcTime: 1000 * 60 * 5,
    retry: 1,
  });

  const subscription = query.data;

  const isActive =
    subscription?.status === "active" &&
    (!subscription?.currentEnd ||
      new Date(subscription.currentEnd) > new Date());

  const isExpired =
    subscription?.currentEnd && new Date(subscription.currentEnd) < new Date();

  const refetchSubscription = async () => {
    await queryClient.invalidateQueries({ queryKey: ["subscription"] });
    await query.refetch();
  };

  console.log("subscription raw:", subscription);
  console.log("subscription status:", subscription?.status);
  console.log("subscription currentEnd:", subscription?.currentEnd);
  console.log("isActive:", isActive);

  return {
    ...query,
    subscription,
    isActive,
    isExpired,
    refetchSubscription,
  };
};
