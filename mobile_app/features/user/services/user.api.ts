// mobile_app\features\user\services\user.api.ts

import { API } from "@/lib/axiosClient";
import { User } from "@/types/user";

export const fetchUserProfile = async (): Promise<User> => {
  const res = await API.get("/users/profile/view");
  return res.data.user;
};

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  avatar?: File;
  businessName?: string;
  employeeCount?: number;
  city?: string;
  state?: string;
}

export const updateUserProfile = async (
  data: UpdateProfilePayload,
): Promise<User> => {
  const formData = new FormData();
  if (data.name) formData.append("name", data.name);
  if (data.phone) formData.append("phone", data.phone);
  if (data.avatar) formData.append("avatar", data.avatar);
  if (data.businessName) formData.append("businessName", data.businessName);
  if (data.employeeCount !== undefined)
    formData.append("employeeCount", String(data.employeeCount));
  if (data.city) formData.append("city", data.city);
  if (data.state) formData.append("state", data.state);

  const res = await API.patch("/users/profile/update", formData);
  return res.data.data;
};
