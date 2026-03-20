// mobile_app\features\subscription\hook\useSubscription.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMySubscription } from "../services/subscription.api";

export const useSubscription = () => {
  const query = useQuery({
    queryKey: ["subscription"],
    queryFn: fetchMySubscription,
    staleTime: 1000 * 60 * 5, // 5 min
    retry: false,
  });

  const subscription = query.data;

  const isActive =
    subscription?.status === "active" &&
    (!subscription?.currentEnd ||
      new Date(subscription.currentEnd) > new Date());

  const isExpired =
    subscription?.currentEnd && new Date(subscription.currentEnd) < new Date();

  return {
    ...query,
    subscription,
    isActive,
    isExpired,
  };
};
