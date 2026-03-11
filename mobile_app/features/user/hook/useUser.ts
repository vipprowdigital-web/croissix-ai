// mobile_app\features\user\hook\useUser.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { fetchUserProfile } from "../services/user.api";
import { setUser } from "@/redux/slices/userSlice";
import { User } from "@/types/user";
import { getToken } from "@/lib/token";

export const useUser = () => {
  const dispatch = useDispatch();
  const token = getToken();

  const query = useQuery<User>({
    queryKey: ["user-profile"],
    queryFn: fetchUserProfile,
    staleTime: Infinity,
    enabled: !!token, // 🔥 prevent request when logged out
    retry: false,
  });

  useEffect(() => {
    if (query.data) {
      dispatch(setUser(query.data));
    }
  }, [query.data, dispatch]);

  return query;
};
