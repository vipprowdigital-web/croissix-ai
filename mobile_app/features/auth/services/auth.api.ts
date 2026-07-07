// mobile_app\features\auth\services\auth.api.ts

import { API } from "@/lib/axiosClient";

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  // Added business details
  businessName: string;
  employeeCount: number;
  city: string;
  state: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface ResetPasswordPayload {
  resetToken: string;
  password: string;
}

export const registerUser = async (data: RegisterPayload) => {
  const res = await API.post("/auth/register", data);
  return res.data;
};

export const loginUser = async (data: LoginPayload) => {
  const res = await API.post("/auth/login", data);
  return res.data;
};

export const logoutUser = async () => {
  const res = await API.post("/auth/logout");
  return res.data;
};

export const forgotPassword = async (data: ForgotPasswordPayload) => {
  const res = await API.post("/auth/forgot-password", data);
  return res.data;
};

export const verifyOtp = async (data: VerifyOtpPayload) => {
  const res = await API.post("/auth/verify-otp", data);
  return res.data;
};

export const resetPassword = async (data: ResetPasswordPayload) => {
  const res = await API.post("/auth/reset-password", data);
  return res.data;
};
