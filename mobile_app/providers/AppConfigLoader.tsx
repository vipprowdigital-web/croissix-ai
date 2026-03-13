"use client";

import { useAppConfig } from "@/features/app-config/hook/useAppConfig";
import { setAppConfig } from "@/redux/slices/appConfigSlice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

export default function AppConfigLoader() {
  const dispatch = useDispatch();
  const { data } = useAppConfig();

  useEffect(() => {
    if (data) {
      dispatch(setAppConfig(data));
    }
  }, [data, dispatch]);

  return null;
}
