// mobile_app\features\subscription\hook\useSubscriptionActions.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createSubscriptionApi,
  verifySubscriptionApi,
  cancelSubscriptionApi,
} from "../services/subscription.api";

export const useSubscriptionActions = () => {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: createSubscriptionApi,
  });

  const verify = useMutation({
    mutationFn: verifySubscriptionApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });

  const cancel = useMutation({
    mutationFn: cancelSubscriptionApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });

  return {
    createSubscription: create.mutateAsync,
    verifySubscription: verify.mutateAsync,
    cancelSubscription: cancel.mutateAsync,

    loading: create.isPending || verify.isPending || cancel.isPending,
  };
};
