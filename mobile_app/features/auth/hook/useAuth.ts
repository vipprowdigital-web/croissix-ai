// mobile_app\features\auth\hook\useAuth.ts

"use client";

import { useMutation } from "@tanstack/react-query";
import {
  forgotPassword,
  loginUser,
  logoutUser,
  registerUser,
  resetPassword,
  verifyOtp,
} from "../services/auth.api";
import { useDispatch } from "react-redux";
import { clearUser, setUser } from "@/redux/slices/userSlice";

export const useRegister = () => {
  return useMutation({
    mutationFn: registerUser,
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: forgotPassword,
  });
};

export const useVerifyOtp = () => {
  return useMutation({
    mutationFn: verifyOtp,
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: resetPassword,
  });
};

export const useLogin = () => {
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: loginUser,

    onSuccess: (data) => {
      if (!data?.accessToken) return;

      // clear previous session
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("lastExternalReferrer");
      localStorage.removeItem("lastExternalReferrerTime");
      localStorage.removeItem("topicsLastReferenceTime");

      // store tokens
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);

      // store user
      if (data.user) {
        dispatch(setUser(data.user));
      }
    },
  });
};

export const useLogout = () => {
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: logoutUser,

    onSuccess: () => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("lastExternalReferrer");
      localStorage.removeItem("lastExternalReferrerTime");
      localStorage.removeItem("topicsLastReferenceTime");

      sessionStorage.clear();

      dispatch(clearUser());

      window.location.href = "/login";
    },

    onError: () => {
      // fallback cleanup
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/login";
    },
  });
};
